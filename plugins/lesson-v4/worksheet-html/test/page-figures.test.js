"use strict";

// The sizes the designers plan with are the engine's own (9 October 2026).
//
// The stress test of 7 October 2026 found the planners' notes wrong in the
// same direction everywhere: a portrait page given as 225mm that held 239mm,
// the gap under a question 8mm where it printed 6mm, a speech bubble 35mm for
// 21mm. The figures were typed by hand in four places and only the engine was
// kept up to date. They are now worked out in src/page-figures.js and written
// into the documents by scripts/build-page-prices.js. These fail when a size
// moves in the engine and a document still says the old one: run
// `npm run page-prices`.

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const helpers = require("../src/helpers");
const { SPACE } = require("../src/tokens");
const { TRIM_STRIP_MM, EDGE_MM, pageSize } = require("../src/page");
const {
  pageFigures,
  measureFooter,
  measurePrices,
  pricesSentence,
  numbersIn,
} = require("../src/page-figures");
const { places } = require("../scripts/build-page-prices");

const ROOT = path.join(__dirname, "..", "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function hasChrome() {
  try {
    return Boolean(require("../src/chrome").findChrome());
  } catch {
    return false;
  }
}

test("the page figure is the whole work area: the paper less the edge and the 43mm strip", () => {
  const f = pageFigures();
  assert.equal(f.portrait.heightMm, pageSize("portrait").heightMm - EDGE_MM - TRIM_STRIP_MM);
  assert.equal(f.landscape.heightMm, 180);
  assert.ok(f.landscape.widthMm < pageSize("landscape").widthMm - EDGE_MM - TRIM_STRIP_MM + 0.5);
});

test("the gaps a planner adds are the gaps the page prints", () => {
  const f = pageFigures();
  assert.equal(f.questionGapMm, SPACE.item + SPACE.tight, "the gap above a new question");
  assert.equal(f.rowGapMm, SPACE.item, "the gap between two pieces side by side");
  assert.equal(f.numberGutterMm, 10, "the width a printed question number takes");
  const footer = measureFooter(f);
  assert.match(footer, new RegExp(`${f.questionGapMm}mm between one question and the next`));
  assert.match(footer, new RegExp(`plus ${f.rowGapMm}mm between each`));
  assert.match(footer, new RegExp(`takes ${f.numberGutterMm}mm of width`));
});

test("every document that states a page size states the engine's (npm run page-prices)", () => {
  const f = pageFigures();
  // The price list is the one place that needs a browser; it has its own test.
  for (const place of places(f, null).filter((p) => p.what !== "the price list")) {
    const match = place.find.exec(read(place.file));
    assert.ok(match, `${place.file} no longer carries ${place.what}`);
    assert.equal(
      match[0],
      place.write(match),
      `${place.file} is out of date on ${place.what} - run npm run page-prices`
    );
  }
});

test("no planner is told a smaller page than the sheet has", () => {
  const f = pageFigures();
  for (const file of [
    "references/preferences.md",
    "agents/adaptation-designer.md",
    "references/lesson-designer-components.md",
  ]) {
    const stated = /(?:about )?(\d+)mm of stacked height/.exec(read(file));
    assert.ok(stated, `${file} no longer states the page's height`);
    assert.equal(Number(stated[1]), f.portrait.heightMm, file);
    assert.ok(!stated[0].startsWith("about"), `${file} hedges the page height`);
  }
});

test("the price list in preferences.md is what the browser measures", { skip: !hasChrome() }, async () => {
  const f = pageFigures();
  let prices;
  try {
    prices = await measurePrices();
  } finally {
    helpers.clearBrowserHeights();
  }
  assert.equal(prices.measured, true);
  const place = places(f, prices).find((p) => p.what === "the price list");
  const match = place.find.exec(read(place.file));
  assert.ok(match, "preferences.md has lost its price list");
  const written = numbersIn(match[0]);
  const fresh = numbersIn(pricesSentence(prices, f));
  assert.equal(written.length, fresh.length, "the price list has gained or lost a price - run npm run page-prices");
  fresh.forEach((mm, i) => {
    // Another machine's copy of the font can move a height by a millimetre.
    assert.ok(
      Math.abs(mm - written[i]) <= 2,
      `price ${i + 1} is written as ${written[i]}mm and measures ${mm}mm - run npm run page-prices`
    );
  });
});
