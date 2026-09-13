'use strict';

// THE number line. One drawing, placed by the board, the worksheet, the working
// wall and the stick-in pack.
//
// It was four. The board drew PowerPoint shapes, the sheet drew its own SVG, the
// wall drew another in bold Arial with a red dot and "A = 1,800", and the stick-in
// piece a fourth, with its own field names. A Year 4 wall card looked nothing
// like the slides beside it, and every repair (the gap under the numbers, the
// Scale box, the thousands commas) had to be found and made again on each
// surface or it reached one and not the others (13 September 2026). This file is
// the one place a number line is drawn; each surface passes only the box it has
// and its profile (shared/visuals/surface-profiles.js): how big its words must
// print, and whether it is in colour.
//
// Everything is laid out in points at the size it will actually print, so a
// numeral's size is a real size on every surface and the readable floor means
// the same thing on a slide as on a sheet.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//   normalise(spec)         -> the lines, in the one spec vocabulary
//
// ─── the spec ────────────────────────────────────────────────────────────
//
// One line, or `lines: [...]` (up to three, named A, B, C down the left unless
// `lineLabels: false`; `lineLabel` names one line). Each line:
//
//   start, end, interval   the scale (numbers)
//   labels                 "ends" (default) | "all" | [values or { at, text }]
//   majorInterval          tall ticks, labelled, every this many
//   wholeTick              a value or values that take a tall tick
//   arrow / arrows         { at, label } pointing at a place; `answerBox: true`
//                          puts a box to write in above the arrow instead
//   answer                 { at, text } (or an array): a green dot and its value
//   boxes                  [values]: an answer box above each of those ticks
//   jumps, highlight       the move along the spaces, and a shaded space
//                          (meaning owned by number-line-jumps.js)
//   caption                a sentence under the line, or with a blank in it
//                          ("Scale: ___") an answer box with its words
//   unit, object           a ruler's unit at the end, and the bracket it measures
//   writeBelow             a band under the numbers for the child to write in
//
// The stick-in pack's older index vocabulary ({ start: "0", end: "10",
// intervals, tickLabels, arrows: [{ index, label }] }) and the wall's
// ({ from, to, step, marks }) are read here too, so no surface has to be taught
// a new spelling before it can draw the shared line.

const jumpsGeo = require('./number-line-jumps');
const { textWidthEm } = require('../text/comic-glyph-width');
const { profileFor } = require('./surface-profiles');

// ─── CONSTANTS (in ems of the profile's font size) ──────────────────────────
// Taken from the board's line, which had been tuned for a room: tick 0.38in and
// label gap 0.08in at 24pt numerals.
const AXIS_W = 0.12;
const TICK_H = 1.14;
const TALL_TICK_H = 1.8;
const TICK_W = 0.15;
const LABEL_GAP = 0.24;
const BAND = 1.3; // one line of text, with its leading
const ARROW_STEM = 1.08;
const ARROW_STEM_MIN = 0.69;
const ARROW_HEAD_W = 0.58;
const ARROW_HEAD_H = 0.58;
const ARROW_GAP = 0.12; // clear air between the arrow tip and the axis
const DOT_R = 0.375;
const ANSWER_GAP = 0.25;
const ROW_GAP = 0.6;
const MAX_ROW_GAP = 3.25;
const NAME_GAP = 0.54;
const JUMP_TIER = 1.38;
const JUMP_GAP = 0.09;
const JUMP_HEAD = 0.57;
const JUMP_STROKE = 0.125;
const HIGHLIGHT_BAR = 0.39;
const HIGHLIGHT_WASH = 0.22;
const LABEL_GUTTER = 0.25;
const BOX = 2.6; // an answer box a child writes a four-digit number in
const BOX_GAP = 0.45;
const SLOT_H = 1.9;
const SLOT_W = 7.2;
const SLOT_GAP = 0.3;
const WRITE_BAND = 2.6;
const OBJECT_BAR = 0.3;
const OBJECT_GAP = 0.4;
const PAD = 0.2;
const MAX_LINES = 3;
const LINE_NAMES = ['A', 'B', 'C'];
const CAPTION_BLANK = /_{2,}/;
// ────────────────────────────────────────────────────────────────────────────

