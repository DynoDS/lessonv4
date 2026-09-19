'use strict';
// A completed answer row prints green, and a ring still means only "this digit
// changed".
//
// An answers slide showed a rounding chart with all twelve result digits in the
// same plain black as the original number, which is the one row on the slide
// that is not an answer (the teacher, 19 September 2026: "I wish the answers on
// slide 5 and 7, in the table were green"). `highlight` could not say it: it
// rings one cell to mean the digit that moved, and ringing twelve cells would
// have destroyed that meaning to borrow its colour. `answer: true` is the row
// saying it is a result.
const test = require('node:test');
const assert = require('node:assert/strict');
const { describeLayout } = require('../../shared/visuals/place-value-chart-svg');
const { profileFor } = require('../../shared/visuals/surface-profiles');

const board = () => profileFor('slides', { widthPt: 7.8 * 72, heightPt: 2.8 * 72 });
const GREEN = '#00B050';

const digits = (spec) =>
  describeLayout(spec, board()).texts.filter((t) => t.role === 'digit');
const greens = (spec) => digits(spec).filter((t) => t.fill === GREEN);

const rows = (extra) => ({
  columns: ['Th', 'H', 'T', 'O'],
  rows: [
    { label: 'Original', cells: ['3', '4', '4', '9'] },
    Object.assign({ label: 'Nearest 10', cells: ['3', '4', '5', '0'] }, extra)
  ]
});

test('an answer row prints every one of its digits green', () => {
  const green = greens(rows({ answer: true }));
  assert.equal(green.length, 4);
  assert.deepEqual(green.map((t) => t.text), ['3', '4', '5', '0']);
});

test('an answer row adds no ring, because nothing here changed one digit', () => {
  const { rings } = describeLayout(rows({ answer: true }), board());
  assert.equal(rings.length, 0);
});

test('the row the question started from stays black beside it', () => {
  const black = digits(rows({ answer: true })).filter((t) => t.fill !== GREEN);
  assert.deepEqual(black.map((t) => t.text), ['3', '4', '4', '9']);
});

test('a chart with no answer row is untouched', () => {
  assert.equal(greens(rows({})).length, 0);
  assert.equal(describeLayout(rows({}), board()).rings.length, 0);
});

test('a ring still means the digit that changed, and still rings', () => {
  const spec = {
    columns: ['Th', 'H', 'T', 'O'],
    rows: [
      { label: '3,462', cells: ['3', '4', '6', '2'] },
      { label: '10 more', cells: ['3', '4', '7', '2'], highlight: ['T'] }
    ]
  };
  const { rings } = describeLayout(spec, board());
  assert.equal(rings.length, 1);
  assert.deepEqual(greens(spec).map((t) => t.text), ['7']);
});

test('a blank cell in an answer row is not a revealed answer', () => {
  // The row is marked as the answer but has not been filled in yet: this is the
  // live state the teacher completes, so there is nothing to print green.
  const spec = {
    columns: ['Th', 'H', 'T', 'O'],
    rows: [
      { label: 'Original', cells: ['3', '4', '4', '9'] },
      { label: 'Nearest 10', cells: ['', '', '', ''], answer: true }
    ]
  };
  assert.equal(greens(spec).length, 0);
});
