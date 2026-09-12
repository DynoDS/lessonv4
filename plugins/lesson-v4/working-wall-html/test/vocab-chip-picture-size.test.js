"use strict";

// A vocabulary chip's picture is sized by the room the page has, not by the
// size of the word next to it.
//
// The run this came from: a Year 4 science wall headed "Types of teeth" carried
// four chips - incisors, canines, premolars, molars - each with a photograph of
// that tooth. The photographs printed 1.2cm across, too small to tell an incisor
// from a molar, which is the entire job of the card. Below them, the bottom half
// of the A3 sheet was blank.
//
// The cause was `imagePt = chipPt * 1.1` then `imagePt / 96`: the picture was a
// multiple of the word's font size and the page's spare height never entered
// into it. Four chips sit in two rows on A3, so each row had better than four
// inches of height doing nothing.

const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");

const style = require("../style.json");
const { renderVocabChips } = require("../src/render-grids");

const FIXTURES_DIR = path.join(__dirname, "..", "test-fixtures-a3");

// Every image the card draws, with the side length it is drawn at.
function imageSidesInches(html) {
  return [...html.matchAll(/<img[^>]*style="[^"]*width:([\d.]+)mm;height:([\d.]+)mm/g)].map((m) => ({
    w: Number(m[1]) / 25.4,
    h: Number(m[2]) / 25.4,
  }));
}

function chipsCard(count) {
  const words = ["incisors", "canines", "premolars", "molars", "enamel", "dentine"];
  return {
    type: "vocabChips",
    page: { size: "A3", orientation: "landscape" },
    title: "Types of teeth",
    chips: Array.from({ length: count }, (_, i) => ({ word: words[i], photo: "photos/pizza.jpg" })),
  };
}

// A picture a child is meant to tell apart from three others, seen from a desk.
const MIN_USEFUL_INCHES = 1.5;

test("a four-chip card gives each picture the room its two rows have", () => {
  const html = renderVocabChips(chipsCard(4), style, FIXTURES_DIR, { svgImages: {} });
  const images = imageSidesInches(html);
  assert.strictEqual(images.length, 4, "expected a picture on each of the four chips");

  for (const img of images) {
    assert.ok(
      img.w >= MIN_USEFUL_INCHES,
      `a tooth photograph on a four-chip A3 card is drawn ${(img.w * 2.54).toFixed(1)}cm across. ` +
        `Two rows of chips leave better than four inches of height per row unused.`
    );
  }
});

test("a fuller card still fits, so the picture shrinks as rows are added", () => {
  const four = imageSidesInches(renderVocabChips(chipsCard(4), style, FIXTURES_DIR, { svgImages: {} }))[0];
  const six = imageSidesInches(renderVocabChips(chipsCard(6), style, FIXTURES_DIR, { svgImages: {} }))[0];
  assert.ok(
    six.w < four.w,
    `six chips share the page with three rows rather than two, so each picture should be smaller ` +
      `than on a four-chip card (got ${six.w.toFixed(2)}in against ${four.w.toFixed(2)}in)`
  );
});

test("the pictures stay square and the words keep their own room", () => {
  const html = renderVocabChips(chipsCard(4), style, FIXTURES_DIR, { svgImages: {} });
  const images = imageSidesInches(html);
  for (const img of images) {
    assert.ok(Math.abs(img.w - img.h) < 0.01, "a chip picture should stay square");
  }
  // The word is what a child reads first; the picture may not crowd it out.
  const pillInnerInches = (Math.floor((16.54 - 2 * (1.6 / 2.54)) * 1440 / 2) - 240) / 1440;
  assert.ok(
    images[0].w <= pillInnerInches * 0.5,
    `the picture takes ${((images[0].w / pillInnerInches) * 100).toFixed(0)}% of the chip's width, ` +
      `leaving too little for the word`
  );
});
