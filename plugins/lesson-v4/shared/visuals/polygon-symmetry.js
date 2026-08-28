'use strict';

// SHARED geometry for the LINES OF SYMMETRY of a named preset polygon — the
// `polygon` content helper draws its shapes from PowerPoint preset geometry
// (not SVG), so this module returns the symmetry-line ENDPOINTS in the shape's
// own bounding box (origin at the top-left, x right, y DOWN — the coordinate
// space pptxgenjs uses), and the polygon draw step converts those to slide
// inches and lays each line over the shape with addShape.
//
//   symmetryLinesFor(name, box) → [ { x1, y1, x2, y2 }, … ]
//     name  the polygon name (square, rectangle, triangle, pentagon, hexagon, …)
//     box   { x, y, w, h } the shape's bounding box (the rect the preset fills)
//   Endpoints are absolute (already offset by box.x / box.y), ready to draw.
//
// The correct lines per shape (verified against the regular-polygon rule:
// a regular n-gon has n axes; odd n → each vertex to the midpoint of the
// opposite side; even n → n/2 vertex-to-opposite-vertex plus n/2
// midpoint-to-opposite-midpoint):
//   square            4  (2 diagonals + vertical + horizontal mid-lines)
//   rectangle         2  (vertical + horizontal mid-lines only, NOT diagonals)
//   rhombus / diamond 2  (the 2 diagonals only)
//   parallelogram     0
//   trapezium         0  (the generic preset is non-isosceles)
//   triangle (equilateral preset)  3  (each vertex → opposite-side midpoint)
//   isosceles-triangle  1  (the vertical axis through the apex)
//   scalene-triangle    0  (no equal sides → no axis)
//   right-triangle    0  (generic right triangle)
//   pentagon          5  (each vertex → opposite-side midpoint)
//   hexagon           6  (3 vertex-to-vertex + 3 midpoint-to-midpoint)
//   kite              1  (the vertical axis through the two ends)

// Vertices of a preset polygon inside the unit box [0,1]×[0,1] (y DOWN), matching
// how PowerPoint inscribes each shape so an overlaid axis lands on the figure.
// Returned in drawing order around the shape.
function unitVertices(name) {
  switch (name) {
    case 'square':
    case 'rectangle':
      return [[0, 0], [1, 0], [1, 1], [0, 1]];
    case 'rhombus':
    case 'diamond':
      return [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]];
    case 'triangle':
    case 'equilateral-triangle':
      // PowerPoint `triangle`: apex at top-centre, base along the bottom edge.
      return [[0.5, 0], [1, 1], [0, 1]];
    case 'isosceles-triangle':
      // Apex at top-centre, base along the bottom — a tall isosceles so it reads
      // as distinct from the (wider) equilateral. Drawn from these verts, not a
      // preset, so the single vertical axis is honest.
      return [[0.5, 0], [1, 1], [0, 1]];
    case 'scalene-triangle':
      // Three unequal sides, no axis. Apex off-centre and a non-symmetric base
      // so a child can SEE it has no matching halves. Inscribed to fill the box.
      return [[0.30, 0], [1, 0.72], [0, 1]];
    case 'kite':
      // A true kite: top point, widest across the upper-middle, long point at the
      // bottom — one vertical axis through top and bottom points. Inscribed [0,1].
      return [[0.5, 0], [1, 0.38], [0.5, 1], [0, 0.38]];
    case 'parallelogram':
      // PowerPoint `parallelogram` preset (default skew ~0.25): top edge shifted
      // right, bottom edge shifted left. No axis. Verts let the fold preview show
      // the mismatch when a vertical/horizontal candidate is tested on it.
      return [[0.25, 0], [1, 0], [0.75, 1], [0, 1]];
    case 'pentagon':
      // Regular pentagon, apex at top, inscribed to fill the box (the preset's shape).
      return regularNgon(5, -90);
    case 'hexagon':
      // PowerPoint `hexagon`: pointy left/right, flat top and bottom — a regular
      // hexagon with a vertex at 0° (right) and 180° (left).
      return regularNgon(6, 0);
    default:
      return null;   // parallelogram, trapezium, right-triangle → no axes
  }
}

