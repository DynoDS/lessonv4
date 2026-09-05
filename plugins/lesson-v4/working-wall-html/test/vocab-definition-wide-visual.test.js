"use strict";

// A vocabDefinition card carrying a WIDE visual used to crash the build.
//
// `renderVocabDefinition` builds a `bodyFitsAtFloor` closure that reads
// `items`, hands it to `wideVisualReserveInches`, and declared `const items`
// AFTER that call. `wideVisualReserveInches` invokes the callback whenever the
// card's figure is wider than tall, so the card died on
// "Cannot access 'items' before initialization" before drawing anything.
//
// The three other panel renderers in that file already declared `items` first.
// This one was the odd one out, and the cost was real: a fresh Year 4 maths
// run shipped its working wall without the card defining `exchange`, the word
// two of its own method steps hang on. The designer met the crash, could not
// see past it, and dropped the card.

const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");

const style = require("../style.json");
const { renderVocabDefinition } = require("../src/render-panels");

const FIXTURES_DIR = path.join(__dirname, "fixtures");

// A part-whole bar model is wider than it is tall, which is what routes the
// card down the wide-visual branch and calls the closure. A tall or square
// figure never reached the bug, which is why it survived so long.
const wideVisualCard = (definition) => ({
  type: "vocabDefinition",
  page: { size: "A3", orientation: "landscape" },
  title: "Exchange",
  definition,
  visual: {
    type: "bar-model",
    shape: "part-whole",
    whole: { label: "100" },
    parts: [{ label: "60" }, { label: "40" }],
  },
});

test("a vocabDefinition with a wide visual renders instead of crashing", () => {
  const html = renderVocabDefinition(
    wideVisualCard("Swap ten in one column for one in the next column along."),
    style,
    FIXTURES_DIR,
    { svgImages: {} }
  );

  assert.ok(html, "the card should have produced markup");
  assert.match(html, /Exchange/);
});

test("the crash is a temporal dead zone, so it fires whatever the definition says", () => {
  // The failure was unconditional once the wide branch was taken: it happened
  // before any measurement of the text. Pinning a second, much longer
  // definition proves the fix is the declaration order rather than one string
  // happening to fit.
  const long =
    "When a column gets to ten, you swap those ten for one in the next column " +
    "along. Ten tens become one hundred, and that is the swap the word names.";

  let error = null;
  try {
    renderVocabDefinition(wideVisualCard(long), style, FIXTURES_DIR, { svgImages: {} });
  } catch (caught) {
    error = caught;
  }

  if (error) {
    assert.doesNotMatch(
      String(error.message),
      /before initialization/,
      "a long definition must be refused on its own terms, never with a ReferenceError"
    );
  }
});
