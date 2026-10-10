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
  //
  // Two things it got wrong until 6 October 2026, both found when a page plan
  // was checked against it. It measured `question: true` wrappers raw, so every
  // numbered part came back 10mm narrower than the check then found it (the
  // number's gutter), and a row of two looked 20mm roomier than it was. And it
  // printed the paper's printable area, 180mm by 267mm, where a sheet's work
  // gets 174mm by 239mm once the trim strip is off. It now numbers the content
  // exactly as the build does and prints the zone sizes the check itself uses.
  //
  // And until 9 October 2026 it printed only FLOORS: each piece at the smallest
  // it could ever be, which for words is their height at the widest zone there
  // is. A claim question came back 34mm and prints 59mm at the page's real
  // width, a shape 43mm for 80mm, a match-up 124mm for 151mm, so three plans
  // that read as fitting did not (the stress test of 7 October 2026). A plan
  // is priced at the width it will print at, so that is what this prints: the
  // height of every entry and part at each width a sheet really gives, measured
  // in the browser where there is one. One entry that cannot be measured says
  // why on its own line and the rest are still measured: it used to stop the
  // whole report with a stack trace.
  if (process.argv.includes("--measure")) {
    measureMode(items, yearGroup).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
    return;
  }

  suggestMode(items, yearGroup).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  return;
}

async function measureMode(items, yearGroup) {
  const { withPhase, phaseFor, numbered } = require("../src/worksheet");
  const { needsContent, measureContent, describeContent } = require("../src/helpers");
  const { contentArea, zoneContentMm } = require("../src/render");
  const { NARROW_SPARE_MM } = require("../src/page");
  const { calibrate } = require("../src/browser-measure");
  const has = (c, key) => !!c && typeof c === "object" && c[key] !== undefined;
  const isStack = (c) => has(c, "stack");
  const isRow = (c) => has(c, "row");

  let entries;
  try {
    entries = numbered(items.map((item) => withPhase(item, phaseFor(yearGroup))));
  } catch (error) {
    if (error && error.signal) {
      console.log(`${error.signal}: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  // The widths a sheet really gives its work, widest first.
  const places = [];
  for (const orientation of ["portrait", "landscape"]) {
    const area = contentArea({ orientation });
    const whole = zoneContentMm({ w: 1, h: 1 }, area);
    const half = zoneContentMm({ w: 0.5, h: 1 }, area);
    console.log(
      `A ${orientation} sheet's work area: ${Math.round(whole.wMm)}mm wide x ` +
        `${Math.round(whole.hMm)}mm tall. Two columns side by side get ` +
        `${Math.round(half.wMm)}mm each.`
    );
    places.push({ name: `${orientation}, full width`, wMm: whole.wMm });
    if (orientation === "portrait") {
      places.push({ name: "portrait, one column kept narrow", wMm: whole.wMm - NARROW_SPARE_MM });
    }
    places.push({ name: `${orientation}, one of two columns`, wMm: half.wMm });
  }
  places.sort((a, b) => b.wMm - a.wMm);
  console.log("");

  const sizeLines = (content) => {
    const need = needsContent(content);
    const minMm = Math.round(need.minWidthMm);
    const lines = [`needs at least ${minMm}mm of width.`];
    for (const place of places) {
      lines.push(
        place.wMm + 0.5 < need.minWidthMm
          ? `${Math.round(place.wMm)}mm wide (${place.name}): too narrow for it`
          : `${Math.round(place.wMm)}mm wide (${place.name}): ${Math.ceil(measureContent(content, place.wMm))}mm tall`
      );
    }
    return lines;
  };
  const report = (label, content, indent) => {
    let lines;
    try {
      lines = sizeLines(content);
    } catch (error) {
      const message = String((error && error.message) || error).split(String.fromCharCode(10))[0];
      console.log(`${indent}${label}: cannot be measured as written. ${message}`);
      return;
    }
    console.log(`${indent}${label}: ${describeContent(content)}: ${lines[0]}`);
    for (const line of lines.slice(1)) console.log(`${indent}    ${line}`);
  };
  const everything = () => {
    entries.forEach((item) => {
      for (const content of [item, ...((isStack(item) ? item.stack : isRow(item) ? item.row : null) || [])]) {
        try {
          sizeLines(content);
        } catch {
          // reported by name below
        }
      }
    });
  };

  const calibration = await calibrate(everything);
  entries.forEach((item, index) => {
    report(`Entry ${index + 1}`, item, "");
    const parts = isStack(item) ? item.stack : isRow(item) ? item.row : null;
    if (Array.isArray(parts) && parts.length > 1) {
      parts.forEach((part, partIndex) => report(`part ${partIndex + 1}`, part, "  "));
    }
  });
  console.log(
    "\nEach height is this content, as worded, at the width named" +
      (calibration.available
        ? ", measured in the browser that prints the sheet."
        : ", estimated (no browser on this machine, so allow a few millimetres).") +
      // The gaps are read from the engine: this sentence said 8mm between
      // questions for as long as the page printed 6mm (7 October 2026).
      " " +
      require("../src/page-figures").measureFooter()
  );
}

async function suggestMode(items, yearGroup) {
  const { calibrate } = require("../src/browser-measure");
  await calibrate(() => suggestLayouts(items, { yearGroup }));
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
