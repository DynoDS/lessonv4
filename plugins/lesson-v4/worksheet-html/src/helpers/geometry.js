"use strict";

// Shapes, turns, grids, and the one helper on the whole sheet that is an
// INSTRUMENT.
//
// The ruler is drawn here as inline SVG at its true size. Every other helper in
// this file is a shared drawing (shared/visuals/) placed at the width it prints,
// the same picture the board, the wall and the stick-in pack show.

const { esc } = require("./shared");

const INK = "var(--colour-ink)";
const FONT = "var(--font)";

// Orange for anything HANDED to the child on a drawing: the arrow that marks a
// value already placed on the ruler.
const GIVEN = "var(--colour-given)";
const OBJECT = "var(--colour-question)";

// A drawing bounded by its own width gains nothing from spare page height: the
// aspect is already filled, so extra room would sit under it as blank padding.
const NEVER_STRETCH = 0;

// ─── shape, triangle-square, turn-diagram, area-grid, translation-grid ───
// Each is the one shared drawing the board, the wall and the stick-in pack
// place too, laid out at the width it prints (see at-printed-width.js). Until
// 13 September 2026 the sheet drew its own shape (an ink outline with its
// measurements), its own triangle-square and its own turn row, so a child met a
// different picture on paper from the one on the board; the area grid and the
// translation grid could not be printed at all.
//
//   shape             shared/visuals/polygon-svg.js: the board's named shapes
//                     (symmetry lines, a candidate line, fold, verdict) and the
//                     sheet's measured sides and angles
//   triangle-square   shared/visuals/triangle-square-svg.js
//   turn-diagram      shared/visuals/turn-diagram-svg.js
//   area-grid         shared/visuals/area-grid-svg.js
//   translation-grid  shared/visuals/translation-grid-svg.js

const { profileFor, MM_TO_PT } = require("../../../shared/visuals/surface-profiles");
const { atPrintedWidth } = require("./at-printed-width");
const polygonShared = require("../../../shared/visuals/polygon-svg");
const triangleSquareShared = require("../../../shared/visuals/triangle-square-svg");
const turnDiagramShared = require("../../../shared/visuals/turn-diagram-svg");
const areaGridShared = require("../../../shared/visuals/area-grid-svg");
const translationGridShared = require("../../../shared/visuals/translation-grid-svg");

const SHEET = () => profileFor("worksheets", { widthMm: 170 });
const minWidthFrom = (module) => (spec) => module.minWidthPt(spec, SHEET()) / MM_TO_PT;

// ─── ruler ───────────────────────────────────────────────────────────────
//
// A RULER IS A MEASURING INSTRUMENT, NOT A PICTURE OF ONE.
//
// Drawn by the one shared ruler (shared/visuals/ruler-svg.js), which prints at
// TRUE SIZE on paper and refuses a space too narrow for it. This file keeps the
// three things only the sheet can do, and all three have to hold together:
//
//   1. the SVG carries its width and height in real millimetres (its viewBox
//      is in points, the unit the shared drawing lays out in, so one unit
//      inside it is one point on the paper);
//   2. `.h-ruler` is its own class, NOT `.h-figure`, precisely so the
//      `width: 100%` rule that scales every other drawing cannot reach it;
//   3. `needs` reports the ruler's true width, so a zone narrower than the
//      ruler fails the fit check before anything is drawn.
//
// If you change any of those, change all three. Scaling this drawing is not a
// layout compromise; it is a wrong answer printed on a child's sheet.

const rulerShared = require("../../../shared/visuals/ruler-svg");

// The shared drawing at the zone's width, restated in millimetres on the tag.
function inMillimetres(helper) {
  const draw = (spec, width) => {
    const mm = typeof width === "number" ? width : width && width.widthMm;
    // Never narrower than the ruler itself: the fit check has already refused a
    // zone that cannot hold it, so a caller that passes no width gets the ruler.
    const widthMm = Math.max(mm > 0 ? mm : 0, rulerShared.trueWidthMm(spec));
    return helper.geometry.tightSvg(spec, profileFor("worksheets", { widthMm }));
  };
  return {
    ...helper,
    render: (spec, width) => {
      const { svg, w, h } = draw(spec, width);
      const W = (w / MM_TO_PT).toFixed(2);
      const H = (h / MM_TO_PT).toFixed(2);
      const sized = svg.replace(/^<svg ([^>]*?)width="[^"]*" height="[^"]*"/, `<svg $1width="${W}mm" height="${H}mm" style="width:${W}mm;height:${H}mm"`);
      return `<div class="h-ruler">${sized}</div>`;
    },
    // The width barely matters and that is the point: a ruler is the same
    // height at every width because it is the same size at every width.
    measure: (spec, width) => draw(spec, width).h / MM_TO_PT,
  };
}

// ─── styling ─────────────────────────────────────────────────────────────
// The shared drawings are pinned to their printed size by at-printed-width.js,
// so they need nothing here.
//
// The ruler needs its own class and one rule: hands off. No padding, border or
// margin appears below, which is what lets `measure` return the SVG's own
// height and be exactly right. `display: block` matters as much as the size: an
// inline SVG sits on a text baseline and collects a descender's worth of space
// underneath it, which is height nobody measured.
const css = `
  .h-ruler { display: block; }

  /* No width rule. The SVG carries its true size in millimetres and must keep
     it: scaled to fit a zone, its centimetres would no longer be centimetres
     and every measurement a child read off it would be wrong. */
  .h-ruler svg { display: block; }
`;

const helpers = {
  shape: atPrintedWidth(polygonShared, { minWidthMm: minWidthFrom(polygonShared) }),
  // A printed puzzle is a question, so exactly one shape must be the unknown
  // (the board may show it finished).
  "triangle-square": atPrintedWidth(triangleSquareShared, {
    toSpec: triangleSquareShared.refuseUnlessOneBlank,
    minWidthMm: minWidthFrom(triangleSquareShared),
  }),
  "turn-diagram": atPrintedWidth(turnDiagramShared, { minWidthMm: minWidthFrom(turnDiagramShared) }),
  "area-grid": atPrintedWidth(areaGridShared, { minWidthMm: 70 }),
  "translation-grid": atPrintedWidth(translationGridShared, { minWidthMm: 60 }),
  // Zero greed, and not for the usual reason. The others refuse spare height
  // because they would gain nothing by it; this one refuses because taking it
  // would make the ruler lie.
  ruler: inMillimetres(atPrintedWidth(rulerShared, { minWidthMm: (spec) => rulerShared.trueWidthMm(spec) })),
};

module.exports = { helpers, css };
