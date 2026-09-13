'use strict';

// SHARED translation-shape geometry — the single source of truth for a NUMBERED
// first-quadrant coordinate grid carrying a WHOLE shape and, optionally, its
// TRANSLATED IMAGE (the same shape slid across the grid) with a dashed arrow
// showing the slide. This is the signature picture of a translation lesson: two
// full polygons — the original and its image — on ONE numbered grid, so a child
// sees "the same shape, moved", not two different shapes. Imported by every
// engine that draws it (slides, worksheets, working wall, stick-in pack); each
// draws from this module so the board, the sheet, the wall and the glued piece
// show the identical figure.
//
//   tightSvg(spec) → { svg, aspect, w, h }   cropped tight to the grid's bounds
//   cacheKey(spec) → string                  stable pre-render cache key
//
// The grid, axes and numbers are drawn EXACTLY the way coordinate-grid-svg.js
// draws them — squared paper from the origin (0,0), numbered along the bottom
// (across) and up the left (up) — so the two read as the same grid a child
// already meets. Coordinates run x ACROSS (0 = left) and y UP (0 = bottom).
//
// Two modes, set by `showImage`:
//   showImage:false  the ORIGINAL shape only, on the numbered grid — the TASK the
//                    child works on (and the stick-in): the child plots and joins
//                    the image themselves on the clear grid.
//   showImage:true   the original AND the translated image AND the dashed arrow —
//                    the worked example / answer / working-wall card.
//
// The image is EVERY vertex of the original shifted by the SAME (dx, dy): a true
// translation — no rotation, no reflection, no resize — so it is plainly the same
// size and shape, just slid. The original is drawn solid house-blue; the image in
// a lighter, dashed blue of the same family so the two are distinct at a glance.
//
// Spec:
//   cols       grid runs 0..cols across the bottom (default 10)
//   rows       grid runs 0..rows up the side (default cols)
//   points     [{ x, y }]  the ORIGINAL shape's vertices, joined in order into a
//              closed polygon (same convention as coordinate-grid's points).
//   translate  { dx, dy }  the slide in squares — positive dx = right, positive
//              dy = up; negative = left / down. Every vertex shifts by this.
//   showImage  true = also draw the translated image (dashed, lighter blue) and
//              the dashed arrow from one original vertex to its matching image
//              vertex (default false — original only, the task/stick-in form).
//   arrowFrom  index of the original vertex the arrow springs from (default 0).
//              The arrow lands on that same vertex of the image.

// ─── CONSTANTS (geometry units; the whole drawing scales on placement) ──────
const CELL          = 100;          // side of one grid square

const LEFT_GUTTER   = CELL * 0.62;  // room for the up-axis numbers on the side
const BOTTOM_GUTTER = CELL * 0.58;  // room for the across-axis numbers along the base
const MARGIN_TOP    = CELL * 0.30;  // breathing room so the top line/number isn't clipped
const MARGIN_RIGHT  = CELL * 0.30;  // breathing room so the right line/number isn't clipped

const GRID_W        = CELL * 0.020; // pale squared-paper gridline stroke
const AXIS_W        = CELL * 0.045; // bold origin-axis stroke
const SHAPE_W       = CELL * 0.032; // shape outline stroke

const GRID_COLOUR   = '#AAB7C4';    // pale squared-paper lines
const AXIS_COLOUR   = '#333333';    // bold origin axes
const NUM_COLOUR    = '#1A1A1A';    // axis numbers — DARK, legible on white paper
const NUM_FONT      = CELL * 0.34;  // axis-number font size

const ORIG_OUTLINE  = '#0070C0';    // original shape outline (house blue, solid)
const ORIG_FILL     = '#CCE2F5';    // original shape fill (pale blue, solid)
const IMG_OUTLINE   = '#4D94D6';    // translated image outline (lighter blue, dashed)
const IMG_FILL      = '#EAF3FB';    // translated image fill (very pale blue)
const IMG_DASH      = CELL * 0.11;  // image outline dash length
const IMG_GAP       = CELL * 0.08;  // image outline dash gap

const ARROW_COLOUR  = '#555555';    // dashed translation arrow (neutral grey)

