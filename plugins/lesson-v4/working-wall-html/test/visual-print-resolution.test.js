"use strict";

// A drawn visual is rasterised for the size it will be printed at, not for a
// fixed 600 pixels.
//
// The run this came from: a review of every wall the engine had built found the
// same helper coming out a postage stamp on one sheet and a blurred blow-up on
// another. Worst case was a Year 4 place-value chart placed 31.6cm wide on A3
// from a 600px source, which is about 48 dots per inch. Print wants 150 at the
// very least. The staircase edges on "3,406" were visible on the page and read
// as homemade, which is exactly the thing these sheets are not supposed to be.
//
// The design canvas stays at 600 units, because stroke widths inside the
// primitives are absolute numbers authored against it and scaling the canvas
// would thin every line. Only the raster output grows.

const test = require("node:test");
const assert = require("node:assert");

const { preRenderSvgs, placeValueChartKey, numberLineKey } = require("../src/svg-renderer");

// The widest a wall visual is placed today: a full-bleed A3 landscape figure
// inside the 1.6cm margins.
const WIDEST_PLACEMENT_INCHES = (16.54 - 2 * (1.6 / 2.54)) * 0.96;
// Below this a printed figure shows its pixels to anyone standing at the wall.
const MIN_PRINT_DPI = 140;

async function pngWidth(buf) {
  const sharp = require("sharp");
  const meta = await sharp(buf).metadata();
  return meta.width;
}

function bufferOf(entry) {
  return Buffer.isBuffer(entry) ? entry : entry.png;
}

test("a tight primitive is rasterised for a full-width A3 placement", async () => {
  const spec = {
    cards: [
      {
        type: "workedExample",
        page: { size: "A3", orientation: "landscape" },
        title: "How to partition",
        items: [{ text: "Read each digit's column." }],
        visual: {
          type: "place-value-chart",
          columns: ["Th", "H", "T", "O"],
          rows: [{ label: "3,406", cells: ["3", "4", "0", "6"] }],
        },
      },
    ],
  };

  const map = await preRenderSvgs(spec);
  const key = placeValueChartKey(spec.cards[0].visual);
  assert.ok(map[key], "expected the place-value chart to have been pre-rendered");

  const width = await pngWidth(bufferOf(map[key]));
  const dpi = width / WIDEST_PLACEMENT_INCHES;
  assert.ok(
    dpi >= MIN_PRINT_DPI,
    `a place-value chart printed ${WIDEST_PLACEMENT_INCHES.toFixed(1)}in wide would be ${dpi.toFixed(0)} dots ` +
      `per inch from a ${width}px render; ${MIN_PRINT_DPI} is the least that does not show its pixels`
  );
});

test("a square-canvas primitive is rasterised for a full-width A3 placement", async () => {
  const spec = {
    cards: [
      {
        type: "workedExample",
        page: { size: "A3", orientation: "landscape" },
        title: "How to estimate",
        items: [{ text: "Read both endpoints." }],
        visual: { type: "numberLine", from: 0, to: 10000, step: 2500, marks: [{ at: 6800, label: "6,800" }] },
      },
    ],
  };

  const map = await preRenderSvgs(spec);
  const key = numberLineKey(spec.cards[0].visual);
  assert.ok(map[key], "expected the number line to have been pre-rendered");

  const width = await pngWidth(bufferOf(map[key]));
  const dpi = width / WIDEST_PLACEMENT_INCHES;
  assert.ok(
    dpi >= MIN_PRINT_DPI,
    `a number line printed ${WIDEST_PLACEMENT_INCHES.toFixed(1)}in wide would be ${dpi.toFixed(0)} dots per inch ` +
      `from a ${width}px render; ${MIN_PRINT_DPI} is the least that does not show its pixels`
  );
});
