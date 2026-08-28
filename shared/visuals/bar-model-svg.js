'use strict';

// SHARED bar-model geometry — the single source of truth for a general bar
// model: the White Rose / Singapore "rectangle divided into parts" picture that
// underpins money, comparison and multi-step reasoning across Year 4+. This is
// the visual a child meets on the board, on a worksheet, and on the working
// wall, so the geometry lives here once and every engine imports it.
//
// Two shapes, chosen by `shape`:
//
//   "part-whole"  — one long rectangle (the WHOLE) divided into 2+ segments
//                   (the PARTS) along its length. The whole carries a label
//                   above the bar (a square bracket spanning it) or to its side;
//                   each part carries a label inside its segment. Segment lengths
//                   are proportional to the parts' `value`s when every part has
//                   one, and EVEN otherwise (so a child writing into blanks meets
//                   equal boxes). Worked uses: £5 split into "biscuit 30p / drink
//                   50p / change ?"; a blank whole over two known parts (child
//                   totals); the whole and one part known, the other blank.
//
//   "comparison"  — two bars stacked one above the other, drawn to different
//                   lengths from their `value`s, with the shorter bar's shortfall
//                   shown as a labelled gap (the DIFFERENCE) aligned to the right
//                   end of the longer bar. Worked use: a £27.40 bar above a
//                   £12.75 bar with the gap labelled "?" — "how much more…?".
//
// ANY region (a part, a bar, the difference gap) is the child's ANSWER SPACE
// when its label is empty or "?": it is drawn white with a blue dashed outline
// (write here), where a known region is drawn pale-house-blue with a solid black
// outline. Labels are plain strings, so they hold "£5", "30p", "?", "Spent",
// "Left", etc. unchanged.
//
//   tightSvg(spec) → { svg, aspect, w, h }   cropped TIGHT to the drawing
//   cacheKey(spec) → string                  stable pre-render cache key
//
// The SVG is cropped to the exact bounding box of everything drawn (bars,
// labels, brackets) with only a hair of margin — no padded square, no
// deadspace — and the true aspect is returned so each engine sizes it to fill
// its slot. See references/helper-authoring.md (the no-deadspace principle).

// ─── CONSTANTS (SVG user units; rescaled per engine by aspect) ───────────────
const FONT      = 'Arial';
const CHAR_W    = 0.58;    // Arial-bold character-width estimate (× font size)

const FS        = 30;      // label font inside a part / bar / difference gap
const WHOLE_FS  = 32;      // the whole label (above the bracket or to the side)
const NAME_FS   = 28;      // a comparison bar's left-side category name

const BAR_H     = 74;      // height of a bar / segment
const MIN_SEG_W = 100;     // minimum width of any segment / bar
const SEG_PAD_X = 24;      // horizontal padding reserved for a label inside a box
const FULL_W    = 560;     // base length of the longer comparison bar

const STROKE_W      = 3;   // bar outline stroke width
const BRACKET_W     = 2.5; // whole-bracket stroke width
const GUIDE_W       = 2;   // comparison alignment-guide stroke width
const DASH          = '9,7';   // dash pattern for an open (answer) region
const GUIDE_DASH    = '6,6';   // dash pattern for the alignment guide

const BRACKET_GAP   = 16;  // gap between the bar top and the bracket line
const BRACKET_TICK  = 14;  // length of the down-ticks at the bracket's ends
const WHOLE_GAP     = 12;  // gap between the bracket line and the whole label
const SIDE_GAP      = 18;  // gap between a side whole-label and the bar
const ROW_GAP       = 34;  // vertical gap between the two comparison bars
const NAME_GAP      = 18;  // gap between a left-side name and its bar

const BAR_FILL      = '#DEEAF6';   // pale house blue — a known region
const OPEN_FILL     = '#FFFFFF';   // white — an answer region
const SOLID_STROKE  = '#000000';   // known-region outline (solid)
const OPEN_STROKE   = '#1F4E79';   // answer-region outline (house blue, dashed)
const BRACKET_COL   = '#000000';
const GUIDE_COL     = '#9AA5B1';   // soft grey alignment guide
const TEXT_COL      = '#000000';
// ─── END CONSTANTS ───────────────────────────────────────────────────────────

function f(n) { return Number(n).toFixed(2); }

