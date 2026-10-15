'use strict';

// THE 2D shape. One drawing, placed by the board, the worksheet, the working
// wall and the stick-in pack.
//
// One or more shapes side by side, for "name the shape", "test this line of
// symmetry", "count the right angles" and "find the perimeter". It was two
// pictures: the board's `polygon` drew named shapes in PowerPoint geometry with
// the teaching extras (every line of symmetry, one candidate line being tested,
// the fold preview, a tick or a cross), and the sheet's `shape` drew an ink
// outline with its measurements written on the sides. Neither could do the
// other's job, the wall and the stick-in pack could draw neither, and a child
// who tested a line of symmetry on a pale blue kite on the board met a bare
// black kite on paper (13 September 2026). Each surface now passes only the box
// it has and its profile (shared/visuals/surface-profiles.js). The symmetry
// maths stays in polygon-symmetry.js.
//
//   tightSvg(spec, profile) -> { svg, w, h, aspect, layout }
//   cacheKey(spec, profile) -> string
//   minWidthPt(spec, profile)
//
// ─── the spec ────────────────────────────────────────────────────────────
//
//   shapes   [{ name, label, sideLabels, angleLabels, candidate, verdict, fold,
//               aspect, sides, vertices }]
//     name       square, rectangle, triangle (equilateral), isosceles-triangle,
//                scalene-triangle, right-triangle, pentagon, hexagon, rhombus,
//                kite, parallelogram, trapezium, or regular-polygon with `sides`
//                (3 to 10)
//     label      a caption under that one shape ("Kite")
//     sideLabels measurements written outside the sides, in drawing order
//                (a rectangle: top, right, bottom, left; a triangle from its
//                apex clockwise; a right-angled triangle: base, slope, height)
//     angleLabels written inside at each corner, in the question blue
//     candidate  ONE line of symmetry to test, which may be wrong (the teacher
//                tests a line that fails): "vertical", "horizontal",
//                "diagonal-tlbr", "diagonal-trbl"
//     verdict    "pass" draws a big green tick, "fail" a red cross, beside it
//     fold       true reflects the shape across the candidate line and shows it
//                as a translucent ghost: it lands exactly on the shape when the
//                line IS a line of symmetry, and sticks out when it is not
//     aspect     width:height, to draw a longer or squarer rectangle
//     vertices   [[x, y], ...] for a triangle drawn to exact proportions
//     roomFor    side labels this drawing does not carry but keeps room for, in
//                the same order as sideLabels. The board sets it, never a
//                designer: the same shape on a question slide and on its
//                answers slide is one shape to the class, and it used to
//                shrink and move when the answers added lengths (290px then
//                218px, 7 October 2026), because the lengths take their room
//                from the shape. Each slide keeps room for the longest length
//                any of them writes on that side.
//     parts      the rectangles a rectilinear shape (an L, a T, a staircase,
//                drawn from `vertices`) is split into to find its area:
//                [{ corners, label, note, sideLabels, shade, missing }].
//                `corners` is two opposite corners of the rectangle in the
//                same numbers as `vertices`, so a part always lands on real
//                corners. The drawing works out the split: every edge of a
//                part that is not the shape's own outline is drawn as a dashed
//                line, so the designer never places a line. `label` ("1") is
//                written in the middle of the part, in a ring when it is one
//                or two characters; `note` ("10 × 3 = 30 cm²") goes under it
//                and moves to a numbered list below the shape when a part is
//                too small to hold it. `sideLabels` are that part's own
//                lengths in the order top, right, bottom, left, for a length
//                that is not a whole side of the shape: on a dashed line it is
//                written inside the part beside the line, on a stretch of the
//                outline it is written outside with a bracket marking the
//                stretch. `shade` tints the part being worked on. `missing`
//                is a rectangle OUTSIDE the shape (the corner cut away), for
//                finding the area as the whole rectangle take away the corner.
//     pickOut    "edge" draws the outline thick in the highlight colour with
//                nothing inside (perimeter is the distance round the edge),
//                "inside" fills the shape and thins the outline (area is the
//                space inside), so two word cards need not show one picture
//     roomForParts  parts this drawing does not carry but keeps room for. The
//                board sets it, never a designer, for the reason it sets
//                `roomFor`: an answers slide adds the split to the shape the
//                question showed, and the shape must not shrink or move.
//   partsAnswer          true draws every part's line, number, note and lengths
//                        in answer green (the answers slide)
//   symmetryLines        true overlays every correct line of symmetry, dashed
//   symmetryLinesAnswer  true draws those lines in answer green (a reveal)
//
// The sheet's older single-shape spelling still draws: { type: "rectangle" |
// "right-triangle" | "triangle" | "regular-polygon", labels: { top, right,
// bottom, left } or { base, height, hypotenuse }, style, sideLabels,
// angleLabels, sides, sideLabel, aspect, vertices }.
//
// A board caption for the whole object (`label`, with its "||" answer reveal)
// is typed text the board sets under the placed picture, not part of this drawing.

const { profileFor, INK_TONES } = require('./surface-profiles');
const { textWidthEm } = require('../text/comic-glyph-width');
const sym = require('./polygon-symmetry');

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
// Height as a share of width for each named shape, the proportions that make it
// read true (an equilateral triangle is about 0.87 as tall as it is wide).
const RATIO = {
  square: 1, rectangle: 0.64, triangle: 0.87, 'equilateral-triangle': 0.87, 'isosceles-triangle': 0.95,
  'scalene-triangle': 0.8, 'right-triangle': 0.85, pentagon: 0.95, hexagon: 0.88, rhombus: 1.1,
  diamond: 1.1, kite: 1.2, parallelogram: 0.62, trapezium: 0.62, trapezoid: 0.62,
};
const BODY_EM = 20; // widest a shape grows on paper, in ems of the profile font
const BODY_MIN_EM = 2.5; // narrower than this a labelled side is a smudge
const COL_GAP_EM = 1.2; // between shapes in a row
const SIDE_GAP_EM = 0.35; // between a side and its measurement
const ANGLE_IN = 0.144; // an angle label's distance in from its corner, as a share of the body
const ANGLE_IN_MIN_EM = 1.3;
const OUTLINE = 0.017; const OUTLINE_MIN = 1.5; // share of the body width, pt
const SYM_W = 0.011; const SYM_W_MIN = 1;
const CAND_W = 0.017; const CAND_W_MIN = 1.5;
const VERDICT = 0.42; // tick or cross size, as a share of the body's shorter side
const VERDICT_W = 0.033; const VERDICT_W_MIN = 2.5;
const RIGHT_MARK = 0.08; // right-angle square, as a share of the body's shorter side
const CAPTION_GAP_EM = 0.4;
const FILL = '#CCE2F5'; // pale blue body
const SYM_COLOUR = '#333333'; // neutral dark on a question
const CAND_COLOUR = '#1F1F1F'; // the line under test: "the line we are trying", not an answer
const GHOST_FILL = '#F4B6C2'; // translucent pink mirrored half
const GHOST_LINE = '#C0392B';
const GHOST_OPACITY = 0.45;
// The parts of a split shape.
const SPLIT_W = 0.014; const SPLIT_W_MIN = 1.5; // dashed split line, share of the body width, pt
const PART_RING_EM = 0.72; // radius of the ring round a part's number
const PART_RING_W_EM = 0.07;
const PART_PAD_EM = 0.25; // a part's words keep this far from its edges
const PART_GAP_EM = 0.2; // between a part's number and its note
const NOTE_ROW_EM = 1.75; // one row of the notes listed below the shape
const BRACKET_GAP_EM = 0.45; // from a side to the bracket marking a stretch of it
const BRACKET_TICK_EM = 0.5; // the bracket's end ticks
const BRACKET_W_EM = 0.06;
const SHADE = '#FBE2C7'; // the part being worked on: the house highlight, as a tint
const MISSING_FILL = '#F0F0F0'; // the corner that is not there
const PICK_EDGE_W = 2.6; // how many times thicker the outline is drawn when it is picked out
const PICK_INSIDE_LINE = '#8C8C8C'; // the outline when the inside is picked out
// ────────────────────────────────────────────────────────────────────────────

