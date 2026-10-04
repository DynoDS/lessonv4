"use strict";

// What the first check has to do for a sheet to be right first time.
//
// On 4 October 2026 fifteen worksheet designers were given five real lessons.
// None passed its first check, and 63 of about 95 failed checks were
// SHEET_DOES_NOT_FIT. Two things in the engine made that worse than the
// content deserved, and this file holds both repairs:
//
// - a sheet written as one tall column was refused, and passed the moment its
//   second half was moved to a second zone. The engine now tries that split
//   itself, in the order written, before it refuses;
// - a refusal named one sheet, so a pack of three went round at least three
//   times. Every refused sheet is now carried on the one refusal, and the
//   refusal says what each part of the sheet costs.

const { test } = require("node:test");
const assert = require("node:assert");

const { resolveAutoSheet, resolveAutoLayouts, WorksheetError } = require("../src/worksheet");

const line = (end) => ({
  question: true,
  stack: [
    { helper: "instruction", text: `${end} - 34 =` },
    // A working box, at the height the blank number line had before it was
    // reshaped (3 October 2026): the sheet these tests are about was written
    // when each line took about 70mm.
    { helper: "drawing-space", heightMm: 64 },
  ],
});

// The Year 4 subtraction sheet as most runs first wrote it: everything in one zone.
const oneColumn = () => ({
  layout: "auto",
  zones: [
    {
      stack: [
        { helper: "section-label", text: "Fluency" },
        line(87),
        line(65),
        { helper: "section-label", text: "Reasoning" },
        {
          question: true,
          helper: "written-answers",
          items: [{ text: "Is Kofi correct? Explain your answer.", lines: 2 }],
        },
        { helper: "section-label", text: "Problem Solving" },
        {
          question: true,
          stack: [
            { helper: "questions", items: ["George has 80 pencils. He gives away 36. How many are left?"] },
            { helper: "drawing-space", heightMm: 35 },
          ],
        },
      ],
    },
  ],
});

const tooMuch = () => ({
  layout: "auto",
  zones: [{ stack: Array.from({ length: 9 }, (_, i) => line(80 + i)) }],
});

test("one column too tall for a page is set out in more zones, in the order written", () => {
  const { sheet, choice } = resolveAutoSheet(oneColumn(), { yearGroup: 4 });
  assert.strictEqual(choice.splitFrom, 1);
  assert.ok(choice.zoneCount > 1);
  const ids = Object.keys(sheet.zones).sort();
  const order = ids.flatMap((id) => sheet.zones[id].stack);
  assert.deepStrictEqual(order, oneColumn().zones[0].stack);
});

test("a cut never leaves a heading or an instruction at the foot of a zone", () => {
  const { sheet } = resolveAutoSheet(oneColumn(), { yearGroup: 4 });
  for (const zone of Object.values(sheet.zones)) {
    const last = zone.stack[zone.stack.length - 1];
    assert.ok(!["section-label", "instruction"].includes(last.helper));
  }
});

test("a sheet that fits as written is not split", () => {
  const small = { layout: "auto", zones: [{ stack: [{ helper: "section-label", text: "Fluency" }, line(87)] }] };
  const { choice } = resolveAutoSheet(small, { yearGroup: 4 });
  assert.strictEqual(choice.splitFrom, null);
  assert.strictEqual(choice.zoneCount, 1);
});

test("content no split can hold is still refused, and the refusal prices each part", () => {
  assert.throws(
    () => resolveAutoSheet(tooMuch(), { yearGroup: 4 }),
    (error) => {
      assert.ok(error instanceof WorksheetError);
      assert.strictEqual(error.signal, "SHEET_DOES_NOT_FIT");
      assert.match(error.message, /What each part needs at its smallest/);
      assert.match(error.message, /\(9\) .*mm/);
      return true;
    }
  );
});

test("every refused sheet rides on the one refusal, and the first is thrown unchanged", () => {
  const worksheet = {
    meta: { yearGroup: 4 },
    sheets: { below: tooMuch(), expected: oneColumn(), greaterDepth: tooMuch() },
  };
  assert.throws(
    () => resolveAutoLayouts(worksheet),
    (error) => {
      assert.deepStrictEqual(error.location, { sheet: "below" });
      assert.match(error.message, /^Below - /);
      assert.strictEqual(error.alsoRefused.length, 1);
      assert.deepStrictEqual(error.alsoRefused[0].location, { sheet: "greaterDepth" });
      return true;
    }
  );
});
