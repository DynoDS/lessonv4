"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { suggestLayouts } = require("../src/suggest");
const { needsContent, measure } = require("../src/helpers");

// THE PHOTO COSTING, PINNED.
//
// Three documents quote what a photograph costs on a worksheet, so upstream
// agents can count pictures while they still hold the pedagogy:
//
//   agents/lesson-designer.md          "What a photograph costs"
//   agents/adaptation-designer.md      "A photograph is the most expensive thing"
//   references/worksheet-helpers/shared.md  "A photograph, when it has to share a page"
//
// Those numbers rotted once already: they were measured in an engine that gave
// every labelled diagram a whole-page footprint by decree, that rule was then
// fixed, and the documents kept telling designers a single labelled photograph
// was "most of a page" long after two of them fit. This test is what stops the
// second rot. When an engine change moves a capacity, the failure lands here,
// names the three documents, and the numbers get re-measured rather than
// trusted.
//
// The claims pinned, as the documents state them:
//   - a write-on labelled photograph takes about half a page;
//     one with a written answer fits, two fit, three never do
//   - three numbered photograph-and-list pairs fit a page; four never do

const writeOnPhoto = () => ({
  question: true,
  helper: "label-diagram",
  text: "Label the parts.",
  imageHref: "photo.jpg",
  imageWidth: 800,
  imageHeight: 600,
  labels: Array.from({ length: 4 }, (_, i) => ({
    label: "",
    anchor: [i % 2 ? 80 : 20, 10 + i * 17],
  })),
});

// The numbered form as a sheet really carries it: the photograph and the list
// the child answers into, side by side as one unit.
const numberedUnit = () => ({
  parts: [1.4, 1],
  row: [
    {
      helper: "label-diagram",
      imageHref: "photo.jpg",
      imageWidth: 800,
      imageHeight: 600,
      labels: Array.from({ length: 4 }, (_, i) => ({
        label: String(i + 1),
        given: true,
        anchor: [i % 2 ? 80 : 20, 10 + i * 17],
      })),
    },
    {
      question: true,
      helper: "questions",
      items: Array.from({ length: 4 }, (_, i) => `Name part ${i + 1}.`),
    },
  ],
});

const writtenAnswer = () => ({
  question: true,
  helper: "written-answers",
  items: [{ text: "What does this part do?", lines: 2 }],
});

const fits = (items) =>
  suggestLayouts(items, { extra: { title: "Label the parts" } }).fits.length > 0;

test("a write-on labelled photograph is about half a page, not most of one", () => {
  const spec = writeOnPhoto();
  const heightAtFullWidth = measure(spec, 174);
  // A 267mm printable page. "Most of a page" starts around 180mm; half a page
  // is about 134mm. The documents say half, so the measurement must sit
  // nearer half than the whole.
  assert.ok(
    heightAtFullWidth < 180,
    `a write-on photograph at full width stands ${Math.round(heightAtFullWidth)}mm - ` +
      "the documents call this about half a page, and it is drifting toward a whole one"
  );
});

test("one write-on photograph with a written answer fits a page", () => {
  assert.ok(fits([writeOnPhoto(), writtenAnswer()]));
});

test("two write-on photographs fit; three never do", () => {
  assert.ok(fits([writeOnPhoto(), writeOnPhoto()]), "two should fit");
  assert.ok(!fits([writeOnPhoto(), writeOnPhoto(), writeOnPhoto()]), "three should not");
});

test("three numbered photograph-and-list pairs fit; four never do", () => {
  assert.ok(fits([numberedUnit(), numberedUnit(), numberedUnit()]), "three should fit");
  assert.ok(
    !fits([numberedUnit(), numberedUnit(), numberedUnit(), numberedUnit()]),
    "four should not"
  );
});

test("the worked plant example in shared.md matches the engine", () => {
  // shared.md quotes this case with millimetres: write-on about 99x139mm,
  // numbered about 84x103mm. A drift of a few millimetres is rounding; a drift
  // of ten is the documents lying.
  const labels = [
    { label: "flower head", anchor: [80, 10] },
    { label: "leaf", anchor: [20, 35] },
    { label: "stem", anchor: [80, 55] },
    { label: "roots", anchor: [20, 85] },
  ];
  const writeOn = {
    helper: "label-diagram",
    text: "Label the parts of the plant.",
    imageHref: "plant.jpg",
    imageWidth: 600,
    imageHeight: 800,
    labels,
  };
  const numbered = {
    ...writeOn,
    labels: labels.map((l, i) => ({ label: String(i + 1), given: true, anchor: l.anchor })),
  };

  const close = (actual, quoted, what) =>
    assert.ok(
      Math.abs(actual - quoted) < 10,
      `${what}: engine says ${Math.round(actual)}mm, shared.md says about ${quoted}mm`
    );

  const wNeed = needsContent(writeOn);
  close(wNeed.minWidthMm, 99, "write-on plant width");
  close(measure(writeOn, wNeed.minWidthMm), 139, "write-on plant height");

  const nNeed = needsContent(numbered);
  close(nNeed.minWidthMm, 84, "numbered plant width");
  close(measure(numbered, nNeed.minWidthMm), 103, "numbered plant height");
});
