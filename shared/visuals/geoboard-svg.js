'use strict';

// SHARED geoboard / dotty-paper geometry — the single source of truth for a grid
// of evenly spaced pegs (dots) with zero, one, or many straight-line shapes drawn
// on it. A geoboard is a general workspace: draw any polygon by its vertices, sort
// "how many shapes can you make", show a rotated square sitting on diagonal pegs
// ("it's not a diamond"), or print a blank grid for children to draw their own.
// Imported by every engine that draws it (slides, worksheets); it produces ONLY
// the SVG and its true aspect, so each engine places it tight (NO DEADSPACE)
// however it embeds images. The geometry is written once here.
//
//   tightSvg(spec) → { svg, aspect, w, h }   cropped tight to the grid's bounds
//   cacheKey(spec) → string                  stable pre-render cache key
//
// Coordinates run x ACROSS (0 = left) and y UP (0 = bottom), the way a child plots
// on dotty paper. Pegs sit at every whole position 0..cols across and 0..rows up,
// so a `cols`×`rows` board has (cols+1)×(rows+1) pegs.
//
// Spec:
//   cols, rows   grid size in squares (default 5 × 5) → pegs at 0..cols, 0..rows.
//   shapes       array of shapes drawn on the grid. Each is either
//                  { points: [[x,y],…], closed?, outline?, fill?, width? }
//                or the bare shorthand [[x,y],…] (a closed outlined polygon).
//                  points   vertices in peg units, joined in the order given.
//                  closed   true (default) = closed polygon; false = open path.
//                  outline  stroke colour (hex, no #). Default house blue.
//                  fill     optional pale fill colour (hex, no #). Closed only.
//                  width    stroke width multiplier (default 1).
//   shape        convenience: a single shape, same forms as one `shapes` entry.
//   emphasiseVertices  true = draw a bolder peg under every shape vertex, so the
//                pegs a shape sits on stand out. Default false.
//   symmetryLines  an EXPLICIT list of lines of symmetry to overlay, drawn DASHED.
//                Each is a [[x1,y1],[x2,y2]] segment in the SAME peg-coordinate
//                space the shapes use (x across from the left, y up from the
//                bottom). A geoboard shape is arbitrary, so its axes can't be
//                auto-derived reliably — the designer supplies them. An empty or
//                absent list draws nothing (a shape with no line of symmetry is
//                correct and simply shows none). Example for a kite with one
//                vertical axis: [ [[2,0],[2,4]] ].
//   symmetryLinesAnswer  true draws the symmetry lines in the answer-reveal green
//                (the same green the "||" reveal uses) for an answer slide; false
//                (default) draws them in a neutral dark colour for a question slide.
//   notation     optional per-shape property marks (the standard British school
//                notation that tells a child HOW a shape is classified). It sits
//                on a shape object, alongside `points`:
//                  ticks       { "<edge>": count }  — equal-side dashes across an
//                              edge midpoint; edges sharing a count are equal in
//                              length. e.g. { "0": 1, "2": 1, "1": 2, "3": 2 }
//                              (one tick on the first pair, two on the second).
//                  arrows      { "<edge>": count }  — parallel-pair chevrons (›)
//                              mid-edge pointing along the edge; edges sharing a
//                              count are parallel. Single chevron = first pair,
//                              double = second pair (the standard British mark).
//                  rightAngles [v, …]               — vertex indices to carry the
//                              small right-angle square (90°) tucked into the
//                              corner between that vertex's two edges.
//                EDGE index i is the edge from point i to point i+1 (the last
//                wraps back to point 0 on a closed shape). VERTEX index i is
//                point i. The bare `shape` form and the `shapes` array both
//                accept `notation`.
//   (Omit shapes/shape entirely for a BLANK board — bare dotty paper to draw on.)

// ─── CONSTANTS (geometry units; the whole drawing scales on placement) ────
const CELL        = 100;          // distance between adjacent pegs
const PEG_R       = CELL * 0.055; // muted peg radius
const VERTEX_R    = CELL * 0.090; // bolder peg where a shape touches it
const LINE_W      = CELL * 0.030; // shape outline stroke width (× per-shape width)
const MARGIN      = CELL * 0.30;  // breathing room so edge pegs/strokes aren't clipped

