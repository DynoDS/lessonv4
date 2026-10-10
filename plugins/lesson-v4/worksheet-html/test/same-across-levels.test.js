"use strict";

// The same piece, drawn the same way on every level.
//
// The stress test of 7 October 2026 found one piece drawn differently across
// the three levels in 5 of 20 lessons: the same extended question with ten
// boxed lines on Expected and six unboxed on Greater Depth, the same two-line
// conclusion with its lines 7.8mm apart on one level and 18.7mm on the next,
// the same question black on Below and blue on the others. Each level is
// written on its own, so the engine settles these itself. The teacher's
// rulings, 9 October 2026, are quoted where each is tested.

const test = require("node:test");
const assert = require("node:assert/strict");

const { sheetsOf, resolveAutoLayouts } = require("../src/worksheet");
const { renderSheet } = require("../src/render");
const { measure, renderHelper, renderContent, enough } = require("../src/helpers");
const { sameQuestionProblems } = require("../src/across-levels");
const { BOOK_NOTE, BOOK_FROM_LINES } = require("../src/helpers/in-book");

const QUESTION = "Which city-state would you rather have lived in, and why?";
const table = {
  question: true,
  stack: [
    { helper: "instruction", text: "What was life like in each city? Write a few words in every box." },
    {
      helper: "recording-table",
      columns: ["", "Athens", "Sparta"],
      writing: ["word", "word", "word"],
      rows: [["Government"], ["Education"]],
    },
  ],
};
const longAnswer = (response) => ({
  question: true,
  stack: [{ helper: "instruction", text: QUESTION }, response],
});
const sheet = (recording, zones) => ({
  recording,
  recordingReason: "test",
  layout: "auto",
  orientation: "portrait",
  zones: [{ stack: zones }],
});
const pack = (sheets) => ({ meta: { yearGroup: 5 }, sheets });
const drawn = (worksheet, key) => {
  const resolved = resolveAutoLayouts(worksheet).worksheet;
  const found = sheetsOf(resolved).find((s) => s.key === key);
  return { spec: found.spec, html: renderSheet(found.spec) };
};
const body = (html) => html.slice(html.indexOf("<body"));

// ─── a long answer goes in the book ──────────────────────────────────────
// "For a task like that, it shouldn't have a box to write in because they can
// write in their books."

test("on a printed sheet a long answer prints its question and no lines, however it was written", () => {
  const worksheet = pack({
    expected: sheet("sheet", [
      table,
      longAnswer({ helper: "writing-frame", shape: "plain", starters: [{ text: "", lines: 10 }] }),
    ]),
    greaterDepth: sheet("sheet", [
      table,
      longAnswer({ helper: "written-answers", showNumbers: false, items: [{ text: "", lines: 6 }] }),
    ]),
  });
  for (const key of ["expected", "greaterDepth"]) {
    const page = body(drawn(worksheet, key).html);
    assert.ok(page.includes(QUESTION), `${key}: the question is printed`);
    assert.ok(page.includes(BOOK_NOTE), `${key}: and says where the answer goes`);
    assert.ok(!page.includes('class="h-line"'), `${key}: no ruled lines`);
    assert.ok(!page.includes('class="h-wf-line"'), `${key}: no ruled lines in a frame`);
    assert.ok(!page.includes("h-wf-outline"), `${key}: and no box`);
  }
});

test("a short answer keeps its lines on the sheet", () => {
  const worksheet = pack({
    expected: sheet("sheet", [
      table,
      longAnswer({
        helper: "written-answers",
        showNumbers: false,
        items: [{ text: "", lines: BOOK_FROM_LINES - 1 }],
      }),
    ]),
  });
  const page = body(drawn(worksheet, "expected").html);
  assert.ok(!page.includes(BOOK_NOTE));
  assert.equal(page.split('class="h-line"').length - 1, BOOK_FROM_LINES - 1);
});

test("a books sheet is untouched: it prints as slips, which carry no lines already", () => {
  const worksheet = pack({
    expected: sheet("books", [
      longAnswer({ helper: "written-answers", showNumbers: false, items: [{ text: "", lines: 6 }] }),
    ]),
  });
  const page = body(drawn(worksheet, "expected").html);
  assert.ok(!page.includes(BOOK_NOTE), "no note: the whole sheet is the book's");
});

test("a frame's starters stay when its answer goes in the book, and a planner part keeps its lines", () => {
  const scaffold = {
    helper: "writing-frame",
    longInBook: true,
    starters: [
      { text: "I would rather have lived in ...", lines: 2 },
      { text: "I chose it because ...", lines: 2 },
    ],
  };
  const html = renderHelper(scaffold, 120);
  assert.ok(html.includes("I chose it because"), "the support is still printed");
  assert.ok(html.includes(BOOK_NOTE));
  assert.ok(!html.includes('class="h-wf-line"'), "with no lines under it");

  const plannerPart = {
    helper: "writing-frame",
    longInBook: true,
    text: "Conclusion: what I think",
    starters: [{ text: "", lines: 4 }],
  };
  const part = renderHelper(plannerPart, 120);
  assert.ok(!part.includes(BOOK_NOTE), "a named part of a planner is written on the sheet");
  assert.equal(part.split('class="h-wf-line"').length - 1, 4);
  assert.ok(part.includes("h-wf-outline"), "and keeps its box");
});

test("the price of a book answer is the note, not the lines it replaced", () => {
  const lined = { helper: "written-answers", showNumbers: false, items: [{ text: QUESTION, lines: 6 }] };
  const inBook = { ...lined, longInBook: true };
  assert.ok(measure(inBook, 170) < measure(lined, 170) - 25);
  assert.equal(enough(inBook, 170), measure(inBook, 170), "and nothing in it grows");
});

