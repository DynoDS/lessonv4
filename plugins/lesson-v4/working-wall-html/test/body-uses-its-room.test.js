"use strict";

// A card with room to spare sets its text at the size that room allows.
//
// The run this came from: a review of every working wall the engine had ever
// built found 35 of 47 sheets at or within a step of the 36pt floor, against a
// design ceiling of 80pt. Twenty sat exactly on the floor. The clearest case
// was a Year 4 science wall whose whole body was one sentence, "Pulp is the
// soft centre containing nerves and blood vessels.", set at the floor beside a
// photograph and centred in a panel that runs the height of an A3 sheet: a
// short sentence marooned in a large empty rectangle.
//
// The height was never the binding term. `fitLinearBodySize` walks down from
// the default size and rejects any size at which one item needs more than
// `maxLinesPerItem` lines, and `stackedBodyOpts` lifted that cap off the
// default 2 only for cards carrying a `visual`. A card carrying a `photo` got
// the same narrowed panel and kept the cap of 2, so in a 60%-width column the
// cap, not the page, decided the type size and drove it to the floor. Same
// card, same space: a cap of 2 returns 36pt and a cap of 4 returns 72pt.
//
// page-fill.test.js pins the CSS that lets the panel grow into the page. It
// asserts markup, so it passes whether the text that lands in that panel fills
// it or sits at the floor in the middle of it. These pin the outcome instead.

const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");

const style = require("../style.json");
const { renderStickyKnowledge, renderWorkedExample } = require("../src/render-panels");

const FIXTURES_DIR = path.join(__dirname, "..", "test-fixtures-a3");
const A3_LANDSCAPE = { size: "A3", orientation: "landscape" };

// The body lines are the largest repeated font-size in the card's HTML that is
// not the title bar; read them all and take the one the body items share.
function bodyPt(html) {
  const sizes = [...html.matchAll(/font-size:(\d+)pt/g)].map((m) => Number(m[1]));
  assert.ok(sizes.length > 0, "expected the card to set at least one font size");
  const counts = new Map();
  for (const s of sizes) counts.set(s, (counts.get(s) || 0) + 1);
  // The title appears once; body lines repeat, and on a one-item card the body
  // is the smaller of the two. Drop the single largest (the title) and take the
  // largest of what remains.
  const distinct = [...counts.keys()].sort((a, b) => b - a);
  return distinct.length > 1 ? distinct[1] : distinct[0];
}

const FLOOR_PT = style.sizes.a3BodyMinPt;

test("a one-sentence Remember card beside a photo does not sit at the floor size", () => {
  const html = renderStickyKnowledge(
    {
      type: "stickyKnowledge",
      page: A3_LANDSCAPE,
      title: "Remember",
      items: [{ text: "Pulp is the soft centre containing nerves and blood vessels." }],
      photo: "photos/pizza.jpg",
    },
    style,
    FIXTURES_DIR,
    { svgImages: {} }
  );

  const pt = bodyPt(html);
  assert.ok(
    pt > FLOOR_PT,
    `one sentence in a half-page panel on A3 was set at ${pt}pt, the ${FLOOR_PT}pt floor. ` +
      `The panel runs the height of the sheet, so the floor leaves it mostly empty.`
  );
});

test("a photo card and a visual card of the same shape are sized alike", () => {
  const items = [
    { text: "A continuity is something that has not changed." },
    { text: "A change is something that is different now." },
  ];
  const card = (extra) => ({
    type: "stickyKnowledge",
    page: A3_LANDSCAPE,
    title: "Remember",
    items,
    ...extra,
  });

  const withPhoto = bodyPt(
    renderStickyKnowledge(card({ photo: "photos/pizza.jpg" }), style, FIXTURES_DIR, { svgImages: {} })
  );
  const withVisual = bodyPt(
    renderStickyKnowledge(
      card({ visual: { type: "place-value-chart", columns: ["Th"], rows: [] } }),
      style,
      FIXTURES_DIR,
      { svgImages: {} }
    )
  );

  assert.strictEqual(
    withPhoto,
    withVisual,
    `the same two sentences in the same width of panel were set at ${withPhoto}pt beside a ` +
      `photograph and ${withVisual}pt beside a drawn visual. Which kind of picture sits next to ` +
      `the text is not a reason to change the size of the text.`
  );
});

test("a short worked example beside a photo grows past the floor", () => {
  const html = renderWorkedExample(
    {
      type: "workedExample",
      page: A3_LANDSCAPE,
      title: "Remember",
      items: [
        { label: "Step 1", text: "Give an example." },
        { label: "Step 2", text: "Explain what it means." },
      ],
      photo: "photos/pizza.jpg",
    },
    style,
    FIXTURES_DIR,
    { svgImages: {} }
  );

  const pt = bodyPt(html);
  assert.ok(pt > FLOOR_PT, `two short steps beside a photo were set at ${pt}pt, the ${FLOOR_PT}pt floor`);
});