function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function f2(n) {
  return Math.round(n * 100) / 100;
}

// Year 4 place value is taught WITH the comma, and the question beside the line
// uses it. Decimals and values under a thousand are left alone.
function formatValue(v) {
  if (!isNum(v)) return String(v);
  if (!Number.isInteger(v) || Math.abs(v) < 1000) return String(v);
  const digits = String(Math.abs(v));
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += ',';
    out += digits[i];
  }
  return (v < 0 ? '-' : '') + out;
}

// ─── reading every surface's spelling into one ──────────────────────────────

function fromStickIn(line) {
  // { start: "0", end: "10", intervals, tickLabels: [{ index, text, given }],
  //   arrows: [{ index, label }], startBlank, endBlank, questionState }
  const n = line.intervals;
  const labels = [];
  if (!line.startBlank) labels.push({ at: 0, text: String(line.start) });
  const question = line.questionState !== false;
  (line.tickLabels || []).forEach((t) => {
    if (!question || t.given === true) labels.push({ at: t.index, text: String(t.text) });
  });
  if (!line.endBlank) labels.push({ at: n, text: String(line.end) });
  const out = {
    start: 0,
    end: n,
    interval: 1,
    labels: labels.length ? labels : [],
    arrows: (line.arrows || []).map((a) => ({ at: a.index, label: a.label })),
    writeBelow: true,
  };
  ['jumps', 'highlight', 'caption', 'showTicks'].forEach((k) => {
    if (line[k] != null) out[k] = line[k];
  });
  if (line.jumps) out.jumps = line.jumps.map((j) => ({ ...j, from: j.from, to: j.to }));
  return out;
}

function fromWall(line) {
  // { from, to, step, marks: [{ at, label }], jumps, highlight }
  const out = {
    start: Number(line.from) || 0,
    end: Number(line.to) || 10,
    interval: Number(line.step) || 1,
    labels: 'all',
  };
  const marks = Array.isArray(line.marks) ? line.marks.filter((m) => m && m.at != null) : [];
  if (marks.length) out.answer = marks.map((m) => ({ at: Number(m.at), text: m.label || '' }));
  ['jumps', 'highlight', 'caption'].forEach((k) => {
    if (line[k] != null) out[k] = line[k];
  });
  return out;
}

function canonicalLine(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('NUMBERLINE_INVALID: a number line is an object.');
  if (raw.intervals != null && !isNum(raw.interval)) {
    if (!Number.isInteger(raw.intervals) || raw.intervals < 1 || raw.intervals > 100) {
      throw new Error('NUMBERLINE_INVALID: intervals must be a whole number from 1 to 100.');
    }
    ['start', 'end'].forEach((f) => {
      if (!raw[`${f}Blank`] && (raw[f] == null || !String(raw[f]).trim())) {
        throw new Error(`NUMBERLINE_INVALID: the line needs its ${f} label, or ${f}Blank: true when the child writes it.`);
      }
    });
    return fromStickIn(raw);
  }
  if (raw.from != null && raw.start == null && raw.step != null) return fromWall(raw);
  if (raw.from != null && raw.start == null && raw.to != null) return fromWall(raw);
  return raw;
}

function asList(v) {
  if (v == null || v === false) return [];
  return Array.isArray(v) ? v : [v];
}

