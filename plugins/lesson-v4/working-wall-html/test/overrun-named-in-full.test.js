"use strict";

// A wall's overrun is named in full, with the remedy that keeps every word.
//
// A 14 September 2026 cloud run's worked example had eight steps: step 8 was two
// characters over its budget, and the panel was three inches too tall. The
// refusal named only step 8, the one permitted repair shortened it, the rebuild
// found the panel, and the wall was lost. Splitting the steps over two cards
// kept every word and fitted, but nothing said so.

const test = require("node:test");
const assert = require("node:assert");

const { fitLinearBodySize } = require("../src/layout");
const style = require("../style.json");

const STEPS = [
  { label: "Step 1", text: "Read the numbers at both ends of the line before you estimate where anything goes." },
  { label: "Step 2", text: "Find the midpoint: add the two ends together and halve the total." },
  { label: "Step 3", text: "Mark the midpoint lightly so you can compare your number with it." },
  { label: "Step 4", text: "Decide whether your number is less than or greater than the midpoint." },
  { label: "Step 5", text: "Place your number on the correct side, closer to the nearer end." },
  { label: "Check", text: "Is it sensible?" },
  { label: "Example", text: "0 to 10,000: the midpoint is 5,000." },
  { label: "Example", text: "The midpoint is 6,000. Place 7,000 a little to the right of 6,000, nearer to 6,000 than to 10,000 here." },
];

function warnings(items) {
  const said = [];
  const original = console.warn;
  console.warn = (...args) => said.push(args.join(" "));
  try {
    fitLinearBodySize(items, 72, 36, "A3", "landscape", style, { label: 'workedExample "How to estimate"' });
  } finally {
    console.warn = original;
  }
  return said.join("\n");
}

test("an over-long step and an over-tall panel are named in the same refusal", () => {
  const message = warnings(STEPS);
  assert.match(message, /item 8 is \d+ characters/);
  assert.match(message, /8 items need [\d.]+in of panel/);
});

test("a panel overrun names splitting over a second card as the remedy that keeps every word", () => {
  const fits = STEPS.map((step, i) => (i === 7 ? { ...step, text: "The midpoint is 6,000. Place 7,000 just right of 6,000." } : step));
  const message = warnings(fits);
  assert.match(message, /Splitting the items in order over a second card keeps every word/);
  assert.doesNotMatch(message, /designer's decision/, "no step is over its own budget, so no rewording is implied");
});

test("the same steps split over two cards each fit", () => {
  assert.strictEqual(warnings(STEPS.slice(0, 5).map((s) => s)), "");
  const secondHalf = STEPS.slice(5).map((step, i) => (i === 2 ? { ...step, text: "The midpoint is 6,000. Place 7,000 just right of 6,000." } : step));
  assert.strictEqual(warnings(secondHalf), "");
});