const SHEET_TRIANGLE = { equilateral: 'triangle', isosceles: 'isosceles-triangle', scalene: 'scalene-triangle', right: 'right-triangle' };

function f2(n) {
  return Math.round(n * 100) / 100;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function asProfile(profileOrSurface, box) {
  return typeof profileOrSurface === 'string' ? profileFor(profileOrSurface, box || { widthPt: 500 }) : profileOrSurface;
}

// Scale points so their bounding box is exactly [0,1] by [0,1].
function fitUnit(pts) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs); const minY = Math.min(...ys);
  const sw = Math.max(...xs) - minX || 1; const sh = Math.max(...ys) - minY || 1;
  return pts.map((p) => [(p[0] - minX) / sw, (p[1] - minY) / sh]);
}

// The outline in the unit box, and the height:width that makes it read true.
function unitShape(shape) {
  const name = shape.name;
  if (name === 'regular-polygon') {
    const n = Math.round(Number(shape.sides) || 6);
    if (n < 3 || n > 10) throw new Error(`POLYGON_SIDES: a regular polygon has 3 to 10 sides, not ${shape.sides}.`);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i * 2 * Math.PI) / n - Math.PI / 2;
      pts.push([Math.cos(a), Math.sin(a)]);
    }
    const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
    const ratio = (Math.max(...ys) - Math.min(...ys)) / (Math.max(...xs) - Math.min(...xs));
    return { verts: fitUnit(pts), ratio };
  }
  if (Array.isArray(shape.vertices) && shape.vertices.length >= 3) {
    const pts = shape.vertices.map((v) => [Number(v[0]), Number(v[1])]);
    const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
    const ratio = (Math.max(...ys) - Math.min(...ys)) / ((Math.max(...xs) - Math.min(...xs)) || 1);
    const frame = { minX: Math.min(...xs), minY: Math.min(...ys), sw: Math.max(...xs) - Math.min(...xs) || 1, sh: Math.max(...ys) - Math.min(...ys) || 1 };
    return { verts: fitUnit(pts), ratio, outline: pts, frame };
  }
  let verts = sym.unitVertices(name);
  if (name === 'right-triangle') verts = [[0, 1], [1, 1], [0, 0]]; // the right angle at the bottom-left
  // The trapezium is the one quadrilateral here with no line of symmetry, so it
  // is drawn with unequal slopes; a symmetric trapezium would show a child a
  // line of symmetry the answer overlay says is not there.
  if (name === 'trapezium' || name === 'trapezoid') verts = [[0.18, 0], [0.72, 0], [1, 1], [0, 1]];
  if (!verts) {
    throw new Error(
      `UNKNOWN_SHAPE: "${name}". Known: ${Object.keys(RATIO).join(', ')}, regular-polygon`
    );
  }
  return { verts, ratio: RATIO[name] };
}

function shapeFromSheet(spec) {
  const type = spec.type;
  const out = { angleLabels: spec.angleLabels || [], vertices: spec.vertices };
  if (type === 'rectangle') {
    const l = spec.labels || {};
    return { ...out, name: 'rectangle', aspect: spec.aspect != null ? spec.aspect : 2.5, sideLabels: [l.top, l.right, l.bottom, l.left] };
  }
  if (type === 'right-triangle') {
    const l = spec.labels || {};
    return { ...out, name: 'right-triangle', aspect: spec.aspect != null ? spec.aspect : 1 / 0.65, sideLabels: [l.base, l.hypotenuse, l.height] };
  }
  if (type === 'triangle') {
    return { ...out, name: SHEET_TRIANGLE[spec.style] || 'scalene-triangle', sideLabels: spec.sideLabels || [] };
  }
  if (type === 'regular-polygon') {
    const n = spec.sides != null ? spec.sides : 6;
    return { name: 'regular-polygon', sides: n, sideLabel: spec.sideLabel };
  }
  throw new Error(`UNKNOWN_SHAPE: "${type}". Known: rectangle, right-triangle, triangle, regular-polygon`);
}

function normalise(spec = {}) {
  const raw = spec.type != null && !Array.isArray(spec.shapes) ? [shapeFromSheet(spec)] : Array.isArray(spec.shapes) ? spec.shapes : [];
  if (!raw.length) throw new Error('POLYGON_NO_SHAPES: a polygon needs at least one shape in `shapes`.');
  const shapes = raw.map((s) => {
    const name = String((s && s.name) || '').toLowerCase();
    const u = unitShape({ ...s, name });
    const ratio = s.aspect != null && Number(s.aspect) > 0 ? 1 / Number(s.aspect) : u.ratio;
    const sideLabels = (Array.isArray(s.sideLabels) ? s.sideLabels : []).map((t) => (t == null || t === '' ? '' : String(t)));
    if (s.sideLabel != null && s.sideLabel !== '') {
      // One measurement for a regular polygon goes on its bottom side.
      let best = 0; let bestY = -Infinity;
      u.verts.forEach((v, i) => {
        const y = (v[1] + u.verts[(i + 1) % u.verts.length][1]) / 2;
        if (y > bestY + 1e-9) { bestY = y; best = i; }
      });
      sideLabels[best] = String(s.sideLabel);
    }
    const candidate = s.candidate ? String(s.candidate).toLowerCase() : '';
    const parts = partsOf(s.parts, u, 'parts');
    const keptParts = partsOf(s.roomForParts, u, 'roomForParts');
    const pickOut = ['edge', 'inside'].includes(String(s.pickOut || '').toLowerCase()) ? String(s.pickOut).toLowerCase() : '';
    return {
      ...(parts.length || keptParts.length ? { parts, keptParts, outline: u.outline, frame: u.frame } : {}),
      ...(pickOut ? { pickOut } : {}),
      name,
      verts: u.verts,
      ratio,
      label: s.label ? String(s.label) : '',
      sideLabels,
      roomFor: (Array.isArray(s.roomFor) ? s.roomFor : []).map((t) => (t == null ? '' : String(t))),
      angleLabels: (Array.isArray(s.angleLabels) ? s.angleLabels : []).map((t) => (t == null ? '' : String(t))),
      candidate: sym.candidateLineFor(candidate, { x: 0, y: 0, w: 1, h: 1 }) ? candidate : '',
      verdict: s.verdict === 'pass' || s.verdict === 'fail' ? s.verdict : '',
      fold: s.fold === true && Boolean(candidate),
      sides: s.sides,
    };
  });
  return {
    shapes, symmetryLines: spec.symmetryLines === true, answer: spec.symmetryLinesAnswer === true,
    ...(spec.partsAnswer === true ? { partsAnswer: true } : {}),
  };
}

// ─── the parts of a split shape ──────────────────────────────────────────

function insideOutline(x, y, outline) {
  let hit = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const a = outline[i]; const b = outline[j];
    if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) hit = !hit;
  }
  return hit;
}

const partKey = (p) => JSON.stringify([p.x0, p.y0, p.x1, p.y1, p.missing]);

