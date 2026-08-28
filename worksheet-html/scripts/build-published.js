#!/usr/bin/env node
"use strict";

// The published worksheets, rebuilt by this engine.
//
//   npm run published
//
// Every sheet here is a real one Daniel downloaded from Twinkl, Kapow or Oak
// and put in front of the engine as a test. None of them could be built before:
// each asks the child to JOIN one thing to another, and nothing in the library
// could express that.
//
// This is not a demo. It is the evidence for whether the new helpers earn their
// place, and the only honest way to judge them is to print these and hold them
// next to the originals.
//
// What is deliberately NOT copied: the publishers' clip art, their fonts and
// their branding. The house style is the house style, and the point of the
// exercise is whether the SHAPE of each activity can be built, not whether a
// Twinkl sheet can be forged.

const fs = require("node:fs");
const path = require("node:path");

const { renderSheet, checkFit } = require("../src/render");
const { tightnessOf, describeTightness } = require("../src/tightness");
const { htmlToPdf } = require("../src/chrome");

// ─── 1. Solid, liquid or gas (Twinkl, science) ───────────────────────────
// The original is two columns and a line to draw. The layout adds nothing that
// "halves, side by side" did not already have; what was missing was the
// activity itself, which is now one helper holding both columns and the
// corridor between them.

const STATES = {
  name: "solid-liquid-gas",
  title: "Solid, liquid or gas?",
  lo: "To sort everyday materials by their state of matter",
  layout: "full",
  orientation: "portrait",
  zones: {
    a: {
      helper: "match-up",
      text: "Draw a line from each material to the group it belongs in.",
      left: [
        { label: "chocolate" },
        { label: "steam" },
        { label: "foil" },
        { label: "juice" },
        { label: "helium" },
        { label: "ice" },
        { label: "sand" },
        { label: "coffee" },
      ],
      right: [{ label: "Solid" }, { label: "Liquid" }, { label: "Gas" }],
    },
  },
};

// ─── 2. Plants of the rainforest (Twinkl, geography) ─────────────────────
// The one sheet in the folder that genuinely needed new GEOMETRY. A map fills
// the middle, a card sits in each margin, and more cards run along the foot, so
// the whole page points inward at one picture. Every existing shape put the map
// in a corner, which turns the flanking cards into a list beside a picture
// rather than labels around one.

const RAINFOREST = {
  name: "rainforest-plants",
  title: "Plants of the rainforests",
  lo: "To locate the regions where rainforest plants grow",
  layout: "flanked-middle-band",
  orientation: "landscape",
  zones: {
    a: {
      helper: "card-row",
      columns: 1,
      cards: [{ title: "Cacao", caption: "Amazon River basin, southern Mexico" }],
    },
    b: {
      helper: "rainforest-layers",
      labels: true,
      heights: true,
    },
    c: {
      helper: "card-row",
      columns: 1,
      cards: [
        { title: "Bird of paradise flower", caption: "South Africa, South America" },
      ],
    },
    d: {
      helper: "card-row",
      text: "Draw a line from each plant to the layer it grows in. Use an atlas to find the places.",
      dot: "top",
      columns: 6,
      cards: [
        { title: "Rubber tree", caption: "Brazil, Venezuela, Ecuador, Peru" },
        { title: "Heliconia", caption: "Southern Mexico, West Indies" },
        { title: "Orchids", caption: "Central and South America, the Andes" },
        { title: "Coffee", caption: "Ethiopia, South America, Sudan" },
        { title: "Bromeliads", caption: "Central America, western Africa" },
        { title: "Banana plant", caption: "Central America, Africa, south-east Asia" },
      ],
    },
  },
};

// ─── 3. The journey of a cocoa bean (Kapow, geography) ───────────────────
// A numbered drawing box with writing lines under it, eight times over. The
// grid lives INSIDE the helper rather than being eight zones in a layout,
// because eight boxes are one task a child works through in order, and a layout
// rebuilt for every count would be geometry standing in for content.

