'use strict';

// SHARED blank-surface geometry — a DRAW-YOUR-OWN working surface, where the
// CHILD constructs the representation rather than filling a pre-drawn one. The
// engine's other helpers (numberline, bar-model) draw a finished picture with
// blanks to fill; this one deliberately draws almost nothing, because for the
// efficient-strategy lessons (adjusting, compensating, finding change) deciding
// WHERE the jump on a number line goes, or HOW to partition a bar, IS the skill.
// The scheme of work asks for this constantly ("draw a number line to represent
// the strategy", "draw a bar model and solve"); this is the surface that sets
// that task. It is the same bare surface on the board (the teacher models drawing
// one live) and on a worksheet (the child draws their own), so the geometry lives
// here once and both engines import it.
//
// Two forms, chosen by `surface`:
//
//   "number-line"  — a single FAINT horizontal baseline with a generous empty
//                    band above it (and a little below) for the child's own
//                    jumps and working. No ticks, no pre-drawn jumps, no numbers
//                    along it. The two END values may optionally be labelled
//                    (e.g. "0" at the left, "100" at the right) when the caller
//                    supplies `start` / `end` — otherwise the line is bare.
//
//   "bar"          — a single empty rectangle OUTLINE with no internal divisions
//                    (the child draws the partitions themselves). Set `bars: 2`
//                    for a comparison task — two stacked empty outlines.
//
// It stays MINIMAL on purpose and must not collapse back into a pre-drawn
// fill-in: it renders only the bare surface (a faint line, or an empty outline).
// If this ever starts drawing ticks, segments or jump arcs, it has become the
// numberline / bar-model helper, not this one. Any labels are plain strings.
//
//   tightSvg(spec) → { svg, aspect, w, h }   cropped TIGHT to the surface box
//   cacheKey(spec) → string                  stable pre-render cache key
//
// "Tight" here means cropped to the intended WORKING SURFACE — the faint line
// plus its construction band, or the empty outline(s) — with only a hair of
// margin. The empty drawing band is functional space the child needs, not
// deadspace, so it is part of the box; there is no padded square around it. The
// true aspect is returned so each engine sizes the surface to fill its slot. See
// references/helper-authoring.md (the no-deadspace principle).

// ─── CONSTANTS (SVG user units; rescaled per engine by aspect) ───────────────
const FONT   = 'Arial';
const CHAR_W = 0.58;       // Arial-bold character-width estimate (× font size)

// Number line: a wide, faint baseline with an empty band above for jumps.
//
// The band was 300 above and 110 below, which made the surface 2.4 times as
// wide as it was tall. On a sheet that is 71mm of height at full width, so a
// page designer wanting four of them had to squeeze each beside its sum, where
// the start number printed tiny; on the board it came out as a short faint
// line. Year 4 Maths Lesson 21 (3 October 2026) lost its worksheet to this:
// four lines and two other tasks needed 434mm of a 267mm page, and the repairs
// left four questions where six were designed. The teacher, shown the same
// sheet with the band at 90 and 55 (a full-width line 27mm tall, all six tasks
// on one side): "the reshaped one is right", on the sheet and on the board.
const NL_LINE_W  = 1000;   // length of the baseline
const NL_ABOVE_H = 90;     // empty drawing band ABOVE the line (the child's jumps)
const NL_BELOW_H = 55;     // band BELOW the line (the end labels sit in it)
const NL_BELOW_WORK_H = 130; // band below when the child writes UNDER the line: the labels, then a row of handwriting
const NL_ROOM_NONE = 16;   // the sliver left above a line nobody draws over
const NL_STROKE  = 5;      // baseline stroke width
const NL_COL     = '#9AA5B1';   // faint soft grey — reads as "draw your own here"

// Bar: an empty rectangle outline (or a stack of them for a comparison task).
const BAR_W      = 1000;   // width of a blank bar
const BAR_H      = 240;    // height (room to partition across, and to write inside)
const BAR_GAP    = 80;     // vertical gap between two compared bars
const BAR_STROKE = 5;      // outline stroke width
const BAR_COL    = '#5B6770';   // soft dark grey — a clear but quiet container outline

// End labels (number line only).
const END_FS  = 34;        // end-label font size
const END_COL = '#333333';
const END_GAP = 18;        // gap below the baseline to the end label
// ─── END CONSTANTS ───────────────────────────────────────────────────────────

const { INK_TONES, printsInInk } = require('./surface-profiles');

// The colours above, and what each becomes on the photocopied stick-in pack.
const COLOURS = { NL_COL: NL_COL, BAR_COL: BAR_COL, END_COL: END_COL };
const INK = { NL_COL: INK_TONES.mid, BAR_COL: INK_TONES.dark, END_COL: INK_TONES.ink };

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