function normalise(spec = {}) {
  const given = Array.isArray(spec.lines) ? spec.lines : [spec];
  if (given.length > MAX_LINES) {
    throw new Error(
      `NUMBERLINE_TOO_MANY_LINES: ${given.length} stacked lines were asked for and ${MAX_LINES} is the most a number line may carry. ` +
        'Every extra line is paid for out of the size of the numerals on all of them. Split these across two, or drop the lines this question does not compare.'
    );
  }
  return given.map((rawLine, i) => {
    const raw = canonicalLine(rawLine);
    const where = given.length > 1 ? `line ${LINE_NAMES[i]}` : 'this number line';
    const start = isNum(raw.start) ? raw.start : 0;
    const end = isNum(raw.end) ? raw.end : 10;
    const interval = isNum(raw.interval) && raw.interval > 0 ? raw.interval : 1;
    if (!(end > start)) throw new Error(`NUMBERLINE_INVALID: ${where} must end after it starts.`);
    const count = Math.round((end - start) / interval);
    if (count < 1 || count > 100) throw new Error(`NUMBERLINE_INVALID: ${where} has ${count} intervals; use 1 to 100.`);
    const scale = jumpsGeo.valueLine({ start, end, interval });

    const unit = raw.unit == null ? '' : String(raw.unit);
    if (unit.length > 6) {
      throw new Error(
        `NUMBERLINE_UNIT_TOO_LONG: unit ${JSON.stringify(unit)} is a sentence. \`unit\` is the measuring unit ` +
          'printed at the end of a ruler (cm, g, ml); put a sentence about the line in `caption`.'
      );
    }
    const boxes = asList(raw.boxes).map(Number);
    if (raw.object && boxes.length) {
      throw new Error(
        'NUMBERLINE_OBJECT_CROWDED: an object bracket and answer boxes draw in the same band above the line. ' +
          '`object` is the thing a ruler measures; a sentence about the line goes in `caption`.'
      );
    }

    const arrows = [...asList(raw.arrow), ...asList(raw.arrows)].map((a) => ({
      at: Number(a.at),
      label: a.label == null ? '' : String(a.label),
      answerBox: a.answerBox === true,
    }));
    // A point is a place ON the line. One past either end would be drawn off
    // the drawing, and two arrows at one place or with one letter cannot be told
    // apart, so each is refused by name.
    const onLine = (v, what) => {
      if (!isNum(v) || v < start - 1e-9 || v > end + 1e-9) {
        throw new Error(`NUMBERLINE_POINT_OFF_LINE: ${what} ${JSON.stringify(v)} is not on ${where} (${start} to ${end}).`);
      }
    };
    arrows.forEach((a) => onLine(a.at, 'an arrow at'));
    const lettered = arrows.filter((a) => a.label);
    if (new Set(arrows.map((a) => a.at)).size !== arrows.length || new Set(lettered.map((a) => a.label)).size !== lettered.length) {
      throw new Error(`NUMBERLINE_ARROWS_AMBIGUOUS: two arrows on ${where} share a place or a letter.`);
    }
    boxes.forEach((v) => onLine(v, 'a box at'));
    const answers = asList(raw.answer).map((a) => ({
      at: Number(a.at),
      text: a.text != null ? String(a.text) : formatValue(Number(a.at)),
    }));

    answers.forEach((a) => onLine(a.at, 'an answer at'));
    const jumps = jumpsGeo.resolveJumps(raw, scale);
    jumpsGeo.refuseCrowding(jumps, { arrows, answers, boxes, object: raw.object || null }, ['arrows', 'answers', 'boxes', 'object'], where);
    const highlight = jumpsGeo.resolveIntervalHighlight(raw, scale);

    let labelsIn = raw.labels;
    let tall = asList(raw.wholeTick).map(Number);
    if (isNum(raw.majorInterval)) {
      const majors = [];
      const steps = Math.round((end - start) / raw.majorInterval);
      for (let k = 0; k <= steps; k++) majors.push(Math.round((start + k * raw.majorInterval) * 1e9) / 1e9);
      tall = majors;
      labelsIn = majors;
    }
    let values;
    if (labelsIn == null || labelsIn === 'ends') values = [start, end];
    else if (labelsIn === 'all') {
      values = [];
      for (let k = 0; k <= count; k++) values.push(Math.round((start + k * interval) * 1e9) / 1e9);
    } else if (Array.isArray(labelsIn)) values = labelsIn;
    else values = [];
    const labels = values
      .map((v, k) => {
        const entry = jumpsGeo.labelEntry(v, scale, k);
        return entry ? { at: entry.at, text: entry.text } : { at: Number(v), text: formatValue(v) };
      })
      .sort((a, b) => a.at - b.at);

    const caption = raw.caption == null ? '' : String(raw.caption);
    return {
      start,
      end,
      interval,
      count,
      labels,
      tall,
      arrows,
      answers,
      boxes,
      jumps,
      highlight,
      caption,
      captionSlot: CAPTION_BLANK.test(caption),
      unit,
      object: raw.object || null,
      writeBelow: raw.writeBelow === true,
      showTicks: raw.showTicks !== false,
      name: raw.lineLabel != null ? String(raw.lineLabel) : raw.subLabel != null ? String(raw.subLabel) : null,
    };
  });
}

