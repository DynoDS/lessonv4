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

test("a one-moment pack's page caption prints a marked label plain", async () => {
  // The fourth check: the caption printed "Sort the {{quadrilaterals}}" as written.
  const { moments } = await renderMoments([
    { visual: "venn", label: "Sort the {{quadrilaterals}}", spec: { label1: "even", label2: "odd" } },
  ], __dirname);
  const { html } = buildHtml(moments, 2);
  const captions = html.match(/<div class="caption">[\s\S]*?<\/div>/g) || [];
  assert.ok(captions.length, "no page caption");
  assert.ok(captions.every((c) => !/\{\{|\}\}/.test(c)), captions.join("\n"));
  assert.ok(captions[0].includes("Sort the quadrilaterals"), captions[0]);
});
