"use strict";

// A one-column portrait sheet takes a narrower working width, kept to the left.
//
// At the page's full 174mm a writing line and a blank number line ran further
// than the work on them. The teacher looked at the same sheets at 174mm, 144mm
// and 124mm (4 October 2026), chose 144mm, and asked for the work to sit on
// the left "so I don't have to trim all 4 sides, just 3". A sheet with things
// side by side keeps the full width: at 144mm each of two columns is 69mm.

const { test } = require("node:test");
const assert = require("node:assert");

const { sheetsOf } = require("../src/worksheet");

const resolveAutoSheet = (sheet, meta) => ({ sheet: sheetsOf({ meta, sheets: { expected: sheet } })[0].spec });
const { NARROW_SPARE_MM } = require("../src/page");

const short = () => ({
  layout: "auto",
  orientation: "portrait",
  zones: [
    {
      stack: [
        { helper: "section-label", text: "Fluency" },
        ...Array.from({ length: 4 }, () => ({
          question: true,
          helper: "written-answers",
          items: [{ text: "Is Kofi correct? Explain your answer.", lines: 3 }],
        })),
      ],
    },
  ],
});

test("a one-column portrait sheet that fits is marked narrow", () => {
  const { sheet } = resolveAutoSheet(short(), { yearGroup: 4 });
  assert.strictEqual(sheet.orientation, "portrait");
  assert.strictEqual(sheet.narrow, true);
  assert.strictEqual(NARROW_SPARE_MM, 30);
});

test("a sheet with two zones keeps the full width", () => {
  const half = { stack: short().zones[0].stack.slice(0, 2) };
  const two = { layout: "auto", orientation: "portrait", zones: [half, half] };
  const { sheet } = resolveAutoSheet(two, { yearGroup: 4 });
  assert.notStrictEqual(sheet.narrow, true);
});

test("a table too wide for the narrower page keeps the full width", () => {
  const wide = {
    layout: "auto",
    zones: [
      {
        stack: [
          {
            question: true,
            helper: "recording-table",
            columns: ["Number", "Digit sum", "Divisible by 3?", "Divisible by 9?", "Is it even?", "Divisible by 6?"],
            rows: [["84", null, null, null, null, null]],
            writing: "word",
          },
        ],
      },
    ],
  };
  const { sheet } = resolveAutoSheet(wide, { yearGroup: 6 });
  assert.notStrictEqual(sheet.narrow, true);
});

test("the designer can keep the full width by saying so", () => {
  const { sheet } = resolveAutoSheet({ ...short(), narrow: false }, { yearGroup: 4 });
  assert.notStrictEqual(sheet.narrow, true);
});

// A sentence with a write-in blank reads worse the moment it wraps, so the
// narrow page is refused when it breaks one the full page held (the stress
// test of 7 October 2026: "...... the owl / swooped down." three times).
const stems = (blankWidthMm) => ({
  layout: "auto",
  orientation: "portrait",
  zones: [
    {
      stack: ["when", "where", "how"].map((word) => ({
        question: true,
        helper: "instruction",
        text: `Tell us ${word}: ___ the owl swooped down.`,
        blankWidthMm,
      })),
    },
  ],
});

const blanksOn = (sheet) => [...JSON.stringify(sheet.zones).matchAll(/"blankWidthMm":(\d+)/g)].map((m) => Number(m[1]));

test("a sentence the narrow page would break keeps the sheet at full width", () => {
  const { sheet } = resolveAutoSheet(stems(80), { yearGroup: 4 });
  assert.notStrictEqual(sheet.narrow, true);
  assert.deepStrictEqual(blanksOn(sheet), [80, 80, 80], "the writing line is not shortened for nothing");
});

test("a phrase line gives a little of its length to keep the sheet narrow", () => {
  const { sheet } = resolveAutoSheet(stems(64), { yearGroup: 4 });
  assert.strictEqual(sheet.narrow, true);
  const widths = blanksOn(sheet);
  assert.ok(widths.every((mm) => mm < 64 && mm >= 48), `lines came out at ${widths.join(", ")}mm`);
  assert.strictEqual(new Set(widths).size, 1, "every line on the sheet is the same length");
});

test("a blank for one word keeps its size, and the sheet goes full width instead", () => {
  const sheetSpec = {
    layout: "auto",
    orientation: "portrait",
    zones: [
      {
        stack: [
          {
            question: true,
            helper: "instruction",
            text: "______ and ______ were together for hardness in our test.",
            blankWidthMm: 36,
          },
        ],
      },
    ],
  };
  const { sheet } = resolveAutoSheet(sheetSpec, { yearGroup: 3 });
  assert.notStrictEqual(sheet.narrow, true);
  assert.deepStrictEqual(blanksOn(sheet), [36]);
});