// A regular n-gon centred in the unit box, the first vertex at `startDeg`
// (measured clockwise-from-east in SVG's y-down space), then scaled and shifted
// so its bounding box is exactly [0,1]×[0,1] — the same fit the preset uses.
function regularNgon(n, startDeg) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = ((startDeg + (360 / n) * i) * Math.PI) / 180;
    pts.push([Math.cos(a), Math.sin(a)]);
  }
  const xs = pts.map(function (p) { return p[0]; });
  const ys = pts.map(function (p) { return p[1]; });
  const minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
  const minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
  const sw = maxX - minX, sh = maxY - minY;
  return pts.map(function (p) {
    return [(p[0] - minX) / sw, (p[1] - minY) / sh];
  });
}

// The symmetry axes for a polygon, as index pairs/derivations on its vertices.
// Returns a list of { a, b } where each endpoint is a point [x,y] in unit space.
function unitAxes(name, V) {
  const mid = function (p, q) { return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; };
  const n = V.length;

  if (name === 'square') {
    // 2 diagonals + 2 mid-lines.
    return [
      { a: V[0], b: V[2] },                 // diagonal
      { a: V[1], b: V[3] },                 // diagonal
      { a: mid(V[0], V[1]), b: mid(V[2], V[3]) },   // top-mid → bottom-mid (vertical)
      { a: mid(V[1], V[2]), b: mid(V[3], V[0]) }    // right-mid → left-mid (horizontal)
    ];
  }
  if (name === 'rectangle') {
    // mid-lines only, NOT the diagonals.
    return [
      { a: mid(V[0], V[1]), b: mid(V[2], V[3]) },   // vertical
      { a: mid(V[1], V[2]), b: mid(V[3], V[0]) }    // horizontal
    ];
  }
  if (name === 'rhombus' || name === 'diamond') {
    // the 2 diagonals.
    return [
      { a: V[0], b: V[2] },
      { a: V[1], b: V[3] }
    ];
  }
  if (name === 'triangle' || name === 'equilateral-triangle') {
    // each vertex → midpoint of the opposite side.
    return [
      { a: V[0], b: mid(V[1], V[2]) },
      { a: V[1], b: mid(V[2], V[0]) },
      { a: V[2], b: mid(V[0], V[1]) }
    ];
  }
  if (name === 'isosceles-triangle' || name === 'kite') {
    // a single vertical axis: apex (V[0], the top point) → midpoint of the base.
    // For the kite the "base" midpoint is the bottom point itself (V[2]).
    if (name === 'kite') return [{ a: V[0], b: V[2] }];
    return [{ a: V[0], b: mid(V[1], V[2]) }];
  }
  if (name === 'scalene-triangle' || name === 'parallelogram') {
    return [];   // no equal sides / no axis — nothing to draw, which is correct
  }
  if (name === 'pentagon') {
    // odd n: each vertex → midpoint of the opposite side.
    const axes = [];
    const half = Math.floor(n / 2);
    for (let i = 0; i < n; i++) {
      const j = (i + half) % n;            // first vertex of the opposite side
      const k = (i + half + 1) % n;        // second vertex of the opposite side
      axes.push({ a: V[i], b: mid(V[j], V[k]) });
    }
    return axes;
  }
  if (name === 'hexagon') {
    // even n: n/2 vertex-to-opposite-vertex + n/2 midpoint-to-opposite-midpoint.
    const axes = [];
    const half = n / 2;
    for (let i = 0; i < half; i++) {
      axes.push({ a: V[i], b: V[i + half] });                      // through opposite vertices
    }
    for (let i = 0; i < half; i++) {
      const m1 = mid(V[i], V[(i + 1) % n]);
      const m2 = mid(V[(i + half) % n], V[(i + half + 1) % n]);
      axes.push({ a: m1, b: m2 });                                 // through opposite edge midpoints
    }
    return axes;
  }
  return [];
}

