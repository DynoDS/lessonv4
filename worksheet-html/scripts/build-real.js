#!/usr/bin/env node
"use strict";

// Two whole worksheets, written the way a lesson would need them.
//
//   npm run real
//
// Not a proof sheet and not a demo of one feature: a maths sheet and a
// geography sheet, each a few numbered questions where a question is a drawing
// and a prompt and somewhere to answer, stacked together the way they are on
// paper. The layout is not chosen by hand. The content is handed to the engine
// and it says which shapes hold it.

const fs = require("node:fs");
const path = require("node:path");

const { renderSheet, checkFit } = require("../src/render");
const { suggestLayouts, describeSuggestions } = require("../src/suggest");
const { tightnessOf, describeTightness } = require("../src/tightness");
const { htmlToPdf } = require("../src/chrome");

// ─── maths ───────────────────────────────────────────────────────────────
// Year 4: read a bar chart, then use the numbers in it.

// One split for every "drawing on the left, its question on the right" row, so
// the question column lands in the same place down the whole sheet.
const SPLIT = [1.8, 1];

const MATHS = {
  name: "maths-bar-charts",
  title: "Reading and using a bar chart",
  lo: "To read a bar chart and use the numbers in it to solve problems",
  questions: [
    // A chart sits BESIDE its questions, not above them. Stacked, the chart
    // alone took 140mm of a 267mm page and the sheet needed 454mm in total.
    // This is what a row is for.
    {
      parts: SPLIT,
      row: [
        {
          helper: "bar-chart",
          title: "Books read in each class this term",
          categories: ["Oak", "Elm", "Birch", "Willow"],
          values: [24, 18, 30, 12],
          yMax: 32,
          yInterval: 4,
        },
        {
          helper: "questions",
          items: [
            "How many books did Birch read?",
            "Which class read the fewest books?",
            "How many more books did Oak read than Willow?",
          ],
        },
      ],
    },
    {
      parts: SPLIT,
      row: [
        {
          helper: "bar-model",
          shape: "part-whole",
          whole: { label: "84" },
          parts: [{ label: "24" }, { label: "18" }, { label: "?" }],
        },
        {
          helper: "questions",
          startAt: 4,
          items: [
            "Oak, Elm and Birch read 84 books altogether. How many did Birch read?",
          ],
        },
      ],
    },
    // A row inside a row: the two calculations sit together on the left, the
    // instruction beside them, rather than the instruction taking a line of
    // its own underneath.
    {
      parts: SPLIT,
      row: [
        {
          row: [
            { helper: "column-method-grid", operator: "+", top: 24, bottom: 18 },
            { helper: "column-method-grid", operator: "+", top: 30, bottom: 12 },
          ],
          letters: true,
        },
        {
          helper: "questions",
          startAt: 5,
          items: ["Work out each total using the column method."],
        },
      ],
    },
    {
      helper: "written-answers",
      startAt: 6,
      items: [
        {
          text: "Willow says: 'If our class reads 12 more books we will have read the most.' Is Willow right? Explain how you know.",
          lines: 3,
        },
      ],
    },
  ],
};

// ─── geography ───────────────────────────────────────────────────────────
// Year 4: four-figure grid references, on a river map.

const GEOGRAPHY = {
  name: "geography-grid-references",
  title: "Finding places with grid references",
  lo: "To find and give four-figure grid references on a map",
  questions: [
    // The map beside its questions, for the same reason as the chart. The
    // split is left to the default, which gives each item its own minimum
    // first: a grid map needs 110mm before a place name will sit inside a
    // square, so it takes that and the questions have the rest. Forcing an
    // even 50/50 starved it, and the engine said so.
    {
      parts: SPLIT,
      row: [
        // A four-figure grid: the numbers label the LINES, and a reference
        // names the bottom-left corner of a square. River points are
        // [easting, northing] pairs; a feature names the square it sits in.
        {
          helper: "grid-map",
          eastings: [31, 32, 33, 34, 35],
          northings: [51, 52, 53, 54, 55],
          river: [
            [31, 54.6],
            [32.4, 53.8],
            [33.2, 53.1],
            [34.1, 52.4],
            [35, 51.6],
          ],
          features: [
            { name: "Mill", square: [32, 53], type: "human" },
            { name: "Wood", square: [34, 54], type: "physical" },
            { name: "Bridge", square: [33, 51], type: "human" },
          ],
        },
        {
          helper: "questions",
          items: [
            "Give the four-figure grid reference for the mill.",
            "What is found at 3454?",
            "Which square does the river leave the map in?",
          ],
        },
      ],
    },
    {
      stack: [
        {
          helper: "source-text",
          heading: "A walker's notebook",
          paragraphs: [
            "We started at the bridge and followed the river north-west, keeping the water on our left. The mill came into view after about twenty minutes, and we stopped there to eat.",
          ],
          attribution: "From a walking diary, 2019",
        },
        {
          helper: "questions",
          startAt: 4,
          items: [
            "In which direction did the walkers travel?",
            "Which two places did they pass between?",
          ],
        },
      ],
    },
    {
      stack: [
        {
          helper: "recording-table",
          caption: "Complete the table for three more places",
          columns: ["Place", "Grid reference", "Next to the river?"],
          rowLabels: ["Wood", "Bridge", "Your choice"],
          writing: "word",
        },
      ],
    },
  ],
};

async function build(sheet, out) {
  console.log(`\n${sheet.title}`);
  console.log("-".repeat(sheet.title.length));

  const result = suggestLayouts(sheet.questions, { extra: { title: sheet.title } });
  console.log(describeSuggestions(result, 4));

  if (!result.fits.length) return;

  const best = result.fits[0];
  const zones = {};
  best.zones.forEach((id, i) => {
    if (sheet.questions[i]) zones[id] = sheet.questions[i];
  });

  const spec = {
    title: sheet.title,
    lo: sheet.lo,
    layout: best.layout,
    orientation: best.orientation,
    zones,
  };

  const problems = checkFit(spec);
  if (problems.length) {
    console.log(`  REFUSED: ${problems.join("; ")}`);
    return;
  }

  const html = renderSheet(spec);
  fs.writeFileSync(path.join(out, `${sheet.name}.html`), html);
  fs.writeFileSync(
    path.join(out, `${sheet.name}.pdf`),
    await htmlToPdf(html, { landscape: best.orientation === "landscape" })
  );

  console.log(`\n  built as ${best.layout} (${best.orientation})`);
  console.log(
    describeTightness(tightnessOf(spec))
      .split("\n")
      .map((l) => `  ${l}`)
      .join("\n")
  );
}

async function main() {
  const out = path.join(__dirname, "..", "out", "real");
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  await build(MATHS, out);
  await build(GEOGRAPHY, out);

  console.log(`\nFiles in ${out}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
