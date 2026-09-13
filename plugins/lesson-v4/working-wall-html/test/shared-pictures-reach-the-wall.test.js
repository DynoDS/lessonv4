"use strict";

// Pictures the wall could not draw until 13 September 2026, when every picture
// became one shared drawing on every surface: a labelled photograph, the circuit
// symbol key and the draw-your-own surface. Each must render on a card from the
// same fields the slide uses.

const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");

const { preRenderSvgs, calloutKeySuffix } = require("../src/svg-renderer");
const { VISUAL_KEY_FNS, pickVisual } = require("../src/visuals");

const PHOTO_DIR = path.join(__dirname, "..", "test-fixtures-a3");

const LABELLED = {
  type: "label-diagram",
  imagePath: "photos/pizza.jpg",
  layout: "sides",
  callouts: [{ anchor: [30, 40], label: "crust", given: true }],
};
const BANK = { type: "circuit-symbol-bank", items: [{ symbol: "cell", label: "cell" }, { symbol: "lamp", label: "lamp" }] };
const SURFACE = { type: "blank-surface", surface: "bar", bars: 2 };

test("a labelled photograph, the symbol key and a blank surface draw on a wall card", async () => {
  const cards = [LABELLED, BANK, SURFACE].map((visual) => ({ visual }));
  const images = await preRenderSvgs({ cards }, PHOTO_DIR);
  for (const visual of [LABELLED, BANK, SURFACE]) {
    const placed = pickVisual(visual, { svgImages: images });
    assert.ok(placed && placed.buf && placed.buf.length > 0, `${visual.type} has a picture`);
  }
});

test("a labelled photograph's callouts are its own picture, not a second overlay", () => {
  assert.equal(calloutKeySuffix(LABELLED), "");
  assert.ok(VISUAL_KEY_FNS["label-diagram"]);
});

test("a labelled photograph whose file cannot be read fails the build by name", async () => {
  await assert.rejects(
    () => preRenderSvgs({ cards: [{ visual: { ...LABELLED, imagePath: "photos/missing.jpg" } }] }, PHOTO_DIR),
    /label-diagram names the picture "photos\/missing.jpg"/
  );
});
