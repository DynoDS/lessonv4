"use strict";

// The bar chart and the line graph on paper are laid out at the width they
// print, the way the board and the stick-in pack place them, so the chart keeps
// one shape everywhere and its numbers print at a real size.

const assert = require("node:assert/strict");
const test = require("node:test");

const { REGISTRY } = require("../src/helpers/index");
const { PROFILES } = require("../../shared/visuals/surface-profiles");

const BAR = {
  title: "Favourite fruits in Class 3",
  categories: ["Apple", "Banana", "Cherry", "Grape"],
  values: [12, 8, 6, 14],
  y_max: 16,
  y_interval: 2,
  y_label: "Number of children",
  x_label: "Fruit",
};
const LINE = {
  title: "Temperature through the day",
  points: [{ x: 0, y: 4 }, { x: 6, y: 11 }, { x: 12, y: 17 }],
  xLabel: "Hours",
  yLabel: "Degrees",
  xMax: 12,
  yMax: 20,
  xStep: 3,
  yStep: 5,
};

const widthPt = (html) => Number(/style="width:([\d.]+)pt/.exec(html)[1]);
const fontSizes = (html) => [...html.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));

test("a chart on paper is pinned to its printed width and never set under the sheet's floor", () => {
  for (const [name, spec] of [["bar-chart", BAR], ["line-graph", LINE]]) {
    const html = REGISTRY[name].render(spec, { widthMm: 110 });
    assert.ok(/style="width:/.test(html), `${name} is pinned to its printed width`);
    assert.ok(Math.min(...fontSizes(html)) >= PROFILES.worksheets.minFontPt, `${name} words at ${Math.min(...fontSizes(html))}pt`);
  }
});

test("in a wide zone a chart stops at the pack's width rather than stretching sideways", () => {
  for (const [name, spec] of [["bar-chart", BAR], ["line-graph", LINE]]) {
    const wide = REGISTRY[name].render(spec, { widthMm: 250 });
    assert.ok(Math.abs(widthPt(wide) - 130 * 72 / 25.4) < 1, `${name} printed ${widthPt(wide)}pt wide`);
    assert.equal(REGISTRY[name].measure(spec, 250), REGISTRY[name].measure(spec, 130));
  }
});

test("a chart whose names need more than the cap is drawn as wide as it needs", () => {
  const many = { ...BAR, categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Next"], values: [1, 2, 3, 4, 5, 6, 7, 8] };
  const { minWidthMm } = REGISTRY["bar-chart"].needs(many);
  assert.ok(minWidthMm > 130);
  assert.ok(Math.abs(widthPt(REGISTRY["bar-chart"].render(many, { widthMm: 250 })) - minWidthMm * 72 / 25.4) < 1);
});

test("the board's spelling and the sheet's older spelling draw the same chart", () => {
  const camel = { ...BAR, y_max: undefined, y_interval: undefined, y_label: undefined, x_label: undefined, yMax: 16, yInterval: 2, yLabel: "Number of children", xLabel: "Fruit" };
  assert.equal(REGISTRY["bar-chart"].render(camel, { widthMm: 110 }), REGISTRY["bar-chart"].render(BAR, { widthMm: 110 }));
});

test("a long title asks for a wider zone rather than failing the fit check", () => {
  const long = { ...BAR, title: "The number of children in every class of the whole school who chose each fruit at lunch" };
  const { minWidthMm } = REGISTRY["bar-chart"].needs(long);
  assert.ok(minWidthMm > 80, "the title widened the minimum past the confirmed floor");
  assert.doesNotThrow(() => REGISTRY["bar-chart"].measure(long, 60));
});
