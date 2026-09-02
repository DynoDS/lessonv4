"use strict";

// Visual contract tests for the wall's own rendering rules: a promised photo
// must land on the page at wall scale, an unreadable promised photo must stop
// the build rather than render a text-only stand-in, wrapped numbered steps
// keep their badge beside the first line, and tall tables cap row images.

const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");

const style = require("../style.json");
const { renderWorkedExample, renderMisconception } = require("../src/render-panels");
const { renderReferenceTable } = require("../src/render-grids");
const { assertRequiredPhotosAreReadable } = require("../build");

const FIXTURES_DIR = path.join(__dirname, "..", "test-fixtures-a3");

// The same inches-to-mm conversion the renderers use (shared.mm).
function mm(inches) {
  return Math.round(inches * 25.4 * 100) / 100;
}

function workedExampleCard(extra = {}) {
  return {
    type: "workedExample",
    page: { size: "A3", orientation: "landscape" },
    title: "How to do it",
    items: [
      {
        label: "Step 1",
        text:
          "Check the denominators (bottom numbers) match before you add anything at all to the numerators.",
      },
      { label: "Step 2", text: "Add only the numerators. Keep the denominator." },
      { label: "Worked example", text: "2/5 + 1/5 = 3/5" },
    ],
    ...extra,
  };
}

test("a worked example with a photo contains an image", () => {
  const html = renderWorkedExample(
    workedExampleCard({ photo: "photos/pizza.jpg" }),
    style,
    FIXTURES_DIR,
    { svgImages: {} }
  );

  assert.ok(html.includes("<img"), "expected the promised photo to render as an image");
});

test("a worked example with a resolved Educational SVG picture contains an image", () => {
  const html = renderWorkedExample(
    workedExampleCard({
      picture: {
        kind: "educational-svg",
        concept: "pizza",
        context: "A pizza used as the card's context cue.",
        avoid: [],
        educationalSvgId: "standard/pi/pizza.svg",
        educationalSvgSlug: "pizza",
        imagePath: "photos/pizza.jpg",
      },
    }),
    style,
    FIXTURES_DIR,
    { svgImages: {} }
  );

  assert.ok(html.includes("<img"), "expected the resolved Educational SVG picture to render as an image");
});

test("a worked example with an emoji picture renders the emoji visual", () => {
  const html = renderWorkedExample(
    workedExampleCard({
      picture: { kind: "emoji", value: "\u{1F56F}\uFE0F", alt: "lit candle" },
    }),
    style,
    FIXTURES_DIR,
    { svgImages: {} }
  );

  assert.ok(
    html.includes('data-context-picture="emoji"'),
    "expected the emoji picture to use the visual rendering path"
  );
  assert.ok(html.includes("\u{1F56F}\uFE0F"), "expected the emoji value to be visible");
});

test("a misconception with an emoji picture renders the emoji beneath the pair", () => {
  const html = renderMisconception(
    {
      type: "misconception",
      page: { size: "A3", orientation: "landscape" },
      title: "Look out for",
      items: [
        { label: "Don't", text: "Touch the plug with wet hands." },
        { label: "Do", text: "Keep your hands dry around electrical appliances." },
      ],
      picture: { kind: "emoji", value: "\u{1F50C}", alt: "electrical plug" },
    },
    style,
    FIXTURES_DIR,
    { svgImages: {} }
  );

  assert.ok(
    html.includes('data-context-picture="emoji"'),
    "expected the misconception emoji to use the visual rendering path"
  );
  assert.ok(html.includes("\u{1F50C}"), "expected the misconception emoji to be visible");
});

