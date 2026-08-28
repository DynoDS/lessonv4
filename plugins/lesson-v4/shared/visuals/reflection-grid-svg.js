'use strict';

// SHARED reflection-grid geometry — the single source of truth for a dot
// lattice with a dashed mirror line and a shape on one side, for "reflect this
// shape in the mirror line" symmetry work. Imported by every PAPER/WALL engine
// that draws it (worksheets, stick-in sheets, the working wall); the SLIDE
// helper (builder/src/content/reflection-grid.js) draws the IDENTICAL geometry
// via its own vector primitives. This module produces ONLY the SVG and its true
// aspect, so each engine places it tight (NO DEADSPACE) — the grid IS the tight
// box, no padded square, no centring-in-deadspace (mirrors geoboard-svg.js).
//
//   tightSvg(spec) → { svg, aspect, w, h }   cropped tight to the grid's bounds
//   cacheKey(spec) → string                  stable pre-render cache key
//
// Coordinates run x ACROSS (0 = left) and y UP (0 = bottom), the way a child
// plots on squared/dotty paper. Dots sit at every whole position 0..cols across
// and 0..rows up, so a `cols`×`rows` grid has (cols+1)×(rows+1) dots. Cells are
// always square so a reflection lands a true equal distance the other side.
//
// Spec:
//   cols, rows      grid size in squares (default 10 × 8) — dots at 0..cols, 0..rows.
//   mirror          { orientation, at }
//                     orientation  "vertical"      (a line straight up the grid)
//                                  "horizontal"    (a line straight across)
//                                  "diagonal-up"   (bottom-left → top-right, slope +1)
//                                  "diagonal-down" (top-left → bottom-right, slope −1)
//                     at           the line's position in grid squares.
//                                  vertical:      x = at
//                                  horizontal:    y = at
//                                  diagonal-up:   the line y = x + at  (at = intercept)
//                                  diagonal-down: the line y = −x + at (at = intercept)
//                                  The diagonal `at` placements that keep lattice
//                                  points on lattice points are whole numbers, so
//                                  the reflected shape lands exactly on dots.
//   shape           [[x, y], …] the starting shape's vertices, joined in order.
//   showReflection  true = also draw the reflected shape in green (answer copy).

// ─── CONSTANTS (geometry units; the whole drawing scales on placement) ────
const CELL          = 100;          // distance between adjacent dots
const DOT_R         = CELL * 0.045; // muted grid-dot radius
const MARGIN        = CELL * 0.22;  // breathing room so edge dots/strokes aren't clipped
const MIRROR_W      = CELL * 0.030; // dashed mirror-line stroke
const MIRROR_DASH   = CELL * 0.13;  // dash length
const MIRROR_GAP    = CELL * 0.10;  // gap between dashes
const SHAPE_W       = CELL * 0.030; // shape outline stroke

const DOT_COLOUR     = '#9DB0C4';   // muted grid dots (matches geoboard pegs)
const MIRROR_COLOUR  = '#C00000';   // red dashed mirror line
const SHAPE_OUTLINE  = '#0070C0';   // house blue starting-shape outline
const SHAPE_FILL     = '#CCE2F5';   // pale blue starting shape
const REFLECT_OUTLINE = '#00B050';  // house answer-green reflected outline
const REFLECT_FILL    = '#D5F5E3';  // pale green reflected shape (answer)
// ─── END CONSTANTS ────────────────────────────────────────────────────────

function clampInt(v, dflt) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : dflt;
}

// Normalise the spec's mirror into { orientation, at }. Defaults to a vertical
// line down the middle of the grid, matching the slide helper.
function resolveMirror(data, cols, rows) {
  const m = (data && data.mirror) || {};
  let orientation = String(m.orientation || 'vertical');
  if (!['vertical', 'horizontal', 'diagonal-up', 'diagonal-down'].includes(orientation)) {
    orientation = 'vertical';
  }
  let at = Number(m.at);
  if (!Number.isFinite(at)) {
    // Sensible default per orientation so an `at`-less mirror still draws.
    if (orientation === 'vertical') at = Math.round(cols / 2);
    else if (orientation === 'horizontal') at = Math.round(rows / 2);
    else if (orientation === 'diagonal-up') at = 0;          // y = x
    else at = rows;                                          // y = −x + rows (corner to corner)
  }
  return { orientation: orientation, at: at };
}