// The parts as rectangles in the shape's own measurements, refused by name
// when one is not where a part can be. A part that pokes out of the shape, or
// two that overlap, is a sum that comes out wrong on the board, so it is said
// here rather than drawn.
function partsOf(raw, u, field) {
  if (raw == null || (Array.isArray(raw) && !raw.length)) return [];
  if (!Array.isArray(raw)) throw new Error(`POLYGON_PARTS: \`${field}\` is a list of parts, each with two opposite \`corners\`.`);
  if (!u.outline) {
    throw new Error('POLYGON_PARTS_NEED_VERTICES: a shape is split into parts in its own measurements, so give the shape as `vertices` (its corners in order) rather than by name.');
  }
  const parts = raw.map((p, i) => {
    const c = p && p.corners;
    const ok = Array.isArray(c) && c.length === 2 && c.every((q) => Array.isArray(q) && q.length >= 2 && q.every((v) => Number.isFinite(Number(v))));
    if (!ok) throw new Error(`POLYGON_PART_CORNERS: part ${i + 1} needs \`corners\`: two opposite corners of its rectangle, [[x, y], [x, y]], in the same numbers as the shape's \`vertices\`.`);
    const x0 = Math.min(Number(c[0][0]), Number(c[1][0])); const x1 = Math.max(Number(c[0][0]), Number(c[1][0]));
    const y0 = Math.min(Number(c[0][1]), Number(c[1][1])); const y1 = Math.max(Number(c[0][1]), Number(c[1][1]));
    if (!(x1 > x0) || !(y1 > y0)) throw new Error(`POLYGON_PART_CORNERS: part ${i + 1}'s two corners are on one line, so it is not a rectangle. Give two OPPOSITE corners.`);
    const missing = p.missing === true;
    // Points just inside the rectangle: all in the shape for a part, all out
    // of it for the corner that was cut away.
    let inside = 0; let total = 0;
    for (let a = 1; a <= 9; a += 2) {
      for (let b = 1; b <= 9; b += 2) {
        total++;
        if (insideOutline(x0 + ((x1 - x0) * a) / 10, y0 + ((y1 - y0) * b) / 10, u.outline)) inside++;
      }
    }
    if (!missing && inside < total) {
      throw new Error(`POLYGON_PART_OUTSIDE: part ${i + 1} (corners ${JSON.stringify(c)}) reaches outside the shape. Each part is a rectangle wholly inside the shape; a cut-away corner drawn outside it takes \`missing: true\`.`);
    }
    if (missing && inside > 0) {
      throw new Error(`POLYGON_PART_NOT_MISSING: part ${i + 1} (corners ${JSON.stringify(c)}) is marked \`missing\` but lies inside the shape. A missing part is the rectangle cut away from the corner, outside the outline.`);
    }
    const sideLabels = (Array.isArray(p.sideLabels) ? p.sideLabels : []).slice(0, 4).map((t) => (t == null ? '' : String(t)));
    return {
      x0, y0, x1, y1, missing,
      label: p.label == null ? '' : String(p.label),
      note: p.note == null ? '' : String(p.note),
      sideLabels,
      shade: p.shade === true,
    };
  });
  // Kept parts come from several slides, which may split one shape two ways.
  if (field === 'roomForParts') return parts;
  parts.forEach((a, i) => {
    parts.slice(i + 1).forEach((b, k) => {
      const eps = 1e-9;
      if (Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > eps && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > eps) {
        throw new Error(`POLYGON_PARTS_OVERLAP: parts ${i + 1} and ${i + k + 2} overlap, so the space where they cross would be counted twice. Parts meet along an edge and never cross.`);
      }
    });
  });
  return parts;
}

// Where a part's edge (a to b, in the shape's measurements) runs along the
// shape's own outline: [{ t0, t1, side, whole }] as shares of the edge.
function alongOutline(a, b, outline) {
  const dx = b[0] - a[0]; const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const eps = 1e-7 * Math.max(1, len2);
  const out = [];
  outline.forEach((p, side) => {
    const q = outline[(side + 1) % outline.length];
    if (Math.abs(dx * (p[1] - a[1]) - dy * (p[0] - a[0])) > eps || Math.abs(dx * (q[1] - a[1]) - dy * (q[0] - a[0])) > eps) return;
    const tp = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
    const tq = ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / len2;
    const t0 = Math.max(0, Math.min(tp, tq)); const t1 = Math.min(1, Math.max(tp, tq));
    if (t1 - t0 > 1e-6) out.push({ t0, t1, side, whole: Math.min(tp, tq) > -1e-6 && Math.max(tp, tq) < 1 + 1e-6 && t1 - t0 > 1 - 1e-6 });
  });
  return out.sort((m, n) => m.t0 - n.t0);
}

// The stretches of [0,1] the given intervals leave bare.
function bareStretches(covered) {
  const bare = []; let at = 0;
  covered.forEach((c) => { if (c.t0 - at > 1e-6) bare.push([at, c.t0]); at = Math.max(at, c.t1); });
  if (1 - at > 1e-6) bare.push([at, 1]);
  return bare;
}

// The largest size, from `pt` down to `floor`, at which text is no wider than `room`.
function fitPt(text, room, pt, floor, bold) {
  const em = textWidthEm(text, bold) || 1;
  return Math.max(floor, Math.min(pt, room / em));
}

