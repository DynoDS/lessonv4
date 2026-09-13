"use strict";

// Pictures the pack could not draw until 13 September 2026, when every picture
// became one shared drawing on every surface. Each draws a piece from the
// slide's own object, and one with nothing to show is skipped by name rather
// than tiled blank for every child.

const { test } = require("node:test");
const assert = require("node:assert");
const { renderPieceHtml } = require("../src/render-piece-html");
const { VISUALS } = require("../src/visual-registry");

const SLIDE_OBJECTS = {
  "line-pair": { relationship: "parallel", form: "horizontal", notation: "arrows" },
  "bar-model": { shape: "part-whole", whole: { label: "24" }, parts: [{ label: "8" }, { label: "?" }] },
  "tally-chart": { headers: ["Pet", "Tally", "Total"], rows: [{ label: "Dog", tally: 7 }], blank: true },
  pictogram: { categories: ["Blue", "Red"], values: [8, 5], key: { per: 2 } },
  "blank-surface": { surface: "number-line", start: 0, end: 100 },
  "balanced-pattern-plate": { mode: "practice", givenGroups: ["fruit-vegetables"] },
  "circuit-diagram": { circuits: [{ label: "A", state: "complete" }] },
  "circuit-symbol-bank": { items: [{ symbol: "cell", label: "cell" }, { symbol: "lamp", label: "lamp" }] },
  "parachute-forces": {},
  "bar-chart": { categories: ["Apple", "Pear"], values: [4, 6], y_interval: 2 },
  "line-graph": { points: [{ x: 0, y: 4 }, { x: 2, y: 9 }], xStep: 1 },
};

test("every picture the board shows can be printed as a piece", async () => {
  for (const [visual, spec] of Object.entries(SLIDE_OBJECTS)) {
    assert.ok(VISUALS[visual], `${visual} is in the pack's registry`);
    const piece = await renderPieceHtml({ visual, spec });
    assert.ok(piece && piece.html.includes("<svg"), `${visual} draws`);
    assert.ok(piece.widthMm > 0 && piece.heightMm > 0 && piece.heightMm < 185, `${visual} fits a page`);
  }
});

test("a symbol bank of two symbols or of four keeps its symbols the same size", async () => {
  const two = await renderPieceHtml({ visual: "circuit-symbol-bank", spec: SLIDE_OBJECTS["circuit-symbol-bank"] });
  const four = await renderPieceHtml({ visual: "circuit-symbol-bank", spec: { items: [...SLIDE_OBJECTS["circuit-symbol-bank"].items, { symbol: "wire", label: "wire" }, { symbol: "switch-open", label: "open" }] } });
  assert.strictEqual(two.heightMm, four.heightMm);
  assert.ok(Math.abs(four.widthMm - 2 * two.widthMm) < 0.01);
});

test("a chart with nothing to show, or a drawing the shared module refuses, is skipped not tiled", async () => {
  assert.strictEqual(await renderPieceHtml({ visual: "bar-chart", spec: { categories: [], values: [] } }), null);
  assert.strictEqual(await renderPieceHtml({ visual: "line-graph", spec: { points: [] } }), null);
  assert.strictEqual(await renderPieceHtml({ visual: "circuit-symbol-bank", spec: { items: [{ symbol: "resistor", label: "r" }, { symbol: "lamp", label: "lamp" }] } }), null);
  assert.strictEqual(await renderPieceHtml({ visual: "parachute-forces", spec: { largeCanopyWidthRatio: 2 } }), null);
});
