"use strict";

// A poem on a worksheet keeps its lines (2 October 2026): a renga sheet with
// no way to print a poem split it across two narrow recording tables, wrapped
// its lines in half and printed blank header rows, on a sheet whose first
// question was to count the syllables in each line.

const assert = require("node:assert/strict");
const test = require("node:test");
const { renderHelper, measure } = require("../src/helpers");

const RENGA = {
  helper: "poem",
  lines: ["Spring sun warms the ground.", "A small green shoot pushes up.", "Look, a daffodil!", "",
    "Its yellow trumpet opens,", "and a bee crawls in to feed."],
  boxes: true,
  filled: ["5", "7", "5"],
};

test("a poem prints one row per line, a gap between stanzas, and a box after each line", () => {
  const html = renderHelper(RENGA, 120);
  assert.equal((html.match(/class="h-poem-line"/g) || []).length, 5);
  assert.equal((html.match(/class="h-poem-gap"/g) || []).length, 1);
  assert.equal((html.match(/class="h-poem-box"/g) || []).length, 5);
  assert.match(html, /<div class="h-poem-box">5<\/div>/, "a box done for the child prints its value");
  assert.ok(!html.includes("<p>"), "a poem is not printed as paragraphs");
});

test("a poem without boxes is the lines alone", () => {
  const html = renderHelper({ helper: "poem", lines: ["Red leaves drift and fall", "down onto the empty path."] }, 120);
  assert.equal((html.match(/class="h-poem-box"/g) || []).length, 0);
  assert.equal((html.match(/class="h-poem-line"/g) || []).length, 2);
});

test("a poem measures a row per line, so the sheet leaves room for it", () => {
  const poem = measure(RENGA, 120);
  const shorter = measure({ ...RENGA, lines: RENGA.lines.slice(0, 3) }, 120);
  assert.ok(poem > shorter + 15, `six rows measured ${poem}mm against three at ${shorter}mm`);
});

test("a passage still prints as paragraphs", () => {
  const html = renderHelper({ helper: "source-text", paragraphs: ["We walked north."] }, 120);
  assert.match(html, /<p>We walked north\.<\/p>/);
});
