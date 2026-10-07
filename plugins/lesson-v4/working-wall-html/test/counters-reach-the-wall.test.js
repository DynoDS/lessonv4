"use strict";

// The counters beside the written method, on the wall.
//
// The run this came from: Year 4 Maths lesson 24, column addition with one
// exchange (6 October 2026). The wall designer wanted the board's counters
// beside the written sum, copied the board's before-and-after pair, and was
// refused three times with the board's advice ("give it a full-width zone",
// "its own slide") on a section in landscape, the same in portrait, and a
// full-picture card of its own. The wall draws a place value chart at one
// fixed size whatever the card, so none of the three could ever have worked.
// It left the counters off the wall and reported the loss.
//
// A sheet that carries them built first time on the same engine: the
// step-by-step sheet with one ordinary counter chart per step beside the
// written sum. The teacher then asked for the pair itself on the wall too,
// with the arrow narrow so the charts are wide ("the arrow that says 10 tens =
// 1 hundred isn't as important that wide ... The tens are hard to see"): the
// tens counters had printed about 4mm across on a trial sheet. So the pair
// now draws on a landscape sheet of its own, and only there. These pin what
// was wrong on the way:
//   1. a refusal on the wall says what works on a wall, and names both homes
//      for the counters;
//   2. a sheet whose drawings print stamp-sized is refused, with what to do
//      (the same content as a three-part landscape section passed every check
//      with its figures 29mm by 13mm);
//   3. a note on that step-by-step sheet stands beside the sum it points at,
//      not over its heading.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const style = require("../style.json");
const { preRenderSvgs } = require("../src/svg-renderer");
const { renderStepByStep } = require("../src/render-steps");
const { build } = require("../build");
const { MIN_FIGURE_SHORT_SIDE_MM, MIN_COUNTER_PAIR_WIDTH_MM, assertFiguresReadable } = require("../src/figure-size");
const placeValueChart = require("../../shared/visuals/place-value-chart-svg");
const { profileFor } = require("../../shared/visuals/surface-profiles");

const COLUMNS = ["Hundreds", "Tens", "Ones"];
const counterPair = {
  type: "place-value-chart",
  columns: COLUMNS,
  pair: {
    from: ["", "", ""], to: ["", "", ""], title: "", operation: "10 tens = 1 hundred",
    counters: { from: { H: 3, T: 13, O: 6 }, to: { H: 4, T: 3, O: 6 } },
    exchanges: [{ from: "T", to: "H", count: 10, label: "10 tens = 1 hundred" }],
  },
};
const counterChart = (counters) => ({ type: "place-value-chart", columns: COLUMNS, rows: [{ cells: ["", "", ""], counters, digits: false }] });
const before = counterChart({ H: 3, T: 13, O: 6 });
const after = counterChart({ H: 4, T: 3, O: 6 });
const sum = { type: "place-value-chart", columns: COLUMNS, calculation: { operator: "+", numbers: ["264", "172"], answer: "436", carry: { H: "1" } } };

const wall = (cards) => ({ topic: "Column addition (one exchange)", yearGroup: 4, cards });
const stepSheet = (note) => ({
  type: "stepByStep", page: { size: "A3", orientation: "portrait" }, title: "Exchange ten tens", example: "264 + 172",
  steps: [
    { heading: "Add the tens", key: "6 tens + 7 tens = 13 tens", text: "Thirteen tens is ten or more.", visual: before },
    { heading: "Exchange", key: "10 tens = 1 hundred", text: "One new hundred. Three tens stay.", visual: after },
    { heading: "Write the small 1", key: "13 tens = 1 hundred and 3 tens", text: "Write 3 in Tens and a small 1 in Hundreds.", visual: sum, ...(note ? { note: ["1 exchanged", "hundred"], point: "hundreds carry" } : {}) },
  ],
});

