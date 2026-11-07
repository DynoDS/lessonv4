'use strict';

// A criteria box as wide as its words need, and no wider.
//
// A criteria box used to take whatever width its layout gave it: the 40% side
// of a 60-40 split, the half of a 50-50, the practice template's 4.60in. The
// words then wrapped wherever they happened to land, so "Say what Hindus light"
// ran across the whole card and "at Diwali." sat on a line of its own with half
// a card of white beside it, while the work next to the box went without the
// room. The teacher, shown a Year 3 RE slide both ways (16 October 2026): the
// narrower box "looks way better and there's more space for everything else",
// because its lines fill their cards with hardly any dead space. He judged it by
// that dead space and by the words staying easy to read, not by a size or a
// width, and found number rules for it too hard to hold in mind.
//
// So the box is tried at widths from the one it was given down to the least its
// heading needs, each drawn on a slide nobody sees by the code that draws it for
// real, and it takes the width at which its lines leave the least white at
// their ends. Two limits keep the words readable: the list must still be drawn
// whole, and no step or sticky line may come out under the 20pt a criteria
// panel is read best at from a table (or, for one already under that, any
// smaller than it is at full width). Narrowing is never needed, so it never costs the
// smaller sizes a list may fall to when it has to. A box whose lines already
// fill their cards keeps its width, and the room any box gives back goes to the
// work beside it.

const { lineWidthIn, usableWidth, CORNER_STEP_IN } = require('./content/steps');
const { textWidthEm, RENDER_SAFETY } = require('../../shared/text/comic-glyph-width');

// A line's width in the weight it prints in: the points under a step print in
// ordinary weight, and measured bold they wrap a word earlier than they do.
const widthIn = (text, pt, bold) => (textWidthEm(text, bold !== false) / RENDER_SAFETY) * pt / 72;
const { signalWidth } = require('./signals');
const { withoutRecording } = require('./warnings');
const requireGlobal = require('./require-global');
const { HEADING_NAME } = require('./success-criteria-panel');

const STEP = 0.05;
const READ_BEST_PT = 20;
// The heading prints at 28pt, inside the panel's 0.15in edges.
const LABEL_PT = 28;
const LABEL_FLOOR_PT = 22;
const PANEL_PAD = 0.15;
const LABEL_SPARE = 0.10;
// Narrowing that saves less white than this is not worth moving the work for.
const LEAST_GAIN = 0.03;

const isStepText = (o) => /step-(text|with-points|reference)-/.test(String(o && o.objectName));

