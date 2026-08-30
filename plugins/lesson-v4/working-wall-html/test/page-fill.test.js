"use strict";

// A card takes the whole A3 page, not the height of its own text.
//
// The run this came from: a Year 4 worked example with four short steps and one
// photograph left a blank white band across the full width of the bottom fifth
// of the A3 sheet. The visual reviewer raised it as blocking, and the focused
// wall repair could not fix it, because no field in working-wall.json controls
// vertical fill - the leftover was the page's, not the card's. The card body
// now grows into it, and a panel taller than its own text centres that text
// rather than reopening the same band inside the panel.

const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");

const style = require("../style.json");
const { PAGE_CSS } = require("../src/shared");
const { renderWorkedExample, renderStickyKnowledge, renderMisconception } = require("../src/render-panels");

const FIXTURES_DIR = path.join(__dirname, "..", "test-fixtures-a3");

function seriesCircuitCard(extra = {}) {
  return {
    type: "workedExample",
    page: { size: "A3", orientation: "landscape" },
    title: "How to do it",
    items: [
      { label: "Step 1", text: "Choose a cell, a lamp or buzzer, and two wires." },
      { label: "Step 2", text: "Join each wire to a different end of the cell." },
      { label: "Step 3", text: "Join both free wire ends to the lamp or buzzer." },
      { label: "Step 4", text: "Check the loop has no gaps." },
    ],
    ...extra,
  };
}

test("the page core lays its children out as a column with one growing body", () => {
  assert.match(PAGE_CSS, /\.page-core \{[^}]*flex-direction: column/);
  assert.match(PAGE_CSS, /\.page-core > \.wall-body \{[^}]*flex: 1 1 auto/);
  assert.match(PAGE_CSS, /\.wall-panel \{[^}]*justify-content: center/);
});

test("a worked example beside a photo marks its body as the growing block", () => {
  const html = renderWorkedExample(
    seriesCircuitCard({ photo: "photos/pizza.jpg" }),
    style,
    FIXTURES_DIR,
    { svgImages: {} }
  );

  assert.ok(
    html.includes('class="wall-body"'),
    "expected the panel-and-photo row to carry the growing-body class"
  );
  assert.ok(
    /class="wall-body" style="display:flex;align-items:stretch/.test(html),
    "expected the row to stretch its columns, so the panel reaches the page bottom"
  );
  assert.ok(html.includes('class="wall-panel"'), "expected the panel to centre its own steps");
});

test("a text-only card is itself the growing block", () => {
  const html = renderStickyKnowledge(
    {
      type: "stickyKnowledge",
      page: { size: "A3", orientation: "landscape" },
      title: "Remember",
      items: [{ text: "A circuit needs a closed path for electricity to flow." }],
    },
    style,
    FIXTURES_DIR,
    { svgImages: {} }
  );

  assert.ok(
    html.includes('class="wall-body wall-panel"'),
    "expected a standalone panel to be both the growing body and a centring panel"
  );
});

test("the Don't/Do pair grows together rather than leaving a band beneath it", () => {
  const html = renderMisconception(
    {
      type: "misconception",
      page: { size: "A3", orientation: "landscape" },
      title: "Look out for",
      items: [
        { label: "Don't", text: "Leave a wire clip resting near the lamp." },
        { label: "Do", text: "Clip each wire firmly onto the connection." },
      ],
    },
    style,
    FIXTURES_DIR,
    { svgImages: {} }
  );

  assert.ok(html.includes('class="wall-body"'), "expected the two-up pair to be the growing body");
});

test("a card's title bar keeps its own height", () => {
  const html = renderWorkedExample(seriesCircuitCard(), style, FIXTURES_DIR, {
    svgImages: {},
  });

  // The title bar is the first block and must not be stretched with the body;
  // the page-core rule pins every non-body child to its natural height.
  assert.match(PAGE_CSS, /\.page-core > \* \{ flex: 0 0 auto; \}/);
  assert.ok(html.indexOf("How to do it") < html.indexOf('class="wall-body wall-panel"'));
});
