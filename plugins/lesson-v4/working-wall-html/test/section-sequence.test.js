"use strict";

// A section whose parts are stages of one thing: a before and an after.
//
// The teacher, shown ways to lay out a method (10 October 2026), kept two
// large pictures with one arrow between them for a lesson that turns on a
// single move, the marks of that move in the colour of the stage that makes
// it. `sequence: true` on a diagramSection is that sheet. These pin what
// prints: the arrow between stages standing side by side, each stage's marks
// in its own colour, and nothing changed on a section that is not a sequence.

const test = require("node:test");
const assert = require("node:assert");

const style = require("../style.json");
const { preRenderSvgs } = require("../src/svg-renderer");
const { renderDiagramSection } = require("../src/render-section");
const { partVisual } = require("../src/step-colours");

const sum = (extra) => ({ type: "place-value-chart", calculation: { operator: "-", numbers: ["5342", "2178"], ...extra } });
const card = (sequence) => ({
  type: "diagramSection",
  page: { size: "A3", orientation: "landscape" },
  title: "Exchange 1 ten",
  ...(sequence ? { sequence: true } : {}),
  parts: [
    { heading: "Before", visual: sum({ ring: "O" }), notes: ["2 − 8: not enough ones"] },
    { heading: "After", visual: sum({ exchanges: [{ from: "T", to: "O" }] }), notes: ["1 ten = 10 ones"] },
  ],
});

async function render(spec) {
  const svgImages = await preRenderSvgs({ cards: [spec] }, __dirname);
  return renderDiagramSection(spec, style, __dirname, { svgImages });
}

test("a sequence puts one arrow between its two stages, in the colour of the stage it leads to", async () => {
  const html = await render(card(true));
  const arrows = html.split('data-part="sequence-arrow"').length - 1;
  assert.equal(arrows, 1);
  assert.match(html, /data-part="sequence-arrow"[\s\S]*?fill="#E46C0A"/);
  assert.ok(html.indexOf(">Before<") < html.indexOf("sequence-arrow") && html.indexOf("sequence-arrow") < html.indexOf(">After<"), "between the stages, in order");
});

test("each stage's marks take that stage's colour", () => {
  const spec = card(true);
  assert.equal(partVisual(spec, 0).calculation.ringColour, "0070C0", "the ring on the before picture is the first stage's blue");
  assert.equal(partVisual(spec, 1).calculation.exchanges[0].colour, "E46C0A", "the exchange is the second stage's orange");
});

test("a section that is not a sequence has no arrow and its pictures are drawn as written", async () => {
  const spec = card(false);
  assert.doesNotMatch(await render(spec), /sequence-arrow/);
  assert.equal(partVisual(spec, 1), spec.parts[1].visual);
});

// A note box beside a compact drawing is words, not drawing: two clocks with a
// label each used to measure as wide figures and stack as strips.
test("two clocks with a note box each still stand side by side", async () => {
  const clock = (time, part) => ({ type: "clock", time, callouts: [{ part, note: ["Minute hand", "points here"] }] });
  const spec = {
    type: "diagramSection", page: { size: "A3", orientation: "landscape" }, title: "Quarters",
    parts: [{ heading: "quarter past", visual: clock("7:15", "number 3") }, { heading: "quarter to", visual: clock("4:45", "number 9") }],
  };
  const html = await render(spec);
  const widths = [...html.matchAll(/box-sizing:border-box;width:([\d.]+)mm;height:[\d.]+mm;background/g)].map((m) => Number(m[1]));
  assert.equal(widths.length, 2);
  widths.forEach((w) => assert.ok(w < 200, `a part is ${w}mm wide, half the sheet and not all of it`));
});
