"use strict";

// A step number on a marked text is placed by the words it names.
//
// In the stress test of 7 October 2026 the marked-text drawing named no
// places, so the wall worker placed each step by percentages chosen by eye.
// They sat on the words, and on 3 lessons of 20 the worker left the steps
// loose under the picture. The drawing has named its words since 8 October;
// these pin that a place given by numbers is refused, with words that say what
// to give, so a guess cannot reach a printed sheet.

const test = require("node:test");
const assert = require("node:assert/strict");

const { namedTextCallouts } = require("../src/svg-renderer");

const text = (callouts) => ({ type: "annotated-text", lines: ["At midnight, the fox ate its dinner."], callouts });

test("a step placed on a marked text by numbers is refused", () => {
  assert.throws(() => namedTextCallouts(text([{ anchor: [31, -20, 15], step: 3 }])), /step 3 is placed on a marked text by numbers.*Give `part` the word/s);
  assert.throws(() => namedTextCallouts(text([{ step: 2 }])), /step 2 is placed on a marked text by no name/);
});

test("a step that names its words is kept, and a later occurrence goes by its own name", () => {
  const out = namedTextCallouts(text([{ part: "midnight", step: 1 }, { part: "dinner", nth: 2, step: 3 }]));
  assert.deepEqual(out.callouts.map((c) => c.part), ["midnight", "dinner #2"]);
});

test("a word label on a marked text is left as it was written", () => {
  const callouts = [{ part: "fox", label: "who" }];
  assert.deepEqual(namedTextCallouts(text(callouts)).callouts, callouts);
});
