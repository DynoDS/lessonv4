"use strict";

// The exchange, marked on the wall's counters pair.
//
// Once the pair's arrow was made short so its charts could be wide, the sheet
// was two charts of dots with nothing saying what had happened. The teacher:
// "Its good. I'd have some indication what happened though, like colours round
// the 10 and moving to the hundreds with arrows or whatever, otherwise it just
// looks bland" (6 October 2026). So the ten counters that are exchanged are
// ringed as one group, the one counter they become is ringed in the other
// chart, and the arrow between the charts takes the rings' colour.
//
// The marks are worked out from the two charts, so these pin that they land on
// exactly the counters that moved, in both directions, and on nothing when the
// charts do not differ by one clean exchange. They also pin that the marks are
// asked for and never the default: the wall asks here, the board asks in the
// builder (its own test is there), and the sheet and the stick-in pack, which a
// child writes on, draw the same pair with no marks.

const test = require("node:test");
const assert = require("node:assert");

const placeValueChart = require("../../shared/visuals/place-value-chart-svg");
const { profileFor } = require("../../shared/visuals/surface-profiles");
const { preRenderSvgs, placeValueChartKey } = require("../src/svg-renderer");

const GREEN = "#00B050"; // the ring `highlight` draws round a changed digit
const BLUE = "#0070C0";
const WALL_PAIR = { widthMm: 360, overrides: { pairArrow: "narrow", pairExchangeMarks: true, pairMaxHeightPt: (165 * 72) / 25.4 } };
const UNMARKED = { widthMm: 360, overrides: { pairArrow: "narrow", pairMaxHeightPt: (165 * 72) / 25.4 } };

const pairOf = (from, to, columns = ["Hundreds", "Tens", "Ones"]) => ({
  type: "place-value-chart",
  columns,
  pair: { from: columns.map(() => ""), to: columns.map(() => ""), title: "", operation: "", counters: { from, to } },
});
const layoutOf = (spec, box = WALL_PAIR) => placeValueChart.tightSvg(spec, profileFor("wall", box)).layout;

// What a ring encloses: which chart it is in, and the counters inside it.
function ringed(layout, role) {
  const ring = layout.rings.find((r) => r.role === role);
  if (!ring) return null;
  const inside = layout.circles.filter((c) => c.role === "counter" && c.cx > ring.x && c.cx < ring.x + ring.w && c.cy > ring.y && c.cy < ring.y + ring.h);
  return { chart: ring.x < layout.chartW ? "from" : "to", column: ring.column, counters: inside.length, columns: [...new Set(inside.map((c) => c.column))], ring };
}
const arrowColour = (layout) => layout.polys[layout.polys.length - 1].fill;
const marks = (layout) => layout.rings.filter((r) => /^exchange-/.test(r.role || ""));

test("ten tens for a hundred: the ten that go are ringed as one group, the three that stay are not, and the new hundred is ringed", () => {
  const layout = layoutOf(pairOf({ H: 3, T: 13, O: 6 }, { H: 4, T: 3, O: 6 }));
  const group = ringed(layout, "exchange-group");
  const one = ringed(layout, "exchange-one");
  assert.ok(group && one, "both marks are drawn");
  assert.deepEqual([group.chart, group.column, group.counters, group.columns], ["from", "T", 10, ["T"]], "exactly ten tens, in the chart before the exchange");
  assert.deepEqual([one.chart, one.column, one.counters, one.columns], ["to", "H", 1, ["H"]], "exactly one hundred, in the chart after it");
  assert.equal(group.ring.stroke || layout.pal.ring, GREEN, "in the green the chart rings a changed digit with");
  assert.equal(one.ring.stroke || layout.pal.ring, GREEN, "and the same green on the counter they became");
});

test("the arrow between the charts takes the rings' colour and leaves at the group's height", () => {
  const layout = layoutOf(pairOf({ H: 3, T: 13, O: 6 }, { H: 4, T: 3, O: 6 }));
  assert.equal(arrowColour(layout), GREEN);
  const group = ringed(layout, "exchange-group").ring;
  const tip = layout.polys[layout.polys.length - 1].points[0];
  assert.ok(tip[1] > group.y && tip[1] < group.y + group.h, "the arrow is level with the ringed group");
});

test("ten ones for a ten is marked the same way", () => {
  const layout = layoutOf(pairOf({ H: 3, T: 7, O: 12 }, { H: 3, T: 8, O: 2 }));
  const group = ringed(layout, "exchange-group");
  const one = ringed(layout, "exchange-one");
  assert.deepEqual([group.chart, group.column, group.counters], ["from", "O", 10]);
  assert.deepEqual([one.chart, one.column, one.counters], ["to", "T", 1]);
});

test("ten hundreds for a thousand, across four columns", () => {
  const cols = ["Thousands", "Hundreds", "Tens", "Ones"];
  const layout = layoutOf(pairOf({ Th: 1, H: 12, T: 4, O: 5 }, { Th: 2, H: 2, T: 4, O: 5 }, cols));
  assert.deepEqual([ringed(layout, "exchange-group").column, ringed(layout, "exchange-group").counters], ["H", 10]);
  assert.deepEqual([ringed(layout, "exchange-one").chart, ringed(layout, "exchange-one").column], ["to", "Th"]);
});

