'use strict';

// Pointing at a column of base-ten blocks ("look at the tens") with the shared
// highlight: the named column is ringed in the house colour, the others fade,
// an unknown name is refused with the columns listed, and no highlight draws
// exactly as before.

const test = require('node:test');
const assert = require('node:assert/strict');

const B = require('../visuals/base-ten-blocks-svg');
const { RING, RING_INK, DIMMED } = require('../visuals/figure-highlight');

const SPEC = { counts: { H: 2, T: 4, O: 6 } };
const BOX = { widthPt: 500 };

// Whether the words are drawn inside a faded group.
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

test('the named column is ringed and the other three fade, heading and blocks together', () => {
  const { svg } = B.tightSvg({ ...SPEC, highlight: 'tens' }, 'slides', { widthPt: 600, heightPt: 300 });
  assert.equal(rings(svg, RING), 1);
  assert.equal((svg.match(new RegExp(`<g opacity="${DIMMED}">`, 'g')) || []).length, 3);
  assert.equal(fadedText(svg, 'Tens'), false);
  assert.equal(fadedText(svg, 'Ones'), true);
  assert.equal(fadedText(svg, 'Hundreds'), true);
});

test('a column answers to its short name, and next-door columns share one ring', () => {
  const short = B.tightSvg({ ...SPEC, highlight: 'T' }, 'worksheets', BOX).svg;
  assert.equal(short, B.tightSvg({ ...SPEC, highlight: 'tens' }, 'worksheets', BOX).svg);
  const pair = B.tightSvg({ ...SPEC, highlight: ['tens', 'ones'] }, 'worksheets', BOX).svg;
  assert.equal(rings(pair, RING), 1);
});

test('the photocopied stick-in pack rings in dark ink', () => {
  const { svg } = B.tightSvg({ ...SPEC, highlight: 'hundreds' }, 'stickin', BOX);
  // Ink is the stick-in pack's colour for every line, so count the one extra.
  assert.equal(rings(svg, RING_INK) - rings(B.tightSvg(SPEC, 'stickin', BOX).svg, RING_INK), 1);
  assert.equal(rings(svg, RING), 0);
});

test('a column the blocks do not have is refused, listing the ones they do', () => {
  assert.throws(() => B.tightSvg({ ...SPEC, highlight: 'tenths' }, 'worksheets', BOX), /FIGURE_HIGHLIGHT_UNKNOWN.*thousands, hundreds, tens, ones/s);
});

test('no highlight draws exactly as before, and the highlight is part of the cache key', () => {
  const plain = B.tightSvg(SPEC, 'worksheets', BOX).svg;
  assert.ok(!plain.includes(RING) && !plain.includes('opacity'));
  assert.equal(B.tightSvg({ ...SPEC, highlight: [] }, 'worksheets', BOX).svg, plain);
  assert.notEqual(B.cacheKey(SPEC, 'worksheets', BOX), B.cacheKey({ ...SPEC, highlight: 'tens' }, 'worksheets', BOX));
});
