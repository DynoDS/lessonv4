#!/usr/bin/env node
"use strict";

// Build one real worksheet, end to end, and print it.
//
// A Year 4 bar chart lesson. The spec below is the whole input: a layout name
// and what goes in each zone. Everything else (millimetres, whether it fits,
// where things sit on the paper) is worked out from that.
//
//   npm run sheet

const fs = require("node:fs");
const path = require("node:path");

const { renderSheet, checkFit } = require("../src/render");
const { htmlToPdf } = require("../src/chrome");

// ─── THE WHOLE INPUT ─────────────────────────────────────────────────────
const SHEET = {
  title: "Reading a bar chart",
  lo: "To read and answer questions about a bar chart",
  layout: "band-two-cols",
  orientation: "portrait",
  zones: {
    // a: the band across the top
    a: {
      helper: "bar-chart",
      title: "Our favourite sports",
      categories: ["Football", "Swimming", "Tennis", "Cricket"],
      values: [12, 8, 6, 4],
      yMax: 14,
      yInterval: 2,
    },
    // b: left column, read-off questions
    b: {
      helper: "questions",
      items: [
        "How many children chose football?",
        "How many children chose tennis?",
        "Which sport was the most popular?",
        "How many children were asked altogether?",
      ],
    },
    // c: right column, answers in the child's own words
    c: {
      helper: "written-answers",
      startAt: 5,
      phase: "lower",
      items: [
        { text: "Which sport was chosen by twice as many children as cricket? Explain how you know.", lines: 3 },
        { text: "Two more children join and both choose tennis. What changes about the chart?", lines: 3 },
      ],
    },
  },
};

async function main() {
  const out = path.join(__dirname, "..", "out");
  fs.mkdirSync(out, { recursive: true });

  // The check happens BEFORE anything is built. This is the whole promise.
  const problems = checkFit(SHEET);
  if (problems.length) {
    console.error("This sheet does not fit:");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log("Fit check: every zone can hold what it was given.");

  const html = renderSheet(SHEET);
  fs.writeFileSync(path.join(out, "sheet.html"), html);
  fs.writeFileSync(path.join(out, "sheet.pdf"), await htmlToPdf(html));

  console.log(`Written:\n  ${path.join(out, "sheet.html")}\n  ${path.join(out, "sheet.pdf")}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
