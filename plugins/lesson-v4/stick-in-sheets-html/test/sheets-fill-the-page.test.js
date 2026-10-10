"use strict";

// A printed activity uses its page (the 20-lesson stress test, 7 October 2026,
// and the teacher's rulings on the real pages, 10 October 2026). Five lessons
// printed a small figure on a mostly empty page for every child: a ten frame
// 78mm wide with boxes too small for a counter, a fraction wall above 103mm of
// blank page, three sums with nowhere to write the answers, four river
// photographs as four files and 64 pages, a tally chart and its bar chart as
// two pages a child. Three causes, each held here:
//
// - a drawing sized from its own words could not grow to a page;
// - the pack drew one figure to a piece, so one task became several files;
// - a figure page had nowhere to write.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const sharp = require("sharp");
const { figurePages, sheetPages } = require("../src/render-activity-page");
const { renderPieceHtml, letterMarks } = require("../src/render-piece-html");
const { build } = require("../build");

const LANDSCAPE = { printableWMm: 277, printableHMm: 185 };
const PORTRAIT = { printableWMm: 190, printableHMm: 272, portrait: true };
const PAGE = { ...LANDSCAPE, classSize: 32, pageHtml: (c, b) => `<div class="page">${b}</div>` };
const SHEET = { pages: [LANDSCAPE, PORTRAIT], classSize: 32, pageHtml: (c, b) => `<div class="page">${b}</div>` };

const renderOf = (item, baseDir) => (widthMm, zoom) => renderPieceHtml({ ...item, widthMm }, { baseDir, page: true, zoom });

async function laidFigure(item) {
  const natural = await renderPieceHtml(item, {});
  return figurePages(item, natural, renderOf(item), PAGE);
}

async function partsOf(items, baseDir) {
  const parts = [];
  for (const item of items) {
    const marks = letterMarks(item);
    const render = renderOf(item, baseDir);
    const natural = marks ? await render(135) : await renderPieceHtml(item, { baseDir });
    parts.push({ item, natural, render, marks });
  }
  return parts;
}

const TEN_FRAME = { visual: "shaded-fraction", task: "Fill the boxes to make each number. Count the empty boxes.", per: "pair", spec: { shape: "grid", parts: 10, rows: 2, shaded: 0 } };

test("a ten frame prints two to a page with boxes a counter fits in", async () => {
  const laid = await laidFigure(TEN_FRAME);
  assert.strictEqual(laid.perPage, 2);
  assert.strictEqual(laid.pages.length, 8);
  const box = laid.widthMm / 5;
  assert.ok(box >= 30, `each box printed ${box.toFixed(1)}mm, too small for a counter`);
});

test("a fraction wall grows down the page as well as across it", async () => {
  const laid = await laidFigure({ visual: "fraction-wall", task: "Find two fractions equal to one half.", per: "child", spec: { fractions: [1, 2, 3, 4, 6, 8, 12] } });
  assert.strictEqual(laid.perPage, 1);
  assert.ok(laid.widthMm > 260, `the wall printed ${laid.widthMm.toFixed(0)}mm wide`);
  assert.ok(laid.heightMm > 130, `the wall printed ${laid.heightMm.toFixed(0)}mm tall and left the page under it blank`);
});

test("a stack of bars takes the width of the page", async () => {
  const laid = await laidFigure({ visual: "shaded-fraction", task: "Shade the same amount.", per: "child", spec: { bars: [{ parts: 2, shaded: 1 }, { parts: 10, shaded: 0 }, { parts: 3, shaded: 1 }, { parts: 9, shaded: 0 }] } });
  assert.ok(laid.widthMm > 250, `the bars printed ${laid.widthMm.toFixed(0)}mm wide on a 277mm page`);
});

