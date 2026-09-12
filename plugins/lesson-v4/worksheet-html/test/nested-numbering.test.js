"use strict";

// A numbered question whose answer space is two columns printed "(1)" four
// times: once for each single-item helper inside the columns.
//
// The suppression rule was right - a single-item questions/written-answers
// helper inside a numbered question does not take its own number - but the
// traversal dropped the "inside a numbered question" flag whenever it passed
// through a container. So a helper sitting directly under the question was
// suppressed, and the identical helper one level deeper inside a `row` was
// not. Found on the Electrical Appliances Expected sheet, 30 August 2026.

const { test } = require("node:test");
const assert = require("node:assert");

const { numbered } = require("../src/worksheet");

// The printed labels, read off the numbering pass the builder itself runs.
function labelsOf(zones) {
  const out = [];
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    if (node.number !== undefined) out.push(String(node.number));
    if (node.startAt !== undefined && Array.isArray(node.items)) {
      for (let i = 0; i < node.items.length; i += 1) out.push(String(node.startAt + i));
      return;
    }
    Object.values(node).forEach(walk);
  };
  walk(numbered(zones));
  return out;
}

// Every inner number the sheet would print, so a suppressed one cannot hide.
function innerRuns(zones) {
  let runs = 0;
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    if ((node.helper === "questions" || node.helper === "written-answers") &&
        node.showNumbers !== false && node.startAt === undefined) runs += 1;
    Object.values(node).forEach(walk);
  };
  walk(numbered(zones));
  return runs;
}

// One question: a prompt, a shared line, then a two-column recording surface
// where each column holds a single-item name field and a single-item written
// answer. That is ONE numbered question, whatever its internal shape.
function twoColumnQuestion() {
  return {
    a: {
      question: true,
      stack: [
        { helper: "instruction", text: "Name one of each and explain." },
        { helper: "questions", items: ["The job:"] },
        {
          row: [
            {
              stack: [
                { helper: "questions", text: "Electrical appliance", items: ["Name:"] },
                {
                  helper: "written-answers",
                  items: [{ text: "What makes it work:", lines: 2 }],
                },
              ],
            },
            {
              stack: [
                { helper: "questions", text: "Non-electrical object", items: ["Name:"] },
                {
                  helper: "written-answers",
                  items: [{ text: "What makes it work:", lines: 2 }],
                },
              ],
            },
          ],
        },
      ],
    },
  };
}

test("a question with a two-column answer surface takes exactly one number", () => {
  assert.deepStrictEqual(labelsOf(twoColumnQuestion()), ["1"]);
});

test("nesting depth does not change the numbering", () => {
  const shallow = {
    a: {
      question: true,
      stack: [{ helper: "questions", items: ["Name:"] }],
    },
  };
  const deep = {
    a: {
      question: true,
      stack: [{ row: [{ stack: [{ helper: "questions", items: ["Name:"] }] }] }],
    },
  };
  assert.deepStrictEqual(labelsOf(shallow), labelsOf(deep));
  assert.deepStrictEqual(labelsOf(deep), ["1"]);
});

test("a helper owning several items still takes its own run, however deep", () => {
  // The rule it must not break: a SET of questions numbers each of its items.
  const zones = {
    a: {
      stack: [
        {
          row: [
            {
              helper: "questions",
              question: true,
              items: ["First?", "Second?", "Third?"],
            },
          ],
        },
      ],
    },
  };
  assert.deepStrictEqual(labelsOf(zones), ["1", "2", "3"]);
});

test("questions after a nested one keep counting from the right place", () => {
  const zones = {
    a: twoColumnQuestion().a,
    b: { question: true, stack: [{ helper: "questions", items: ["And this?"] }] },
  };
  assert.deepStrictEqual(labelsOf(zones), ["1", "2"]);
});

test("no inner helper prints a stray number inside the question", () => {
  // The user-visible fault: four "(1)" labels scattered through question 2.
  assert.strictEqual(innerRuns(twoColumnQuestion()), 0);
});

// ─── an unmarked set still prints, so it still has to be counted ─────────
//
// A history sheet came out numbered (1) (1) (2) (1) (2) (3): two different
// questions both called (1), and a child asked to answer "question 1" with no
// way to know which. The specs had `questions` helpers written without
// `question: true`, so the numbering pass walked straight past them - and the
// helper printed anyway, from its own 1. The flag never controlled whether
// numbers appeared, only whether they were right.
//
// Found on the Continuity and change Below sheet, 4 September 2026.