// ─── layout ─────────────────────────────────────────────────────────────────

function widthPt(text, pt, bold) {
  return textWidthEm(String(text), bold) * pt;
}

// Words above the line at a point (an arrow's letter, an answer's value) are
// each centred on their own mark, and two marks close together used to print as
// one run of text: "3,000A = 3,500" on a Year 4 wall card. Walk them left to
// right and lift a label onto the row above only when it would meet one already
// on its row. Positions are estimated across the full width, which is close
// enough to decide who collides; the drawing then uses the tiers it was given.
function staggerTiers(items, line, widthAcross, pt, bold) {
  const rows = [];
  const tiers = new Map();
  items
    .map((it) => ({ it, x: ((it.at - line.start) / (line.end - line.start)) * widthAcross, w: widthPt(it.text, pt, bold) }))
    .sort((a, b) => a.x - b.x)
    .forEach(({ it, x, w }) => {
      const left = x - w / 2 - LABEL_GUTTER * pt;
      const right = x + w / 2 + LABEL_GUTTER * pt;
      let row = 0;
      while (rows.some((r) => r.row === row && left < r.right && right > r.left)) row += 1;
      rows.push({ row, left, right });
      tiers.set(it, row);
    });
  return tiers;
}

// What a line uses above and below its axis, split into the part that may be
// scaled down (rules, stems, gaps: `el`, in ems) and the text bands that may
// not go under the readable floor (`tx`, in ems at the font size).
function verticalNeeds(line, profile) {
  const across = profile.widthPt * 0.9;
  line._arrowTiers = staggerTiers(line.arrows.filter((a) => !a.answerBox && a.label).map((a) => Object.assign(a, { text: a.label })), line, across, profile.fontPt, profile.bold);
  line._answerTiers = staggerTiers(line.answers.filter((a) => a.text), line, across, profile.fontPt, profile.bold);
  const arrowRows = Math.max(1, ...[...line._arrowTiers.values()].map((t) => t + 1));
  const answerRows = Math.max(1, ...[...line._answerTiers.values()].map((t) => t + 1));
  const tickHalf = (line.tall.length ? TALL_TICK_H : TICK_H) / 2;
  let aboveEl = tickHalf;
  let aboveTx = 0;
  if (line.jumps.length) {
    const tiers = jumpsGeo.tierCount(line.jumps);
    const labelled = line.jumps.some((j) => j.label || j.box);
    aboveEl = Math.max(aboveEl, TICK_H / 2 + JUMP_GAP + tiers * JUMP_TIER);
    aboveTx = Math.max(aboveTx, labelled ? tiers * BAND : 0);
  }
  if (line.arrows.length) {
    const boxed = line.arrows.some((a) => a.answerBox);
    aboveEl = Math.max(aboveEl, ARROW_GAP + ARROW_STEM + ARROW_HEAD_H);
    aboveTx = Math.max(aboveTx, boxed ? BOX + BOX_GAP : BAND * arrowRows);
  }
  if (line.answers.length) {
    aboveEl = Math.max(aboveEl, DOT_R + ANSWER_GAP);
    aboveTx = Math.max(aboveTx, BAND * answerRows);
  }
  if (line.boxes.length) {
    aboveEl = Math.max(aboveEl, tickHalf + BOX_GAP);
    aboveTx = Math.max(aboveTx, BOX);
  }
  if (line.object) {
    aboveEl = Math.max(aboveEl, tickHalf + OBJECT_GAP + OBJECT_BAR);
    aboveTx = Math.max(aboveTx, line.object.label ? BAND : 0);
  }
  const belowEl = tickHalf + LABEL_GAP;
  let belowTx = line.labels.length ? BAND : 0;
  if (line.caption) belowTx += line.captionSlot ? SLOT_GAP + SLOT_H : BAND;
  if (line.writeBelow) belowTx += WRITE_BAND;
  return { aboveEl, aboveTx, belowEl, belowTx };
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
  const lines = normalise(spec);
  const bold = profile.bold;
  const em0 = profile.fontPt;
  const W = profile.widthPt;

  const needs = lines.map((l) => verticalNeeds(l, profile));
  const el = needs.reduce((t, n) => t + n.aboveEl + n.belowEl, 0) + ROW_GAP * (lines.length - 1) + 2 * PAD;
  const tx = needs.reduce((t, n) => t + n.aboveTx + n.belowTx, 0);

  // How big everything is. Paper and the wall draw at their natural size; the
  // board fits a fixed zone, may grow into spare room, and when the zone is
  // shallow gives up rules and gaps before it gives up the numerals.
  let scale = 1;
  let fontPt = em0;
  if (profile.heightPt) {
    scale = Math.min(profile.grow || 1, profile.heightPt / ((el + tx) * em0));
    fontPt = em0 * scale;
    if (fontPt < profile.minFontPt) {
      fontPt = profile.minFontPt;
      scale = Math.min(profile.grow || 1, (profile.heightPt - tx * fontPt) / (el * em0));
      if (!(scale > 0)) {
        throw new Error(
          `NUMBERLINE_ZONE_TOO_SHALLOW: ${lines.length} line${lines.length === 1 ? '' : 's'} cannot show numerals at the ` +
            `${profile.minFontPt}pt readable minimum in a space this shallow. Give the visual more height, or show fewer lines on it; ` +
            'the numerals are what the scale is read from and were not shrunk to fit.'
        );
      }
    }
    if (lines.some((l) => l.arrows.length) && ARROW_STEM * em0 * scale < ARROW_STEM_MIN * profile.minFontPt) {
      throw new Error(
        `NUMBERLINE_ZONE_TOO_SHALLOW: ${lines.length} line${lines.length === 1 ? '' : 's'} with arrows cannot show both a readable scale ` +
          'and an arrow that points in a space this shallow. Give the visual more height, or show fewer lines on it.'
      );
    }
  } else if (profile.minFontPt > fontPt) {
    fontPt = profile.minFontPt;
  }
  const E = em0 * scale; // one elastic em
  const T = fontPt; // one text em

  // Names down the left of a stack.
  const names = lines.map((l, i) => (l.name != null ? l.name : lines.length > 1 && spec.lineLabels !== false ? LINE_NAMES[i] : ''));
  let nameW = 0;
  names.forEach((n) => {
    if (n) nameW = Math.max(nameW, widthPt(n, T * 1.15, true));
  });

  // Horizontal: the axis is inset so the end labels print inside the drawing at
  // full size, and one size serves every numeral on it. A crowded axis shrinks
  // whole, never label by label.
  const unitW = lines.some((l) => l.unit) ? Math.max(...lines.map((l) => (l.unit ? widthPt(l.unit, T, bold) : 0))) + LABEL_GAP * T : 0;
  function inset(pt) {
    let lh = 0;
    let rh = 0;
    lines.forEach((l) => {
      const ends = [l.labels[0], l.labels[l.labels.length - 1]];
      if (ends[0] && ends[0].at === l.start) lh = Math.max(lh, widthPt(ends[0].text, pt, bold) / 2);
      if (ends[1] && ends[1].at === l.end) rh = Math.max(rh, widthPt(ends[1].text, pt, bold) / 2);
      if (l.captionSlot || l.boxes.length || l.arrows.some((a) => a.answerBox)) {
        lh = Math.max(lh, (BOX * T) / 2);
        rh = Math.max(rh, (BOX * T) / 2);
      }
    });
    const left = PAD * T + Math.max(lh, TICK_W * E) + (nameW ? nameW + NAME_GAP * T : 0);
    const right = W - PAD * T - Math.max(rh, TICK_W * E) - unitW;
    return { x1: left, x2: right };
  }
  function crowded(pt) {
    const geo = inset(pt);
    let out = pt;
    lines.forEach((l) => {
      if (l.labels.length < 2) return;
      const xs = l.labels.map((v) => geo.x1 + ((v.at - l.start) / (l.end - l.start)) * (geo.x2 - geo.x1));
      let gap = Infinity;
      for (let k = 1; k < xs.length; k++) gap = Math.min(gap, xs[k] - xs[k - 1]);
      const cap = Math.max(0.3 * pt, gap - LABEL_GUTTER * pt);
      const need = Math.max(...l.labels.map((v) => widthPt(v.text, pt, bold)));
      if (need > cap) out = Math.min(out, (pt * cap) / need);
    });
    return out;
  }
  let labelPt = crowded(T);
  if (labelPt < T) labelPt = Math.min(T, crowded(labelPt));
  labelPt = Math.round(labelPt * 10) / 10;
  const geo = inset(labelPt);
  if (!(geo.x2 - geo.x1 > 4 * T)) {
    throw new Error('NUMBERLINE_TOO_NARROW: there is not room across this space for the line and its numbers. Give the visual more width.');
  }

  // Vertical placement, with any spare depth spread between stacked lines.
  const above = needs.map((n) => n.aboveEl * E + n.aboveTx * T);
  const below = needs.map((n) => n.belowEl * E + n.belowTx * T);
  const inkH = above.reduce((a, b) => a + b, 0) + below.reduce((a, b) => a + b, 0);
  let gap = ROW_GAP * E;
  let top = PAD * E;
  if (profile.heightPt) {
    const used = inkH + gap * (lines.length - 1) + 2 * PAD * E;
    const slack = profile.heightPt - used;
    if (slack > 0 && lines.length > 1) {
      const add = Math.min(slack / (lines.length - 1), (MAX_ROW_GAP - ROW_GAP) * E);
      gap += add;
    }
  }

  const rows = [];
  let cursor = top;
  lines.forEach((l, i) => {
    const y = cursor + above[i];
    const x = (v) => geo.x1 + ((v - l.start) / (l.end - l.start)) * (geo.x2 - geo.x1);
    rows.push({ line: l, y, x, name: names[i], top: cursor, bottom: y + below[i] });
    cursor = y + below[i] + gap;
  });
  const H = cursor - gap + PAD * E;

  return { w: W, h: H, E, T, labelPt, fontPt, scale, geo, rows, profile, nameW };
}

