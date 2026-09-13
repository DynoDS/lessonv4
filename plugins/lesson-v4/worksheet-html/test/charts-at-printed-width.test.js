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
    assert.ok(Math.min(...fontSizes(html)) >= PROFILES.worksheets.fontPt, `${name} words at ${Math.min(...fontSizes(html))}pt`);
  }
});

// The plot's height over its width, read off the two axis lines.
const plotShape = (html) => {
  const axes = [...html.matchAll(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)" stroke="#000000"/g)].map((m) => m.slice(1).map(Number));
  const up = axes.find((a) => a[0] === a[2] && a[3] - a[1] > 50);
  const across = axes.find((a) => a[1] === a[3] && a[2] - a[0] > 50);
  return (up[3] - up[1]) / (across[2] - across[0]);
};

test("in a wide zone a chart fills the width as a bigger chart, in the board's shape", () => {
  for (const [name, spec] of [["bar-chart", BAR], ["line-graph", LINE]]) {
    const narrow = REGISTRY[name].render(spec, { widthMm: 110 });
    const wide = REGISTRY[name].render(spec, { widthMm: 250 });
    assert.ok(Math.abs(widthPt(wide) - 250 * 72 / 25.4) < 1, `${name} printed ${widthPt(wide)}pt wide`);
    assert.ok(REGISTRY[name].measure(spec, 250) > REGISTRY[name].measure(spec, 110) * 1.8, `${name} grew taller with its width`);
    assert.ok(Math.min(...fontSizes(wide)) > Math.min(...fontSizes(narrow)), `${name} words grew with the chart`);
    // The scale numbers are the smallest words, and they grow by no more
    // than the board's factor.
    assert.ok(
      Math.min(...fontSizes(wide)) <= PROFILES.worksheets.fontPt * PROFILES.slides.grow + 0.01,
      `${name} words grew no further than the board's factor`
    );
    for (const html of [narrow, wide]) {
      const shape = plotShape(html);
      assert.ok(shape > 0.58 && shape < 0.66, `${name} plot is ${shape.toFixed(2)} of its width`);
    }
  }
});

test("a chart of many bars asks for the width its names need, at the sheet's type size", () => {
  const many = { ...BAR, categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Next"], values: [1, 2, 3, 4, 5, 6, 7, 8] };
  const { minWidthMm } = REGISTRY["bar-chart"].needs(many);
  assert.ok(minWidthMm >= 8 * 22);
  assert.ok(Math.min(...fontSizes(REGISTRY["bar-chart"].render(many, { widthMm: minWidthMm }))) >= PROFILES.worksheets.fontPt);
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
