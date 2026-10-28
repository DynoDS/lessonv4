'use strict';

// Pointing at part of a number network ("these two add to 100") with the
// shared highlight: a named circle is ringed, a named line rings the two
// circles it joins, the rest fades while the caption stays, an unknown name is
// refused with the parts listed, and no highlight draws exactly as before.

const test = require('node:test');
const assert = require('node:assert/strict');

const N = require('../visuals/number-network-svg');
const { RING, RING_INK } = require('../visuals/figure-highlight');

const SPEC = {
  target: 100,
  nodes: [{ x: 0, y: 0, value: 30 }, { x: 2, y: 0, value: null }, { x: 1, y: 1, value: 40 }, { x: 0, y: 2, value: 70 }],
  edges: [[0, 1], [0, 2], [0, 3], [2, 1]],
};
const BOX = { widthPt: 400 };

function fadedText(svg, words) {
  const stack = [];
  for (const m of svg.matchAll(/<(\/?)(g|text)\b([^>]*)>([^<]*)/g)) {
    if (m[2] === 'g') {
      if (m[1]) stack.pop();
      else stack.push(/opacity="/.test(m[3]));
    } else if (!m[1] && m[4] === words) return stack.some(Boolean);
  }
  throw new Error(`no text "${words}"`);
}

const rings = (svg, colour) => (svg.match(new RegExp(`stroke="#${colour}"`, 'g')) || []).length;

test('a named line rings the two circles it joins, and the rest fades; the caption stays', () => {
  const { svg } = N.tightSvg({ ...SPEC, highlight: 'line 3' }, 'slides', { widthPt: 600, heightPt: 300 });
  assert.equal(rings(svg, RING), 2);
  assert.equal(fadedText(svg, '30'), false);
  assert.equal(fadedText(svg, '70'), false);
  assert.equal(fadedText(svg, '40'), true);
  assert.equal(fadedText(svg, '?'), true);
  assert.equal(fadedText(svg, 'Each connected pair adds up to 100'), false);
  assert.equal(svg, N.tightSvg({ ...SPEC, highlight: '30 and 70' }, 'slides', { widthPt: 600, heightPt: 300 }).svg);
});

test('a circle answers to the number in it', () => {
  const { svg } = N.tightSvg({ ...SPEC, highlight: '40' }, 'worksheets', BOX);
  assert.equal(rings(svg, RING), 1);
  assert.equal(svg, N.tightSvg({ ...SPEC, highlight: 'circle 3' }, 'worksheets', BOX).svg);
  assert.equal(fadedText(svg, '30'), true);
});

test('the photocopied stick-in pack rings in dark ink', () => {
  const { svg } = N.tightSvg({ ...SPEC, highlight: 'circle 2' }, 'stickin', BOX);
  // Ink is the stick-in pack's colour for every line, so count the one extra.
  assert.equal(rings(svg, RING_INK) - rings(N.tightSvg(SPEC, 'stickin', BOX).svg, RING_INK), 1);
  assert.equal(rings(svg, RING), 0);
});

test('a part the network does not have is refused, listing the parts it does', () => {
  assert.throws(() => N.tightSvg({ ...SPEC, highlight: '50' }, 'worksheets', BOX), /FIGURE_HIGHLIGHT_UNKNOWN.*circle 1, circle 2, circle 3, circle 4, line 1/s);
});

test('no highlight draws exactly as before, and the highlight is part of the cache key', () => {
  const plain = N.tightSvg(SPEC, 'worksheets', BOX).svg;
  assert.ok(!plain.includes(RING) && !plain.includes('opacity'));
  assert.notEqual(N.cacheKey(SPEC, 'worksheets', BOX), N.cacheKey({ ...SPEC, highlight: '40' }, 'worksheets', BOX));
});
