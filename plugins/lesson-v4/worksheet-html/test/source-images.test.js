"use strict";

// A photograph's file is not the page's design.
//
// A Year 4 history sheet asked children to compare a Tudor doll with a modern
// one. The Tudor photograph is 2,650 x 4,450 and the modern one 2,000 x 2,000,
// and `width: 100%; height: auto` drew each at its own canvas height inside an
// equal-width card: 132.6mm beside 79.1mm, in cards stretched to a shared
// 149.2mm to hold the taller of them. Half the worksheet went to the fact that
// one photographer had stood further back, and the modern doll sat in an
// oversized, half-empty card while the Tudor one dominated the page.
//
// The evidence did not change. Only which of the three geometries - the file,
// the subject, the room the page gives it - the engine was allowed to know.

const assert = require("node:assert/strict");
const test = require("node:test");

const { measure, renderHelper } = require("../src/helpers");

const PIXEL = "data:image/png;base64,x";
const COLUMN_MM = 174;

const tudor = {
  title: "A Tudor doll",
  imageHref: PIXEL,
  imageWidth: 2650,
  imageHeight: 4450,
};
const modern = {
  title: "A modern doll",
  imageHref: PIXEL,
  imageWidth: 2000,
  imageHeight: 2000,
};

// Every image viewport the helper drew, as { widthMm, heightMm }.
function viewports(html) {
  return [...html.matchAll(/class="h-card-view" style="width:([0-9.]+)mm;height:([0-9.]+)mm"/g)]
    .map((m) => ({ widthMm: Number(m[1]), heightMm: Number(m[2]) }));
}

test("two sources a child compares are drawn the same height", () => {
  const boxes = viewports(renderHelper({ helper: "card-row", cards: [tudor, modern] }, COLUMN_MM));

  assert.equal(boxes.length, 2);
  assert.ok(
    Math.abs(boxes[0].heightMm - boxes[1].heightMm) < 0.01,
    `the two sources printed ${boxes[0].heightMm}mm and ${boxes[1].heightMm}mm tall. ` +
      "A child asked to compare them should not have to work out which " +
      "difference is the object and which is the camera."
  );
});

test("and neither of them is stretched to manage it", () => {
  const boxes = viewports(renderHelper({ helper: "card-row", cards: [tudor, modern] }, COLUMN_MM));

  assert.ok(
    Math.abs(boxes[0].heightMm / boxes[0].widthMm - 4450 / 2650) < 0.01,
    "the Tudor doll keeps its own proportions and simply sits narrower in its card"
  );
  assert.ok(
    Math.abs(boxes[1].heightMm / boxes[1].widthMm - 1) < 0.01,
    "the modern doll keeps its own proportions too"
  );
});

test("a tall file no longer takes half the page to say so", () => {
  const before = 4450 / 2650; // what `height: auto` at full card width drew
  const boxes = viewports(renderHelper({ helper: "card-row", cards: [tudor] }, COLUMN_MM));
  const drawn = boxes[0].heightMm / boxes[0].widthMm;

  assert.ok(
    drawn < before,
    "one very tall photograph in one card is still a file deciding a page"
  );
  assert.ok(
    drawn >= 1.4,
    `an upright photograph came out at ${drawn.toFixed(2)}, which is barely upright. ` +
      "The guard is for unusual framing, not for portrait pictures."
  );
});

test("where the difference in size IS the evidence, it is kept", () => {
  // A Victorian penny beside a modern one, a mammoth tooth beside a human one:
  // matching their apparent sizes would delete the point of the comparison.
  const shared = measure({ helper: "card-row", cards: [tudor, modern] }, COLUMN_MM);
  const canvas = measure(
    { helper: "card-row", cards: [tudor, modern], imageFit: "canvas" },
    COLUMN_MM
  );

  assert.ok(
    canvas > shared,
    "imageFit: canvas has to put every picture back at its full card width"
  );
});

test("a stated viewport is the viewport that gets drawn", () => {
  const boxes = viewports(
    renderHelper({ helper: "card-row", cards: [tudor, modern], imageHeightMm: 60 }, COLUMN_MM)
  );

  assert.ok(boxes.every((b) => Math.abs(b.heightMm - 60) < 0.01));
});

