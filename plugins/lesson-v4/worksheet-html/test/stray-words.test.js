"use strict";

// No word is left alone at either end of a sentence (the teacher, 9 October
// 2026, on a sheet that printed "...in every sentence. Fix / his mistakes.").
// The first two words of a sentence that follows another are tied; the last
// line is the browser's `text-wrap: pretty`.

const { test } = require("node:test");
const assert = require("node:assert");

const { tieSentenceStarts, tieHtmlText, linesFor } = require("../src/helpers/shared");
const { renderSheet } = require("../src/render");

const NBSP = " ";

test("the first two words of a following sentence are tied", () => {
  assert.strictEqual(
    tieSentenceStarts("Check the commas in every sentence. Fix his mistakes."),
    `Check the commas in every sentence. Fix${NBSP}his mistakes.`
  );
});

test("the opening sentence, a long pair and a blank are left alone", () => {
  assert.strictEqual(tieSentenceStarts("Fix his mistakes."), "Fix his mistakes.");
  const long = "Look closely. Photosynthesis happens in leaves.";
  assert.strictEqual(tieSentenceStarts(long), long);
  const blank = "Read it. ___ the owl swooped down.";
  assert.strictEqual(tieSentenceStarts(blank), blank);
});

test("on a page only the words are tied: not a tag, a drawing or a table cell", () => {
  const html =
    '<p title="One. Two three">One. Two three</p>' +
    "<svg><text>One. Two three</text></svg>" +
    "<table><td>One. Two three</td></table>" +
    '<p><span class="h-ask">Is it right?</span> Explain why.</p>';
  assert.strictEqual(
    tieHtmlText(html),
    `<p title="One. Two three">One. Two${NBSP}three</p>` +
      "<svg><text>One. Two three</text></svg>" +
      "<table><td>One. Two three</td></table>" +
      `<p><span class="h-ask">Is it right?</span> Explain${NBSP}why.</p>`
  );
});

test("the line count sets tied words as one", () => {
  // Wide enough for everything but the last word: the pair drops together, so
  // the count is still two lines and never three.
  const text = "Check the commas in every sentence. Fix his mistakes.";
  assert.strictEqual(linesFor(text, 200), 1);
  assert.strictEqual(linesFor(text, 80), 2);
});

test("a sheet asks the browser not to leave one word on a last line", () => {
  const html = renderSheet({
    layout: "full",
    orientation: "portrait",
    title: "t",
    zones: { a: { helper: "instruction", text: "Check the commas. Fix his mistakes." } },
  });
  assert.match(html, /text-wrap:\s*pretty/);
  assert.ok(html.includes(`Fix${NBSP}his`));
});

// Not a stray word, found on the same sheet: a group of parts in a stack of
// its own, opened by an unnumbered line, is still a new question and is ruled
// off from the one above (the teacher, 9 October 2026).
test("a question group in its own stack is ruled off from the question above", () => {
  const html = renderSheet({
    layout: "full",
    orientation: "portrait",
    title: "t",
    zones: {
      a: {
        stack: [
          { number: 1, stack: [{ helper: "instruction", text: "Test each rock." }] },
          {
            stack: [
              { helper: "instruction", text: "Group the rocks." },
              { number: "2a", helper: "instruction", text: "Group them by hardness." },
              { number: "2b", helper: "instruction", text: "Group them by permeability." },
            ],
          },
        ],
      },
    },
  });
  assert.strictEqual((html.match(/h-stack-item--new-question"/g) || []).length, 1);
});

// Also found on these sheets: a short line under a drawing in a row is that
// drawing's label, and sits under its middle (the teacher, 9 October 2026:
// "the words aren't centred to the clocks").
test("a short line under a drawing in a row is centred under it", () => {
  const clock = (text) => ({
    stack: [{ helper: "clock-row", clocks: [{ hands: false }] }, { helper: "instruction", text }],
  });
  const sheet = (row) =>
    renderSheet({ layout: "full", orientation: "portrait", title: "t", zones: { a: { row } } });
  const labelled = (html) => (html.match(/h-row-item--labelled"/g) || []).length;

  assert.strictEqual(labelled(sheet([clock("quarter past 8"), clock("quarter to ___")])), 2);
  // A line that is an instruction, not a label, keeps the left edge.
  const long = "Draw the hands to show the time the bus leaves the station on Monday.";
  assert.strictEqual(labelled(sheet([clock(long), clock("quarter to 8")])), 1);
  const words = { stack: [{ helper: "instruction", text: "Look." }, { helper: "instruction", text: "quarter to 8" }] };
  assert.strictEqual(labelled(sheet([words, clock("quarter to 8")])), 1);
});
