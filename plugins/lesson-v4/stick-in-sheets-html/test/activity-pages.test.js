"use strict";

// A printed activity is a page (the teacher, 1 October 2026): the task at the
// top like a mini worksheet, full page, one between two, two to a page when
// that keeps the figure its size, and no cutting unless cutting is the task.

const test = require("node:test");
const assert = require("node:assert/strict");
const { figurePages, normaliseTaskSheet, taskSheetPages } = require("../src/render-activity-page");
const { renderPieceHtml } = require("../src/render-piece-html");

const PAGE = { printableWMm: 277, printableHMm: 185, classSize: 32, pageHtml: (c, b) => `<div class="page">${b}</div>` };

async function laidFigure(item) {
  const natural = await renderPieceHtml(item, {});
  return figurePages(item, natural, (widthMm) => renderPieceHtml({ ...item, widthMm }, {}), PAGE);
}

test("a tall figure takes the whole page under its task, one copy between two", async () => {
  const laid = await laidFigure({ visual: "venn", task: "Sort the shapes.", spec: { label1: "even", label2: "odd" } });
  assert.strictEqual(laid.perPage, 1);
  assert.strictEqual(laid.pages.length, 16);
  assert.match(laid.pages[0], /Sort the shapes\./);
  assert.ok(laid.widthMm > 150, `the figure was printed ${laid.widthMm}mm wide, not grown to the page`);
});

// A task that says "using the key" needs the key on the paper: the board's
// key goes when its slide does (the teacher, 11 October 2026).
test("a piece's key prints in one plain line under its task, and only when it has one", async () => {
  const text = {
    visual: "annotated-text",
    task: "Mark up the rest of the text, using the key.",
    spec: { passage: "Dogs make good pets because they keep you company. On the other hand, they cost a lot to feed.", space: "annotate" },
  };
  const keyed = await laidFigure({ ...text, key: "box = a point  ·  underline = a reason" });
  assert.match(keyed.pages[0], /using the key\.<\/div><div[^>]*>Key: box = a point/);
  assert.match(keyed.pages[0], /annotated-text-frame/);
  const plain = await laidFigure(text);
  assert.doesNotMatch(plain.pages[0], /Key:/);
  assert.ok(keyed.heightMm <= plain.heightMm, "the key took no room from the text beneath it");
});

test("a short wide figure prints two to a page with a line to trim between them", async () => {
  const laid = await laidFigure({ visual: "number-line", task: "Mark 45 on the line.", spec: { start: 0, end: 100, step: 10 } });
  assert.strictEqual(laid.perPage, 2);
  assert.strictEqual(laid.pages.length, 8);
  assert.match(laid.pages[0], /dashed/);
});

test("a task sheet prints the task, the named child's words and ruled lines to the bottom", () => {
  const sheet = normaliseTaskSheet({
    visual: "task-sheet",
    label: "Prove Sam wrong",
    spec: { task: "Sam is wrong. Prove it.", material: { speaker: "Sam", text: "Every {{rectangle}} is a square." }, per: "pair" },
  });
  const laid = taskSheetPages(sheet, PAGE);
  assert.strictEqual(laid.pages.length, 16);
  const html = laid.pages[0];
  assert.match(html, /Sam is wrong\. Prove it\./);
  assert.match(html, /Sam says:/);
  assert.match(html, /Every rectangle is a square\./, "a taught word prints plain");
  assert.ok((html.match(/border-bottom:0\.3mm solid/g) || []).length >= 6, "the rest of the page is lines to write on");
});

test("a task sheet with no task, or a picture that is not there, is refused by name", () => {
  assert.match(normaliseTaskSheet({ visual: "task-sheet", spec: {} }), /needs `task`/);
  const sheet = normaliseTaskSheet({ visual: "task-sheet", spec: { task: "Caption this.", material: { imagePath: "nowhere.png" } } });
  assert.match(taskSheetPages(sheet, PAGE).error, /was not found/);
});
