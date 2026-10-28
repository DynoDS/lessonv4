'use strict';

// Pointing at one part of a circuit ("the bulb", "this switch", "the gap")
// with the shared highlight: the named component keeps full strength with a
// ring, everything else fades, the wire is traced rather than ringed, a row of
// circuits is pointed at circuit by circuit, an unknown name is refused with
// the parts listed, and no highlight draws exactly as before.

const test = require('node:test');
const assert = require('node:assert/strict');

const C = require('../visuals/circuit-diagram-svg');
const { RING, RING_INK, DIMMED } = require('../visuals/figure-highlight');
const { profileFor } = require('../visuals/surface-profiles');

const SPEC = { cells: 2, components: ['lamp', 'lamp', 'buzzer'], switch: 'open', path: 'complete' };
const rings = (svg, colour = RING) => (svg.match(new RegExp(`<(?:rect|circle)[^>]*stroke="#${colour}"`, 'g')) || []).length;
const fadedCount = (svg) => (svg.match(new RegExp(`<g opacity="${DIMMED}">`, 'g')) || []).length;

test('a numbered lamp keeps full strength with a ring; the rest of the circuit fades', () => {
  const { svg } = C.tightSvg({ ...SPEC, highlight: 'lamp 2' });
  assert.equal(rings(svg), 1);
  assert.ok(new RegExp(`<circle[^>]*fill="none" stroke="#${RING}"`).test(svg), 'a lamp is ringed with a circle');
  assert.ok(fadedCount(svg) >= 4, 'the other lamp, the buzzer, the switch, the cells and the wire fade');
  assert.equal(C.tightSvg({ ...SPEC, highlight: 'bulb 2' }).svg, svg);
});

test('"lamps" names every lamp, "battery" the cells, and the wire is traced, not ringed', () => {
  assert.equal(rings(C.tightSvg({ ...SPEC, highlight: 'lamps' }).svg), 2);
  assert.equal(rings(C.tightSvg({ ...SPEC, highlight: 'battery' }).svg), 1);
  const wire = C.tightSvg({ ...SPEC, highlight: 'wire' }).svg;
  assert.equal(rings(wire), 0);
  assert.ok(wire.includes(`stroke="#${RING}"`));
});

test('a row is pointed at circuit by circuit; the other circuit and its caption fade', () => {
  const row = {
    circuits: [
      { cells: 1, lamps: 1, switch: 'closed', path: 'complete', label: 'A' },
      { cells: 1, lamps: 1, switch: 'none', path: 'gap', label: 'B' },
    ],
  };
  const svg = C.tightSvg({ ...row, highlight: 'circuit 2 gap' }).svg;
  assert.equal(rings(svg), 1);
  assert.ok(new RegExp(`<g opacity="${DIMMED}"><text[^>]*>A</text>`).test(svg));
  assert.ok(!new RegExp(`<g opacity="${DIMMED}"><text[^>]*>B</text>`).test(svg));
  assert.equal(C.tightSvg({ ...row, highlight: 'B gap' }).svg, svg);
  assert.equal(rings(C.tightSvg({ ...row, highlight: 'circuit A' }).svg), 1);
});

test('the photocopied stick-in pack rings in dark ink', () => {
  const { svg } = C.tightSvg({ ...SPEC, highlight: 'switch' }, profileFor('stickin', { widthMm: 60 }));
  assert.equal(rings(svg, RING_INK), 1);
  assert.equal(rings(svg), 0);
});

test('a part the circuit does not have is refused, listing the parts it does', () => {
  assert.throws(() => C.tightSvg({ ...SPEC, highlight: 'gap' }), /FIGURE_HIGHLIGHT_UNKNOWN.*cells, lamp 1, lamp 2, lamps, buzzer, switch, wire/s);
  assert.throws(() => C.tightSvg({ cells: 1, lamps: 1, switch: 'none', path: 'complete', highlight: 'switch' }), /FIGURE_HIGHLIGHT_UNKNOWN/);
});

test('no highlight draws exactly as before, and the highlight is part of the cache key', () => {
  const plain = C.tightSvg(SPEC);
  assert.ok(!plain.svg.includes(RING) && !plain.svg.includes('opacity'));
  assert.ok(plain.svg.includes('viewBox="0 0 '));
  assert.equal(C.tightSvg({ ...SPEC, highlight: [] }).svg, plain.svg);
  assert.ok(!C.cacheKey(SPEC).includes('highlight'));
  assert.notEqual(C.cacheKey(SPEC), C.cacheKey({ ...SPEC, highlight: 'switch' }));
});
