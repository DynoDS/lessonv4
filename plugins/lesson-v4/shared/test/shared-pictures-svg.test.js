'use strict';

// The clock, turn diagram, triangle-square puzzle, 2D shapes, translation grid,
// area grid, comparison ring and filled angle, each one drawing every surface
// places since 13 September 2026. These hold what each drawing guarantees on
// every surface, including what the surfaces' own drawings used to guarantee;
// each surface's tests hold how it places them.

const test = require('node:test');
const assert = require('node:assert/strict');
const { profileFor, PROFILES } = require('../visuals/surface-profiles');
const clock = require('../visuals/clock-svg');
const turn = require('../visuals/turn-diagram-svg');
const triangleSquare = require('../visuals/triangle-square-svg');
const polygon = require('../visuals/polygon-svg');
const translationGrid = require('../visuals/translation-grid-svg');
const areaGrid = require('../visuals/area-grid-svg');
const comparison = require('../visuals/comparison-svg');
const angle = require('../visuals/angle-svg');

const box = (s) => (s === 'slides' ? { widthMm: 150, heightMm: 110 } : { widthMm: 150 });
const everySurface = (module, spec) => Object.keys(PROFILES).map((s) => ({ s, out: module.tightSvg(spec, profileFor(s, box(s))) }));
const texts = (svg) => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
const marks = (svg) => (svg.match(/<(rect|line|polyline|polygon|circle|path)\b/g) || []).length;
const fontSizes = (svg) => [...svg.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
const COLOURS = /#CC0000|#0070C0|#00B050|#C65911|#CCE2F5|#FBE2C7|#FBBF24|#F4B6C2/;

const PICTURES = [
  [clock, { time: '3:40', colourCoded: true, minuteRing: true }],
  [turn, { quarters: 3, direction: 'anticlockwise', countMarks: true }],
  [triangleSquare, { triangles: ['35', ''], square: '80' }],
  [polygon, { shapes: [{ name: 'kite', label: 'Kite' }, { name: 'parallelogram', candidate: 'vertical', fold: true, verdict: 'fail' }] }],
  [translationGrid, { max: 6, from: { x: 1, y: 1 }, to: { x: 4, y: 3 } }],
  [areaGrid, { cols: 8, rows: 5, unitLabel: 'Each square = 1m²', rects: [{ x: 0, y: 0, w: 3, h: 2, label: 'A' }] }],
  [comparison, { left: '5', answer: '>', right: '3' }],
];

test('the same spec draws the same picture on every surface, only sized for where it is read', () => {
  for (const [module, spec] of PICTURES) {
    const drawn = everySurface(module, spec);
    const counts = drawn.map(({ out }) => marks(out.svg));
    assert.equal(new Set(counts).size, 1, `${module === clock ? 'clock' : JSON.stringify(spec).slice(0, 40)}: ${counts.join(', ')} marks`);
    const words = drawn.map(({ out }) => JSON.stringify(texts(out.svg)));
    assert.equal(new Set(words).size, 1, `every surface prints the same words: ${words.join(' | ')}`);
  }
});

test('no word is printed under the readable floor of the surface it is drawn for', () => {
  for (const [module, spec] of PICTURES) {
    for (const { s, out } of everySurface(module, spec)) {
      const floor = PROFILES[s].minFontPt;
      fontSizes(out.svg).forEach((pt) => assert.ok(pt >= floor - 0.01, `${s}: a ${pt}pt word under the ${floor}pt floor`));
      assert.ok(out.w <= profileFor(s, box(s)).widthPt + 0.5, `${s}: drawn ${out.w}pt wide in a ${profileFor(s, box(s)).widthPt}pt box`);
    }
  }
});

test('the stick-in piece stays in ink, because the pack is photocopied', () => {
  for (const [module, spec] of PICTURES) {
    const svg = module.tightSvg(spec, profileFor('stickin', { widthMm: 150 })).svg;
    assert.ok(!COLOURS.test(svg), `a house colour reached the photocopied pack: ${svg.match(COLOURS)}`);
  }
});

test('a clock sets its hands from the time, the hour hand moving between the hours', () => {
  const L = clock.describeLayout({ time: '3:30' }, 'worksheets');
  const svg = clock.tightSvg({ time: '3:30' }, 'worksheets').svg;
  const hands = [...svg.matchAll(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"[^>]*stroke-linecap="round"/g)];
  const [minute, hour] = hands.map((m) => Math.atan2(Number(m[4]) - Number(m[2]), Number(m[3]) - Number(m[1])) * (180 / Math.PI));
  assert.ok(Math.abs(minute - 90) < 0.5, `the minute hand at half past points down, not ${minute}`);
  assert.ok(Math.abs(hour - 15) < 0.5, `the hour hand at 3:30 sits halfway between 3 and 4, not ${hour}`);
  assert.ok(L.numPt >= 9);
});

test('a blank face draws no hands, and an unreadable time is refused rather than drawn blank', () => {
  const blank = clock.tightSvg({ hands: false }, 'worksheets').svg;
  assert.equal((blank.match(/stroke-linecap="round"/g) || []).length, 0);
  assert.throws(() => clock.tightSvg({ time: 'quarter past' }, 'worksheets'), /CLOCK_TIME_INVALID/);
});

test('a colour-coded clock prints its time in the hands\' colours; a row of faces is one size, lettered in order', () => {
  const coded = clock.tightSvg({ time: '3:40', colourCoded: true }, 'wall').svg;
  assert.match(coded, /<tspan fill="#CC0000">3<\/tspan><tspan fill="#000000">:<\/tspan><tspan fill="#0070C0">40<\/tspan>/);
  const row = clock.tightSvg({ clocks: [{ time: '9:15' }, { hands: false }, { time: '6:55' }], letters: true }, 'worksheets');
  assert.deepEqual(texts(row.svg).filter((t) => t.startsWith('(')), ['(a)', '(b)', '(c)']);
  const radii = [...row.svg.matchAll(/<circle cx="[\d.]+" cy="[\d.]+" r="([\d.]+)" fill="#FFFFFF"/g)].map((m) => m[1]);
  assert.equal(new Set(radii).size, 1, `faces of different sizes: ${radii.join(', ')}`);
});

test('a clock face too small for readable numerals is refused by name, and a sheet asks for the room', () => {
  const sheet = profileFor('worksheets', { widthMm: 40 });
  const six = { clocks: Array.from({ length: 6 }, () => ({ time: '1:00' })) };
  assert.throws(() => clock.tightSvg(six, sheet), /CLOCK_TOO_SMALL/);
  const need = clock.minWidthPt(six, sheet);
  assert.doesNotThrow(() => clock.tightSvg(six, profileFor('worksheets', { widthPt: need })));
});

test('a quarter turn clockwise ends pointing right, anticlockwise left; a half turn ends down', () => {
  const end = (spec) => turn.describeLayout(spec, 'worksheets').geos[0].endTip;
  assert.ok(end({ quarters: 1 }).x > 0 && Math.abs(end({ quarters: 1 }).y) < 1e-6);
  assert.ok(end({ quarters: 1, direction: 'anticlockwise' }).x < 0);
  assert.ok(end({ amount: 'half' }).y > 0);
  assert.equal(turn.tightSvg({ amount: 'three-quarter' }, 'wall').svg, turn.tightSvg({ quarters: 3 }, 'wall').svg);
});

test('a full turn still shows its arrow, and count marks number every quarter', () => {
  const L = turn.describeLayout({ quarters: 4 }, 'worksheets');
  const g = L.geos[0];
  assert.ok(Math.hypot(g.arcEnd.x - g.arcStart.x, g.arcEnd.y - g.arcStart.y) > 3, 'a full turn closed on itself');
  const counted = turn.tightSvg({ quarters: 3, countMarks: true }, 'slides', { widthPt: 300, heightPt: 300 });
  assert.deepEqual(texts(counted.svg), ['1', '2', '3']);
});

test('turns in a row share one ray length, however the crop falls', () => {
  const L = turn.describeLayout({ turns: [{ quarters: 1 }, { quarters: 2 }, { quarters: 4 }] }, 'worksheets');
  assert.equal(new Set(L.geos.map((g) => g.R)).size, 1);
});

test('the triangle-square question has exactly one unknown, and bigger numbers get bigger shapes to write in', () => {
  assert.doesNotThrow(() => triangleSquare.refuseUnlessOneBlank({ triangles: ['55', '75'], square: '' }));
  assert.throws(() => triangleSquare.refuseUnlessOneBlank({ triangles: ['55', ''], square: '' }), /TRIANGLE_SQUARE_BLANKS/);
  assert.throws(() => triangleSquare.refuseUnlessOneBlank({ triangles: ['55', '75'], square: '130' }), /TRIANGLE_SQUARE_BLANKS/);
  // The board may show the finished puzzle, or all blank to fill in live.
  assert.doesNotThrow(() => triangleSquare.tightSvg({ triangles: ['', ''], square: '' }, 'slides', { widthPt: 400, heightPt: 300 }));
  const two = triangleSquare.describeLayout({ triangles: ['55', '75'], square: '' }, 'worksheets');
  const four = triangleSquare.describeLayout({ triangles: ['5236', '3967'], square: '' }, 'worksheets');
  assert.ok(four.sq * four.u > two.sq * two.u, 'a four-digit answer got no more room than a two-digit one');
});

test('each named shape draws its true lines of symmetry, and none where it has none', () => {
  const lines = (name) => (polygon.tightSvg({ shapes: [{ name }], symmetryLines: true }, 'worksheets').svg.match(/stroke-dasharray/g) || []).length;
  assert.deepEqual(
    ['square', 'rectangle', 'rhombus', 'triangle', 'isosceles-triangle', 'kite', 'pentagon', 'hexagon', 'parallelogram', 'trapezium', 'scalene-triangle', 'right-triangle'].map(lines),
    [4, 2, 2, 3, 1, 1, 5, 6, 0, 0, 0, 0]
  );
  const answer = polygon.tightSvg({ shapes: [{ name: 'square' }], symmetryLines: true, symmetryLinesAnswer: true }, 'slides', { widthPt: 300, heightPt: 300 }).svg;
  assert.match(answer, /stroke="#00B050"[^>]*stroke-dasharray/);
});

test('a folded candidate line lands on the shape when it is a line of symmetry and overhangs when it is not', () => {
  const ghostOf = (name, candidate) => {
    const L = polygon.describeLayout({ shapes: [{ name, candidate, fold: true }] }, 'worksheets');
    const g = L.geos[0];
    return Math.max(...g.ghost.map((p, i) => Math.min(...g.verts.map((v) => Math.hypot(p.x - v.x, p.y - v.y)))));
  };
  assert.ok(ghostOf('square', 'vertical') < 0.01, 'a true line of symmetry folded onto itself leaves an overhang');
  assert.ok(ghostOf('parallelogram', 'vertical') > 5, 'a wrong line on a parallelogram showed no overhang');
});

test('the sheet\'s older shape spelling still draws its measurements, and only the sides labelled', () => {
  const svg = polygon.tightSvg({ type: 'rectangle', labels: { top: '8 cm', left: '3 cm' } }, 'worksheets').svg;
  assert.deepEqual(texts(svg).sort(), ['3 cm', '8 cm']);
  const right = polygon.tightSvg({ type: 'right-triangle', labels: { base: '6 cm', height: '4 cm' } }, 'worksheets').svg;
  assert.ok(right.includes('<polyline'), 'no right-angle mark');
  assert.throws(() => polygon.tightSvg({ type: 'dodecahedron' }, 'worksheets'), /UNKNOWN_SHAPE/);
  assert.ok(polygon.tightSvg({ type: 'rectangle', labels: { top: '5 < 8 & 9' } }, 'worksheets').svg.includes('5 &lt; 8 &amp; 9'));
});

test('grids refuse what cannot be counted or read', () => {
  assert.throws(() => areaGrid.tightSvg({ cols: 4, rows: 4, rects: [{ x: 3, y: 0, w: 2, h: 1 }] }, 'worksheets'), /AREA_GRID_PATCH_OFF_GRID/);
  assert.throws(() => translationGrid.tightSvg({ max: 5, from: { x: 6, y: 1 } }, 'worksheets'), /TRANSLATION_GRID_POINT_OFF_GRID/);
  assert.throws(() => translationGrid.tightSvg({ max: 20 }, 'slides', { widthPt: 120, heightPt: 120 }), /TRANSLATION_GRID_TOO_SMALL/);
  const noArrow = translationGrid.tightSvg({ max: 6, from: { x: 1, y: 1 }, to: { x: 4, y: 3 }, showArrow: false }, 'worksheets').svg;
  const arrow = translationGrid.tightSvg({ max: 6, from: { x: 1, y: 1 }, to: { x: 4, y: 3 } }, 'worksheets').svg;
  assert.equal(marks(arrow) - marks(noArrow), 2, 'the arrow is one dashed line and one head, and nothing else moves');
});

test('the comparison ring holds its answer inside the same ring; the wall\'s symbol spelling has none', () => {
  const ring = comparison.tightSvg({ answer: '<' }, 'worksheets').svg;
  assert.equal((ring.match(/<circle/g) || []).length, 1);
  assert.deepEqual(texts(ring), ['&lt;']);
  const wall = comparison.tightSvg({ symbol: '>', left: '5', right: '3' }, 'wall').svg;
  assert.equal((wall.match(/<circle/g) || []).length, 0);
  assert.deepEqual(texts(wall), ['5', '&gt;', '3']);
  assert.ok(comparison.maxWidthPt({}, 'slides') < comparison.maxWidthPt({ left: '4,321', right: '4,299' }, 'slides'));
});

test('the wall\'s angle fan is the shared angle with its opening filled and its size printed', () => {
  const fan = angle.tightSvg({ type: 'angleFan', degrees: 230, colour: '86EFAC' }, profileFor('wall', { widthMm: 180 })).svg;
  assert.match(fan, /fill="#86EFAC"/);
  assert.deepEqual(texts(fan), ['230°']);
  const plain = angle.tightSvg({ degrees: 60 });
  assert.ok(!/<text/.test(plain.svg), 'a classify-this angle printed its size');
  assert.notEqual(angle.cacheKey({ type: 'angleFan', degrees: 60 }), angle.cacheKey({ degrees: 60 }));
});
