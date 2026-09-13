#!/usr/bin/env node
"use strict";

// The helper catalogue the worksheet-designer reads, generated from the code.
//
//   npm run catalogue
//
// The old catalogue was written by hand and named its own weakness in its own
// opening lines: "If a helper is in the code but not in the catalogue, the
// designer won't know to use it." That is not a warning, it is a description of
// what always happens. Sixty-four helpers documented by hand drift the first
// time anyone is in a hurry, and the drift is silent - the designer simply
// stops reaching for whatever went unwritten.
//
// So nothing here is written twice. Every part comes from the one place that
// already has to be right:
//
//   the name        the registry
//   what it is for  src/helpers/purposes.js, one line, guarded by a test
//   its fields      test/helper-examples.js, a real spec the tests already run
//   its minimum     needs(example), the helper's own answer
//   its greed       the registry
//
// An example beats a list of field types for this reader. It is concrete, it is
// known to work because check-render draws it at four widths every run, and it
// cannot describe a field the helper does not have.

const fs = require("node:fs");
const path = require("node:path");

const { helperNames, REGISTRY } = require("../src/helpers");
const purposes = require("../src/helpers/purposes");
const examples = require("../test/helper-examples");

// The families the source files already group helpers into, so the designer
// reads them in the order it would think of them rather than alphabetically.
const FAMILIES = [
  ["Text and questions", ["section-label", "instruction", "questions", "written-answers", "source-text", "steps"]],
  ["Tables", ["data-table", "recording-table"]],
  [
    "Charts and diagrams",
    [
      "bar-chart", "line-graph", "pictogram", "tally-chart", "venn", "carroll",
      "label-diagram", "rainforest-layers", "balanced-pattern-plate", "map", "grid-map",
      "process-chain", "circuit-diagram", "classification-key",
      "concept-map", "fishbone", "continuum-line", "source-pathway",
    ],
  ],
  [
    "Shape, space and measure",
    [
      "shape", "triangle", "angle", "line-pair", "turn-diagram", "ruler",
      "dial-scale", "measuring-jug",
      "clock-row", "coordinate-grid", "reflection-grid", "translation-shape",
      "geoboard", "triangle-square",
    ],
  ],
  [
    "Number and calculation",
    [
      "number-line", "blank-surface", "bar-model", "part-whole",
      "part-whole-money", "number-sentence",
      "column-method-grid", "short-multiplication-grid",
      "long-multiplication-grid", "bus-stop-grid", "long-division-grid",
      "method-frame", "number-pyramid", "times-table-grid",
      "place-value-chart", "place-value-counter-chart", "counter-group",
      "base-ten-blocks", "digit-cards", "number-network",
    ],
  ],
  [
    "Fractions and money",
    ["stacked-fraction", "fraction-sequence", "fraction-bar", "coin-strip"],
  ],
  [
    "Comparing and ordering",
    [
      "compare-row", "comparison-target", "inequality-with-boxes", "order-numbers", "order-table",
      "data-table-with-ordering",
    ],
  ],
  [
    "Choosing, sorting and joining",
    ["multiple-choice", "circle-the-answer", "chip-bank", "sort-grid", "match-up", "card-row", "timeline"],
  ],
  [
    "Writing, drawing and talk",
    ["writing-frame", "drawing-space", "storyboard", "fact-file", "speech-scene", "named-claim"],
  ],
  [
    "Cause, effect and evidence",
    ["cause-path-grid", "evidence-chain-frame"],
  ],
];

const GREED = {
  0: "never takes spare height",
  1: "takes a normal share of spare height",
  2: "takes spare height readily",
  3: "takes spare height first (it is writing space)",
};

// The tested example and the designer's example differ in exactly one place,
// and it matters enough to be worth handling rather than glossing.
//
// A photo reaches a sheet as `imagePath`, a filename. Before the build, the
// pipeline reads that file and replaces it with `imageHref` - the picture
// itself, inlined, so the sheet survives being moved or emailed. The test
// example has to carry the RESOLVED form, because a test has no photo on disk.
// Printing that in the catalogue would teach the designer to write a field it
// must never write, and bury it under ten kilobytes of base64 while doing so.
// Recursive, because a picture can sit anywhere in the spec - a card in a
// card-row, an entry in a bank - and a nested `imageHref` printed raw is the
// same ten kilobytes of base64 teaching the same wrong field.
function asWritten(spec) {
  if (Array.isArray(spec)) return spec.map(asWritten);
  if (!spec || typeof spec !== "object") return spec;
  const out = {};
  for (const [key, value] of Object.entries(spec)) {
    if (key === "imageHref") {
      out.imagePath = "plant.jpg  (the filename image-scout saved; the build inlines it)";
      continue;
    }
    // Both are read from the file's own header at build time.
    if (key === "imageWidth" || key === "imageHeight") continue;
    out[key] = asWritten(value);
  }
  return out;
}

