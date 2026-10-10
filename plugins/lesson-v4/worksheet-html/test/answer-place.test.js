"use strict";

// A pencil sheet with nowhere to answer, and one line height for a year group.
// Both came out of the stress test of 7 October 2026 and the teacher's rulings
// on its pages (9 October 2026).

const test = require("node:test");
const assert = require("node:assert/strict");

const { answerPlaceProblems, withAnswersInBooks } = require("../src/answer-place");
const { renderSheet } = require("../src/render");
const { sheetsOf, resolveAutoLayouts } = require("../src/worksheet");
const { renderHelper } = require("../src/helpers");
const { WRITING_LINE_MM } = require("../src/tokens");

const RIVER =
  "Draw your own river, from its source to its mouth.\nLabel all six features.";

const matchUp = {
  helper: "match-up",
  question: true,
  text: "Draw a line from each river feature to what it is.",
  left: [{ label: "source" }, { label: "mouth" }],
  right: [{ label: "where a river begins" }, { label: "where a river ends" }],
};

function riverSheet(second, recording = "sheet") {
  return {
    meta: { yearGroup: 4 },
    sheets: {
      greaterDepth: {
        recording,
        recordingReason: "Q1: the child draws lines between printed boxes.",
        layout: "auto",
        zones: [{ stack: [matchUp, second] }],
      },
    },
    answerKey: {
      greaterDepth: [
        { question: 1, answer: "source: where a river begins" },
        { question: 2, answer: "A river with all six features." },
      ],
    },
  };
}

const switchedOff = { helper: "questions", question: true, answerBlank: false, items: [RIVER] };

function pages(worksheet) {
  const { worksheet: resolved } = resolveAutoLayouts(JSON.parse(JSON.stringify(worksheet)));
  return sheetsOf(resolved).map((sheet) => renderSheet(sheet.spec)).join("\n");
}

const body = (html) => html.replace(/<style[\s\S]*?<\/style>/g, " ");

test("a pencil sheet's question with its answer space switched off and nothing in its place is named", () => {
  const problems = answerPlaceProblems(riverSheet(switchedOff));
  assert.equal(problems.length, 1);
  assert.equal(problems[0].signal, "NOWHERE_TO_ANSWER");
  assert.equal(problems[0].sheet, "greaterDepth");
  assert.match(problems[0].message, /Draw your own river/);
  // The teacher's ruling travels with the refusal: the book first, a box when
  // the book will not do.
  assert.match(problems[0].message, /"answerInBook": true/);
  assert.match(problems[0].message, /drawing-space box is for when the book will not do/);
});

test("a question that has a place to answer is left alone, wherever the place is", () => {
  const fine = [
    // the engine's own blank
    { helper: "questions", question: true, items: [RIVER] },
    // a box, as the Expected sheet had
    { helper: "drawing-space", question: true, text: RIVER, heightMm: 80 },
    // the book, said on the page
    { helper: "questions", question: true, answerInBook: true, items: [RIVER] },
    // a blank in the question's own words
    { helper: "questions", question: true, answerBlank: false, items: ["The river starts at the ___."] },
    // the answer is a mark on the figure in the same question
    {
      question: true,
      stack: [
        { helper: "questions", answerBlank: false, items: ["Shade the bar that shows the longest river."] },
        { helper: "bar-chart", title: "Rivers", bars: [{ label: "A", value: 3 }, { label: "B", value: 5 }] },
      ],
    },
    // the answer's line is printed further down with its unit
    {
      question: true,
      stack: [
        { helper: "questions", answerBlank: false, items: ["How long is the river?"] },
        { helper: "instruction", text: "___ km" },
      ],
    },
  ];
  for (const second of fine) {
    assert.deepEqual(answerPlaceProblems(riverSheet(second)), [], JSON.stringify(second).slice(0, 80));
  }
});

test("a books sheet is never asked: its questions are answered in the book already", () => {
  assert.deepEqual(answerPlaceProblems(riverSheet(switchedOff, "books")), []);
});

