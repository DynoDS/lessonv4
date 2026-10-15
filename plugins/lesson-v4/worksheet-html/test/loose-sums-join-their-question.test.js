"use strict";

// A sum left loose above a question is part of that question.
//
// A Year 4 Greater Depth slip printed "2,438 + 1,366 =" and "2,431 + 1,366 ="
// each on its own ruled row, with no number, above Noah's claim; "(2)" sat
// three rows lower beside "Is Noah correct?" (stress test of 7 October 2026,
// round two). The plan had said the sums come before the claim; the designer
// set them as loose lines and nothing tied them to question 2. Daniel's ruling
// (14 October 2026): the number at the top, then the sums, then Noah, then the
// question; and the same for question 1, its missing-digit sum under "(1a)".
//
// A sum is something to work, not context to read, so the number stays beside
// it rather than moving down to the asking line (his 5 October rule moves the
// number past context, a picture or a scene, to the sentence that asks).

const { test } = require("node:test");
const assert = require("node:assert");

const { numbered } = require("../src/worksheet");

const SUM_A = { helper: "instruction", text: "2,438 + 1,366 =" };
const SUM_B = { helper: "instruction", text: "2,431 + 1,366 =" };
const NOAH = {
  question: true,
  helper: "named-claim",
  text: "",
  speaker: "Noah",
  says: "If the two digits in Tens add to 9, I always need an exchange in Tens.",
  ask: "Is Noah correct? Explain your answer.",
};

test("loose sums above a question join it, under its number at the top", () => {
  const out = numbered({ a: { stack: [{ helper: "section-label", text: "Going Deeper" }, SUM_A, SUM_B, NOAH] } }).a;
  assert.strictEqual(out.stack.length, 2);
  const q = out.stack[1];
  assert.strictEqual(q.number, 1);
  assert.deepStrictEqual(q.stack.map((p) => p.helper), ["instruction", "instruction", "named-claim"]);
  assert.strictEqual(q.numberAt, 0);
  assert.strictEqual(q.numberStaysAtSum, true);
  assert.ok(!q.stack[2].question);
});

test("the page leaves a number beside its sum, past the claim's own asking line", () => {
  const { PLACE_QUESTION_NUMBERS } = require("../src/chrome");
  const { renderContent } = require("../src/helpers");
  assert.match(PLACE_QUESTION_NUMBERS, /data-number-here="sum"/);
  const q = numbered({ a: { stack: [{ helper: "section-label", text: "Going Deeper" }, SUM_A, NOAH] } }).a.stack[1];
  assert.match(renderContent(q, 120), /data-number-here="sum"><p class="h-instruction">2,438 \+ 1,366 =/);
});

test("a missing-digit sum joins the first Part of a group", () => {
  const out = numbered({ a: { stack: [
    { helper: "named-claim", text: "", speaker: "Maya", says: "I put the same digit in both boxes." },
    { helper: "inequality-with-boxes", expression: "2,4□8 + 1,3□6 =" },
    { question: true, questionGroupId: "g", helper: "questions", items: ["What could her digit be?"] },
    { question: true, questionGroupId: "g", helper: "written-answers", items: [{ text: "Explain how you know.", sentences: 2 }] },
  ] } }).a;
  assert.strictEqual(out.stack.length, 3);
  assert.strictEqual(out.stack[0].helper, "named-claim");
  assert.strictEqual(out.stack[1].number, "1a");
  assert.deepStrictEqual(out.stack[1].stack.map((p) => p.helper), ["inequality-with-boxes", "questions"]);
  assert.strictEqual(out.stack[2].number, "1b");
});

test("words are not a sum, and a sum with no question after it stays where it is", () => {
  const scene = { helper: "instruction", text: "There are 1,236 story books." };
  const kept = numbered({ a: { stack: [scene, NOAH] } }).a;
  assert.strictEqual(kept.numberAt, 1); // the existing picture-then-question rule
  const lone = numbered({ a: { stack: [NOAH, SUM_A] } }).a;
  assert.strictEqual(lone.stack.length, 2);
  assert.strictEqual(lone.stack[1].helper, "instruction");
});

test("a sum before a set of several questions is shared material and stays loose", () => {
  const out = numbered({ a: { stack: [SUM_A, { question: true, helper: "questions", items: ["One?", "Two?"] }] } }).a;
  assert.strictEqual(out.stack.length, 2);
  assert.strictEqual(out.stack[0].helper, "instruction");
});