// Reflect a grid point [x, y] across the mirror, in GRID space (x across, y up).
// The lattice-preserving maps (verified): across y = x + c, (x,y) → (y − c, x + c);
// across y = −x + c, (x,y) → (c − y, c − x). Vertical/horizontal are the usual
// 2·at − coordinate reflections.
function reflectPoint(pt, mirror) {
  const x = pt[0], y = pt[1], c = mirror.at;
  switch (mirror.orientation) {
    case 'horizontal':    return [x, 2 * c - y];
    case 'diagonal-up':   return [y - c, x + c];
    case 'diagonal-down': return [c - y, c - x];
    case 'vertical':
    default:              return [2 * c - x, y];
  }
}

function resolveShape(data) {
  return Array.isArray(data.shape) ? data.shape : [];
}

function cacheKey(data) {
  const cols = clampInt(data.cols, 10);
  const rows = clampInt(data.rows, 8);
  const mirror = resolveMirror(data, cols, rows);
  const shape = resolveShape(data);
  const sk = shape.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
  return 'reflection-grid:' + cols + 'x' + rows + ':' +
    mirror.orientation + '@' + mirror.at + ':' +
    (data.showReflection ? 'r' : 'q') + ':' + sk;
}

// Build the SVG cropped tight to the grid's bounding box (the dots plus their
// margin). The grid is always the full dot rectangle, so the tight box is the
// grid itself — no padded square, no centring-in-deadspace.
function tightSvg(data) {
  const cols = clampInt(data.cols, 10);
  const rows = clampInt(data.rows, 8);
  const mirror = resolveMirror(data, cols, rows);
  const shape = resolveShape(data);

  const w = cols * CELL + 2 * MARGIN;
  const h = rows * CELL + 2 * MARGIN;
  const px = function (gx) { return MARGIN + gx * CELL; };
  const py = function (gy) { return MARGIN + (rows - gy) * CELL; };   // y up from the bottom
  const f = function (n) { return n.toFixed(2); };

  const polyPoints = function (pts) {
    return pts.map(function (p) { return f(px(p[0])) + ',' + f(py(p[1])); }).join(' ');
  };

  const parts = [];

  // Reflected shape first (answer), so the original sits crisply on top.
  if (data.showReflection && shape.length >= 2) {
    const reflected = shape.map(function (p) { return reflectPoint(p, mirror); });
    const d = polyPoints(reflected);
    parts.push(`<polygon points="${d}" fill="${REFLECT_FILL}" stroke="${REFLECT_OUTLINE}" stroke-width="${f(SHAPE_W)}" stroke-linejoin="round" stroke-linecap="round"/>`);
  }

  // Dot grid.
  for (let i = 0; i <= cols; i++) {
    for (let j = 0; j <= rows; j++) {
      parts.push(`<circle cx="${f(px(i))}" cy="${f(py(j))}" r="${f(DOT_R)}" fill="${DOT_COLOUR}"/>`);
    }
  }

  // Mirror line, dashed — clipped to the grid rectangle for the diagonals so it
  // never overshoots the dot field.
  const mline = mirrorEndpoints(mirror, cols, rows);
  if (mline) {
    parts.push(`<line x1="${f(px(mline[0][0]))}" y1="${f(py(mline[0][1]))}" x2="${f(px(mline[1][0]))}" y2="${f(py(mline[1][1]))}" stroke="${MIRROR_COLOUR}" stroke-width="${f(MIRROR_W)}" stroke-dasharray="${f(MIRROR_DASH)},${f(MIRROR_GAP)}" stroke-linecap="round"/>`);
  }

  // Starting shape, on top.
  if (shape.length >= 2) {
    const d = polyPoints(shape);
    parts.push(`<polygon points="${d}" fill="${SHAPE_FILL}" stroke="${SHAPE_OUTLINE}" stroke-width="${f(SHAPE_W)}" stroke-linejoin="round" stroke-linecap="round"/>`);
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h };
}

