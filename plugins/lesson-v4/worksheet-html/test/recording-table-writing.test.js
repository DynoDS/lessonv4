"use strict";

// A recording table usually mixes demands. The Electrical Appliances sheet
// wanted "Object" (word), "Electrical or not" (tick), "Power source" (word)
// and "What makes it work" (sentence). With one size for the whole table the
// designer had to choose between a page that refused to fit and a page that
// told a child to explain in a word-sized box, so `writing` now takes an array
// of one entry per column.

const { test } = require("node:test");
const assert = require("node:assert");

const { helpers } = require("../src/helpers/tables");

const recording = helpers["recording-table"];

function table(writing) {
  return {
    helper: "recording-table",
    columns: ["Object", "Electrical or not", "Power source", "What makes it work"],
    rows: [
      ["Hairdryer", null, null, null],
      ["Portable radio", null, null, null],
    ],
    writing,
  };
}

test("a string still sizes every column the same way", () => {
  // 4 columns x 30mm (word) = 120mm; 4 x 52mm (sentence) = 208mm.
  assert.strictEqual(recording.needs(table("word")).minWidthMm, 120);
  assert.strictEqual(recording.needs(table("sentence")).minWidthMm, 208);
});

test("an array sizes each column for what that column is for", () => {
  const mixed = table(["word", "tick", "word", "sentence"]);
  // 30 + 16 + 30 + 52 = 128mm, against 208mm if the whole table went sentence.
  assert.strictEqual(recording.needs(mixed).minWidthMm, 128);
  assert.ok(
    recording.needs(mixed).minWidthMm < recording.needs(table("sentence")).minWidthMm,
    "a mixed table must be narrower than an all-sentence one"
  );
});

test("row height follows the most demanding column, since a row is one height", () => {
  const mixed = table(["word", "tick", "word", "sentence"]);
  assert.strictEqual(
    recording.needs(mixed).minHeightMm,
    recording.needs(table("sentence")).minHeightMm,
    "one sentence column must give every row sentence height"
  );
});

test("an unknown or missing column entry falls back to word, never to nothing", () => {
  const odd = table(["word", "nonsense", "word", "sentence"]);
  // The bad entry is treated as word (30mm), so 30 + 30 + 30 + 52 = 142mm.
  assert.strictEqual(recording.needs(odd).minWidthMm, 142);
  const short = table(["sentence"]);
  // Columns past the end of the array take word: 52 + 30 + 30 + 30 = 142mm.
  assert.strictEqual(recording.needs(short).minWidthMm, 142);
});

test("the rendered table gives each column its share of the width", () => {
  const html = recording.render(table(["word", "tick", "word", "sentence"]));
  const widths = [...html.matchAll(/<th style="width:([\d.]+)%"/g)].map((m) =>
    Number(m[1])
  );
  assert.strictEqual(widths.length, 4);
  // tick is the narrowest, sentence the widest, and they sum to the whole row.
  assert.ok(widths[1] < widths[0], "the tick column must be narrower than a word column");
  assert.ok(widths[3] > widths[0], "the sentence column must be wider than a word column");
  assert.ok(Math.abs(widths.reduce((a, b) => a + b, 0) - 100) < 0.5, widths.join("/"));
});

test("a table with no writing field is unchanged", () => {
  const bare = { helper: "recording-table", columns: ["A", "B"], rows: [["x", null]] };
  assert.strictEqual(recording.needs(bare).minWidthMm, 80); // the 80mm floor
  assert.ok(recording.render(bare).includes("<table"));
});