// Public: the symmetry lines for a named polygon, as absolute endpoints in the
// box's coordinate space. Returns [] when the shape has no line of symmetry
// (parallelogram, trapezium, generic right triangle) — drawing nothing is the
// correct, intended outcome.
function symmetryLinesFor(name, box) {
  const key = String(name || '').toLowerCase();
  const V = unitVertices(key);
  if (!V) return [];
  const axes = unitAxes(key, V);
  const toAbs = function (p) {
    return { x: box.x + p[0] * box.w, y: box.y + p[1] * box.h };
  };
  return axes.map(function (ax) {
    const a = toAbs(ax.a), b = toAbs(ax.b);
    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  });
}

// How many symmetry lines a named shape has — handy for tests and callers.
function symmetryLineCount(name) {
  const key = String(name || '').toLowerCase();
  const V = unitVertices(key);
  if (!V) return 0;
  return unitAxes(key, V).length;
}

// The named shape's outline as ABSOLUTE vertices in the box's coordinate space,
// in drawing order. Returns null for a shape with no vertex template (the preset
// shapes whose outline a caller doesn't need). Used by the candidate-line / fold-
// preview teaching code to draw the shape and its reflection from the same points.
function polygonVerticesFor(name, box) {
  const V = unitVertices(String(name || '').toLowerCase());
  if (!V) return null;
  return V.map(function (p) {
    return { x: box.x + p[0] * box.w, y: box.y + p[1] * box.h };
  });
}

// One CANDIDATE line of symmetry, by named position, as endpoints in the box's
// coordinate space — for the teaching slides that test a single line (which may
// be WRONG) rather than revealing the whole correct set. Positions:
//   "vertical"        top-mid → bottom-mid
//   "horizontal"      left-mid → right-mid
//   "diagonal-tlbr"   top-left corner → bottom-right corner
//   "diagonal-trbl"   top-right corner → bottom-left corner
function candidateLineFor(position, box) {
  const x0 = box.x, y0 = box.y, x1 = box.x + box.w, y1 = box.y + box.h;
  const mx = box.x + box.w / 2, my = box.y + box.h / 2;
  switch (String(position || '').toLowerCase()) {
    case 'vertical':       return { x1: mx, y1: y0, x2: mx, y2: y1 };
    case 'horizontal':     return { x1: x0, y1: my, x2: x1, y2: my };
    case 'diagonal-tlbr':  return { x1: x0, y1: y0, x2: x1, y2: y1 };
    case 'diagonal-trbl':  return { x1: x1, y1: y0, x2: x0, y2: y1 };
    default:               return null;
  }
}

// Reflect a point across the infinite line through (a)→(b). Standard formula:
// project onto the line, then mirror. Returns { x, y }.
function reflectPointAcrossLine(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-9) return { x: p.x, y: p.y };
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  const projX = a.x + t * dx, projY = a.y + t * dy;
  return { x: 2 * projX - p.x, y: 2 * projY - p.y };
}

// Reflect a whole outline (array of {x,y}) across the candidate line a→b. The
// fold/mirror preview draws this reflected outline: it lands exactly on the real
// shape when the line IS an axis of symmetry, and sticks out / leaves a gap when
// it is NOT — which is exactly what shows a child "the two halves match" or not.
function reflectOutlineAcrossLine(points, a, b) {
  return points.map(function (p) { return reflectPointAcrossLine(p, a, b); });
}

module.exports = {
  symmetryLinesFor, symmetryLineCount, unitVertices,
  polygonVerticesFor, candidateLineFor,
  reflectPointAcrossLine, reflectOutlineAcrossLine
};
