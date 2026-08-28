'use strict';

// SHARED triangle geometry — the single source of truth for a classified
// triangle (a filled polygon with tick marks showing which sides are equal,
// optional angle arcs at the corners, an optional right-angle square, and an
// optional rotation). This is the picture a child reads to CLASSIFY a triangle
// by its sides — scalene / isosceles / equilateral / right-angled — by counting
// the dashes on each side (sides with the same number of dashes are equal).
// Imported by every engine that draws it (slides, worksheets, working wall); it
// produces ONLY the SVG and its true aspect, so each engine places it tight (no
// deadspace) however it embeds images. The geometry is written once here.
//
//   tightSvg(spec)        → { svg, aspect, w, h }   cropped tight to the triangle
//   cacheKey(spec)        → string                  stable pre-render cache key
//   nonExampleSvg(spec)   → { svg, aspect, w, h }   a "not a triangle" shape
//   nonExampleKey(spec)   → string                  cache key for a non-example
//
// Spec (tightSvg):
//   kind        "scalene" | "isosceles" | "equilateral" | "right". Sets both the
//               shape AND the default tick marks (scalene 1/2/3, isosceles 1/1 on
//               the two equal sides, equilateral 1/1/1, right none). Default
//               "scalene".
//   sides       optional [a, b, c] side-length ratios to draw ANY custom triangle
//               instead of a named kind (e.g. [3,4,5]). When given, it overrides
//               `kind` for the shape; tick marks then come from `ticks` (or are
//               auto-derived: equal-length sides get matching dashes).
//   ticks       optional [t0, t1, t2] — number of dashes on each side (0 = none,
//               1/2/3 = that many). Overrides the kind's default. Sides are
//               numbered by the OPPOSITE vertex: side 0 is opposite vertex A, etc.
//               (the convention isn't shown to children — it just lets a designer
//               tick specific sides). Equal-marked sides should genuinely be equal.
//   rightAngle  force the small right-angle square on (true) / off (false). Unset,
//               it shows automatically when kind is "right".
//   angleArcs   true to draw a small coloured arc inside each corner (used when the
//               lesson marks "the three angles"). Default false.
//   rotation    rotates the whole triangle (degrees) so a set isn't all one way up.
//   symmetryLines        true to overlay the triangle's lines of symmetry as DASHED
//               lines, auto-derived from `kind` — equilateral 3 (each vertex to the
//               midpoint of the opposite side), isosceles 1 (apex to the base
//               midpoint), scalene and right 0 (nothing drawn). The shape itself is
//               unchanged; the lines sit on top. Zero lines is correct and important
//               (a scalene triangle has none), so it simply draws nothing. Default
//               false.
//   symmetryLinesAnswer  when symmetryLines is on, true draws the lines in the
//               answer-reveal green (the same green the "||" reveal uses) for an
//               answer slide; false (default) draws them in a neutral dark colour
//               for a question slide.

const ARM_COLOUR  = '#000000';      // outline
const FILL_COLOUR = '#CCE2F5';      // pale house blue body
const TICK_COLOUR = '#000000';      // dashes, drawn on the outline
const SQ_COLOUR   = '#0070C0';      // right-angle square, house blue
const ARC_COLOUR  = '#0070C0';      // angle arcs, house blue
const SYM_COLOUR        = '#333333';    // lines of symmetry, neutral dark (question)
const SYM_COLOUR_ANSWER = '#00B050';    // lines of symmetry, house answer green (reveal)

const SCALE      = 100;             // base size — bounding triangle scaled to this
const LINE_W     = SCALE * 0.030;   // outline stroke
const TICK_W     = SCALE * 0.030;   // dash stroke
const TICK_LEN   = SCALE * 0.085;   // half-length of a dash (drawn either side of edge)
const TICK_GAP   = SCALE * 0.055;   // spacing between parallel dashes
const SQ_S       = SCALE * 0.14;    // right-angle square side
const ARC_R      = SCALE * 0.18;    // angle-arc radius
const ARC_W      = SCALE * 0.026;   // angle-arc stroke
const SYM_W      = SCALE * 0.026;   // symmetry-line stroke
const SYM_DASH   = SCALE * 0.06;    // dash length
const SYM_GAP    = SCALE * 0.04;    // gap between dashes
const SYM_EXT    = SCALE * 0.04;    // how far a line runs past the shape so it reads as an axis
const MARGIN     = TICK_LEN + LINE_W + SCALE * 0.02;  // room for dashes/squares to sit inside the canvas

