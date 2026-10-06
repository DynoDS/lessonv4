"use strict";

// Four things Daniel asked about on one day's sheets (5 October 2026), each a
// place where the page said something other than what the question meant.

const { test } = require("node:test");
const assert = require("node:assert");

const { numbered, WorksheetError } = require("../src/worksheet");
const { REGISTRY } = require("../src/helpers");
const { PLACE_QUESTION_NUMBERS } = require("../src/chrome");

const PICTURE = { helper: "card-row", columns: 1, cards: [{ title: "Christingle" }] };
const TASK = { helper: "instruction", text: "Finish each sentence." };

test("a question behind its material stays one block and says where the number goes", () => {
  // "(1)" printed beside the picture's title, with the task three lines down.
  const out = numbered({ a: { stack: [PICTURE, { question: true, stack: [TASK] }] } }).a;
  assert.strictEqual(out.number, 1);
  assert.strictEqual(out.numberAt, 1);
});

test("the page moves each number down to the sentence that asks", () => {
  assert.match(PLACE_QUESTION_NUMBERS, /data-number-here/);
  assert.match(PLACE_QUESTION_NUMBERS, /\.h-ask/);
});

test("a hint says it is a hint and is never printed as a question", () => {
  const html = REGISTRY.instruction.render({ helper: "instruction", hint: true, text: "What do eight ones and two ones make?" });
  assert.match(html, /If you&#39;re stuck:|If you're stuck:/);
  assert.doesNotMatch(html, /h-ask/);
  const plain = REGISTRY.instruction.measure({ helper: "instruction", text: "What do eight ones and two ones make?" }, 60);
  const hint = REGISTRY.instruction.measure({ helper: "instruction", hint: true, text: "What do eight ones and two ones make?" }, 60);
  assert.ok(hint >= plain);
});

test("a hint put first in its question is refused", () => {
  // "(5) What do eight ones and two ones make?" over the claim to be judged.
  const zones = { a: { question: true, stack: [
    { helper: "instruction", hint: true, text: "What do eight ones and two ones make?" },
    { helper: "written-answers", items: [{ text: "Is Ava correct?", sentences: 1 }] },
  ] } };
  assert.throws(() => numbered(zones), (e) => e instanceof WorksheetError && /reads as the question itself/.test(e.message));
});

test("printed digits and the box for a missing digit are drawn as one number", () => {
  // "3,21" then a box, a gap apart, read as a decimal and then a box.
  const html = REGISTRY["number-sentence"].render({
    helper: "number-sentence",
    terms: [{ value: "3,21" }, { cells: 1 }, "+", { value: "13" }, { cells: 1 }, "="],
  });
  assert.strictEqual((html.match(/h-ns-term--joined/g) || []).length, 2);
});

test("a whole missing number keeps its own place", () => {
  const html = REGISTRY["number-sentence"].render({
    helper: "number-sentence",
    terms: [{ value: "345" }, "+", { blank: true }, "=", { value: "500" }],
  });
  assert.doesNotMatch(html, /h-ns-term--joined/);
});
