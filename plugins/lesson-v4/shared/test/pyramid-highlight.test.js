'use strict';

// Pointing at a level or a brick of a pyramid ("look at the bottom row") with
// the shared highlight: the named part is ringed, the rest fades with a faded
// row's label, an unknown name is refused with the parts listed, and no
// highlight draws exactly as before.

const test = require('node:test');
const assert = require('node:assert/strict');

const P = require('../visuals/pyramid-svg');
const { RING, RING_INK } = require('../visuals/figure-highlight');

const NUMBERS = { rows: [{ items: [''] }, { items: ['14', '20'] }, { items: ['6', '8', '12'] }] };
const RANKING = { rows: [{ label: 'Most important', items: ['Safety'] }, { label: 'Quite', items: ['Cost', 'Speed'] }, { label: 'Least', items: ['Colour', 'Size', 'Noise'] }] };
const BOX = { widthPt: 500 };

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

test('a named level is ringed and lit; the levels above fade', () => {
  const { svg } = P.tightSvg({ ...NUMBERS, highlight: 'bottom' }, 'slides', { widthPt: 600, heightPt: 300 });
  assert.equal(rings(svg, RING), 1);
  assert.equal(fadedText(svg, '8'), false);
  assert.equal(fadedText(svg, '14'), true);
  assert.equal(svg, P.tightSvg({ ...NUMBERS, highlight: 'row 3' }, 'slides', { widthPt: 600, heightPt: 300 }).svg);
});

test('one brick can be pointed at, and a faded row takes its label with it', () => {
  const { svg } = P.tightSvg({ ...RANKING, highlight: 'row 2 brick 1' }, 'slides', { widthPt: 600, heightPt: 300 });
  assert.equal(rings(svg, RING), 1);
  assert.equal(fadedText(svg, 'Cost'), false);
  assert.equal(fadedText(svg, 'Speed'), true);
  assert.equal(fadedText(svg, 'Least'), true);
  // A level answers to its own label, and lights that label.
  const byLabel = P.tightSvg({ ...RANKING, highlight: 'Most important' }, 'slides', { widthPt: 600, heightPt: 300 }).svg;
  assert.equal(fadedText(byLabel, 'Safety'), false);
  assert.equal(fadedText(byLabel, 'Quite'), true);
});

test('the photocopied stick-in pack rings in dark ink', () => {
  const { svg } = P.tightSvg({ ...NUMBERS, highlight: 'top' }, 'stickin', BOX);
  // Ink is the stick-in pack's colour for every line, so count the one extra.
  assert.equal(rings(svg, RING_INK) - rings(P.tightSvg(NUMBERS, 'stickin', BOX).svg, RING_INK), 1);
  assert.equal(rings(svg, RING), 0);
});

test('a part the pyramid does not have is refused, listing the parts it does', () => {
  assert.throws(() => P.tightSvg({ ...NUMBERS, highlight: 'row 4' }, 'worksheets', BOX), /FIGURE_HIGHLIGHT_UNKNOWN.*row 1, row 2, row 3, row 1 brick 1/s);
});

test('no highlight draws exactly as before, and the highlight is part of the cache key', () => {
  const plain = P.tightSvg(NUMBERS, 'worksheets', BOX).svg;
  assert.ok(!plain.includes(RING) && !plain.includes('opacity'));
  assert.notEqual(P.cacheKey(NUMBERS, 'worksheets', BOX), P.cacheKey({ ...NUMBERS, highlight: 'top' }, 'worksheets', BOX));
});
