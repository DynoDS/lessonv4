'use strict';

// Jumps and a highlighted interval on a number line, shared by every engine that
// draws one: the board (builder numberline.js), the sheet (worksheet drawn.js
// number-line), the wall (svg-renderer.js numberLine) and the stick-in piece
// (number-line-svg.js).
//
// Counting on, counting back and reading a scale are all taught by moving along
// the spaces BETWEEN marks, and no engine could draw a space. A Year 4 lesson on
// reading number lines asked for "the space between 0 and 10 highlighted" and
// "a +10 jump over one interval" on its vocabulary slide; the slide came out as
// a detached shaded strip above the line and an arrow pointing down at the 10
// tick, which shows a mark rather than a space - the exact misconception the
// lesson was teaching against (12 September 2026).
//
// This module owns what a jump and a highlight MEAN, so the four drawings
// cannot disagree about it: which values they may join, how overlapping jumps
// stack, and the shape of the arc. Each engine owns only how its own ink is put
// down. Positions are given as values on the line (or tick indices on the
// stick-in piece), never as fractions across the drawing, so a jump stays on
// its interval when the scale changes.

// ─── CONSTANTS ────────────────────────────────────────────────
// Arc height as a share of the arc's own span, so a one-interval hop is a low
// hump and a long jump rises more; capped by each engine's tier height.
const ARC_RISE = 0.42;
// Points along the arc. Enough that PowerPoint's straight segments read as a
// curve at board size.
const ARC_SEGMENTS = 24;
// A label longer than this is a sentence, and a sentence belongs beside the
// line, not on a hop between two ticks.
const MAX_LABEL_CHARS = 8;
// ─── END CONSTANTS ────────────────────────────────────────────

function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

// Where a value sits on the line, as a tick index, or null when it is not on a
// tick. Rounded so 0.1-steps do not fail on floating point.
function tickIndexOf(value, line) {
  if (!isNum(value)) return null;
  const raw = (value - line.start) / line.interval;
  const index = Math.round(raw);
  if (Math.abs(raw - index) > 1e-6) return null;
  if (index < 0 || index > line.count) return null;
  return index;
}

function describeLine(line) {
  return `${line.start} to ${line.end} in steps of ${line.interval}`;
}

// A line given by values: { start, end, interval }.
function valueLine(spec) {
  const start = isNum(spec.start) ? spec.start : 0;
  const end = isNum(spec.end) ? spec.end : 10;
  const interval = isNum(spec.interval) && spec.interval > 0 ? spec.interval : 1;
  return { start, end, interval, count: Math.round((end - start) / interval), byIndex: false };
}

// A line given by tick indices only (the stick-in piece): { intervals }.
function indexLine(intervals) {
  return { start: 0, end: intervals, interval: 1, count: intervals, byIndex: true };
}

function endpoint(raw, line, what, name) {
  const index = tickIndexOf(raw, line);
  if (index == null) {
    const unit = line.byIndex ? 'a tick index from 0 to ' + line.count : 'a value on a tick of this line (' + describeLine(line) + ')';
    throw new Error(
      `NUMBERLINE_${what}_OFF_TICK: ${name} ${JSON.stringify(raw)} must be ${unit}. ` +
        'A jump or highlight joins marks, so both ends sit on a mark.'
    );
  }
  return index;
}

