'use strict';

// SHARED coordinate-grid geometry — the single source of truth for a NUMBERED
// first-quadrant coordinate grid, the way Year 3–6 children meet it: squared
// paper from the origin (0,0), numbered along the bottom (across) and up the left
// (up), a BLANK grid a child plots on. Imported by every PAPER engine that draws
// it (today the stick-in pack); the SLIDE helper
// (builder/src/content/coordinate-grid.js) draws the IDENTICAL look via its own
// vector primitives. This module produces ONLY the SVG and its true aspect, so
// each engine places it tight (NO DEADSPACE) — the drawn grid IS the tight box,
// no padded square, no centring-in-deadspace (mirrors reflection-grid-svg.js).
//
//   tightSvg(spec) → { svg, aspect, w, h }   cropped tight to the grid's bounds
//   cacheKey(spec) → string                  stable pre-render cache key
//
// Coordinates run x ACROSS (0 = left) and y UP (0 = bottom), the way a child
// plots on squared paper. Gridlines sit at every whole position 0..cols across
// and 0..rows up, so a `cols`×`rows` grid has (cols+1)×(rows+1) lines meeting at
// its corners. Cells are always square so the grid reads true. The origin axes
// (x = 0 and y = 0) are drawn bold; the interior lines pale, like squared paper.
//
// Spec:
//   cols      grid runs 0..cols across the bottom (default 10)
//   rows      grid runs 0..rows up the side (default cols)
//   max       slide-compatible shorthand for equal x/y maxima
//   xMax/yMax slide-compatible overrides for cols/rows
//   points    [{ x, y, label }]  OPTIONAL plotted points, for an answer copy or
//             parity with the slide helper. label is the letter/pair shown beside
//             the dot. The STICK-IN use is blank (no points): the child plots.
//   join      true = join the points in order into a closed shape (default false)
//   route     [x,y] OPTIONAL across-then-up plotting route from the origin to a
//             point. Used full-size for modelling and number-free for the small
//             Success Criteria Helper treatment.
//   numbers   false hides axis numbers and their gutters. Keep the default true
//             at teaching size; false exists for the tiny inline treatment.

// ─── CONSTANTS (geometry units; the whole drawing scales on placement) ──────
const CELL          = 100;          // side of one grid square

const LEFT_GUTTER   = CELL * 0.62;  // room for the up-axis numbers on the side
const BOTTOM_GUTTER = CELL * 0.58;  // room for the across-axis numbers along the base
const MARGIN_TOP    = CELL * 0.30;  // breathing room so the top line/number isn't clipped
const MARGIN_RIGHT  = CELL * 0.30;  // breathing room so the right line/number isn't clipped

const GRID_W        = CELL * 0.020; // pale squared-paper gridline stroke
const AXIS_W        = CELL * 0.045;  // bold origin-axis stroke
const POINT_R       = CELL * 0.055; // plotted-dot radius
const SHAPE_W       = CELL * 0.030; // joined-shape outline stroke

const GRID_COLOUR   = '#AAB7C4';    // pale squared-paper lines
const AXIS_COLOUR   = '#333333';    // bold origin axes
const NUM_COLOUR    = '#1A1A1A';    // axis numbers — DARK, legible on white paper
const NUM_FONT      = CELL * 0.34;  // axis-number font size
const POINT_COLOUR  = '#C00000';    // plotted points in red so they pop off the grid
const SHAPE_OUTLINE = '#0070C0';    // joined-shape outline (house blue)
const SHAPE_FILL    = '#CCE2F5';    // joined-shape fill (pale blue)
const LABEL_COLOUR  = '#C00000';    // point-letter colour (matches the dot)
const ROUTE_COLOUR  = '#0070C0';    // across-then-up modelling route
const ROUTE_W       = CELL * 0.055; // heavier than the grid so it survives inline
const LABEL_FONT    = CELL * 0.40;  // point-letter font size
const LABEL_OFF     = CELL * 0.10;  // label offset from the dot
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

function resolvePoints(data) {
  return Array.isArray(data && data.points) ? data.points : [];
}

function resolveRoute(data, cols, rows) {
  const raw = data && data.route;
  const x = Array.isArray(raw) ? Number(raw[0]) : Number(raw && raw.x);
  const y = Array.isArray(raw) ? Number(raw[1]) : Number(raw && raw.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x: Math.max(0, Math.min(cols, x)), y: Math.max(0, Math.min(rows, y)) };
}

function resolveGridSize(data) {
  data = data || {};
  // `cols`/`rows` are the shared SVG names. `max`/`xMax`/`yMax` are the
  // established slide-JSON names; accepting both lets the slide renderer use
  // this shared geometry without rewriting existing lesson files.
  const base = data.max != null
    ? clampInt(data.max, 10)
    : clampInt(data.cols, 10);
  return {
    cols: clampInt(data.xMax, clampInt(data.cols, base)),
    rows: clampInt(data.yMax, clampInt(data.rows, base))
  };
}

function cacheKey(data) {
  data = data || {};
  const size = resolveGridSize(data);
  const cols = size.cols;
  const rows = size.rows;
  const points = resolvePoints(data);
  const route = resolveRoute(data, cols, rows);
  const pk = points
    .map(function (p) { return p.x + ',' + p.y + (p.label != null ? ':' + p.label : ''); })
    .join(' ');
  const rk = route ? route.x + ',' + route.y : '-';
  return 'coordinate-grid:' + cols + 'x' + rows + ':' +
    (data.numbers === false ? 'n0' : 'n1') + ':' +
    (data.join ? 'j' : 'p') + ':' + pk + ':route:' + rk;
}

