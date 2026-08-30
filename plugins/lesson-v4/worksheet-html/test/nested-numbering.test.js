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
