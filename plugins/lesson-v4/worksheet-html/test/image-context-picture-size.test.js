"use strict";

// A context drawing a child could not recognise.
//
// On 30 August 2026 the Year 4 water-cycle worksheet (Sheet B, questions 1a
// and 1b) printed its wet-pavement and cold-window drawings at the fixed emoji
// slot size - "roughly the height of a single body-text letter ... a tiny grey
// squiggle" - and the run stayed BLOCKED on WORKSHEETS-001 because the
// renderer exposed no size to repair to. An emoji is a glyph and reads at text
// size; a drawn or photographed picture does not, so image pictures now get a
// taller slot, and the measurement counts that height so the zone cannot clip.

const test = require("node:test");
const assert = require("node:assert/strict");

const { REGISTRY } = require("../src/helpers");

const IMAGE_ITEM = {
  text: "Which change happened?",
  lines: 2,
  picture: { imageHref: "data:image/png;base64,iVBORw0KGgo=", alt: "wet pavement" },
};
const EMOJI_ITEM = {
  text: "Which change happened?",
  lines: 2,
  picture: { kind: "emoji", value: "💧", alt: "droplet" },
};

test("an image context picture renders at the larger image slot", () => {
  const html = REGISTRY["written-answers"].render({ items: [IMAGE_ITEM] }, 120);
  assert.match(html, /h-context-picture--image/);
});

test("an emoji context picture keeps the text-size slot", () => {
  const html = REGISTRY["written-answers"].render({ items: [EMOJI_ITEM] }, 120);
  assert.match(html, /h-context-picture--emoji/);
  assert.doesNotMatch(html, /h-context-picture--image/);
});

test("the taller image slot is measured, not free", () => {
  const withImage = REGISTRY["written-answers"].measure({ items: [IMAGE_ITEM] }, 120);
  const withEmoji = REGISTRY["written-answers"].measure({ items: [EMOJI_ITEM] }, 120);
  assert.ok(
    withImage > withEmoji,
    `an image row must be measured taller than an emoji row (${withImage} vs ${withEmoji})`
  );
});

test("questions rows also count the image picture's height", () => {
  const withImage = REGISTRY.questions.measure({ items: [IMAGE_ITEM] }, 120);
  const withEmoji = REGISTRY.questions.measure({ items: [EMOJI_ITEM] }, 120);
  assert.ok(withImage > withEmoji);
});