const COCOA = {
  name: "cocoa-bean-journey",
  title: "The journey of a cocoa bean",
  lo: "To describe the journey of a cocoa bean from the tree to our homes",
  layout: "full",
  orientation: "portrait",
  zones: {
    a: {
      helper: "storyboard",
      text: "Draw pictures and write short sentences to show the journey of a cocoa bean from the tree to our homes.",
      count: 8,
      columns: 2,
      lines: 2,
      phase: "upper",
    },
  },
};

// ─── 4. Stone Age artefacts (Oak, history) ───────────────────────────────
// Two new things at once: a timeline to place things on, and a museum tag,
// whose SHAPE does the teaching. A child given a tag writes like a label; the
// same child given three ruled lines writes a sentence about a label.

const STONE_AGE = {
  name: "stone-age-artefacts",
  title: "Significant Stone Age artefacts",
  lo: "To place Stone Age artefacts in the correct era",
  // Four full-width blocks rather than a band with columns beside it. The
  // column version was REFUSED, and correctly: a museum tag needs 90mm before
  // its point stops eating the text, and a half-page column is 84mm. The
  // engine caught that before anything was drawn, which is the whole reason
  // the fit check runs first.
  layout: "four-stacked",
  orientation: "portrait",
  zones: {
    a: {
      helper: "timeline",
      text: "Write the letter of each artefact in the era it belongs to.",
      caption: "The Stone Age",
      eras: [
        { label: "Palaeolithic", from: 0.02, to: 0.44 },
        { label: "Mesolithic", from: 0.48, to: 0.72 },
        { label: "Neolithic", from: 0.76, to: 0.98 },
      ],
      marks: [
        { at: 0.02, label: "2,000,000 years ago" },
        { at: 0.46, label: "12,000 years ago" },
        { at: 0.74, label: "6,000 years ago" },
        { at: 0.98, label: "4,000 years ago" },
      ],
    },
    b: {
      helper: "card-row",
      columns: 4,
      cards: [
        { title: "a", caption: "stone arrowheads" },
        { title: "b", caption: "pottery" },
        { title: "c", caption: "handaxe" },
        { title: "d", caption: "axe" },
      ],
    },
    c: {
      helper: "writing-frame",
      shape: "tag",
      text: "Write a museum label for one artefact.",
      phase: "upper",
      starters: [
        { text: "This is a …", lines: 1 },
        { text: "It is made from …", lines: 1 },
        { text: "It was used for …", lines: 2 },
      ],
    },
    d: {
      helper: "questions",
      startAt: 1,
      items: ["Which artefact tells us most about how people lived? Why?"],
    },
  },
};

// ─── 5. Why saying no is important (Oak, PSHE) ───────────────────────────
// A printed bubble to read and an empty one to reply in. The empty bubble is
// the whole activity, and it must arrive empty: a blank the engine helpfully
// filled in would not be an activity at all.

const SAYING_NO = {
  name: "saying-no",
  title: "Saying no firmly and with respect",
  lo: "To reply to a request in a way that is both firm and respectful",
  layout: "halves-stacked",
  orientation: "portrait",
  zones: {
    a: {
      helper: "speech-scene",
      text: "Write a reply that says no firmly and with respect.",
      phase: "upper",
      turns: [
        { speaker: "Jacob", says: "Hey Aisha, can I share this photo of us online?" },
        { speaker: "Aisha", side: "right", lines: 3 },
      ],
    },
    b: {
      helper: "speech-scene",
      text: "Now write what Jacob says to show he respects Aisha's choice.",
      phase: "upper",
      turns: [
        { speaker: "Aisha", says: "No, thank you, but I appreciate you asking for consent!" },
        { speaker: "Jacob", side: "right", lines: 3 },
      ],
    },
  },
};

// ─── 6. Countries of the Northern Hemisphere (Twinkl, geography) ─────────
// Geometry the library already had. What was missing is the fact file: named
// slots that say what counts as knowing about a country.

