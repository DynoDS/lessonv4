'use strict';

// A rectilinear shape split into rectangles to find its area. A Year 5 lesson
// on L-shapes could not show the one move it teaches: the dashed line that
// makes two rectangles, numbered 1 and 2 (stress test, 7 October 2026). These
// tests hold where every mark lands, not that its words are in the picture.

const test = require('node:test');
const assert = require('node:assert/strict');
const polygon = require('../visuals/polygon-svg');
const { profileFor, PROFILES } = require('../visuals/surface-profiles');

const SURFACES = Object.keys(PROFILES);
const box = (s) => (s === 'slides' ? { widthMm: 150, heightMm: 110 } : { widthMm: 150 });
const on = (surface, spec, b) => polygon.describeLayout(spec, profileFor(surface, b || box(surface)));

const L = [[0, 0], [10, 0], [10, 3], [4, 3], [4, 8], [0, 8]];
const L_SIDES = ['10 cm', '3 cm', '6 cm', '5 cm', '4 cm', '8 cm'];
const ACROSS = [{ corners: [[0, 0], [10, 3]], label: '1' }, { corners: [[0, 3], [4, 8]], label: '2' }];
const DOWN = [{ corners: [[0, 0], [4, 8]], label: '1' }, { corners: [[4, 0], [10, 3]], label: '2' }];
const T_SHAPE = [[0, 0], [9, 0], [9, 2], [6, 2], [6, 7], [3, 7], [3, 2], [0, 2]];
const STAIRS = [[0, 0], [2, 0], [2, 2], [4, 2], [4, 4], [6, 4], [6, 6], [0, 6]];
const U_SHAPE = [[0, 0], [3, 0], [3, 4], [7, 4], [7, 0], [10, 0], [10, 7], [0, 7]];

const inside = (pt, verts) => {
  let hit = false;
  for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
    const a = verts[i]; const b = verts[j];
    if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
};
const boxOfText = (t) => {
  const left = t.anchor === 'start' ? t.x : t.x - t.w / 2;
  return { x0: left, x1: left + t.w, y0: t.y - t.h / 2, y1: t.y + t.h / 2 };
};
const boxOfRing = (r) => ({ x0: r.cx - r.r, x1: r.cx + r.r, y0: r.cy - r.r, y1: r.cy + r.r });
const overlap = (a, b) => Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 0.5 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > 0.5;
const within = (a, b, slack = 0.5) => a.x0 >= b.x0 - slack && a.x1 <= b.x1 + slack && a.y0 >= b.y0 - slack && a.y1 <= b.y1 + slack;
const partBox = (g, part) => {
  const p = g.partBoxes.find((q) => q.part === part || (q.part.x0 === part.x0 && q.part.y0 === part.y0 && q.part.x1 === part.x1 && q.part.y1 === part.y1));
  return { x0: p.x, x1: p.x + p.w, y0: p.y, y1: p.y + p.h };
};
// Every box of words and every ring a shape draws, each clear of the others.
const nothingTouches = (g, where) => {
  const boxes = [...g.texts.map((t) => ({ ...boxOfText(t), what: t.text })), ...g.rings.map((r) => ({ ...boxOfRing(r), what: `ring ${r.text}` }))];
  boxes.forEach((a, i) => boxes.slice(i + 1).forEach((b) => assert.ok(!overlap(a, b), `${where}: "${a.what}" is written across "${b.what}"`)));
};

test('a shape with no parts draws no split, no ring and no bracket', () => {
  const g = on('slides', { shapes: [{ vertices: L, sideLabels: L_SIDES }] }).geos[0];
  assert.equal(g.splits, undefined);
  const svg = polygon.tightSvg({ shapes: [{ vertices: L, sideLabels: L_SIDES }] }, profileFor('slides', box('slides'))).svg;
  assert.ok(!svg.includes('stroke-dasharray') && !svg.includes('<circle'));
});

test('the split line is worked out from the parts and lands on real corners, across or down', () => {
  for (const surface of SURFACES) {
    const across = on(surface, { shapes: [{ vertices: L, parts: ACROSS }] }).geos[0];
    const w = across.box.w; const h = across.box.h;
    assert.equal(across.splits.length, 1, `${surface}: two parts that share an edge draw one line`);
    const a = across.splits[0];
    assert.deepEqual([a.x1, a.y1, a.x2, a.y2].map((v) => Math.round(v * 100)), [0, (3 / 8) * h, (4 / 10) * w, (3 / 8) * h].map((v) => Math.round(v * 100)));
    const down = on(surface, { shapes: [{ vertices: L, parts: DOWN }] }).geos[0];
    const d = down.splits[0];
    assert.deepEqual([d.x1, d.y1, d.x2, d.y2].map((v) => Math.round(v * 100)), [(4 / 10) * w, 0, (4 / 10) * w, (3 / 8) * h].map((v) => Math.round(v * 100)));
  }
});

