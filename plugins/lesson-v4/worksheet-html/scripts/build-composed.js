#!/usr/bin/env node
"use strict";

// Several helpers in one zone, which is what a worksheet question actually is.
//
//   npm run composed
//
// Daniel's example: not one angle in a zone, but five angles side by side,
// then "name each one", then somewhere to write the answers, all as one
// question in one zone. The old Word builder needed a hand-written
// triangleRowTable and geoboardRowTable for the side-by-side part, which is
// why it never had an angle-row: nobody had written one. Here a row is a row,
// whatever is in it.
//
// The point of this script is the ARITHMETIC as much as the pages. Five angles
// need five times an angle's own minimum plus the gaps, and nobody worked that
// out by hand.

const fs = require("node:fs");
const path = require("node:path");

const { renderSheet, checkFit } = require("../src/render");
const { needsContent, describeContent } = require("../src/helpers");
const { suggestLayouts, describeSuggestions } = require("../src/suggest");
const { htmlToPdf } = require("../src/chrome");
const { tightnessOf, describeTightness } = require("../src/tightness");

const angle = (degrees, rotation) => ({ helper: "angle", degrees, rotation, arc: true });

// One question: a row of angles, a prompt, and room to answer.
const NAME_THE_ANGLES = {
  stack: [
    {
      row: [angle(45, 0), angle(90, 10), angle(120, -15)],
      letters: true,
    },
    {
      helper: "questions",
      items: ["Name each angle: acute, right, or obtuse."],
    },
    {
      helper: "written-answers",
      startAt: 2,
      items: [
        { text: "How did you decide which one was the right angle?", lines: 2 },
      ],
    },
  ],
};

// The same idea with a different drawing, to show nothing here is angle-shaped.
const SORT_THE_TRIANGLES = {
  stack: [
    {
      row: { helper: "triangle", kind: "isosceles", ticks: true },
      repeat: 3,
      letters: true,
    },
    {
      helper: "questions",
      items: ["Which of these is scalene?", "Which two are the same shape?"],
    },
  ],
};

// A row of two things that are not the same kind of thing at all.
const CHART_AND_TABLE = {
  row: [
    {
      helper: "bar-chart",
      title: "Our favourite sports",
      categories: ["Football", "Swimming", "Tennis"],
      values: [12, 8, 6],
      yMax: 14,
      yInterval: 2,
    },
    {
      helper: "data-table",
      caption: "The same numbers",
      columns: ["Sport", "Children"],
      rows: [["Football", "12"], ["Swimming", "8"], ["Tennis", "6"]],
    },
  ],
};

const SHEETS = [
  {
    name: "angles",
    title: "Naming angles",
    lo: "To name angles as acute, right or obtuse",
    items: [NAME_THE_ANGLES, SORT_THE_TRIANGLES],
  },
  {
    name: "chart",
    title: "Reading a bar chart",
    lo: "To read and compare values from a bar chart",
    items: [
      CHART_AND_TABLE,
      {
        helper: "questions",
        items: [
          "How many children chose football?",
          "How many more chose football than tennis?",
        ],
      },
    ],
  },
];

function reportMinimums() {
  console.log("What each group needs, worked out from its parts:\n");
  const cases = [
    ["one angle", { helper: "angle", degrees: 45, arc: true }],
    ["3 angles side by side", { row: { helper: "angle", degrees: 45, arc: true }, repeat: 3 }],
    ["5 angles side by side", { row: { helper: "angle", degrees: 45, arc: true }, repeat: 5 }],
    ["the whole 'name each angle' question", NAME_THE_ANGLES],
    ["chart beside its table", CHART_AND_TABLE],
  ];
  for (const [label, content] of cases) {
    const n = needsContent(content);
    console.log(
      `  ${label.padEnd(40)} ${Math.round(n.minWidthMm)} x ${Math.round(n.minHeightMm)}mm`
    );
  }
  console.log("\n  a portrait page is 180mm wide, landscape 261mm\n");
}

async function main() {
  const out = path.join(__dirname, "..", "out", "composed");
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  reportMinimums();

  for (const sheet of SHEETS) {
    const result = suggestLayouts(sheet.items, { extra: { title: sheet.title } });
    console.log(`${sheet.title}`);
    console.log(describeSuggestions(result, 3));

    if (!result.fits.length) {
      console.log();
      continue;
    }

    const best = result.fits[0];
    const zones = {};
    best.zones.forEach((id, i) => {
      if (sheet.items[i]) zones[id] = sheet.items[i];
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
      console.log(`  REFUSED: ${problems.join("; ")}\n`);
      continue;
    }

    const html = renderSheet(spec);
    fs.writeFileSync(path.join(out, `${sheet.name}.html`), html);
    fs.writeFileSync(
      path.join(out, `${sheet.name}.pdf`),
      await htmlToPdf(html, { landscape: best.orientation === "landscape" })
    );
    console.log(`  built as ${best.layout} (${best.orientation})`);
    const indented = describeTightness(tightnessOf(spec))
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n");
    console.log(indented);
    console.log();
  }

  console.log(`Files in ${out}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
