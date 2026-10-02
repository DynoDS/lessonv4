"use strict";

// A taught word's braces never print from a figure (the colours release's third
// check, 25 September 2026). Every stick-in piece is a figure, and the pack
// hands it over without a taught word's braces, so the word prints plain. These
// read the drawn picture's own text.

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { renderPieceHtml } = require("../src/render-piece-html");
const { renderMoments, buildHtml } = require("../build");

function svgText(piece) {
  assert.ok(piece, "the piece drew nothing");
  const svgs = piece.html.match(/<svg[\s\S]*?<\/svg>/g) || [];
  assert.ok(svgs.length, "no picture was drawn");
  return svgs.join("\n");
}

test("a Venn in the stick-in pack draws its taught words plain", async () => {
  const drawn = svgText(await renderPieceHtml({
    visual: "venn",
    spec: { label1: "{{even}}", label2: "multiple of {{three}}", shapes: [{ region: "overlap", label: "{{six}}" }] },
  }));
  assert.ok(!/\{\{|\}\}/.test(drawn), "a taught word's braces are in the drawn Venn");
  assert.ok(drawn.includes("even") && drawn.includes("six"), "the words themselves are drawn");
});

test("a labelled diagram in the stick-in pack draws its taught words plain", async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stickin-marks-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, "tooth.svg"), '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"><rect width="40" height="30" fill="#ddd"/></svg>');
  const drawn = svgText(await renderPieceHtml({
    visual: "label-diagram",
    spec: { image: "tooth.svg", callouts: [{ anchor: [50, 30], label: "{{enamel}}", given: true }, { anchor: [40, 70], label: "the {{root}}", given: true }] },
  }, { baseDir: dir }));
  assert.ok(!/\{\{|\}\}/.test(drawn), "a taught word's braces are in the drawn diagram");
  assert.ok(drawn.includes("enamel") && drawn.includes("root"), "the words themselves are drawn");
});

test("a full-page piece prints its task with a taught word plain", async () => {
  // The fourth check: the page once printed "Sort the {{quadrilaterals}}" as written.
  // Since 1 October 2026 a piece prints as a whole page under its task.
  const { figurePages } = require("../src/render-activity-page");
  const { renderPieceHtml } = require("../src/render-piece-html");
  const item = { visual: "venn", label: "Sort the {{quadrilaterals}}", spec: { label1: "even", label2: "odd" } };
  const natural = await renderPieceHtml(item, {});
  const laid = await figurePages(item, natural, (widthMm) => renderPieceHtml({ ...item, widthMm }, {}), {
    printableWMm: 277, printableHMm: 185, classSize: 2, pageHtml: (c, b) => `<div class="page">${b}</div>`,
  });
  const html = laid.pages.join("");
  assert.ok(!/\{\{|\}\}/.test(html), "a taught word's braces reached the page");
  assert.ok(html.includes("Sort the quadrilaterals"), "the task is printed on the page");
});
