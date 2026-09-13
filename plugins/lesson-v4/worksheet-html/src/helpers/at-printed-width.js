"use strict";

// A worksheet helper for a shared drawing that lays itself out at the width it
// prints (see shared/visuals/surface-profiles.js). The one way the sheet places
// such a drawing, so every picture moved into shared/visuals/ reaches paper the
// same way the number line did (13 September 2026).
//
//   atPrintedWidth(module, { toSpec, minWidthMm, grow, greed, requires })
//
// `grow` lets a drawing enlarge its words into a zone wider than it needs, up
// to that factor of the sheet's type size, the way the board's profile does. A
// drawing that reads the profile's `grow` then fills a wide zone as a bigger
// picture instead of a small one with paper to spare beside it.
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
  const minWidthOf = (spec) => (typeof minWidth === "function" ? minWidth(spec) : minWidth);
  const overrides = options.grow ? { grow: options.grow } : undefined;
  const draw = (spec, width) =>
    module.tightSvg(toSpec(spec), profileFor("worksheets", { widthMm: widthOf(width, 170), overrides }));
  const helper = {
    physical: true,
    geometry: module,
    // Pinned to its size in points. `.h-figure svg` stretches every other
    // drawing to the zone's width, which is right for a drawing sized by its
    // aspect and wrong for one laid out at its printed size: a clock face that
    // chose to be 60mm across in a 170mm zone would print 170mm across, with
    // its numerals scaled up and its measured height a lie.
    render: (spec, width) => {
      const out = draw(spec, width);
      // The first <svg is the root one, whether or not the drawing opens with
      // an XML declaration (the charts do, and went unpinned while this
      // matched only at the very start).
      const svg = out.svg.replace(/<svg /, `<svg style="width:${out.w}pt;max-width:100%;height:auto" `);
      return `<div class="h-figure">${svg}</div>`;
    },
    // The fit check measures a zone before it asks whether the zone is wide
    // enough, and a drawing that refuses a width below its readable floor would
    // throw there instead of being refused by name. So a zone narrower than the
    // stated minimum is measured at that minimum: `needs` refuses it anyway.
    measure: (spec, width) => {
      const floor = minWidthOf(spec);
      return draw(spec, Math.max(widthOf(width, 170), floor)).h / MM_TO_PT;
    },
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