// Build the SVG cropped tight to the grid plus its axis-number gutters — no padded
// square, no centring-in-deadspace. The drawn extent (grid + gutters) IS the box.
function tightSvg(data) {
  data = data || {};
  const size = resolveGridSize(data);
  const cols = size.cols;
  const rows = size.rows;
  const points = resolvePoints(data);
  const route = resolveRoute(data, cols, rows);
  const showNumbers = data.numbers !== false;

  const leftGutter = showNumbers ? LEFT_GUTTER : MARGIN_RIGHT;
  const bottomGutter = showNumbers ? BOTTOM_GUTTER : MARGIN_TOP;
  const w = leftGutter + cols * CELL + MARGIN_RIGHT;
  const h = MARGIN_TOP + rows * CELL + bottomGutter;
  const px = function (gx) { return leftGutter + gx * CELL; };
  const py = function (gy) { return MARGIN_TOP + (rows - gy) * CELL; };   // y up from the bottom
  const f = function (n) { return n.toFixed(2); };

  const left = px(0), right = px(cols), top = py(rows), bottom = py(0);
  const parts = [];
  if (route) {
    parts.push('<defs><marker id="plot-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#0070C0"/></marker></defs>');
  }

  // Joined shape first (answer copy), so the grid and dots sit crisply on top.
  if (data.join && points.length >= 2) {
    const d = points.map(function (p) { return f(px(p.x)) + ',' + f(py(p.y)); }).join(' ');
    parts.push(`<polygon points="${d}" fill="${SHAPE_FILL}" stroke="${SHAPE_OUTLINE}" stroke-width="${f(SHAPE_W)}" stroke-linejoin="round" stroke-linecap="round"/>`);
  }

  // Pale squared-paper gridlines.
  for (let i = 0; i <= cols; i++) {
    parts.push(`<line x1="${f(px(i))}" y1="${f(top)}" x2="${f(px(i))}" y2="${f(bottom)}" stroke="${GRID_COLOUR}" stroke-width="${f(GRID_W)}"/>`);
  }
  for (let j = 0; j <= rows; j++) {
    parts.push(`<line x1="${f(left)}" y1="${f(py(j))}" x2="${f(right)}" y2="${f(py(j))}" stroke="${GRID_COLOUR}" stroke-width="${f(GRID_W)}"/>`);
  }

  // Bold origin axes (x = 0 up the left, y = 0 along the bottom).
  parts.push(`<line x1="${f(left)}" y1="${f(bottom)}" x2="${f(right)}" y2="${f(bottom)}" stroke="${AXIS_COLOUR}" stroke-width="${f(AXIS_W)}" stroke-linecap="round"/>`);
  parts.push(`<line x1="${f(left)}" y1="${f(top)}" x2="${f(left)}" y2="${f(bottom)}" stroke="${AXIS_COLOUR}" stroke-width="${f(AXIS_W)}" stroke-linecap="round"/>`);

  // A simple two-move route: across first, then up. Both legs have arrowheads
  // so the order remains visible when the numbered full-size grid is reduced
  // to the number-free Success Criteria Helper treatment.
  if (route) {
    const turnX = px(route.x);
    if (route.x > 0) {
      parts.push(`<line x1="${f(left)}" y1="${f(bottom)}" x2="${f(turnX)}" y2="${f(bottom)}" stroke="${ROUTE_COLOUR}" stroke-width="${f(ROUTE_W)}" stroke-linecap="round" marker-end="url(#plot-arrow)"/>`);
    }
    if (route.y > 0) {
      parts.push(`<line x1="${f(turnX)}" y1="${f(bottom)}" x2="${f(turnX)}" y2="${f(py(route.y))}" stroke="${ROUTE_COLOUR}" stroke-width="${f(ROUTE_W)}" stroke-linecap="round" marker-end="url(#plot-arrow)"/>`);
    }
    parts.push(`<circle cx="${f(turnX)}" cy="${f(py(route.y))}" r="${f(POINT_R * 1.15)}" fill="${POINT_COLOUR}"/>`);
  }

  // Axis numbers, centred on each gridline: across below the base, up to the left.
  if (showNumbers) {
    for (let i = 0; i <= cols; i++) {
      parts.push(`<text x="${f(px(i))}" y="${f(bottom + bottomGutter * 0.55)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${f(NUM_FONT)}" font-weight="bold" fill="${NUM_COLOUR}">${escapeXml(i)}</text>`);
    }
    for (let j = 0; j <= rows; j++) {
      parts.push(`<text x="${f(left - leftGutter * 0.42)}" y="${f(py(j))}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${f(NUM_FONT)}" font-weight="bold" fill="${NUM_COLOUR}">${escapeXml(j)}</text>`);
    }
  }

  // Plotted points and their letters (answer copy / parity only; blank by default).
  points.forEach(function (p) {
    const cx = px(p.x), cy = py(p.y);
    parts.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(POINT_R)}" fill="${POINT_COLOUR}"/>`);
    if (p.label != null && String(p.label).length) {
      parts.push(`<text x="${f(cx + POINT_R + LABEL_OFF)}" y="${f(cy - POINT_R - LABEL_OFF)}" text-anchor="start" dominant-baseline="auto" font-family="${FONT}" font-size="${f(LABEL_FONT)}" font-weight="bold" fill="${LABEL_COLOUR}">${escapeXml(p.label)}</text>`);
    }
  });

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg, cacheKey };
