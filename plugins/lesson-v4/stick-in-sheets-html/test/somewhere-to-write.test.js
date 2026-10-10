"use strict";

// Every answer a printed activity asks for has its place on the sheet, and
// what a child reads sits where they are working (the 20-lesson stress test,
// 7 October 2026, and the teacher's rulings on the real pages, 10 October
// 2026). Three lessons printed an activity with nowhere to write: three sums
// with no box, eight coordinates with no line, and four clock times in one
// sentence at the top instead of one under each face. Held here:
//
// - a row figure prints the words it is given under itself;
// - a task in numbered parts prints a part to a block, never one paragraph;
// - a figure about as tall as it is wide keeps the page's height, with the
//   task and each part's own answer spaces beside it.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const sharp = require("sharp");
const { figurePages, sheetPages, taskParts } = require("../src/render-activity-page");
const { renderPieceHtml } = require("../src/render-piece-html");

const LANDSCAPE = { printableWMm: 277, printableHMm: 185 };
const PORTRAIT = { printableWMm: 190, printableHMm: 272, portrait: true };
const PAGE = { ...LANDSCAPE, classSize: 32, pageHtml: (c, b) => `<div class="page">${b}</div>` };
const SHEET = { pages: [LANDSCAPE, PORTRAIT], classSize: 32, pageHtml: (c, b) => `<div class="page">${b}</div>` };

const renderOf = (item, baseDir) => (widthMm, zoom) => renderPieceHtml({ ...item, widthMm }, { baseDir, page: true, zoom });
const words = (html) => html.replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

const TIMES = ["quarter past 4", "quarter to 7", "quarter past 11", "quarter to 1"];
const CLOCKS = {
  visual: "clock-row", task: "Draw the hands to show each time.", per: "child",
  spec: { figures: TIMES.map((caption) => ({ hands: false, caption })) },
};

test("each clock prints its own time underneath, four side by side, two sets to a page", async () => {
  const render = renderOf(CLOCKS);
  const laid = await figurePages(CLOCKS, await render(156), render, PAGE);
  const page = laid.pages[0];
  for (const time of TIMES) assert.ok(page.includes(`>${time}<`), `"${time}" is not under a clock`);
  assert.strictEqual((page.match(/<tr>/g) || []).length / laid.perPage, 1, "the four clocks are one row");
  assert.strictEqual(laid.perPage, 2);
  assert.strictEqual(laid.pages.length, 16);
  assert.ok(laid.widthMm / 4 - 8 >= 44, `each face printed about ${(laid.widthMm / 4 - 8).toFixed(0)}mm`);
  assert.ok(!/border-bottom:0\.4mm solid/.test(page), "a clock with its time given has no line to write the time on");
});

test("a row figure with no words given keeps its line to write on, and a slip still wraps at three", async () => {
  const row = { visual: "clock-row", spec: { figures: [{ time: "3:45" }, { time: "4:15" }, { time: "9:45" }, { time: "1:15" }], writeOnLabels: true } };
  const slip = await renderPieceHtml(row, {});
  assert.strictEqual((slip.html.match(/<tr>/g) || []).length, 2);
  assert.strictEqual((slip.html.match(/border-bottom:0\.4mm solid/g) || []).length, 4);
});

test("a task is split at its numbered parts only when they are numbered in order", () => {
  const split = taskParts("Look at the grid. (1) Plot triangle JKL. Translate it. (2) Plot rectangle PQRS.");
  assert.strictEqual(split.lead, "Look at the grid.");
  assert.deepStrictEqual(split.parts.map((p) => p.text), ["Plot triangle JKL. Translate it.", "Plot rectangle PQRS."]);
  assert.strictEqual(taskParts("Plot P (2, 3) and Q (5, 3)."), null, "a coordinate is not a part number");
  assert.strictEqual(taskParts("Write the frequency. (1) is done for you."), null);
});

const GRID_TASK = "(1) Plot triangle JKL: J (−5, 2), K (−3, 2), L (−3, 5). Translate it 4 squares right and 6 squares down. Write the coordinates of its new vertices. " +
  "(2) Plot rectangle PQRS: P (2, −5), Q (5, −5), R (5, −3), S (2, −3). Translate it 3 squares left and 7 squares up. Write the coordinates of its new vertices.";
const GRID_WRITE = ["(1) J' ( __ , __ )", "(1) K' ( __ , __ )", "(1) L' ( __ , __ )", "(2) P' ( __ , __ )", "(2) Q' ( __ , __ )", "(2) R' ( __ , __ )", "(2) S' ( __ , __ )"];

async function gridSheet(extra) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stickin-grid-"));
  await sharp({ create: { width: 800, height: 800, channels: 3, background: "#FFFFFF" } }).png().toFile(path.join(dir, "grid.png"));
  const item = { visual: "source-copy", task: GRID_TASK, per: "child", spec: { imagePath: "grid.png", caption: "Coordinate grid" }, ...extra };
  const render = renderOf(item, dir);
  const natural = await renderPieceHtml(item, { baseDir: dir });
  return sheetPages([{ item, natural, render, marks: null }], SHEET);
}

test("a grid with a task in two parts keeps its size, each part a block beside it with its own answer spaces", async () => {
  const laid = await gridSheet({ write: GRID_WRITE });
  const page = laid.pages[0];
  assert.strictEqual(laid.portrait, false);
  assert.ok(laid.figures[0].widthMm >= 140, `the grid printed ${laid.figures[0].widthMm.toFixed(0)}mm wide`);
  assert.strictEqual((page.match(/border-bottom:0\.4mm solid/g) || []).length, 14, "two short rules for each of the seven vertices");
  const text = words(page);
  const order = ["(1)", "Plot triangle JKL:", "Translate it 4 squares right", "J' (", "L' (", "(2)", "Plot rectangle PQRS:", "P' (", "S' ("].map((t) => text.indexOf(t));
  assert.ok(order.every((at, i) => at >= 0 && (i === 0 || at > order[i - 1])), `each part is followed by its own answers: ${order.join(", ")}`);
  assert.ok(!/\(1\) J'/.test(text), "a part's number is printed once, on the part");
  assert.ok(!/_{2,}/.test(text), "no underscore is left where a rule goes");
  assert.match(page, /font-weight:bold">Translate it 3 squares left and 7 squares up\.<\/div>/, "a sentence has a line of its own, in the board's words");
});

test("a task in parts prints a part to a block even when nothing is written under it", async () => {
  const laid = await gridSheet({});
  const text = words(laid.pages[0]);
  assert.ok(laid.figures[0].widthMm >= 140);
  assert.ok(text.indexOf("(2)") > text.indexOf("Write the coordinates of its new vertices."));
});

test("short parts stay on the line they were written on", async () => {
  const wall = { visual: "fraction-wall", task: "Find the whole fraction family of each fraction on the fraction wall. (1) 1/4 (2) 5/6", per: "child", spec: { fractions: [1, 2, 3, 4, 6, 8, 12] }, write: ["(1) 1/4 =", "(2) 5/6 ="] };
  const render = renderOf(wall);
  const laid = await sheetPages([{ item: wall, natural: await renderPieceHtml(wall, {}), render, marks: null }], SHEET);
  assert.ok(!laid.beside, "a wide figure keeps its task above it");
  assert.strictEqual((laid.pages[0].match(/border-bottom:0\.4mm solid/g) || []).length, 2);
  assert.ok(laid.figures[0].widthMm > 250, `the wall printed ${laid.figures[0].widthMm.toFixed(0)}mm wide`);
});
