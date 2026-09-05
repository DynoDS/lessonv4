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

test("a column entry this engine cannot size is refused, not quietly made a word", () => {
  // A maths sheet asked for "number" columns and got word-width ones without
  // a word said, so nobody could see why the table was wider than the page
  // wanted. "number" is now a real size; anything unknown is named and refused.
  const odd = table(["word", "nonsense", "word", "sentence"]);
  assert.throws(() => recording.needs(odd), /not a writing size/);
  const numbers = table(["number", "number", "number", "number"]);
  assert.strictEqual(recording.needs(numbers).minWidthMm, 88);
});

test("a column past the end of the array still takes word, never nothing", () => {
  const short = table(["sentence"]);
  // 52 + 30 + 30 + 30 = 142mm.
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

test("every row carries the writing height, so a fully worked example row cannot swallow the spare", () => {
  // This table stretches to fill its zone, and a browser gives a stretched
  // table's spare height to whichever rows are unconstrained. On one sheet the
  // first row was the worked example (42, 32, 52), the only row with no height,
  // and it came out about five times the height of the rows beneath it.
  const html = recording.render({
    columns: ["Starting number", "10 less", "10 more"],
    writing: ["number", "number", "number"],
    rows: [["42", "32", "52"], ["34", null, null], ["56", null, null]],
  });
  const rows = html.match(/<tr[^>]*>/g).filter((tag) => tag.includes("height:"));
  assert.strictEqual(rows.length, 3, "every body row carries a height");
  assert.strictEqual(new Set(rows).size, 1, "and they are all the same height");
});


// ─── every column is a response column ───────────────────────────────────
//
// The first column hugs its longest text because it USUALLY carries the given
// item names. A Year 4 history table headed "Stayed the same" / "Changed" has
// no item names: both columns are response columns doing the same job, and
// hugging the first gave it about a third of the width the second got, with the
// narrow one carrying the harder of the two answers. The stick-in designer left
// that piece out of the pack rather than print it lopsided.

const { tightSvg } = require("../../shared/visuals/recording-table-svg");

const cellWidths = (svg) =>
  [...svg.matchAll(/<rect x="[\d.]+" y="[\d.]+" width="([\d.]+)" height="[\d.]+" fill="#FFFFFF"/g)]
    .map((m) => Number(m[1]));

test("two response columns share the width equally", () => {
  const { svg } = tightSvg({
    headers: ["Stayed the same", "Changed"],
    rows: [["", ""], ["", ""]],
  });
  const widths = cellWidths(svg);
  assert.ok(widths.length >= 2, `expected cells, got ${widths.length}`);
  assert.ok(
    Math.abs(widths[0] - widths[1]) < 1,
    `columns doing the same job came out ${widths[0]} and ${widths[1]}`
  );
});

test("a first column that carries item names still hugs them", () => {
  // The behaviour the rule was written for, which must survive: a given-name
  // column stays narrow so the answer columns get the room.
  const { svg } = tightSvg({
    headers: ["Meal", "Monday", "Tuesday"],
    rows: [["Breakfast", "", ""], ["Lunch", "", ""]],
  });
  const widths = cellWidths(svg);
  assert.ok(
    widths[0] < widths[1] * 0.6,
    `the item-name column should stay narrow, got ${widths[0]} against ${widths[1]}`
  );
  assert.ok(
    Math.abs(widths[1] - widths[2]) < 1,
    "the two response columns should still match each other"
  );
});
