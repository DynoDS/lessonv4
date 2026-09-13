'use strict';

// SHARED grid-map geometry — the single source of truth for a schematic
// river-town map drawn on a NUMBERED FOUR-FIGURE GRID, the kind a Year 4 child
// reads human/physical features and four-figure grid references off. Imported by
// every engine that draws it (slides, worksheets, working wall, stick-in pack);
// it produces ONLY the SVG and its true aspect, so each engine places it tight
// (NO DEADSPACE) however it embeds images. The geometry is written once here.
//
//   tightSvg(spec) → { svg, aspect, w, h }   cropped tight to the map's bounds
//   cacheKey(spec) → string                  stable pre-render cache key
//
// THE LOAD-BEARING RULE — this is the whole point of the lesson, so the drawing
// gets it exactly right. A four-figure grid reference names the BOTTOM-LEFT
// corner of a square, read ALONG the bottom first, then UP the side. So the grid
// numbers label the grid LINES at the corners (NOT floating in the centre of a
// square): the easting "32" sits on its vertical line, the northing "51" on its
// horizontal line, and the square referenced by "32 51" is the cell sitting
// UP-AND-TO-THE-RIGHT of where those two lines cross. A feature whose square is
// [32, 51] is drawn in exactly that cell. The optional highlightSquare ring lands
// on that same bottom-left corner, because the Teach slide points to that corner
// while saying "along the corridor, then up the stairs". If the numbers were
// centred in cells instead of on the lines, the lesson's core method becomes
// unteachable — so the corner/line placement is non-negotiable.
//
// Spec:
//   eastings        the numbers along the BOTTOM, one per VERTICAL grid line,
//                   left → right (e.g. [31, 32, 33, 34, 35, 36]). Consecutive
//                   whole numbers. N lines bound N−1 columns of cells.
//   northings       the numbers up the SIDE, one per HORIZONTAL grid line,
//                   bottom → top (e.g. [51, 52, 53, 54, 55]). N lines bound
//                   N−1 rows of cells.
//   river           the path of the blue river, a list of [easting, northing]
//                   points in grid VALUES (fractions allowed, e.g. [31.3, 54.7]),
//                   drawn as a smooth curve from a source (top-left) down and off
//                   an edge (bottom-right) with a visible meander/bend.
//   roads           optional list of paths, each a list of [easting, northing]
//                   points, drawn as a solid grey road (e.g. one crossing the
//                   lower squares). Same coordinate convention as the river.
//   features        list of { name, square: [easting, northing], type, icon? }.
//                   The feature is drawn INSIDE the cell whose BOTTOM-LEFT corner
//                   is at (easting, northing) — i.e. the cell up-and-right of that
//                   crossing — with its name labelled legibly. `type` is
//                   "physical" | "human" (the answer the CHILD decides), so the
//                   drawing keeps every marker and label the SAME neutral ink: it
//                   never colour-codes the answer away. `icon` is an optional
//                   short glyph drawn above the name; omit it and a neutral dot is
//                   drawn instead.
//   highlightSquare optional [easting, northing] — a ring is drawn on the
//                   BOTTOM-LEFT corner of this square, for the Teach slide that
//                   models reading a reference off that exact corner.

// ─── CONSTANTS (geometry units; the whole drawing scales on placement) ──────
const CELL          = 100;          // side of one grid square

const MARGIN_LEFT   = CELL * 0.62;  // room for the northing numbers on the side
const MARGIN_BOTTOM = CELL * 0.58;  // room for the easting numbers along the base
// Exactly half the grid-number's text box, because that is all that sticks up:
// the top northing sits centred ON the top grid line (dominant-baseline
// central), so its box rises NUM half a font above the line and nothing rises
// further. This was CELL * 0.30 as generic "breathing room", and the extra was
// 1.5mm of blank sky at printed size - enough that a question column beside the
// map visibly started higher than the map did. Tight-cropped means the map's
// ink meets the top of its slot the way every other figure's does.
const MARGIN_TOP    = CELL * 0.17;
const MARGIN_RIGHT  = CELL * 0.30;  // breathing room so the right line isn't clipped

const LAND_FILL     = '#F2F6EC';    // faint land tint so the grid reads as a map
const GRID_COLOUR   = '#8A97A6';    // grid lines — visible, but the features read on top
const GRID_W        = CELL * 0.022; // grid-line stroke
const NUM_COLOUR    = '#1A1A1A';    // grid numbers — DARK (the river owns the blue)
const NUM_FONT      = CELL * 0.34;  // grid-number font size