// ─── drawing ────────────────────────────────────────────────────────────────

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { E, T, profile } = L;
  const c = profile.colours;
  const font = profile.font;
  const weight = profile.bold ? ' font-weight="bold"' : '';
  const parts = [];
  // Baseline for a text band whose top is `top`.
  const baseline = (topY, pt) => topY + pt * 0.95;
  const text = (s, xMid, topY, pt, fill, anchor = 'middle') =>
    `<text x="${f2(xMid)}" y="${f2(baseline(topY, pt))}" text-anchor="${anchor}" font-family="${font}" font-size="${f2(pt)}"${weight} fill="${fill}">${esc(s)}</text>`;
  const rect = (x, y, w, h, fill, extra = '') => `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" fill="${fill}"${extra}/>`;
  const boxAt = (xMid, topY, w, h) =>
    `<rect x="${f2(xMid - w / 2)}" y="${f2(topY)}" width="${f2(w)}" height="${f2(h)}" fill="${c.paper}" stroke="${c.ink}" stroke-width="${f2(Math.max(1, TICK_W * E * 0.6))}"/>`;

  L.rows.forEach((row) => {
    const l = row.line;
    const { y, x } = row;
    const x1 = L.geo.x1;
    const x2 = L.geo.x2;
    const tickHalf = ((l.tall.length ? TALL_TICK_H : TICK_H) / 2) * E;
    const shortHalf = (TICK_H / 2) * E;

    if (row.name) {
      parts.push(text(row.name, x1 - NAME_GAP * T, y - (T * 1.15) / 2 - T * 0.05, T * 1.15, c.ink, 'end'));
    }

    parts.push(rect(x1, y - (AXIS_W * E) / 2, x2 - x1, AXIS_W * E, c.ink));
    // The shaded space goes over the axis and under the marks, so the two
    // marks bounding it stay crisp.
    l.highlight.forEach((h) => {
      const hx1 = x(l.start + h.fromIndex * l.interval);
      const hx2 = x(l.start + h.toIndex * l.interval);
      parts.push(rect(hx1, y - shortHalf, hx2 - hx1, shortHalf * 2, c.highlight, ` fill-opacity="${HIGHLIGHT_WASH}"`));
      const bar = Math.max(AXIS_W * E, HIGHLIGHT_BAR * E);
      parts.push(rect(hx1, y - bar / 2, hx2 - hx1, bar, c.highlight));
    });

    for (let k = 0; k <= l.count; k++) {
      if (!l.showTicks && k !== 0 && k !== l.count) continue;
      const v = Math.round((l.start + k * l.interval) * 1e9) / 1e9;
      const tall = l.tall.some((t) => Math.abs(t - v) < 1e-9);
      const half = tall ? (TALL_TICK_H / 2) * E : shortHalf;
      parts.push(rect(x(v) - (TICK_W * E) / 2, y - half, TICK_W * E, half * 2, c.ink));
    }

    // Numbers under the marks.
    const labelTop = y + tickHalf + LABEL_GAP * E;
    l.labels.forEach((v) => parts.push(text(v.text, x(v.at), labelTop, L.labelPt, c.ink)));
    let under = labelTop + (l.labels.length ? BAND * T : 0);

    if (l.unit) parts.push(text(l.unit, x2 + LABEL_GAP * T, labelTop, T, c.ink, 'start'));

    if (l.caption) {
      if (l.captionSlot) {
        // A caption with a blank is a place to write: its words, then an answer
        // box the same as the boxes at the marks, centred under the numbers
        // where the caption always sat.
        const [before, ...rest] = l.caption.split(CAPTION_BLANK);
        const lead = before.trim();
        const after = rest.join(' ').trim();
        const slotW = SLOT_W * T;
        const leadW = lead ? widthPt(lead, T, profile.bold) + 0.4 * T : 0;
        const afterW = after ? 0.4 * T + widthPt(after, T, profile.bold) : 0;
        let gx = (x1 + x2) / 2 - (leadW + slotW + afterW) / 2;
        const slotTop = under + SLOT_GAP * T;
        const mid = slotTop + (SLOT_H * T) / 2 - T * 0.65;
        if (lead) parts.push(text(lead, gx, mid, T, c.label, 'start'));
        gx += leadW;
        parts.push(boxAt(gx + slotW / 2, slotTop, slotW, SLOT_H * T));
        gx += slotW;
        if (after) parts.push(text(after, gx + 0.4 * T, mid, T, c.label, 'start'));
        under = slotTop + SLOT_H * T;
      } else {
        parts.push(text(l.caption, (x1 + x2) / 2, under, T, c.ink));
        under += BAND * T;
      }
    }

    // Answer boxes above marks.
    l.boxes.forEach((v) => {
      const top = y - tickHalf - BOX_GAP * E - BOX * T;
      parts.push(boxAt(x(v), top, BOX * T, BOX * T));
    });

    // A ruler's bracket.
    if (l.object) {
      const ox1 = x(Number(l.object.from));
      const ox2 = x(Number(l.object.to));
      const base = y - tickHalf - OBJECT_GAP * E;
      const topBar = base - OBJECT_BAR * E;
      const sw = f2(Math.max(1.5, TICK_W * E));
      parts.push(`<path d="M${f2(ox1)} ${f2(base)} V${f2(topBar)} H${f2(ox2)} V${f2(base)}" fill="none" stroke="${c.jump}" stroke-width="${sw}"/>`);
      if (l.object.label) parts.push(text(l.object.label, (ox1 + ox2) / 2, topBar - BAND * T, T, c.jump));
    }

    // Arrows pointing at a place.
    l.arrows.forEach((a) => {
      const ax = x(a.at);
      const tip = y - ARROW_GAP * E - (AXIS_W * E) / 2;
      const headTop = tip - ARROW_HEAD_H * E;
      const stemTop = headTop - ARROW_STEM * E;
      parts.push(rect(ax - (TICK_W * E) / 2, stemTop, TICK_W * E, headTop - stemTop + 0.5, c.arrow));
      parts.push(
        `<polygon points="${f2(ax)},${f2(tip)} ${f2(ax - (ARROW_HEAD_W * E) / 2)},${f2(headTop)} ${f2(ax + (ARROW_HEAD_W * E) / 2)},${f2(headTop)}" fill="${c.arrow}"/>`
      );
      if (a.answerBox) parts.push(boxAt(ax, stemTop - BOX_GAP * E - BOX * T, BOX * T, BOX * T));
      else if (a.label) parts.push(text(a.label, ax, stemTop - BAND * T * (1 + (l._arrowTiers.get(a) || 0)), T, c.arrow));
    });

    // Answers: a dot on the line and its value above it.
    l.answers.forEach((a) => {
      const ax = x(a.at);
      parts.push(`<circle cx="${f2(ax)}" cy="${f2(y)}" r="${f2(DOT_R * E)}" fill="${c.answer}"/>`);
      if (a.text) parts.push(text(a.text, ax, y - DOT_R * E - ANSWER_GAP * E - BAND * T * (1 + (l._answerTiers.get(a) || 0)), T, c.answer));
    });

    // Jumps along the spaces.
    if (l.jumps.length) {
      const labelled = l.jumps.some((j) => j.label || j.box);
      const labelH = labelled ? BAND * T : 0;
      const baseY = y - shortHalf - JUMP_GAP * E;
      let jumpPt = T;
      l.jumps.forEach((j) => {
        if (!j.label) return;
        const span = Math.abs(x(l.start + j.toIndex * l.interval) - x(l.start + j.fromIndex * l.interval)) - LABEL_GUTTER * T;
        const need = widthPt(j.label, T, profile.bold);
        if (need > span) jumpPt = Math.min(jumpPt, (T * span) / need);
      });
      if (jumpPt < profile.minFontPt * 0.999 && jumpPt < T) {
        throw new Error(
          `NUMBERLINE_JUMP_LABELS_CROWDED: the jump labels cannot sit over their spaces at the ${profile.minFontPt}pt readable minimum. ` +
            'Label one jump and let the caption say the rest ("Each jump is +10"), or give the line more width.'
        );
      }
      l.jumps.forEach((j) => {
        const jx1 = x(l.start + j.fromIndex * l.interval);
        const jx2 = x(l.start + j.toIndex * l.interval);
        const h = jumpsGeo.arcHeight(j, jx2 - jx1, JUMP_TIER * E, labelH);
        const g = jumpsGeo.arcGeometry(jx1, jx2, baseY, h, JUMP_HEAD * E);
        parts.push(
          `<polyline points="${g.points.map((p) => `${f2(p.x)},${f2(p.y)}`).join(' ')}" fill="none" stroke="${c.jump}" stroke-width="${f2(Math.max(1.5, JUMP_STROKE * E))}" stroke-linecap="round"/>`
        );
        parts.push(`<polygon points="${g.head.map((p) => `${f2(p.x)},${f2(p.y)}`).join(' ')}" fill="${c.jump}"/>`);
        if (j.label) parts.push(text(j.label, g.apex.x, g.apex.y - labelH, jumpPt, c.jump));
        else if (j.box) {
          const bw = Math.min(Math.max(2.9 * T, widthPt('+000', T, profile.bold)), Math.abs(jx2 - jx1) - LABEL_GUTTER * T);
          parts.push(boxAt(g.apex.x, g.apex.y - labelH - 1, bw, labelH));
        }
      });
    }
  });

  const w = f2(L.w);
  const h = f2(L.h);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
  return { svg, w: L.w, h: L.h, aspect: L.w / L.h, layout: L };
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
  return `number-line:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(normalise(spec))}:${spec.lineLabels === false ? 'nonames' : ''}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, formatValue, MAX_LINES };