test("a chart that already fills its page is redrawn, not enlarged, and stays one to a page", async () => {
  const laid = await laidFigure({ visual: "bar-chart", task: "Draw a bar for each minibeast.", per: "child", spec: { categories: ["Snails", "Ants"], values: [0, 0], y_interval: 2, y_max: 12 } });
  assert.strictEqual(laid.perPage, 1);
  assert.ok(laid.widthMm > 230 && laid.heightMm > 150, `the chart printed ${laid.widthMm.toFixed(0)} by ${laid.heightMm.toFixed(0)}mm`);
});

test("coins stay life size however much page is spare", async () => {
  const item = { visual: "money", task: "Ring the coins that make 75p.", spec: { items: ["£1", "50p", "20p", "10p", "5p"] } };
  const natural = await renderPieceHtml(item, {});
  const laid = await laidFigure(item);
  assert.strictEqual(natural.flex, false);
  assert.ok(laid.heightMm <= natural.heightMm * 1.1, `the coins were enlarged to ${laid.heightMm.toFixed(0)}mm tall`);
});

test("the figures of one task print on one sheet, the way round that prints them largest", async () => {
  const tally = { visual: "tally-chart", task: "(1) Write the frequency for each minibeast.", per: "child", spec: { headers: ["Minibeast", "Tally", "Frequency"], rows: [{ label: "Snails", tally: 6, total: "" }, { label: "Ants", tally: 9, total: "" }] } };
  const chart = { visual: "bar-chart", task: "(2) Draw a bar for each minibeast.", per: "child", spec: { categories: ["Snails", "Ants"], values: [0, 0], y_interval: 2, y_max: 12 } };
  const laid = await sheetPages(await partsOf([tally, chart]), SHEET);
  assert.strictEqual(laid.pages.length, 32);
  assert.strictEqual(laid.figures.length, 2);
  assert.match(laid.pages[0], /\(1\) Write the frequency/);
  assert.match(laid.pages[0], /\(2\) Draw a bar/, "the second figure's own task is printed above it");
  for (const f of laid.figures) assert.ok(f.widthMm > 100, `a figure printed only ${f.widthMm.toFixed(0)}mm wide`);
});