function toRad(deg) { return (deg * Math.PI) / 180; }
function f(n) { return n.toFixed(2); }

// Return the three vertices [A, B, C] for a named kind (or custom side ratios),
// in an unrotated, un-normalised coordinate space (y grows downward, as in SVG).
// Each shape is drawn the way it is most often recognised: a base along the
// bottom with the apex above it, so before rotation it reads "the right way up".
function baseVertices(kind, sides) {
  // Custom side ratios → build the triangle from its three side lengths.
  if (Array.isArray(sides) && sides.length === 3 &&
      sides.every(function (s) { return Number(s) > 0; })) {
    return fromSideLengths(Number(sides[0]), Number(sides[1]), Number(sides[2]));
  }

  switch (kind) {
    case 'equilateral': {
      const w = SCALE;
      const h = SCALE * Math.sqrt(3) / 2;
      return [
        { x: w / 2, y: 0 },     // apex
        { x: 0,     y: h },     // bottom-left
        { x: w,     y: h }      // bottom-right
      ];
    }
    case 'isosceles': {
      // A taller-than-wide isosceles so the two equal slanted sides read clearly.
      const w = SCALE * 0.80;
      const h = SCALE * 1.05;
      return [
        { x: w / 2, y: 0 },
        { x: 0,     y: h },
        { x: w,     y: h }
      ];
    }
    case 'right': {
      // Right angle at the bottom-left, legs along the bottom and up the left.
      const w = SCALE;
      const h = SCALE * 0.78;
      return [
        { x: 0, y: 0 },         // top of the vertical leg
        { x: 0, y: h },         // right-angle corner (bottom-left)
        { x: w, y: h }          // end of the horizontal leg
      ];
    }
    case 'scalene':
    default: {
      // Three clearly different side lengths and no equal angles.
      const w = SCALE;
      const h = SCALE * 0.72;
      return [
        { x: w * 0.28, y: 0 },  // apex pulled off-centre
        { x: 0,        y: h },
        { x: w,        y: h }
      ];
    }
  }
}

// Build a triangle from three side lengths a, b, c (a = BC, b = CA, c = AB).
// Place B at the origin and C along the x-axis, then locate A by intersection.
function fromSideLengths(a, b, c) {
  // Scale so the longest side is SCALE, keeping proportions honest.
  const longest = Math.max(a, b, c);
  const k = SCALE / longest;
  a *= k; b *= k; c *= k;
  const B = { x: 0, y: 0 };
  const C = { x: a, y: 0 };
  // A is distance c from B and b from C.
  const ax = (c * c - b * b + a * a) / (2 * a);
  const ay = Math.sqrt(Math.max(0, c * c - ax * ax));
  const A = { x: ax, y: -ay };   // above the BC base (negative y = upward here)
  return [A, B, C];
}

// Default dashes per side for a named kind. Sides are indexed by OPPOSITE vertex:
// side i is the edge NOT touching vertex i (the edge between the other two).
// For baseVertices order [apex, bottom-left, bottom-right]:
//   side 0 = bottom edge, side 1 = right slanted edge, side 2 = left slanted edge.
function defaultTicks(kind, verts) {
  switch (kind) {
    case 'equilateral': return [1, 1, 1];
    case 'isosceles':   return [0, 1, 1];   // the two equal slanted sides
    case 'right':       return [0, 0, 0];   // marked by the square, not dashes
    case 'scalene':
    default:            return [1, 2, 3];   // all three different
  }
}