const RIVER_COLOUR  = '#3B8FD1';    // house water blue
const RIVER_W       = CELL * 0.11;  // river stroke (a clear ribbon of water)
const ROAD_COLOUR   = '#6B6B6B';    // a tarmac grey, distinct from the blue river
const ROAD_W        = CELL * 0.055; // road stroke

const MARK_COLOUR   = '#333333';    // feature marker + label — ONE neutral ink
const MARK_R        = CELL * 0.055; // feature marker dot radius
const LABEL_FONT    = CELL * 0.165; // feature-label font ceiling (shrinks to fit)
const LABEL_FONT_MIN= CELL * 0.115; // feature-label font floor
const ICON_FONT     = CELL * 0.30;  // optional feature icon glyph

const RING_COLOUR   = '#E8821E';    // warm highlight ring — pops off blue/grey
const RING_W        = CELL * 0.075; // ring stroke
const RING_R        = CELL * 0.27;  // ring radius on the corner
// ─── END CONSTANTS ──────────────────────────────────────────────────────────

const FONT = 'Comic Sans MS, Comic Sans, Chalkboard SE, sans-serif';

const { INK_TONES, printsInInk } = require('./surface-profiles');

// The photocopied pack's version. The land tint goes, because a grey wash only
// dims the grid a child reads references off. The river stays a wide pale ribbon
// and the road a thin dark line, so the two still read apart by width and tone
// rather than by blue against grey.
const COLOURS = { land: LAND_FILL, grid: GRID_COLOUR, river: RIVER_COLOUR, road: ROAD_COLOUR, ring: RING_COLOUR };
const INK = { land: INK_TONES.paper, grid: INK_TONES.mid, river: INK_TONES.light, road: INK_TONES.dark, ring: INK_TONES.ink };

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function f(n) { return Number(n).toFixed(2); }

function asNumbers(arr, dflt) {
  const a = Array.isArray(arr) ? arr.map(Number).filter(Number.isFinite) : [];
  return a.length >= 2 ? a : dflt;
}

// Normalise the spec to the values the drawing needs. The grid numbers have NO
// default: they are the lesson's content, not decoration, and the questions on
// the sheet name them ("What is at 3454?"). A fallback here once meant a spec
// that forgot its numbers silently drew the documentation's example map - the
// same 31-36/51-55 river every time - and nothing anywhere said the map and its
// questions had come apart. A map without its numbers is refused by name
// instead, at build time, where the designer who owns the spec can fix it.
function resolve(data) {
  const eastings  = asNumbers(data && data.eastings,  null);
  const northings = asNumbers(data && data.northings, null);
  if (!eastings || !northings) {
    throw new Error(
      "grid-map needs its grid numbers: `eastings` (2+ consecutive numbers along " +
        "the bottom) and `northings` (2+ up the side). There is no default map - " +
        "choose numbers from the lesson, matching the references its questions use."
    );
  }
  const E0 = eastings[0];
  const N0 = northings[0];
  const nx = eastings.length - 1;   // columns of cells
  const ny = northings.length - 1;  // rows of cells
  const river    = Array.isArray(data && data.river) ? data.river : [];
  const roads    = Array.isArray(data && data.roads) ? data.roads : [];
  const features = Array.isArray(data && data.features) ? data.features : [];
  const highlight = Array.isArray(data && data.highlightSquare) ? data.highlightSquare : null;
  return { eastings, northings, E0, N0, nx, ny, river, roads, features, highlight };
}

function cacheKey(data) {
  const s = resolve(data);
  // Compact, stable signature: a distinct map → a distinct key. Maps are usually
  // unique per lesson, so a JSON-ish digest of the load-bearing fields is enough.
  const feat = s.features.map(function (ft) {
    const sq = Array.isArray(ft.square) ? ft.square.join(',') : '';
    return (ft.name || '') + '@' + sq + ':' + (ft.type || '') + ':' + (ft.icon || '');
  }).join('|');
  const riv = s.river.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
  const rd = s.roads.map(function (path) {
    return (Array.isArray(path) ? path.map(function (p) { return p[0] + ',' + p[1]; }).join(' ') : '');
  }).join(';');
  const hl = s.highlight ? s.highlight.join(',') : '';
  return 'grid-map:' + s.eastings.join('-') + '/' + s.northings.join('-') +
    ':R[' + riv + ']:D[' + rd + ']:F[' + feat + ']:H[' + hl + ']';
}

