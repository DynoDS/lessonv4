"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { tightnessOf, describeTightness } = require("../src/tightness");

// A tall figure beside a short set of questions. The row is as tall as the
// figure, so the questions are handed height they cannot use and the paper under
// them prints empty. This is the case a real sheet came back with: a bar chart
// beside three questions, and a hand's width of nothing underneath them.
const chart = {
  helper: "bar-chart",
  title: "Books read in each class this term",
  categories: ["Oak", "Elm", "Birch", "Willow"],
  values: [24, 18, 30, 12],
  yMax: 32,
  yInterval: 4,
};

// Four zones down a portrait page, so a zone is about as tall as the chart
// wants to be. That is the geometry a real sheet lands on, and it is the one
// where the gap belongs to the short column rather than to the page.
const sheet = (a, rest = {}) => ({
  title: "Reading a bar chart",
  lo: "To read a bar chart",
  layout: "four-stacked",
  orientation: "portrait",
  zones: {
    a,
    b: chart,
    c: chart,
    d: chart,
    ...rest,
  },
});

test("blank paper under something that cannot use it is reported", () => {
  const result = tightnessOf(
    sheet({
      parts: [1.8, 1],
      row: [chart, { helper: "questions", items: ["How many books did Birch read?"] }],
    })
  );

  const found = result.spare.find((s) => s.zone === "a" && s.label === "questions");
  assert.ok(found, "the short questions column should be named");
  assert.ok(
    found.spareMm >= 20,
    `expected a real gap, got ${Math.round(found.spareMm)}mm`
  );
  assert.match(describeTightness(result), /prints empty/);
});

test("a helper is left alone while the room it was given is room it can use", () => {
  // Writing lines grow into the room they are given, so a block sitting inside
  // its own useful range is the sheet working rather than the sheet wasting.
  // Reporting this would train the designer to shrink the very thing children
  // write in.
  const answers = {
    helper: "written-answers",
    items: [{ text: "Explain how you know.", lines: 2 }],
  };
  const result = tightnessOf(
    sheet({ stack: [{ helper: "instruction", text: "Answer in full sentences." }, answers] })
  );

  assert.equal(
    result.spare.filter((s) => s.label === "written-answers").length,
    0
  );
});

test("writing lines that stopped growing do not hide the paper under them", () => {
  // The other half of the same rule, and the half this report used to be blind
  // to. Two ruled lines beside a tall chart are handed the chart's height. They
  // cannot use it: a line reaches its useful size at half again its own height
  // and stops, and the rest prints as blank paper INSIDE the block a child
  // writes in - which is where History Sheet A's gaps came from (8 September
  // 2026). "It can grow" was being read as "it grew".
  const result = tightnessOf(
    sheet({
      parts: [1.8, 1],
      row: [
        chart,
        { helper: "written-answers", items: [{ text: "Explain how you know.", lines: 2 }] },
      ],
    })
  );

  const found = result.spare.find((s) => s.label === "written-answers");
  assert.ok(found, "two ruled lines given a chart's height should be named");
  assert.equal(
    found.overgrown,
    true,
    "this is a box bigger than its answer, not a hole beneath one"
  );
  assert.match(
    describeTightness(result),
    /bigger than the answer it holds/,
    "the message has to say which of the two faults it found"
  );
});

test("one gap is reported once, at the level that owns it", () => {
  // A row is handed its zone's height and passes that same height down to each
  // item inside it, so an over-tall row and all its children show the identical
  // gap. Said three times it reads as three faults and three places to fix one
  // decision.
  const result = tightnessOf({
    title: "Reading a bar chart",
    lo: "To read a bar chart",
    layout: "full",
    orientation: "portrait",
    zones: { a: { row: [chart, chart] } },
  });

  assert.equal(result.spare.length, 1);
  assert.match(result.spare[0].label, /^a row of/);
});

test("a stack is never accused of leaving room under its items", () => {
  // Stacked, each item takes its own natural height, so there is no imposed
  // height to be short of. The old report skipped height entirely for this
  // reason, and that reason still holds.
  const result = tightnessOf(
    sheet({
      stack: [
        { helper: "questions", items: ["How many books did Birch read?"] },
        { helper: "questions", items: ["Which class read the fewest?"] },
      ],
    })
  );

  // The stack itself may own a gap against its zone, which is fair. What must
  // never happen is each item inside it being blamed for height it was never
  // given a choice about.
  assert.equal(
    result.spare.filter((s) => s.zone === "a" && s.label === "questions").length,
    0
  );
});

test("a clean sheet says so about height as well as width", () => {
  const result = tightnessOf(sheet(chart));
  if (!result.cramped.length && !result.squashed.length && !result.spare.length) {
    assert.match(describeTightness(result), /nothing is sitting over blank paper/i);
  }
});