// ── Property-notation marks (mirror triangle.js / line-pair.js house style) ──
const TICK_W      = CELL * 0.030; // equal-side dash stroke (matches triangle)
const TICK_LEN    = CELL * 0.085; // half-length of a dash, drawn either side of edge
const TICK_GAP    = CELL * 0.055; // spacing between stacked parallel dashes
const ARROW_W     = CELL * 0.040; // parallel chevron stroke (matches line-pair MARK_W)
const CHEV        = CELL * 0.085; // chevron half-width (the › opening size)
const CHEV_GAP    = CELL * 0.075; // half-spacing of stacked chevrons (arrows:2) → offset ±this
const GROUP_SHIFT = CELL * 0.16;  // shift a tick/arrow group off the midpoint when an edge carries both
const SQ_S        = CELL * 0.16;  // right-angle square side (matches line-pair)
const SQ_W        = CELL * 0.040; // right-angle square stroke

// ── Lines of symmetry (explicit dashed overlay) ──
const SYM_W       = CELL * 0.028; // symmetry-line stroke
const SYM_DASH    = CELL * 0.10;  // dash length
const SYM_GAP     = CELL * 0.07;  // gap between dashes
const SYM_COLOUR        = '#333333'; // neutral dark (question)
const SYM_COLOUR_ANSWER = '#00B050'; // house answer green (reveal)

const PEG_COLOUR     = '#9DB0C4';   // muted grid pegs (matches reflection-grid dots)
const SHAPE_OUTLINE  = '#0070C0';   // house blue default outline
const SHAPE_FILL     = '#CCE2F5';   // pale blue default fill (matches reflection-grid)
const TICK_COLOUR    = '#000000';   // equal-side dashes, drawn on the outline (black)
const MARK_COLOUR    = '#0070C0';   // chevrons + right-angle squares, house blue
// House answer green is '#00B050' / fill '#D5F5E3' — set per shape for an answer.
// ─── END CONSTANTS ────────────────────────────────────────────────────────

function clampInt(v, dflt) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : dflt;
}