function textWidth(s, fs) {
  return String(s == null ? '' : s).length * fs * CHAR_W;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// A region is the child's ANSWER SPACE — drawn white with a dashed outline,
// "write here" — when it carries no label or its label ends in a "?" (so "?",
// "change ?" and "Left ?" all read as the unknown to find, while "£2.40" and
// "biscuit 30p" stay known/filled).
function isOpen(label) {
  const s = label == null ? '' : String(label).trim();
  return s === '' || s.endsWith('?');
}

function num(x) {
  const v = Number(x);
  return Number.isFinite(v) ? v : null;
}

function tightSvg(data) {
  const shape = data && data.shape === 'comparison' ? 'comparison' : 'part-whole';

  const parts = [];
  const bb = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  function ext(x0, y0, x1, y1) {
    if (x0 < bb.x0) bb.x0 = x0;
    if (y0 < bb.y0) bb.y0 = y0;
    if (x1 > bb.x1) bb.x1 = x1;
    if (y1 > bb.y1) bb.y1 = y1;
  }

  function drawRect(x, y, w, h, open) {
    const fill   = open ? OPEN_FILL : BAR_FILL;
    const stroke = open ? OPEN_STROKE : SOLID_STROKE;
    const dash   = open ? ` stroke-dasharray="${DASH}"` : '';
    parts.push(`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}" stroke="${stroke}" stroke-width="${STROKE_W}"${dash}/>`);
    ext(x - STROKE_W / 2, y - STROKE_W / 2, x + w + STROKE_W / 2, y + h + STROKE_W / 2);
  }

  function drawLine(x1, y1, x2, y2, colour, width, dash) {
    const d = dash ? ` stroke-dasharray="${dash}"` : '';
    parts.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${colour}" stroke-width="${width}" stroke-linecap="round"${d}/>`);
    ext(Math.min(x1, x2) - width / 2, Math.min(y1, y2) - width / 2, Math.max(x1, x2) + width / 2, Math.max(y1, y2) + width / 2);
  }

  function drawText(cx, cy, s, fs, anchor) {
    if (s == null || s === '') return;
    const a = anchor || 'middle';
    parts.push(`<text x="${f(cx)}" y="${f(cy)}" text-anchor="${a}" dominant-baseline="central" font-family="${FONT}" font-size="${fs}" font-weight="bold" fill="${TEXT_COL}">${esc(s)}</text>`);
    const w = textWidth(s, fs);
    let lx, rx;
    if (a === 'end')       { lx = cx - w; rx = cx; }
    else if (a === 'start'){ lx = cx;     rx = cx + w; }
    else                   { lx = cx - w / 2; rx = cx + w / 2; }
    ext(lx, cy - fs * 0.62, rx, cy + fs * 0.62);
  }

  if (shape === 'part-whole') {
    drawPartWhole(data, drawRect, drawLine, drawText);
  } else {
    drawComparison(data, drawRect, drawLine, drawText);
  }

  // Crop tight: translate everything so the true bounding box starts at the
  // margin, and size the canvas to it — no padded square, so the picture fills
  // whatever slot each engine gives it.
  if (!Number.isFinite(bb.x0)) {
    const empty = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"></svg>`;
    return { svg: empty, aspect: 1, w: 10, h: 10 };
  }
  const M  = STROKE_W;
  const ox = M - bb.x0;
  const oy = M - bb.y0;
  const w  = (bb.x1 - bb.x0) + 2 * M;
  const h  = (bb.y1 - bb.y0) + 2 * M;
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}"><g transform="translate(${f(ox)},${f(oy)})">${parts.join('')}</g></svg>`;
  return { svg, aspect: w / h, w, h };
}

