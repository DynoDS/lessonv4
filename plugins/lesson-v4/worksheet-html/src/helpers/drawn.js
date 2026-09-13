"use strict";

// Drawings built as inline SVG rather than the picture-of-a-picture the
// Word builder needs. On paper an SVG stays sharp at any size and needs no
// image library, so the geometry is lifted from the Word builder's own
// clock-face.js, number-line.js and fraction-bar.js, and everything to do with
// `sharp`, DPI multipliers and PNG buffers is dropped. The drawing itself
// (proportions, stroke weights, Comic Sans labels) is kept identical.
//
// Every builder below returns { svg, aspect, ...whatever `needs` reuses }, so
// `measure` and `needs` both work from the SAME geometry the render used:
// nothing is guessed twice and the two numbers cannot drift apart.

const { esc, heightFromAspect } = require("./shared");
const jumpsGeo = require("../../../shared/visuals/number-line-jumps");

const INK = "var(--colour-ink)";
const FONT = "var(--font)";

// All three drawings size themselves by their own aspect ratio and the width
// the zone actually gives them. None of them read better for extra SPARE
// height once that aspect is filled: the picture is bounded by its width, so
// idle vertical room would only sit under it as blank padding rather than
// make the drawing bigger. Hence greed: 0 on all three.
const NEVER_STRETCH = 0;

// ─── clock-row ─────────────────────────────────────────────────────────
// A row of analogue clock faces, each with hands or left blank for the child
// to draw: the one shared clock (shared/visuals/clock-svg.js) the board, the
// wall and the stick-in pack place too, laid out at the width it prints. The
// sheet drew its own faces until 13 September 2026.
const clockShared = require("../../../shared/visuals/clock-svg");
const { atPrintedWidth } = require("./at-printed-width");
const { profileFor, MM_TO_PT } = require("../../../shared/visuals/surface-profiles");

// Every face in the row keeps numerals at the sheet's readable floor, so a row
// of six asks for six faces' worth of paper rather than shrinking them.
function clockRowMinWidthMm(spec) {
  return clockShared.minWidthPt(spec, profileFor("worksheets", { widthMm: 170 })) / MM_TO_PT;
}

// ─── number-line ────────────────────────────────────────────────────────
// Drawn by the one shared number line (shared/visuals/number-line-svg.js),
// which the board, the wall and the stick-in pack place too. It is laid out at
// the width the zone really prints, so its numerals are a real size rather than
// a size that shrinks with the zone; the sheet's own spec fields (boxes, arrows,
// caption, unit, object, subLabel) all mean the same thing there. This sheet
// drew its own line until 13 September 2026, and every repair made to it
// reached no other surface.
const numberLineShared = require("../../../shared/visuals/number-line-svg");

// Each printed label needs room either side of it not to collide with its
// neighbour; each box or arrow needs enough width that two adjacent ones do not
// touch. Whichever is the tighter constraint wins.
function numberLineMinWidthMm(spec) {
  const lines = numberLineShared.normalise(spec);
  const labelCount = Math.max(...lines.map((l) => l.labels.length));
  const featureCount = Math.max(...lines.map((l) => Math.max(l.boxes.length, l.arrows.length, l.jumps.length)));
  return Math.max(70, labelCount * 14, featureCount * 22);
}

// ─── fraction-bar ───────────────────────────────────────────────────────
// Drawn by the one shared shaded fraction (shared/visuals/shaded-fraction-svg.js),
// which the board, the wall and the stick-in pack place too, laid out at the
// width the zone prints. The sheet's own spelling (bars of numerator and
// denominator with a label under each) is read there, and a bar may now be a
// grid or a circle as it is on the board. This sheet drew its own bars, shaded
// question blue at a third opacity, until 13 September 2026, while the board
// shaded the same quarter soft green.
const shadedFractionShared = require("../../../shared/visuals/shaded-fraction-svg");

// A part narrower than this loses its divider line into one smudge, so the bar
// with the most parts sets the floor.
const FRACTION_CELL_MIN_MM = 8;

function fractionBarMinWidthMm(spec) {
  const shape = shadedFractionShared.normalise(spec);
  const parts = shape.bars ? Math.max(...shape.bars.map((b) => b.parts)) : 0;
  return Math.max(60, parts * FRACTION_CELL_MIN_MM);
}

// ─── fraction-wall ──────────────────────────────────────────────────────
// Rows of unit fractions under one whole, drawn by the shared fraction wall
// (shared/visuals/fraction-wall-svg.js) the board places. Only the board could
// draw one until 13 September 2026. Its smallest pieces have to hold their
// names at the sheet's readable size, so the row with the most pieces sets the
// floor: 6mm a piece holds a stacked "12" at 9pt.
const fractionWallShared = require("../../../shared/visuals/fraction-wall-svg");
const FRACTION_WALL_PIECE_MIN_MM = 6;

function fractionWallMinWidthMm(spec) {
  return Math.max(60, Math.max(...fractionWallShared.normalise(spec).fractions) * FRACTION_WALL_PIECE_MIN_MM);
}

// `.h-figure` is styled once, in render.js, for every SVG-backed helper, so
// there is nothing per-drawing to add here.
const css = "";

const helpers = {
  "clock-row": atPrintedWidth(clockShared, { minWidthMm: clockRowMinWidthMm }),
  "number-line": atPrintedWidth(numberLineShared, { minWidthMm: numberLineMinWidthMm }),
  "fraction-bar": atPrintedWidth(shadedFractionShared, { minWidthMm: fractionBarMinWidthMm }),
  "fraction-wall": atPrintedWidth(fractionWallShared, { minWidthMm: fractionWallMinWidthMm }),
};

module.exports = { helpers, css };
