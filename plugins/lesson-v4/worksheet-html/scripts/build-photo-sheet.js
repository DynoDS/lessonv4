#!/usr/bin/env node
"use strict";

// A labelled diagram built from a REAL photograph, at three different sizes.
//
//   npm run photo-sheet
//
// Two questions Daniel asked, answered on paper rather than in prose.
//
// "How do you know where to put the dots?" You do not, not from the spec alone.
// A dot is a percentage of a picture, and the designer writes it before the
// photo exists. The `diagram-anchor` agent is the step that looks at the real
// image and moves each dot onto the feature it names. The anchors below were
// placed that way: by opening the photograph and finding the petals, the flower
// head, the stem and a leaf in it.
//
// "Can it be different sizes?" It can now. The minimum used to be a flat 120mm
// whatever the diagram held, which made it a whole-page object by decree. It
// follows the content instead, so this builds the same photo three ways: a full
// page, a half page beside its questions, and a quarter page.
//
// The photo is carried INSIDE the HTML as a data URI, so the file is still the
// worksheet: it opens with a double click from anywhere and cannot lose its
// picture by being moved.

const fs = require("node:fs");
const path = require("node:path");

const { renderSheet, checkFit } = require("../src/render");
const { resolveImages } = require("../src/images");
const { tightnessOf, describeTightness } = require("../src/tightness");
const { htmlToPdf } = require("../src/chrome");

// Anchors read off the real photograph, not guessed. Two land in the left half
// and two in the right, which is what keeps the labels off each other: the
// drawing stacks them down whichever side their dot sits in.
const SUNFLOWER = {
  helper: "label-diagram",
  imagePath: "photos/sunflower.jpg",
  labels: [
    { anchor: [22, 33], label: "petal" },
    { anchor: [50, 33], label: "flower head" },
    { anchor: [39, 73], label: "leaf" },
    { anchor: [54, 75], label: "stem" },
  ],
};

// The same photograph with NUMBERED dots instead of named ones, and the naming
// done in a list beside it.
//
// This is the answer when a diagram has to share a page. A write-on line has to
// be long enough for a child to write the word on it, so a label reading
// "flower head" needs about 35mm of line and drags the whole diagram up to
// 99mm wide. A number needs almost nothing, so the picture can sit in a narrow
// column with three other activities around it, and the writing happens where
// there is room for it.
//
// It is not a workaround. Numbering the parts and answering in a list is how
// most published science sheets do this, and the drawing already renumbers its
// dots into reading order so the list runs 1, 2, 3 down the page.
const NUMBERED = {
  helper: "label-diagram",
  imagePath: "photos/sunflower.jpg",
  labels: [
    // GIVEN, so the numbers actually PRINT on the diagram. Left blank they draw
    // a write-on line instead, and a child looking at four unnumbered dots has
    // no way to tell which one row 3 of the list is asking about.
    { anchor: [22, 33], label: "1", given: true },
    { anchor: [50, 33], label: "2", given: true },
    { anchor: [39, 73], label: "3", given: true },
    { anchor: [54, 75], label: "4", given: true },
  ],
};

