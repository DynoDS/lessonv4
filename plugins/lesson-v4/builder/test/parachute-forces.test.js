'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const visual = require('../../shared/visuals/parachute-forces-svg');
const slideHelper = require('../src/content/parachute-forces');

const SPEC = {
  canopyShape: 'billowed-sheet',
  largeCanopyWidthRatio: 3,
  cordLengthRatio: 1,
  loadSizeRatio: 1,
  showEqualityTicks: true,
  labels: {
    largeCanopy: 'More air to push out of the way',
    smallCanopy: 'Less air to push out of the way',
    largeUpForce: 'More air resistance',
    smallUpForce: 'Less air resistance',
    downForce: 'Gravity pulls down',
    cords: 'Same cord length',
    loads: 'Same load',
  },
};

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

test('fair-test geometry preserves the declared exact ratios', () => {
  const { metrics } = visual.describeLayout(SPEC);
  assert.equal(metrics.canopyWidthRatio, 3);
  metrics.correspondingCordLengthRatios.forEach((ratio) => assert.ok(Math.abs(ratio - 1) < 1e-12));
  assert.equal(metrics.loadWidthRatio, 1);
  assert.equal(metrics.loadHeightRatio, 1);
  assert.equal(metrics.gravityArrowLengthRatio, 1);
  assert.ok(metrics.airResistanceArrowLengthRatio > 1);
});

test('cord drops are derived from equal Euclidean lengths', () => {
  const layout = visual.describeLayout(SPEC);
  assert.notEqual(layout.cords.large[0].y2 - layout.cords.large[0].y1, layout.cords.small[0].y2 - layout.cords.small[0].y1);
  assert.equal(layout.cords.large[0].length, layout.cords.large[1].length);
  assert.equal(layout.cords.small[0].length, layout.cords.small[1].length);
});

test('measured external label boxes do not collide, including longer wording', () => {
  const layout = visual.describeLayout({
    ...SPEC,
    labels: { ...SPEC.labels, cords: 'The corresponding suspension cords are exactly the same measured length' },
  });
  for (let i = 0; i < layout.labels.length; i += 1) {
    const a = layout.labels[i];
    assert.ok(a.x >= 0 && a.y >= 0 && a.x + a.w <= layout.canvas.w && a.y + a.h <= layout.canvas.h);
    for (let j = i + 1; j < layout.labels.length; j += 1) assert.equal(overlaps(a, layout.labels[j]), false);
  }
});

test('the SVG carries billowed sheets, equality ticks, loads and four force arrows', () => {
  const { svg, aspect } = visual.tightSvg(SPEC);
  assert.ok(aspect > 1);
  assert.match(svg, /data-role="large-canopy"/);
  assert.match(svg, /data-role="small-canopy"/);
  assert.match(svg, /data-role="large-cord-tick-0"/);
  assert.match(svg, /data-role="small-load"/);
  assert.match(svg, /data-role="large-air-resistance"/);
  assert.match(svg, /data-role="small-air-resistance"/);
  assert.match(svg, /data-role="large-gravity"/);
  assert.match(svg, /data-role="small-gravity"/);
});

test('unsupported semantic changes are refused instead of approximated', () => {
  assert.throws(() => visual.tightSvg({ ...SPEC, canopyShape: 'parafoil' }), /SHAPE_UNSUPPORTED/);
  assert.throws(() => visual.tightSvg({ ...SPEC, cordLengthRatio: 0.9 }), /RATIO_INVALID/);
  assert.throws(() => visual.tightSvg({ ...SPEC, loadSizeRatio: 2 }), /RATIO_INVALID/);
  assert.throws(() => visual.tightSvg({ ...SPEC, showEqualityTicks: 'false' }), /TICKS_INVALID/);
});

test('slide pre-render is exported and measurement retains the shared aspect', () => {
  const key = visual.cacheKey(SPEC);
  const aspect = visual.tightSvg(SPEC).aspect;
  const images = { [key]: { png: Buffer.from('prepared'), aspect } };
  assert.equal(typeof slideHelper.preRenderParachuteForces, 'function');
  const measured = slideHelper.measureParachuteForces(
    { x: 1, y: 1, w: 10, h: 5 }, SPEC, { parachuteForcesImages: images }
  );
  assert.ok(measured && measured.w > 0 && measured.h > 0);
});
