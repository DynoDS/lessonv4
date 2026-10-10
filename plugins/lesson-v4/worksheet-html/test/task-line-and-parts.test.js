"use strict";

// A task set out the way the teacher set one out himself (9 October 2026, on
// a Year 2 noun phrase sheet from the stress test of 7 October): one short
// instruction with its rules as points, the parts of a question together, and
// a short answer on the line beside its prompt when it fits there.

const test = require("node:test");
const assert = require("node:assert/strict");

const { renderHelper, measureContent } = require("../src/helpers");
const { sheetsOf, resolveAutoLayouts } = require("../src/worksheet");
const { splitQuestionProblems } = require("../src/parts-together");

const body = (html) => html.replace(/<style[\s\S]*?<\/style>/g, " ");

// ─── rules under an instruction ──────────────────────────────────────────

const TASK =
  "Write an expanded noun phrase for each noun below.\n- Use two adjectives each time.\n- Use each adjective only once.";

test("a task's rules print as points under its direction, without the mark they were written with", () => {
  const html = body(renderHelper({ helper: "instruction", text: TASK }, 120));
  assert.match(html, /class="h-instruction-direction">Write an expanded noun phrase for each noun below\.<\/p>/);
  assert.equal((html.match(/<li>/g) || []).length, 2);
  assert.match(html, /<li>Use two adjectives each time\.<\/li>/);
  assert.ok(!html.includes("- Use"), "the mark is how a rule is written, not what a child reads");
});

test("rules cost their own lines, and a rule that wraps is counted at its indented width", () => {
  const plain = measureContent({ helper: "instruction", text: "Write an expanded noun phrase for each noun below." }, 120);
  const ruled = measureContent({ helper: "instruction", text: TASK }, 120);
  assert.ok(ruled > plain * 2.5, `three lines measured ${ruled}mm against one at ${plain}mm`);
  assert.ok(
    measureContent({ helper: "instruction", text: TASK }, 45) > ruled,
    "a narrower column wraps the rules and is taller"
  );
});

test("an instruction with no rules is drawn exactly as it always was", () => {
  const html = body(renderHelper({ helper: "instruction", text: "Use the place value chart to help you." }, 120));
  assert.match(html, /^\s*<p class="h-instruction">Use the place value chart to help you\.<\/p>\s*$/);
});

test("rules are few, come after their direction, and are never a way to print a method", () => {
  const four = "Write a sentence.\n- One.\n- Two.\n- Three.\n- Four.";
  assert.throws(() => renderHelper({ helper: "instruction", text: four }, 120), /INSTRUCTION_IS_A_LIST/);
  assert.throws(
    () => renderHelper({ helper: "instruction", text: "- Use two adjectives." }, 120),
    /INSTRUCTION_RULES_MISPLACED/
  );
  assert.throws(
    () => renderHelper({ helper: "instruction", text: "Write a phrase.\n- Use two adjectives.\nThen read it." }, 120),
    /INSTRUCTION_RULES_MISPLACED/
  );
  // Three plain lines are still the list they always were.
  assert.throws(
    () => renderHelper({ helper: "instruction", text: "Read the question.\nFind the tens.\nWrite the answer." }, 120),
    /INSTRUCTION_IS_A_LIST/
  );
});

// ─── the answer beside its prompt ────────────────────────────────────────

const answer = (text, extra = {}) => ({
  helper: "written-answers",
  showNumbers: false,
  phase: "lower",
  items: [{ text, lines: 1, ...extra }],
});

