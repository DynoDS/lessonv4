'use strict';

// A counters pair beside a written sum, and a sum the children answer in books.
//
// Year 4 Lessons 29 to 31 (15 October 2026) put the before-and-after counters
// beside the first written exchange. Drawn whole, the pair needed most of a
// slide, so the sum, the counters and the criteria never fitted together: one
// lesson lost its criteria, two spread one model over two or three slides. The
// teacher chose all three on one slide and agreed the counters may show only
// the columns that change (16 October 2026). Five view-only Your Turn sums ran
// over three slides because every empty answer row was held to handwriting
// width; he agreed that width goes when the children answer in their books.
//
// What this file pins:
//   - a pair that fits whole is drawn whole, cue box and every column;
//   - on a slide, a ringed exchange pair that does not fit drops its cue box,
//     then the columns the exchange does not touch, and fits;
//   - the counters' own floor is never lowered to make it fit;
//   - a "10 more" pair, with no exchange to ring, is never shortened;
//   - `inBooks` lets a slide sum's empty row go narrow, and never a sheet's.

const test = require('node:test');
const assert = require('node:assert/strict');

const chart = require('../visuals/place-value-chart-svg');
const { profileFor } = require('../visuals/surface-profiles');

const slide = (wIn, hIn) => profileFor('slides', { widthPt: wIn * 72, heightPt: hIn * 72, overrides: { pairExchangeMarks: true } });

// Thursday's pair: 541 after its first exchange, then the second.
const thursday = () => ({
  columns: ['H', 'T', 'O'],
  pair: {
    from: ['5', '3', '11'], to: ['4', '13', '11'], title: '',
    counters: { from: { H: 5, T: 3, O: 11 }, to: { H: 4, T: 13, O: 11 } },
    exchanges: [{ from: 'H', to: 'T', label: '1 hundred = 10 tens' }],
  },
});

// Tuesday's: 52 as 5 tens and 2 ones, then 4 tens and 12 ones.
const tuesday = () => ({
  columns: ['T', 'O'],
  pair: {
    from: ['5', '2'], to: ['4', '12'], operation: '=', title: '',
    counters: { from: { T: 5, O: 2 }, to: { T: 4, O: 12 } },
    exchanges: [{ from: 'T', to: 'O', label: '1 ten = 10 ones' }],
  },
});

const headingsOf = (L) => L.texts.filter((t) => t.role === 'heading').map((t) => t.text);
const hasCue = (L) => L.bars.some((b) => b.role === 'exchange-box');

test('a pair with room is drawn whole: its cue box and every column', () => {
  const L = chart.describeLayout(thursday(), slide(9.5, 4.8));
  assert.ok(hasCue(L));
  assert.deepEqual(headingsOf(L), ['H', 'T', 'O', 'H', 'T', 'O']);
});

test('beside a sum, a ringed exchange pair drops its cue box first', () => {
  // 3.80in tall whole; 2.76in without the box.
  const L = chart.describeLayout(tuesday(), slide(6, 2.8));
  assert.ok(!hasCue(L));
  assert.deepEqual(headingsOf(L), ['T', 'O', 'T', 'O']);
  assert.ok(L.h <= 2.8 * 72);
});

test('then the columns the exchange does not touch', () => {
  const L = chart.describeLayout(thursday(), slide(6, 2.8));
  assert.ok(!hasCue(L));
  assert.deepEqual(headingsOf(L), ['H', 'T', 'H', 'T']);
  // the digits that remain are the ones that changed
  const digits = L.texts.filter((t) => t.role === 'digit' || /^\d+$/.test(t.text)).map((t) => t.text);
  assert.ok(digits.includes('13') && digits.includes('4') && !digits.includes('11'));
});

test('the counters are never drawn under their floor to make it fit', () => {
  assert.throws(() => chart.describeLayout(thursday(), slide(4, 2.8)), /^Error: PLACE_VALUE_(COUNTERS_TOO_SMALL|CHART_DOES_NOT_FIT)/);
});

test('a "10 more" pair keeps every column, because "same" is what it teaches', () => {
  const tenMore = {
    columns: ['Th', 'H', 'T', 'O'],
    pair: { from: ['3', '4', '6', '2'], to: ['3', '4', '7', '2'], operation: '10 more', counters: { from: { Th: 3, H: 4, T: 6, O: 2 }, to: { Th: 3, H: 4, T: 7, O: 2 } } },
  };
  assert.throws(() => chart.describeLayout(tenMore, slide(6, 2.8)), /PLACE_VALUE_CHART_DOES_NOT_FIT/);
  assert.equal(headingsOf(chart.describeLayout(tenMore, slide(9.5, 4.8))).length, 8);
});

test('a sheet and the wall never shorten a pair', () => {
  const sheet = profileFor('worksheets', { widthPt: 2 * 72 });
  assert.throws(() => chart.describeLayout(thursday(), sheet), /^Error: PLACE_VALUE_/);
});

const sum = (extra = {}) => ({ columns: ['Th', 'H', 'T', 'O'], calculation: { operator: '-', numbers: ['6284', '2139'] }, ...extra });

test('an empty answer row is held to handwriting width on the board', () => {
  assert.throws(() => chart.describeLayout(sum(), slide(2.1, 2.6)), /PLACE_VALUE_WRITE_IN_TOO_NARROW/);
});

test('`inBooks` lets a Your Turn sum go narrow on the board', () => {
  const L = chart.describeLayout(sum({ inBooks: true }), slide(2.1, 2.6));
  assert.ok(L.colW < 0.83 * 72);
  assert.ok(chart.minWidthPt(sum({ inBooks: true }), 'slides') < chart.minWidthPt(sum(), 'slides'));
});

test('a sheet keeps its squares whatever `inBooks` says', () => {
  assert.equal(chart.minWidthPt(sum({ inBooks: true }), 'worksheets'), chart.minWidthPt(sum(), 'worksheets'));
});
