"use strict";

// A question slip goes in a book, and the book is where the child writes.
//
// A written answer already lost its ruled lines on a slip. A writing frame
// did not: a Year 4 PSHE slip printed "The sensible choice is to ___ because
// ___." and then two ruled lines under it, four times, on a strip meant to be
// stuck above the child's own writing (Daniel, 4 October 2026: "they don't
// need the writing lines for children to write on, because they're in books").
// The sentence starter is the support and stays; the lines go.

const { test } = require("node:test");
const assert = require("node:assert");

const { helpers } = require("../src/helpers/frames");

const frame = (extra = {}) => ({
  helper: "writing-frame",
  starters: [{ text: "The sensible choice is to ______ because ______.", lines: 2 }],
  ...extra,
});

test("on the sheet a writing frame rules its lines", () => {
  assert.match(helpers["writing-frame"].render(frame()), /h-wf-line/);
});

test("on a slip it keeps the starter and rules nothing", () => {
  const html = helpers["writing-frame"].render(frame({ slip: true }));
  assert.match(html, /The sensible choice is to/);
  assert.doesNotMatch(html, /h-wf-line/);
});

test("and the slip is measured without them", () => {
  const sheet = helpers["writing-frame"].measure(frame(), 84);
  const slip = helpers["writing-frame"].measure(frame({ slip: true }), 84);
  assert.ok(slip < sheet, `${slip} should be less than ${sheet}`);
});