// "As long as the book icon and pencil icon is clear next to what is what."
test("a sheet holding both kinds of answer marks every numbered question", () => {
  const worksheet = pack({
    expected: sheet("sheet", [
      table,
      longAnswer({ helper: "written-answers", showNumbers: false, items: [{ text: "", lines: 6 }] }),
    ]),
  });
  const page = body(drawn(worksheet, "expected").html);
  assert.equal(page.split("h-numbered h-numbered--pencil").length - 1, 1, "the table: pencil");
  assert.equal(page.split("h-numbered h-numbered--book").length - 1, 1, "the long answer: book");

  const allOnSheet = pack({ expected: sheet("sheet", [table]) });
  const plain = body(drawn(allOnSheet, "expected").html);
  assert.ok(!plain.includes("h-numbered--"), "a sheet with no book answer carries no marks");
});

// ─── lines to write on carry no box ──────────────────────────────────────
// "If it had to, I like it with no box."

test("a frame that is only ruled lines is drawn as only ruled lines", () => {
  const bare = { helper: "writing-frame", shape: "plain", starters: [{ text: "", lines: 2 }] };
  const html = renderHelper(bare, 120);
  assert.ok(!html.includes("h-wf-outline"), "no outline");
  assert.equal(html.split('class="h-wf-line"').length - 1, 2);

  const withStarter = { helper: "writing-frame", starters: [{ text: "I think ... because ...", lines: 2 }] };
  assert.ok(renderHelper(withStarter, 120).includes("h-wf-outline"), "a starter keeps its frame");
});

// ─── lines are always the same distance apart ────────────────────────────

test("a frame beside something taller does not spread its lines to match", () => {
  const frame = { helper: "writing-frame", text: "Conclusion: what I think", starters: [{ text: "", lines: 2 }] };
  const html = renderHelper(frame, 116);
  const cap = /class="h-wf h-wf-plain" style="max-height:([\d.]+)mm"/.exec(html);
  assert.ok(cap, "the frame states where it stops");
  assert.ok(Number(cap[1]) <= enough(frame, 116) + 2.01, "at its own useful height");
  const line = /class="h-wf-line" style="height:([\d.]+)mm;max-height:([\d.]+)mm"/.exec(html);
  assert.ok(line, "and so does each line");
  assert.ok(Number(line[2]) <= Number(line[1]) * 1.5 + 0.01, "half again its height, as a written answer's");
});

// ─── blue only when there is an instruction ──────────────────────────────
// "Only blue when instruction."

const ASK = "Why is Diwali called the festival of light?";
const TELL = "Finish each sentence. Use the word bank to help you.";
const blue = (html) => html.includes(`<span class="h-ask">${ASK}</span>`);

test("a question is blue when its instruction is the next block, the same as when they share one", () => {
  const together = { number: 1, stack: [{ helper: "instruction", text: `${ASK}\n${TELL}` }] };
  const apart = {
    number: 1,
    stack: [
      { helper: "instruction", text: ASK },
      { helper: "instruction", text: TELL },
    ],
  };
  assert.ok(blue(renderContent(together, 170)));
  assert.ok(blue(renderContent(apart, 170)), "split across two blocks, it is still one question");
});

test("a question with no instruction stays black, and one question's instruction does not colour the next", () => {
  const alone = { number: 2, stack: [{ helper: "instruction", text: ASK }] };
  assert.ok(!blue(renderContent(alone, 170)));

  const two = {
    stack: [
      { number: 1, stack: [{ helper: "instruction", text: "Fill in the table. Use the sources." }] },
      { number: 2, stack: [{ helper: "instruction", text: ASK }] },
    ],
  };
  assert.ok(!blue(renderContent(two, 170)), "question 1's instruction is not question 2's");
});

// ─── the three levels, side by side ──────────────────────────────────────
// "The same question should get the same writing room on all three levels
// unless the task itself differs."

const short = (lines, text = "Is the claim right? Explain how you know.") => ({
  question: true,
  helper: "written-answers",
  showNumbers: false,
  items: [{ text, lines }],
});

test("the same question with different room on two levels is named", () => {
  const worksheet = pack({
    expected: sheet("sheet", [table, short(3)]),
    greaterDepth: sheet("sheet", [table, short(1)]),
  });
  const problems = sameQuestionProblems(sheetsOf(resolveAutoLayouts(worksheet).worksheet));
  assert.equal(problems.length, 1);
  assert.equal(problems[0].signal, "SAME_QUESTION_DIFFERENT_ROOM");
  assert.match(problems[0].message, /Expected question 2 and Greater Depth question 2/);
  assert.match(problems[0].message, /3 ruled lines on Expected, 1 ruled line on Greater Depth/);
});

test("the same room, a reworded question, and a books level are all left alone", () => {
  const check = (sheets) =>
    sameQuestionProblems(sheetsOf(resolveAutoLayouts(pack(sheets)).worksheet));
  assert.deepEqual(
    check({ expected: sheet("sheet", [table, short(2)]), greaterDepth: sheet("sheet", [table, short(2)]) }),
    [],
    "the same room"
  );
  assert.deepEqual(
    check({
      expected: sheet("sheet", [table, short(2)]),
      greaterDepth: sheet("sheet", [table, short(3, "Is the claim always right? Explain, using two examples.")]),
    }),
    [],
    "a different task"
  );
  assert.deepEqual(
    check({ expected: sheet("books", [short(2)]), greaterDepth: sheet("sheet", [table, short(3)]) }),
    [],
    "a books level prints no room to compare"
  );
});
