'use strict';

// Pointing at a digit ("look at the tens digit") with the shared highlight:
// the named card is ringed, everything else fades, the question stays, the
// marks keep their own meaning, an unknown name is refused with the cards
// listed, and no highlight draws exactly as before.

const test = require('node:test');
const assert = require('node:assert/strict');

const D = require('../visuals/digit-cards-svg');
const { RING, RING_INK } = require('../visuals/figure-highlight');

const SPEC = {
  text: 'Is 316 divisible by 4?', value: '316',
  marks: [{ digits: 1, style: 'dim' }, { id: 'last two', digits: 'last 2', style: 'box', colour: 'blue', label: 'last two digits: 16' }],
  working: [{ text: 'half of 16 is 8', arrow: true }],
};
const BOARD = { widthPt: 600, heightPt: 300 };
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

test('a named card is ringed and lit; the other cards, the marks off it and the working fade; the question stays', () => {
  const { svg } = D.tightSvg({ ...SPEC, highlight: 'card 2' }, 'slides', BOARD);
  assert.equal(rings(svg, RING), 1);
  assert.equal(fadedText(svg, '1'), false);
  assert.equal(fadedText(svg, '6'), true);
  assert.equal(fadedText(svg, '3'), true);
  assert.equal(fadedText(svg, 'last two digits: 16'), true);
  assert.equal(fadedText(svg, 'half of 16 is 8'), true);
  assert.equal(fadedText(svg, 'Is 316 divisible by 4?'), false);
});

test('a card answers to its position and its place in a written number', () => {
  const byCard = D.tightSvg({ ...SPEC, highlight: 'card 2' }, 'slides', BOARD).svg;
  for (const name of ['digit 2', 'tens', 'tens digit', 'ten digit']) {
    assert.equal(D.tightSvg({ ...SPEC, highlight: name }, 'slides', BOARD).svg, byCard, name);
  }
  // Decimals have places too.
  const decimal = D.tightSvg({ value: '3.47', highlight: 'hundredths' }, 'slides', BOARD).svg;
  assert.equal(fadedText(decimal, '7'), false);
  assert.equal(fadedText(decimal, '4'), true);
});

test("naming a mark lights its digits and its words, and the mark keeps its own box inside the ring", () => {
  const { svg } = D.tightSvg({ ...SPEC, highlight: 'last two' }, 'slides', BOARD);
  // One ring round the run of two cards, not one per card.
  assert.equal(rings(svg, RING), 1);
  assert.equal(fadedText(svg, '1'), false);
  assert.equal(fadedText(svg, '6'), false);
  assert.equal(fadedText(svg, '3'), true);
  assert.equal(fadedText(svg, 'last two digits: 16'), false);
  // The mark's own blue box is still drawn: the highlight adds a ring, it does
  // not replace or recolour the mark.
  assert.ok(svg.includes('stroke="#0070C0" stroke-width'));
});

test('the photocopied stick-in pack rings in dark ink', () => {
  const { svg } = D.tightSvg({ ...SPEC, highlight: 'ones' }, 'stickin', BOX);
  // Ink is the stick-in pack's colour for every line, so count the one extra.
  assert.equal(rings(svg, RING_INK) - rings(D.tightSvg(SPEC, 'stickin', BOX).svg, RING_INK), 1);
  assert.equal(rings(svg, RING), 0);
});

test('the wall pin spots move with the picture when the ring grows it', () => {
  const plain = D.tightSvg({ ...SPEC, callouts: [{ part: 'card 2', step: 1 }] }, 'wall', BOX);
  const lit = D.tightSvg({ ...SPEC, callouts: [{ part: 'card 2', step: 1 }], highlight: 'card 2' }, 'wall', BOX);
  const at = (r) => [(r.anchors['card 2'][0] / 100) * r.w, (r.anchors['card 2'][1] / 100) * r.h];
  const [px, py] = at(plain);
  const [lx, ly] = at(lit);
  const reach = (lit.w - plain.w) / 2;
  assert.ok(reach > 0);
  assert.ok(Math.abs(lx - px - reach) < 0.01 && Math.abs(ly - py - reach) < 0.01);
});

test('a card the number does not have is refused, listing the parts it does', () => {
  assert.throws(() => D.tightSvg({ ...SPEC, highlight: 'thousands' }, 'slides', BOARD), /FIGURE_HIGHLIGHT_UNKNOWN.*card 1, card 2, card 3, mark 1, last two/s);
});

test('no highlight draws exactly as before, and the highlight is part of the cache key', () => {
  const plain = D.tightSvg(SPEC, 'slides', BOARD).svg;
  assert.ok(!plain.includes(RING) && !plain.includes('opacity'));
  assert.notEqual(D.cacheKey(SPEC, 'slides', BOARD), D.cacheKey({ ...SPEC, highlight: 'card 1' }, 'slides', BOARD));
});
