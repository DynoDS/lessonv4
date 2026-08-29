"use strict";

// A zone must be drawn with room to be wrong in.
//
// Every height in this engine is an ESTIMATE, because the overnight box has no
// browser to measure with. The browser then draws the same content a fraction
// taller or shorter, and `.zone` has `overflow: hidden`, so a zone handed
// exactly its estimate clips the moment the estimate runs a hair short.
//
// That is not hypothetical. An overnight run ended with a worksheet refused for
// being 1015px tall in a 1009px zone - six pixels, about a millimetre and a
// half - and the lesson was delivered without its worksheets or its answer key.
// The page that refused it was NOT full. Its zone simply had no tolerance,
// because content that cannot stretch was given its estimate to the millimetre
// however much room the page had going spare.

const assert = require("node:assert/strict");
const test = require("node:test");

const { renderSheet, measureFill, GUTTER_MM } = require("../src/render");
const { comfortPenalty } = require("../src/suggest");
const { measureContent } = require("../src/helpers");
const { printableArea, DEFAULT_MARGIN_MM } = require("../src/page");

const PX_PER_MM = 96 / 25.4;

// The observed failure, in millimetres: 1015px of content in a 1009px zone.
const OBSERVED_SHORTFALL_MM = 6 / PX_PER_MM;

// `data-table` is a reference table. It has greed 0 - it never stretches -
// which is exactly the content that used to be given no tolerance at all.
const referenceTable = (caption) => ({
  helper: "data-table",
  caption,
  columns: ["Material", "Waterproof?"],
  rows: [
    ["Glass", "yes"],
    ["Cardboard", "no"],
    ["Wool", "no"],
    ["Plastic", "yes"],
  ],
});

function drawnZoneHeights(spec) {
  const html = renderSheet(spec);
  const text = typeof html === "string" ? html : String(html.html || html);
  const heights = {};
  for (const m of text.matchAll(/data-worksheet-zone="([^"]+)"[^>]*?height:([\d.]+)mm/gs)) {
    heights[m[1]] = Number(m[2]);
  }
  return heights;
}

// The sheet that failed: two reference tables sharing one zone.
const TWO_TABLES = {
  title: "Tolerance",
  layout: "halves-stacked",
  orientation: "portrait",
  zones: {
    a: { stack: [referenceTable("What we know already"), referenceTable("What we found out")] },
    b: { helper: "questions", question: true, items: ["Why?", "How do you know?"] },
  },
};

test("a zone holding content that cannot stretch is still drawn taller than its estimate", () => {
  const area = printableArea("portrait", DEFAULT_MARGIN_MM);
  const estimate = measureContent(TWO_TABLES.zones.a, area.widthMm - GUTTER_MM);
  const drawn = drawnZoneHeights(TWO_TABLES);

  assert.ok(drawn.a, "the zone was not drawn at all");
  assert.ok(
    drawn.a > estimate,
    `zone "a" was drawn at ${drawn.a.toFixed(2)}mm, which is its estimate to the ` +
      "millimetre. An estimate that runs short by a hair then clips."
  );
});

test("the tolerance covers the six pixels that cost a lesson its worksheets", () => {
  const area = printableArea("portrait", DEFAULT_MARGIN_MM);
  const estimate = measureContent(TWO_TABLES.zones.a, area.widthMm - GUTTER_MM);
  const drawn = drawnZoneHeights(TWO_TABLES);

  assert.ok(
    drawn.a - estimate >= OBSERVED_SHORTFALL_MM,
    `zone "a" was given ${(drawn.a - estimate).toFixed(2)}mm of tolerance, and the ` +
      `failure that prompted this needed ${OBSERVED_SHORTFALL_MM.toFixed(2)}mm.`
  );
});

test("a page with room going spare gives every zone some of it, not just the greedy ones", () => {
  const fill = measureFill(TWO_TABLES);
  assert.ok(
    fill.fillPct < 70,
    `this fixture is meant to leave the page roomy; it came out ${fill.fillPct}% full`
  );

  const area = printableArea("portrait", DEFAULT_MARGIN_MM);
  const drawn = drawnZoneHeights(TWO_TABLES);

  for (const [id, content] of Object.entries(TWO_TABLES.zones)) {
    const estimate = measureContent(content, area.widthMm - GUTTER_MM);
    assert.ok(
      drawn[id] > estimate,
      `zone "${id}" was drawn at exactly its estimate on a page ${fill.fillPct}% full`
    );
  }
});

