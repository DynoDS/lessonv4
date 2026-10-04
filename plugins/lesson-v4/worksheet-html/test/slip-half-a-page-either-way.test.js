"use strict";

// A slip is half a page, one way or the other.
//
// Four long PSHE situations made a slip half a page wide and the whole page
// tall: a strip as tall as the book it is stuck into. Daniel, 4 October 2026:
// "1 2 one column, 3 4 next column ... teacher can cut in the middle", then
// "slips can be half a page, whether that's vertically or horizontally". So a
// slip taller than half the page prints across the page in two columns, in the
// order written, and a short slip prints two across as it always did.

const { test } = require("node:test");
const assert = require("node:assert");

const { buildSlips } = require("../src/slips");

const situation = (n) => ({
  question: true,
  number: n,
  stack: [
    {
      helper: "writing-frame",
      text:
        "It is the school summer fair on the field. Grace's class is pulling in the tug of war. " +
        "Grace wants to shout as loud as she can.\nWhat is the sensible choice for Grace? Why?",
      starters: [{ text: "The sensible choice is to ______ because ______.", lines: 2 }],
    },
  ],
});

const sheet = (count) => ({
  recording: "books",
  code: "E",
  zones: { a: { stack: Array.from({ length: count }, (_, i) => situation(i + 1)) } },
});

test("a slip taller than half the page prints across the page, cut across", async () => {
  const result = await buildSlips({ sheetSpec: sheet(4), title: "Choices" });
  assert.strictEqual(result.wide, true);
  assert.strictEqual(result.cols, 1);
  assert.ok(result.rows >= 2);
  // Two columns filled downwards in two rows, so question 3 starts level with
  // question 1 and question 4 with question 2.
  assert.match(result.html, /data-worksheet-zone="slip-1" style="grid-template-rows:repeat\(2,auto\)"/);
  assert.doesNotMatch(result.html, /class="cut cut--down"/);
  assert.doesNotMatch(result.html, /class="h-wf-line"/);
});

test("a short slip still prints two across", async () => {
  const result = await buildSlips({ sheetSpec: sheet(1), title: "Choices" });
  assert.ok(!result.wide);
  assert.strictEqual(result.cols, 2);
});
