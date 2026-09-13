"use strict";

// Place value, and the two missing-number puzzles that live beside it.
//
// Every picture here is drawn once, in shared/visuals/, and the board, the wall
// and the stick-in pack place the same drawing (13 September 2026). Until then
// this file drew its own: a CSS place value chart with no column colours and a
// blue ring, a counter chart in the manipulatives' purple and red, Dienes blocks,
// counter pills, a times-table grid and a pyramid of touching bricks, each a
// different picture from the one the class had just seen on the board. The
// sheet now places the shared drawings at the width they print, and keeps only
// its typed layout (digit cards, which are words in boxes).
//
// The sheet's older spellings still draw: `place-value-counter-chart`
// ({ columns: ["thousands", ...], counts }), `times-table-grid` (`operator`),
// `number-pyramid` (rows of arrays), `counts: { thousands, ... }` for the blocks.
// Each of those reads a cell a child writes into at a handwriting size, and the
// shared drawings hold that floor on paper themselves.

const { esc } = require("./shared");
const { MM_TO_PT } = require("../../../shared/visuals/surface-profiles");
const { atPrintedWidth } = require("./at-printed-width");
const placeValueChart = require("../../../shared/visuals/place-value-chart-svg");
const placeValueMini = require("../../../shared/visuals/place-value-mini-svg");
const baseTenBlocks = require("../../../shared/visuals/base-ten-blocks-svg");
const counterGroup = require("../../../shared/visuals/counter-group-svg");
const multGrid = require("../../../shared/visuals/mult-grid-svg");
const pyramid = require("../../../shared/visuals/pyramid-svg");

// The narrowest zone a drawing can be placed in, from the drawing itself, so a
// three-chart row or a twelve-by-twelve grid asks for the page it really needs.
const counterChart = (spec) => ({ columns: spec.columns, counts: spec.counts || {}, instances: spec.instances });
const minMm = (module, floorMm) => (spec) =>
  typeof module === "function"
    ? Math.max(floorMm, placeValueChart.minWidthPt(module(spec), "worksheets") / MM_TO_PT)
    : Math.max(floorMm, module.minWidthPt(spec, "worksheets") / MM_TO_PT);

// ─── digit-cards ─────────────────────────────────────────────────────────
// "Here are four digit cards." A row of cards, one digit each. The digits are
// material handed to the child, so they carry the given colour, the same as a
// value in a data table. Typed layout, not a picture.
//
// (The Word builder calls this `digit-cards-row`.)

const CARD_W_MM = 14;
const CARD_H_MM = 12;
const CARD_GAP_MM = 2;

function digitCardsList(spec) {
  return spec.digits || [];
}

function renderDigitCards(spec) {
  const cards = digitCardsList(spec)
    .map((d) => `<span class="h-digitcard">${esc(d)}</span>`)
    .join("");
  return `<div class="h-digitcards">${cards}</div>`;
}

function measureDigitCards() {
  return CARD_H_MM + 1;
}

function needsDigitCards(spec) {
  const count = Math.max(1, digitCardsList(spec).length);
  return {
    // Six cards need more of the row than four do. The cards do not wrap,
    // since a set of digit cards reads as one set, so the width has to be
    // real.
    minWidthMm: count * CARD_W_MM + (count - 1) * CARD_GAP_MM,
    minHeightMm: CARD_H_MM + 1,
  };
}

const css = `
  /* digit-cards */
  .h-digitcards { display: flex; gap: ${CARD_GAP_MM}mm; flex-wrap: nowrap; }
  .h-digitcard {
    box-sizing: border-box;
    width: ${CARD_W_MM}mm; height: ${CARD_H_MM}mm; flex: none;
    border: var(--rule-line) solid var(--colour-ink);
    background: var(--colour-tint);
    display: flex; align-items: center; justify-content: center;
    font-size: var(--type-sectionLabel); font-weight: bold; line-height: 1.35;
    /* Handed to the child, like the values in a data table. */
    color: var(--colour-given);
  }
`;

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
  "digit-cards": {
    render: renderDigitCards,
    measure: measureDigitCards,
    needs: needsDigitCards,
    greed: 0, // cards are read, not written on
  },
  "times-table-grid": atPrintedWidth(multGrid, { minWidthMm: minMm(multGrid, 30) }),
  "number-pyramid": atPrintedWidth(pyramid, { minWidthMm: minMm(pyramid, 30) }),
};

module.exports = { helpers, css };