// The tolerance is taken from height the page genuinely has spare. It must
// never be taken from height the page does not have, or a sheet that fitted
// yesterday would be refused today.
test("tolerance never pushes a sheet that fitted over the edge of the page", () => {
  // Built by search rather than by hand, so it stays a nearly-full page even if
  // a helper's own measurements change underneath it.
  const sheetWith = (tables) => ({
    title: "Tight",
    layout: "halves-stacked",
    orientation: "portrait",
    zones: {
      a: { stack: Array.from({ length: tables }, (_, i) => referenceTable(`Table ${i + 1}`)) },
      b: { helper: "questions", question: true, items: ["Why?"] },
    },
  });

  let tight = null;
  for (let tables = 1; tables <= 20; tables += 1) {
    const candidate = sheetWith(tables);
    const fill = measureFill(candidate);
    if (fill.usedMm > fill.availableMm) break;
    tight = { spec: candidate, fill };
  }

  assert.ok(tight, "no number of tables produced a sheet that fits");
  assert.ok(
    tight.fill.fillPct >= 80,
    `this test needs a nearly-full page; the fullest that fits was ${tight.fill.fillPct}%`
  );

  const area = printableArea("portrait", DEFAULT_MARGIN_MM);
  const drawn = drawnZoneHeights(tight.spec);
  const total = Object.values(drawn).reduce((a, b) => a + b, 0) + GUTTER_MM;

  assert.ok(
    total <= area.heightMm + 0.01,
    `the drawn zones total ${total.toFixed(2)}mm on a ${area.heightMm.toFixed(2)}mm page`
  );
});

// A sheet the arithmetic refuses must still be refused. Tolerance is spare room
// handed out, never a relaxation of what counts as fitting.
test("content genuinely too tall for the page is still refused", () => {
  const overfull = {
    title: "Overfull",
    layout: "halves-stacked",
    orientation: "portrait",
    zones: {
      a: { stack: Array.from({ length: 12 }, (_, i) => referenceTable(`Table ${i + 1}`)) },
      b: { helper: "questions", question: true, items: ["Why?"] },
    },
  };

  assert.throws(
    () => renderSheet(overfull),
    /SHEET_DOES_NOT_FIT/,
    "a sheet far taller than the page was accepted"
  );
});

// ─── the roomier arrangement a clipped sheet falls back to ────────────────

const { roomierArrangements } = require("../src/suggest");
const { flatten } = require("../src/layouts");
const { getLayout } = require("../src/render");

const contentsInReadingOrder = (spec) =>
  flatten(getLayout(spec.layout).tree).map((z) => JSON.stringify(spec.zones[z.id]));

test("a roomier arrangement keeps every zone's content, in the same order", () => {
  const options = roomierArrangements(TWO_TABLES);
  assert.ok(options.length > 0, "no roomier arrangement was offered at all");

  const original = contentsInReadingOrder(TWO_TABLES);
  for (const option of options) {
    assert.deepEqual(
      contentsInReadingOrder(option.spec),
      original,
      `"${option.layout}" changed what is on the sheet or the order it comes in`
    );
  }
});

test("only genuinely roomier arrangements are offered", () => {
  const before = measureFill(TWO_TABLES).fillPct;
  for (const option of roomierArrangements(TWO_TABLES)) {
    assert.ok(
      option.fillPct < before,
      `"${option.layout}" was offered at ${option.fillPct}%, no roomier than the ` +
        `${before}% arrangement that clipped`
    );
  }
});

test("the page shape the designer chose is kept", () => {
  for (const option of roomierArrangements(TWO_TABLES)) {
    assert.equal(
      option.orientation,
      TWO_TABLES.orientation,
      `"${option.layout}" quietly turned the page`
    );
  }
});

test("roomier arrangements come back most comfortable first", () => {
  const options = roomierArrangements(TWO_TABLES);
  for (let i = 1; i < options.length; i++) {
    assert.ok(
      comfortPenalty(options[i - 1].fillPct) <= comfortPenalty(options[i].fillPct),
      "a less comfortable arrangement was offered ahead of a better one"
    );
  }
});

test("every roomier arrangement offered actually renders", () => {
  for (const option of roomierArrangements(TWO_TABLES).slice(0, 5)) {
    assert.doesNotThrow(
      () => renderSheet(option.spec),
      `"${option.layout}" was offered as a fallback and then refused to render`
    );
  }
});
