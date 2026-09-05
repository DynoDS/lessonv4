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

// ─── a wide worked diagram is not pinned to a fifth of the sheet ──────────
//
// The panel's autofit grows its text to fill whatever height it is left, so
// every inch not reserved for the figure becomes bigger body text and none of
// it ever reaches the figure. At a flat fifth, a Year 4 place-value wall ran
// its five method steps in very large type down three quarters of an A3 sheet
// with the worked chart - the thing a child looks up to check WHICH column
// changed - as a small band at the foot. Daniel chose the bigger diagram from
// two rendered options (5 September 2026).
//
// A flat bigger fraction was the wrong instrument: a third pushed both a
// three-item landscape worked example and the six-item portrait card this was
// meant to fix 0.1in under the floor size their own text needs. So the figure
// is OFFERED the generous share and hands back whatever the panel cannot give
// up, which is what these two pin.

const { wideVisualReserveInches, WIDE_VISUAL_SHARE_GUARANTEED, WIDE_VISUAL_SHARE_GENEROUS } =
  require("../src/visuals");
const { printableInches } = require("../src/layout");

const wideCard = (orientation) => ({
  page: { size: "A3", orientation },
  visual: { type: "placeValueChart", rows: [] },
});

// A wide visual whose aspect is not the binding term, so the share is.
const wideCtx = { svgImages: { k: { png: Buffer.from("x"), aspect: 2.2 } } };
const stubPick = { buf: Buffer.from("x"), aspect: 2.2 };

test("a panel with room to spare gives the wide figure more than the guaranteed fifth", () => {
  const card = wideCard("portrait");
  const dims = printableInches("A3", "portrait", style);
  const guaranteed = Math.min((dims.width * 0.96) / 2.2, dims.height * WIDE_VISUAL_SHARE_GUARANTEED) + 0.25;

  // A panel that fits at its floor whatever it is given: nothing to hand back.
  const roomy = wideVisualReserveInches(card, { svgImages: {} }, style, () => true);
  if (roomy === 0) return; // no visual resolved in this stub context

  assert.ok(
    roomy > guaranteed,
    `a panel with room to spare kept the figure at the guaranteed share (${roomy} vs ${guaranteed})`
  );
});

test("a panel that cannot afford the generous share keeps its own text floor", () => {
  const card = wideCard("portrait");
  // A panel that never fits at floor with any reserve above the guarantee.
  const tight = wideVisualReserveInches(card, { svgImages: {} }, style, () => false);
  const dims = printableInches("A3", "portrait", style);
  const guaranteed = Math.min((dims.width * 0.96) / 2.2, dims.height * WIDE_VISUAL_SHARE_GUARANTEED) + 0.25;
  if (tight === 0) return;

  assert.ok(
    tight <= guaranteed + 0.001,
    `a panel that cannot afford more was still charged for it (${tight} vs ${guaranteed})`
  );
});
