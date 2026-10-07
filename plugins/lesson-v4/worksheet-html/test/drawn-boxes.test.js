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

test("a gap written into a question is its answer place, so no second blank is drawn", () => {
  // 7 October 2026: a word problem's answer line was drawn at the far edge of
  // the page and its unit under the grid ("when it says answer to write down
  // and then counters, the line is miles away, it should be right next to
  // it"). Written as "___ counters" the gap printed beside its unit, and the
  // engine still added its own blank at the edge: two places for one answer.
  const unit = renderContent({ helper: "questions", items: ["How many counters are there altogether?\n___ counters"] }, 174);
  assert.match(unit, /<span class="h-blank"[^>]*><\/span> counters/);
  assert.strictEqual((unit.match(/class="h-blank"/g) || []).length, 1);
  const missing = renderContent({ helper: "questions", items: ["7 + ___ = 10"] }, 174);
  assert.strictEqual((missing.match(/class="h-blank"/g) || []).length, 1);
  // The gap is where the word goes, so no ruled line is added under it either.
  const word = renderContent({ helper: "questions", items: ["Write the word that fits. The cat ___ on the mat."] }, 174);
  assert.doesNotMatch(word, /h-q--blank-below/);
  assert.strictEqual((word.match(/class="h-blank"/g) || []).length, 1);
});

test("a question on several lines keeps its answer blank beside a short last line, not at the page edge", () => {
  const story = "There are 1,274 red counters and 2,163 blue counters in a box.\n\nHow many counters are there altogether?";
  const html = renderContent({ helper: "questions", items: [story] }, 174);
  assert.match(html, /altogether\?(<\/span>)?\s*<span class="h-blank"[^>]*><\/span>\s*<\/span>/);
  assert.strictEqual((html.match(/class="h-blank"/g) || []).length, 1);
  // A last line that runs most of the way across keeps the blank the engine adds after the words.
  const long = "Look at the chart.\nWhich of the four classes collected the greatest number of bottle tops across the whole of the autumn term?";
  const edge = renderContent({ helper: "questions", items: [long] }, 174);
  assert.match(edge, /term\?(<\/span>)?\s*<\/span>\s*<span class="h-blank"><\/span>/);
  // A last line that asks for words is not given a number's worth of room beside it.
  const words = renderContent({ helper: "questions", items: ["Tom says 5 is even.\nExplain why he is wrong."] }, 174);
  assert.match(words, /wrong\.<\/span>\s*<span class="h-blank"><\/span>/);
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

test("a unit printed on its own is given its answer line, right beside it", () => {
  // 7 October 2026: told to print "counters" beside the result, the designer
  // printed the word alone under the calculation in two goes of three, even
  // with the rule in front of it. A lone lower-case word or two is never an
  // instruction, so the page draws the line the unit belongs to.
  const unit = renderContent({ helper: "instruction", text: "counters" }, 174);
  assert.match(unit, /<span class="h-blank"[^>]*><\/span> counters/);
  assert.match(renderContent({ helper: "instruction", text: "square metres" }, 174), /h-blank/);
  // A direction, however short, is left as it is.
  for (const text of ["Use column addition.", "Tick one.", "Counters", "counters are round", "show your working"]) {
    assert.doesNotMatch(renderContent({ helper: "instruction", text }, 174), /h-blank/, text);
  }
});

test("a question whose answer line is printed with its unit further down keeps no second line beside it", () => {
  // 7 October 2026: "How many books does it have altogether?" over a column
  // frame, with "___ books" under the frame, printed a full line under the
  // question as well. One answer, one place to write it.
  const { numbered } = require("../src/worksheet");
  const zones = {
    a: {
      stack: [
        {
          question: true,
          stack: [
            { helper: "questions", items: ["How many books does it have altogether?"] },
            { helper: "column-method-grid", operator: "+", top: 7304, bottom: 205 },
            { helper: "instruction", text: "___ books" },
          ],
        },
        { question: true, stack: [{ helper: "questions", items: ["How many pencils are left?"] }] },
      ],
    },
  };
  const [withUnit, plain] = numbered(zones).a.stack;
  assert.strictEqual((renderContent(withUnit.stack[0], 174).match(/class="h-blank"/g) || []).length, 0);
  assert.strictEqual((renderContent(plain.stack[0], 174).match(/class="h-blank"/g) || []).length, 1);
});
