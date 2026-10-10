"use strict";

// A tally chart beside the bar chart made from it (stress test, 7 October
// 2026): one in a plain typeface and one in the sheet's own, their two titles
// at 17pt and 20pt, and the second chart starting a line higher because its
// instruction was a line shorter. The teacher chose, from pictures of the real
// Year 3 sheet (9 October 2026): the sheet's typeface, only headings bold, one
// title size, and the two drawings starting level.

const { test } = require("node:test");
const assert = require("node:assert");

const tallyChart = require("../../shared/visuals/tally-chart-svg");
const barChart = require("../../shared/visuals/bar-chart-svg");
const { PROFILES, SHEET_COLOURING, profileFor, MM_TO_PT } = require("../../shared/visuals/surface-profiles");
const { renderContent, measureContent } = require("../src/helpers");

const TALLY = {
  helper: "tally-chart",
  title: "The weather in March",
  headers: ["Weather", "Tally", "Frequency"],
  rows: [
    { label: "Sunny", tally: 7, total: "" },
    { label: "Cloudy", tally: 11, total: "" },
    { label: "Snowy", tally: 4 },
  ],
};
const BARS = {
  helper: "bar-chart",
  title: "The weather in March",
  categories: ["Sunny", "Cloudy", "Rainy", "Snowy"],
  values: [0, 0, 9, 0],
  yMax: 12,
  yInterval: 2,
};

const titleSize = (svg) => Number(/font-size="([\d.]+)"[^>]*fill="#1F4E79"/.exec(svg)[1]);

test("the tally chart is set in the typeface of everything else, with only its headings bold on paper", () => {
  const sheet = tallyChart.tightSvg(TALLY, SHEET_COLOURING).svg;
  assert.ok(!/Arial/.test(sheet), "no plain typeface");
  assert.match(sheet, /Comic Sans MS/);
  assert.match(sheet, /font-weight="bold"[^>]*>Weather</, "a heading is bold");
  assert.ok(!/font-weight="bold"[^>]*>Sunny</.test(sheet), "a row name is not");
  // The board is read across a room and stays bold throughout.
  assert.match(tallyChart.tightSvg(TALLY).svg, /font-weight="bold"[^>]*>Sunny</);
});

test("a tally chart and a bar chart print their titles at the sheet's one title size", () => {
  const widthMm = 100;
  const told = { ...SHEET_COLOURING, titlePt: PROFILES.worksheets.titlePt, widthPt: widthMm * MM_TO_PT };
  const tally = tallyChart.tightSvg(TALLY, told);
  // The tally chart is drawn in its own units and scaled to its width.
  const printed = titleSize(tally.svg) * ((widthMm * MM_TO_PT) / tally.w);
  assert.ok(Math.abs(printed - PROFILES.worksheets.titlePt) < 0.2, `tally title prints at ${printed.toFixed(1)}pt`);
  const bars = barChart.tightSvg(BARS, profileFor("worksheets", { widthMm: 125 }));
  assert.ok(Math.abs(titleSize(bars.svg) - PROFILES.worksheets.titlePt) < 0.2, `bar chart title prints at ${titleSize(bars.svg)}pt`);
});

test("a title too long for its chart is set smaller, never run past it", () => {
  const long = { ...TALLY, title: "How the children in Oak Class and Elm Class travel to school each morning" };
  const out = tallyChart.tightSvg(long, { ...SHEET_COLOURING, titlePt: 20, widthPt: 100 * MM_TO_PT });
  const printed = titleSize(out.svg) * ((100 * MM_TO_PT) / out.w);
  assert.ok(printed < 20, `printed at ${printed.toFixed(1)}pt`);
});

const pair = (leftWords, rightWords) => ({
  row: [
    { number: "1a", stack: [{ helper: "instruction", text: leftWords }, TALLY] },
    { number: "1b", stack: [{ helper: "instruction", text: rightWords }, BARS] },
  ],
});
const marginsAboveDrawings = (html) =>
  [...html.matchAll(/<div class="h-stack-item[^"]*"(?: style="margin-top:([\d.]+)mm")?>\s*<div class="h-figure"/g)].map((m) => Number(m[1] || 0));

test("two drawings side by side start level when one instruction runs a line longer", () => {
  const long = "Fill in the gaps in the tally chart for Sunny, Cloudy and Snowy, then check each one with your partner.";
  const short = "Draw the bars.";
  const uneven = pair(long, short);
  const [left, right] = marginsAboveDrawings(renderContent(uneven, 240));
  assert.ok(right > left + 4, `the drawing under the shorter instruction comes down (${left}mm and ${right}mm above)`);
  // The row is measured with it, so nothing is pushed over what follows.
  const even = pair(short, short);
  const [a, b] = marginsAboveDrawings(renderContent(even, 240));
  assert.strictEqual(a, b, "instructions of one length need nothing");
  assert.ok(measureContent(uneven, 240) > measureContent(even, 240));
});

test("a column with no drawing, and a lone drawing, are left where they are", () => {
  const html = renderContent(
    { row: [{ stack: [{ helper: "instruction", text: "Read this first. It is a long line that wraps round onto a second line of print." }] }, { stack: [{ helper: "instruction", text: "Draw." }, BARS] }] },
    240
  );
  const [only] = marginsAboveDrawings(html);
  assert.ok(only <= 2.5, `only the ordinary gap above it (${only}mm)`);
});