// When custom side lengths are given, derive ticks by grouping equal lengths.
function ticksFromSides(verts) {
  const len = function (p, q) { return Math.hypot(p.x - q.x, p.y - q.y); };
  // side i is opposite vertex i → between the other two vertices
  const L = [
    len(verts[1], verts[2]),
    len(verts[2], verts[0]),
    len(verts[0], verts[1])
  ];
  const ticks = [0, 0, 0];
  let next = 1;
  for (let i = 0; i < 3; i++) {
    if (ticks[i] !== 0) continue;
    let group = [i];
    for (let j = i + 1; j < 3; j++) {
      if (ticks[j] === 0 && Math.abs(L[i] - L[j]) / Math.max(L[i], L[j]) < 0.02) group.push(j);
    }
    if (group.length > 1) { group.forEach(function (g) { ticks[g] = next; }); next++; }
  }
  return ticks;
}

// Lines of symmetry for a classified triangle, returned as [{x1,y1,x2,y2}, …] in
// the same vertex space (so they rotate with the shape). Derived from `kind`:
//   equilateral → 3 lines, each from a vertex to the midpoint of the opposite side
//   isosceles   → 1 line, the apex (vertex 0) to the midpoint of the base (verts 1-2)
//   scalene / right → 0 lines (a scalene or generic right triangle has none)
// A custom `sides` triangle is treated by which kind it most resembles only when an
// explicit `kind` is given; an arbitrary `sides` triangle defaults to none, since
// its axes can't be assumed. Each axis is extended a little past both ends so it
// reads as a full line of symmetry rather than stopping flush at the outline.
function symmetryLineSegs(kind, verts) {
  const axes = [];   // each: { from: vertexPoint, to: midpointOfOppositeSide }
  if (kind === 'equilateral') {
    for (let i = 0; i < 3; i++) {
      const a = verts[i];
      const p = verts[(i + 1) % 3];
      const q = verts[(i + 2) % 3];
      axes.push({ from: a, to: { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 } });
    }
  } else if (kind === 'isosceles') {
    const a = verts[0];                 // apex (between the two equal sides)
    const p = verts[1], q = verts[2];   // base corners
    axes.push({ from: a, to: { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 } });
  }
  // scalene / right → no axes.

  // Extend each axis a touch beyond both endpoints so it reads as an axis line.
  return axes.map(function (ax) {
    let dx = ax.to.x - ax.from.x, dy = ax.to.y - ax.from.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    return {
      x1: ax.from.x - dx * SYM_EXT, y1: ax.from.y - dy * SYM_EXT,
      x2: ax.to.x   + dx * SYM_EXT, y2: ax.to.y   + dy * SYM_EXT
    };
  });
}

function resolveRotation(data) {
  return Number.isFinite(Number(data.rotation)) ? Number(data.rotation) : 0;
}

function showRightAngle(kind, data) {
  if (data.rightAngle === true) return true;
  if (data.rightAngle === false) return false;
  return kind === 'right';
}

function cacheKey(data) {
  const kind = String(data.kind || 'scalene').toLowerCase();
  const sides = Array.isArray(data.sides) ? data.sides.join(',') : '';
  const ticks = Array.isArray(data.ticks) ? data.ticks.join(',') : '';
  const rot = resolveRotation(data);
  const sq = showRightAngle(kind, data) ? '1' : '0';
  const arcs = data.angleArcs ? '1' : '0';
  const sym = data.symmetryLines ? (data.symmetryLinesAnswer ? 'a' : 'q') : '0';
  return 'tri:' + kind + ':' + sides + ':' + ticks + ':' + rot + ':' + sq + ':' + arcs + ':' + sym;
}

// Rotate a point about a centre.
function rotate(p, cx, cy, deg) {
  const r = toRad(deg);
  const dx = p.x - cx, dy = p.y - cy;
  return {
    x: cx + dx * Math.cos(r) - dy * Math.sin(r),
    y: cy + dx * Math.sin(r) + dy * Math.cos(r)
  };
}

