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

const { profileFor } = require('./surface-profiles');
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
    return { verts: fitUnit(pts), ratio };
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
    return {
      name,
      verts: u.verts,
      ratio,
      label: s.label ? String(s.label) : '',
      sideLabels,
      angleLabels: (Array.isArray(s.angleLabels) ? s.angleLabels : []).map((t) => (t == null ? '' : String(t))),
      candidate: sym.candidateLineFor(candidate, { x: 0, y: 0, w: 1, h: 1 }) ? candidate : '',
      verdict: s.verdict === 'pass' || s.verdict === 'fail' ? s.verdict : '',
      fold: s.fold === true && Boolean(candidate),
      sides: s.sides,
    };
  });
  return { shapes, symmetryLines: spec.symmetryLines === true, answer: spec.symmetryLinesAnswer === true };
}

function outwardNormal(p1, p2, c) {
  const dx = p2.x - p1.x; const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len; let ny = dx / len;
  const mx = (p1.x + p2.x) / 2; const my = (p1.y + p2.y) / 2;
  if (nx * (c.x - mx) + ny * (c.y - my) > 0) { nx = -nx; ny = -ny; }
  return { nx, ny };
}

// Everything one shape draws, at a body width, in points with the body's
// top-left at (0,0), and the box it all occupies.
function shapeGeometry(shape, bodyW, profile, T) {
  const bodyH = bodyW * shape.ratio;
  const box = { x: 0, y: 0, w: bodyW, h: bodyH };
  const verts = shape.verts.map((v) => ({ x: v[0] * bodyW, y: v[1] * bodyH }));
  const c = { x: verts.reduce((t, v) => t + v.x, 0) / verts.length, y: verts.reduce((t, v) => t + v.y, 0) / verts.length };
  const b = { minX: 0, minY: 0, maxX: bodyW, maxY: bodyH };
  const grow = (x, y) => { b.minX = Math.min(b.minX, x); b.maxX = Math.max(b.maxX, x); b.minY = Math.min(b.minY, y); b.maxY = Math.max(b.maxY, y); };
  const g = { box, verts, texts: [], ghost: null, candLine: null, symLines: [], verdict: null, rightMark: null, bounds: b };
  const textH = T * 1.1;

  shape.sideLabels.forEach((text, i) => {
    if (!text) return;
    const p1 = verts[i % verts.length]; const p2 = verts[(i + 1) % verts.length];
    const { nx, ny } = outwardNormal(p1, p2, c);
    const tw = textWidthEm(text, profile.bold) * T;
    const half = Math.abs(nx) * (tw / 2) + Math.abs(ny) * (textH / 2);
    const d = SIDE_GAP_EM * T + half;
    const x = (p1.x + p2.x) / 2 + nx * d; const y = (p1.y + p2.y) / 2 + ny * d;
    g.texts.push({ text, x, y, pt: T, kind: 'side' });
    grow(x - tw / 2, y - textH / 2); grow(x + tw / 2, y + textH / 2);
  });
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
  const stroke = Math.max(OUTLINE * bodyW, OUTLINE_MIN);
  b.minX -= stroke; b.minY -= stroke; b.maxX += stroke; b.maxY += stroke;
  return g;
}

// The body width at which a shape's whole composite fits a column and a depth.
// Labels stay a fixed size while the body scales, so solve from two trials.
function fitBody(shape, colW, depth, profile, T) {
  const at = (w) => shapeGeometry(shape, w, profile, T).bounds;
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
  const T = Math.max(profile.fontPt, profile.minFontPt);
  const count = n.shapes.length;
  const gap = COL_GAP_EM * T;
  const colW = (profile.widthPt - gap * (count - 1)) / count;
  const captioned = n.shapes.some((s) => s.label);
  const captionBand = captioned ? T * (1.3 + CAPTION_GAP_EM) : 0;
  const depth = profile.heightPt ? profile.heightPt - captionBand : null;
  const cap = BODY_EM * profile.fontPt * (profile.grow || 1);

  const geos = n.shapes.map((s) => {
    const w = Math.min(cap, fitBody(s, colW, depth, profile, T));
    if (!(w >= BODY_MIN_EM * T)) {
      throw new Error(
        `POLYGON_TOO_SMALL: ${count === 1 ? 'the shape' : `${count} shapes`} cannot be drawn with ${s.sideLabels.some(Boolean) ? (count === 1 ? 'its measurements ' : 'their measurements ') : ''}at a readable size in a space this small. ` +
          'Give the visual more room, or put fewer shapes in one row.'
      );
    }
    return shapeGeometry(s, w, profile, T);
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
    parts.push(`<polygon points="${g.verts.map(P).join(' ')}" fill="${ink ? c.paper : FILL}" stroke="${c.label}" stroke-width="${f2(Math.max(OUTLINE * bw, OUTLINE_MIN))}" stroke-linejoin="round"/>`);
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
      const fill = t.kind === 'angle' ? c.label : c.ink;
      parts.push(`<text x="${f2(o.x + t.x)}" y="${f2(o.y + t.y + t.pt * 0.35)}" text-anchor="middle" font-family="${profile.font}" font-size="${f2(t.pt)}"${weight} fill="${fill}">${esc(t.text)}</text>`);
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