test("a tile with no photograph is refused before the render, named by card and tile", () => {
  // A geography wall's repair removed four unavailable tile photos, which the
  // repair-scope check and the JSON both accepted, and the build then failed
  // with `could not read required photo "undefined"` naming neither the tile
  // nor the fact that the field was gone. On these families the photograph IS
  // the tile, so the whole spec is checked first and every gap is reported.
  const card = {
    type: "photoMapOverview",
    title: "Biome examples",
    page: { size: "A3", orientation: "landscape" },
    tiles: [
      { title: "The Sahara", caption: "Desert biome." },
      { title: "The Arctic", photo: "photos/no-such-photo.jpg", caption: "Tundra biome." },
      { title: "The Amazon", photo: "photos/pizza.jpg", caption: "Rainforest biome." },
    ],
    map: { photo: "photos/pizza.jpg", caption: "Where they are" },
    keySentence: "A biome is a large region.",
  };

  assert.throws(
    () => assertRequiredPhotosAreReadable([card], FIXTURES_DIR),
    (error) => {
      assert.match(error.message, /2 required Working Wall photograph\(s\) missing/);
      assert.match(error.message, /Card "Biome examples" tile 1 "The Sahara" has no photo/);
      assert.match(error.message, /tile 2 "The Arctic" names "photos\/no-such-photo\.jpg"/);
      assert.match(error.message, /cannot[\s\S]*stand on its words/);
      return true;
    }
  );
});

test("a card whose photographs all read passes the same check", () => {
  const card = {
    type: "photoMapOverview",
    title: "Biome examples",
    page: { size: "A3", orientation: "landscape" },
    tiles: [
      { title: "One", photo: "photos/pizza.jpg" },
      { title: "Two", photo: "photos/pizza.jpg" },
      { title: "Three", photo: "photos/pizza.jpg" },
    ],
    map: { photo: "photos/pizza.jpg" },
  };
  assert.doesNotThrow(() => assertRequiredPhotosAreReadable([card], FIXTURES_DIR));
});

test("an unreadable worked-example photo stops the build with a named error", () => {
  assert.throws(
    () =>
      renderWorkedExample(
        workedExampleCard({ photo: "photos/no-such-photo.jpg" }),
        style,
        FIXTURES_DIR,
        { svgImages: {} }
      ),
    /could not read required worked-example photo "photos\/no-such-photo\.jpg"/
  );
});

test("a worked-example step row keeps its badge aligned to the top", () => {
  const html = renderWorkedExample(workedExampleCard(), style, FIXTURES_DIR, {
    svgImages: {},
  });

  assert.ok(
    /display:flex;align-items:flex-start/.test(html),
    "expected a step row with align-items:flex-start"
  );
});

test("a four-row table caps row images at 1.6 inches", () => {
  const card = {
    type: "referenceTable",
    page: { size: "A3", orientation: "landscape" },
    title: "Pizza fractions",
    columns: ["Fraction", "Picture"],
    rows: [
      ["1/2", { photo: "photos/pizza.jpg" }],
      ["1/4", { photo: "photos/pizza.jpg" }],
      ["3/4", { photo: "photos/pizza.jpg" }],
      ["1 whole", { photo: "photos/pizza.jpg" }],
    ],
  };

  const html = renderReferenceTable(card, style, FIXTURES_DIR, { svgImages: {} });

  const capped = `height:${mm(1.6)}mm`;
  const heights = [...html.matchAll(/<img [^>]*?height:([\d.]+)mm/g)].map((m) =>
    Number(m[1])
  );
  assert.ok(heights.length > 0, "expected at least one row image");
  assert.ok(
    heights.some((h) => h === mm(1.6)),
    `expected a row image capped at exactly ${capped}; heights: ${heights.join(", ")}`
  );
  assert.ok(
    heights.every((h) => h <= mm(1.6)),
    `row images must not exceed the ${capped} cap; heights: ${heights.join(", ")}`
  );
});

test("a worked example without a photo remains text-only", () => {
  const html = renderWorkedExample(workedExampleCard(), style, FIXTURES_DIR, {
    svgImages: {},
  });

  assert.ok(!html.includes("<img"), "expected no image when no photo was promised");
  assert.ok(html.includes("Add only the numerators. Keep the denominator."));
});
