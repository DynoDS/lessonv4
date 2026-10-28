'use strict';

// Pointing at one group of counters ("look at the ones") with the shared
// highlight: the named group is ringed, the others and the operator fade, the
// claim the counters prove stays, an unknown name is refused with the groups
// listed, and no highlight draws exactly as before.

const test = require('node:test');
const assert = require('node:assert/strict');

const C = require('../visuals/counter-group-svg');
const { RING, RING_INK } = require('../visuals/figure-highlight');

const SPEC = { statement: '5,009 = 5,000 + 9', joiner: '+', groups: [{ value: '1000', count: 5 }, { value: '1', count: 9 }] };
const BOX = { widthPt: 500 };

function fadedText(svg, words) {
  const stack = [];
  for (const m of svg.matchAll(/<(\/?)(g|text)\b([^>]*)>([^<]*)/g)) {
    if (m[2] === 'g') {
      if (m[1]) stack.pop();
      else stack.push(/opacity="/.test(m[3]));
    } else if (!m[1] && m[4] === words) return stack.some(Boolean) || /opacity="/.test(m[3]);
  }
  throw new Error(`no text "${words}"`);
}

const rings = (svg, colour) => (svg.match(new RegExp(`stroke="#${colour}"`, 'g')) || []).length;

test('the named group is ringed and lit; the other group and the operator fade; the claim stays', () => {
  const { svg } = C.tightSvg({ ...SPEC, highlight: 'group 2' }, 'slides', { widthPt: 600, heightPt: 300 });
  assert.equal(rings(svg, RING), 1);
  assert.equal(fadedText(svg, '1'), false);
  assert.equal(fadedText(svg, '1000'), true);
  assert.equal(fadedText(svg, '+'), true);
  assert.equal(fadedText(svg, SPEC.statement), false);
});

test('a group answers to its counter value and its place when no other group shares them', () => {
  const byOrder = C.tightSvg({ ...SPEC, highlight: 'group 1' }, 'worksheets', BOX).svg;
  assert.equal(C.tightSvg({ ...SPEC, highlight: '1,000' }, 'worksheets', BOX).svg, byOrder);
  assert.equal(C.tightSvg({ ...SPEC, highlight: 'thousands' }, 'worksheets', BOX).svg, byOrder);
  const twins = { groups: [{ value: '10', count: 3 }, { value: '10', count: 4 }] };
  assert.throws(() => C.tightSvg({ ...twins, highlight: 'tens' }, 'worksheets', BOX), /FIGURE_HIGHLIGHT_UNKNOWN.*group 1, group 2/s);
});

test('the photocopied stick-in pack rings in dark ink', () => {
  const { svg } = C.tightSvg({ ...SPEC, highlight: 'ones' }, 'stickin', BOX);
  // Ink is the stick-in pack's colour for every line, so count the one extra.
  assert.equal(rings(svg, RING_INK) - rings(C.tightSvg(SPEC, 'stickin', BOX).svg, RING_INK), 1);
  assert.equal(rings(svg, RING), 0);
});

test('a group the picture does not have is refused, listing the ones it does', () => {
  assert.throws(() => C.tightSvg({ ...SPEC, highlight: 'hundreds' }, 'worksheets', BOX), /FIGURE_HIGHLIGHT_UNKNOWN.*group 1, group 2/s);
});

test('no highlight draws exactly as before, and the highlight is part of the cache key', () => {
  const plain = C.tightSvg(SPEC, 'worksheets', BOX).svg;
  assert.ok(!plain.includes(RING) && !plain.includes('opacity'));
  assert.notEqual(C.cacheKey(SPEC, 'worksheets', BOX), C.cacheKey({ ...SPEC, highlight: 'ones' }, 'worksheets', BOX));
});
