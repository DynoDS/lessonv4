"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  resolveAutoLayouts,
  resolveAutoSheet,
  sheetsOf,
  answerKeyOf,
  WorksheetError,
} = require("../src/worksheet");
const { suggestLayouts } = require("../src/suggest");

// `"layout": "auto"`: the engine chooses the page shape itself, from the same
// comfort ranking the suggest tool prints. These tests pin the contract that
// makes it trustworthy: the choice IS the ranking's top answer, content order
// survives, and the malformed shapes are refused with named signals rather
// than guessed at.

const ITEMS = [
  {
    question: true,
    helper: "questions",
    items: ["What is 4 x 3?", "What is 6 x 3?", "What is 9 x 3?"],
  },
  {
    question: true,
    helper: "written-answers",
    items: [{ text: "Explain how you know 24 is a multiple of 3.", lines: 3 }],
  },
];

function autoWorksheet(overrides = {}) {
  return {
    meta: { lesson: "Multiply by 3", lo: "Multiply by 3.", yearGroup: 4 },
    sheets: {
      expected: { layout: "auto", zones: ITEMS.map((i) => ({ ...i })), ...overrides },
    },
    answerKey: {
      expected: [
        { question: 1, answer: "12" },
        { question: 2, answer: "18" },
        { question: 3, answer: "27" },
        { question: 4, answer: "Accept any answer showing 24 = 8 x 3." },
      ],
    },
  };
}

test("auto resolves to the comfort ranking's own top answer", () => {
  const { worksheet, choices } = resolveAutoLayouts(autoWorksheet());
  const best = suggestLayouts(ITEMS, { yearGroup: 4 }).fits[0];

  assert.equal(choices.length, 1);
  assert.equal(choices[0].sheet, "expected");
  assert.equal(choices[0].layout, best.layout);
  assert.equal(choices[0].orientation, best.orientation);

  const sheet = worksheet.sheets.expected;
  assert.equal(sheet.layout, best.layout);
  assert.equal(sheet.orientation, best.orientation);
});

test("content lands in reading order: first entry, first zone", () => {
  const { worksheet } = resolveAutoLayouts(autoWorksheet());
  const zones = worksheet.sheets.expected.zones;
  const ids = Object.keys(zones).sort();
  assert.equal(zones[ids[0]].helper, "questions", "the first entry should take the first zone");
  assert.equal(zones[ids[1]].helper, "written-answers");
});

test("sheetsOf resolves an auto sheet on its own, and agrees with the batch route", () => {
  const eager = sheetsOf(resolveAutoLayouts(autoWorksheet()).worksheet);
  const lazy = sheetsOf(autoWorksheet());
  assert.equal(lazy[0].spec.layout, eager[0].spec.layout);
  assert.equal(lazy[0].spec.orientation, eager[0].spec.orientation);
  assert.notEqual(lazy[0].spec.layout, "auto", "an auto sheet must never reach the renderer unresolved");
});

test("the answer key is checked against an auto sheet's printed labels", () => {
  // Labels depend only on reading order, which the array already is, so the
  // key validates before and after resolution and gives the same answer.
  const key = answerKeyOf(autoWorksheet());
  assert.deepEqual(
    key.expected.map((e) => e.question),
    ["1", "2", "3", "4"]
  );

  const wrong = autoWorksheet();
  wrong.answerKey.expected = wrong.answerKey.expected.slice(0, 2);
  assert.throws(() => answerKeyOf(wrong), /missing question/);
});

test("a stated orientation constrains the choice", () => {
  const ws = autoWorksheet({ orientation: "portrait" });
  const { choices } = resolveAutoLayouts(ws);
  assert.equal(choices[0].orientation, "portrait");
});

test("a named layout with a zones ARRAY is refused, and names both forms", () => {
  const ws = autoWorksheet();
  ws.sheets.expected.layout = "halves-stacked";
  assert.throws(
    () => resolveAutoLayouts(ws),
    (e) => e instanceof WorksheetError && e.signal === "AUTO_LAYOUT_INVALID" && /keyed by those names/.test(e.message)
  );
});

test("auto with a zones OBJECT is refused: zone names belong to a layout", () => {
  const ws = autoWorksheet();
  ws.sheets.expected.zones = { a: ITEMS[0], b: ITEMS[1] };
  assert.throws(
    () => resolveAutoLayouts(ws),
    (e) => e instanceof WorksheetError && e.signal === "AUTO_LAYOUT_INVALID"
  );
});

test("auto inside the two-page exception is refused: the split is the designer's", () => {
  const sheet = {
    centralWriteOnVisualException: { visual: "A cross-section", reason: "Too big for one page" },
    pages: [
      { layout: "auto", zones: [ITEMS[0]] },
      { layout: "full", zones: { a: ITEMS[1] } },
    ],
  };
  assert.throws(
    () => resolveAutoSheet(sheet, { yearGroup: 4 }),
    (e) => e instanceof WorksheetError && e.signal === "AUTO_LAYOUT_INVALID" && /two-page exception/.test(e.message)
  );
});

test("content no layout holds is refused with the millimetre verdict, named to its sheet", () => {
  // Two zones, each a stack of six six-line written answers: about 280mm of
  // content per zone, which no arrangement of any page can hold.
  const tooMuch = Array.from({ length: 2 }, (_, z) => ({
    stack: Array.from({ length: 6 }, (_, i) => ({
      question: true,
      helper: "written-answers",
      items: [{ text: `Explain part ${z * 6 + i + 1} fully.`, lines: 6 }],
    })),
  }));
  const ws = autoWorksheet();
  ws.sheets.expected.zones = tooMuch;
  ws.answerKey.expected = tooMuch.map((_, i) => ({ question: i + 1, answer: "Model answer." }));

  assert.throws(
    () => resolveAutoLayouts(ws),
    (e) =>
      e instanceof WorksheetError &&
      e.signal === "SHEET_DOES_NOT_FIT" &&
      /Expected - /.test(e.message) &&
      /mm/.test(e.message),
    "the refusal should carry the sheet's name and a shortfall in millimetres"
  );
});

test("an empty zones array is refused rather than resolved to nothing", () => {
  const ws = autoWorksheet();
  ws.sheets.expected.zones = [];
  assert.throws(
    () => resolveAutoLayouts(ws),
    (e) => e instanceof WorksheetError && e.signal === "AUTO_LAYOUT_INVALID"
  );
});

test("a worksheet with no auto sheets passes through untouched", () => {
  const ws = autoWorksheet();
  ws.sheets.expected = {
    layout: "halves-stacked",
    orientation: "portrait",
    zones: { a: ITEMS[0], b: ITEMS[1] },
  };
  const { worksheet, choices } = resolveAutoLayouts(ws);
  assert.equal(worksheet, ws, "an already-concrete worksheet should come back as the same object");
  assert.deepEqual(choices, []);
});