// Build the SVG fragments for one shape's property-notation marks. `P` is the
// shape's vertices already in SVG pixel space ([{x,y}, …], in the order drawn);
// `closed` says whether edge n-1→0 exists. Marks mirror the house style of
// triangle.js (equal-side dashes) and line-pair.js (parallel chevrons,
// right-angle square). All marks live on or just inside the shape's edges, well
// within the grid's MARGIN, so the tight-to-grid crop needs no adjustment.
function notationParts(P, closed, notation, f) {
  if (!notation) return [];
  const out = [];
  const n = P.length;
  const edgeCount = closed ? n : n - 1;

  // Edge geometry helper: midpoint, unit-along (u) and unit-perpendicular (nrm).
  function edgeInfo(i) {
    const p = P[i], q = P[(i + 1) % n];
    const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
    const dx = q.x - p.x, dy = q.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const u = { x: dx / len, y: dy / len };
    return { mx: mx, my: my, u: u, nrm: { x: -u.y, y: u.x } };
  }

  // When an edge carries BOTH a tick group and an arrow group, they'd collide at
  // the midpoint, so shift each group a little either side of it along the edge.
  function groupCentre(i, isTick) {
    const e = edgeInfo(i);
    const both = (notation.ticks[i] > 0) && (notation.arrows[i] > 0);
    const shift = both ? (isTick ? -GROUP_SHIFT : GROUP_SHIFT) : 0;
    return { x: e.mx + e.u.x * shift, y: e.my + e.u.y * shift, u: e.u, nrm: e.nrm };
  }

  // ── Equal-side dashes: short perpendicular dashes across the edge, stacked and
  // centred on the group's position (count = how many), in black on the outline.
  Object.keys(notation.ticks).forEach(function (key) {
    const i = parseInt(key, 10);
    if (i < 0 || i >= edgeCount) return;
    const count = notation.ticks[i];
    const c = groupCentre(i, true);
    const start = -((count - 1) / 2) * TICK_GAP;
    for (let d = 0; d < count; d++) {
      const off = start + d * TICK_GAP;
      const bx = c.x + c.u.x * off, by = c.y + c.u.y * off;
      const x1 = bx + c.nrm.x * TICK_LEN, y1 = by + c.nrm.y * TICK_LEN;
      const x2 = bx - c.nrm.x * TICK_LEN, y2 = by - c.nrm.y * TICK_LEN;
      out.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${TICK_COLOUR}" stroke-width="${f(TICK_W)}" stroke-linecap="round"/>`);
    }
  });

  // ── Parallel-pair chevrons: a › arrowhead pointing along the edge (two stacked
  // along the edge when count = 2), in house blue.
  Object.keys(notation.arrows).forEach(function (key) {
    const i = parseInt(key, 10);
    if (i < 0 || i >= edgeCount) return;
    const count = notation.arrows[i];
    const c = groupCentre(i, false);
    const u = c.u, nrm = c.nrm;
    const offsets = count === 2 ? [-CHEV_GAP, CHEV_GAP] : [0];
    offsets.forEach(function (off) {
      const cc = { x: c.x + u.x * off, y: c.y + u.y * off };
      const tip  = { x: cc.x + u.x * (CHEV * 0.55), y: cc.y + u.y * (CHEV * 0.55) };
      const back = { x: cc.x - u.x * (CHEV * 0.55), y: cc.y - u.y * (CHEV * 0.55) };
      const w1 = { x: back.x + nrm.x * CHEV, y: back.y + nrm.y * CHEV };
      const w2 = { x: back.x - nrm.x * CHEV, y: back.y - nrm.y * CHEV };
      out.push(`<polyline points="${f(w1.x)},${f(w1.y)} ${f(tip.x)},${f(tip.y)} ${f(w2.x)},${f(w2.y)}" fill="none" stroke="${MARK_COLOUR}" stroke-width="${f(ARROW_W)}" stroke-linecap="round" stroke-linejoin="round"/>`);
    });
  });

  // ── Right-angle squares: tuck a small square into a vertex's corner, drawn
  // from the vertex out along its two incident edges (so it sits inside the
  // angle whatever the orientation), in house blue.
  notation.rightAngles.forEach(function (v) {
    if (v < 0 || v >= n) return;
    const A = P[v];
    // The two neighbours forming the corner. On an open path an endpoint has only
    // one neighbour, so skip it (a right-angle square needs two edges).
    const hasPrev = closed || v > 0;
    const hasNext = closed || v < n - 1;
    if (!hasPrev || !hasNext) return;
    const B = P[(v + 1) % n];          // along the next edge
    const C = P[(v - 1 + n) % n];      // along the previous edge
    const u = { x: B.x - A.x, y: B.y - A.y };
    const w = { x: C.x - A.x, y: C.y - A.y };
    const lu = Math.hypot(u.x, u.y) || 1, lw = Math.hypot(w.x, w.y) || 1;
    const un = { x: u.x / lu, y: u.y / lu };
    const wn = { x: w.x / lw, y: w.y / lw };
    const p1  = { x: A.x + un.x * SQ_S, y: A.y + un.y * SQ_S };
    const p3  = { x: A.x + wn.x * SQ_S, y: A.y + wn.y * SQ_S };
    const p2  = { x: A.x + (un.x + wn.x) * SQ_S, y: A.y + (un.y + wn.y) * SQ_S };
    out.push(`<polyline points="${f(p1.x)},${f(p1.y)} ${f(p2.x)},${f(p2.y)} ${f(p3.x)},${f(p3.y)}" fill="none" stroke="${MARK_COLOUR}" stroke-width="${f(SQ_W)}" stroke-linecap="round" stroke-linejoin="round"/>`);
  });

  return out;
}

