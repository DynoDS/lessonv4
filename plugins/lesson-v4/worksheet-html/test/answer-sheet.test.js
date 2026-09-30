"use strict";

// The teacher's answer sheet (4.2.305): what Daniel approved on 30 September
// 2026 was one side of A4, a column a level, each label with a short green
// answer, a few grey words only where they save a marking mistake, and a
// picture only when words cannot give the answer. Shrink before a third side,
// and never cut an answer.

const assert = require("node:assert/strict");
const test = require("node:test");
const { PDFDocument } = require("pdf-lib");

const { answerKeyOf, WorksheetError } = require("../src/worksheet");
const {
  answerSheetHtml,
  buildAnswerSheet,
  longAnswers,
  longAnswerAdvisories,
  estimatedLines,
  printedEntry,
} = require("../src/answer-sheet");
const { htmlToPdf, launchBrowser } = require("../src/chrome");
const { answersText } = require("./answer-text");

const sheet = (n) => ({
  layout: "full",
  zones: {
    a: { stack: Array.from({ length: n }, (_, i) => ({ question: true, helper: "questions", items: [`Question ${i + 1}?`] })) },
  },
});

const spec = (answerKey, levels = ["below", "expected", "greaterDepth"], count = 2) => ({
  meta: { lesson: "Place value problem solving", yearGroup: 4, subject: "maths" },
  sheets: Object.fromEntries(levels.map((name) => [name, sheet(count)])),
  answerKey,
});

const short = (count) => Array.from({ length: count }, (_, i) => ({ question: i + 1, answer: `${i + 12}` }));

test("a key entry may carry a note and a picture, and keeps both", () => {
  const w = spec({
    expected: [
      { question: 1, answer: "Smallest 4,068. Greatest 8,640.", note: "Not 0,468: zero can't go first." },
      { question: 2, answer: "4", picture: { helper: "number-line", start: 0, end: 10, interval: 1, answer: { at: 4, text: "4" } } },
    ],
  }, ["expected"]);
  const key = answerKeyOf(w);
  assert.equal(key.expected[0].note, "Not 0,468: zero can't go first.");
  assert.equal(key.expected[1].picture.helper, "number-line");
});

test("a picture that is not a worksheet helper is refused, naming the question", () => {
  const w = spec({ expected: [{ question: 1, answer: "12" }, { question: 2, answer: "13", picture: { helper: "sketch" } }] }, ["expected"]);
  assert.throws(
    () => answerKeyOf(w),
    (e) => e instanceof WorksheetError && e.signal === "ANSWER_PICTURE_UNKNOWN" && /\(2\)/.test(e.message)
  );
});

test("an old key's extra lines print as notes, without the Acceptance lead", () => {
  const entry = printedEntry({
    question: "2b",
    answer: "3,057\nAcceptance: 0,357 or 357 means the zero went first.",
  });
  assert.equal(entry.answer, "3,057");
  assert.deepEqual(entry.notes, ["0,357 or 357 means the zero went first."]);
});

test("the page holds each level's label, green answer and grey note", () => {
  const w = spec({
    below: [{ question: 1, answer: "12", note: "Not 21." }, { question: 2, answer: "13" }],
    expected: short(2),
    greaterDepth: short(2),
  });
  const { html, problems } = answerSheetHtml(w, answerKeyOf(w));
  assert.deepEqual(problems, []);
  assert.match(html, /#00B050/i);
  const text = answersText(html);
  assert.match(text, /^BELOW \(B\)\n\(1\) 12\nNot 21\.\n\(2\) 13\n/m);
  assert.match(text, /^GREATER DEPTH \(GD\)$/m);
});

test("one level alone carries no code", () => {
  const w = spec({ expected: short(2) }, ["expected"]);
  const text = answersText(answerSheetHtml(w, answerKeyOf(w)).html);
  assert.match(text, /^EXPECTED$/m);
});

test("a picture that cannot be drawn at column width leaves its answer as words and says so", () => {
  const w = spec({
    expected: [
      { question: 1, answer: "12" },
      { question: 2, answer: "4,068", picture: { helper: "place-value-chart", columns: ["M", "HTh", "TTh", "Th", "H", "T", "O"], rows: [{ label: "Smallest", cells: ["", "", "", "", "", "", ""] }] } },
    ],
  }, ["expected"]);
  const { html, problems } = answerSheetHtml(w, answerKeyOf(w));
  assert.match(answersText(html), /\(2\) 4,068/);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^ANSWER_PICTURE_SKIPPED: Expected \(2\) prints its answer as words/);
});

test("an answer written as a model paragraph is named; a short one is not", () => {
  const paragraph =
    "Model: The number has to be between 7,500 and 8,500. If it starts with 7, the hundreds card has to be 5 or 8, " +
    "so it's past 7,500. If it starts with 8, the hundreds card has to be 0, so it's not past 8,500.";
  const w = spec({ expected: [{ question: 1, answer: "9,642" }, { question: 2, answer: paragraph }] }, ["expected"]);
  const found = longAnswers(answerKeyOf(w));
  assert.deepEqual(found.map((f) => f.question), ["2"]);
  assert.match(longAnswerAdvisories(answerKeyOf(w))[0], /^ANSWER_LONG: Expected \(2\) prints about \d+ lines/);
  // The approved mock-up's reasoning answer is within two lines.
  assert.ok(estimatedLines("Yes. 0 can't go first, so 2 does: 2,058.") <= 2);
});

test("three short keys print on one side", async () => {
  const w = spec({ below: short(8), expected: short(8), greaterDepth: short(8) }, undefined, 8);
  const browser = await launchBrowser();
  try {
    const built = await buildAnswerSheet({ worksheet: w, answerKey: answerKeyOf(w), browser, htmlToPdf });
    assert.equal(built.sides, 1);
    assert.equal(built.size, "normal");
    const doc = await PDFDocument.load(built.pdf);
    assert.equal(doc.getPage(0).getWidth() > doc.getPage(0).getHeight(), true, "the page is landscape");
  } finally {
    await browser.close();
  }
});

test("a long pack shrinks its text before it is allowed a third side, and never loses an answer", async () => {
  // Enough answers to run past two sides at the normal size and fit two at
  // the small one: the floor comes first.
  const many = (n) => Array.from({ length: n }, (_, i) => ({ question: i + 1, answer: `The answer is ${i + 100}, because the tens digit decides it.` }));
  const w = spec({ below: many(24), expected: many(24), greaterDepth: many(24) }, undefined, 24);
  const browser = await launchBrowser();
  try {
    const built = await buildAnswerSheet({ worksheet: w, answerKey: answerKeyOf(w), browser, htmlToPdf });
    assert.equal(built.size, "small", "the text stepped down");
    assert.ok(built.sides <= 2, `still ${built.sides} sides`);
    const text = answersText(built.html);
    assert.equal((text.match(/^\(\d+\) The answer is/gm) || []).length, 72, "every answer printed");

    const huge = spec({ below: many(80), expected: many(80), greaterDepth: many(80) }, undefined, 80);
    const over = await buildAnswerSheet({ worksheet: huge, answerKey: answerKeyOf(huge), browser, htmlToPdf });
    assert.ok(over.sides > 2);
    assert.match(over.problems.join("\n"), /^ANSWERS_THIRD_SIDE: the answer sheet runs to \d+ sides/m);
    assert.equal((answersText(over.html).match(/^\(\d+\) The answer is/gm) || []).length, 240);
  } finally {
    await browser.close();
  }
});