// ─── Part-whole: one whole bar divided into parts ────────────────────────────
function drawPartWhole(data, drawRect, drawLine, drawText) {
  const wholeObj   = (data.whole && typeof data.whole === 'object') ? data.whole : null;
  const wholeLabel = wholeObj ? (wholeObj.label == null ? '' : String(wholeObj.label)) : '';
  const wholePos   = data.wholeLabelPosition === 'side' ? 'side' : 'above';

  let segs = Array.isArray(data.parts) ? data.parts.filter((p) => p && typeof p === 'object') : [];
  if (segs.length === 0) segs = [{}, {}];
  const n = segs.length;

  // Proportional only when EVERY part has a value; otherwise even segments — so a
  // child writing into blank parts meets equal boxes, never a zero-width unknown.
  const allVals = segs.every((p) => Number.isFinite(Number(p.value)));
  const weights = segs.map((p) => (allVals ? Math.max(0.0001, Number(p.value)) : 1));
  const totW    = weights.reduce((a, b) => a + b, 0);

  // Each segment must be wide enough for its own label; scale the whole bar up
  // until the narrowest-by-proportion segment still fits.
  const minWs = segs.map((p) => {
    const lbl = p.label == null ? '' : String(p.label);
    return Math.max(MIN_SEG_W, textWidth(lbl, FS) + 2 * SEG_PAD_X);
  });
  let barW = MIN_SEG_W * n;
  for (let i = 0; i < n; i++) barW = Math.max(barW, (minWs[i] * totW) / weights[i]);
  const segWs = weights.map((w) => (barW * w) / totW);

  // The bar runs along y in [0, BAR_H] from x = 0.
  let x = 0;
  for (let i = 0; i < n; i++) {
    const w   = segWs[i];
    const lbl = segs[i].label == null ? '' : String(segs[i].label);
    drawRect(x, 0, w, BAR_H, isOpen(lbl));
    drawText(x + w / 2, BAR_H / 2, lbl, FS, 'middle');
    x += w;
  }

  if (wholeObj) {
    if (wholePos === 'above') {
      // A square span-bracket above the bar: a horizontal line with short ticks
      // turning down toward the bar at each end, the whole label centred above.
      const hY = -BRACKET_GAP - BRACKET_TICK;
      drawLine(0, hY, barW, hY, BRACKET_COL, BRACKET_W);
      drawLine(0, hY, 0, hY + BRACKET_TICK, BRACKET_COL, BRACKET_W);
      drawLine(barW, hY, barW, hY + BRACKET_TICK, BRACKET_COL, BRACKET_W);
      drawText(barW / 2, hY - WHOLE_GAP - WHOLE_FS * 0.5, wholeLabel, WHOLE_FS, 'middle');
    } else {
      drawText(-SIDE_GAP, BAR_H / 2, wholeLabel, WHOLE_FS, 'end');
    }
  }
}

