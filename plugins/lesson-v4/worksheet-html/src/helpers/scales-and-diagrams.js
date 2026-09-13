"use strict";

// The measuring scales and the thinking diagrams the board drew and paper could
// not: a dial scale, a measuring jug, a number network, a concept map, a
// fishbone, a continuum line and a source pathway.
//
// Each is the one shared drawing in shared/visuals/, the same one the board, the
// wall and the stick-in pack place, and it reached paper when every picture
// became one shared drawing reachable from every surface (13 September 2026:
// "it stops anything having to be built because 'it can't use that one'").
// Whether a sheet uses one is the worksheet designer's decision; the sheet only
// has to be able to draw it.
//
// What stays here is the sheet's own typed text: a question above the drawing
// (`text`) and a scale's caption under it (`label`), both set as sheet text so
// they wrap and print at the sheet's body size.

const { esc, linesFor, LINE_MM } = require("./shared");
const { atPrintedWidth } = require("./at-printed-width");
const dialScaleShared = require("../../../shared/visuals/dial-scale-svg");
const measuringJugShared = require("../../../shared/visuals/measuring-jug-svg");
const numberNetworkShared = require("../../../shared/visuals/number-network-svg");
const conceptMapShared = require("../../../shared/visuals/concept-map-svg");
const fishboneShared = require("../../../shared/visuals/fishbone-svg");
const continuumLineShared = require("../../../shared/visuals/continuum-line-svg");
const sourcePathwayShared = require("../../../shared/visuals/source-pathway-svg");

const WIDEST_ZONE_MM = 261;

function lineMm(text, widthMm) {
  return text ? linesFor(text, widthMm) * LINE_MM + 2 : 0;
}

// A question above and a caption below, as sheet text around the drawing.
function withSheetText(helper, { caption = false } = {}) {
  const below = (spec) => (caption && spec.label ? String(spec.label) : "");
  const textMm = (spec, widthMm) => lineMm(spec.text, widthMm) + lineMm(below(spec), widthMm);
  return {
    ...helper,
    render: (spec, width) => {
      const figure = helper.render(spec, width);
      if (!spec.text && !below(spec)) return figure;
      return (
        `<div class="h-figure-block">` +
        (spec.text ? `<p class="h-figure-stem">${esc(spec.text)}</p>` : "") +
        figure +
        (below(spec) ? `<p class="h-figure-stem h-figure-caption">${esc(below(spec))}</p>` : "") +
        `</div>`
      );
    },
    measure: (spec, width) => {
      const mm = typeof width === "number" ? width : width && width.widthMm;
      return textMm(spec, mm || WIDEST_ZONE_MM) + helper.measure(spec, width);
    },
    needs: (spec, width) => {
      const inner = helper.needs(spec, width);
      // Words wrap onto more lines in a narrower zone, so the shortest this can
      // come out is whichever of the narrowest and widest zones is shorter.
      const atNarrowest = inner.minHeightMm + textMm(spec, inner.minWidthMm);
      const atWidest = helper.measure(spec, WIDEST_ZONE_MM) + textMm(spec, WIDEST_ZONE_MM);
      return { ...inner, minHeightMm: Math.min(atNarrowest, atWidest) };
    },
  };
}

// The sheet's text is its own, so the drawing is handed the spec without it. A
// network's `label` stays in, because it tells the drawing to leave out its own
// target sentence.
const withoutText = (spec) => ({ ...spec, text: undefined });
const withoutCaption = (spec) => ({ ...spec, text: undefined, label: undefined });

const css = `
  .h-figure-caption { margin: var(--space-tight) 0 0; text-align: center; font-weight: bold; }
`;

const helpers = {
  // A dial a child reads needs about 45mm across before its numbers crowd.
  "dial-scale": withSheetText(atPrintedWidth(dialScaleShared, { toSpec: withoutCaption, minWidthMm: 45 }), { caption: true }),
  "measuring-jug": withSheetText(atPrintedWidth(measuringJugShared, { toSpec: withoutCaption, minWidthMm: 35 }), { caption: true }),
  "number-network": withSheetText(atPrintedWidth(numberNetworkShared, { toSpec: withoutText, minWidthMm: 50 }), { caption: true }),
  "concept-map": withSheetText(atPrintedWidth(conceptMapShared, { toSpec: withoutText, minWidthMm: 120 })),
  fishbone: withSheetText(atPrintedWidth(fishboneShared, { toSpec: withoutText, minWidthMm: 140 })),
  "continuum-line": withSheetText(atPrintedWidth(continuumLineShared, { toSpec: withoutText, minWidthMm: 90 })),
  "source-pathway": withSheetText(atPrintedWidth(sourcePathwayShared, { toSpec: withoutText, minWidthMm: 110 })),
};

module.exports = { helpers, css };
