'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { numberRowItems, labelsForRow } = require('../src/question-labels');

test('a teacher-led row letters its items (a), (b), (c)', () => {
  const items = numberRowItems({
    questionNumbering: 'teacher-led',
    items: [{ label: 'Shape A' }, { label: 'Shape B' }, { label: 'Shape C' }],
  });

  assert.deepEqual(
    items.map((i) => i.label),
    ['(a) Shape A', '(b) Shape B', '(c) Shape C']
  );
});

test('an independent row numbers its items (1), (2), (3)', () => {
  const items = numberRowItems({
    questionNumbering: 'independent',
    items: [{ label: 'One' }, { label: 'Two' }, { label: 'Three' }],
  });

  assert.deepEqual(
    items.map((i) => i.label),
    ['(1) One', '(2) Two', '(3) Three']
  );
});

test('startAt continues a sequence that began on an earlier row', () => {
  // A set of questions split across two rows is still one set to the child.
  const items = numberRowItems({
    questionNumbering: 'independent',
    startAt: 3,
    items: [{ label: 'Third' }, { label: 'Fourth' }],
  });

  assert.deepEqual(
    items.map((i) => i.label),
    ['(3) Third', '(4) Fourth']
  );
});

test('a descriptive label keeps its own words and gains a number', () => {
  // "Shape A" is a NAME, not a question number. Reading it as one would strip
  // the word the designer chose and leave the child with a bare "(1)".
  const items = numberRowItems({
    questionNumbering: 'independent',
    items: [{ label: 'Shape A' }, { label: 'Method B' }],
  });

  assert.deepEqual(
    items.map((i) => i.label),
    ['(1) Shape A', '(2) Method B']
  );
});

test('an exact duplicate prefix is printed once, not twice', () => {
  const items = numberRowItems({
    questionNumbering: 'independent',
    items: [{ label: '(1) Shape A' }],
  });

  assert.equal(items[0].label, '(1) Shape A');
});

test('a conflicting prefix goes back upstream rather than being overwritten', () => {
  // The builder cannot know whether the author's (2) or the row's (1) is the
  // right one, and renumbering a question a teacher may be reading from a plan
  // is the worse guess.
  assert.throws(
    () =>
      numberRowItems({
        questionNumbering: 'independent',
        items: [{ label: '(2) Shape A' }],
      }),
    /QUESTION_LABEL_CONFLICT/
  );
});

test('a row without questionNumbering is left exactly as it was', () => {
  const original = [{ label: 'Shape A' }, { label: '(7) Kept' }];
  const items = numberRowItems({ items: original });

  assert.deepEqual(items, original);
  assert.equal(labelsForRow({ items: original }), null);
});

test('teacher-led lettering does not accept startAt', () => {
  assert.throws(
    () =>
      numberRowItems({
        questionNumbering: 'teacher-led',
        startAt: 2,
        items: [{ label: 'x' }],
      }),
    /QUESTION_NUMBERING_INVALID/
  );
});

test('an invalid startAt is refused rather than quietly treated as 1', () => {
  assert.throws(
    () =>
      numberRowItems({
        questionNumbering: 'independent',
        startAt: 0,
        items: [{ label: 'x' }],
      }),
    /QUESTION_NUMBERING_INVALID/
  );
});

test('numbering never rewrites the lesson JSON it was given', () => {
  const source = { questionNumbering: 'independent', items: [{ label: 'Shape A' }] };
  numberRowItems(source);

  assert.equal(source.items[0].label, 'Shape A');
});