// A note too wide for its part breaks once, at its "=" if it has one ("10 × 3"
// over "= 30 cm²"), else at the space nearest its middle.
function breakNote(note) {
  const eq = note.indexOf(' = ');
  if (eq > 0) return [note.slice(0, eq), note.slice(eq + 1)];
  const mid = note.length / 2; let best = -1;
  for (let i = 0; i < note.length; i++) if (note[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return best > 0 ? [note.slice(0, best), note.slice(best + 1)] : [note];
}

// Everything the parts of one shape draw. `g.verts` and the body are in
// points; each part keeps its measurements. A kept part (one another slide of
// the group draws) takes its room and draws nothing.
function partsGeometry(shape, g, bodyW, bodyH, profile, T, sideRoom, grow, notesBelow) {
  const f = shape.frame;
  const X = (x) => ((x - f.minX) / f.sw) * bodyW; const Y = (y) => ((y - f.minY) / f.sh) * bodyH;
  const floor = Math.min(T, profile.minFontPt);
  const textH = (pt) => pt * 1.1;
  const bold = profile.bold;
  const pad = PART_PAD_EM * T;
  const wider = (a, b) => (textWidthEm(b || '', bold) > textWidthEm(a || '', bold) ? b : a || '');
  // A part drawn here may carry fewer words than the same part on another
  // slide of its group; the longer wording keeps its room.
  const keptWords = new Map();
  shape.keptParts.forEach((p) => {
    const was = keptWords.get(partKey(p));
    keptWords.set(partKey(p), was
      ? { ...was, label: wider(was.label, p.label), note: wider(was.note, p.note), sideLabels: [0, 1, 2, 3].map((k) => wider(was.sideLabels[k], p.sideLabels[k])) }
      : p);
  });
  const own = shape.parts.map((p) => ({ ...p, draw: true }));
  const seen = new Set(own.map(partKey));
  const kept = [...keptWords.values()].filter((p) => !seen.has(partKey(p))).map((p) => ({ ...p, draw: false }));
  const dashes = new Map(); // "h:y" or "v:x" -> [[from, to]]
  let notesFit = true;
  const listed = [];

  [...own, ...kept].forEach((p) => {
    const twin = keptWords.get(partKey(p)) || {};
    const cx = (p.x0 + p.x1) / 2; const cy = (p.y0 + p.y1) / 2;
    const edges = [
      { a: [p.x0, p.y0], b: [p.x1, p.y0], inward: { x: 0, y: 1 } },
      { a: [p.x1, p.y0], b: [p.x1, p.y1], inward: { x: -1, y: 0 } },
      { a: [p.x1, p.y1], b: [p.x0, p.y1], inward: { x: 0, y: -1 } },
      { a: [p.x0, p.y1], b: [p.x0, p.y0], inward: { x: 1, y: 0 } },
    ];
    // The part's own space, and the words already written in it that its
    // number has to keep clear of.
    const whole = { x0: X(p.x0) + pad, y0: Y(p.y0) + pad, x1: X(p.x1) - pad, y1: Y(p.y1) - pad };
    const taken = [];
    edges.forEach((e, k) => {
      const covered = alongOutline(e.a, e.b, shape.outline);
      if (p.draw) {
        bareStretches(covered).forEach(([t0, t1]) => {
          const horizontal = e.a[1] === e.b[1];
          const key = horizontal ? `h:${e.a[1]}` : `v:${e.a[0]}`;
          const at = (t) => (horizontal ? e.a[0] + (e.b[0] - e.a[0]) * t : e.a[1] + (e.b[1] - e.a[1]) * t);
          if (!dashes.has(key)) dashes.set(key, []);
          dashes.get(key).push([Math.min(at(t0), at(t1)), Math.max(at(t0), at(t1))]);
        });
      }
      const mine = p.draw ? p.sideLabels[k] || '' : '';
      const widest = wider(p.sideLabels[k], (twin.sideLabels || [])[k]);
      // The lengths of the two inside sides are written in the cut-away corner.
      if (p.missing) {
        covered.forEach((c) => {
          const room = sideRoom[c.side];
          if (!room) return;
          const deep = SIDE_GAP_EM * T + Math.abs(e.inward.x) * room.tw + Math.abs(e.inward.y) * room.th;
          const A0 = { x: X(e.a[0]), y: Y(e.a[1]) }; const B0 = { x: X(e.b[0]), y: Y(e.b[1]) };
          taken.push({ x0: Math.min(A0.x, B0.x, A0.x + e.inward.x * deep), x1: Math.max(A0.x, B0.x, A0.x + e.inward.x * deep), y0: Math.min(A0.y, B0.y, A0.y + e.inward.y * deep), y1: Math.max(A0.y, B0.y, A0.y + e.inward.y * deep) });
        });
      }
      if (!widest) return;
      const A = { x: X(e.a[0]), y: Y(e.a[1]) }; const B = { x: X(e.b[0]), y: Y(e.b[1]) };
      const mid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
      const onOutline = covered.reduce((t, c) => t + c.t1 - c.t0, 0) > 1 - 1e-6;
      let n; let offset; let bracket; let pt = T;
      if (onOutline) {
        // A stretch of the shape's own outline: written outside, beyond the
        // side's own length when the two would meet, with a bracket saying
        // which stretch it measures.
        const side = covered[0].side;
        const s1 = g.verts[side]; const s2 = g.verts[(side + 1) % g.verts.length];
        const out = outwardNormal(s1, s2, g.clockwise);
        n = { x: out.nx, y: out.ny };
        bracket = !(covered.length === 1 && covered[0].whole);
        offset = bracket ? BRACKET_GAP_EM * T : 0;
        const taken = sideRoom[side];
        if (taken) {
          const run = (q) => q.x * Math.abs(n.y) + q.y * Math.abs(n.x); // how far along the side
          const reach = Math.abs(n.y) * (taken.tw / 2) + Math.abs(n.x) * (taken.th / 2);
          const sideMid = (run(s1) + run(s2)) / 2 + Math.sign(run(s2) - run(s1)) * (taken.slide || 0);
          if (Math.max(run(A), run(B)) > sideMid - reach - 0.3 * T && Math.min(run(A), run(B)) < sideMid + reach + 0.3 * T) {
            offset = SIDE_GAP_EM * T + Math.abs(n.x) * taken.tw + Math.abs(n.y) * taken.th + BRACKET_GAP_EM * T;
          }
        }
      } else {
        // A dashed line, or an edge that is partly one: written inside the
        // part it belongs to (outside it for a cut-away corner), beside the edge.
        const sign = p.missing ? -1 : 1;
        n = { x: e.inward.x * sign, y: e.inward.y * sign };
        bracket = covered.length > 0;
        offset = bracket ? BRACKET_GAP_EM * T : 0;
        if (!p.missing && n.x) pt = fitPt(widest, Math.abs(X(p.x1) - X(p.x0)) - offset - SIDE_GAP_EM * T - 2 * pad, T, floor, bold);
      }
      const tw = textWidthEm(widest, bold) * pt; const th = textH(pt);
      const half = Math.abs(n.x) * (tw / 2) + Math.abs(n.y) * (th / 2);
      const d = offset + SIDE_GAP_EM * T + half;
      const at = { x: mid.x + n.x * d, y: mid.y + n.y * d };
      grow(at.x - tw / 2, at.y - th / 2); grow(at.x + tw / 2, at.y + th / 2);
      if (!onOutline && !p.missing) taken.push({ x0: Math.min(at.x - tw / 2, mid.x), x1: Math.max(at.x + tw / 2, mid.x), y0: Math.min(at.y - th / 2, mid.y), y1: Math.max(at.y + th / 2, mid.y) });
      let mark = null;
      if (bracket) {
        const tick = (BRACKET_TICK_EM * T) / 2;
        const a2 = { x: A.x + n.x * offset, y: A.y + n.y * offset }; const b2 = { x: B.x + n.x * offset, y: B.y + n.y * offset };
        mark = { a: a2, b: b2, tick, n };
        grow(a2.x - n.x * tick, a2.y - n.y * tick); grow(b2.x + n.x * tick, b2.y + n.y * tick);
      }
      if (mine) {
        const mineW = textWidthEm(mine, bold) * pt;
        const mineHalf = Math.abs(n.x) * (mineW / 2) + Math.abs(n.y) * (th / 2);
        const md = offset + SIDE_GAP_EM * T + mineHalf;
        g.texts.push({ text: mine, x: mid.x + n.x * md, y: mid.y + n.y * md, pt, kind: 'part', w: mineW, h: th, part: p, edge: k, outside: onOutline || p.missing });
        if (mark) g.brackets.push(mark);
      }
    });

    // The part's number, with its note under it, in the middle of what is left.
    const label = p.draw ? p.label : '';
    const anyLabel = wider(p.label, twin.label);
    const note = wider(p.note, twin.note);
    const mineNote = p.draw ? p.note : '';
    const short = anyLabel.length > 0 && anyLabel.length <= 2;
    // The biggest clear rectangle beside, above or below what is written
    // there, so a number never sits on a length in a narrow part.
    const gap = 2 * PART_GAP_EM * T;
    let rooms = [whole];
    taken.forEach((t) => {
      rooms = rooms.flatMap((r) => {
        if (t.x1 <= r.x0 || t.x0 >= r.x1 || t.y1 <= r.y0 || t.y0 >= r.y1) return [r];
        return [
          { ...r, x1: t.x0 - gap }, { ...r, x0: t.x1 + gap }, { ...r, y1: t.y0 - gap }, { ...r, y0: t.y1 + gap },
        ].filter((q) => q.x1 > q.x0 && q.y1 > q.y0);
      });
    });
    const needW = (anyLabel ? (short ? 2 * PART_RING_EM : textWidthEm(anyLabel, true)) : 1) * floor;
    const needH = (anyLabel ? (short ? 2 * PART_RING_EM : 1.1) : 1) * floor;
    const worth = (r) => (r.x1 - r.x0 >= needW && r.y1 - r.y0 >= needH ? 1e9 : 0) + (r.x1 - r.x0) * (r.y1 - r.y0);
    const room = rooms.sort((m, q) => worth(q) - worth(m))[0] || whole;
    const rw = Math.max(room.x1 - room.x0, 0); const rh = Math.max(room.y1 - room.y0, 0);
    const mx = rw > 0 ? (room.x0 + room.x1) / 2 : X(cx); const my = rh > 0 ? (room.y0 + room.y1) / 2 : Y(cy);
    // A number wears its ring only where the ring fits: in a leg narrower
    // than the ring it would sit across both outlines, so it is written bare.
    const ringed = short && rw >= needW * 1.25 && rh >= needH * 1.1;
    // The number shrinks to stay inside a small part, to the readable floor.
    let lpt = T;
    if (anyLabel) {
      const wEm = ringed ? 2 * PART_RING_EM : textWidthEm(anyLabel, true);
      const hEm = ringed ? 2 * PART_RING_EM : 1.1;
      lpt = Math.max(floor, Math.min(T, rw / wEm, rh / hEm));
    }
    const labelH = anyLabel ? (ringed ? 2 * PART_RING_EM * lpt : 1.1 * lpt) : 0;
    let noteLines = []; let npt = T;
    if (note && !notesBelow) {
      const depth = rh - labelH - (anyLabel ? PART_GAP_EM * T : 0);
      const sizeFor = (lines) => {
        const size = Math.min(...lines.map((l) => fitPt(l, rw, T, floor, bold)));
        const fits = lines.every((l) => textWidthEm(l, bold) * size <= rw + 0.01) && lines.length * textH(size) <= depth + 0.01;
        return fits ? size : 0;
      };
      const one = sizeFor([note]);
      const two = one ? 0 : sizeFor(breakNote(note));
      if (one) { noteLines = [note]; npt = one; } else if (two) { noteLines = breakNote(note); npt = two; } else notesFit = false;
    }
    const stackH = labelH + (noteLines.length ? PART_GAP_EM * T + noteLines.length * textH(npt) : 0);
    let y = my - stackH / 2;
    if (label) {
      if (ringed) g.rings.push({ cx: mx, cy: y + labelH / 2, r: PART_RING_EM * lpt, pt: lpt, text: label, part: p });
      else g.texts.push({ text: label, x: mx, y: y + labelH / 2, pt: lpt, kind: 'part', strong: true, w: textWidthEm(label, true) * lpt, h: labelH, part: p });
    }
    y += labelH + (anyLabel ? PART_GAP_EM * T : 0);
    if (mineNote && noteLines.length) {
      (noteLines.length === 2 ? breakNote(mineNote) : [mineNote]).forEach((line, i) => {
        g.texts.push({ text: line, x: mx, y: y + textH(npt) * (i + 0.5), pt: npt, kind: 'part', w: textWidthEm(line, bold) * npt, h: textH(npt), part: p, note: true });
      });
    }
    if (note && notesBelow) listed.push({ label: anyLabel, note, text: mineNote, draw: p.draw && Boolean(mineNote), ringed: short });
    if (p.draw) g.partBoxes.push({ x: X(p.x0), y: Y(p.y0), w: X(p.x1) - X(p.x0), h: Y(p.y1) - Y(p.y0), shade: p.shade, missing: p.missing, part: p });
  });

  // One dashed line where two parts share an edge, however many parts name it.
  for (const [key, spans] of dashes) {
    const [kind, value] = key.split(':'); const v = Number(value);
    spans.sort((m, n) => m[0] - n[0]);
    const merged = [];
    spans.forEach((s) => { const last = merged[merged.length - 1]; if (last && s[0] <= last[1] + 1e-9) last[1] = Math.max(last[1], s[1]); else merged.push([s[0], s[1]]); });
    merged.forEach(([from, to]) => {
      g.splits.push(kind === 'h' ? { x1: X(from), y1: Y(v), x2: X(to), y2: Y(v) } : { x1: X(v), y1: Y(from), x2: X(v), y2: Y(to) });
    });
  }

  // Notes that would not fit their parts, listed under the shape against
  // their numbers, so a small part never carries a sum across its edges.
  if (listed.length) {
    const row = NOTE_ROW_EM * T; const r = PART_RING_EM * T * 0.8;
    const lead = (l) => (l.label ? (l.ringed ? 2 * r : textWidthEm(l.label, true) * T) + 0.4 * T : 0);
    const width = Math.max(...listed.map((l) => lead(l) + textWidthEm(l.note, bold) * T));
    const x0 = bodyW / 2 - width / 2; const top = g.bounds.maxY + 0.4 * T;
    let drawn = 0;
    listed.forEach((l) => {
      if (!l.draw) return;
      const cyRow = top + row * (drawn++ + 0.5);
      if (l.label && l.ringed) g.rings.push({ cx: x0 + r, cy: cyRow, r, pt: T * 0.8, text: l.label });
      else if (l.label) g.texts.push({ text: l.label, x: x0, y: cyRow, pt: T, kind: 'part', strong: true, anchor: 'start', w: textWidthEm(l.label, true) * T, h: textH(T) });
      g.texts.push({ text: l.text, x: x0 + lead(l), y: cyRow, pt: T, kind: 'part', anchor: 'start', w: textWidthEm(l.text, bold) * T, h: textH(T), listed: true });
    });
    grow(x0, top); grow(x0 + width, top + row * listed.length);
  }
  g.notesFit = notesFit;
  g.notesBelow = Boolean(notesBelow);
}

// Which way is out of the shape from one of its sides. It is read from the way
// the corners run round the shape, which is right for any outline. It used to
// point away from the average of the corners, and on an L-shape that average
// sits by the notch, so the two inside sides had it backwards and their
// lengths were written inside the shape, where "5 cm" in a 4 cm leg read as
// the leg's width (Year 5 rectilinear shapes, 7 October 2026).
function turnsClockwise(verts) {
  let twice = 0;
  verts.forEach((v, i) => {
    const n = verts[(i + 1) % verts.length];
    twice += v.x * n.y - n.x * v.y;
  });
  return twice > 0; // as drawn, y running down the page
}

function outwardNormal(p1, p2, clockwise) {
  const dx = p2.x - p1.x; const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  return clockwise ? { nx: dy / len, ny: -dx / len } : { nx: -dy / len, ny: dx / len };
}

// Whether the segment a-b passes through a box.
function crossesBox(a, b, box) {
  let t0 = 0; let t1 = 1;
  const dx = b.x - a.x; const dy = b.y - a.y;
  for (const [p, q] of [[-dx, a.x - box.x0], [dx, box.x1 - a.x], [-dy, a.y - box.y0], [dy, box.y1 - a.y]]) {
    if (Math.abs(p) < 1e-12) { if (q < 0) return false; continue; }
    const r = q / p;
    if (p < 0) t0 = Math.max(t0, r); else t1 = Math.min(t1, r);
    if (t0 > t1) return false;
  }
  return true;
}

// Everything one shape draws, at a body width, in points with the body's
// top-left at (0,0), and the box it all occupies.
function shapeGeometry(shape, bodyW, profile, T, notesBelow) {
  const bodyH = bodyW * shape.ratio;
  const box = { x: 0, y: 0, w: bodyW, h: bodyH };
  const verts = shape.verts.map((v) => ({ x: v[0] * bodyW, y: v[1] * bodyH }));
  const c = { x: verts.reduce((t, v) => t + v.x, 0) / verts.length, y: verts.reduce((t, v) => t + v.y, 0) / verts.length };
  const b = { minX: 0, minY: 0, maxX: bodyW, maxY: bodyH };
  const grow = (x, y) => { b.minX = Math.min(b.minX, x); b.maxX = Math.max(b.maxX, x); b.minY = Math.min(b.minY, y); b.maxY = Math.max(b.maxY, y); };
  const g = { box, verts, texts: [], ghost: null, candLine: null, symLines: [], verdict: null, rightMark: null, bounds: b, touches: 0 };
  const textH = T * 1.1;
  const clockwise = turnsClockwise(verts);
  const sideRoom = []; // the room each side's own length takes, for a part's bracket to step past

  const sideCount = Math.max(shape.sideLabels.length, (shape.roomFor || []).length);
  const placed = [];
  // A picked-out edge is drawn thick, and its lengths stand clear of the
  // extra thickness.
  const thick = shape.pickOut === 'edge' ? (Math.max(OUTLINE * bodyW, OUTLINE_MIN) * (PICK_EDGE_W - 1)) / 2 : 0;
  for (let i = 0; i < sideCount; i++) {
    const text = shape.sideLabels[i] || '';
    const kept = (shape.roomFor || [])[i] || '';
    if (!text && !kept) continue;
    const p1 = verts[i % verts.length]; const p2 = verts[(i + 1) % verts.length];
    const { nx, ny } = outwardNormal(p1, p2, clockwise);
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
    // The label sits against its side at its own width; the room it takes is
    // that of the widest label this side carries on any slide of its group.
    const place = (label, slide) => {
      const tw = textWidthEm(label, profile.bold) * T;
      const half = Math.abs(nx) * (tw / 2) + Math.abs(ny) * (textH / 2);
      const d = SIDE_GAP_EM * T + half + thick;
      return { tw, x: (p1.x + p2.x) / 2 + nx * d + ((p2.x - p1.x) / len) * slide, y: (p1.y + p2.y) / 2 + ny * d + ((p2.y - p1.y) / len) * slide };
    };
    const widest = textWidthEm(kept, profile.bold) > textWidthEm(text, profile.bold) ? kept : text;
    // How far the label may slide along its side and still sit beside it: to
    // the end of the side, or a little past it where the label is as long as
    // the side and would otherwise have nowhere to go.
    const along = Math.abs(nx) * textH + Math.abs(ny) * textWidthEm(widest, profile.bold) * T;
    placed.push({ i, text, kept, widest, place, slide: 0, reach: Math.max(0.6 * T, (len - along) / 2 - thick), tx: (p2.x - p1.x) / len, ty: (p2.y - p1.y) / len });
  }
  // Two lengths that would be written across each other slide apart, each
  // along its own side. In the notch of an L drawn small, "6 cm" under its
  // side and "5 cm" beside its side met at the inside corner and neither
  // could be read (two shapes in one drawing, 13 October 2026). A length
  // that touches nothing stays at the middle of its side.
  const boxOf = (q) => { const at = q.place(q.widest, q.slide); return { x0: at.x - at.tw / 2, x1: at.x + at.tw / 2, y0: at.y - textH / 2, y1: at.y + textH / 2, cx: at.x, cy: at.y }; };
  const touching = (a, b) => Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > -0.15 * T && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > -0.05 * T;
  let touches = 0;
  for (let pass = 0; pass < 40; pass++) {
    touches = 0;
    for (let a = 0; a < placed.length; a++) {
      for (let b = a + 1; b < placed.length; b++) {
        const A = boxOf(placed[a]); const B = boxOf(placed[b]);
        if (!touching(A, B)) continue;
        touches++;
        [[placed[a], A, B, 1], [placed[b], B, A, -1]].forEach(([q, mine, other, tie]) => {
          const away = (mine.cx - other.cx) * q.tx + (mine.cy - other.cy) * q.ty;
          const way = Math.abs(away) > 0.01 ? Math.sign(away) : tie;
          q.slide = Math.max(-q.reach, Math.min(q.reach, q.slide + way * 0.12 * T));
        });
      }
    }
    // A length also keeps off the outline itself: one as long as its side,
    // written in a notch, would start on the next side round the corner.
    const lineW = Math.max(OUTLINE * bodyW, OUTLINE_MIN) * (shape.pickOut === 'edge' ? PICK_EDGE_W : 1);
    placed.forEach((q) => {
      const B = boxOf(q); const m = lineW / 2 + 0.1 * T;
      verts.forEach((s1, j) => {
        if (j === q.i % verts.length) return;
        const s2 = verts[(j + 1) % verts.length];
        if (!crossesBox(s1, s2, { x0: B.x0 - m, x1: B.x1 + m, y0: B.y0 - m, y1: B.y1 + m })) return;
        touches++;
        const away = (B.cx - (s1.x + s2.x) / 2) * q.tx + (B.cy - (s1.y + s2.y) / 2) * q.ty;
        q.slide = Math.max(-q.reach, Math.min(q.reach, q.slide + (Math.sign(away) || 1) * 0.12 * T));
      });
    });
    if (!touches) break;
  }
  g.touches = touches;
  placed.forEach((q) => {
    [q.text, q.kept].forEach((label, which) => {
      if (!label) return;
      const at = q.place(label, q.slide);
      if (which === 0) g.texts.push({ text: q.text, x: at.x, y: at.y, pt: T, kind: 'side', w: at.tw, h: textH });
      grow(at.x - at.tw / 2, at.y - textH / 2); grow(at.x + at.tw / 2, at.y + textH / 2);
      const side = q.i % verts.length;
      if (!sideRoom[side] || at.tw > sideRoom[side].tw) sideRoom[side] = { tw: at.tw, th: textH, slide: q.slide };
    });
  });
  if (shape.parts) {
    Object.assign(g, { clockwise, splits: [], rings: [], brackets: [], partBoxes: [] });
    partsGeometry(shape, g, bodyW, bodyH, profile, T, sideRoom, grow, notesBelow);
  }
  shape.angleLabels.forEach((text, i) => {
    if (!text || !verts[i]) return;
    const v = verts[i];
    const dx = c.x - v.x; const dy = c.y - v.y; const len = Math.hypot(dx, dy) || 1;
    // Far enough in that the label sits between the two sides rather than
    // across them: a sharp corner pushes it further in.
    const prev = verts[(i + verts.length - 1) % verts.length]; const next = verts[(i + 1) % verts.length];
    const a1 = Math.atan2(prev.y - v.y, prev.x - v.x); const a2 = Math.atan2(next.y - v.y, next.x - v.x);
    let between = Math.abs(a1 - a2); if (between > Math.PI) between = 2 * Math.PI - between;
    const pt = T * 0.9;
    const clear = (textWidthEm(text, profile.bold) * pt) / 2 + 0.25 * pt;
    const d = Math.min(len * 0.9, Math.max(ANGLE_IN * bodyW, ANGLE_IN_MIN_EM * T, clear / Math.tan(Math.max(between / 2, 0.1)) + pt * 0.6));
    g.texts.push({ text, x: v.x + (dx / len) * d, y: v.y + (dy / len) * d, pt, kind: 'angle' });
  });
  if (shape.name === 'right-triangle') g.rightMark = { v: verts[0], a: verts[1], b: verts[2], s: RIGHT_MARK * Math.min(bodyW, bodyH) };

  const cand = shape.candidate ? sym.candidateLineFor(shape.candidate, box) : null;
  if (cand) g.candLine = cand;
  if (shape.fold && cand) {
    g.ghost = sym.reflectOutlineAcrossLine(verts, { x: cand.x1, y: cand.y1 }, { x: cand.x2, y: cand.y2 });
    g.ghost.forEach((p) => grow(p.x, p.y));
  }
  if (shape.verdict) {
    const mark = VERDICT * Math.min(bodyW, bodyH);
    g.verdict = { kind: shape.verdict, cx: bodyW + mark * 0.6, cy: mark * 0.4, size: mark };
    grow(bodyW + mark * 1.15, -mark * 0.15);
  }
  const stroke = Math.max(OUTLINE * bodyW, OUTLINE_MIN) * (shape.pickOut === 'edge' ? PICK_EDGE_W : 1);
  b.minX -= stroke; b.minY -= stroke; b.maxX += stroke; b.maxY += stroke;
  return g;
}

// The body width at which a shape's whole composite fits a column and a depth.
// Labels stay a fixed size while the body scales, so solve from two trials.
function fitBody(shape, colW, depth, profile, T, notesBelow) {
  const at = (w) => shapeGeometry(shape, w, profile, T, notesBelow).bounds;
  const a = at(100); const bb = at(200);
  const slopeW = ((bb.maxX - bb.minX) - (a.maxX - a.minX)) / 100;
  const baseW = (a.maxX - a.minX) - slopeW * 100;
  const slopeH = ((bb.maxY - bb.minY) - (a.maxY - a.minY)) / 100;
  const baseH = (a.maxY - a.minY) - slopeH * 100;
  let w = (colW - baseW) / slopeW;
  if (depth != null) w = Math.min(w, (depth - baseH) / slopeH);
  // A label's reach is not quite linear in the body (it follows the side it
  // sits on), so check the answer and step down until the whole composite fits.
  for (let pass = 0; pass < 12 && w > 0; pass++) {
    const b = at(w);
    const over = Math.max((b.maxX - b.minX) / colW, depth != null ? (b.maxY - b.minY) / depth : 0);
    if (over <= 1.0005) break;
    w *= Math.min(0.99, 1 / over);
  }
  return w;
}

function describeLayout(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = asProfile(profileOrSurface, box);
  const n = normalise(spec);
  // The words print at the surface's own size. Where the shapes could not be
  // drawn with them that big, or their lengths would be written across each
  // other, the words step down towards the surface's readable floor: the
  // lengths were a fixed size whatever the room, so two L-shapes with six
  // lengths each needed a slide apiece (27 slides, 7 October 2026).
  const full = Math.max(profile.fontPt, profile.minFontPt);
  const sizes = [full];
  for (let t = full - 1; t >= profile.minFontPt - 1e-9; t -= 1) sizes.push(t);
  // A smaller size is taken only when it draws every length clear of the
  // others; failing that the drawing is what it always was at the full size,
  // refusal included.
  for (const T of sizes) {
    let L;
    try {
      L = layoutAt(n, profile, T);
    } catch (error) {
      if (!/^POLYGON_TOO_SMALL/.test(String(error && error.message))) throw error;
      continue;
    }
    if (!L.geos.some((g) => g.touches)) return L;
  }
  return layoutAt(n, profile, full);
}

function layoutAt(n, profile, T) {
  const count = n.shapes.length;
  const gap = COL_GAP_EM * T;
  const colW = (profile.widthPt - gap * (count - 1)) / count;
  const captioned = n.shapes.some((s) => s.label);
  const captionBand = captioned ? T * (1.3 + CAPTION_GAP_EM) : 0;
  const depth = profile.heightPt ? profile.heightPt - captionBand : null;
  const cap = BODY_EM * profile.fontPt * (profile.grow || 1);

  const geos = n.shapes.map((s) => {
    let below = false;
    let w = Math.min(cap, fitBody(s, colW, depth, profile, T));
    // A note that will not fit inside its part goes in a list under the shape,
    // and the shape is fitted again with that list below it.
    if (s.parts && w >= BODY_MIN_EM * T && !shapeGeometry(s, w, profile, T).notesFit) {
      below = true;
      w = Math.min(cap, fitBody(s, colW, depth, profile, T, true));
    }
    if (!(w >= BODY_MIN_EM * T)) {
      throw new Error(
        `POLYGON_TOO_SMALL: ${count === 1 ? 'the shape' : `${count} shapes`} cannot be drawn with ${s.sideLabels.some(Boolean) ? (count === 1 ? 'its measurements ' : 'their measurements ') : ''}at a readable size in a space this small. ` +
          'Give the visual more room, or put fewer shapes in one row.'
      );
    }
    return shapeGeometry(s, w, profile, T, below);
  });
  // Columns are as wide as the widest composite, so the row stays even and
  // tight; each composite is centred in its column and its depth.
  const widths = geos.map((g) => g.bounds.maxX - g.bounds.minX);
  const heights = geos.map((g) => g.bounds.maxY - g.bounds.minY);
  const captionW = n.shapes.map((s) => (s.label ? textWidthEm(s.label, profile.bold) * T : 0));
  const col = Math.max(...widths, ...captionW);
  const bodyDepth = Math.max(...heights);
  const w = count * col + (count - 1) * gap;
  const h = bodyDepth + captionBand;
  const origins = geos.map((g, i) => ({
    x: i * (col + gap) + (col - widths[i]) / 2 - g.bounds.minX,
    y: (bodyDepth - heights[i]) / 2 - g.bounds.minY,
  }));
  return { w, h, T, col, gap, bodyDepth, captionBand, geos, origins, spec: n, profile };
}

function lineSvg(x1, y1, x2, y2, colour, width, dash) {
  const d = dash ? ` stroke-dasharray="${f2(width * 3.5)} ${f2(width * 2.2)}"` : '';
  return `<line x1="${f2(x1)}" y1="${f2(y1)}" x2="${f2(x2)}" y2="${f2(y2)}" stroke="${colour}" stroke-width="${f2(width)}" stroke-linecap="round"${d}/>`;
}

function tightSvg(spec = {}, profileOrSurface = 'worksheets', box) {
  const L = describeLayout(spec, profileOrSurface, box);
  const { profile, spec: n, T } = L;
  const c = profile.colours;
  const ink = profile.palette === 'ink';
  const weight = profile.bold ? ' font-weight="bold"' : '';
  const parts = [];

  L.geos.forEach((g, i) => {
    const shape = n.shapes[i];
    const o = L.origins[i];
    const P = (p) => `${f2(o.x + p.x)},${f2(o.y + p.y)}`;
    const bw = g.box.w;
    // 1) The fold ghost first, so it sits under the real shape.
    if (g.ghost) {
      parts.push(`<polygon points="${g.ghost.map(P).join(' ')}" fill="${ink ? '#8C8C8C' : GHOST_FILL}" fill-opacity="${ink ? 0.3 : GHOST_OPACITY}" stroke="${ink ? c.ink : GHOST_LINE}" stroke-width="${f2(Math.max(OUTLINE * bw * 0.67, 1))}"/>`);
    }
    // 2) The shape.
    const outlineW = Math.max(OUTLINE * bw, OUTLINE_MIN);
    const points = g.verts.map(P).join(' ');
    const partColour = ink ? c.ink : n.partsAnswer ? c.answer : c.ink;
    if (shape.pickOut === 'edge') {
      // Perimeter: the edge is the thing, and the inside is empty.
      parts.push(`<polygon points="${points}" fill="${c.paper}" stroke="${ink ? c.ink : c.highlight}" stroke-width="${f2(outlineW * PICK_EDGE_W)}" stroke-linejoin="round"/>`);
    } else if (shape.pickOut === 'inside') {
      // Area: the inside is the thing, and the edge only holds it.
      parts.push(`<polygon points="${points}" fill="${ink ? INK_TONES.light : SHADE}" stroke="${ink ? INK_TONES.dark : PICK_INSIDE_LINE}" stroke-width="${f2(Math.max(outlineW * 0.6, 1))}" stroke-linejoin="round"/>`);
    } else if (g.partBoxes && g.partBoxes.some((p) => p.shade || p.missing)) {
      // A shaded part and a cut-away corner sit under the outline, so the
      // outline stays whole on top of them.
      const rect = (p, fill) => `<rect x="${f2(o.x + p.x)}" y="${f2(o.y + p.y)}" width="${f2(p.w)}" height="${f2(p.h)}" fill="${fill}"/>`;
      g.partBoxes.filter((p) => p.missing).forEach((p) => parts.push(rect(p, ink ? INK_TONES.pale : MISSING_FILL)));
      parts.push(`<polygon points="${points}" fill="${ink ? c.paper : FILL}"/>`);
      g.partBoxes.filter((p) => p.shade && !p.missing).forEach((p) => parts.push(rect(p, ink ? INK_TONES.light : SHADE)));
      parts.push(`<polygon points="${points}" fill="none" stroke="${c.label}" stroke-width="${f2(outlineW)}" stroke-linejoin="round"/>`);
    } else {
      parts.push(`<polygon points="${points}" fill="${ink ? c.paper : FILL}" stroke="${c.label}" stroke-width="${f2(outlineW)}" stroke-linejoin="round"/>`);
    }
    // 2a) The split: one dashed line wherever a part's edge is not the
    // outline, a bracket on a measured stretch, and each part's number.
    if (g.splits) {
      const dashColour = ink ? c.ink : n.partsAnswer ? c.answer : CAND_COLOUR;
      g.splits.forEach((l) => {
        parts.push(lineSvg(o.x + l.x1, o.y + l.y1, o.x + l.x2, o.y + l.y2, dashColour, Math.max(SPLIT_W * bw, SPLIT_W_MIN), true));
      });
      g.brackets.forEach((m) => {
        const w = Math.max(BRACKET_W_EM * T, 1);
        parts.push(lineSvg(o.x + m.a.x, o.y + m.a.y, o.x + m.b.x, o.y + m.b.y, partColour, w));
        [m.a, m.b].forEach((e) => {
          parts.push(lineSvg(o.x + e.x - m.n.x * m.tick, o.y + e.y - m.n.y * m.tick, o.x + e.x + m.n.x * m.tick, o.y + e.y + m.n.y * m.tick, partColour, w));
        });
      });
      g.rings.forEach((r) => {
        parts.push(`<circle cx="${f2(o.x + r.cx)}" cy="${f2(o.y + r.cy)}" r="${f2(r.r)}" fill="${c.paper}" stroke="${partColour}" stroke-width="${f2(Math.max(PART_RING_W_EM * r.pt, 1))}"/>`);
        parts.push(`<text x="${f2(o.x + r.cx)}" y="${f2(o.y + r.cy + r.pt * 0.35)}" text-anchor="middle" font-family="${profile.font}" font-size="${f2(r.pt)}" font-weight="bold" fill="${partColour}">${esc(r.text)}</text>`);
      });
    }
    if (g.rightMark) {
      const { v, a, b, s } = g.rightMark;
      const u = (p) => { const dx = p.x - v.x; const dy = p.y - v.y; const l = Math.hypot(dx, dy) || 1; return { x: dx / l, y: dy / l }; };
      const d1 = u(a); const d2 = u(b);
      const pts = [{ x: v.x + d1.x * s, y: v.y + d1.y * s }, { x: v.x + (d1.x + d2.x) * s, y: v.y + (d1.y + d2.y) * s }, { x: v.x + d2.x * s, y: v.y + d2.y * s }];
      parts.push(`<polyline points="${pts.map(P).join(' ')}" fill="none" stroke="${c.label}" stroke-width="${f2(Math.max(OUTLINE * bw * 0.6, 1))}"/>`);
    }
    // 3a) Every correct line of symmetry: the answer overlay. A shape with none
    // (parallelogram, trapezium, scalene or right-angled triangle) draws
    // nothing, which is correct.
    if (n.symmetryLines) {
      const colour = ink ? c.ink : n.answer ? c.answer : SYM_COLOUR;
      sym.symmetryLinesFor(shape.name, g.box).forEach((l) => {
        parts.push(lineSvg(o.x + l.x1, o.y + l.y1, o.x + l.x2, o.y + l.y2, colour, Math.max(SYM_W * bw, SYM_W_MIN), true));
      });
    }
    // 3b) The one candidate line being tested.
    if (g.candLine) {
      const l = g.candLine;
      parts.push(lineSvg(o.x + l.x1, o.y + l.y1, o.x + l.x2, o.y + l.y2, ink ? c.ink : CAND_COLOUR, Math.max(CAND_W * bw, CAND_W_MIN), true));
    }
    // 4) The verdict, big, at the shape's top right.
    if (g.verdict) {
      const { cx, cy, size: s, kind } = g.verdict;
      const vw = Math.max(VERDICT_W * s * 2.4, VERDICT_W_MIN);
      if (kind === 'pass') {
        parts.push(`<polyline points="${f2(o.x + cx - 0.42 * s)},${f2(o.y + cy + 0.02 * s)} ${f2(o.x + cx - 0.12 * s)},${f2(o.y + cy + 0.34 * s)} ${f2(o.x + cx + 0.46 * s)},${f2(o.y + cy - 0.36 * s)}" fill="none" stroke="${c.answer}" stroke-width="${f2(vw)}" stroke-linecap="round" stroke-linejoin="round"/>`);
      } else {
        const hs = s / 2;
        parts.push(lineSvg(o.x + cx - hs, o.y + cy - hs, o.x + cx + hs, o.y + cy + hs, c.arrow, vw));
        parts.push(lineSvg(o.x + cx + hs, o.y + cy - hs, o.x + cx - hs, o.y + cy + hs, c.arrow, vw));
      }
    }
    g.texts.forEach((t) => {
      const fill = t.kind === 'angle' ? c.label : t.kind === 'part' ? partColour : c.ink;
      parts.push(`<text x="${f2(o.x + t.x)}" y="${f2(o.y + t.y + t.pt * 0.35)}" text-anchor="${t.anchor || 'middle'}" font-family="${profile.font}" font-size="${f2(t.pt)}"${t.strong ? ' font-weight="bold"' : weight} fill="${fill}">${esc(t.text)}</text>`);
    });
    if (shape.label) {
      const x = i * (L.col + L.gap) + L.col / 2;
      parts.push(`<text x="${f2(x)}" y="${f2(L.bodyDepth + CAPTION_GAP_EM * T + T * 0.95)}" text-anchor="middle" font-family="${profile.font}" font-size="${f2(T)}"${weight} fill="${c.ink}">${esc(shape.label)}</text>`);
    }
  });

  const w = f2(L.w);
  const h = f2(L.h);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
  return { svg, w: L.w, h: L.h, aspect: L.w / L.h, layout: L };
}

// The narrowest box a sheet may place the shapes in: each body at least 34mm
// (narrower and a labelled side is a smudge), a regular polygon at least 6mm a
// side so each side reads as its own straight edge, plus the room the labels
// take outside the shape.
function minWidthPt(spec = {}, profileOrSurface = 'worksheets', box) {
  const profile = asProfile(profileOrSurface, box);
  const n = normalise(spec);
  const T = Math.max(profile.fontPt, profile.minFontPt);
  const mm = 72 / 25.4;
  const cols = n.shapes.map((s) => {
    const body = Math.max(34 * mm, BODY_MIN_EM * T, s.name === 'regular-polygon' ? (Number(s.sides) || 6) * 6 * mm : 0);
    const b = shapeGeometry(s, body, profile, T).bounds;
    return b.maxX - b.minX;
  });
  return Math.ceil(cols.reduce((t, w) => t + w, 0) + COL_GAP_EM * T * (cols.length - 1));
}

function cacheKey(spec = {}, profileOrSurface = 'worksheets', box) {
  const p = asProfile(profileOrSurface, box);
  return `polygon:${p.surface}:${f2(p.widthPt)}x${p.heightPt ? f2(p.heightPt) : '-'}:${JSON.stringify(normalise(spec))}`;
}

module.exports = { tightSvg, cacheKey, normalise, describeLayout, minWidthPt };