// Success Criteria slots are too narrow for the full dot grid to remain
// legible. Keep the same semantic geometry - original shape, mirror line and
// reflected image - but deliberately omit the lattice and use heavier strokes.
function reflectionCueSvg() {
  const w = 250;
  const h = 150;
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polygon points="20,125 94,125 94,47" fill="${SHAPE_FILL}" stroke="${SHAPE_OUTLINE}" stroke-width="8" stroke-linejoin="round"/><line x1="125" y1="12" x2="125" y2="138" stroke="${MIRROR_COLOUR}" stroke-width="8" stroke-dasharray="16,11" stroke-linecap="round"/><polygon points="230,125 156,125 156,47" fill="${REFLECT_FILL}" stroke="${REFLECT_OUTLINE}" stroke-width="8" stroke-linejoin="round"/></svg>`;
  return { svg, aspect: w / h, w, h };
}

// The mirror line's two endpoints in GRID coordinates, clipped to the grid
// rectangle [0..cols] × [0..rows]. Vertical/horizontal span the full edge; the
// diagonals are clipped where the slanted line crosses the grid boundary so the
// drawn segment stays inside the dot field.
function mirrorEndpoints(mirror, cols, rows) {
  const at = mirror.at;
  if (mirror.orientation === 'vertical') {
    const x = Math.max(0, Math.min(cols, at));
    return [[x, 0], [x, rows]];
  }
  if (mirror.orientation === 'horizontal') {
    const y = Math.max(0, Math.min(rows, at));
    return [[0, y], [cols, y]];
  }
  if (mirror.orientation === 'diagonal-up') {
    // Line y = x + at, clipped to the grid box.
    return clipLine(function (x) { return x + at; }, cols, rows);
  }
  if (mirror.orientation === 'diagonal-down') {
    // Line y = −x + at, clipped to the grid box.
    return clipLine(function (x) { return -x + at; }, cols, rows);
  }
  return null;
}

// Clip a line y = fn(x) (slope ±1) to the rectangle [0..cols]×[0..rows], returning
// its two boundary-crossing endpoints, or null if it misses the box entirely.
function clipLine(fn, cols, rows) {
  const pts = [];
  const add = function (x, y) {
    if (x >= -1e-6 && x <= cols + 1e-6 && y >= -1e-6 && y <= rows + 1e-6) {
      pts.push([Math.max(0, Math.min(cols, x)), Math.max(0, Math.min(rows, y))]);
    }
  };
  // Cross the two vertical edges (x = 0, x = cols)…
  add(0, fn(0));
  add(cols, fn(cols));
  // …and the two horizontal edges (y = 0, y = rows). For slope ±1, x = ±(y − c).
  // Solve fn(x) = y → for slope +1: x = y − at; slope −1: x = at − y. Derive from
  // two sample points rather than re-deriving the intercept here.
  const slope = fn(1) - fn(0);
  const intercept = fn(0);
  const xForY = function (y) { return (y - intercept) / slope; };
  add(xForY(0), 0);
  add(xForY(rows), rows);
  // De-duplicate near-identical corner hits, keep the two extreme points.
  const uniq = [];
  pts.forEach(function (p) {
    if (!uniq.some(function (q) { return Math.abs(q[0] - p[0]) < 1e-4 && Math.abs(q[1] - p[1]) < 1e-4; })) {
      uniq.push(p);
    }
  });
  if (uniq.length < 2) return null;
  // Take the pair with the greatest separation (the true entry/exit points).
  let best = [uniq[0], uniq[1]], bestD = -1;
  for (let a = 0; a < uniq.length; a++) {
    for (let b = a + 1; b < uniq.length; b++) {
      const d = Math.hypot(uniq[a][0] - uniq[b][0], uniq[a][1] - uniq[b][1]);
      if (d > bestD) { bestD = d; best = [uniq[a], uniq[b]]; }
    }
  }
  return best;
}

module.exports = { tightSvg, reflectionCueSvg, cacheKey, reflectPoint, resolveMirror };
