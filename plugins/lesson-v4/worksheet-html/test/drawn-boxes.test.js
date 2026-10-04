"use strict";

// Three small things a child's eye lands on, all from Daniel's notes of
// 4 October 2026 on three runs of five lessons.
//
// - A missing digit typed as an empty-box character ("2[]4 is divisible by 6")
//   printed smaller than a full stop is tall. It is drawn as a box now.
// - A row of answer boxes (a recording table with no column headings) printed
//   an empty heading row as a thin strip across its top.
// - In a number sentence the boxes a child writes in were shorter than the
//   orange tiles beside them.

const { test } = require("node:test");
const assert = require("node:assert");

const { renderContent } = require("../src/helpers");
const { css } = require("../src/helpers/comparing");

test("an empty-box character in a question is drawn as a box", () => {
  const html = renderContent(
    { helper: "instruction", text: "2□4 is divisible by 6. What could the missing digit be?" },
    174
  );
  assert.match(html, /2<span class="h-digit-box"><\/span>4 is divisible/);
  assert.doesNotMatch(html, /□/);
});

test("and in a written-answer question too", () => {
  const html = renderContent(
    { helper: "written-answers", items: [{ text: "Put any digit in the box: □36. Is Ali correct?", lines: 2 }] },
    174
  );
  assert.match(html, /h-digit-box/);
});

test("a table with no column headings prints no heading row", () => {
  const boxes = renderContent(
    { helper: "recording-table", columns: ["", "", "", "", ""], rows: [[null, null, null, null, null]], writing: "number" },
    174
  );
  assert.doesNotMatch(boxes, /<thead>/);
  assert.match(boxes, /<colgroup>/);
  const headed = renderContent(
    { helper: "recording-table", columns: ["Number", "3"], rows: [["84", null]], writing: ["word", "tick"] },
    174
  );
  assert.match(headed, /<thead>/);
});

test("a number sentence's write-in boxes take the height of its tiles", () => {
  assert.match(css, /\.h-ns-box \{[^}]*height: max\([^;]*var\(--ns-tile-h\)\)/);
  assert.match(css, /\.h-ns-cell \{[^}]*height: max\([^;]*var\(--ns-tile-h\)\)/);
});

test("a calculation's answer blank sits after its equals sign, not at the far end of the next line", () => {
  const html = renderContent({ helper: "questions", items: ["87 \u2212 34 =\nDraw the jumps."] }, 174);
  assert.match(html, /=\s*<span class="h-blank"[^>]*><\/span><br>Draw the jumps\./);
  assert.strictEqual((html.match(/class="h-blank"/g) || []).length, 1);
  const plain = renderContent({ helper: "questions", items: ["How many pencils are left?"] }, 174);
  assert.strictEqual((plain.match(/class="h-blank"/g) || []).length, 1);
});

test("a question that asks for words gets a full line; one that asks for a number keeps its short blank", () => {
  const words = renderContent({ helper: "questions", items: ["Write one thing that has stayed the same."] }, 174);
  assert.match(words, /h-q--blank-below/);
  const number = renderContent({ helper: "questions", items: ["Write a number between -5 and -1."] }, 174);
  assert.doesNotMatch(number, /h-q--blank-below/);
});

test("the asking sentence is in the question colour only where a prompt also sets a scene", () => {
  const mixed = renderContent({ helper: "instruction", text: "Noah has finished his book. What is the sensible choice for Noah?" }, 174);
  assert.match(mixed, /<span class="h-ask">What is the sensible choice for Noah\?<\/span>/);
  const plain = renderContent({ helper: "instruction", text: "How many pencils does George have left?" }, 174);
  assert.doesNotMatch(plain, /h-ask/);
});

test("a tick-box question that already says what to do prints no second instruction", () => {
  const says = renderContent({ helper: "multiple-choice", text: "Which have stayed the same? Tick them.", select: "all", options: ["Skipping", "Hopscotch"] }, 174);
  assert.doesNotMatch(says, /Tick one|Tick all that apply/);
  const silent = renderContent({ helper: "multiple-choice", text: "Which game is oldest?", options: ["Skipping", "Hopscotch"] }, 174);
  assert.match(silent, /Tick one\./);
});