test("a sum with a part to find prints beside its figure with a box to write in", async () => {
  const pair = (bars, write, task) => ({ visual: "shaded-fraction", per: "child", ...(task ? { task } : {}), label: "Your Turn 1 bars", spec: { bars }, write: [write] });
  const laid = await sheetPages(await partsOf([
    pair([{ parts: 2, shaded: 1 }, { parts: 10, shaded: 0 }], "(1) 1/2 = ?/10", "Write each equivalent fraction."),
    pair([{ parts: 3, shaded: 1 }, { parts: 9, shaded: 0 }], "(2) 1/3 = ?/9"),
    pair([{ parts: 5, shaded: 2 }, { parts: 15, shaded: 0 }], "(3) 2/5 = ?/15"),
  ]), SHEET);
  const page = laid.pages[0];
  assert.strictEqual((page.match(/border:0\.5mm solid[^"]*border-radius:1mm/g) || []).length, 3, "one box for each answer");
  assert.ok(!/\?/.test(page.replace(/<svg[\s\S]*?<\/svg>/g, "")), "no question mark is left where the box goes");
  assert.match(page, /class="sfr"/, "the fractions are stacked");
  assert.ok(!page.includes("Your Turn 1 bars"), "a piece's file name is not printed as a heading");
  const widths = laid.figures.map((f) => Math.round(f.widthMm));
  assert.ok(Math.max(...widths) - Math.min(...widths) <= 1, `the three pairs printed at different lengths: ${widths.join(", ")}`);
  assert.ok(widths[0] > 150, `the bars printed ${widths[0]}mm wide`);
});

test("an answer in words gets a ruled line under the figure", async () => {
  const wall = { visual: "fraction-wall", task: "Find the whole fraction family of each fraction.", per: "child", spec: { fractions: [1, 2, 3, 4, 6, 8, 12] }, write: ["(1) 1/4 =", "(2) 5/6 ="] };
  const laid = await sheetPages(await partsOf([wall]), SHEET);
  const page = laid.pages[0];
  assert.strictEqual((page.match(/border-bottom:0\.4mm solid/g) || []).length, 2, "one line for each family");
  assert.ok(laid.figures[0].heightMm > 100, `the wall printed ${laid.figures[0].heightMm.toFixed(0)}mm tall`);
  assert.ok(laid.figures[0].heightMm < 150, "the wall left room for the lines");
});

test("photographs marked with letters share a sheet, each letter on the picture and a line beneath", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stickin-sheet-"));
  for (const [name, w, h] of [["a.png", 300, 400], ["b.png", 600, 400], ["c.png", 600, 400], ["d.png", 600, 400]]) {
    await sharp({ create: { width: w, height: h, channels: 3, background: "#7799AA" } }).png().toFile(path.join(dir, name));
  }
  const photo = (image, letters, task) => ({
    visual: "label-diagram", sheet: "River photographs", per: "pair", ...(task ? { task } : {}),
    spec: { image, callouts: letters.map((label, i) => ({ anchor: [30 + 30 * i, 50], label, given: true })) },
  });
  const items = [photo("a.png", ["A"], "Write the name of the feature at each letter."), photo("b.png", ["B", "C ||confluence"]), photo("c.png", ["D"]), photo("d.png", ["E", "F"])];
  assert.deepStrictEqual(letterMarks(items[1]), ["B", "C"]);
  assert.strictEqual(letterMarks({ visual: "label-diagram", spec: { callouts: [{ anchor: [1, 1], label: "stem" }] } }), null, "a diagram with names to write keeps its lines");
  const laid = await sheetPages(await partsOf(items, dir), SHEET);
  const page = laid.pages[0];
  assert.strictEqual(laid.pages.length, 16);
  assert.strictEqual((page.match(/<circle /g) || []).length, 6, "a circle for each letter");
  assert.strictEqual((page.match(/border-bottom:0\.4mm solid/g) || []).length, 6, "a line for each letter");
  assert.ok(!page.includes("confluence"), "the board's answer never reaches the sheet");
  assert.ok(!/<line /.test(page), "no pointer lines run off the photographs");
  for (const f of laid.figures) assert.ok(f.widthMm * f.heightMm > 4000, `a photograph printed only ${f.widthMm.toFixed(0)} by ${f.heightMm.toFixed(0)}mm`);
});

test("two figures naming the same beat come out of the build as one file", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stickin-beat-"));
  const spec = {
    meta: { lesson: "Bar charts", yearGroup: "Year 3", subject: "Maths" },
    items: [
      { visual: "tally-chart", sourceUnitId: "unit-004", tag: "Tally chart", label: "Minibeast tally chart", task: "(1) Write the frequency.", per: "child", spec: { headers: ["Minibeast", "Tally", "Frequency"], rows: [{ label: "Snails", tally: 6, total: "" }] } },
      { visual: "bar-chart", sourceUnitId: "unit-004", tag: "Bar chart", label: "Minibeast bar chart", task: "(2) Draw the bars.", per: "child", spec: { categories: ["Snails", "Ants"], values: [0, 0], y_interval: 2, y_max: 12 } },
      { visual: "venn", sourceUnitId: "unit-006", tag: "Sort", label: "Sort the minibeasts", task: "Sort them.", spec: { label1: "has legs", label2: "has wings" } },
    ],
  };
  fs.writeFileSync(path.join(dir, "stick-in-sheets.json"), JSON.stringify(spec));
  const files = await build(path.join(dir, "stick-in-sheets.json"), dir);
  assert.strictEqual(files.length, 2, "the tally chart and its bar chart are one sheet; the Venn is another");
  assert.match(path.basename(files[0]), /^Activity 1 - Minibeast tally chart\./);
  assert.match(path.basename(files[1]), /^Activity 2 - Sort the minibeasts\./);
});