// Normalise a shape's optional `notation` into { ticks, arrows, rightAngles }
// where ticks/arrows are plain { edgeIndex: count } objects (counts ≥ 1) and
// rightAngles is a sorted unique list of vertex indices. Returns null when the
// shape carries no notation, so unmarked shapes draw exactly as before.
function resolveNotation(n) {
  if (!n || typeof n !== 'object') return null;
  const countMap = function (m) {
    const out = {};
    if (m && typeof m === 'object') {
      Object.keys(m).forEach(function (k) {
        const idx = parseInt(k, 10);
        const c = Math.round(Number(m[k]));
        if (Number.isFinite(idx) && idx >= 0 && Number.isFinite(c) && c > 0) out[idx] = c;
      });
    }
    return out;
  };
  const ticks = countMap(n.ticks);
  const arrows = countMap(n.arrows);
  const rightAngles = Array.isArray(n.rightAngles)
    ? Array.from(new Set(n.rightAngles
        .map(function (v) { return Math.round(Number(v)); })
        .filter(function (v) { return Number.isFinite(v) && v >= 0; })))
      .sort(function (a, b) { return a - b; })
    : [];
  if (!Object.keys(ticks).length && !Object.keys(arrows).length && !rightAngles.length) return null;
  return { ticks: ticks, arrows: arrows, rightAngles: rightAngles };
}