test('a shape that needs three parts draws two lines and three numbers, each number inside its own part', () => {
  const cases = [
    [T_SHAPE, [{ corners: [[0, 0], [3, 2]], label: '1' }, { corners: [[3, 0], [6, 7]], label: '2' }, { corners: [[6, 0], [9, 2]], label: '3' }]],
    [STAIRS, [{ corners: [[0, 0], [2, 6]], label: '1' }, { corners: [[2, 2], [4, 6]], label: '2' }, { corners: [[4, 4], [6, 6]], label: '3' }]],
    [U_SHAPE, [{ corners: [[0, 0], [3, 7]], label: '1' }, { corners: [[3, 4], [7, 7]], label: '2' }, { corners: [[7, 0], [10, 7]], label: '3' }]],
  ];
  for (const surface of SURFACES) {
    for (const [vertices, parts] of cases) {
      const g = on(surface, { shapes: [{ vertices, parts, sideLabels: vertices.map((_, i) => `${i + 2} cm`) }] }).geos[0];
      assert.equal(g.splits.length, 2, `${surface}: ${g.splits.length} lines`);
      assert.equal(g.rings.length, 3);
      g.rings.forEach((r, i) => assert.ok(within(boxOfRing(r), partBox(g, g.partBoxes[i].part)), `${surface}: number ${r.text} leaves its part`));
      g.splits.forEach((l) => {
        const mid = { x: (l.x1 + l.x2) / 2, y: (l.y1 + l.y2) / 2 };
        assert.ok(inside(mid, g.verts), `${surface}: a split line runs outside the shape`);
      });
      nothingTouches(g, surface);
    }
  }
});

test('a sum written in a part stays inside it, and moves to a list under the shape when the part is too small', () => {
  const parts = [{ ...ACROSS[0], note: '10 × 3 = 30 cm²' }, { ...ACROSS[1], note: '4 × 5 = 20 cm²' }];
  const spec = { shapes: [{ vertices: L, sideLabels: L_SIDES, parts }] };
  const roomy = on('slides', spec, { widthPt: 620, heightPt: 400 }).geos[0];
  assert.equal(roomy.notesBelow, false);
  roomy.texts.filter((t) => t.note).forEach((t) => assert.ok(within(boxOfText(t), partBox(roomy, t.part)), `"${t.text}" leaves its part`));
  nothingTouches(roomy, 'roomy slide');

  const tight = on('slides', spec, { widthPt: 300, heightPt: 300 });
  const g = tight.geos[0];
  assert.equal(g.notesBelow, true);
  const listed = g.texts.filter((t) => t.listed);
  assert.deepEqual(listed.map((t) => t.text), ['10 × 3 = 30 cm²', '4 × 5 = 20 cm²']);
  listed.forEach((t) => assert.ok(t.y - t.h / 2 > g.box.h, 'a listed sum is written on the shape'));
  nothingTouches(g, 'tight slide');
  assert.ok(tight.w <= 300.5 && tight.h <= 300.5, 'the list pushed the drawing out of its slot');

  // Wording the drawing was not built around.
  for (const surface of SURFACES) {
    const long = on(surface, { shapes: [{ vertices: L, sideLabels: ['12.5 m', '3.75 m', '7.25 m', '4.5 m', '5.25 m', '8.25 m'], parts: [{ ...ACROSS[0], note: '12.5 × 3.75 = 46.875 m²' }, { ...ACROSS[1], label: 'B', note: '5.25 × 4.5 = 23.625 m²' }] }] }).geos[0];
    nothingTouches(long, `${surface}, long sums`);
  }
});

