"use strict";

// A table that sets two things side by side, the way the teacher would put it up.
//
// The run this came from: the Year 5 Athens and Sparta wall (stress test of
// 7 October 2026). The lesson named its comparison table for the wall and the
// table was left off: its two cities had columns of 28% and 45%, so a box held
// 28 letters in one and 48 in the other, and the sentences fitted neither. The
// teacher approved one sheet instead of three (10 October): the two cities
// side by side with a few words a box, a picture above each, and each city's
// big idea as a row in that city's colour. These pin that sheet as it prints:
// equal columns, a colour a city, the key row in it, and pictures that take
// the room the words leave.

const test = require("node:test");
const assert = require("node:assert");

const style = require("../style.json");
const { preRenderSvgs } = require("../src/svg-renderer");
const { renderReferenceTable } = require("../src/render-grids");

const PAGE = { size: "A3", orientation: "landscape" };
const picture = (time) => ({ visual: { type: "clock", time } });
const COMPARED = {
  type: "referenceTable",
  page: PAGE,
  title: "Athens and Sparta",
  columns: ["", "Athens", "Sparta"],
  keyRows: [1],
  rows: [
    ["", picture("3:00"), picture("9:00")],
    ["The big idea", "Citizens ran the city", "The army came first"],
    ["Government", "The citizens voted", "Kings and Elders"],
    ["Education", "Boys went to school", "Boys trained from 7"],
    ["The army", "Fought when needed", "Every man a soldier"],
  ],
};
// Name, short value, long description: the split this table always had.
const LOOKUP = {
  type: "referenceTable",
  page: PAGE,
  title: "Conjunctions",
  columns: ["Word", "Job", "Example"],
  rows: [
    ["because", "why", "I ran because the bell had already gone."],
    ["when", "time", "We line up when the whistle blows twice."],
    ["so", picture("3:00"), "We left so the hall was empty at last."],
  ],
};

async function render(card) {
  const svgImages = await preRenderSvgs({ cards: [card] }, __dirname);
  return renderReferenceTable(card, style, __dirname, { svgImages });
}

const colWidths = (html) => [...html.matchAll(/<col style="width:([\d.]+)mm;">/g)].map((m) => Number(m[1]));
const headFills = (html) => [...html.matchAll(/<th style="[^"]*?background:(#[0-9A-Fa-f]{6})/g)].map((m) => m[1].toUpperCase());
const rowsOf = (html) => html.split("<tr>").slice(2);
const imageHeights = (html) => [...html.matchAll(/<img[^>]*height:([\d.]+)mm/g)].map((m) => Number(m[1]));

test("two things side by side get equal columns, and each its own heading colour", async () => {
  const html = await render(COMPARED);
  const [, second, third] = colWidths(html);
  assert.ok(Math.abs(second - third) < 0.5, `the two value columns are ${second}mm and ${third}mm`);
  const fills = headFills(html);
  assert.deepEqual(fills.slice(1), ["#0070C0", "#E46C0A"], "blue for the first, orange for the second");
});

test("a key row says each column's main point in that column's colour, on its tint", async () => {
  const key = rowsOf(await render(COMPARED))[1];
  assert.match(key, /background:#EAF3FB[^>]*>[\s\S]*?color:#0070C0;">Citizens ran the city/);
  assert.match(key, /background:#FEF1E6[^>]*>[\s\S]*?color:#E46C0A;">The army came first/);
  const plain = rowsOf(await render(COMPARED))[2];
  assert.doesNotMatch(plain, /#EAF3FB|#FEF1E6/, "an ordinary row keeps its ordinary look");
});

test("a row of pictures takes the room the words leave, past the old 1.6in cap", async () => {
  const heights = imageHeights(await render(COMPARED));
  assert.equal(heights.length, 2);
  heights.forEach((mm) => assert.ok(mm > 1.6 * 25.4 + 1, `a picture printed ${mm}mm tall`));
});

test("a lookup table keeps its split, its one heading colour and its picture cap", async () => {
  const html = await render(LOOKUP);
  const [first, second, third] = colWidths(html);
  assert.ok(third > second * 1.4, `name ${first}mm, value ${second}mm, description ${third}mm`);
  assert.equal(new Set(headFills(html)).size, 1, "one heading colour");
  imageHeights(html).forEach((mm) => assert.ok(mm <= 1.6 * 25.4 + 0.1, `a picture among words stays at the cap, ${mm}mm`));
});
