#!/usr/bin/env node
"use strict";

// Ask the engine which layouts suit a piece of content, instead of picking a
// layout and being refused.
//
//   node scripts/suggest.js <content.json> <yearGroup>
//
// Pass the year group. A writing line is 8mm for Years 1 to 3 and 6mm for
// Years 4 to 6, so without it a Year 4 sheet is measured on the younger line
// and this recommends a layout the build then refuses.
//
// The file holds ONE ENTRY PER ZONE in reading order: either a bare array, or
// `{ "items": [...] }`. An entry is whatever that zone will hold, so it is
// usually a `stack` of several helpers rather than a single one. Every layout
// in the library is tried against it and the answers are computed from the
// layouts and the helpers themselves, so nothing here is written down twice.
//
// Getting the granularity wrong is the easy mistake and it fails quietly: a
// designer who lists a zone's helpers one at a time is asking about layouts
// with that many zones, gets a confident answer, and the build then measures
// something else. So the count is echoed back below.
//
// With no file, three worked examples run instead, so `npm run suggest` still
// shows what the output looks like.

const fs = require("node:fs");
const path = require("node:path");
const { suggestLayouts, describeSuggestions } = require("../src/suggest");
const { resolveImages } = require("../src/images");

const fileArg = process.argv[2];
if (fileArg) {
  const file = path.resolve(fileArg);
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const rawItems = Array.isArray(raw) ? raw : raw.items;
  if (!Array.isArray(rawItems)) {
    console.log(
      "SUGGEST_INPUT_INVALID: the file must be an array of helper specs, " +
        'or an object with an "items" array.'
    );
    process.exitCode = 1;
    return;
  }

  // Photographs are read off disk first, exactly as the build does, and against
  // the content file's own folder. Left unresolved, a picture has no size yet:
  // every layout holding one came back as a fit at NaN% - so the tool cheerfully
  // recommended shapes the build then refused, which is the one thing it must
  // never do.
  const items = resolveImages({ sheets: { s: { zones: { z: rawItems } } } }, path.dirname(file))
    .sheets.s.zones.z;

  const yearGroup = process.argv[3];
  if (!yearGroup) {
    console.log(
      "YEAR_GROUP_MISSING: pass the year group: suggest.js <file> <1-6>.\n" +
        "A writing line is 8mm for Years 1 to 3 and 6mm for Years 4 to 6, so\n" +
        "an answer measured without it is a different sheet's answer."
    );
    process.exitCode = 1;
    return;
  }
  // `--measure`: the real smallest size of every entry and of each part inside
  // it, for its actual wording, measured exactly as the build measures. Page
  // planning used to guess these from example sizes that grow with longer
  // labels (a method frame priced at 95mm wide drew 130mm; a diagram priced at
  // 105mm tall drew 206mm), and worksheet designers wrote their own scripts
  // against the engine to find the truth (29 September 2026, three runs of
  // five). The numbers are the engine's own, so nothing here is estimated twice.
  if (process.argv.includes("--measure")) {
    const { withPhase, phaseFor } = require("../src/worksheet");
    const { needsContent, describeContent } = require("../src/helpers");
    const { printableArea } = require("../src/page");
    const { isStack, isRow } = (() => {
      const has = (c, key) => !!c && typeof c === "object" && c[key] !== undefined;
      return { isStack: (c) => has(c, "stack"), isRow: (c) => has(c, "row") };
    })();
    const size = (content) => {
      const need = needsContent(withPhase(content, phaseFor(yearGroup)));
      return `${Math.round(need.minWidthMm)}mm wide x ${Math.round(need.minHeightMm)}mm tall at least`;
    };
    for (const orientation of ["portrait", "landscape"]) {
      const area = printableArea(orientation);
      console.log(`Printable ${orientation} page: ${Math.round(area.widthMm)}mm x ${Math.round(area.heightMm)}mm`);
    }
    console.log("");
    items.forEach((item, index) => {
      console.log(`Entry ${index + 1}: ${describeContent(item)}: ${size(item)}`);
      const parts = isStack(item) ? item.stack : isRow(item) ? item.row : null;
      if (Array.isArray(parts) && parts.length > 1) {
        parts.forEach((part, partIndex) => {
          console.log(`  part ${partIndex + 1}: ${describeContent(part)}: ${size(part)}`);
        });
      }
    });
    console.log(
      "\nThese are floors for this content as worded, never targets: a zone smaller " +
        "than an entry's floor refuses it, and a zone bigger lets it grow. A stack's " +
        "height adds its parts and the gaps between them; a row's width does the same across."
    );
    return;
  }

  // Said before the answers, because it is the one thing that makes the whole
  // answer wrong rather than merely unwelcome.
  console.log(
    `Reading this as ${items.length} zone${items.length === 1 ? "" : "s"}, so ` +
      `only ${items.length}-zone layouts can hold it. If a zone of yours holds ` +
      `several helpers, that zone is ONE entry (a stack), not one entry each.\n`
  );
  let described;
  try {
    described = describeSuggestions(suggestLayouts(items, { yearGroup }));
  } catch (error) {
    if (error && error.signal) {
      console.log(`${error.signal}: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }
  console.log(described);
  console.log(
    "\nroomy = under 70% of the page used, tight = over 98%.\n" +
      "Neither is wrong. A strip at the foot of the page gets trimmed; half a\n" +
      "page missing usually means the wrong shape was chosen."
  );
  return;
}

const EXAMPLES = [
  {
    name: "A chart, some read-off questions, and a reasoning question",
    items: [
      {
        helper: "bar-chart",
        title: "Our favourite sports",
        categories: ["Football", "Swimming", "Tennis", "Cricket"],
        values: [12, 8, 6, 4],
        yMax: 14,
        yInterval: 2,
      },
      {
        helper: "questions",
        items: [
          "How many children chose football?",
          "How many children chose tennis?",
          "Which sport was the most popular?",
          "How many children were asked altogether?",
        ],
      },
      {
        helper: "written-answers",
        startAt: 5,
        items: [
          {
            text: "Which sport was chosen by twice as many children as cricket? Explain how you know.",
            lines: 3,
          },
          {
            text: "Two more children join and both choose tennis. What changes about the chart?",
            lines: 3,
          },
        ],
      },
    ],
  },
  {
    name: "A source to read, questions about it, and room to answer",
    items: [
      {
        helper: "source-text",
        heading: "From the school log book",
        paragraphs: [
          "Attendance is poor this week. Many of the older boys are away at the harvest and will not return before the end of the month.",
          "The infants' room is cold. The stove smokes badly and the children nearest the window cannot hold their pens.",
        ],
        attribution: "Log book, October 1885",
      },
      {
        helper: "questions",
        items: [
          "Why were the older boys away from school?",
          "What was wrong with the infants' room?",
        ],
      },
      {
        helper: "written-answers",
        startAt: 3,
        items: [
          { text: "What does this source tell us about school life in 1885?", lines: 4 },
        ],
      },
    ],
  },
  {
    name: "Two pieces only: something to sort, and a table to fill in",
    items: [
      {
        helper: "venn",
        label1: "waterproof",
        label2: "can be recycled",
        items: [{ region: "leftOnly", label: "Wax" }],
        showRegionHints: true,
      },
      {
        helper: "recording-table",
        caption: "Test three more materials",
        columns: ["Material", "Waterproof?", "Recycled?"],
        rowLabels: ["Foil", "Cling film", "Your choice"],
      },
    ],
  },
];

for (const example of EXAMPLES) {
  console.log(`\n${example.name}`);
  console.log("-".repeat(example.name.length));
  console.log(describeSuggestions(suggestLayouts(example.items)));
}

console.log(
  "\nroomy = under 70% of the page used, tight = over 98%.\n" +
    "Neither is wrong. A strip at the foot of the page gets trimmed; half a\n" +
    "page missing usually means the wrong shape was chosen."
);