test('a length on a dashed line is written inside its part; a stretch of a side is written outside with a bracket, clear of the side\'s own length', () => {
  for (const surface of SURFACES) {
    const parts = [{ corners: [[0, 0], [2, 6]], label: '1' }, { corners: [[2, 2], [4, 6]], label: '2', sideLabels: ['', '', '', '4 cm'] }, { corners: [[4, 4], [6, 6]], label: '3' }];
    const g = on(surface, { shapes: [{ vertices: STAIRS, sideLabels: ['2 cm', '2 cm', '2 cm', '2 cm', '2 cm', '2 cm', '6 cm', '6 cm'], parts }] }).geos[0];
    const four = g.texts.find((t) => t.text === '4 cm');
    assert.ok(within(boxOfText(four), partBox(g, four.part)), `${surface}: the split line's length leaves the part it measures`);
    assert.equal(g.brackets.length, 0);
    nothingTouches(g, surface);

    const piece = [{ corners: [[0, 0], [10, 3]], label: '1' }, { corners: [[0, 3], [4, 8]], label: '2', sideLabels: ['', '', '', '5 cm'] }];
    const h = on(surface, { shapes: [{ vertices: L, sideLabels: L_SIDES, parts: piece }] }).geos[0];
    const five = h.texts.find((t) => t.kind === 'part' && t.text === '5 cm');
    const b = boxOfText(five);
    assert.ok(b.x1 < 0, `${surface}: a stretch of the left side is measured inside the shape`);
    assert.equal(h.brackets.length, 1);
    // The bracket spans the stretch it measures and nothing more.
    const m = h.brackets[0];
    assert.deepEqual([m.a.y, m.b.y].map(Math.round).sort((p, q) => p - q), [(3 / 8) * h.box.h, h.box.h].map(Math.round));
    nothingTouches(h, surface);
  }
});

test('the corner cut away is drawn outside the shape, and the lengths already written there are kept clear', () => {
  for (const surface of SURFACES) {
    const g = on(surface, { shapes: [{ vertices: L, sideLabels: L_SIDES, parts: [{ corners: [[4, 3], [10, 8]], missing: true, label: '?' }] }] }).geos[0];
    assert.equal(g.splits.length, 2, 'the two edges that complete the rectangle');
    assert.ok(!inside({ x: g.rings[0].cx, y: g.rings[0].cy }, g.verts), `${surface}: the cut-away corner's mark is inside the shape`);
    nothingTouches(g, surface);
  }
});

test('a part that is not where a part can be is refused by name', () => {
  const draw = (shape) => () => polygon.describeLayout({ shapes: [shape] }, 'worksheets');
  assert.throws(draw({ vertices: L, parts: [{ corners: [[0, 0], [10, 8]] }] }), /POLYGON_PART_OUTSIDE/);
  assert.throws(draw({ vertices: L, parts: [{ corners: [[0, 0], [10, 3]] }, { corners: [[0, 0], [4, 8]] }] }), /POLYGON_PARTS_OVERLAP/);
  assert.throws(draw({ vertices: L, parts: [{ corners: [[0, 0], [4, 3]], missing: true }] }), /POLYGON_PART_NOT_MISSING/);
  assert.throws(draw({ vertices: L, parts: [{ corners: [[0, 0], [10, 0]] }] }), /POLYGON_PART_CORNERS/);
  assert.throws(draw({ vertices: L, parts: [{ label: '1' }] }), /POLYGON_PART_CORNERS/);
  assert.throws(draw({ name: 'rectangle', parts: [{ corners: [[0, 0], [1, 1]] }] }), /POLYGON_PARTS_NEED_VERTICES/);
});

test('the split is answer green on the board and the wall, and ink on anything handed to a child', () => {
  const spec = { partsAnswer: true, shapes: [{ vertices: L, sideLabels: L_SIDES, parts: ACROSS }] };
  const svg = (surface) => polygon.tightSvg(spec, profileFor(surface, box(surface))).svg;
  for (const surface of ['slides', 'wall']) {
    assert.match(svg(surface), /stroke="#00B050"[^>]*stroke-dasharray/, `${surface}: the answer line is not green`);
    assert.match(svg(surface), /<circle[^>]*stroke="#00B050"/);
  }
  for (const surface of ['worksheets', 'stickin']) assert.ok(!svg(surface).includes('#00B050'), `${surface}: green on a child's copy`);
  const plain = polygon.tightSvg({ shapes: [{ vertices: L, parts: ACROSS }] }, profileFor('slides', box('slides'))).svg;
  assert.ok(!plain.includes('#00B050'), 'a split the teacher is modelling is not yet an answer');
});

