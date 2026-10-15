"use strict";

// The coordinate grid in the pack is told the height it prints at.
//
// Its axis numbers were a fixed third of a square, which on a ten-square grid
// 88mm tall printed them under 8pt. The shared drawing sizes them for the
// surface when the surface says how big the grid prints, so the pack says.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { VISUALS } = require("../src/visual-registry");
const coordinateGrid = require("../../shared/visuals/coordinate-grid-svg");
const { profileFor, PROFILES } = require("../../shared/visuals/surface-profiles");

const MINUS = "−";
const FOUR = { cols: 5, rows: 5, min: -5, shapes: [{ points: [[1, 2], [4, 2], [1, 5]], labels: ["A", "B", "C"] }] };

test("a ten-square piece prints its axis numbers at the pack's type size, in ink", () => {
  const piece = VISUALS["coordinate-grid"];
  const drawn = piece.tightSvg(FOUR);
  const sized = coordinateGrid.describeLayout(FOUR, profileFor("stickin", { widthMm: 277, heightMm: piece.fitHeightMm }));
  assert.ok(Math.abs(sized.numberPt - PROFILES.stickin.fontPt) < 0.3, `the numbers print at ${sized.numberPt.toFixed(1)}pt`);
  assert.ok(sized.textScale > 1.2, "the piece was not told its height");
  assert.ok(drawn.svg.includes(`font-size="${(34 * sized.textScale).toFixed(2)}"`), "the pack drew the grid without its printed height");
  assert.ok(Math.abs(drawn.h - piece.fitHeightMm * (72 / 25.4)) < 0.01, "the piece is not laid out for the height it prints at");
  assert.doesNotMatch(drawn.svg, /#C00000|#0070C0|#CCE2F5/, "the piece kept a board colour");
  assert.ok(drawn.svg.includes(`>${MINUS}5<`), "the negative numbers are missing");
});