// `profile` is optional: the stick-in pack passes its own so this prints in
// ink. The line stays faint and the bar outline quiet,
// in the greys nearest their board colours.
//
// `look` is optional and the board's alone: `endFontSize` and `stroke`, in this
// drawing's own units, for the number line's end labels and baseline. The board
// places this drawing at whatever width its zone has, so a label drawn at one
// size in these units prints at a different point size on every slide; the
// board asks for the size that lands the label at its readable floor in the
// zone it actually has (see builder/src/content/blank-surface.js). Paper passes
// nothing and prints as it always has.
function tightSvg(data, profile, look) {
  const C = printsInInk(profile) ? INK : COLOURS;
  const endFs = look && Number.isFinite(look.endFontSize) && look.endFontSize > 0 ? look.endFontSize : END_FS;
  const lineStroke = look && Number.isFinite(look.stroke) && look.stroke > 0 ? look.stroke : NL_STROKE;
  const surface = data && data.surface === 'bar' ? 'bar' : 'number-line';

  const parts = [];
  const bb = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  function ext(x0, y0, x1, y1) {
    if (x0 < bb.x0) bb.x0 = x0;
    if (y0 < bb.y0) bb.y0 = y0;
    if (x1 > bb.x1) bb.x1 = x1;
    if (y1 > bb.y1) bb.y1 = y1;
  }

  function drawLine(x1, y1, x2, y2, colour, width) {
    parts.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${colour}" stroke-width="${width}" stroke-linecap="round"/>`);
    ext(Math.min(x1, x2) - width / 2, Math.min(y1, y2) - width / 2, Math.max(x1, x2) + width / 2, Math.max(y1, y2) + width / 2);
  }

  // An OUTLINE-only rectangle — no fill, so nothing but the boundary claims space.
  function drawOutlineRect(x, y, w, h, colour, width) {
    parts.push(`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="none" stroke="${colour}" stroke-width="${width}"/>`);
    ext(x - width / 2, y - width / 2, x + w + width / 2, y + h + width / 2);
  }

  function drawText(cx, cy, s, fs, anchor, colour) {
    if (s == null || s === '') return;
    const a = anchor || 'middle';
    parts.push(`<text x="${f(cx)}" y="${f(cy)}" text-anchor="${a}" dy="0.36em" font-family="${FONT}" font-size="${fs}" font-weight="bold" fill="${colour}">${esc(s)}</text>`);
    const w = textWidth(s, fs);
    let lx, rx;
    if (a === 'end')        { lx = cx - w; rx = cx; }
    else if (a === 'start') { lx = cx;     rx = cx + w; }
    else                    { lx = cx - w / 2; rx = cx + w / 2; }
    ext(lx, cy - fs * 0.62, rx, cy + fs * 0.62);
  }

  if (surface === 'number-line') {
    const start = data.start == null ? '' : String(data.start);
    const end   = data.end == null ? '' : String(data.end);
    // Where the child works decides where the room goes. Jumps are drawn
    // ABOVE the line, so by default the band is above and only the end labels
    // sit below. A line a child writes numbers UNDER (their own stops, missing
    // values) wants its room below instead, and one that takes both wants
    // both. The teacher, 4 October 2026: "it depends what the number line is,
    // whether they write above like these, below like missing numbers ... the
    // worksheet designer should know the difference so we can sort dead space".
    const work = data.work === 'below' || data.work === 'both' ? data.work : 'above';
    const aboveH = work === 'below' ? NL_ROOM_NONE : NL_ABOVE_H;
    const belowH = work === 'above' ? NL_BELOW_H : NL_BELOW_WORK_H;
    const baseY = aboveH;

    // Reserve the FULL working surface in the crop, so the child is given real
    // height to construct in, not a thin strip cropped to the line itself.
    ext(0, 0, NL_LINE_W, aboveH + belowH);

    drawLine(0, baseY, NL_LINE_W, baseY, C.NL_COL, lineStroke);

    const labelY = baseY + END_GAP + endFs * 0.5;
    if (start !== '') drawText(0, labelY, start, endFs, 'start', C.END_COL);
    if (end !== '')   drawText(NL_LINE_W, labelY, end, endFs, 'end', C.END_COL);
  } else {
    let n = Number(data.bars);
    n = Number.isFinite(n) ? Math.max(1, Math.min(4, Math.round(n))) : 1;
    let y = 0;
    for (let i = 0; i < n; i++) {
      drawOutlineRect(0, y, BAR_W, BAR_H, C.BAR_COL, BAR_STROKE);
      y += BAR_H + BAR_GAP;
    }
    // y overshoots by one BAR_GAP after the loop; the surface ends at the last
    // bar's bottom edge.
    ext(0, 0, BAR_W, y - BAR_GAP);
  }

  if (!Number.isFinite(bb.x0)) {
    const empty = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"></svg>`;
    return { svg: empty, aspect: 1, w: 10, h: 10 };
  }
  const M  = Math.max(NL_STROKE, BAR_STROKE);
  const ox = M - bb.x0;
  const oy = M - bb.y0;
  const w  = (bb.x1 - bb.x0) + 2 * M;
  const h  = (bb.y1 - bb.y0) + 2 * M;
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}"><g transform="translate(${f(ox)},${f(oy)})">${parts.join('')}</g></svg>`;
  return { svg, aspect: w / h, w, h };
}

function cacheKey(data) {
  const surface = data && data.surface === 'bar' ? 'bar' : 'number-line';
  if (surface === 'number-line') {
    const s = data && data.start != null ? data.start : '';
    const e = data && data.end != null ? data.end : '';
    const w = data && (data.work === 'below' || data.work === 'both') ? data.work : 'above';
    return `blank-surface:nl:${s}:${e}:${w}`;
  }
  let n = Number(data && data.bars);
  n = Number.isFinite(n) ? Math.max(1, Math.min(4, Math.round(n))) : 1;
  return `blank-surface:bar:${n}`;
}

module.exports = { tightSvg, cacheKey };