// Build the SVG cropped tight to the map's bounding box (the grid plus its number
// margins). The whole drawn thing IS the tight box — no padded square, no
// centring-in-deadspace.
// `profile` is optional: the stick-in pack passes its own so the map prints in ink.
function tightSvg(data, profile) {
  const C = printsInInk(profile) ? INK : COLOURS;
  const s = resolve(data);
  const { eastings, northings, E0, N0, nx, ny } = s;

  const gridW = nx * CELL;
  const gridH = ny * CELL;
  const w = MARGIN_LEFT + gridW + MARGIN_RIGHT;
  const h = MARGIN_TOP + gridH + MARGIN_BOTTOM;

  // Grid VALUE → pixel. gx/gy are in line-index units (0..nx, 0..ny); fractions
  // allowed so the river can wind between lines. y runs UP the way a child reads.
  const px = function (gx) { return MARGIN_LEFT + gx * CELL; };
  const py = function (gy) { return MARGIN_TOP + (ny - gy) * CELL; };
  // Absolute easting/northing value → line index (eastings are consecutive).
  const ix = function (e) { return e - E0; };
  const iy = function (n) { return n - N0; };

  const parts = [];

  // ── Faint land tint over the grid rectangle, so the map reads as a map and the
  //    river/features sit on land rather than floating on the slide. Margins stay
  //    transparent (no deadspace fill).
  parts.push(`<rect x="${f(px(0))}" y="${f(py(ny))}" width="${f(gridW)}" height="${f(gridH)}" fill="${C.land}"/>`);

  // ── Grid lines. Vertical line per easting, horizontal line per northing. The
  //    crossings ARE the corners a reference names, so they must read clearly.
  for (let i = 0; i <= nx; i++) {
    parts.push(`<line x1="${f(px(i))}" y1="${f(py(0))}" x2="${f(px(i))}" y2="${f(py(ny))}" stroke="${C.grid}" stroke-width="${f(GRID_W)}"/>`);
  }
  for (let j = 0; j <= ny; j++) {
    parts.push(`<line x1="${f(px(0))}" y1="${f(py(j))}" x2="${f(px(nx))}" y2="${f(py(j))}" stroke="${C.grid}" stroke-width="${f(GRID_W)}"/>`);
  }

  // ── Roads UNDER the river (a bridge reads as river-over-road), solid grey.
  for (const path of s.roads) {
    const pts = (Array.isArray(path) ? path : [])
      .filter(function (p) { return Array.isArray(p) && p.length >= 2; })
      .map(function (p) { return { x: px(ix(p[0])), y: py(iy(p[1])) }; });
    if (pts.length >= 2) {
      parts.push(`<path d="${smoothPath(pts)}" fill="none" stroke="${C.road}" stroke-width="${f(ROAD_W)}" stroke-linecap="round" stroke-linejoin="round"/>`);
    }
  }

  // ── River, a smooth blue ribbon with its meander.
  const riverPts = s.river
    .filter(function (p) { return Array.isArray(p) && p.length >= 2; })
    .map(function (p) { return { x: px(ix(p[0])), y: py(iy(p[1])) }; });
  if (riverPts.length >= 2) {
    parts.push(`<path d="${smoothPath(riverPts)}" fill="none" stroke="${C.river}" stroke-width="${f(RIVER_W)}" stroke-linecap="round" stroke-linejoin="round"/>`);
  }

  // ── Features. Each sits inside the cell up-and-right of its square's
  //    bottom-left corner. ONE neutral ink for every marker and label, so the
  //    human/physical decision stays the child's to make.
  for (const ft of s.features) {
    if (!ft || !Array.isArray(ft.square) || ft.square.length < 2) continue;
    const ci = ix(ft.square[0]);   // column index (line index of the left edge)
    const cj = iy(ft.square[1]);   // row index (line index of the bottom edge)
    const cx = px(ci + 0.5);
    const cy = py(cj + 0.5);
    drawFeature(parts, cx, cy, CELL, ft);
  }

  // ── Highlight ring on the bottom-left CORNER of the highlight square — the
  //    exact crossing the Teach slide points to.
  if (s.highlight) {
    const hx = px(ix(s.highlight[0]));
    const hy = py(iy(s.highlight[1]));
    parts.push(`<circle cx="${f(hx)}" cy="${f(hy)}" r="${f(RING_R)}" fill="none" stroke="${C.ring}" stroke-width="${f(RING_W)}"/>`);
  }

  // ── Grid numbers LAST, so they sit clearly on top of everything in the margins.
  //    Easting numbers along the bottom, centred on each vertical line; northing
  //    numbers up the side, centred on each horizontal line. This is the corner /
  //    line placement the method depends on.
  for (let i = 0; i <= nx; i++) {
    const x = px(i);
    const y = py(0) + MARGIN_BOTTOM * 0.62;
    parts.push(numberText(x, y, eastings[i]));
  }
  for (let j = 0; j <= ny; j++) {
    const x = px(0) - MARGIN_LEFT * 0.50;
    const y = py(j);
    parts.push(numberText(x, y, northings[j]));
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h };
}

