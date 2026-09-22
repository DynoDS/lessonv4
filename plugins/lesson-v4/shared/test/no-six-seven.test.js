'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { sixSevenNumbers } = require('../text/no-six-seven');

test('a number with a 6 followed by a 7 is caught, commas or not', () => {
  assert.deepEqual(sixSevenNumbers({ text: 'Round 6,742 to the nearest 10.' }), ['6,742']);
  assert.deepEqual(sixSevenNumbers({ text: 'What is 10 more than 57? 67' }), ['67']);
  assert.deepEqual(sixSevenNumbers({ answers: ['670', '267'] }), ['670', '267']);
  assert.deepEqual(sixSevenNumbers({ text: 'It costs 67p.' }), ['67']);
  assert.deepEqual(sixSevenNumbers({ start: 670, end: 680 }), ['670']);
});

test('a year, a decimal, an identifier, a file and a colour are left alone', () => {
  assert.deepEqual(sixSevenNumbers({ text: 'In 1567 the king died, and in 1967 the school opened.' }), []);
  assert.deepEqual(sixSevenNumbers({ text: '6.7 kg', weight: 0.67, fontSize: 67 }), []);
  assert.deepEqual(sixSevenNumbers({ designUnitId: 'unit-067', imagePath: 'icons/67.png', color: '00B067' }), []);
});

test('a counting run keeps the number it cannot skip', () => {
  const hundredSquare = Array.from({ length: 10 }, (_, r) =>
    Array.from({ length: 10 }, (_, c) => String(r * 10 + c + 1))
  );
  assert.deepEqual(sixSevenNumbers({ rows: hundredSquare }), []);
  assert.deepEqual(sixSevenNumbers({ labels: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70] }), []);
  assert.deepEqual(sixSevenNumbers({ labels: [60, 67, 70] }), ['67']);
});

test('a position inside a picture is not a number the class reads', () => {
  // A label-diagram anchor is a percentage across and down the image, and the
  // part it names does not move because of a playground meme.
  assert.deepEqual(
    sixSevenNumbers({ callouts: [{ anchor: [35, 67], label: 'large intestine' }] }),
    []
  );
  assert.deepEqual(
    sixSevenNumbers({ callouts: [{ anchor: [35, 68], label_at: [67, 12], label: 'stomach' }] }),
    []
  );
});

test('skipping anchors does not skip the numbers that matter', () => {
  // The guard on the part above: the same 67 in anything a child reads is
  // still caught, including alongside an anchor on the same sheet.
  assert.deepEqual(
    sixSevenNumbers({
      callouts: [{ anchor: [35, 67], label: 'large intestine' }],
      question: 'Round 67 to the nearest ten.',
    }),
    ['67']
  );
  assert.deepEqual(sixSevenNumbers({ anchorNote: 'Start at 67 on the number line.' }), ['67']);
});
