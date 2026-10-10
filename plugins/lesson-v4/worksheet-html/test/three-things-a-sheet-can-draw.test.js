"use strict";

// Three things a sheet could not draw (stress test, 7 October 2026), each
// asked for by the teacher from a picture of a real page (10 October 2026): a
// bold word inside a sentence, a second line in a table heading, and a line
// across a drawing box.

const { test } = require("node:test");
const assert = require("node:assert");

const { renderContent, measureContent } = require("../src/helpers");
const { checkWorksheet } = require("../src/worksheet");
const { linesFor } = require("../src/helpers/shared");

test("words typed **like this** print bold in any text a sheet prints, and the marks never print", () => {
  const line = renderContent({ helper: "instruction", text: "The fox had a drink **by the pond**." }, 170);
  assert.match(line, /The fox had a drink <strong>by the pond<\/strong>\./);
  assert.ok(!line.includes("**"));
  const question = renderContent({ helper: "questions", items: [{ text: "Move **at midnight** to the front.", lines: 1 }] }, 170);
  assert.match(question, /<strong>at midnight<\/strong>/);
  // The marks take no room, and a lone pair of stars is left as typed.
  assert.strictEqual(linesFor("The fox had a drink **by the pond**.", 170), linesFor("The fox had a drink by the pond.", 170));
  assert.ok(renderContent({ helper: "instruction", text: "Work out 3 ** 2." }, 170).includes("**"));
});

test("a sheet with a bold word passes the check that its words reach the page", () => {
  const problems = checkWorksheet({
    meta: { lesson: "X", yearGroup: 4 },
    sheets: { expected: { layout: "full", zones: { a: { helper: "instruction", text: "The fox had a drink **by the pond**." } } } },
  });
  assert.deepEqual(problems, []);
});

const TABLE = {
  helper: "recording-table",
  columns: ["Rock", "Appearance\nWhat does it look like?", "Hardness"],
  rows: [["A Granite"], ["B Chalk"]],
};

test("a table heading can carry a second line, small and quiet under the first", () => {
  const html = renderContent(TABLE, 170);
  assert.match(html, />Appearance<span class="h-th-under">What does it look like\?<\/span><\/th>/);
  assert.match(html, />Hardness<\/th>/, "a one-line heading is as it was");
  const plain = { ...TABLE, columns: ["Rock", "Appearance", "Hardness"] };
  assert.ok(measureContent(TABLE, 170) > measureContent(plain, 170), "the taller heading is counted");
});

test("a drawing box can carry one named line across it", () => {
  const html = renderContent({ helper: "drawing-space", text: "Draw a plant growing in the soil.", heightMm: 68, line: "soil" }, 170);
  assert.match(html, /<div class="h-draw-line" style="top:60\.0%"><\/div><span class="h-draw-line-name" style="top:60\.0%">soil<\/span>/);
  const lower = renderContent({ helper: "drawing-space", heightMm: 68, line: true, lineAt: 0.75 }, 170);
  assert.match(lower, /top:75\.0%/);
  assert.ok(!lower.includes("h-draw-line-name"), "a bare line has no name");
  assert.ok(!renderContent({ helper: "drawing-space", heightMm: 68 }, 170).includes("h-draw-line\""), "no line unless asked");
});

test("a line nowhere near the middle, or a line with side-by-side areas, is refused by name", () => {
  assert.throws(() => renderContent({ helper: "drawing-space", heightMm: 68, line: "soil", lineAt: 0.95 }, 170), /lineAt/);
  assert.throws(() => renderContent({ helper: "drawing-space", heightMm: 68, line: "soil", areas: ["Left", "Right"] }, 170), /areas.*line/);
});
