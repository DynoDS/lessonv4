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
const fs = require("node:fs");
const os = require("node:os");
const sharp = require("sharp");

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

// His answers of 10 October 2026, from pictures of an Athens and Sparta word
// sheet. Every chip photograph had been drawn in a square whatever its shape,
// so a wide hillside was squeezed thin and a tall statue squashed fat (the
// fault a fact sheet had too, stress test of 7 October 2026), and the chips
// stopped two thirds of the way down the sheet.
const PILL_INNER_INCHES = (Math.floor((16.54 - 2 * (1.6 / 2.54)) * 1440 / 2) - 240) / 1440;

// A folder of plain photographs of the shapes named, made for the test.
async function photosOfShapes(shapes) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wall-chip-shapes-"));
  for (const [name, w, h] of shapes) {
    await sharp({ create: { width: w, height: h, channels: 3, background: "#7799bb" } }).jpeg().toFile(path.join(dir, `${name}.jpg`));
  }
  return dir;
}

function shapesCard(words, photos) {
  return {
    type: "vocabChips",
    page: { size: "A3", orientation: "landscape" },
    title: "Athens and Sparta words",
    chips: words.map((word, i) => ({ word, ...(photos[i] ? { photo: `${photos[i]}.jpg` } : {}) })),
  };
}

const wordPt = (html) => Number(html.match(/font-size:([\d.]+)pt;color:#[0-9A-Fa-f]{6};">citizen</)[1]);

test("a wide photograph and a tall one both print at their own shape", async () => {
  const dir = await photosOfShapes([["wide", 1920, 1137], ["tall", 2142, 2949], ["square", 1000, 1000]]);
  try {
    const html = renderVocabChips(shapesCard(["citizen", "warrior", "valley", "leader"], ["wide", "tall", "square", "wide"]), style, dir, { svgImages: {} });
    const [wide, tall, square] = imageSidesInches(html);
    assert.ok(Math.abs(wide.w / wide.h - 1920 / 1137) < 0.02, `a wide photograph is drawn ${wide.w.toFixed(2)}in by ${wide.h.toFixed(2)}in, not its own shape`);
    assert.ok(Math.abs(tall.w / tall.h - 2142 / 2949) < 0.02, `a tall photograph is drawn ${tall.w.toFixed(2)}in by ${tall.h.toFixed(2)}in, not its own shape`);
    assert.ok(Math.abs(square.w - square.h) < 0.01, "a square photograph stays square");
    // A wide photograph spreads into the room beside its word.
    assert.ok(wide.w > square.w, `a wide photograph should be wider than a square one (${wide.w.toFixed(2)}in against ${square.w.toFixed(2)}in)`);
    // The word is what a child reads first; the picture may not crowd it out.
    for (const img of [wide, tall, square]) {
      assert.ok(img.w <= PILL_INNER_INCHES * 0.55 + 0.01, `the picture takes ${((img.w / PILL_INNER_INCHES) * 100).toFixed(0)}% of the chip's width, leaving too little for the word`);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("a long word is never shrunk to make a photograph wider", async () => {
  const dir = await photosOfShapes([["wide", 1920, 1137], ["square", 1000, 1000]]);
  try {
    const words = ["citizen", "philosophers", "valley", "leader"];
    const besideSquare = wordPt(renderVocabChips(shapesCard(words, ["square", "square", "square", "square"]), style, dir, { svgImages: {} }));
    const besideWide = wordPt(renderVocabChips(shapesCard(words, ["wide", "wide", "wide", "wide"]), style, dir, { svgImages: {} }));
    assert.ok(
      besideWide >= Math.min(40, besideSquare),
      `the words print at ${besideWide}pt beside wide photographs and ${besideSquare}pt beside square ones`
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("the chips share the whole page and are all one size", () => {
  const html = renderVocabChips(chipsCard(4), style, FIXTURES_DIR, { svgImages: {} });
  assert.match(html, /<div class="wall-body" style="[^"]*flex-direction:column/, "the rows should be the page's growing body");
  const rows = html.match(/<div style="display:flex;align-items:stretch;width:100%;flex:1 1 0;min-height:0;">/g) || [];
  assert.strictEqual(rows.length, 2, "each of the two rows takes an equal share of the page");
  const cells = html.match(/padding:[\d.]+mm [\d.]+mm;display:flex;align-items:(stretch|center);/g) || [];
  assert.strictEqual(cells.length, 4);
  assert.ok(cells.every((cell) => cell.includes("align-items:stretch")), "a chip is as tall as its row, so its neighbour's photograph cannot make it a different size");
});
