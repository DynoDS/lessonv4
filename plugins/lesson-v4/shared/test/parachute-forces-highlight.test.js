'use strict';

// Pointing at one force of the parachute comparison ("gravity", "air
// resistance") with the shared highlight: the named force's arrows and label
// keep full strength with the label ringed, everything else fades, an unknown
// name is refused with the parts listed, and no highlight draws exactly as
// before.

const test = require('node:test');
const assert = require('node:assert/strict');

const P = require('../visuals/parachute-forces-svg');
const { RING, RING_INK, DIMMED } = require('../visuals/figure-highlight');
const { profileFor } = require('../visuals/surface-profiles');

const ringCount = (svg, colour = RING) => (svg.match(new RegExp(`<rect[^>]*fill="none" stroke="#${colour}"`, "g")) || []).length;
const faded = (svg) => svg.match(new RegExp(`<g opacity="${DIMMED}">.*?</g>`, 'g')) || [];

test('gravity keeps both down arrows and its label at full strength, ringed; the rest fades', () => {
  const { svg } = P.tightSvg({ highlight: 'gravity' });
  assert.equal(ringCount(svg), 1);
  const groups = faded(svg);
  assert.ok(!groups.some((g) => g.includes('large-gravity') || g.includes('small-gravity') || g.includes('data-label-box="downForce"')));
  assert.ok(groups.some((g) => g.includes('large-air-resistance')));
  assert.ok(groups.some((g) => g.includes('large-canopy')));
  assert.ok(groups.some((g) => g.includes('data-label-box="largeUpForce"')));
});

test('"air resistance" names both upward forces; each can be named alone', () => {
  const both = P.tightSvg({ highlight: 'air resistance' }).svg;
  assert.equal(ringCount(both), 2);
  assert.ok(!faded(both).some((g) => g.includes('large-air-resistance') || g.includes('small-air-resistance')));
  const one = P.tightSvg({ highlight: 'smallUpForce' }).svg;
  assert.equal(ringCount(one), 1);
  assert.ok(faded(one).some((g) => g.includes('large-air-resistance')));
  // The words printed on a label name it too.
  assert.equal(P.tightSvg({ highlight: 'Less air resistance' }).svg, one);
});

test('the photocopied stick-in pack rings in dark ink', () => {
  const { svg } = P.tightSvg({ highlight: 'cords' }, profileFor('stickin', { widthMm: 200 }));
  assert.equal(ringCount(svg, RING_INK), 1);
  assert.equal(ringCount(svg), 0);
});

test('a part the diagram does not have is refused, listing the parts it does', () => {
  assert.throws(() => P.tightSvg({ highlight: 'thrust' }), /FIGURE_HIGHLIGHT_UNKNOWN.*airResistance, largeUpForce, smallUpForce, downForce, largeCanopy, smallCanopy, cords, loads/s);
});

test('no highlight draws exactly as before, and the highlight is part of the cache key', () => {
  const plain = P.tightSvg({}).svg;
  assert.ok(!plain.includes(RING) && !plain.includes('opacity'));
  assert.equal(P.tightSvg({ highlight: [] }).svg, plain);
  assert.ok(!P.cacheKey({}).includes('highlight'));
  assert.notEqual(P.cacheKey({}), P.cacheKey({ highlight: 'gravity' }));
});