// jumps: [{ from, to, label?, box? }] -> [{ fromIndex, toIndex, label, box, tier }]
// A jump may go either way (counting back is to < from). Jumps whose spans
// overlap rise onto a higher tier so their arcs never cross; jumps that only
// touch end-to-start share a tier, which is how a run of hops reads as a run.
function resolveJumps(spec, line) {
  const raw = spec.jumps;
  if (raw == null) return [];
  if (!Array.isArray(raw)) throw new Error('NUMBERLINE_JUMPS_INVALID: jumps must be an array of { from, to, label }.');
  const jumps = raw.map(function (j, i) {
    if (!j || typeof j !== 'object') throw new Error(`NUMBERLINE_JUMPS_INVALID: jumps[${i}] must be an object.`);
    const fromIndex = endpoint(j.from, line, 'JUMP', `jumps[${i}].from`);
    const toIndex = endpoint(j.to, line, 'JUMP', `jumps[${i}].to`);
    if (fromIndex === toIndex) {
      throw new Error(`NUMBERLINE_JUMPS_INVALID: jumps[${i}] starts and ends on the same mark, so it jumps nowhere.`);
    }
    let label = j.label == null ? '' : String(j.label).trim();
    if (label.length > MAX_LABEL_CHARS) {
      throw new Error(
        `NUMBERLINE_JUMP_LABEL_TOO_LONG: ${JSON.stringify(label)} is longer than ${MAX_LABEL_CHARS} characters. ` +
          'A jump carries its size ("+10", "-100", "?"); say anything longer beside the line.'
      );
    }
    const box = j.box === true;
    if (box && label) {
      throw new Error(`NUMBERLINE_JUMPS_INVALID: jumps[${i}] has both a label and a box; a box is the blank a child writes the label in.`);
    }
    return { fromIndex, toIndex, label, box, lo: Math.min(fromIndex, toIndex), hi: Math.max(fromIndex, toIndex) };
  });

  const byStart = jumps.slice().sort(function (a, b) { return a.lo - b.lo || a.hi - b.hi; });
  const tierEnds = [];
  byStart.forEach(function (j) {
    let tier = tierEnds.findIndex(function (end) { return end <= j.lo; });
    if (tier < 0) { tier = tierEnds.length; tierEnds.push(-Infinity); }
    tierEnds[tier] = j.hi;
    j.tier = tier;
  });
  return jumps.map(function (j) {
    return { fromIndex: j.fromIndex, toIndex: j.toIndex, label: j.label, box: j.box, tier: j.tier };
  });
}

function tierCount(jumps) {
  return jumps.reduce(function (n, j) { return Math.max(n, j.tier + 1); }, 0);
}

// highlight: { from, to } or an array of them -> [{ fromIndex, toIndex }]
// The shaded space is what an interval IS, so it runs mark to mark. Shading the
// whole line points at nothing, the same rule every other highlight follows.
function resolveIntervalHighlight(spec, line) {
  const raw = spec.highlight;
  if (raw == null || raw === false) return [];
  const asked = Array.isArray(raw) ? raw : [raw];
  const spans = asked.map(function (h, i) {
    if (!h || typeof h !== 'object') {
      throw new Error('NUMBERLINE_HIGHLIGHT_INVALID: a number line highlight names a space as { from, to }.');
    }
    const a = endpoint(h.from, line, 'HIGHLIGHT', `highlight[${i}].from`);
    const b = endpoint(h.to, line, 'HIGHLIGHT', `highlight[${i}].to`);
    if (a === b) throw new Error('NUMBERLINE_HIGHLIGHT_INVALID: a highlight from a mark to the same mark has no space in it.');
    return { fromIndex: Math.min(a, b), toIndex: Math.max(a, b) };
  });
  if (spans.some(function (s) { return s.fromIndex === 0 && s.toIndex === line.count; }) && line.count > 1) {
    throw new Error(
      'NUMBERLINE_HIGHLIGHT_INVALID: the highlight covers the whole line, which points at nothing. ' +
        'Highlight the space the teaching is about.'
    );
  }
  return spans;
}

