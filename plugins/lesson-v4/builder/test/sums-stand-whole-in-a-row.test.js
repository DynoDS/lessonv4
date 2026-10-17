'use strict';

// A calculation is kept on one line (presentation-text.js), so a card narrower
// than its sum has nowhere to break it but inside a number. Four Year 4 sums
// laid across half a slide each had a 1.35" card for "2,648 + 10 =", which
// needs about 1.7" at the 18pt floor, and PowerPoint drew "2,648 + 1" over
// "0 =" (17 October 2026). The card sizer had counted the sum as two short
// lines it was never allowed to break into.
//
// These hold the three parts of the repair: the line counter breaks only where
// PowerPoint can, a row of such cards goes onto two lines, and a row whose
// sums already fit stays as it was.

const assert = require('node:assert/strict');
const test = require('node:test');

const { wrappedLineCount } = require('../src/glyph-width');
const { keepCalculationsWhole } = require('../src/presentation-text');
const { rowWidths, rowLineCount, measureRow } = require('../src/content/row');

const HALF_SLIDE = { x: 0.3, y: 1.6, w: 6.19, h: 1.45 };

function card(value) {
  return { type: 'text', value: value, align: 'center' };
}

const FOUR_SUMS = {
  type: 'row',
  questionNumbering: 'teacher-led',
  equaliseTextCards: true,
  items: ['2,648 + 10 =', '3,000 - 10 =', '4,321 + 100 =', '1,006 - 100 ='].map(card)
};

test('a joined calculation is one word to the line counter', () => {
  const joined = keepCalculationsWhole('2,648 + 10 =');
  assert.notEqual(joined, '2,648 + 10 =', 'the builder joins the sum');
  // Two lines when it may break at its spaces; no fit at all when it may not.
  assert.equal(wrappedLineCount('2,648 + 10 =', 18, 1.2, true), 2);
  assert.equal(wrappedLineCount(joined, 18, 1.2, true), Infinity);
  // Joined, it is measured as the same width as the sum written out.
  assert.equal(wrappedLineCount(joined, 18, 2.5, true), 1);
});

test('sums too wide to sit four across go onto two lines of two', () => {
  assert.equal(rowLineCount(HALF_SLIDE, FOUR_SUMS), 2);
  const widths = rowWidths(HALF_SLIDE, FOUR_SUMS, null);
  assert.equal(widths.length, 4);
  for (const w of widths) assert.ok(Math.abs(w - (6.19 - 0.1) / 2) < 1e-9, `card ${w}" wide`);
});

test('a wrapped row says it needs the height of both lines', () => {
  const ctx = {};
  const one = measureRow(Object.assign({}, HALF_SLIDE, { h: 6 }), { type: 'row', items: FOUR_SUMS.items.slice(0, 2) }, ctx);
  const both = measureRow(Object.assign({}, HALF_SLIDE, { h: 6 }), FOUR_SUMS, ctx);
  if (!one || !both) return; // a card that cannot be measured says nothing, as before
  assert.ok(both.h > one.h * 1.9, `two lines ${both.h}" against one ${one.h}"`);
});

test('sums that fit side by side stay on one line', () => {
  const short = { type: 'row', items: ['2 + 3 =', '4 + 5 =', '6 + 1 =', '7 + 2 ='].map(card) };
  assert.equal(rowLineCount(HALF_SLIDE, short), 1);
  const words = { type: 'row', items: ['Thousands', 'Hundreds', 'Tens', 'Ones'].map(card) };
  assert.equal(rowLineCount(HALF_SLIDE, words), 1, 'only calculations move a row');
});

test('a row holding anything but text cards is left alone', () => {
  const mixed = {
    type: 'row',
    items: [card('2,648 + 10 ='), card('4,321 + 100 ='), card('1,006 - 100 ='), { type: 'image', imagePath: 'x.jpg' }]
  };
  assert.equal(rowLineCount(HALF_SLIDE, mixed), 1);
});

test('a sum too wide even on a line of its own leaves the row as it is', () => {
  const narrow = { x: 0, y: 0, w: 1.4, h: 2 };
  const row = { type: 'row', items: [card('4,321 + 100 = 4,421'), card('1,006 - 100 = 906')] };
  assert.equal(rowLineCount(narrow, row), 1);
});