const COUNTRIES = {
  name: "countries-northern-hemisphere",
  title: "Countries of the Northern Hemisphere",
  lo: "To record the key facts about a country in the Northern Hemisphere",
  layout: "strip-left",
  orientation: "landscape",
  zones: {
    a: {
      helper: "fact-file",
      title: "Country fact file",
      fields: [
        "Name of country",
        "Capital city",
        "Population",
        "Official language(s)",
        "Average rainfall",
      ],
    },
    b: {
      helper: "grid-map",
      eastings: [31, 32, 33, 34, 35],
      northings: [51, 52, 53, 54, 55],
      river: [
        [31, 54.6],
        [33.2, 53.1],
        [35, 51.6],
      ],
      features: [
        { name: "Capital", square: [32, 53], type: "human" },
        { name: "Mountains", square: [34, 54], type: "physical" },
      ],
    },
  },
};

// ─── 7. Labelling a diagram (Twinkl, science) ────────────────────────────
// The seventh sheet, and the last of the folder. Its original is a human body
// with an empty box beside each organ, joined by a leader line.
//
// It looks like three columns and is not. The leader lines mean the whole page
// is ONE object: a picture that names its own parts. Built as three zones, the
// lines would have to cross zone boundaries, which nothing in this engine can
// do and nothing should - a zone is geometry, and a line between two of them
// belongs to neither.
//
// The picture here is a plant rather than a body, because the engine takes a
// photograph it is handed and this one has to be self-contained. A real lesson
// hands it whatever image-scout fetched.

const PLANT = require("../test/fixtures-plant");

const LABELLING = {
  name: "label-the-plant",
  title: "Labelling a flowering plant",
  lo: "To name the parts of a flowering plant and say what each one does",
  // Landscape, and the engine is what settled that. A labelled diagram needs
  // 120mm before its picture survives having a label band taken off each side,
  // and at that width it stands 159mm tall. Portrait was refused twice: the
  // diagram plus its questions came to 270mm on a 267mm page, and every
  // portrait shape that gave the diagram enough width starved the questions.
  // Across a landscape page both fit with room to spare.
  layout: "halves-side",
  orientation: "landscape",
  zones: {
    a: {
      helper: "label-diagram",
      imageHref: PLANT.href,
      imageWidth: PLANT.width,
      imageHeight: PLANT.height,
      labels: [
        // Anchored to parts that are genuinely in DIFFERENT halves of the
        // picture. The labels stack down whichever side their dot sits in, so
        // five anchors all on the centre line sent every label to the right
        // and left a dead band down the left of the page.
        { anchor: [37, 31], label: "petal" },
        { anchor: [50, 31], label: "flower" },
        { anchor: [40, 61], label: "leaf" },
        { anchor: [50, 50], label: "stem" },
        { anchor: [50, 90], label: "roots" },
      ],
    },
    b: {
      stack: [
        {
          helper: "questions",
          items: ["Which part takes in water?", "Which part makes the food?"],
        },
        {
          helper: "written-answers",
          startAt: 3,
          phase: "upper",
          items: [
            { text: "Why does a plant need its roots and its leaves?", lines: 3 },
          ],
        },
      ],
    },
  },
};

const SHEETS = [
  STATES,
  RAINFOREST,
  COCOA,
  STONE_AGE,
  SAYING_NO,
  COUNTRIES,
  LABELLING,
];

async function build(sheet, out) {
  const heading = `${sheet.title}  (${sheet.layout}, ${sheet.orientation})`;
  console.log(`\n${heading}`);
  console.log("-".repeat(heading.length));

  const spec = {
    title: sheet.title,
    lo: sheet.lo,
    layout: sheet.layout,
    orientation: sheet.orientation,
    zones: sheet.zones,
  };

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

  console.log(
    describeTightness(tightnessOf(spec))
      .split("\n")
      .map((l) => `  ${l}`)
      .join("\n")
  );
}

async function main() {
  const out = path.join(__dirname, "..", "out", "published");
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  for (const sheet of SHEETS) {
    await build(sheet, out);
  }

  console.log(`\nFiles in ${out}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