// The index line is the helper's identity, not its whole story: the first
// sentence of the purpose, which every purpose leads with. The detail lives
// in the full entry, where it is read only once the helper is a candidate.
function firstSentence(text) {
  const match = /^[\s\S]*?[.!?](?=\s|$)/.exec(String(text).trim());
  return (match ? match[0] : String(text).trim()).replace(/\s+/g, " ");
}

function entry(name) {
  const helper = REGISTRY[name];
  const example = { helper: name, ...examples[name] };
  const needs = helper.needs(example);

  return [
    `#### \`${name}\``,
    "",
    purposes[name],
    "",
    `Smallest usable: **${Math.round(needs.minWidthMm)}mm wide` +
      `${needs.minHeightMm ? ` x ${Math.round(needs.minHeightMm)}mm tall` : ""}**. ` +
      `Spare height: ${GREED[helper.greed === undefined ? 1 : helper.greed]}${
        helper.enough ? ", and it stops when the content stops gaining" : ""
      }.`,
    "",
    "```json",
    JSON.stringify(asWritten(example), null, 2),
    "```",
    "",
  ].join("\n");
}

function main() {
  const names = helperNames();
  const placed = new Set(FAMILIES.flatMap(([, list]) => list));

  // A helper added to the code and not to a family here would be documented
  // nowhere, which is the exact failure this file exists to end. So it is a
  // hard stop rather than a note at the bottom.
  const homeless = names.filter((n) => !placed.has(n));
  if (homeless.length) {
    console.error(
      `CATALOGUE_INCOMPLETE: no family for ${homeless.join(", ")}. ` +
        `Add each to a family in scripts/build-catalogue.js.`
    );
    process.exitCode = 1;
    return;
  }

  const out = [
    "<!-- GENERATED by `npm run catalogue` in worksheet-html. Do not edit by hand. -->",
    "",
    "# What you can put in a zone",
    "",
    `The ${names.length} helpers, what each is for, and a working example of each.`,
    "",
    "**How Worksheet Designer reads this catalogue.** Read the Index just below -",
    "one line per helper - and pick the two to five that could carry what your",
    "sheet needs. Then read only those helpers' complete entries (each starts at a",
    "`####` heading carrying the helper's name) before first use, and reopen an",
    "entry later only for a",
    "field or a size you have not already used. The full entries are most of this",
    "file and almost all of them describe helpers this lesson will not use, so a",
    "designer that reads past the index before choosing spends its run on helpers",
    "it never picks. The index is for finding candidates; it is not the contract -",
    "fields and sizes live only in the full entry, so never write a spec from an",
    "index line alone.",
    "",
    "**The example is the contract.** It is a real spec, and check-render draws every",
    "one of them at four widths on every run, so it cannot describe a field that does",
    "not exist or miss one that does. Copy its shape and change the content.",
    "",
    "**Numbering is `question: true` and nothing else.** Mark a question with it, as",
    "the examples below do, and the engine counts every marked question in reading",
    "order. Never write a number or a `startAt` yourself: a hand-numbered sheet is",
    "the failure the counting was built to end.",
    "",
    "**Smallest usable** is the helper's own answer for the example shown, and it moves",
    "with the content: a four-column table needs more width than a two-column one. The",
    "engine refuses a zone smaller than this rather than squashing what goes in it, so",
    "a refusal is a layout to change and never a helper to force.",
    "",
    "If a lesson needs something no helper here can express, say so in `notes` rather",
    "than bending the nearest one to fit. That is how the next helper gets built.",
    "",
    "The one place a shown example differs from the tested one: a photograph is",
    "written as `imagePath`, a filename. The build reads that file and carries the",
    "picture inside the sheet, so the sheet still shows it after being moved or",
    "emailed. Never write `imageHref` yourself.",
    "",
  ];

  // The index: every helper on one line, so choosing candidates is one read
  // of one screen rather than a page-through of the whole file.
  out.push("## Index", "");
  for (const [family, list] of FAMILIES) {
    out.push(`**${family}**`, "");
    for (const name of list) {
      out.push(`- \`${name}\` - ${firstSentence(purposes[name])}`);
    }
    out.push("");
  }

  for (const [family, list] of FAMILIES) {
    out.push(`## ${family}`, "");
    for (const name of list) out.push(entry(name));
  }

  const file = path.join(
    __dirname, "..", "..", "references", "worksheet-helpers", "catalogue.md"
  );
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, out.join("\n"));
  console.log(`Wrote ${file}`);
  console.log(`${names.length} helpers in ${FAMILIES.length} families.`);
}

// Required by the test suite so a helper with no family fails at `npm test`
// rather than only when someone happens to regenerate the catalogue.
if (require.main === module) main();
module.exports = { FAMILIES, asWritten };
