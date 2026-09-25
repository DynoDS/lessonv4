"use strict";

// The worksheets topic's decision 10 (4.2.290), his "yes", and his words as the
// first check's repair round passed them on: "never a list of steps printed just
// as a reminder". No criteria panel and no list of the method's steps printed as
// a reminder; a one-line reminder of a method is support, and a fill-in frame
// the child writes into, and steps a task needs, may print. The engine's message
// says the same, and it does not say where a method's steps are shown, because
// only the success criteria are known to be on the board. The success-criteria
// topic bars two wordings everywhere; neither may come back here.

const { test } = require("node:test");
const assert = require("node:assert");
const { renderHelper } = require("../src/helpers");

function refusal() {
  try {
    renderHelper({ helper: "instruction", text: "Round it.\nMark halfway.\nChoose the nearer ten." }, 174);
  } catch (error) {
    return String(error.message);
  }
  throw new Error("an instruction of three lines was not refused");
}

test("the list refusal leaves off criteria and a list of a method's steps printed just as a reminder", () => {
  const message = refusal();
  assert.match(message, /^INSTRUCTION_IS_A_LIST: /);
  assert.ok(message.includes("are the lesson's success criteria, leave them off: they stay on the board"), message);
  assert.ok(message.includes("A list of a method's steps printed just as a reminder is left off too."), message);
});

test("steps a child works through, and a fill-in frame, still go with their question", () => {
  const message = refusal();
  assert.ok(message.includes("if they are steps a child works through to reach the answer, they are part of its question"), message);
  assert.ok(message.includes('in maths use "method-frame"'), message);
  assert.ok(message.includes('use "questions" or "written-answers"'), message);
});

test("the refusal never says where a method's steps are shown, and never uses the barred wordings", () => {
  const message = refusal();
  assert.ok(!message.includes("or the steps of its method, leave them"), message);
  assert.ok(!message.includes("Success criteria, and a method's steps, stay on the board"), message);
  assert.ok(!/method's steps[^.]*stay on the board/.test(message), message);
});
