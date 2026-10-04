'use strict';

// The draw-your-own number line: one shape on every surface, and a start
// number the back of the room can read on the board.
//
// Year 4 Maths Lesson 21 (Subtract two 2-digit numbers, 3 October 2026) taught
// backward jumps on a blank number line. The drawing was 2.4 times as wide as
// it was tall, so at the full width of a sheet it stood 71mm high: four lines
// and two other tasks needed 434mm of a 267mm page, the page designer squeezed
// each line beside its sum, and the repairs that followed left four questions
// where six were designed. On the board the same drawing came out as a short
// faint line with a start number too small to read.
//
// The teacher, shown the line made shallower: "the reshaped one is right", on
// the sheet and on the board, and of the board, "maybe thicker line and bigger
// number. 20 font size is min".

const test = require('node:test');
const assert = require('node:assert/strict');

const { tightSvg } = require('../../shared/visuals/blank-surface-svg');
const { sizeForZone, placedSize, BOARD_MIN_PT } = require('../src/content/blank-surface');

const LINE = { surface: 'number-line', start: '', end: 87 };
const PAGE_WIDTH_MM = 174;
const PAGE_HEIGHT_MM = 267;

test('a full-width number line on a sheet is shallow enough for four to share a page with other tasks', () => {
  const { aspect } = tightSvg(LINE);
  const tall = PAGE_WIDTH_MM / aspect;
  assert.ok(tall <= 30, `a full-width line is ${tall.toFixed(1)}mm tall`);
  // Room to draw and label jumps above the line: the teacher approved 27mm.
  assert.ok(tall >= 22, `a full-width line is only ${tall.toFixed(1)}mm tall, too shallow to draw jumps on`);
  assert.ok(4 * tall < PAGE_HEIGHT_MM / 2, 'four lines take more than half the page');
});

test('the shape is the same with and without a start number, so every line on a page matches', () => {
  const bare = tightSvg({ surface: 'number-line' });
  const labelled = tightSvg(LINE);
  assert.ok(Math.abs(bare.h - labelled.h) < 3, `a labelled line is ${labelled.h.toFixed(0)} tall and a bare one ${bare.h.toFixed(0)}`);
});

// The pictures the board would make for one labelled line, without drawing them.
function boardSizes() {
  return [26, 34, 46, 60, 80, 110, 150].map((units) => {
    const built = tightSvg(LINE, undefined, { endFontSize: units, stroke: units * 0.18 });
    return { units, widthUnits: built.w, aspect: built.aspect, png: Buffer.from('x') };
  });
}

const printedPt = (size, innerW, innerH) => size.units * (placedSize(size.aspect, innerW, innerH).w * 72 / size.widthUnits);

test('the start number on the board is never under 20pt, in a narrow column or a full slide', () => {
  const entry = { png: Buffer.from('x'), aspect: 6.5, sizes: boardSizes() };
  // The inside of a 30%, 40%, 50%, 60% and 70% column, and a full-width zone.
  for (const innerW of [3.6, 4.8, 6.1, 7.5, 8.9, 12.7]) {
    for (const innerH of [0.9, 1.5, 3]) {
      const chosen = sizeForZone(entry, innerW, innerH);
      const pt = printedPt(chosen, innerW, innerH);
      assert.ok(pt >= BOARD_MIN_PT, `${innerW}in by ${innerH}in: the start number prints at ${pt.toFixed(1)}pt`);
    }
  }
});

test('the start number does not grow with the column: it stays near the floor', () => {
  const entry = { png: Buffer.from('x'), aspect: 6.5, sizes: boardSizes() };
  for (const innerW of [4.8, 6.1, 8.9, 12.7]) {
    const pt = printedPt(sizeForZone(entry, innerW, 3), innerW, 3);
    assert.ok(pt < 30, `${innerW}in wide: the start number prints at ${pt.toFixed(1)}pt`);
  }
});

test('a surface with no number to print is placed as it always was', () => {
  const plain = { png: Buffer.from('x'), aspect: 4 };
  assert.equal(sizeForZone(plain, 6, 2), plain);
});