// ─── Comparison: two bars with the difference shown as a gap ──────────────────
function drawComparison(data, drawRect, drawLine, drawText) {
  const barsIn  = Array.isArray(data.bars) ? data.bars.filter((b) => b && typeof b === 'object') : [];
  const b0      = barsIn[0] || {};
  const b1      = barsIn[1] || {};
  const diffObj = (data.difference && typeof data.difference === 'object') ? data.difference : null;

  // Resolve the two bar values, deriving a missing one from the difference where
  // possible, and falling back to a clean schematic ratio when there are no
  // numbers at all (so a "draw and label" frame still shows one bar visibly
  // shorter than the other).
  let a = num(b0.value);
  let c = num(b1.value);
  const d = diffObj ? num(diffObj.value) : null;
  if (a == null && c != null && d != null) a = c + d;
  if (c == null && a != null && d != null) c = a - d;
  if (a != null && c == null && d == null) c = a * 0.62;
  if (c != null && a == null && d == null) a = c / 0.62;
  if (a == null && c == null) { a = 1; c = 0.62; }
  if (a == null) a = c;
  if (c == null) c = a;
  a = Math.max(a, 0.0001);
  c = Math.max(c, 0.0001);
  const maxV = Math.max(a, c);

  const lbl0 = b0.label == null ? '' : String(b0.label);
  const lbl1 = b1.label == null ? '' : String(b1.label);
  const diffLbl = diffObj ? (diffObj.label == null ? '' : String(diffObj.label)) : '';

  const minW0 = Math.max(MIN_SEG_W, textWidth(lbl0, FS) + 2 * SEG_PAD_X);
  const minW1 = Math.max(MIN_SEG_W, textWidth(lbl1, FS) + 2 * SEG_PAD_X);
  const gapVal = Math.abs(a - c);
  const diffMinW = Math.max(MIN_SEG_W * 0.7, textWidth(diffLbl, FS) + 2 * SEG_PAD_X);

  // Scale the longer bar to FULL_W, then bump FULL up so every bar (and the gap)
  // is wide enough for its own label.
  let FULL = FULL_W;
  FULL = Math.max(FULL, (minW0 * maxV) / a, (minW1 * maxV) / c);
  if (gapVal > 1e-6) FULL = Math.max(FULL, (diffMinW * maxV) / gapVal);
  const w0 = (FULL * a) / maxV;
  const w1 = (FULL * c) / maxV;

  const y0 = 0;
  const y1 = BAR_H + ROW_GAP;

  drawRect(0, y0, w0, BAR_H, isOpen(lbl0));
  drawText(w0 / 2, y0 + BAR_H / 2, lbl0, FS, 'middle');
  drawRect(0, y1, w1, BAR_H, isOpen(lbl1));
  drawText(w1 / 2, y1 + BAR_H / 2, lbl1, FS, 'middle');

  const name0 = b0.name == null ? '' : String(b0.name);
  const name1 = b1.name == null ? '' : String(b1.name);
  if (name0 !== '') drawText(-NAME_GAP, y0 + BAR_H / 2, name0, NAME_FS, 'end');
  if (name1 !== '') drawText(-NAME_GAP, y1 + BAR_H / 2, name1, NAME_FS, 'end');

  // The difference: a box filling the shorter bar's shortfall, its right edge
  // aligned to the longer bar's right end. Open (white dashed) when the
  // difference is the unknown, pale-blue when it is given. A soft dashed guide
  // ties the two bars' right ends so the shortfall reads as "this much more".
  if (gapVal > 1e-6) {
    const shorterIs0 = w0 <= w1;
    const shortW = Math.min(w0, w1);
    const longW  = Math.max(w0, w1);
    const gy = shorterIs0 ? y0 : y1;
    drawRect(shortW, gy, longW - shortW, BAR_H, isOpen(diffLbl));
    drawText(shortW + (longW - shortW) / 2, gy + BAR_H / 2, diffLbl, FS, 'middle');
    drawLine(longW, y0, longW, y1 + BAR_H, GUIDE_COL, GUIDE_W, GUIDE_DASH);
  }
}

function cacheKey(data) {
  const shape = data && data.shape === 'comparison' ? 'comparison' : 'part-whole';
  if (shape === 'part-whole') {
    const w = (data.whole && typeof data.whole === 'object')
      ? `${data.whole.label == null ? '' : data.whole.label}/${data.whole.value == null ? '' : data.whole.value}`
      : '-';
    const ps = (Array.isArray(data.parts) ? data.parts : [])
      .map((p) => `${p && p.label != null ? p.label : ''}:${p && p.value != null ? p.value : ''}`)
      .join('|');
    const pos = data.wholeLabelPosition === 'side' ? 'side' : 'above';
    return `bar-model:pw:${pos}:${w}:${ps}`;
  }
  const bs = (Array.isArray(data.bars) ? data.bars : [])
    .map((b) => `${b && b.name != null ? b.name : ''}~${b && b.label != null ? b.label : ''}:${b && b.value != null ? b.value : ''}`)
    .join('|');
  const df = (data.difference && typeof data.difference === 'object')
    ? `${data.difference.label == null ? '' : data.difference.label}:${data.difference.value == null ? '' : data.difference.value}`
    : '-';
  return `bar-model:cmp:${bs}:${df}`;
}

// Comparison labels and values are task-specific. Inline, the relationship is
// carried by the aligned bars and the visible shortfall, drawn from the same
// bar colours and difference convention as the full model.
function comparisonCueSvg() {
  const w = 250, h = 128;
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect x="8" y="14" width="226" height="40" fill="${BAR_FILL}" stroke="${SOLID_STROKE}" stroke-width="6"/><rect x="8" y="76" width="144" height="40" fill="${BAR_FILL}" stroke="${SOLID_STROKE}" stroke-width="6"/><rect x="152" y="76" width="82" height="40" fill="${OPEN_FILL}" stroke="${OPEN_STROKE}" stroke-width="6" stroke-dasharray="12,9"/><line x1="234" y1="12" x2="234" y2="119" stroke="${GUIDE_COL}" stroke-width="5" stroke-dasharray="9,8"/></svg>`;
  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg, comparisonCueSvg, cacheKey };