// Normalise the spec's shape(s) into a list of { points, closed, outline, fill, width }.
function resolveShapes(data) {
  let raw = [];
  if (Array.isArray(data.shapes)) raw = data.shapes;
  else if (data.shape) raw = [data.shape];

  const out = [];
  raw.forEach(function (s) {
    if (!s) return;
    // Bare shorthand: an array of [x,y] vertices → a closed outlined polygon.
    if (Array.isArray(s)) {
      if (s.length >= 2) out.push({ points: s, closed: true, outline: SHAPE_OUTLINE, fill: null, width: 1, notation: null });
      return;
    }
    const pts = Array.isArray(s.points) ? s.points : null;
    if (!pts || pts.length < 2) return;
    out.push({
      points: pts,
      closed: s.closed !== false,
      outline: s.outline ? ('#' + String(s.outline).replace(/^#/, '')) : SHAPE_OUTLINE,
      fill: s.fill ? ('#' + String(s.fill).replace(/^#/, '')) : null,
      width: Number.isFinite(Number(s.width)) && Number(s.width) > 0 ? Number(s.width) : 1,
      notation: resolveNotation(s.notation)
    });
  });
  return out;
}

// Normalise the spec's optional `symmetryLines` into a list of
// [[x1,y1],[x2,y2]] segments in peg coordinates, dropping anything malformed.
// Returns [] when none are supplied, so an absent list simply draws nothing.
function resolveSymmetryLines(data) {
  const raw = Array.isArray(data.symmetryLines) ? data.symmetryLines : [];
  const out = [];
  raw.forEach(function (seg) {
    if (!Array.isArray(seg) || seg.length < 2) return;
    const a = seg[0], b = seg[1];
    if (!Array.isArray(a) || !Array.isArray(b)) return;
    const x1 = Number(a[0]), y1 = Number(a[1]);
    const x2 = Number(b[0]), y2 = Number(b[1]);
    if ([x1, y1, x2, y2].every(Number.isFinite)) out.push([[x1, y1], [x2, y2]]);
  });
  return out;
}

function cacheKey(data) {
  const cols = clampInt(data.cols, 5);
  const rows = clampInt(data.rows, 5);
  const shapes = resolveShapes(data);
  const symLines = resolveSymmetryLines(data);
  const symKey = symLines.length
    ? ':sym' + (data.symmetryLinesAnswer ? 'a' : 'q') +
      symLines.map(function (s) { return s[0][0] + ',' + s[0][1] + '-' + s[1][0] + ',' + s[1][1]; }).join(';')
    : '';
  const sk = shapes.map(function (s) {
    const n = s.notation;
    const nk = n
      ? 't' + JSON.stringify(n.ticks) + 'a' + JSON.stringify(n.arrows) + 'r' + n.rightAngles.join(',')
      : '-';
    return s.points.map(function (p) { return p[0] + ',' + p[1]; }).join(' ') +
      '|' + (s.closed ? 'c' : 'o') + '|' + s.outline + '|' + (s.fill || '-') + '|' + s.width + '|' + nk;
  }).join(';');
  return 'geoboard:' + cols + 'x' + rows + ':' + (data.emphasiseVertices ? 'v' : '') + ':' + sk + symKey;
}

// Build the SVG cropped tight to the grid's bounding box (the pegs plus their
// margin). The board is always the full peg rectangle, so the tight box is the
// grid itself — no padded square, no centring-in-deadspace.
function tightSvg(data) {
  const cols = clampInt(data.cols, 5);
  const rows = clampInt(data.rows, 5);
  const shapes = resolveShapes(data);
  const emphasise = data.emphasiseVertices === true;
  const symLines = resolveSymmetryLines(data);
  const symColour = data.symmetryLinesAnswer ? SYM_COLOUR_ANSWER : SYM_COLOUR;

  // Peg (gx, gy) in SVG space: x across, y DOWN in SVG so flip gy. The grid's
  // bounding box is [0..cols]×[0..rows] cells; add MARGIN on every side.
  const w = cols * CELL + 2 * MARGIN;
  const h = rows * CELL + 2 * MARGIN;
  const px = function (gx) { return MARGIN + gx * CELL; };
  const py = function (gy) { return MARGIN + (rows - gy) * CELL; };   // y up from the bottom
  const f = function (n) { return n.toFixed(2); };

  const parts = [];

  // Filled shapes first (under the pegs and outlines, so pegs read on top).
  shapes.forEach(function (s) {
    if (!s.closed || !s.fill) return;
    const d = s.points.map(function (p) { return f(px(p[0])) + ',' + f(py(p[1])); }).join(' ');
    parts.push(`<polygon points="${d}" fill="${s.fill}" stroke="none"/>`);
  });

  // Peg grid.
  for (let i = 0; i <= cols; i++) {
    for (let j = 0; j <= rows; j++) {
      parts.push(`<circle cx="${f(px(i))}" cy="${f(py(j))}" r="${f(PEG_R)}" fill="${PEG_COLOUR}"/>`);
    }
  }

  // Shape outlines (open polyline or closed polygon edge), on top of the pegs.
  shapes.forEach(function (s) {
    const d = s.points.map(function (p) { return f(px(p[0])) + ',' + f(py(p[1])); }).join(' ');
    const sw = f(LINE_W * s.width);
    if (s.closed) {
      parts.push(`<polygon points="${d}" fill="none" stroke="${s.outline}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`);
    } else {
      parts.push(`<polyline points="${d}" fill="none" stroke="${s.outline}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`);
    }
  });

  // Property-notation marks (equal-side dashes, parallel chevrons, right-angle
  // squares), drawn on top of the outlines from the shared house style.
  shapes.forEach(function (s) {
    if (!s.notation) return;
    const Pp = s.points.map(function (p) { return { x: px(p[0]), y: py(p[1]) }; });
    notationParts(Pp, s.closed, s.notation, f).forEach(function (frag) { parts.push(frag); });
  });

  // Lines of symmetry (explicit, dashed), drawn on top of the shape outlines so
  // the axes read clearly against the figure. Coordinates are in peg units, the
  // same space the shapes use.
  symLines.forEach(function (seg) {
    const a = seg[0], b = seg[1];
    parts.push(`<line x1="${f(px(a[0]))}" y1="${f(py(a[1]))}" x2="${f(px(b[0]))}" y2="${f(py(b[1]))}" stroke="${symColour}" stroke-width="${f(SYM_W)}" stroke-dasharray="${f(SYM_DASH)},${f(SYM_GAP)}" stroke-linecap="round"/>`);
  });

  // Optional vertex emphasis: a bolder peg in the shape's outline colour under
  // each vertex the shape touches, so the pegs it sits on stand out.
  if (emphasise) {
    shapes.forEach(function (s) {
      s.points.forEach(function (p) {
        parts.push(`<circle cx="${f(px(p[0]))}" cy="${f(py(p[1]))}" r="${f(VERTEX_R)}" fill="${s.outline}"/>`);
      });
    });
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h };
}

// The full geoboard's pegs become visual noise in the narrow Success Criteria
// slot. This compact treatment keeps only the property being cued: a bold shape
// divided by one unmistakable dashed line of symmetry.
function symmetryCueSvg() {
  const w = 170;
  const h = 150;
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect x="18" y="9" width="134" height="132" rx="4" fill="#EAF3FB" stroke="#0070C0" stroke-width="8"/><line x1="85" y1="9" x2="85" y2="141" stroke="#C00000" stroke-width="8" stroke-dasharray="15,10" stroke-linecap="round"/></svg>`;
  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg, symmetryCueSvg, cacheKey };
