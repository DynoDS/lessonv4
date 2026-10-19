'use strict';

// A sum's exchange shown happening (shared/visuals/exchange-happening-svg.js):
// the moments worked out from the numbers, the pieces keeping their names and
// sizes from click to click, and the sum's marks arriving on the same clicks.

const test = require('node:test');
const assert = require('node:assert/strict');
const xh = require('../visuals/exchange-happening-svg');
const { profileFor } = require('../visuals/surface-profiles');

const board = () => profileFor('slides', { widthPt: 9 * 72, heightPt: 5 * 72 });
const wide = () => profileFor('slides', { widthPt: 12 * 72, heightPt: 5 * 72 });
const kinds = (spec) => xh.stepsFor(spec).map((s) => s.kind).join(' ');

test('the moments are the written method, right to left', () => {
  assert.equal(kinds({ operator: '-', numbers: ['52', '28'] }), 'start move break take take');
  // Across a zero: the hundreds give to the tens first, then the tens to the ones.
  assert.equal(kinds({ operator: '-', numbers: ['302', '158'] }), 'start move break move break take take take');
  const across = xh.stepsFor({ operator: '-', numbers: ['302', '158'] }).filter((s) => s.kind === 'move');
  assert.deepEqual(across.map((s) => `${s.from}>${s.to}`), ['H>T', 'T>O']);
  // Two exchanges, each when its column is reached.
  assert.equal(kinds({ operator: '-', numbers: ['541', '263'] }), 'start move break take move break take take');
  assert.equal(kinds({ operator: '+', numbers: ['47', '35'] }), 'start join move break join');
  // No exchange: every column is shown and simply taken away.
  assert.equal(kinds({ operator: '-', numbers: ['58', '23'] }), 'start take take');
});

test('columns no exchange reaches are written in the sum on the last click', () => {
  const steps = xh.stepsFor({ operator: '-', numbers: ['4252', '1128'] });
  assert.equal(steps.map((s) => s.kind).join(' '), 'start move break take take rest');
  const last = steps[steps.length - 1];
  assert.deepEqual(last.columns, ['H', 'Th']);
  assert.match(last.sentence, /4,252 − 1,128 = 3,124\.$/);
});

test('blocks for tens and ones, counters for bigger sums, a request wins', () => {
  const at = (spec) => xh.tightSvg(spec, wide()).layout.pieces;
  assert.equal(at({ operator: '-', numbers: ['52', '28'], step: 0 }), 'blocks');
  assert.equal(at({ operator: '-', numbers: ['302', '158'], step: 0 }), 'counters');
  assert.equal(at({ operator: '-', numbers: ['52', '28'], pieces: 'counters', step: 0 }), 'counters');
  // An addition of two 2-digit numbers that makes a hundred is a 3-digit sum.
  assert.equal(at({ operator: '+', numbers: ['95', '27'], step: 0 }), 'counters');
  assert.throws(() => xh.normalise({ operator: '-', numbers: ['302', '158'], pieces: 'blocks' }), /EXCHANGE_HAPPENING_INVALID/);
});

test('every piece keeps its name and its size on every click', () => {
  for (const spec of [{ operator: '-', numbers: ['52', '28'] }, { operator: '-', numbers: ['302', '158'] }, { operator: '+', numbers: ['47', '35'] }]) {
    const n = xh.stepsFor(spec).length;
    const sizes = new Map();
    let whole = null;
    for (let k = 0; k < n; k += 1) {
      const L = xh.slideLayers({ ...spec, step: k }, board());
      if (whole) assert.deepEqual([L.w, L.h], whole, 'the drawing is one size for the whole run');
      whole = [L.w, L.h];
      const names = L.shapes.map((d) => d.name);
      assert.equal(new Set(names).size, names.length, 'one shape per name');
      for (const d of L.shapes) {
        if (/ghost/.test(d.name)) continue;
        const was = sizes.get(d.name);
        if (was) assert.deepEqual([d.w, d.h], was, `${d.name} kept its size`);
        sizes.set(d.name, [d.w, d.h]);
      }
    }
  }
});

test('the exchanged ten on 52 - 28 moves, then its ten cubes come out of it', () => {
  const spec = { operator: '-', numbers: ['52', '28'] };
  const at = (k) => new Map(xh.slideLayers({ ...spec, step: k }, board()).shapes.map((d) => [d.name, d]));
  const before = at(0);
  const moved = at(1);
  const broken = at(2);
  const cube = '!!xh-O-x0-0';
  assert.ok(before.has(cube) && moved.has(cube) && broken.has(cube), 'the cube is the same shape all along');
  assert.ok(moved.get(cube).x > before.get(cube).x, 'it moved right, into the ones');
  assert.ok(moved.has('!!xh-ghost-0'), 'the move shows where it came from');
  assert.ok(!broken.has('!!xh-T-4-box'), 'once broken it is no longer a rod');
  assert.equal(moved.get(cube).fill, xh.EXCHANGE_COLOURS[0]);
});

test("the sum's marks arrive on the same clicks as the pieces", () => {
  const spec = { operator: '-', numbers: ['52', '28'] };
  const svgAt = (k) => xh.tightSvg({ ...spec, step: k }, board()).svg;
  const digitsIn = (svg, colour) => (svg.match(new RegExp(`fill="${colour}"[^>]*>(\\d)<`, 'g')) || []).length;
  assert.equal(digitsIn(svgAt(0), '#E46C0A'), 0, 'nothing marked before the move');
  assert.ok(digitsIn(svgAt(1), '#E46C0A') >= 1, 'the 4 above the crossed-out 5 on the move');
  assert.ok(digitsIn(svgAt(2), '#E46C0A') > digitsIn(svgAt(1), '#E46C0A'), 'the small 1 on the break');
});

test('paper gets one still picture of the exchange', () => {
  const still = xh.tightSvg({ operator: '-', numbers: ['52', '28'] }, profileFor('worksheets', { widthPt: 160 * 2.835 }));
  assert.match(still.svg, /stroke-dasharray/, 'the outline where the ten was');
  assert.match(still.svg, /<polygon/, 'the arrow');
});

test('a zone too small refuses by name', () => {
  assert.throws(() => xh.tightSvg({ operator: '-', numbers: ['302', '158'], step: 0 }, profileFor('slides', { widthPt: 200, heightPt: 100 })), /EXCHANGE_HAPPENING_DOES_NOT_FIT/);
});