// Build the SVG cropped tight to the triangle's bounding box (including the dash
// tips, the right-angle square and any angle arcs). Returns the SVG plus its
// width:height aspect so the placing engine sizes it without deadspace.
function tightSvg(data) {
  const kind = String(data.kind || 'scalene').toLowerCase();
  const sides = data.sides;
  // Same vertices and notation, with slightly heavier ink for the tiny
  // Success Criteria Helper treatment. At full size the ordinary house
  // strokes remain untouched.
  const inlineScale = data.successCriteriaInline === true ? 1.55 : 1;
  const lineW = LINE_W * inlineScale;
  const tickW = TICK_W * inlineScale;
  let verts = baseVertices(kind, sides);

  const ticks = Array.isArray(data.ticks) ? data.ticks.map(Number)
    : (Array.isArray(sides) ? ticksFromSides(verts) : defaultTicks(kind, verts));
  const showSq = showRightAngle(kind, data);
  const showArcs = data.angleArcs === true;
  const rotation = resolveRotation(data);

  // Rotate about the centroid so the shape stays put as it turns.
  const cx = (verts[0].x + verts[1].x + verts[2].x) / 3;
  const cy = (verts[0].y + verts[1].y + verts[2].y) / 3;
  if (rotation) verts = verts.map(function (p) { return rotate(p, cx, cy, rotation); });

  // Collect every drawn primitive's extreme points so we can crop tight.
  const xs = [], ys = [];
  const note = function (p) { xs.push(p.x); ys.push(p.y); };
  verts.forEach(note);

  // ── Lines of symmetry: dashed axes auto-derived from the kind, drawn on top of
  // the shape (the shape itself is unchanged). A scalene or right triangle yields
  // none, which is correct. Note their tips so the tight crop allows for the small
  // overshoot past each end.
  const symSegs = data.symmetryLines === true ? symmetryLineSegs(kind, verts) : [];
  const symColour = data.symmetryLinesAnswer ? SYM_COLOUR_ANSWER : SYM_COLOUR;
  symSegs.forEach(function (s) {
    note({ x: s.x1, y: s.y1 }); note({ x: s.x2, y: s.y2 });
  });

  // ── Tick marks: short dashes across the midpoint of each side, perpendicular.
  const tickSegs = [];   // {x1,y1,x2,y2}
  for (let i = 0; i < 3; i++) {
    const count = ticks[i] | 0;
    if (count <= 0) continue;
    // side i runs between the two vertices that are NOT vertex i.
    const p = verts[(i + 1) % 3];
    const q = verts[(i + 2) % 3];
    const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
    let dx = q.x - p.x, dy = q.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;                 // unit along the side
    const nx = -dy, ny = dx;              // unit perpendicular
    // Centre the group of dashes on the midpoint, spaced along the side.
    const start = -((count - 1) / 2) * TICK_GAP;
    for (let d = 0; d < count; d++) {
      const off = start + d * TICK_GAP;
      const bx = mx + dx * off, by = my + dy * off;
      const a1 = { x: bx + nx * TICK_LEN, y: by + ny * TICK_LEN };
      const a2 = { x: bx - nx * TICK_LEN, y: by - ny * TICK_LEN };
      tickSegs.push({ x1: a1.x, y1: a1.y, x2: a2.x, y2: a2.y });
      note(a1); note(a2);
    }
  }

  // ── Right-angle square: find the vertex whose two edges are perpendicular.
  let sqPath = null;
  if (showSq) {
    let corner = -1;
    for (let i = 0; i < 3; i++) {
      const A = verts[i];
      const B = verts[(i + 1) % 3];
      const C = verts[(i + 2) % 3];
      const u = { x: B.x - A.x, y: B.y - A.y };
      const v = { x: C.x - A.x, y: C.y - A.y };
      const lu = Math.hypot(u.x, u.y) || 1, lv = Math.hypot(v.x, v.y) || 1;
      const dot = (u.x * v.x + u.y * v.y) / (lu * lv);
      if (Math.abs(dot) < 0.08) { corner = i; break; }
    }
    if (corner >= 0) {
      const A = verts[corner];
      const B = verts[(corner + 1) % 3];
      const C = verts[(corner + 2) % 3];
      const u = { x: B.x - A.x, y: B.y - A.y };
      const v = { x: C.x - A.x, y: C.y - A.y };
      const lu = Math.hypot(u.x, u.y) || 1, lv = Math.hypot(v.x, v.y) || 1;
      const un = { x: u.x / lu, y: u.y / lu };
      const vn = { x: v.x / lv, y: v.y / lv };
      const p1 = { x: A.x + un.x * SQ_S, y: A.y + un.y * SQ_S };
      const p3 = { x: A.x + vn.x * SQ_S, y: A.y + vn.y * SQ_S };
      const p2 = { x: A.x + (un.x + vn.x) * SQ_S, y: A.y + (un.y + vn.y) * SQ_S };
      sqPath = [p1, p2, p3];
      [p1, p2, p3].forEach(note);
    }
  }

  // ── Angle arcs at each corner.
  const arcs = [];
  if (showArcs) {
    for (let i = 0; i < 3; i++) {
      const A = verts[i];
      const B = verts[(i + 1) % 3];
      const C = verts[(i + 2) % 3];
      const aB = Math.atan2(B.y - A.y, B.x - A.x);
      const aC = Math.atan2(C.y - A.y, C.x - A.x);
      const s = { x: A.x + Math.cos(aB) * ARC_R, y: A.y + Math.sin(aB) * ARC_R };
      const e = { x: A.x + Math.cos(aC) * ARC_R, y: A.y + Math.sin(aC) * ARC_R };
      // Choose the small (interior) sweep direction.
      let diff = aC - aB;
      while (diff <= -Math.PI) diff += 2 * Math.PI;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      const sweep = diff > 0 ? 1 : 0;
      arcs.push({ s: s, e: e, sweep: sweep });
      note(s); note(e);
    }
  }

  // ── Crop tight.
  let minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
  let minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
  minX -= MARGIN; minY -= MARGIN; maxX += MARGIN; maxY += MARGIN;
  const w = maxX - minX, h = maxY - minY;
  const ox = -minX, oy = -minY;
  const T = function (p) { return { x: p.x + ox, y: p.y + oy }; };

  const parts = [];

  // Filled triangle body + outline.
  const v0 = T(verts[0]), v1 = T(verts[1]), v2 = T(verts[2]);
  parts.push(`<polygon points="${f(v0.x)},${f(v0.y)} ${f(v1.x)},${f(v1.y)} ${f(v2.x)},${f(v2.y)}" fill="${FILL_COLOUR}" stroke="${ARM_COLOUR}" stroke-width="${f(lineW)}" stroke-linejoin="round"/>`);

  // Lines of symmetry (dashed), on top of the body so they read against the fill.
  symSegs.forEach(function (s) {
    const a = T({ x: s.x1, y: s.y1 }), b = T({ x: s.x2, y: s.y2 });
    parts.push(`<line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}" stroke="${symColour}" stroke-width="${f(SYM_W)}" stroke-dasharray="${f(SYM_DASH)},${f(SYM_GAP)}" stroke-linecap="round"/>`);
  });

  // Right-angle square (drawn before dashes so dashes sit on top if they overlap).
  if (sqPath) {
    const q1 = T(sqPath[0]), q2 = T(sqPath[1]), q3 = T(sqPath[2]);
    parts.push(`<polyline points="${f(q1.x)},${f(q1.y)} ${f(q2.x)},${f(q2.y)} ${f(q3.x)},${f(q3.y)}" fill="none" stroke="${SQ_COLOUR}" stroke-width="${f(ARC_W)}" stroke-linecap="round" stroke-linejoin="round"/>`);
  }

  // Angle arcs.
  arcs.forEach(function (a) {
    const s = T(a.s), e = T(a.e);
    parts.push(`<path d="M ${f(s.x)} ${f(s.y)} A ${f(ARC_R)} ${f(ARC_R)} 0 0 ${a.sweep} ${f(e.x)} ${f(e.y)}" fill="none" stroke="${ARC_COLOUR}" stroke-width="${f(ARC_W)}" stroke-linecap="round"/>`);
  });

  // Tick marks.
  tickSegs.forEach(function (s) {
    const a = T({ x: s.x1, y: s.y1 }), b = T({ x: s.x2, y: s.y2 });
    parts.push(`<line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}" stroke="${TICK_COLOUR}" stroke-width="${f(tickW)}" stroke-linecap="round"/>`);
  });

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h };
}