// A label entry written as { at, text } prints `text` under the mark at `at`.
// Its job is the reasoning question "Has this line been completed correctly?":
// a label is placed by its value, so a wrong completion ("2,500, 2,700, 2,700")
// could not be printed at all. A Year 4 run had to redesign its worksheet task
// and put its slide's labels in a row of cards beside the line
// (12 September 2026). The mark is still found by value, so the geometry stays
// honest while the words are allowed to be wrong.
const MAX_LABEL_TEXT_CHARS = 10;
function labelEntry(raw, line, i) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const index = tickIndexOf(raw.at, line);
    if (index == null) {
      throw new Error(
        `NUMBERLINE_LABEL_OFF_TICK: labels[${i}].at ${JSON.stringify(raw.at)} must be a value on a tick of this line (${describeLine(line)}).`
      );
    }
    const text = raw.text == null ? '' : String(raw.text).trim();
    if (!text || text.length > MAX_LABEL_TEXT_CHARS) {
      throw new Error(
        `NUMBERLINE_LABEL_INVALID: labels[${i}].text must be the few characters printed under the mark (up to ${MAX_LABEL_TEXT_CHARS}), such as "2,700".`
      );
    }
    return { at: raw.at, text: text, index: index };
  }
  return null;
}

// Refuse the pairings whose ink would land in the same place. An arrow or an
// answer dot marks a POINT above the line and a jump's arc lives in that same
// band, so drawing both would put a stem through an arc. One line carries one
// kind of mark; a second line in the same visual can carry the other.
function refuseCrowding(jumps, spec, others, where) {
  if (!jumps.length) return;
  const clash = others.filter(function (field) {
    const v = spec[field];
    return v != null && !(Array.isArray(v) && v.length === 0);
  });
  if (clash.length) {
    throw new Error(
      `NUMBERLINE_JUMPS_CROWDED: ${where} carries jumps and ${clash.join(' and ')}, which draw in the same space above the line. ` +
        'Put the jumps on their own line, or give the jump a label instead of the point.'
    );
  }
}

// The arc from x1 to x2 along baseY, rising `height` (drawing units, y grows
// downward). Returns the points and an arrowhead triangle at the landing end,
// pointing along the arc's final direction so it reads as landing on the mark.
function arcGeometry(x1, x2, baseY, height, headSize) {
  const points = [];
  for (let i = 0; i <= ARC_SEGMENTS; i++) {
    const t = i / ARC_SEGMENTS;
    points.push({ x: x1 + (x2 - x1) * t, y: baseY - height * 4 * t * (1 - t) });
  }
  const tip = points[points.length - 1];
  const prev = points[points.length - 3];
  let dx = tip.x - prev.x;
  let dy = tip.y - prev.y;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;
  const back = { x: tip.x - dx * headSize, y: tip.y - dy * headSize };
  const half = headSize * 0.55;
  const head = [
    { x: tip.x, y: tip.y },
    { x: back.x - dy * half, y: back.y + dx * half },
    { x: back.x + dy * half, y: back.y - dx * half }
  ];
  // Stop the stroke where the head begins, so a thick line does not poke out
  // past the arrow's point.
  const stroke = points.slice(0, -1);
  stroke.push(back);
  return { points: stroke, head, apex: { x: (x1 + x2) / 2, y: baseY - height } };
}

// The rise for a jump's arc, in drawing units. The engine reserves one band per
// tier: `tierHeight` for the arc plus `labelHeight` for the words on top of it.
// A bottom-tier hop rises with its span up to the tier ceiling, so a short hop
// stays a low hump. A higher tier clears every band beneath it, labels
// included, because it exists only because it overlaps a jump down there.
function arcHeight(jump, span, tierHeight, labelHeight) {
  if (!jump.tier) return Math.min(Math.abs(span) * ARC_RISE, tierHeight);
  return jump.tier * (tierHeight + labelHeight) + tierHeight;
}

// The whole height the jumps need above the line.
function bandHeight(jumps, tierHeight, labelHeight) {
  return tierCount(jumps) * (tierHeight + labelHeight);
}

module.exports = {
  valueLine,
  indexLine,
  resolveJumps,
  resolveIntervalHighlight,
  refuseCrowding,
  tierCount,
  arcGeometry,
  arcHeight,
  bandHeight,
  labelEntry,
  MAX_LABEL_CHARS
};