// What a criteria side looks like at one width: the smallest step size, how
// much of its cards' line room its words leave white, and the widest heading.
function lookAt(draw, zone) {
  const PptxGenJS = requireGlobal('pptxgenjs');
  const dry = new PptxGenJS();
  const page = dry.addSlide();
  const texts = [];
  const labels = [];
  const probe = new Proxy(page, {
    get(target, prop) {
      if (prop === 'addText') return (content, opts) => {
        if (isStepText(opts)) texts.push({ content, opts });
        // The heading by its name: beside the draw-live easel it may be drawn
        // smaller than 28pt, and it is measured at 28pt below whatever it printed at.
        else if (opts && (opts.objectName === HEADING_NAME || (opts.fontSize === LABEL_PT && opts.bold))) labels.push(String(content));
        return target.addText(content, opts);
      };
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
  try {
    withoutRecording(() => draw(dry, probe, zone));
  } catch (err) {
    return null;
  }
  if (!texts.length) return null;

  let white = 0;
  let room = 0;
  let lonely = 0;
  const sizes = [];
  texts.forEach(({ content, opts }) => {
    let smallest = Infinity;
    const runs = Array.isArray(content) ? content : [{ text: String(content), options: {} }];
    // Paragraphs as the child sees them, each at the size its runs print at.
    const paragraphs = [{ text: '', pt: 0 }];
    runs.forEach((run) => {
      const pt = (run.options && run.options.fontSize) || opts.fontSize;
      String(run.text).split('\n').forEach((piece, i) => {
        if (i > 0) paragraphs.push({ text: '', pt: 0 });
        const last = paragraphs[paragraphs.length - 1];
        last.text += piece;
        if (piece.trim()) last.pt = Math.max(last.pt, pt);
      });
    });
    const width = usableWidth(opts.w);
    // A criteria card's first line steps in for the number on its corner
    // (steps.js), so it holds fewer words than the lines under it.
    const firstStepIn = CORNER_STEP_IN;
    paragraphs.filter((p) => p.text.trim()).forEach((p, at) => {
      smallest = Math.min(smallest, p.pt);
      const wrap = (room) => {
        let line = '';
        const lines = [];
        p.text.split(/\s+/).filter(Boolean).forEach((word) => {
          const candidate = line ? `${line} ${word}` : word;
          const here = at === 0 && lines.length === 0 ? room - firstStepIn : room;
          if (!line || widthIn(candidate, p.pt, p.bold) <= here) line = candidate;
          else { lines.push(line); line = word; }
        });
        if (line) lines.push(line);
        return lines;
      };
      const lines = wrap(width);
      // A word left alone on the last line of a wrapped step ("it.") reads as a
      // mistake, whatever the white around it adds up to. PowerPoint breaks a
      // line a little differently from this measure, so a line that would leave
      // a word alone in a box a few per cent narrower counts as well.
      const alone = (ls) => {
        const last = ls[ls.length - 1] || '';
        return ls.length > 1 && (!/\s/.test(last.trim()) || widthIn(last, p.pt, p.bold) < 0.2 * width);
      };
      if (alone(lines) || alone(wrap(width * 0.95))) lonely += 1;
      // Each line is weighed by its height, so a big step counts for its size.
      lines.forEach((l) => {
        white += Math.max(0, width - widthIn(l, p.pt, p.bold)) * p.pt;
        room += width * p.pt;
      });
    });
    sizes.push(smallest);
  });
  return {
    sizes,
    lonely,
    dead: room > 0 ? white / room : 0,
    count: texts.length,
    label: labels.reduce((w, l) => Math.max(w, lineWidthIn(l, LABEL_PT)), 0)
  };
}

function hasFlipchart(data) {
  if (!data) return false;
  if (data.flipchart) return true;
  return Array.isArray(data.items) && data.items.some((item) => item && item.flipchart);
}

// The width a criteria side takes, from `zone.w` down. `draw(pptx, slide,
// zone)` draws it exactly as the real slide will. Returns the zone's own width
// whenever narrowing would not help.
//
// The box takes the narrowest width at which its words still read well, not
// only the width that leaves the least white. The criteria matter, the teacher
// said of a Year 4 area deck (6 November 2026), "but it's not the thing on the
// slides that needs the most space": the room they do not need goes to the
// work, so the shape, the question and the modelling can be bigger. Once the
// numbers stopped taking a column of their own (steps.js, corner numbers) the
// words had more room than they needed at full width, and the old measure,
// which narrowed only to save white at the line ends, left the box as wide as
// before with bigger words in it.
//
// The same list keeps one width on every slide of the lesson: a box that
// changed size slide to slide was one of his faults (self-respect, Area). The
// layout preflight draws every slide before the real build, so by the real
// pass each list knows the width every slide it is on needs, and takes the
// widest of them, which reads well on all of them.
const LESSON_WIDTHS = new WeakMap();

function listKey(data) {
  const panel = data && data.type === 'stack' ? data.items : [data];
  return JSON.stringify((panel || []).map((p) => {
    const content = p && (p.criteria || p.content);
    return [p && (p.criteriaLabel || p.label), content && content.steps];
  }));
}

function snugCriteriaWidth(zone, data, draw, opts = {}) {
  const own = narrowestReadableWidth(zone, data, draw, opts);
  const ctx = opts.ctx;
  if (!ctx || !ctx.lesson || typeof ctx.lesson !== 'object') return own;
  if (!LESSON_WIDTHS.has(ctx.lesson)) LESSON_WIDTHS.set(ctx.lesson, new Map());
  const widths = LESSON_WIDTHS.get(ctx.lesson);
  const key = listKey(data);
  // A slide whose box cannot narrow at all (its words already need every inch)
  // keeps its own width and sets nobody else's: the others would only grow to
  // match a cramped slide (the teacher agreed, 6 November 2026, that such a
  // slide keeps its own size and the rest do not follow it).
  if (own >= zone.w - 1e-9) return own;
  const shared = Math.max(own, widths.get(key) || 0);
  // A trial (a panel tried at another size) records nothing.
  if (require('./warnings').recording()) widths.set(key, shared);
  return Math.min(zone.w, shared);
}

function narrowestReadableWidth(zone, data, draw, opts) {
  const full = lookAt(draw, zone);
  if (!full || !full.sizes.every(Number.isFinite)) return zone.w;
  const cue = hasFlipchart(data) ? signalWidth('flipchart', 0.58) + 0.20 : 0;
  // The heading goes smaller with the box, down to 22pt, still a size above
  // the steps under it (success-criteria-panel.js draws it to fit its room):
  // at its full 28pt, "Success Criteria" alone needed 4.2in and held every box
  // at the practice panel's 4.60.
  const least = Math.max(opts.least || 0, full.label * LABEL_FLOOR_PT / LABEL_PT + 2 * PANEL_PAD + LABEL_SPARE + cue);
  // Each step and sticky line keeps the 20pt it is read best at, or the size it
  // had at full width when that was already less.
  const floors = full.sizes.map((pt) => Math.min(pt, READ_BEST_PT));

  let best = zone.w;
  for (let w = zone.w - STEP; w >= least - 1e-9; w -= STEP) {
    const seen = lookAt(draw, Object.assign({}, zone, { w }));
    // A width that cannot draw the list, or draws it smaller than it may go,
    // ends the search: nothing narrower does better.
    if (!seen || seen.count !== full.count || seen.sizes.some((pt, i) => pt < floors[i])) break;
    // A width that leaves a word alone on a line ("row." under "Count each
    // square once, row by") is passed over: a narrower one may break the step
    // somewhere better.
    if (seen.lonely > full.lonely) continue;
    best = w;
  }
  return zone.w - best >= LEAST_GAIN ? best : zone.w;
}

// Only lists of steps are narrowed. A table or a figure in the box is measured
// by its own rules, which a narrower box can pass here and the final text fit
// then refuses (a food chain's table of meanings did, 16 October 2026).
const stepsOnly = (panel) => {
  const content = panel && (panel.content || panel.criteria);
  return !!content && content.type === 'steps';
};

function isCriteriaSide(data) {
  if (!data) return false;
  if (data.type === 'sc-panel') return stepsOnly(data);
  return data.type === 'stack' && Array.isArray(data.items) && data.items.length > 0 &&
    data.items.every((item) => item && item.type === 'sc-panel' && stepsOnly(item));
}

// A split's criteria side gives back the width its words do not use, and the
// other side takes it. The criteria keep their outer edge.
function snugSplitCriteria(zoneA, dataA, zoneB, dataB, ctx) {
  const { drawContent } = require('./content');
  const settle = (crit, critData, other) => {
    if (!isCriteriaSide(critData) || isCriteriaSide(other.data)) return;
    const barrier = ctx._cardBarrier;
    const container = ctx._containerType;
    const draw = (pptx, slide, zone) => {
      try {
        drawContent(pptx, slide, zone, critData, ctx);
      } finally {
        ctx._cardBarrier = barrier;
        ctx._containerType = container;
      }
    };
    const w = snugCriteriaWidth(crit, critData, draw, { ctx });
    const spare = crit.w - w;
    if (spare <= 0) return;
    if (crit.x > other.zone.x) crit.x += spare; else other.zone.x -= spare;
    crit.w = w;
    other.zone.w += spare;
  };
  settle(zoneB, dataB, { zone: zoneA, data: dataA });
  settle(zoneA, dataA, { zone: zoneB, data: dataB });
}

module.exports = { snugCriteriaWidth, snugSplitCriteria, lookAt };
