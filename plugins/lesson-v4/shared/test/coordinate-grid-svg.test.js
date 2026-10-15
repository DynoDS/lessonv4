'use strict';

// The one coordinate grid every surface places (shared/visuals/coordinate-grid-svg.js).
// It grew from a first-quadrant grid to a four-quadrant one on 7 October 2026,
// when a Year 6 translation lesson could not plot (−4, 3): both axes started at
// zero, so every negative coordinate landed in the margin. These hold where each
// number, letter and mark lands, with wording and shapes the drawing was not
// built around, so a label that is clipped, or lying across its neighbour, fails
// here rather than on a child's sheet.

const test = require('node:test');
const assert = require('node:assert/strict');
const grid = require('../visuals/coordinate-grid-svg');
const { profileFor } = require('../visuals/surface-profiles');

const PIECE = profileFor('stickin', { widthMm: 88 });
const MINUS = '−';
const FOUR = { min: -5, max: 5 };

const texts = (svg) => [...svg.matchAll(/<text[^>]*fill="(?!#FFFFFF)[^"]*"[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
const overlap = (a, b) => {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0.5 && h > 0.5 ? w * h : 0;
};
const within = (box, L) => box.x >= -0.01 && box.y >= -0.01 && box.x + box.w <= L.w + 0.01 && box.y + box.h <= L.h + 0.01;
const centre = (box) => ({ x: box.x + box.w / 2, y: box.y + box.h / 2 });
const inPolygon = (pt, poly) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
};
// Every piece of text the layout placed, named, so a failure says which two met.
const wordBoxes = (L) => [
  ...L.numbers.map((n) => ({ name: `number ${n.text} on ${n.axis}`, box: n.box })),
  ...L.axisNames.map((n) => ({ name: `axis name ${n.text}`, box: n.box })),
  ...L.marks.filter((m) => m.labelBox).map((m) => ({ name: `letter ${m.label}`, box: m.labelBox })),
  ...L.shapes.filter((s) => s.inside).map((s) => ({ name: `inside ${s.inside.text}`, box: s.inside.box })),
  ...L.arrows.flatMap((a) => a.legs).filter((leg) => leg.count).map((leg) => ({ name: `count ${leg.count.text}`, box: leg.count.box })),
  ...L.notes.map((n) => ({ name: `note in ${n.quadrant}`, box: n.box })),
];
function assertNothingMeets(spec, profile) {
  const L = grid.describeLayout(spec, profile);
  const words = wordBoxes(L);
  words.forEach((word) => assert.ok(within(word.box, L), `${word.name} is cut off by the edge of the picture`));
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      assert.equal(overlap(words[i].box, words[j].box), 0, `${words[i].name} lies across ${words[j].name}`);
    }
  }
  return L;
}

// The lesson this was grown for, and grids it was not built around.
const LESSON = {
  pastZero: { ...FOUR, numbers: 'positive', points: [{ x: 0, y: 4, label: 'J' }, { x: -4, y: 0, label: 'K' }, { x: 0, y: -4, label: 'L' }, { x: 4, y: 0, label: 'M' }] },
  rectangle: { ...FOUR, pointStyle: 'cross', join: true, points: [{ x: 4, y: 3, label: 'A' }, { x: -4, y: 3, label: 'B' }, { x: -4, y: -3, label: 'C' }, { x: 4, y: -3, label: 'D' }] },
  parallelogram: { ...FOUR, pointStyle: 'cross', shapes: [{ points: [[-2, 4], { x: -5, y: -1, coords: true }, [1, -3], [4, 2]], labels: ['E', 'F', 'G', 'H'] }] },
  trapezium: { ...FOUR, pointStyle: 'cross', points: [{ x: -3, y: 5, label: 'T', coords: true }, { x: 5, y: -3, label: 'U', coords: true }], shapes: [{ points: [[2, 3], [-4, 3], [-5, -2], [4, -2]], labels: ['P', 'Q', 'R', 'S'] }] },
  triangleMoved: { ...FOUR, shapes: [{ points: [[1, 2], [4, 2], [1, 5]], labels: ['A', 'B', 'C'], translate: { dx: -6, dy: -4 }, showImage: true }] },
  twoShapes: { ...FOUR, shapes: [
    { points: [[-5, 2], [-3, 2], [-3, 5]], labels: ['J', 'K', 'L'], translate: { dx: 4, dy: -6 }, showImage: true, arrow: false },
    { points: [[2, -5], [5, -5], [5, -3], [2, -3]], labels: ['P', 'Q', 'R', 'S'], translate: { dx: -3, dy: 7 }, showImage: true, arrow: false },
  ] },
  whichMove: { ...FOUR, shapes: [{ points: [[-5, 1], [-2, 1], [-5, 4]], inside: '1' }, { points: [[1, -4], [4, -4], [1, -1]], inside: '2' }], arrows: [{ from: [-5, 1], to: [1, -4], steps: true, count: true }] },
};
const UNPLANNED = {
  treasureMap: { xMin: -3, xMax: 8, yMin: -2, yMax: 4, pointStyle: 'cross', points: [{ x: 8, y: 4, label: 'Lighthouse', coords: true }, { x: -3, y: -2, label: 'Shipwreck', coords: true }, { x: 0, y: 0, label: 'Start' }, { x: 7, y: 4, label: 'Rocks' }] },
  crowded: { min: -3, max: 3, points: [{ x: 0, y: 0, label: 'O' }, { x: 1, y: 0, label: 'A' }, { x: 0, y: 1, label: 'B' }, { x: 1, y: 1, label: 'C' }, { x: -1, y: -1, label: 'D', coords: true }, { x: 3, y: 3, label: 'E' }, { x: -3, y: 3, label: 'F' }] },
  halfPlane: { xMin: -6, xMax: 6, yMax: 5, points: [{ x: -3, y: 2, label: 'P' }, { x: -6, y: 0, label: 'Q' }] },
  bigNumbers: { min: -12, max: 12, points: [{ x: -12, y: 12, label: 'A' }, { x: 12, y: -12, label: 'B' }] },
  hexagon: { min: -4, max: 4, shapes: [{ points: [[-2, 0], [-1, 2], [1, 2], [2, 0], [1, -2], [-1, -2]], labels: ['U', 'V', 'W', 'X', 'Y', 'Z'], inside: 'hexagon' }] },
};