const { INK_TONES, printsInInk } = require('./surface-profiles');
// The photocopied pack's version. The original and its image were two blues;
// here the original is the darker fill with a solid outline and the image the
// paler fill with a dashed one, so the two still read apart at a glance.
const INK = { grid: INK_TONES.light, axis: INK_TONES.ink, num: INK_TONES.ink, origOutline: INK_TONES.ink, origFill: INK_TONES.light, imgOutline: INK_TONES.dark, imgFill: INK_TONES.pale, arrow: INK_TONES.dark };
const COLOURS = { grid: GRID_COLOUR, axis: AXIS_COLOUR, num: NUM_COLOUR, origOutline: ORIG_OUTLINE, origFill: ORIG_FILL, imgOutline: IMG_OUTLINE, imgFill: IMG_FILL, arrow: ARROW_COLOUR };
const ARROW_W       = CELL * 0.028; // arrow stroke
const ARROW_DASH    = CELL * 0.12;  // arrow dash length
const ARROW_GAP     = CELL * 0.09;  // arrow dash gap
const ARROW_HEAD    = CELL * 0.30;  // arrowhead length/width (userSpaceOnUse)

const FONT = 'Comic Sans MS, Comic Sans, Chalkboard SE, sans-serif';
// ─── END CONSTANTS ──────────────────────────────────────────────────────────

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function clampInt(v, dflt) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : dflt;
}

// Accept vertices as [{x, y}, …] (the coordinate-grid object form) OR [[x, y], …]
// (the terse pair form reflection-grid uses), so a designer can copy either from
// the board unchanged. Normalise to { x, y } objects and drop malformed points.
function resolvePoints(data) {
  if (!Array.isArray(data && data.points)) return [];
  return data.points
    .map(function (p) {
      if (Array.isArray(p)) return { x: Number(p[0]), y: Number(p[1]) };
      return p && { x: Number(p.x), y: Number(p.y) };
    })
    .filter(function (p) { return p && Number.isFinite(p.x) && Number.isFinite(p.y); });
}

function resolveTranslate(data) {
  const t = (data && data.translate) || {};
  const dx = Number(t.dx);
  const dy = Number(t.dy);
  return { dx: Number.isFinite(dx) ? dx : 0, dy: Number.isFinite(dy) ? dy : 0 };
}

function cacheKey(data) {
  const cols = clampInt(data.cols, 10);
  const rows = clampInt(data.rows, cols);
  const points = resolvePoints(data);
  const t = resolveTranslate(data);
  const arrowFrom = Number.isFinite(Number(data.arrowFrom)) ? Math.round(Number(data.arrowFrom)) : 0;
  const pk = points.map(function (p) { return p.x + ',' + p.y; }).join(' ');
  return 'translation-shape:' + cols + 'x' + rows + ':' +
    't' + t.dx + ',' + t.dy + ':' +
    (data.showImage ? 'i' : 'q') + ':a' + arrowFrom + ':' + pk;
}

