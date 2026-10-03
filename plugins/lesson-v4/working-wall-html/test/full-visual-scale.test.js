"use strict";

// `visualScale: "full"`: the picture is the sheet, the panel a strip above it.
//
// Built for a marked model text (2 October 2026). Placed `dominant`, beside a
// panel holding one sentence, the renga a Year 6 class writes from printed a
// size or two over the floor with most of its column empty, because a passage
// is wide and the column is not. These pin what the option promises: the panel
// runs the full width, the picture is offered almost all the height whatever
// its shape, and the existing `dominant` and default cards are unchanged.

const test = require("node:test");
const assert = require("node:assert/strict");

const style = require("../style.json");
const { panelFractionFor, wideVisualReserveInches, WIDE_VISUAL_SHARE_GENEROUS } = require("../src/visuals");
const { printableInches } = require("../src/layout");

// A resolved picture of a chosen shape, without a pre-render.
const card = (visualScale, aspect) => ({
  page: { size: "A3", orientation: "landscape" },
  visualScale,
  visual: { type: "annotated-text", _educationalSvgBuffer: Buffer.from("x"), _educationalSvgAspect: aspect },
});

test("a full card gives the panel the whole width", () => {
  assert.equal(panelFractionFor(card("full", 1.9), {}, false), 1.0);
  assert.equal(panelFractionFor(card("dominant", 1.9), {}, false), 0.32);
});

test("a full card offers its picture far more than a stacked wide figure gets", () => {
  const dims = printableInches("A3", "landscape", style);
  const full = wideVisualReserveInches(card("full", 1.9), {}, style, () => true);
  assert.ok(full > dims.height * WIDE_VISUAL_SHARE_GENEROUS + 0.25 + 1, `full reserved only ${full}in of ${dims.height}in`);
  const stacked = wideVisualReserveInches(card(undefined, 1.9), {}, style, () => true);
  assert.ok(full > stacked, "a full card reserved no more than an ordinary stacked one");
});

test("a full card is stacked whatever its picture's shape", () => {
  // A tall picture is never stacked on an ordinary card; on a full one it is.
  assert.equal(wideVisualReserveInches(card(undefined, 0.8), {}, style, () => true), 0);
  assert.ok(wideVisualReserveInches(card("full", 0.8), {}, style, () => true) > 0);
});

test("a full card still keeps its panel's text above the floor", () => {
  const dims = printableInches("A3", "landscape", style);
  const guaranteed = Math.min((dims.width * 0.96) / 1.9, dims.height * 0.21) + 0.25;
  const tight = wideVisualReserveInches(card("full", 1.9), {}, style, () => false);
  assert.ok(tight <= guaranteed + 0.001, `a panel that cannot afford more was charged for it (${tight})`);
});

test("a dominant card keeps its picture beside the panel", () => {
  assert.equal(wideVisualReserveInches(card("dominant", 1.9), {}, style, () => true), 0);
});