test("a set nobody marked as a question is still numbered from the sheet's count", () => {
  const zones = {
    a: {
      stack: [
        { helper: "multiple-choice", question: true, text: "Tick one.", options: ["a", "b"] },
        { helper: "questions", items: ["Finish this sentence:"] },
      ],
    },
    b: {
      stack: [
        { helper: "instruction", question: true, text: "Look at Source B." },
        { helper: "questions", items: ["A continuity is...", "A change is..."] },
        { helper: "instruction", question: true, text: "Choose a source." },
      ],
    },
  };
  assert.deepStrictEqual(labelsOf(zones), ["1", "2", "3", "4", "5", "6"]);
});

test("no set is left printing its own numbers outside the count", () => {
  const zones = {
    a: { stack: [{ helper: "questions", items: ["One?", "Two?"] }] },
    b: { stack: [{ helper: "written-answers", items: [{ text: "Why?", sentences: 1 }] }] },
  };
  assert.strictEqual(innerRuns(zones), 0);
  assert.deepStrictEqual(labelsOf(zones), ["1", "2", "3"]);
});

test("a list that says it is not questions takes no numbers at all", () => {
  // `showNumbers: false` is how a spec says a list is named slots rather than
  // questions. Counting those would demand answers for things nobody asked.
  const zones = {
    a: {
      question: true,
      stack: [
        { helper: "instruction", text: "Fill in the label." },
        { helper: "questions", items: ["Name:", "Date:"], showNumbers: false },
      ],
    },
  };
  assert.deepStrictEqual(labelsOf(zones), ["1"]);
});

// ─── a picture and its one question take the number together ────────────
//
// A Year 4 Reasoning block was a number line and then the question about it,
// with the flag on the question. "(5)" printed under the line, and the line
// above it read as the end of question 4 (13 September 2026).

function numberOfFirstStack(zones) {
  return numbered(zones).a.stack[1];
}

test("the number moves up to cover the picture its one question is about", () => {
  const zones = {
    a: {
      stack: [
        { helper: "section-label", text: "Reasoning" },
        {
          stack: [
            { helper: "number-line", start: 0, end: 10, boxes: [5] },
            { helper: "written-answers", question: true, items: [{ text: "Why?", sentences: 2 }] },
          ],
        },
      ],
    },
  };
  const block = numberOfFirstStack(zones);
  assert.strictEqual(block.number, 1);
  assert.strictEqual(block.stack[1].number, undefined);
  assert.strictEqual(block.stack[1].showNumbers, false);
  assert.deepStrictEqual(labelsOf(zones), ["1"]);
});

test("a grouped Part keeps its letter when its number moves up", () => {
  const zones = {
    a: {
      stack: [
        { helper: "instruction", text: "Look at the line." },
        {
          stack: [
            { helper: "number-line", start: 0, end: 10 },
            { helper: "instruction", question: true, questionGroupId: "g", text: "Complete it." },
          ],
        },
        { question: true, questionGroupId: "g", stack: [{ helper: "written-answers", items: [{ text: "Why?", sentences: 1 }] }] },
      ],
    },
  };
  assert.deepStrictEqual(labelsOf(zones), ["1a", "1b"]);
  assert.strictEqual(numberOfFirstStack(zones).number, "1a");
});

test("the number stays put when the stack is not one question", () => {
  // Two questions in one stack, and a heading in front of a question, are
  // both left exactly where the designer put the flags.
  const two = {
    a: {
      stack: [
        { helper: "number-line", start: 0, end: 10 },
        { helper: "instruction", question: true, text: "First." },
        { helper: "instruction", question: true, text: "Second." },
      ],
    },
  };
  const out = numbered(two).a;
  assert.strictEqual(out.number, undefined);
  assert.strictEqual(out.stack[1].number, 1);

  const headed = {
    a: {
      stack: [
        { helper: "section-label", text: "Fluency" },
        { helper: "number-line", question: true, start: 0, end: 10 },
      ],
    },
  };
  const kept = numbered(headed).a;
  assert.strictEqual(kept.number, undefined);
  assert.strictEqual(kept.stack[1].number, 1);
});

test("a source followed by a set of questions keeps the set's own run", () => {
  const zones = {
    a: {
      stack: [
        { helper: "source-text", paragraphs: ["We walked north."] },
        { helper: "questions", question: true, items: ["Which way?", "How far?"] },
      ],
    },
  };
  assert.strictEqual(numbered(zones).a.number, undefined);
  assert.deepStrictEqual(labelsOf(zones), ["1", "2"]);
});