// ── Non-examples for the concept-attainment sort: shapes that are NOT triangles.
//   type  "open"   — three lines with a gap (not closed)
//         "curved" — two straight sides and one curved side
//         "quad"   — a four-sided shape
// These deliberately resemble triangles enough that "why isn't this a triangle?"
// is a real question, which is the point of a concept-attainment non-example.

function nonExampleKey(data) {
  const t = String(data.shape || data.type || 'open').toLowerCase();
  const rot = resolveRotation(data);
  return 'trinon:' + t + ':' + rot;
}

function nonExampleSvg(data) {
  const t = String(data.shape || data.type || 'open').toLowerCase();
  const rotation = resolveRotation(data);

  // Base triangle-ish points (apex, bottom-left, bottom-right).
  const w = SCALE, h = SCALE * 0.78;
  let A = { x: w * 0.5, y: 0 };
  let B = { x: 0, y: h };
  let C = { x: w, y: h };
  let D = null;   // fourth point for a quad

  if (t === 'quad') {
    // An irregular four-sided shape (clearly not a triangle).
    A = { x: w * 0.28, y: 0 };
    B = { x: 0, y: h };
    C = { x: w, y: h };
    D = { x: w * 0.92, y: h * 0.30 };
  }

  let pts = [A, B, C];
  if (D) pts = [A, B, C, D];

  const cx = pts.reduce(function (s, p) { return s + p.x; }, 0) / pts.length;
  const cy = pts.reduce(function (s, p) { return s + p.y; }, 0) / pts.length;
  if (rotation) pts = pts.map(function (p) { return rotate(p, cx, cy, rotation); });

  const xs = pts.map(function (p) { return p.x; });
  const ys = pts.map(function (p) { return p.y; });
  let minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
  let minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
  minX -= MARGIN; minY -= MARGIN; maxX += MARGIN; maxY += MARGIN;
  const bw = maxX - minX, bh = maxY - minY;
  const ox = -minX, oy = -minY;
  const T = function (p) { return { x: p.x + ox, y: p.y + oy }; };
  const P = pts.map(T);

  const parts = [];

  if (t === 'quad') {
    parts.push(`<polygon points="${P.map(function (p) { return f(p.x) + ',' + f(p.y); }).join(' ')}" fill="${FILL_COLOUR}" stroke="${ARM_COLOUR}" stroke-width="${f(LINE_W)}" stroke-linejoin="round"/>`);
  } else if (t === 'curved') {
    // Two straight sides (apex→left, apex→right via the bottom) and one CURVED base.
    const a = P[0], b = P[1], c = P[2];
    const bulge = h * 0.34;
    // Control point pushes the base outward into a curve.
    const mid = { x: (b.x + c.x) / 2, y: (b.y + c.y) / 2 + bulge };
    parts.push(`<path d="M ${f(a.x)} ${f(a.y)} L ${f(b.x)} ${f(b.y)} Q ${f(mid.x)} ${f(mid.y)} ${f(c.x)} ${f(c.y)} Z" fill="${FILL_COLOUR}" stroke="${ARM_COLOUR}" stroke-width="${f(LINE_W)}" stroke-linejoin="round"/>`);
  } else {
    // "open": three strokes with a visible gap — drawn as two strokes leaving one
    // corner unjoined, so it reads as "not closed" rather than a filled shape.
    const a = P[0], b = P[1], c = P[2];
    // Leave a gap near vertex C: draw apex→left→right, but stop the last stroke short.
    const gx = c.x - (c.x - a.x) * 0.30;
    const gy = c.y - (c.y - a.y) * 0.30;
    parts.push(`<polyline points="${f(c.x)},${f(c.y)} ${f(a.x)},${f(a.y)} ${f(b.x)},${f(b.y)}" fill="none" stroke="${ARM_COLOUR}" stroke-width="${f(LINE_W)}" stroke-linecap="round" stroke-linejoin="round"/>`);
    parts.push(`<line x1="${f(b.x)}" y1="${f(b.y)}" x2="${f(gx)}" y2="${f(gy)}" stroke="${ARM_COLOUR}" stroke-width="${f(LINE_W)}" stroke-linecap="round"/>`);
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(bw)}" height="${f(bh)}" viewBox="0 0 ${f(bw)} ${f(bh)}">${parts.join('')}</svg>`;
  return { svg, aspect: bw / bh, w: bw, h: bh };
}

module.exports = { tightSvg, cacheKey, nonExampleSvg, nonExampleKey };