test("a stated viewport that is not a viewport is refused", () => {
  assert.throws(
    () => measure({ helper: "card-row", cards: [tudor], imageHeightMm: 4 }, COLUMN_MM),
    /imageHeightMm/
  );
});

// ─── the reviewed crop ───────────────────────────────────────────────────

test("trimming canvas that is not evidence makes the subject bigger", () => {
  // The modern doll's photograph is square, with a hand's width of studio white
  // down each side. The doll is the evidence; the white is the room the
  // photographer left. Trimming it does not make the picture claim anything it
  // did not claim before, and it stops the object being the smaller of the two
  // for a reason that has nothing to do with dolls.
  const plain = viewports(
    renderHelper({ helper: "card-row", cards: [modern] }, COLUMN_MM)
  )[0];
  const trimmed = viewports(
    renderHelper(
      { helper: "card-row", cards: [{ ...modern, crop: { left: 0.18, right: 0.18 } }] },
      COLUMN_MM
    )
  )[0];

  assert.ok(
    trimmed.heightMm > plain.heightMm,
    `the doll printed ${plain.heightMm}mm tall before the crop and ` +
      `${trimmed.heightMm}mm after, so the crop bought nothing`
  );
});

test("a crop moves the file inside its viewport, and never squashes it", () => {
  const html = renderHelper(
    { helper: "card-row", cards: [{ ...modern, crop: { left: 0.2, right: 0.1 } }] },
    COLUMN_MM
  );
  const img = html.match(/class="h-card-img" style="([^"]+)"/)[1];

  // 70% of the file is kept across, so the file is drawn 1/0.7 of the viewport
  // wide and pulled left by the fifth that was trimmed off its left edge.
  assert.match(img, /width:142\.857%/);
  assert.match(img, /left:-28\.571%/);
  assert.match(img, /height:100\.000%/, "nothing was trimmed top or bottom");
});

test("a crop that would take half a source out of the lesson is refused", () => {
  assert.throws(
    () => measure({ helper: "card-row", cards: [{ ...modern, crop: { left: 0.6 } }] }, COLUMN_MM),
    /crop\.left/
  );
});

test("the estimate and the browser agree about a cropped card", async () => {
  const puppeteer = require("puppeteer-core");
  const { findChrome } = require("../src/chrome");
  const { renderSheet } = require("../src/render");

  // A one-by-one transparent PNG, so the geometry is the engine's and not the
  // picture's.
  const png =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const cards = [
    { ...tudor, imageHref: png },
    { ...modern, imageHref: png, crop: { left: 0.18, right: 0.18 } },
  ];
  const html = renderSheet({
    layout: "full",
    orientation: "portrait",
    yearGroup: 4,
    zones: { a: { helper: "card-row", text: "Look closely at both dolls.", cards } },
  });
  const estimateMm = measure({ helper: "card-row", text: "Look closely at both dolls.", cards }, 174);

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const drawn = await page.evaluate(() => {
      const list = document.querySelector(".h-cardrow-list");
      const views = [...document.querySelectorAll(".h-card-view")];
      const pxPerMm = 96 / 25.4;
      return {
        rowMm: list.getBoundingClientRect().height / pxPerMm,
        viewMm: views.map((v) => v.getBoundingClientRect().height / pxPerMm),
      };
    });

    assert.ok(
      Math.abs(drawn.viewMm[0] - drawn.viewMm[1]) < 0.2,
      `the browser drew the two sources ${drawn.viewMm.map((v) => v.toFixed(1)).join("mm and ")}mm tall`
    );
    assert.ok(
      drawn.rowMm <= estimateMm + 4,
      `the row was estimated at ${estimateMm.toFixed(1)}mm and drawn at ` +
        `${drawn.rowMm.toFixed(1)}mm. A card row measured short is a card row ` +
        "clipped along its bottom edge, and it looks finished while it happens."
    );
  } finally {
    await browser.close();
  }
});
