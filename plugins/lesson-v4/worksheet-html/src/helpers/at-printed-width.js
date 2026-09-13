"use strict";

// A worksheet helper for a shared drawing that lays itself out at the width it
// prints (see shared/visuals/surface-profiles.js). The one way the sheet places
// such a drawing, so every picture moved into shared/visuals/ reaches paper the
// same way the number line did (13 September 2026).
//
//   atPrintedWidth(module, { toSpec, minWidthMm, greed, requires })
//
// `toSpec` maps a sheet spec onto the shared module's fields when they differ;
// by default the spec is passed as it is, because a shared drawing reads the
// board's field names and each surface's older ones alike. The helper is marked
// `physical`, so the scale-with-the-zone legibility floor is not applied: the
// drawing holds its own readable floor in points.

const { profileFor, MM_TO_PT } = require("../../../shared/visuals/surface-profiles");

const NEVER_STRETCH = 0;

function widthOf(width, fallbackMm) {
  const mm = typeof width === "number" ? width : width && width.widthMm;
  return mm > 0 ? mm : fallbackMm;
}

function atPrintedWidth(module, options = {}) {
  const toSpec = options.toSpec || ((spec) => spec);
  const minWidth = options.minWidthMm || 70;
  const draw = (spec, width) =>
    module.tightSvg(toSpec(spec), profileFor("worksheets", { widthMm: widthOf(width, 170) }));
  const minWidthOf = (spec) => (typeof minWidth === "function" ? minWidth(spec) : minWidth);
  const helper = {
    physical: true,
    geometry: module,
    render: (spec, width) => {
      const built = draw(spec, width);
      // The sheet's `.h-figure svg { width: 100% }` would stretch a drawing that
      // lays out narrower than its zone, so it prints at its own width.
      const svg = built.svg.replace(/^<svg /, `<svg style="width:${built.w}pt;max-width:100%;height:auto" `);
      return `<div class="h-figure">${svg}</div>`;
    },
    measure: (spec, width) => { const floor = minWidthOf(spec); return draw(spec, Math.max(widthOf(width, 170), floor)).h / MM_TO_PT; },
    needs: (spec) => {
      const minWidthMm = minWidthOf(spec);
      return { minWidthMm, minHeightMm: draw(spec, minWidthMm).h / MM_TO_PT };
    },
    greed: options.greed == null ? NEVER_STRETCH : options.greed,
  };
  if (options.requires) helper.requires = options.requires;
  return helper;
}

module.exports = { atPrintedWidth };
