"use strict";

// The bar chart and the line graph reach the wall laid out at their printed
// size, the way the board, the sheet and the stick-in pack place them. The
// wall's anatomy posters point callouts at the parts those charts name, so the
// named parts have to survive the trip through the wall's one placing function.

const test = require("node:test");
const assert = require("node:assert");

const { preRenderSvgs, calloutKeySuffix } = require("../src/svg-renderer");
const { VISUAL_KEY_FNS, pickVisual } = require("../src/visuals");

const BAR_POSTER = {
  type: "bar-chart",
  title: "Books read this term",
  categories: ["Oak", "Elm", "Birch", "Willow"],
  values: [24, 18, 30, 12],
  yMax: 32,
  yInterval: 4,
  callouts: [
    { part: "title", label: "The title" },
    { part: "scale", label: "Each line is worth 4" },
    { part: "gridline", label: "A gridline" },
    { part: "Birch", label: "Birch read 30" },
  ],
};

const LINE_POSTER = {
  type: "line-graph",
  title: "Temperature through the day",
  xLabel: "Hours",
  yLabel: "Degrees",
  points: [{ x: 0, y: 12 }, { x: 1, y: 15 }, { x: 2, y: 18 }, { x: 3, y: 20 }],
  xStep: 1,
  callouts: [
    { part: "yAxis", label: "The scale" },
    { part: "xAxis", label: "Time" },
    { part: "line", label: "The trend" },
    { part: "3", label: "At 3 hours it was 20" },
  ],
};

test("every named callout on a chart poster finds its part", async () => {
  const warnings = [];
  const warn = console.warn;
  console.warn = (...args) => warnings.push(args.join(" "));
  try {
    const images = await preRenderSvgs({ cards: [{ visual: BAR_POSTER }, { visual: LINE_POSTER }] });
    for (const visual of [BAR_POSTER, LINE_POSTER]) {
      const annotated = images[VISUAL_KEY_FNS[visual.type](visual) + calloutKeySuffix(visual)];
      assert.ok(annotated && annotated.png && annotated.png.length > 0, `${visual.type} poster has its labelled picture`);
      assert.ok(pickVisual(visual, { svgImages: images }), `${visual.type} poster is placed on its card`);
    }
  } finally {
    console.warn = warn;
  }
  assert.deepStrictEqual(warnings.filter((w) => /could not be placed/.test(w)), []);
});

test("a chart on the wall is wider than it is tall, as it is on paper", async () => {
  const plain = [
    { type: "bar-chart", categories: BAR_POSTER.categories, values: BAR_POSTER.values, y_max: 32, y_interval: 4, title: BAR_POSTER.title },
    { type: "line-graph", points: LINE_POSTER.points, xStep: 1, title: LINE_POSTER.title, xLabel: "Hours", yLabel: "Degrees" },
  ];
  const images = await preRenderSvgs({ cards: plain.map((visual) => ({ visual })) });
  for (const visual of plain) {
    const placed = images[VISUAL_KEY_FNS[visual.type](visual)];
    assert.ok(placed && placed.aspect > 1.15, `${visual.type} aspect ${placed && placed.aspect}`);
  }
});