// Build the SVG cropped tight to the grid plus its axis-number gutters — no padded
// square, no centring-in-deadspace. The drawn extent (grid + gutters) IS the box,
// exactly like coordinate-grid-svg.js, so every engine places it at true aspect.
// `profile` is optional: the stick-in pack passes its own so the grid prints in ink.
function tightSvg(data, profile) {
  const C = printsInInk(profile) ? INK : COLOURS;
  const cols = clampInt(data.cols, 10);
  const rows = clampInt(data.rows, cols);
  const points = resolvePoints(data);
  const t = resolveTranslate(data);
  const showImage = data.showImage === true;
  const arrowFrom = Number.isFinite(Number(data.arrowFrom)) ? Math.round(Number(data.arrowFrom)) : 0;

  const w = LEFT_GUTTER + cols * CELL + MARGIN_RIGHT;
  const h = MARGIN_TOP + rows * CELL + BOTTOM_GUTTER;
  const px = function (gx) { return LEFT_GUTTER + gx * CELL; };
  const py = function (gy) { return MARGIN_TOP + (rows - gy) * CELL; };   // y up from the bottom
  const f = function (n) { return n.toFixed(2); };

  const left = px(0), right = px(cols), top = py(rows), bottom = py(0);
  const polyPoints = function (pts) {
    return pts.map(function (p) { return f(px(p.x)) + ',' + f(py(p.y)); }).join(' ');
  };

  const parts = [];

  // Arrowhead marker for the translation arrow (drawn only when the image shows).
  if (showImage) {
    parts.push(
      `<defs><marker id="tsHead" markerUnits="userSpaceOnUse" markerWidth="${f(ARROW_HEAD)}" markerHeight="${f(ARROW_HEAD)}" refX="${f(ARROW_HEAD * 0.9)}" refY="${f(ARROW_HEAD / 2)}" orient="auto">` +
      `<path d="M0,0 L${f(ARROW_HEAD)},${f(ARROW_HEAD / 2)} L0,${f(ARROW_HEAD)} Z" fill="${C.arrow}"/></marker></defs>`
    );
  }

  // Translated image FIRST (so the solid original sits crisply on top), then the
  // grid, then the original — same layering discipline as reflection-grid.
  const image = points.map(function (p) { return { x: p.x + t.dx, y: p.y + t.dy }; });
  if (showImage && image.length >= 2) {
    parts.push(`<polygon points="${polyPoints(image)}" fill="${C.imgFill}" stroke="${C.imgOutline}" stroke-width="${f(SHAPE_W)}" stroke-dasharray="${f(IMG_DASH)},${f(IMG_GAP)}" stroke-linejoin="round" stroke-linecap="round"/>`);
  }

  // Pale squared-paper gridlines.
  for (let i = 0; i <= cols; i++) {
    parts.push(`<line x1="${f(px(i))}" y1="${f(top)}" x2="${f(px(i))}" y2="${f(bottom)}" stroke="${C.grid}" stroke-width="${f(GRID_W)}"/>`);
  }
  for (let j = 0; j <= rows; j++) {
    parts.push(`<line x1="${f(left)}" y1="${f(py(j))}" x2="${f(right)}" y2="${f(py(j))}" stroke="${C.grid}" stroke-width="${f(GRID_W)}"/>`);
  }

  // Bold origin axes (x = 0 up the left, y = 0 along the bottom).
  parts.push(`<line x1="${f(left)}" y1="${f(bottom)}" x2="${f(right)}" y2="${f(bottom)}" stroke="${C.axis}" stroke-width="${f(AXIS_W)}" stroke-linecap="round"/>`);
  parts.push(`<line x1="${f(left)}" y1="${f(top)}" x2="${f(left)}" y2="${f(bottom)}" stroke="${C.axis}" stroke-width="${f(AXIS_W)}" stroke-linecap="round"/>`);

  // Axis numbers, centred on each gridline: across below the base, up to the left.
  for (let i = 0; i <= cols; i++) {
    parts.push(`<text x="${f(px(i))}" y="${f(bottom + BOTTOM_GUTTER * 0.55)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${f(NUM_FONT)}" font-weight="bold" fill="${C.num}">${escapeXml(i)}</text>`);
  }
  for (let j = 0; j <= rows; j++) {
    parts.push(`<text x="${f(left - LEFT_GUTTER * 0.42)}" y="${f(py(j))}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${f(NUM_FONT)}" font-weight="bold" fill="${C.num}">${escapeXml(j)}</text>`);
  }

  // Original shape, on top of the grid — the shape a child reads and works from.
  if (points.length >= 2) {
    parts.push(`<polygon points="${polyPoints(points)}" fill="${C.origFill}" stroke="${C.origOutline}" stroke-width="${f(SHAPE_W)}" stroke-linejoin="round" stroke-linecap="round"/>`);
  }

  // Dashed translation arrow from one original vertex to its matching image vertex
  // — drawn last so it reads clearly over both shapes, making the slide (and that
  // every corner moves the same way) visible.
  if (showImage && points.length >= 1 && (t.dx !== 0 || t.dy !== 0)) {
    const idx = Math.max(0, Math.min(points.length - 1, arrowFrom));
    const a = points[idx];
    const b = image[idx];
    parts.push(`<line x1="${f(px(a.x))}" y1="${f(py(a.y))}" x2="${f(px(b.x))}" y2="${f(py(b.y))}" stroke="${C.arrow}" stroke-width="${f(ARROW_W)}" stroke-dasharray="${f(ARROW_DASH)},${f(ARROW_GAP)}" stroke-linecap="round" marker-end="url(#tsHead)"/>`);
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h };
}

// The numbered grid is correct at teaching size but the numbers and lattice
// become noise inline. Keep the invariant the step needs: one whole shape moves
// unchanged, and every point follows the same arrow.
function translationCueSvg() {
  const w = 250, h = 150;
  const parts = [
    '<defs><marker id="tsCueHead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#555555"/></marker></defs>',
    `<polygon points="22,116 70,116 70,68" fill="${ORIG_FILL}" stroke="${ORIG_OUTLINE}" stroke-width="7" stroke-linejoin="round"/>`,
    `<polygon points="176,76 224,76 224,28" fill="${IMG_FILL}" stroke="${IMG_OUTLINE}" stroke-width="7" stroke-dasharray="12,9" stroke-linejoin="round"/>`,
    '<line x1="70" y1="68" x2="176" y2="28" stroke="#555555" stroke-width="7" stroke-dasharray="12,9" stroke-linecap="round" marker-end="url(#tsCueHead)"/>'
  ];
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg, translationCueSvg, cacheKey };