function numberText(x, y, value) {
  return `<text x="${f(x)}" y="${f(y)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${f(NUM_FONT)}" font-weight="bold" fill="${NUM_COLOUR}">${escapeXml(value)}</text>`;
}

// Draw a feature inside its cell: an optional icon glyph (or a neutral marker
// dot) with the name on up to two lines beneath, all sized to sit inside the cell
// without spilling into its neighbours or over the grid lines.
function drawFeature(parts, cx, cy, cell, ft) {
  const name = String(ft.name || '');
  const maxW = cell * 0.92;           // keep the label inside its own cell

  const lines = wrapLabel(name, maxW);
  // Shrink the font until the widest line fits the cell, down to the floor.
  let font = LABEL_FONT;
  const widest = lines.reduce(function (m, ln) { return Math.max(m, ln.length); }, 1);
  const fitFont = (maxW / (widest * 0.60));
  if (fitFont < font) font = Math.max(LABEL_FONT_MIN, fitFont);

  const lineH = font * 1.12;
  const labelBlockH = lines.length * lineH;

  // Marker/icon sits above the label block; the whole stack is centred in the cell.
  const hasIcon = ft.icon != null && String(ft.icon).length > 0;
  const markH = hasIcon ? ICON_FONT : MARK_R * 2;
  const gap = cell * 0.05;
  const stackH = markH + gap + labelBlockH;
  const top = cy - stackH / 2;

  if (hasIcon) {
    const iy = top + ICON_FONT * 0.5;
    parts.push(`<text x="${f(cx)}" y="${f(iy)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${f(ICON_FONT)}">${escapeXml(ft.icon)}</text>`);
  } else {
    const my = top + MARK_R;
    parts.push(`<circle cx="${f(cx)}" cy="${f(my)}" r="${f(MARK_R)}" fill="${MARK_COLOUR}"/>`);
  }

  let ly = top + markH + gap + lineH * 0.5;
  for (const ln of lines) {
    parts.push(`<text x="${f(cx)}" y="${f(ly)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${f(font)}" font-weight="bold" fill="${MARK_COLOUR}">${escapeXml(ln)}</text>`);
    ly += lineH;
  }
}

// Wrap a feature name onto at most two lines, breaking on spaces or slashes so a
// long name ("meander/river bend") still sits inside one cell. Returns 1–2 lines.
function wrapLabel(name, maxW) {
  const approxChars = Math.max(4, Math.floor(maxW / (LABEL_FONT * 0.60)));
  const words = name.split(/[\s/]+/).filter(Boolean);
  if (words.length <= 1) return [name];

  const lines = [];
  let cur = '';
  for (const word of words) {
    const candidate = cur ? cur + ' ' + word : word;
    if (candidate.length > approxChars && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = candidate;
    }
  }
  if (cur) lines.push(cur);

  // Cap at two lines — fold any overflow back onto the second line.
  if (lines.length > 2) {
    return [lines[0], lines.slice(1).join(' ')];
  }
  return lines;
}

// Smooth a polyline through its points with a Catmull-Rom spline converted to
// cubic Béziers, so the river meanders naturally rather than reading as straight
// segments with kinks. Falls back to a straight move/line for 2 points.
function smoothPath(pts) {
  if (pts.length === 2) {
    return `M ${f(pts[0].x)} ${f(pts[0].y)} L ${f(pts[1].x)} ${f(pts[1].y)}`;
  }
  let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${f(c1x)} ${f(c1y)}, ${f(c2x)} ${f(c2y)}, ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
}

module.exports = { tightSvg, cacheKey };
