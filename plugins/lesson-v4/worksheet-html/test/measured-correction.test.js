"use strict";

// The browser overruling the arithmetic, zone by zone.
//
// Every height in this engine is an estimate, and the safety margins cover the
// ordinary hair of error. What they cannot cover is an estimate that runs
// short by more than the margin - a hundred square once measured 3.5mm shorter
// than Chrome drew it, the margin was 1.8mm, and the whole worksheet set was
// refused over the difference. The build now feeds the browser's measured
// shortfall back into one re-render: the clipped zone is grown by exactly what
// the browser proved it needs, paid for from the page's spare height, before
// any reshape or refusal is considered.
//
// These tests cover the renderSheet half of that loop: `extraZoneMm` must grow
// the named zone, must be paid from real slack, and must refuse - not clip -
// when the page has no slack to pay with.

const assert = require("node:assert/strict");
const test = require("node:test");

const { renderSheet } = require("../src/render");

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

const ROOMY_SHEET = {
  title: "Correction",
  layout: "halves-stacked",
  orientation: "portrait",
  zones: {
    a: { stack: [referenceTable("What we know already"), referenceTable("What we found out")] },
    b: { helper: "questions", question: true, items: ["Why?", "How do you know?"] },
  },
};

function drawnZoneHeights(html) {
  const heights = {};
  for (const m of html.matchAll(/data-worksheet-zone="([^"]+)"[^>]*?height:([\d.]+)mm/gs)) {
    heights[m[1]] = Number(m[2]);
  }
  return heights;
}

test("a measured correction grows exactly the zone it names", () => {
  const plain = drawnZoneHeights(renderSheet(ROOMY_SHEET));
  const grown = drawnZoneHeights(renderSheet(ROOMY_SHEET, { extraZoneMm: { a: 5 } }));

  assert.ok(plain.a && grown.a, "zone a must be drawn in both renders");
  assert.ok(
    grown.a >= plain.a + 4,
    `zone "a" was corrected by 5mm but only grew from ${plain.a.toFixed(2)}mm ` +
      `to ${grown.a.toFixed(2)}mm`
  );
});

test("a correction the page cannot afford refuses rather than clips", () => {
  // Far more than any page has spare: the shortfall check must fire, exactly
  // as it does for content that was always too tall.
  assert.throws(
    () => renderSheet(ROOMY_SHEET, { extraZoneMm: { a: 5000 } }),
    /SHEET_DOES_NOT_FIT/,
    "an unaffordable correction must be refused through the normal shortfall check"
  );
});

test("no correction means the page is drawn exactly as before", () => {
  assert.equal(
    renderSheet(ROOMY_SHEET),
    renderSheet(ROOMY_SHEET, { extraZoneMm: {} }),
    "an empty correction map must not change a byte of the page"
  );
});
