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

const { lineWidthIn, usableWidth } = require('./content/steps');
const { textWidthEm, RENDER_SAFETY } = require('../../shared/text/comic-glyph-width');

// A line's width in the weight it prints in: the points under a step print in
// ordinary weight, and measured bold they wrap a word earlier than they do.
const widthIn = (text, pt, bold) => (textWidthEm(text, bold !== false) / RENDER_SAFETY) * pt / 72;
const { signalWidth } = require('./signals');
const { withoutRecording } = require('./warnings');
const requireGlobal = require('./require-global');

const STEP = 0.05;
const READ_BEST_PT = 20;
// The heading prints at 28pt, inside the panel's 0.15in edges.
const LABEL_PT = 28;
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
        else if (opts && opts.fontSize === LABEL_PT && opts.bold) labels.push(String(content));
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
    paragraphs.filter((p) => p.text.trim()).forEach((p) => {
      smallest = Math.min(smallest, p.pt);
      const wrap = (room) => {
        let line = '';
        const lines = [];
        p.text.split(/\s+/).filter(Boolean).forEach((word) => {
          const candidate = line ? `${line} ${word}` : word;
          if (!line || widthIn(candidate, p.pt, p.bold) <= room) line = candidate;
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
function snugCriteriaWidth(zone, data, draw, opts = {}) {
  const full = lookAt(draw, zone);
  if (!full || !full.sizes.every(Number.isFinite)) return zone.w;
  const cue = hasFlipchart(data) ? signalWidth('flipchart', 0.58) + 0.20 : 0;
  const least = Math.max(opts.least || 0, full.label + 2 * PANEL_PAD + LABEL_SPARE + cue);
  // Each step and sticky line keeps the 20pt it is read best at, or the size it
  // had at full width when that was already less.
  const floors = full.sizes.map((pt) => Math.min(pt, READ_BEST_PT));

  let best = { w: zone.w, dead: full.dead };
  for (let w = zone.w - STEP; w >= least - 1e-9; w -= STEP) {
    const seen = lookAt(draw, Object.assign({}, zone, { w }));
    // A width that cannot draw the list, or draws it smaller than it may go,
    // ends the search: nothing narrower does better.
    if (!seen || seen.count !== full.count || seen.sizes.some((pt, i) => pt < floors[i])) break;
    // A narrower width must leave clearly less white to be worth taking, and
    // may not leave a word alone on a line where the full width did not.
    if (seen.lonely > full.lonely) continue;
    if (seen.dead < best.dead - 0.005) best = { w, dead: seen.dead };
  }
  return full.dead - best.dead >= LEAST_GAIN ? best.w : zone.w;
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
    const w = snugCriteriaWidth(crit, critData, draw);
    const spare = crit.w - w;
    if (spare <= 0) return;
    if (crit.x > other.zone.x) crit.x += spare; else other.zone.x -= spare;
    crit.w = w;
    other.zone.w += spare;
  };
  settle(zoneB, dataB, { zone: zoneA, data: dataA });
  settle(zoneA, dataA, { zone: zoneB, data: dataB });
}

module.exports = { snugCriteriaWidth, snugSplitCriteria };