test("a short answer after a short prompt is written on the prompt's own line", () => {
  const beside = renderHelper(answer("sky", { answerLetters: 20 }), 110);
  assert.match(beside, /class="h-written-beside"/);
  assert.equal((body(beside).match(/class="h-line/g) || []).length, 1, "one line, beside the word");
  // Half the height of the same answer with its line underneath.
  assert.ok(
    measureContent(answer("sky", { answerLetters: 20 }), 110) < measureContent(answer("sky"), 110) - 5
  );
});

test("the line goes underneath when the answer would not fit beside, and when nobody said how long it is", () => {
  for (const spec of [
    answer("sky"), // no length given
    answer("sky", { answerLetters: 40 }), // 180mm of writing in a 110mm column
    answer("Choose another noun from the photograph.", { answerLetters: 20 }), // not a short prompt
    { ...answer("sky", { answerLetters: 20 }), items: [{ text: "sky", lines: 2, answerLetters: 20 }] },
  ]) {
    assert.ok(!renderHelper(spec, 110).includes('class="h-written-beside"'), JSON.stringify(spec.items[0]));
  }
});

test("prompts that are all short are set out the same way, whatever their own length", () => {
  // "sky" and "clouds" in one question: sized each by its own width, one took
  // its line beside and the next took it underneath.
  const kinds = ["sky", "clouds", "grass", "tree", "hill"].map((noun) =>
    renderHelper(answer(noun, { answerLetters: 20 }), 108).includes('class="h-written-beside"')
  );
  assert.deepEqual([...new Set(kinds)], [true]);
});

test("an older child's phrase is written smaller, so more of it fits beside", () => {
  const upper = { ...answer("river", { answerLetters: 26 }), phase: "upper" };
  const lower = answer("river", { answerLetters: 26 });
  assert.ok(renderHelper(upper, 110).includes('class="h-written-beside"'));
  assert.ok(!renderHelper(lower, 110).includes('class="h-written-beside"'));
});

// ─── the parts of a question together ────────────────────────────────────

const part = (text, extra = {}) => ({
  question: true,
  questionGroupId: "qg-1",
  ...extra,
  stack: [{ helper: "written-answers", items: [{ text, lines: 1 }] }],
});
const other = { question: true, helper: "written-answers", items: [{ text: "Which phrase tells us more? Say why.", lines: 2 }] };
// A question of its own, so it is not taken as the material of part (a).
const filler = { question: true, helper: "drawing-space", text: "Draw the field.", heightMm: 110 };

function sheets(zones) {
  const worksheet = {
    meta: { yearGroup: 2 },
    sheets: {
      expected: {
        recording: "sheet",
        recordingReason: "the child writes on the printed lines",
        layout: "halves-side",
        orientation: "landscape",
        zones,
      },
    },
    answerKey: { expected: [] },
  };
  return sheetsOf(resolveAutoLayouts(worksheet).worksheet);
}

test("a question left with one part in its first column and the rest in the next is named", () => {
  const problems = splitQuestionProblems(
    sheets({
      a: { stack: [filler, part("sky", { groupPrompt: "Write a phrase for each noun." })] },
      b: { stack: [part("clouds"), part("grass"), part("tree"), other] },
    })
  );
  assert.equal(problems.length, 1);
  assert.equal(problems[0].signal, "QUESTION_SPLIT_ACROSS_COLUMNS");
  assert.match(problems[0].message, /\(2a\) in zone "a", \(2b\) \(2c\) \(2d\) in zone "b"/);
  assert.match(problems[0].message, /band-two-cols/);
});

test("a question that ran on after most of it is left alone, and so is one kept whole", () => {
  // The teacher called this one "great": three parts under the picture, the
  // last starting the next column.
  assert.deepEqual(
    splitQuestionProblems(
      sheets({
        a: { stack: [part("sky", { groupPrompt: "Write a phrase for each noun." }), part("clouds"), part("grass")] },
        b: { stack: [part("tree"), other] },
      })
    ),
    []
  );
  assert.deepEqual(
    splitQuestionProblems(
      sheets({
        a: { stack: [part("sky", { groupPrompt: "Write a phrase for each noun." }), part("clouds"), part("grass"), part("tree")] },
        b: { stack: [other] },
      })
    ),
    []
  );
});

test("a question too long for a column may run on, however it divides", () => {
  const long = (text, extra) => ({
    question: true,
    questionGroupId: "qg-1",
    ...extra,
    stack: [{ helper: "written-answers", items: [{ text, lines: 3 }] }],
  });
  const many = ["one", "two", "three", "four", "five", "six"].map((t) => long(`Explain ${t}.`));
  assert.deepEqual(
    splitQuestionProblems(
      sheets({
        a: { stack: [filler, long("Explain zero.", { groupPrompt: "Explain each one." })] },
        b: { stack: many },
      })
    ),
    []
  );
});

// ─── where a question is ruled off ───────────────────────────────────────

function drawn(stack) {
  const { renderSheet } = require("../src/render");
  const worksheet = {
    meta: { yearGroup: 2 },
    sheets: {
      expected: {
        recording: "sheet",
        recordingReason: "the child writes on the printed lines",
        layout: "full",
        orientation: "portrait",
        zones: { a: { stack } },
      },
    },
    answerKey: { expected: [] },
  };
  const [sheet] = sheetsOf(resolveAutoLayouts(worksheet).worksheet);
  return body(renderSheet(sheet.spec));
}

const rulesIn = (html) => (html.match(/h-stack-item--new-question/g) || []).length;
const frame = (text, group, extra = {}) => ({
  question: true,
  questionGroupId: group,
  ...extra,
  helper: "instruction",
  text,
  blankWidthMm: 40,
});

test("a question after a part that is a started phrase is still ruled off", () => {
  // "the ______ clouds" is an instruction helper wearing a question number.
  // Counted as a line introducing what follows, it took the next question's
  // rule and its step, and question 2 ran on from (1b).
  const html = drawn([
    frame("the ______ sky", "q1", { groupPrompt: "Write a phrase for each noun.\n- Use one adjective." }),
    frame("the ______ clouds", "q1"),
    frame("the ______, ______ sky", "q2", { groupPrompt: "Write a phrase for each noun.\n- Use two adjectives." }),
    frame("the ______, ______ clouds", "q2"),
  ]);
  assert.equal(rulesIn(html), 1, "one rule, between question 1 and question 2");
  assert.ok(
    html.indexOf("h-stack-item--new-question") > html.indexOf("clouds"),
    "and it comes after (1b), above question 2's task line"
  );
});

test("a question led into by two lines is ruled off above the first of them", () => {
  const html = drawn([
    { question: true, helper: "written-answers", items: [{ text: "Write a phrase for the sky.", lines: 1 }] },
    { helper: "instruction", text: "Sam wrote these phrases. Each one has one thing wrong." },
    frame("the blue, starry ______", "q2", { groupPrompt: "Write each phrase again so it is right." }),
    frame("the big, huge ______", "q2"),
  ]);
  assert.equal(rulesIn(html), 1);
  const rule = html.indexOf("h-stack-item--new-question");
  assert.ok(rule < html.indexOf("Sam wrote these phrases"), "the rule is above the first lead-in line");
  assert.ok(rule > html.indexOf("Write a phrase for the sky"), "and under the question before");
});

test("a number goes beside the innermost line flagged for it", () => {
  const { PLACE_QUESTION_NUMBERS } = require("../src/chrome");
  assert.match(PLACE_QUESTION_NUMBERS, /\.filter\(own\)\.pop\(\)/);
  assert.match(renderHelper(answer("sky", { answerLetters: 20 }), 110), /class="h-text" data-number-here/);
});
