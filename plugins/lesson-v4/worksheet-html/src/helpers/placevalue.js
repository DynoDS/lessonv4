"use strict";

// Place value, and the two missing-number puzzles that live beside it.
//
// Every picture here is drawn once, in shared/visuals/, and the board, the wall
// and the stick-in pack place the same drawing (13 September 2026). Until then
// this file drew its own: a CSS place value chart with no column colours and a
// blue ring, a counter chart in the manipulatives' purple and red, Dienes blocks,
// counter pills, a times-table grid and a pyramid of touching bricks, each a
// different picture from the one the class had just seen on the board. The
// sheet now places the shared drawings at the width they print. The digit
// cards were the last typed boxes here until 2 October 2026, when a number drawn
// as cards with its working marked on it became one shared drawing; the sheet's
// loose `digits` row ("here are four digit cards") is drawn by it too.
//
// The sheet's older spellings still draw: `place-value-counter-chart`
// ({ columns: ["thousands", ...], counts }), `times-table-grid` (`operator`),
// `number-pyramid` (rows of arrays), `counts: { thousands, ... }` for the blocks.
// Each of those reads a cell a child writes into at a handwriting size, and the
// shared drawings hold that floor on paper themselves.

const { MM_TO_PT } = require("../../../shared/visuals/surface-profiles");
const { atPrintedWidth } = require("./at-printed-width");
const placeValueChart = require("../../../shared/visuals/place-value-chart-svg");
const placeValueMini = require("../../../shared/visuals/place-value-mini-svg");
const baseTenBlocks = require("../../../shared/visuals/base-ten-blocks-svg");
const counterGroup = require("../../../shared/visuals/counter-group-svg");
const multGrid = require("../../../shared/visuals/mult-grid-svg");
const pyramid = require("../../../shared/visuals/pyramid-svg");
const digitCards = require("../../../shared/visuals/digit-cards-svg");

// The narrowest zone a drawing can be placed in, from the drawing itself, so a
// three-chart row or a twelve-by-twelve grid asks for the page it really needs.
const counterChart = (spec) => ({ columns: spec.columns, counts: spec.counts || {}, instances: spec.instances });
const minMm = (module, floorMm) => (spec) =>
  typeof module === "function"
    ? Math.max(floorMm, placeValueChart.minWidthPt(module(spec), "worksheets") / MM_TO_PT)
    : Math.max(floorMm, module.minWidthPt(spec, "worksheets") / MM_TO_PT);

// ─── digit-cards ─────────────────────────────────────────────────────────
// A number as large digit cards with the working of a digit check marked on
// it, or the loose cards a child makes numbers from. The shared drawing prints
// the question (`text`) itself, at the sheet's figure size, and is never
// narrower than its cards at their natural size: a card squeezed below that is
// a digit a child cannot circle.
const digitCardsMinMm = (spec) => Math.ceil(digitCards.maxWidthPt(spec, "worksheets") / MM_TO_PT);

const helpers = {
  "base-ten-blocks": atPrintedWidth(baseTenBlocks, { minWidthMm: minMm(baseTenBlocks, 60) }),
  // The counters on their own, under the claim they are evidence for: a counter
  // is a fixed object, so height above it is a hole and it never stretches.
  "counter-group": atPrintedWidth(counterGroup, { requires: ["groups"], minWidthMm: minMm(counterGroup, 20) }),
  // Always the counter form: with no counts it is the empty chart a child draws
  // counters into, never a chart of digits.
  "place-value-counter-chart": atPrintedWidth(placeValueChart, { minWidthMm: minMm(counterChart, 40), toSpec: counterChart }),
  "place-value-chart": atPrintedWidth(placeValueChart, { minWidthMm: minMm(placeValueChart, 30) }),
  "place-value-mini": atPrintedWidth(placeValueMini, { minWidthMm: 40 }),
  "digit-cards": atPrintedWidth(digitCards, { minWidthMm: digitCardsMinMm }),
  "times-table-grid": atPrintedWidth(multGrid, { minWidthMm: minMm(multGrid, 30) }),
  "number-pyramid": atPrintedWidth(pyramid, { minWidthMm: minMm(pyramid, 30) }),
};

// Every picture here is a shared drawing, so the file adds no styling of its own.
const css = "";

module.exports = { helpers, css };
