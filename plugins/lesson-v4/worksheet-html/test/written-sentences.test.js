"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { renderContent, measure } = require("../src/helpers");

// `sentences` on a written-answers item states the DEMAND - how many written
// things the prompt asks for - and the engine turns it into ruled lines at
// the width the zone actually has. These tests pin the hand rule the field
// replaced, quoted in agents/worksheet-designer.md: one written thing is
// about a sentence, one line across a full page, two in a half-width column.

const ruledLines = (item, widthMm) =>
  (renderContent({ helper: "written-answers", items: [item] }, widthMm).match(/h-line\b/g) || [])
    .length;

test("the hand rule, reproduced at the zone's real width", () => {
  assert.equal(ruledLines({ text: "Explain.", sentences: 1 }, 174), 1, "one sentence, full width");
  assert.equal(ruledLines({ text: "Explain.", sentences: 2 }, 174), 2, "two sentences, full width");
  assert.equal(ruledLines({ text: "Explain.", sentences: 1 }, 84), 2, "one sentence, half column");
  assert.equal(ruledLines({ text: "Explain.", sentences: 2 }, 84), 4, "two sentences, half column");
});

test("the same demand gets more lines in a narrower zone, and the measure moves with it", () => {
  const item = { text: "Explain two ways the shadow changes.", sentences: 2 };
  assert.ok(
    ruledLines(item, 84) > ruledLines(item, 174),
    "a narrower zone should rule more lines for the same demand"
  );
  assert.ok(
    measure({ helper: "written-answers", items: [item] }, 84) >
      measure({ helper: "written-answers", items: [item] }, 174),
    "the measured height should grow with the extra lines, or the fit check lies"
  );
});

test("the cap still holds: a big demand in a narrow zone is capped, not endless", () => {
  assert.equal(
    ruledLines({ text: "Explain.", sentences: 6 }, 84),
    6,
    "six lines is the ceiling however large the demand"
  );
});

test("sentences AND lines together is refused as a contradiction", () => {
  assert.throws(
    () => renderContent({ helper: "written-answers", items: [{ text: "x", sentences: 2, lines: 3 }] }, 174),
    /WRITTEN_ANSWERS_OVERSPECIFIED/
  );
});

test("a demand that is not a whole positive number is refused", () => {
  for (const bad of [0, -1, 1.5, "two"]) {
    assert.throws(
      () => renderContent({ helper: "written-answers", items: [{ text: "x", sentences: bad }] }, 174),
      /WRITTEN_ANSWERS_SENTENCES_INVALID/,
      `sentences: ${JSON.stringify(bad)} should be refused`
    );
  }
});

test("plain `lines` behaves exactly as it always has", () => {
  assert.equal(ruledLines({ text: "x", lines: 4 }, 174), 4);
  assert.equal(ruledLines({ text: "x" }, 174), 3, "the default is still three lines");
});