test("a question that reaches the build with nowhere to answer is printed, and sent to the book", () => {
  const { worksheet, changed } = withAnswersInBooks(riverSheet(switchedOff));
  assert.equal(changed.length, 1);
  assert.equal(changed[0].sheet, "greaterDepth");
  assert.deepEqual(answerPlaceProblems(worksheet), [], "the mended sheet passes the check that named it");

  const html = body(pages(worksheet));
  assert.match(html, /Draw your own river/);
  assert.match(html, /class="h-questions-book/);
  assert.match(html, /Write your answer in your book\./);

  // And a sheet with nothing wrong comes back untouched.
  const sound = riverSheet({ helper: "questions", question: true, items: [RIVER] });
  const again = withAnswersInBooks(sound);
  assert.equal(again.worksheet, sound);
  assert.deepEqual(again.changed, []);
});

test("a set of questions sent to the book costs its note, and prints no blank", () => {
  const { measureContent } = require("../src/helpers");
  const off = { helper: "questions", answerBlank: false, items: [RIVER] };
  const book = { helper: "questions", answerInBook: true, items: [RIVER] };
  assert.ok(measureContent(book, 150) > measureContent(off, 150), "the note is counted in the height");
  const html = renderHelper(book, 150);
  assert.ok(!html.includes('class="h-blank"'));
  assert.match(html, /Write your answer in your book\./);
});

// ─── one line height for a year group ────────────────────────────────────

const WRITERS = [
  { helper: "written-answers", items: [{ text: "Explain how you know.", lines: 3 }] },
  { helper: "writing-frame", text: "What I think", starters: [{ text: "I think", lines: 2 }] },
  { helper: "named-claim", name: "Mia", says: "A longer phrase always tells you more.", lines: 3 },
  {
    helper: "speech-scene",
    turns: [{ name: "Tom", says: "Rivers start at the sea." }, { name: "You", lines: 2 }],
  },
];

function lineHeights(html) {
  return [...body(html).matchAll(/class="h-(?:wf-|claim-|speech-)?line" style="height:([0-9.]+)mm/g)].map(
    (m) => Number(m[1])
  );
}

test("every line a child writes a sentence on is the year group's height, whatever it is under", () => {
  for (const [yearGroup, phase] of [[2, "lower"], [3, "lower"], [4, "upper"], [6, "upper"]]) {
    const worksheet = {
      meta: { yearGroup },
      sheets: {
        expected: {
          recording: "sheet",
          recordingReason: "the child writes on the printed lines",
          layout: "auto",
          zones: WRITERS.map((w) => ({ ...w })),
        },
      },
      answerKey: { expected: [] },
    };
    const heights = lineHeights(pages(worksheet));
    assert.ok(heights.length >= 10, `Year ${yearGroup}: only ${heights.length} ruled lines found`);
    assert.deepEqual(
      [...new Set(heights)],
      [WRITING_LINE_MM[phase]],
      `Year ${yearGroup} printed ruled lines at ${[...new Set(heights)].join(", ")}mm`
    );
  }
});

test("nothing lets a ruled line stretch into spare room or shrink to make room", () => {
  const html = pages({
    meta: { yearGroup: 4 },
    sheets: {
      expected: {
        recording: "sheet",
        recordingReason: "the child writes on the printed lines",
        layout: "auto",
        zones: WRITERS.map((w) => ({ ...w })),
      },
    },
    answerKey: { expected: [] },
  });
  for (const rule of [
    /\.h-answers \.h-line \{ flex: none; \}/,
    /\.h-wf-line \{ flex: none; \}/,
    /\.h-speech-blank \.h-speech-line \{ flex: none; \}/,
  ]) {
    assert.match(html, rule);
  }
  assert.ok(!/class="h-(?:wf-|claim-|speech-)?line" style="[^"]*max-height:(?!8\.00mm)/.test(body(html)),
    "a line's ceiling is its own height");
  for (const name of ["written-answers", "writing-frame", "named-claim", "speech-scene"]) {
    assert.equal(require("../src/helpers").greed(name), 0, `${name} takes no spare height`);
  }
});

// ─── a help panel reads as help ──────────────────────────────────────────

test("a bank's heading prints before the line under it, so a hint is not read as a question", () => {
  // "Choose one of these people. What would they say, and why?" printed above
  // its own heading "Stuck?", and read as a question with nowhere to answer
  // (a Year 6 planning sheet, the stress test of 7 October 2026).
  const html = renderHelper(
    {
      helper: "chip-bank",
      title: "Stuck?",
      text: "Choose one of these people. What would they say, and why?",
      chips: ["a teacher", "a parent"],
    },
    110
  );
  assert.ok(html.indexOf("Stuck?") < html.indexOf("Choose one of these people"));
  assert.ok(html.indexOf("Choose one of these people") < html.indexOf("a teacher"));
});
