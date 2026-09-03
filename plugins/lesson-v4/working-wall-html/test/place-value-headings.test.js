'use strict';

// A wall card's place-value chart has one header band at one fixed size, and no
// width at which "Thousands" fits in it. The build refuses a card whose
// evidence is unreadable, so a Year 4 place-value run (3 September 2026) failed
// its wall outright - "the headings Thousands and Hundreds overlap and are
// unreadable at wall size" - and a focused repair changed the card by hand to
// Th/H/T/O before it would build.
//
// The same spelling also missed the column palette, which is keyed on the short
// names, so the card would have drawn every column in the default grey. On a
// wall card the colour is doing more work than on the board: it is what a child
// glancing up recognises from the lesson.
//
// So the card now canonicalises its columns whichever spelling reaches it. The
// hand repair is what the engine does, and the board and the wall stay one
// picture rather than two.

const assert = require('node:assert/strict');
const test = require('node:test');

const { tightSvg, canonicalColumn } = require('../../shared/visuals/place-value-chart-svg');

const LONG = ['Thousands', 'Hundreds', 'Tens', 'Ones'];
const SHORT = ['Th', 'H', 'T', 'O'];
const ROWS = [{ label: '3,462', cells: ['3', '4', '6', '2'], highlight: ['Tens'] }];

test('a card headed with the full words draws the short names', () => {
  const { svg } = tightSvg({ columns: LONG, rows: ROWS });
  assert.ok(!svg.includes('>Thousands<'), 'the card printed a word its band cannot hold');
  assert.ok(svg.includes('>Th<') && svg.includes('>H<'), 'the card lost its headings');
});

test('a card draws the same picture whichever spelling it is given', () => {
  const long = tightSvg({ columns: LONG, rows: ROWS }).svg;
  const short = tightSvg({ columns: SHORT, rows: [{ label: '3,462', cells: ['3', '4', '6', '2'], highlight: ['T'] }] }).svg;
  assert.equal(long, short);
});

test('the column palette resolves through the full words', () => {
  const { svg } = tightSvg({ columns: LONG, rows: ROWS });
  // The four place families are four different fills; a card that missed every
  // lookup would carry the default grey in all four.
  ['#8AB8E8', '#8AC88A', '#E8D84A', '#E89090'].forEach((fill) => {
    assert.ok(svg.includes(fill), `the ${fill} column never drew in its own colour`);
  });
});

test('a column name that is not a place is left alone', () => {
  // The discrimination: a chart is free to head a column anything, and only a
  // place-value name has a short form to fall back on.
  assert.equal(canonicalColumn('Hundreds'), 'H');
  assert.equal(canonicalColumn('Rainfall'), 'Rainfall');
  // Case is significant among the canonical names themselves.
  assert.equal(canonicalColumn('T'), 'T');
  assert.equal(canonicalColumn('t'), 't');
  assert.equal(canonicalColumn('Tenths'), 't');
  assert.equal(canonicalColumn('Thousandths'), 'th');
  assert.equal(canonicalColumn('hundred thousands'), 'HTh');
});
