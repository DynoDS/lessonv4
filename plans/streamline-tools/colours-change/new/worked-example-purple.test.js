"use strict";

// A worked example is purple, the same colour as a sticky fact (the teacher's
// rule of 24 September 2026: "Worked examples can be something different. Maybe
// purple.", then "worked example purple too"). On a worksheet a method frame is
// a worked example only when it shows worked numbers, one line or more worked
// right through: then its edge and title take that purple, as the board's
// frame does. A frame the child fills in every line looks as it did before the
// colours release, an ink edge and a question-blue heading (his answer of 25
// September 2026, "3. yes"). Its labels stay scaffold ink, as he settled, and
// its question label stays question blue.

const assert = require("node:assert/strict");
const test = require("node:test");

const { COLOUR } = require("../src/tokens");
const { css, helpers } = require("../src/helpers/methods");
const { COLOURS } = require("../../builder/src/styles");

function rule(selector) {
  const escaped = selector.replace(/[.]/g, "\\.").replace(/ /g, "\\s+");
  const match = new RegExp(String.raw`(^|\n)\s*${escaped}\s*\{[^}]*\}`).exec(css);
  assert.ok(match, `${selector} has no styling`);
  return match[0];
}

function frame(lines) {
  return helpers["method-frame"].render({
    helper: "method-frame",
    title: "Adjusting strategy",
    lines,
  });
}

test("a worked example uses the deck's worked-example purple, the sticky fact's", () => {
  assert.equal(COLOUR.worked, "#7030A0");
  assert.equal(COLOUR.worked.slice(1), COLOURS.worked);
  assert.equal(COLOURS.worked, COLOURS.sticky);
});

test("an empty method frame keeps its ink edge and blue heading; a worked one is purple", () => {
  assert.match(rule(".h-mframe-framed"), /solid var\(--colour-ink\)/);
  assert.match(rule(".h-mframe-title"), /color: var\(--colour-question\)/);
  assert.match(rule(".h-mframe-framed.h-mframe-worked"), /border-color: var\(--colour-worked\)/);
  assert.match(rule(".h-mframe-worked .h-mframe-title"), /color: var\(--colour-worked\)/);
  assert.match(rule(".h-mframe-label"), /color: var\(--colour-ink\)/);
  assert.match(rule(".h-mframe-id"), /color: var\(--colour-question\)/);
});

test("a frame shows worked numbers once one line is worked right through", () => {
  const worked = (html) => /class="h-mframe-panel[^"]*\bh-mframe-worked\b/.test(html);
  // The child fills every box, whatever numbers the frame hands them.
  assert.equal(worked(frame([
    { label: "First, add:", content: "148 + 100 = ___" },
    { label: "Then, adjust:", content: "___ - 1 = ___" },
  ])), false);
  // A fully worked frame is a worked example.
  assert.equal(worked(frame([
    { label: "First, add:", content: "63 + 30 = 93" },
    { label: "Then, adjust:", content: "93 - 1 = 92" },
  ])), true);
  // A line of words with no box decides nothing (the fourth check).
  assert.equal(worked(frame([
    { label: "First,", content: "Look at the ones digit." },
    { label: "Then, round:", content: "346 rounds to ___" },
  ])), false);
  // Partly worked by the example: one line worked through is enough.
  assert.equal(worked(frame([
    { label: "First, add:", content: "148 + 100 = 248" },
    { label: "Then, adjust:", content: "248 - 1 = ___" },
  ])), true);
});
