"use strict";

// Place-value headings a worksheet asked for and never got.
//
// On 30 August 2026 the Year 4 maths lesson "Add and subtract a 4-digit number
// by a 3-digit number" shipped Sheet A telling children five times that "the
// digits are aligned under T and O" over grids showing no T and no O. The
// designer wrote `showHeadings: true`; the renderer accepted only operator,
// top and bottom, so the flag no-opped silently, and two focused repairs
// rebuilt pixel-identical pages before the run gave up (WORKSHEETS-001).
//
// These tests hold the option for real: the letters render, they are derived
// from the numbers' own width, and the measurement grows with the extra row so
// the drawn grid and its promised height cannot disagree.

const { test } = require("node:test");
const assert = require("node:assert");

const { helpers } = require("../src/helpers/forms");

const grid = helpers["column-method-grid"];

// The grid is the shared place value chart's `calculation` since 5 October
// 2026, so the letters are read out of the drawing's own text.
const headingsOf = (html) => [...html.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);

test("showHeadings prints T and O above a 2-digit grid", () => {
  const texts = headingsOf(grid.render({ operator: "+", top: 34, bottom: 25, showHeadings: true }, 85));
  assert.deepEqual(texts.slice(0, 2), ["T", "O"]);
});

test("showHeadings prints Th H T O above a 4-digit grid", () => {
  const texts = headingsOf(grid.render({ operator: "-", top: 4683, bottom: 357, showHeadings: true }, 100));
  assert.deepEqual(texts.slice(0, 4), ["Th", "H", "T", "O"]);
});

test("without showHeadings the grid prints only the sum", () => {
  const texts = headingsOf(grid.render({ operator: "+", top: 3456, bottom: 1278 }, 100));
  assert.deepEqual(texts, ["3", "4", "5", "6", "+", "1", "2", "7", "8"]);
});

test("an explicit columns list is refused by name, never silently ignored", () => {
  assert.throws(
    () => grid.render({ operator: "+", top: 34, bottom: 25, columns: ["T", "O"] }),
    /COLUMN_METHOD_UNSUPPORTED/
  );
});

test("the headings row is measured, not free", () => {
  const spec = { operator: "+", top: 3456, bottom: 1278 };
  const plain = grid.measure(spec, 100);
  const headed = grid.measure({ ...spec, showHeadings: true }, 100);
  assert.ok(headed > plain, "a grid with headings must be measured taller");

  const plainNeeds = grid.needs(spec);
  const headedNeeds = grid.needs({ ...spec, showHeadings: true });
  assert.ok(headedNeeds.minHeightMm > plainNeeds.minHeightMm);
});