test('the edge or the inside can be picked out, so perimeter and area need not show one picture', () => {
  const draw = (pickOut, surface = 'slides') => polygon.tightSvg({ shapes: [{ vertices: L, pickOut }] }, profileFor(surface, box(surface))).svg;
  const width = (svg) => Number(/<polygon[^>]*stroke-width="([\d.]+)"/.exec(svg)[1]);
  assert.ok(width(draw('edge')) > 2 * width(draw()), 'the picked-out edge is no thicker than an ordinary one');
  assert.match(draw('edge'), /<polygon[^>]*fill="#FFFFFF"[^>]*stroke="#C65911"/);
  assert.ok(width(draw('inside')) < width(draw()), 'the outline did not step back when the inside was picked out');
  assert.match(draw('inside'), /<polygon[^>]*fill="#FBE2C7"/);
  // Photocopied: told apart by weight and tone, not hue.
  assert.match(draw('edge', 'stickin'), /fill="#FFFFFF" stroke="#1A1A1A"/);
  assert.match(draw('inside', 'stickin'), /fill="#BFBFBF"/);
  assert.equal(draw('nonsense'), draw());
});

test('a shape keeps its size and place when another slide of its group draws the split', () => {
  const slot = { widthPt: 400, heightPt: 300 };
  const parts = [{ ...ACROSS[0], note: '10 × 3 = 30 cm²' }, { ...ACROSS[1], note: '4 × 5 = 20 cm²', sideLabels: ['', '', '', '5 cm'] }];
  const place = (shape) => {
    const out = on('slides', { shapes: [shape] }, slot);
    return [out.geos[0].box.w, out.origins[0].x, out.origins[0].y, out.w, out.h].map((v) => Math.round(v * 100));
  };
  const question = { vertices: L, sideLabels: L_SIDES };
  const answer = { vertices: L, sideLabels: L_SIDES, parts };
  assert.notDeepEqual(place(question), place(answer), 'the test must start from a shape that moves');
  assert.deepEqual(place({ ...question, roomForParts: parts }), place({ ...answer, roomForParts: parts }));
  // The question keeps the room and draws none of it.
  const g = on('slides', { shapes: [{ ...question, roomForParts: parts }] }, slot).geos[0];
  assert.equal(g.splits.length + g.rings.length + g.brackets.length, 0);
  assert.deepEqual(g.texts.map((t) => t.text).sort(), [...L_SIDES].sort());
  // One shape split across on one slide and down on the next.
  const both = [...ACROSS, ...DOWN];
  assert.deepEqual(place({ vertices: L, parts: ACROSS, roomForParts: both }), place({ vertices: L, parts: DOWN, roomForParts: both }));
});

// Two lengths in the notch of a small L were written across each other.
test('side lengths that would touch slide apart along their own sides, and a length that touches nothing stays put', () => {
  const two = { shapes: [{ vertices: L, sideLabels: L_SIDES }, { vertices: L, sideLabels: L_SIDES }] };
  const small = on('slides', two, { widthPt: 620, heightPt: 330 });
  small.geos.forEach((g) => {
    assert.equal(g.touches, 0);
    const sides = g.texts.filter((t) => t.kind === 'side').map(boxOfText);
    sides.forEach((a, i) => sides.slice(i + 1).forEach((b) => assert.ok(!overlap(a, b), 'two lengths are written across each other')));
    g.texts.filter((t) => t.kind === 'side').forEach((t) => assert.ok(!inside(t, g.verts), `"${t.text}" slid inside the shape`));
  });
  const big = on('slides', { shapes: [{ vertices: L, sideLabels: L_SIDES }] }, { widthPt: 620, heightPt: 400 }).geos[0];
  big.texts.forEach((t, i) => {
    const p1 = big.verts[i]; const p2 = big.verts[(i + 1) % big.verts.length];
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    assert.ok(Math.abs(t.x - mid.x) < 0.01 || Math.abs(t.y - mid.y) < 0.01, `"${t.text}" left the middle of its side with nothing to avoid`);
  });
});

test('the words step down to the readable floor before lengths are left touching, and never below it', () => {
  const crowded = { shapes: [{ vertices: U_SHAPE, sideLabels: ['3 cm', '4 cm', '4 cm', '4 cm', '3 cm', '7 cm', '10 cm', '7 cm'] }] };
  const out = on('slides', crowded, { widthPt: 420, heightPt: 320 });
  assert.equal(out.geos[0].touches, 0);
  assert.ok(out.T < 24 && out.T >= 18, `words at ${out.T}pt`);
  assert.equal(on('slides', { shapes: [{ vertices: L, sideLabels: L_SIDES }] }, { widthPt: 420, heightPt: 320 }).T, 24);
  assert.throws(() => on('slides', { shapes: [{ vertices: L, sideLabels: L_SIDES }, { vertices: T_SHAPE, sideLabels: T_SHAPE.map(() => '3 cm') }] }, { widthPt: 400, heightPt: 330 }), /POLYGON_TOO_SMALL/);
});
