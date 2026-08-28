"use strict";

// DOCUMENT CLAIMS ABOUT THE PACK, PINNED.
//
// Two documents describe how the class set packs onto pages, and the truth
// sweep of 1 August 2026 found the old numbers had rotted (the builder agent
// said "two children fit a page" for a three-piece set; the real packing puts
// four or five small sets to a page and gives a full-width set a page each).
// These tests hold the re-measured claims to the engine, so the next packing
// change fails here and the documents get re-measured rather than trusted.
//
// The documents quoting these numbers:
//   agents/stick-in-sheets-builder.md      "a set of small pieces packs four or
//                                           five children to a page; a set of
//                                           full-width pieces takes a page per
//                                           child" and "the class-set quantity
//                                           is 32 unless the spec carries a
//                                           classSize"
//   references/stick-in-sheets-pedagogy.md "the builder's book-fitting defaults
//                                           already sit between these limits"
//                                           (piece defaults that fit an A4 book)

const test = require("node:test");
const assert = require("node:assert");

const { renderMoments, buildHtml } = require("../build");
const layout = require("../src/layout-rules");

const pagesFor = async (items, classSize = 32) => {
  const { moments, dropped } = await renderMoments(items, null);
  assert.equal(dropped.length, 0, "a fixture visual failed to draw");
  return buildHtml(moments, classSize).pages;
};

test("the builder uses the documented printable page", () => {
  // stick-in-sheets-html/build.js derives its shelf area from these constants.
  const heightMm = layout.A4.heightMm - 2 * layout.A4.marginMm;
  const widthMm = layout.A4.widthMm - 2 * layout.A4.marginMm - 5;
  assert.equal(Math.round(heightMm), 277, `landscape shelf length is ${heightMm}mm, docs assume 277`);
  assert.equal(Math.round(widthMm), 185, `page depth is ${widthMm}mm, docs assume 185`);
});

test("a set of small pieces packs four children to a page", async () => {
  const angles = [
    { visual: "angle", spec: { degrees: 35 } },
    { visual: "angle", spec: { degrees: 90, rightAngle: true } },
    { visual: "angle", spec: { degrees: 130 } },
  ];
  const pages = await pagesFor(angles);
  assert.equal(
    pages,
    8,
    `three angles for 32 children took ${pages} pages, not 8 - ` +
      "the builder agent's four-to-a-page claim needs re-measuring"
  );
});

test("a set of full-width pieces takes a page per child", async () => {
  const venns = [
    { visual: "venn", spec: { label1: "has a right angle", label2: "has 4 equal sides" } },
    { visual: "coordinate-grid", spec: { cols: 8, rows: 6 } },
    { visual: "draw-box-row", spec: { boxes: [{ caption: "a)" }, { caption: "b)" }, { caption: "c)" }] } },
  ];
  const pages = await pagesFor(venns);
  assert.equal(
    pages,
    32,
    `a full-width three-piece set for 32 children took ${pages} pages, not 32 - ` +
      "the builder agent's page-per-child claim needs re-measuring"
  );
});

test("the class-set quantity is 32 by default and the spec's classSize wins", async () => {
  assert.equal(layout.CLASS_SIZE, 32, "the default class size moved - the builder agent quotes 32");
  const angles = [{ visual: "angle", spec: { degrees: 35 } }];
  const forTen = await pagesFor(angles, 10);
  const forThirty = await pagesFor(angles, 30);
  assert.ok(
    forTen < forThirty,
    "classSize is no longer honoured - the builder agent says the spec's classSize wins"
  );
});
