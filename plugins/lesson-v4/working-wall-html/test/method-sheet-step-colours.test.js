"use strict";

// The one-big-picture method sheet gives every step a colour of its own.
//
// The teacher, on the sheet for column subtraction (10 October 2026): the
// step numbers were all green with black text, "and there's not really a clear
// separation between each one and what's with what". So each step is a card
// in its own colour, numbered in that colour; its circle on the picture is the
// same colour; and an exchange is the colour of the step pinned to it. These
// pin the match, which is what tells a child what goes with what.

const test = require("node:test");
const assert = require("node:assert");

const style = require("../style.json");
const { preRenderSvgs, badgeKey } = require("../src/svg-renderer");
const { renderPictureFirstWorkedExample } = require("../src/render-method");
const { methodVisual, stepTheme } = require("../src/step-colours");

const CARD = {
  type: "workedExample",
  layout: "pictureFirst",
  page: { size: "A3", orientation: "portrait" },
  title: "How to subtract in columns",
  items: [
    { label: "Worked example", text: "5,342 − 2,178 = 3,164" },
    { label: "Step 1", text: "Start with the ones.", working: "2 − 8: not enough" },
    { label: "Step 2", text: "Exchange 1 ten.", working: "1 ten = 10 ones" },
    { label: "Step 3", text: "Subtract the ones.", working: "12 − 8 = 4" },
    { label: "Step 4", text: "Exchange 1 hundred.", working: "1 hundred = 10 tens" },
  ],
  visual: {
    type: "place-value-chart",
    calculation: { operator: "-", numbers: ["5342", "2178"], answer: "3164", exchanges: [{ from: "T", to: "O" }, { from: "H", to: "T" }] },
    callouts: [{ part: "ones number 2", step: 1 }, { part: "tens exchange", step: 2 }, { part: "ones answer", step: 3 }, { part: "hundreds exchange", step: 4 }],
  },
};

test("each step's circle on the picture, and the exchange it is pinned to, take that step's colour", () => {
  const visual = methodVisual(CARD);
  assert.deepEqual(visual.callouts.map((c) => c.colour), [1, 2, 3, 4].map((n) => stepTheme(n).main));
  assert.deepEqual(visual.calculation.exchanges.map((e) => e.colour), [stepTheme(2).main, stepTheme(4).main], "the ten exchanged at step 2, the hundred at step 4");
  assert.equal(new Set(visual.callouts.map((c) => c.colour)).size, 4, "four steps, four colours");
});

test("each step in the list is a card in its colour, numbered and worked in the same colour", async () => {
  const svgImages = await preRenderSvgs({ cards: [CARD] }, __dirname);
  for (const n of [1, 2, 3, 4]) assert.ok(svgImages[badgeKey(n, stepTheme(n).main)], `a number ${n} in its own colour was drawn`);
  const html = renderPictureFirstWorkedExample(CARD, style, __dirname, { svgImages });
  const rows = html.split('data-part="step"').slice(1);
  assert.equal(rows.length, 4);
  rows.forEach((row, index) => {
    const theme = stepTheme(index + 1);
    assert.match(row, new RegExp(`background:#${theme.fill};border:[0-9.]+mm solid #${theme.main}`), `step ${index + 1} is a card in its colour`);
    assert.match(row, new RegExp(`data-part="working"[^>]*color:#${theme.main}`), `and its working is that colour`);
  });
});

test("a picture on any other card is drawn as written", () => {
  const plain = { ...CARD, layout: undefined };
  assert.equal(methodVisual(plain), plain.visual);
});
