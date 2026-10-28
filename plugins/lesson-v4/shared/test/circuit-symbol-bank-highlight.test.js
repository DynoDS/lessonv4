'use strict';

// Pointing at one symbol in the circuit symbol bank ("this is the open
// switch") with the shared highlight: the named entry keeps full strength with
// a ring round its symbol and name, the others fade, an unknown name is
// refused with the symbols listed, and no highlight draws exactly as before.

const test = require('node:test');
const assert = require('node:assert/strict');

const B = require('../visuals/circuit-symbol-bank-svg');
const { RING, RING_INK, DIMMED } = require('../visuals/figure-highlight');
const { profileFor } = require('../visuals/surface-profiles');

const SPEC = {
  items: [
    { symbol: 'cell', label: 'cell' },
    { symbol: 'lamp', label: 'bulb' },
    { symbol: 'wire', label: 'wire' },
    { symbol: 'switch-open', label: 'open switch' },
  ],
};
const rings = (svg, colour = RING) => (svg.match(new RegExp(`stroke="#${colour}"`, 'g')) || []).length;
const faded = (svg) => svg.match(new RegExp(`<g opacity="${DIMMED}">.*?</g>`, 'g')) || [];

test('the named symbol keeps full strength with a ring; the others fade, names and all', () => {
  const { svg } = B.tightSvg({ ...SPEC, highlight: 'lamp' });
  assert.equal(rings(svg), 1);
  const groups = faded(svg);
  assert.equal(groups.length, 3);
  assert.ok(!groups.some((g) => g.includes('>bulb<')));
  assert.ok(groups.some((g) => g.includes('>open switch<')));
});

test('a symbol answers to its printed name, its everyday word and its place', () => {
  const svg = B.tightSvg({ ...SPEC, highlight: 'switch-open' }).svg;
  for (const name of ['open switch', 'switch', '4']) {
    assert.equal(B.tightSvg({ ...SPEC, highlight: name }).svg, svg, name);
  }
  assert.equal(B.tightSvg({ ...SPEC, highlight: 'bulb' }).svg, B.tightSvg({ ...SPEC, highlight: 'lamp' }).svg);
});

test('the photocopied stick-in pack rings in dark ink', () => {
  const { svg } = B.tightSvg({ ...SPEC, highlight: 'cell' }, profileFor('stickin', { widthMm: 60 }));
  assert.equal(rings(svg, RING_INK), 1);
  assert.equal(rings(svg), 0);
});

test('a symbol the bank does not show is refused, listing the ones it does', () => {
  assert.throws(() => B.tightSvg({ ...SPEC, highlight: 'switch-closed' }), /FIGURE_HIGHLIGHT_UNKNOWN.*cell, lamp, wire, switch-open/s);
});

test('no highlight draws exactly as before, and the highlight is part of the cache key', () => {
  const plain = B.tightSvg(SPEC).svg;
  assert.ok(!plain.includes(RING) && !plain.includes('opacity'));
  assert.equal(B.tightSvg({ ...SPEC, highlight: [] }).svg, plain);
  assert.ok(!B.cacheKey(SPEC).includes('highlight'));
  assert.notEqual(B.cacheKey(SPEC), B.cacheKey({ ...SPEC, highlight: 'wire' }));
});