test("subtraction runs the other way: the one that is exchanged is ringed before, the ten it becomes after", () => {
  const layout = layoutOf(pairOf({ H: 3, T: 5, O: 2 }, { H: 3, T: 4, O: 12 }));
  const group = ringed(layout, "exchange-group");
  const one = ringed(layout, "exchange-one");
  assert.deepEqual([one.chart, one.column, one.counters], ["from", "T", 1], "one ten, in the chart before");
  assert.deepEqual([group.chart, group.column, group.counters], ["to", "O", 10], "ten ones, in the chart after, the two that were there left out");
  assert.equal(arrowColour(layout), GREEN);
});

test("charts that do not differ by one clean exchange are marked nowhere, and the arrow stays blue", () => {
  const notClean = [
    [{ H: 3, T: 13, O: 12 }, { H: 4, T: 4, O: 2 }, "two exchanges at once"],
    [{ H: 3, T: 13, O: 6 }, { H: 4, T: 4, O: 6 }, "nine left, not ten"],
    [{ H: 3, T: 13, O: 6 }, { H: 3, T: 3, O: 7 }, "ten tens for one ONE is not an exchange"],
    [{ H: 3, T: 13, O: 6 }, { H: 4, T: 3, O: 5 }, "another column changed too"],
    [{ H: 3, T: 3, O: 6 }, { H: 3, T: 3, O: 6 }, "nothing changed"],
  ];
  for (const [from, to, why] of notClean) {
    const layout = layoutOf(pairOf(from, to));
    assert.equal(marks(layout).length, 0, why);
    assert.equal(arrowColour(layout), BLUE, `${why}: the arrow is the ordinary one`);
  }
});

test("the rings take their room from the spacing: no counter is smaller for being ringed", () => {
  // The Lesson 24 picture as the board wrote it, cue and all.
  const spec = pairOf({ H: 3, T: 13, O: 6 }, { H: 4, T: 3, O: 6 });
  spec.pair.operation = "10 tens = 1 hundred";
  spec.pair.exchanges = [{ from: "T", to: "H", count: 10, label: "10 tens = 1 hundred" }];
  const size = (layout, column) => Math.min(...layout.circles.filter((c) => c.role === "counter" && c.column === column).map((c) => 2 * c.r));
  const marked = layoutOf(spec);
  const plain = layoutOf(spec, UNMARKED);
  for (const column of ["H", "T", "O"]) assert.equal(size(marked, column), size(plain, column), `${column} counters keep their size`);
  const tensMm = (size(marked, "T") / 72) * 25.4;
  assert.ok(tensMm >= 6.9 - 0.05, `thirteen tens counters still print ${tensMm.toFixed(1)}mm across on the 360mm sheet`);
  const group = ringed(marked, "exchange-group").ring;
  const tensCell = marked.cells.find((c) => c.role === "band" && c.column === "T");
  assert.ok(group.x >= tensCell.x && group.x + group.w <= tensCell.x + tensCell.w, "and the ring stays inside its own column");
});

test("the marks are asked for, never the default: a sheet, a stick-in piece and any drawing that does not ask have none", () => {
  const spec = pairOf({ H: 3, T: 13, O: 6 }, { H: 4, T: 3, O: 6 });
  const others = [["slides", { widthPt: 12 * 72, heightPt: 5 * 72 }], ["worksheets", { widthMm: 260 }], ["stickin", { widthMm: 260 }], ["wall", UNMARKED]];
  let drawn = 0;
  for (const [surface, box] of others) {
    let layout;
    try {
      layout = placeValueChart.tightSvg(spec, profileFor(surface, box)).layout;
    } catch (err) {
      continue; // a surface that refuses the pair refuses it as before
    }
    drawn += 1;
    assert.equal(marks(layout).length, 0, `${surface} rings no counters`);
    assert.notEqual(arrowColour(layout), GREEN, `${surface} keeps its own arrow`);
  }
  assert.ok(drawn >= 2, "the pair was actually drawn on other surfaces for this to mean anything");
});

test("the wall's own drawing of a counters pair carries the marks", async () => {
  const sharp = require("sharp");
  const greenPixels = async (spec) => {
    const card = { type: "stickyKnowledge", title: "Remember", page: { size: "A3", orientation: "landscape" }, items: [{ text: "Ten tens." }], visualScale: "full", visual: spec };
    const images = await preRenderSvgs({ cards: [card] }, __dirname);
    const entry = images[placeValueChartKey(spec)];
    const { data, info } = await sharp(entry.png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let n = 0;
    for (let i = 0; i < data.length; i += info.channels) if (data[i] < 20 && Math.abs(data[i + 1] - 0xb0) < 12 && Math.abs(data[i + 2] - 0x50) < 12) n += 1;
    return n / (info.width * info.height);
  };
  const exchange = await greenPixels(pairOf({ H: 3, T: 13, O: 6 }, { H: 4, T: 3, O: 6 }));
  const noExchange = await greenPixels(pairOf({ H: 3, T: 13, O: 12 }, { H: 4, T: 4, O: 2 }));
  assert.ok(exchange > 0.002, `the rings and the arrow are on the wall's picture (${(exchange * 100).toFixed(2)}% of it is ring green)`);
  assert.ok(noExchange < exchange / 10, "and a pair with no clean exchange has none");
});