test('a first-quadrant grid is the grid it always was: same frame, same key, no axis names', () => {
  const spec = { max: 10, points: [{ x: 3, y: 5, label: 'P' }] };
  const out = grid.tightSvg(spec);
  assert.equal(Math.round(out.w), 1092);
  assert.equal(Math.round(out.h), 1088);
  assert.equal(grid.cacheKey(spec), 'coordinate-grid:10x10:n1:p:3,5:P:route:-');
  const L = grid.describeLayout(spec);
  assert.deepEqual(L.axisNames, []);
  assert.deepEqual(L.numbers.filter((n) => n.axis === 'x').map((n) => n.text), ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  assert.deepEqual(L.numbers.filter((n) => n.axis === 'y').map((n) => n.text), ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  // The letter sits up and to the right of its dot, where it always sat.
  assert.equal(L.marks[0].seat, 'NE');
  assert.equal(grid.tightSvg({ cols: 3, rows: 3, numbers: false, route: [2, 2] }).w, grid.tightSvg({ max: 3, numbers: false, route: [2, 2] }).w);
});

test('a four-quadrant grid numbers both axes through zero, negatives with a true minus sign, and one zero', () => {
  const L = assertNothingMeets(FOUR);
  const along = (axis) => L.numbers.filter((n) => n.axis === axis).map((n) => n.text);
  const want = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5].map((n) => (n < 0 ? MINUS + Math.abs(n) : String(n)));
  assert.deepEqual(along('x'), want);
  assert.deepEqual(along('y'), want);
  assert.deepEqual(along('origin'), ['0']);
  assert.ok(!texts(grid.tightSvg(FOUR).svg).some((t) => t.includes('-')), 'a hyphen stood in for a minus sign');
  assert.deepEqual(L.axisNames.map((n) => n.text), ['x', 'y']);
});

test('each number sits at its own mark, beside its axis and never across it', () => {
  const L = grid.describeLayout(FOUR);
  L.numbers.filter((n) => n.axis === 'x').forEach((n) => {
    assert.ok(Math.abs(centre(n.box).x - L.at(n.value, 0).x) < 0.01, `${n.text} is not under its own mark`);
    assert.ok(n.box.y > L.origin.y, `${n.text} is not below the x-axis`);
  });
  L.numbers.filter((n) => n.axis === 'y').forEach((n) => {
    assert.ok(Math.abs(centre(n.box).y - L.at(0, n.value).y) < 0.01, `${n.text} is not level with its own mark`);
    assert.ok(n.box.x + n.box.w < L.origin.x, `${n.text} reaches across the y-axis`);
  });
  // Two-digit negatives are the widest thing an axis carries.
  const wide = grid.describeLayout({ min: -12, max: 12 });
  wide.numbers.filter((n) => n.axis === 'y').forEach((n) => assert.ok(n.box.x + n.box.w < wide.origin.x, `${n.text} reaches across the y-axis`));
});

test('squares are square and every plotted point lands on its own crossing', () => {
  const L = grid.describeLayout(LESSON.trapezium);
  assert.ok(Math.abs((L.at(1, 0).x - L.at(0, 0).x) - (L.at(0, 0).y - L.at(0, 1).y)) < 1e-9);
  assert.equal(L.at(1, 0).x - L.at(0, 0).x, L.cell);
  L.marks.forEach((m) => assert.deepEqual(m.at, L.at(m.x, m.y)));
  // (−4, 3) is left of the y-axis and above the x-axis: the point the old grid could not plot.
  const q = L.marks.find((m) => m.label === 'Q');
  assert.ok(q.at.x < L.origin.x && q.at.y < L.origin.y);
  assert.ok(q.at.x >= L.plot.x && q.at.x <= L.plot.x + L.plot.w);
});

test('a point that is not on the grid is refused by name, with the range and the fix', () => {
  assert.throws(() => grid.tightSvg({ max: 5, points: [{ x: -4, y: 3, label: 'B' }] }), /COORDINATE_GRID_POINT_OFF_GRID: the point B at \(−4, 3\).*0 to 5 across.*Set min/);
  assert.throws(() => grid.tightSvg({ ...FOUR, shapes: [{ points: [[1, 1], [6, 1], [1, 4]] }] }), /COORDINATE_GRID_POINT_OFF_GRID: shape 1 has a vertex at \(6, 1\)/);
  assert.throws(() => grid.tightSvg({ ...FOUR, arrows: [{ from: [0, 0], to: [0, -6] }] }), /COORDINATE_GRID_POINT_OFF_GRID: arrow 1 ends at/);
  assert.throws(() => grid.tightSvg({ min: 5, max: 8 }), /COORDINATE_GRID_MIN_ABOVE_ZERO/);
  assert.throws(() => grid.tightSvg({ ...FOUR, shapes: [{ points: [[1, 1]] }] }), /COORDINATE_GRID_SHAPE_NEEDS_POINTS/);
});

test('numbers: "positive" leaves the negative parts marked and unnumbered', () => {
  const L = assertNothingMeets(LESSON.pastZero);
  assert.deepEqual(L.numbers.map((n) => n.value).sort((a, b) => a - b), [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  const ticks = (spec) => (grid.tightSvg(spec).svg.match(/stroke-width="3\.50"/g) || []).length;
  assert.equal(ticks(LESSON.pastZero), 20, 'a mark at every whole number on both axes, either side of zero');
  assert.equal(ticks(FOUR), 20);
  // K is four marks left of zero on the x-axis, where no number is written.
  const k = L.marks.find((m) => m.label === 'K');
  assert.deepEqual(k.at, L.at(-4, 0));
});

test('unnumbered axes carry only their names, and the names are measured, not assumed', () => {
  const spec = { min: -3, max: 3, numbers: false, axisLabels: { x: 'x-axis', y: 'y-axis' } };
  assert.deepEqual(texts(grid.tightSvg(spec).svg), ['x-axis', 'y-axis']);
  const L = assertNothingMeets(spec);
  const plot = L.plot;
  L.axisNames.forEach((n) => assert.equal(overlap(n.box, plot), 0, `${n.text} is written over the squared paper`));
  // A longer name widens the picture rather than being cut off.
  const longer = assertNothingMeets({ min: -3, max: 3, axisLabels: { x: 'distance east (km)', y: 'distance north (km)' } });
  assert.ok(longer.w > L.w);
  // Bare axes: no squared paper, still a mark at every whole number.
  const bare = grid.tightSvg({ ...spec, grid: false }).svg;
  assert.ok(!bare.includes('#AAB7C4'), 'squared paper was drawn on bare axes');
  assert.equal((bare.match(/stroke-width="3\.50"/g) || []).length, 12);
  assert.deepEqual(texts(grid.tightSvg({ ...FOUR, axisLabels: false }).svg).filter((t) => /[a-z]/i.test(t)), []);
});

test('every letter is inside the picture and clear of every other word, on grids it was not built around', () => {
  Object.entries({ ...LESSON, ...UNPLANNED }).forEach(([name, spec]) => {
    const L = assertNothingMeets(spec);
    const lettered = L.marks.filter((m) => m.labelBox);
    lettered.forEach((m) => {
      L.marks.forEach((other) => {
        if (other.style === 'none') return;
        const r = 5.5;
        assert.equal(overlap(m.labelBox, { x: other.at.x - r, y: other.at.y - r, w: 2 * r, h: 2 * r }), 0, `${name}: letter ${m.label} covers a plotted point`);
      });
    });
  });
});

test('a vertex letter sits outside its own shape', () => {
  [LESSON.rectangle, LESSON.parallelogram, LESSON.trapezium, LESSON.triangleMoved, LESSON.twoShapes, UNPLANNED.hexagon].forEach((spec) => {
    const L = grid.describeLayout(spec);
    const solid = L.shapes.filter((s) => !s.image);
    L.marks.filter((m) => m.inShape && m.labelBox).forEach((m) => {
      const home = solid.find((s) => s.vertices.some((v) => Math.abs(v.x - m.at.x) < 1e-6 && Math.abs(v.y - m.at.y) < 1e-6));
      assert.ok(home, `no shape owns ${m.label}`);
      assert.ok(!inPolygon(centre(m.labelBox), home.vertices), `letter ${m.label} is written inside its own shape`);
    });
  });
});

test('coords: true writes the point\'s own coordinates beside its letter', () => {
  const L = grid.describeLayout(LESSON.trapezium);
  assert.deepEqual(L.marks.filter((m) => !m.inShape).map((m) => m.label), [`T (${MINUS}3, 5)`, `U (5, ${MINUS}3)`]);
  assert.equal(grid.describeLayout(LESSON.parallelogram).marks.find((m) => m.label.startsWith('F')).label, `F (${MINUS}5, ${MINUS}1)`);
  assert.notEqual(grid.cacheKey(LESSON.trapezium), grid.cacheKey({ ...LESSON.trapezium, points: LESSON.trapezium.points.map((p) => ({ ...p, coords: false })) }));
});

test('a translated image is the same shape moved by exactly the translation, drawn lighter and dashed', () => {
  const L = grid.describeLayout(LESSON.triangleMoved);
  const [original, image] = [L.shapes.find((s) => !s.image), L.shapes.find((s) => s.image)];
  original.vertices.forEach((v, i) => {
    assert.ok(Math.abs(image.vertices[i].x - (v.x - 6 * L.cell)) < 1e-9);
    assert.ok(Math.abs(image.vertices[i].y - (v.y + 4 * L.cell)) < 1e-9);
  });
  assert.deepEqual(image.vertices[0], L.at(-5, -2));
  const svg = grid.tightSvg(LESSON.triangleMoved).svg;
  assert.match(svg, /<polygon[^>]*stroke="#4D94D6"[^>]*stroke-dasharray/);
  assert.match(svg, /<polygon[^>]*stroke="#0070C0"(?![^>]*stroke-dasharray)/);
  // The arrow runs from A to where A lands.
  assert.equal(L.arrows.length, 1);
  assert.deepEqual(L.arrows[0].legs[0].from, L.at(1, 2));
  assert.deepEqual(L.arrows[0].legs[0].to, L.at(-5, -2));
  // The question form is the same spec with the image left off.
  const question = grid.describeLayout({ ...LESSON.triangleMoved, shapes: [{ ...LESSON.triangleMoved.shapes[0], showImage: false }] });
  assert.equal(question.shapes.length, 1);
  assert.equal(question.arrows.length, 0);
  assert.equal(grid.describeLayout(LESSON.twoShapes).arrows.length, 0, 'arrow: false still drew an arrow');
  assert.throws(() => grid.tightSvg({ ...FOUR, shapes: [{ points: [[1, 2], [4, 2], [1, 5]], translate: { dx: -7, dy: 0 }, showImage: true }] }), /COORDINATE_GRID_IMAGE_OFF_GRID/);
});

test('a stepped arrow goes across then up or down, and its counts are the real number of squares', () => {
  const L = assertNothingMeets(LESSON.whichMove);
  const [across, down] = L.arrows[0].legs;
  assert.deepEqual(across.from, L.at(-5, 1));
  assert.deepEqual(across.to, L.at(1, 1));
  assert.deepEqual(down.to, L.at(1, -4));
  assert.equal(across.count.text, '6 right');
  assert.equal(down.count.text, '5 down');
  const other = grid.describeLayout({ ...FOUR, arrows: [{ from: [4, -2], to: [-3, 1], steps: true, count: true }] });
  assert.deepEqual(other.arrows[0].legs.map((leg) => leg.count.text), ['7 left', '3 up']);
  // A count is clear of both shapes' edges as well as the other words.
  L.arrows[0].legs.forEach((leg) => {
    L.shapes.forEach((shape) => assert.ok(!inPolygon(centre(leg.count.box), shape.vertices), `${leg.count.text} is written on a shape`));
  });
  assert.equal(grid.describeLayout({ ...FOUR, arrows: [{ from: [0, 0], to: [3, 2] }] }).arrows[0].legs.length, 1);
});

test('a numeral inside a shape is wholly inside it, and one that cannot fit is seated beside it', () => {
  const L = grid.describeLayout(LESSON.whichMove);
  L.shapes.forEach((shape) => {
    assert.ok(shape.inside.within);
    const b = shape.inside.box;
    [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]].forEach(([x, y]) => assert.ok(inPolygon({ x, y }, shape.vertices), `${shape.inside.text} pokes out of its shape`));
  });
  const tight = assertNothingMeets({ ...FOUR, shapes: [{ points: [[0, 0], [1, 0], [0, 1]], inside: 'Shape 12' }] });
  assert.equal(tight.shapes[0].inside.within, false);
  assert.ok(!inPolygon(centre(tight.shapes[0].inside.box), tight.shapes[0].vertices));
  const named = assertNothingMeets(UNPLANNED.hexagon);
  assert.ok(named.shapes[0].inside.within);
});

test('tinted quadrants are four different tints, and a quadrant can be pointed at by any of its names', () => {
  const svg = grid.tightSvg({ min: -3, max: 3, numbers: false, tintQuadrants: true }).svg;
  const fills = [...svg.matchAll(/<rect[^>]*fill="(#[0-9A-F]{6})"/g)].map((m) => m[1]);
  assert.equal(fills.length, 4);
  assert.equal(new Set(fills).size, 4);
  const L = grid.describeLayout({ min: -3, max: 3 });
  assert.deepEqual(L.quadrants.map((q) => q.key), ['top right', 'top left', 'bottom left', 'bottom right']);
  const sum = L.quadrants.reduce((a, q) => a + q.box.w * q.box.h, 0);
  assert.ok(Math.abs(sum - L.plot.w * L.plot.h) < 1e-6, 'the quadrants do not tile the grid');
  ['top left', 'topLeft', 'second quadrant', 'Quadrant 2'].forEach((name) => {
    assert.deepEqual(grid.describeLayout({ ...FOUR, highlight: name }).highlighted, ['top left']);
  });
  assert.deepEqual(grid.describeLayout({ ...LESSON.pastZero, highlight: ['K', 'x-axis'] }).highlighted.sort(), ['K', 'x-axis']);
  assert.throws(() => grid.tightSvg({ ...FOUR, highlight: 'middle' }), /FIGURE_HIGHLIGHT_UNKNOWN/);
  // A first-quadrant grid has one quadrant, so it has no "top left" to point at.
  assert.throws(() => grid.tightSvg({ max: 5, highlight: 'top left' }), /FIGURE_HIGHLIGHT_UNKNOWN/);
  assert.notEqual(grid.cacheKey({ ...FOUR, highlight: 'top left' }), grid.cacheKey({ ...FOUR, highlight: 'top right' }));
});

test('a quadrant note is set inside its quadrant, and refuses when it cannot be read or would cover a shape', () => {
  const notes = { 'top right': 'x and y both positive', 'second quadrant': 'x negative, y positive', 'bottom left': 'both negative', 'bottom right': 'x positive, y negative' };
  const L = assertNothingMeets({ min: -4, max: 4, tintQuadrants: true, quadrantNotes: notes });
  assert.equal(L.notes.length, 4);
  L.notes.forEach((note) => {
    const home = L.quadrants.find((q) => q.key === note.quadrant).box;
    assert.ok(Math.abs(overlap(note.box, home) - note.box.w * note.box.h) < 1, `the ${note.quadrant} note leaves its quadrant`);
  });
  assert.throws(() => grid.tightSvg({ min: -1, max: 1, quadrantNotes: { 'top left': 'the x-coordinate is negative here' } }), /COORDINATE_GRID_NOTE_DOES_NOT_FIT/);
  assert.throws(() => grid.tightSvg({ ...FOUR, quadrantNotes: { 'top right': 'positive' }, shapes: [{ points: [[1, 1], [4, 1], [4, 4], [1, 4]] }] }), /COORDINATE_GRID_NOTE_OVER_PLOT/);
  assert.throws(() => grid.tightSvg({ ...FOUR, quadrantNotes: { 'north east': 'positive' } }), /COORDINATE_GRID_NOTE_UNKNOWN_QUADRANT/);
});

test('the picture is cropped to what is drawn: the squared paper fills it', () => {
  const blank = grid.describeLayout(FOUR);
  assert.ok((blank.plot.w * blank.plot.h) / (blank.w * blank.h) > 0.82, 'a blank four-quadrant grid floats in its own margin');
  assert.ok(blank.plot.x < 0.05 * blank.w && blank.plot.y < 0.08 * blank.h);
  // A letter in a corner makes the picture just big enough to hold it.
  const corner = grid.describeLayout({ ...FOUR, shapes: [{ points: [[2, -5], [5, -5], [5, -3]], labels: ['P', 'Q', 'R'] }] });
  assert.ok(corner.w - blank.w < blank.cell * 0.6 && corner.h - blank.h < blank.cell * 0.6);
});

test('the stick-in piece prints in ink, with the image and the four tints still told apart', () => {
  const colourful = { ...LESSON.twoShapes, tintQuadrants: true, highlight: 'K', pointStyle: 'cross', arrows: [{ from: [0, 0], to: [2, 1], steps: true, count: true }], route: [1, 1] };
  const svg = grid.tightSvg(colourful, PIECE).svg;
  const colours = [...svg.matchAll(/(?<!url\()#([0-9A-Fa-f]{6})\b/g)].map((m) => m[1]);
  colours.forEach((hex) => {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    assert.ok(Math.max(r, g, b) - Math.min(r, g, b) <= 8, `#${hex} is a colour, and the pack is photocopied`);
  });
  assert.match(svg, /stroke-dasharray/);
  const tints = [...grid.tightSvg({ min: -3, max: 3, tintQuadrants: true }, PIECE).svg.matchAll(/<rect[^>]*fill="(#[0-9A-F]{6})"/g)].map((m) => m[1]);
  assert.equal(new Set(tints).size, 4);
  // Same marks in colour and in ink: only the palette differs.
  const count = (s) => (s.match(/<(line|polygon|polyline|circle|path|rect|text)\b/g) || []).length;
  assert.equal(count(svg), count(grid.tightSvg(colourful).svg));
});

test('a surface that cuts the spec down keeps every field, and sizes by the whole span', () => {
  const full = { helper: 'coordinate-grid', id: 'q1', ...LESSON.whichMove, numbers: 'positive', axisLabels: true, grid: true, ticks: true, tintQuadrants: true, highlight: 'origin', quadrantNotes: {}, route: [1, 1], join: false, pointStyle: 'cross', points: [] };
  const picked = grid.pickSpec(full);
  assert.deepEqual(Object.keys(picked).sort(), grid.SPEC_FIELDS.filter((name) => full[name] !== undefined).sort());
  assert.ok(!('helper' in picked) && !('id' in picked));
  assert.deepEqual(grid.gridSpan({ min: -5, max: 5 }), { cols: 10, rows: 10 });
  assert.deepEqual(grid.gridSpan({ cols: 8, rows: 6 }), { cols: 8, rows: 6 });
  assert.deepEqual(grid.gridSpan({ xMin: -6, xMax: 6, yMax: 5 }), { cols: 12, rows: 5 });
});

// ── sized for where it is read (13 October 2026) ────────────────────────────
// The numbers were a fixed third of a square, so on the board a ten-square grid
// carried them at 8 to 9pt and on a wall sheet they could not be read across
// the room. A surface now says how big the grid prints and the words are sized
// for it. These hold the sizes, and that the bigger words still keep clear of
// each other on every grid above.
const SURFACES = {
  board: profileFor('slides', { widthPt: 12.1 * 72, heightPt: 5.2 * 72 }),
  'half a slide': profileFor('slides', { widthPt: 5.8 * 72, heightPt: 5.2 * 72 }),
  sheet: profileFor('worksheets', { widthMm: 110, heightMm: 150 }),
  wall: profileFor('wall', { widthMm: 180 }),
  'stick-in piece': profileFor('stickin', { widthMm: 277, heightMm: 88 }),
};

test('with no box the grid is drawn in its own units, exactly as before', () => {
  const L = grid.describeLayout(FOUR);
  assert.equal(L.textScale, 1);
  assert.equal(L.numberPt, null);
  assert.match(grid.tightSvg(FOUR).svg, /font-size="34\.00"/);
  assert.equal(grid.cacheKey({ max: 6 }), 'coordinate-grid:6x6:n1:p::route:-');
});

test('in a box the picture comes back fitted to it in points, the same squares with resized words', () => {
  Object.entries(SURFACES).forEach(([name, profile]) => {
    const out = grid.tightSvg(LESSON.triangleMoved, profile);
    assert.ok(out.w <= profile.widthPt + 0.01, `${name}: wider than its box`);
    if (profile.heightPt) assert.ok(out.h <= profile.heightPt + 0.01, `${name}: taller than its box`);
    assert.ok(Math.abs(out.w / out.h - out.aspect) < 1e-6);
    assert.ok(out.w >= profile.widthPt - 0.01 || out.h >= profile.heightPt - 0.01, `${name}: does not fill its box`);
    assert.notEqual(grid.cacheKey(LESSON.triangleMoved, profile), grid.cacheKey(LESSON.triangleMoved));
  });
});

test('the axis numbers print at the size each surface reads at, or as large as one square holds', () => {
  Object.entries(SURFACES).forEach(([name, profile]) => {
    const small = grid.describeLayout({ max: 5 }, profile);
    assert.ok(small.numberPt >= profile.fontPt - 0.3, `${name}: a five-square grid prints its numbers at ${small.numberPt.toFixed(1)}pt, under the ${profile.fontPt}pt it reads at`);
    const ten = grid.describeLayout(FOUR, profile);
    const asked = Math.min(profile.fontPt, ten.squarePt * 0.5);
    assert.ok(ten.numberPt >= asked - 0.3, `${name}: a ten-square grid prints its numbers at ${ten.numberPt.toFixed(1)}pt in ${ten.squarePt.toFixed(1)}pt squares`);
    // Never more than a square holds: neighbours along an axis stay apart.
    assert.ok(ten.numberPt <= ten.squarePt * 0.62 + 0.01);
  });
  // The lesson this was measured on: 8 to 9pt on the board, now at least twice that.
  assert.ok(grid.describeLayout(FOUR, SURFACES.board).numberPt >= 16);
});

test('the zero where the axes cross keeps clear of the number before it, at every size', () => {
  Object.entries(SURFACES).forEach(([name, profile]) => {
    const L = grid.describeLayout(FOUR, profile);
    const zero = L.numbers.find((n) => n.axis === 'origin').box;
    const before = L.numbers.find((n) => n.axis === 'x' && n.value === -1).box;
    const air = zero.x - (before.x + before.w);
    assert.ok(air >= 0.4 * (L.numberPt / L.ptPerUnit), `${name}: ${MINUS}1 and 0 are ${air.toFixed(1)} units apart and read as one number`);
  });
});

test('a question grid and its answer grid carry the same size of number', () => {
  const question = { ...FOUR, shapes: [{ points: [[1, 2], [4, 2], [1, 5]], labels: ['A', 'B', 'C'], translate: { dx: -6, dy: -4 } }] };
  Object.entries(SURFACES).forEach(([name, profile]) => {
    const a = grid.describeLayout(question, profile);
    const b = grid.describeLayout(LESSON.triangleMoved, profile);
    assert.equal(a.textScale, b.textScale, name);
  });
});

test('the resized words keep clear of each other and inside the picture, on every surface', () => {
  Object.entries(SURFACES).forEach(([surface, profile]) => {
    Object.entries({ ...LESSON, ...UNPLANNED }).forEach(([name, spec]) => {
      try {
        assertNothingMeets(spec, profile);
      } catch (error) {
        error.message = `${surface}, ${name}: ${error.message}`;
        throw error;
      }
    });
  });
});

test('quadrant notes are one size on one grid, and break into lines of words', () => {
  const spec = { min: -4, max: 4, tintQuadrants: true, quadrantNotes: { 'top right': 'x positive, y positive', 'top left': 'x negative, y positive', 'bottom left': 'x negative, y negative', 'bottom right': 'x positive, y negative' } };
  [undefined, SURFACES.board, SURFACES.wall].forEach((profile) => {
    const L = assertNothingMeets(spec, profile);
    assert.equal(new Set(L.notes.map((n) => n.font.toFixed(3))).size, 1, 'the four notes are different sizes');
    L.notes.forEach((n) => n.lines.forEach((line) => assert.ok(n.lines.length === 1 || line.includes(' '), `"${line}" is stranded on a line of its own`)));
  });
});

test('a letter keeps out of the row and column the axis numbers run along', () => {
  // M beside (4, 0) once sat between the 4 and the 5, and the axis read "4M5".
  const spec = { ...FOUR, points: [{ x: 0, y: 4, label: 'J' }, { x: -4, y: 0, label: 'K' }, { x: 0, y: -4, label: 'L' }, { x: 4, y: 0, label: 'M' }] };
  [undefined, ...Object.values(SURFACES)].forEach((profile) => {
    const L = assertNothingMeets(spec, profile);
    const xRow = L.numbers.filter((n) => n.axis === 'x');
    const rowTop = Math.min(...xRow.map((n) => n.box.y));
    const rowFoot = Math.max(...xRow.map((n) => n.box.y + n.box.h));
    const yCol = L.numbers.filter((n) => n.axis === 'y');
    const colLeft = Math.min(...yCol.map((n) => n.box.x));
    const colRight = Math.max(...yCol.map((n) => n.box.x + n.box.w));
    L.marks.filter((m) => m.labelBox).forEach((m) => {
      const b = m.labelBox;
      assert.ok(b.y + b.h <= rowTop + 0.5 || b.y >= rowFoot - 0.5, `letter ${m.label} sits in the row of x-axis numbers`);
      assert.ok(b.x + b.w <= colLeft + 0.5 || b.x >= colRight - 0.5, `letter ${m.label} sits in the column of y-axis numbers`);
    });
  });
});

// ─── answers marked on the grid (14 October 2026) ───────────────────────────
// On an answers slide the answer text beside the grid was green while the
// points and coordinates it named stayed red, so the grid never showed which
// marks were the answer.
const GREEN = '#00B050';
const SLIDE = profileFor('slides', { widthPt: 6 * 72, heightPt: 4.6 * 72 });
const SHEET = profileFor('worksheets', { widthMm: 110, heightMm: 150 });
const KEY = profileFor('worksheets', { widthMm: 110, heightMm: 150, overrides: { answers: 'show' } });
const ANSWERED = {
  ...FOUR, pointStyle: 'cross',
  points: [{ x: -3, y: 5, label: 'T', coords: true, answer: 'coordinates' }, { x: 2, y: -4, label: 'V', answer: true }],
  shapes: [{ points: [[2, 3], [-4, 3], [-5, -2], [4, -2]], labels: ['P', 'Q', 'R', 'S'], answer: true }],
  arrows: [{ from: [-5, 1], to: [1, -4], steps: true, count: true, answer: true }],
};

test('on the board an answer point, shape and path are green, and a given point keeps its colour', () => {
  const svg = grid.tightSvg(ANSWERED, SLIDE).svg;
  assert.match(svg, new RegExp(`<polygon points="[^"]*" fill="none" stroke="${GREEN}"`), 'the answer shape is outlined in green');
  assert.match(svg, new RegExp(`fill="${GREEN}">5 down</text>`), 'the counted words of an answer path are green');
  // T was given, only its coordinates are the answer: its letter keeps the point red.
  assert.match(svg, new RegExp(`fill="#C00000"[^>]*><tspan>T </tspan><tspan fill="${GREEN}">\\(${MINUS}3, 5\\)</tspan>`));
  assert.match(svg, new RegExp(`fill="${GREEN}"[^>]*>V</text>`));
});

test('a pupil sheet and the stick-in pack leave every answer off and draw the question', () => {
  for (const profile of [SHEET, PIECE]) {
    const L = grid.describeLayout(ANSWERED, profile);
    assert.deepEqual(L.marks.map((m) => m.label), ['T'], 'T stays, without its coordinates; V and the shape go');
    assert.equal(L.shapes.length, 0);
    assert.equal(L.arrows.length, 0);
    assert.doesNotMatch(grid.tightSvg(ANSWERED, profile).svg, new RegExp(GREEN));
  }
});

test('the teacher\'s answer sheet asks for the answers and prints them green', () => {
  const svg = grid.tightSvg(ANSWERED, KEY).svg;
  assert.match(svg, new RegExp(`fill="${GREEN}">5 down</text>`));
  assert.equal(grid.describeLayout(ANSWERED, KEY).shapes.length, 1);
  assert.notEqual(grid.cacheKey(ANSWERED, KEY), grid.cacheKey(ANSWERED, SHEET));
});

test('a translated image that is the answer is green, and the shape it came from is not', () => {
  const spec = { ...FOUR, shapes: [{ points: [[1, 2], [4, 2], [1, 5]], labels: ['A', 'B', 'C'], translate: { dx: -6, dy: -4 }, showImage: true, imageAnswer: true, imageLabels: ["A'", "B'", "C'"] }] };
  const L = grid.describeLayout(spec, SLIDE);
  assert.deepEqual(L.shapes.map((s) => [s.image, s.answer]), [[false, false], [true, true]]);
  assert.equal(L.arrows[0].answer, true, 'the arrow to an answer image is part of the answer');
  const question = grid.describeLayout(spec, SHEET);
  assert.deepEqual(question.shapes.map((s) => s.image), [false], 'on a pupil sheet only the shape to translate prints');
});

test('a counted path is solid orange, and the axis number it runs across is drawn over it', () => {
  const spec = { ...FOUR, shapes: [{ points: [[-5, 1], [-2, 1], [-5, 4]], inside: '1' }], arrows: [{ from: [-5, 1], to: [1, -4], steps: true, count: true }] };
  const svg = grid.tightSvg(spec, SLIDE).svg;
  assert.match(svg, /<line [^>]*stroke="#E46C0A"[^>]*stroke-linecap="round"\/>/);
  assert.doesNotMatch(svg, /stroke="#E46C0A"[^>]*stroke-dasharray/, 'the path is a firm line, not a dashed one');
  assert.match(svg, /fill="#E46C0A">6 right<\/text>/);
  // The across leg runs along y = 1: the axis's own 1 comes after the path, so it is drawn on top.
  assert.ok(svg.indexOf('stroke="#E46C0A"') < svg.indexOf('>1</text>'));
  // In ink the path is still a firm dark line.
  assert.match(grid.tightSvg(spec, PIECE).svg, /<line [^>]*stroke="#4D4D4D"[^>]*stroke-width="6.00"/);
});

test('a question grid and its answers grid told each other\'s content print at one size in one place', () => {
  // A small grid with its points at the edge: the coordinates the answers
  // slide writes cannot all sit on the squared paper, and reach past it.
  const at = [[4, 4], [4, 3], [3, 4]];
  const question = { max: 4, points: at.map(([x, y], i) => ({ x, y, label: 'TUV'[i] })) };
  const answers = { max: 4, points: at.map(([x, y], i) => ({ x, y, label: 'TUV'[i], coords: true, answer: 'coordinates' })) };
  const size = (spec) => { const L = grid.describeLayout(spec, SLIDE); return [L.w, L.h, L.origin.x, L.origin.y].map((v) => v.toFixed(2)); };
  assert.notDeepEqual(size(question), size(answers), 'the test must start from a grid that moves');
  const roomFor = [question, answers].map((s) => ({ points: s.points }));
  assert.deepEqual(size({ ...question, roomFor }), size({ ...answers, roomFor }));
  // The question still draws no coordinates.
  assert.doesNotMatch(grid.tightSvg({ ...question, roomFor }, SLIDE).svg, /\(4, 4\)/);
});
