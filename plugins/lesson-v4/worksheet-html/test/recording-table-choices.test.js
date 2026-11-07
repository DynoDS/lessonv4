"use strict";

// A sheet that copies the board's comparison table prints a circle-one column
// as its choices, one to a line, with the ring only on the row done together
// (5 November 2026). A `||` circled choice belongs to the answer key.

const { test } = require("node:test");
const assert = require("node:assert");

const { helpers } = require("../src/helpers/tables");

const recording = helpers["recording-table"];
const CHOICES = ["same", "different"];

test("a choice cell prints its choices and rings only the row done together", () => {
  const html = recording.render({
    helper: "recording-table",
    columns: ["What they need", "How do they get it?", "Same or different?"],
    rows: [
      ["water", "From the stream.", { choices: CHOICES, circled: "different" }],
      ["food", null, { choices: CHOICES, circled: null }],
      ["medicine", null, { choices: CHOICES, circled: "||same" }],
    ],
    writing: ["word", "sentence", "word"],
  });
  assert.equal((html.match(/class="h-choice[^"]*">same</g) || []).length, 3);
  assert.equal((html.match(/h-choice-ringed/g) || []).length, 1);
  assert.ok(!html.includes("[object Object]"));
});