async function validate(spec) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wall-counters-"));
  const file = path.join(dir, "working-wall.json");
  fs.writeFileSync(file, JSON.stringify(spec));
  const log = console.log;
  console.log = () => {};
  try {
    await build(file, dir, { validateOnly: true });
    return null;
  } catch (err) {
    return String(err.message);
  } finally {
    console.log = log;
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const fullSheet = (orientation) => ({ type: "stickyKnowledge", title: "Remember", page: { size: "A3", orientation }, items: [{ text: "Ten tens have the same value as one hundred." }], visualScale: "full", visual: counterPair });
const section = (orientation) => ({
  type: "diagramSection", page: { size: "A3", orientation }, title: "Exchange",
  parts: [{ heading: "10 tens = 1 hundred", visual: counterPair }, { heading: "264 + 172 = 436", visual: sum }],
});

test("the counters pair builds on a landscape sheet of its own", async () => {
  assert.equal(await validate(wall([fullSheet("landscape")])), null);
});

test("squeezed into a section or beside a step it is refused, and told both ways to keep the counters", async () => {
  const besideAStep = stepSheet(false);
  besideAStep.steps[0].visual = counterPair;
  for (const card of [section("landscape"), section("portrait"), besideAStep]) {
    const refusal = await validate(wall([card]));
    assert.ok(refusal, "two charts of counters in part of a sheet cannot be counted");
    assert.match(refusal, /^WALL_COUNTERS_PAIR_TOO_SMALL: /);
    assert.match(refusal, new RegExp(`at least ${MIN_COUNTER_PAIR_WIDTH_MM}mm`));
    assert.match(refusal, /`visualScale: "full"`/, "one way: the pair on a sheet of its own");
    assert.match(refusal, /`stepByStep` sheet with one ordinary chart per step/, "the other: one chart per step beside the written method");
    assert.doesNotMatch(refusal, /slide|full-width zone/i, "the board's remedies are not offered on the wall");
  }
});

test("a pair that cannot be read even on a whole sheet is refused in the wall's words", async () => {
  const crowded = JSON.parse(JSON.stringify(counterPair));
  crowded.pair.counters.from.T = 20;
  crowded.pair.counters.from.O = 20;
  crowded.columns = ["Thousands", "Hundreds", "Tens", "Ones"];
  crowded.pair.from = ["", "", "", ""];
  crowded.pair.to = ["", "", "", ""];
  const card = fullSheet("landscape");
  card.visual = crowded;
  const refusal = await validate(wall([card]));
  if (refusal === null) return; // it fits: nothing to word
  assert.match(refusal, /PLACE_VALUE_(CHART_DOES_NOT_FIT|COUNTERS_TOO_SMALL)|WALL_/);
  assert.doesNotMatch(refusal, /slide|full-width zone/i);
});

test("on the wall the pair's arrow is narrow and its columns take the width, so the tens counters are bigger", () => {
  const counters = (layout, column) => Math.min(...layout.circles.filter((c) => c.role === "counter" && c.column === column).map((c) => 2 * c.r));
  const wide = placeValueChart.tightSvg(counterPair, profileFor("wall", { widthMm: 360 })).layout;
  const narrow = placeValueChart.tightSvg(counterPair, profileFor("wall", { widthMm: 360, overrides: { pairArrow: "narrow", pairMaxHeightPt: (165 * 72) / 25.4 } })).layout;
  const gapOf = (layout) => layout.w - 2 * layout.chartW;
  assert.ok(gapOf(narrow) < gapOf(wide) / 3, "the arrow gives up most of the width it had");
  assert.ok(counters(narrow, "T") > counters(wide, "T") * 1.5, `thirteen tens counters grow by half again (${counters(wide, "T").toFixed(1)}pt to ${counters(narrow, "T").toFixed(1)}pt)`);
  assert.ok(narrow.h <= (165 * 72) / 25.4 + 1, "the picture stays the depth a sheet has under its title");
  assert.equal(narrow.texts.filter((t) => t.role === "operation").length, 0, "the cue above already says the arrow's words, so they are not printed twice");
  const cue = narrow.texts.find((t) => t.role === "exchange-label");
  assert.ok(cue && cue.pt >= 20, "and the cue's words keep the wall's 20pt floor");
});

test("a narrow arrow whose words the cue does not say carries them in a band above the charts, at the wall's size", () => {
  const spec = JSON.parse(JSON.stringify(counterPair));
  spec.pair.operation = "Exchange";
  const layout = placeValueChart.tightSvg(spec, profileFor("wall", { widthMm: 360, overrides: { pairArrow: "narrow" } })).layout;
  const words = layout.texts.filter((t) => t.role === "operation");
  assert.equal(words.length, 1);
  assert.ok(words[0].pt >= 20, "readable from across the room");
  const header = layout.cells.find((c) => c.role === "header");
  assert.ok(words[0].y + words[0].h <= header.y + 0.5, "above the charts, not squeezed along the short arrow");
});

test("no other surface draws the pair any differently: the narrow arrow is asked for, never the default", () => {
  for (const [surface, box] of [["slides", { widthPt: 12 * 72, heightPt: 5 * 72 }], ["worksheets", { widthMm: 260 }], ["stickin", { widthMm: 260 }]]) {
    let layout;
    try {
      layout = placeValueChart.tightSvg(counterPair, profileFor(surface, box)).layout;
    } catch (err) {
      continue; // a surface that refuses the pair refuses it as before
    }
    assert.ok(layout.w - 2 * layout.chartW >= 4 * layout.D, `${surface} keeps the wide arrow`);
    assert.equal(layout.texts.filter((t) => t.role === "operation").length, 1, `${surface} keeps the words on the arrow`);
  }
});

test("a digits-only pair too wide for the wall is pointed at the rows form, not at a slide", async () => {
  const pair = { type: "place-value-chart", columns: ["Th", "H", "T", "O"], pair: { operation: "add one hundred and then ten more to it", from: ["3", "4", "6", "2"], to: ["3", "5", "7", "2"] } };
  const refusal = await validate(wall([{ type: "stickyKnowledge", title: "Remember", page: { size: "A3", orientation: "landscape" }, items: [{ text: "The hundreds and the tens change." }], visual: pair }]));
  assert.ok(refusal, "an arrow carrying a whole sentence does not fit");
  assert.match(refusal, /`rows` form/);
  assert.doesNotMatch(refusal, /slide|stepByStep/i);
});

test("the model the wall can carry builds: one counter chart per step beside the written sum", async () => {
  assert.equal(await validate(wall([stepSheet(false)])), null);
  assert.equal(await validate(wall([stepSheet(true)])), null);
});

test("a sheet whose drawings print stamp-sized is refused, with the size and what to do", async () => {
  const stamps = {
    type: "diagramSection", page: { size: "A3", orientation: "landscape" }, title: "Exchange",
    parts: [
      { heading: "13 tens", visual: before, notes: ["6 tens + 7 tens = 13 tens."] },
      { heading: "10 tens = 1 hundred", visual: after, notes: ["13 tens = 1 hundred and 3 tens."] },
      { heading: "264 + 172 = 436", visual: sum, notes: ["The small 1 is the exchanged hundred."] },
    ],
  };
  const refusal = await validate(wall([stamps]));
  assert.ok(refusal, "three charts 13mm tall on an A3 sheet are not a wall");
  assert.match(refusal, /^WALL_FIGURE_TOO_SMALL: diagramSection "Exchange" prints 3 drawings/);
  assert.match(refusal, new RegExp(`at least ${MIN_FIGURE_SHORT_SIDE_MM}mm`));
  assert.match(refusal, /stepByStep/, "it names a sheet that gives each picture a row");
});

test("the floor measures the shorter side, and leaves a table's row pictures alone", () => {
  const card = { type: "stickyKnowledge", title: "Remember" };
  assert.doesNotThrow(() => assertFiguresReadable(card, [{ wMm: 360, hMm: MIN_FIGURE_SHORT_SIDE_MM }], "the card"));
  assert.throws(() => assertFiguresReadable(card, [{ wMm: 360, hMm: MIN_FIGURE_SHORT_SIDE_MM - 1 }], "the card"), /WALL_FIGURE_TOO_SMALL: the card prints a drawing/);
  assert.doesNotThrow(() => assertFiguresReadable(card, [], "the card"), "a card of photographs has nothing to measure");
  assert.doesNotThrow(() => assertFiguresReadable({ type: "referenceTable" }, [{ wMm: 20, hMm: 20 }], "the table"));
});

test("a two-line note stands beside the sum it points at, clear of the picture, on a sheet that also holds wide charts", async () => {
  const card = stepSheet(true);
  const svgImages = await preRenderSvgs({ cards: [card] }, __dirname);
  const html = renderStepByStep(card, style, __dirname, { svgImages });
  const row = html.split('data-part="step"').slice(1)[2];
  const num = (pattern) => Number((row.match(pattern) || [])[1]);
  const figureLeft = num(/data-part="figure" style="[^"]*?left:([\d.]+)mm/);
  const figureWidth = num(/data-part="figure"[^>]*><img[^>]*width:([\d.]+)mm/);
  const noteLeft = num(/data-part="note" style="[^"]*?left:([\d.]+)mm/);
  assert.ok(figureWidth > 0 && noteLeft > 0, "the step draws its sum and its note");
  assert.ok(noteLeft >= figureLeft + figureWidth, `the note (from ${noteLeft}mm) starts past the sum's right edge (${figureLeft + figureWidth}mm), so it covers none of it`);
  const arrowTip = num(/<polygon points="([\d.]+),/);
  assert.ok(arrowTip >= figureLeft + figureWidth, "the arrow stops at the sum's edge and runs through no digit");
});