const SHEETS = [
  {
    name: "photo-full-page",
    title: "Labelling a sunflower",
    lo: "To name the parts of a flowering plant",
    layout: "full",
    orientation: "portrait",
    zones: { a: { ...SUNFLOWER } },
  },
  {
    name: "photo-half-page",
    title: "Labelling a sunflower, with questions",
    lo: "To name the parts of a flowering plant and say what each one does",
    layout: "halves-side",
    orientation: "portrait",
    zones: {
      // Three SHORT labels, and that is what makes this half-page version
      // possible. The full-page sheet above names the "flower head", and those
      // eleven characters widen the band on that side enough that the whole
      // diagram then needs 114mm. The engine refused this layout outright until
      // the label changed, which is the fit check earning its keep: the words
      // decide the size, not a number somebody picked.
      a: {
        helper: "label-diagram",
        imagePath: "photos/sunflower.jpg",
        labels: [
          { anchor: [22, 33], label: "petal" },
          { anchor: [39, 73], label: "leaf" },
          { anchor: [54, 75], label: "stem" },
        ],
      },
      b: {
        stack: [
          {
            helper: "questions",
            items: ["Which part takes in water?", "Which part makes the seeds?"],
          },
          {
            helper: "written-answers",
            startAt: 3,
            phase: "upper",
            items: [{ text: "Why does a plant need its leaves?", lines: 3 }],
          },
        ],
      },
    },
  },
  {
    name: "photo-quarter-page",
    title: "A sunflower in a quarter of a page",
    lo: "To name the parts of a flowering plant",
    layout: "quarters",
    orientation: "portrait",
    zones: {
      // The same diagram with FEWER labels, which is what lets it be small: the
      // label bands either side are sized to the words that go in them.
      a: {
        helper: "label-diagram",
        imagePath: "photos/sunflower.jpg",
        labels: [
          { anchor: [22, 33], label: "petal" },
          { anchor: [54, 75], label: "stem" },
        ],
      },
      b: { helper: "questions", items: ["Name two more parts of the plant."] },
      c: {
        helper: "written-answers",
        startAt: 2,
        phase: "upper",
        items: [{ text: "What does the stem do?", lines: 3 }],
      },
      d: {
        helper: "multiple-choice",
        text: "Which part of the plant makes the seeds?",
        options: ["the roots", "the flower head", "the stem"],
        select: "one",
      },
    },
  },
  {
    // A whole working sheet with the diagram as ONE activity among four, which
    // is the case a full-page-only diagram could never serve.
    name: "photo-shared-page",
    title: "The parts of a sunflower",
    lo: "To name the parts of a flowering plant and say what each one does",
    layout: "band-cols-strip",
    orientation: "portrait",
    zones: {
      a: {
        helper: "questions",
        items: ["Write the name of each numbered part of the sunflower."],
      },
      b: { ...NUMBERED },
      c: {
        helper: "fact-file",
        title: "Name the parts",
        fields: ["1", "2", "3", "4"],
      },
      d: {
        helper: "written-answers",
        startAt: 2,
        phase: "upper",
        items: [{ text: "Why does a sunflower need its leaves?", lines: 3 }],
      },
    },
  },
];

async function build(sheet, out, photosDir) {
  const heading = `${sheet.title}  (${sheet.layout}, ${sheet.orientation})`;
  console.log(`\n${heading}`);
  console.log("-".repeat(heading.length));

  // The photo is read off disk and embedded HERE, before the engine sees the
  // spec, so the engine stays pure and the file stays self-contained.
  const spec = resolveImages(
    {
      title: sheet.title,
      lo: sheet.lo,
      layout: sheet.layout,
      orientation: sheet.orientation,
      zones: sheet.zones,
    },
    photosDir
  );

  const problems = checkFit(spec);
  if (problems.length) {
    console.log(`  REFUSED: ${problems.join("; ")}`);
    process.exitCode = 1;
    return;
  }

  const html = renderSheet(spec);
  fs.writeFileSync(path.join(out, `${sheet.name}.html`), html);
  fs.writeFileSync(
    path.join(out, `${sheet.name}.pdf`),
    await htmlToPdf(html, { landscape: sheet.orientation === "landscape" })
  );

  const kb = Math.round(html.length / 1024);
  console.log(
    describeTightness(tightnessOf(spec))
      .split("\n")
      .map((l) => `  ${l}`)
      .join("\n")
  );
  console.log(`  the HTML carries its own photo: ${kb}KB, nothing to lose`);
}

async function main() {
  const out = path.join(__dirname, "..", "out", "photo");
  const photosDir = path.join(__dirname, "..", "test");
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  for (const sheet of SHEETS) {
    await build(sheet, out, photosDir);
  }
  console.log(`\nFiles in ${out}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
