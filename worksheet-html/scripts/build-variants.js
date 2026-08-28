#!/usr/bin/env node
"use strict";

// The same worksheet, poured into different layouts.
//
// The content never changes. Only the layout name does. That is the point of
// having a layout layer at all: one lesson's material can be tried in several
// arrangements without rewriting any of it.
//
// One of these is deliberately a bad fit, so the refusal can be seen working
// rather than taken on trust.
//
//   npm run variants

const fs = require("node:fs");
const path = require("node:path");

const { renderSheet, checkFit } = require("../src/render");
const { htmlToPdf } = require("../src/chrome");

// ─── the content, written once ───────────────────────────────────────────
const CONTENT = {
  title: "Reading a bar chart",
  lo: "To read and answer questions about a bar chart",
  zones: {
    a: {
      helper: "bar-chart",
      title: "Our favourite sports",
      categories: ["Football", "Swimming", "Tennis", "Cricket"],
      values: [12, 8, 6, 4],
      yMax: 14,
      yInterval: 2,
    },
    b: {
      helper: "questions",
      items: [
        "How many children chose football?",
        "How many children chose tennis?",
        "Which sport was the most popular?",
        "How many children were asked altogether?",
      ],
    },
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

// ─── the arrangements to try ─────────────────────────────────────────────
const TRIES = [
  { layout: "band-two-cols", orientation: "portrait",
    note: "The one already built. Chart across the top, questions in two columns." },
  { layout: "thirds-stacked", orientation: "portrait",
    note: "Three equal bands. Chart, then short questions, then written answers." },
  { layout: "big-above-two", orientation: "portrait",
    note: "A bigger chart than the band gives, with the questions sharing the lower part." },
  { layout: "strip-both", orientation: "portrait",
    note: "Thin strip, big middle, thin strip. The chart is squeezed into the top strip." },
  { layout: "big-left-two", orientation: "landscape",
    note: "Landscape. Chart down the left, both question sets stacked on the right." },
  { layout: "thirds-side", orientation: "portrait",
    note: "Three narrow columns. Included on purpose: the chart should not fit." },
];

async function main() {
  const out = path.join(__dirname, "..", "out", "variants");
  fs.mkdirSync(out, { recursive: true });

  const built = [];
  for (const t of TRIES) {
    const spec = { ...CONTENT, layout: t.layout, orientation: t.orientation };
    const problems = checkFit(spec);

    if (problems.length) {
      console.log(`\nREFUSED  ${t.layout} (${t.orientation})`);
      for (const p of problems) console.log(`         ${p}`);
      built.push({ ...t, refused: problems });
      continue;
    }

    const html = renderSheet(spec);
    const base = `${t.layout}-${t.orientation}`;
    fs.writeFileSync(path.join(out, `${base}.html`), html);
    fs.writeFileSync(path.join(out, `${base}.pdf`), await htmlToPdf(html, {
      landscape: t.orientation === "landscape",
    }));
    console.log(`\nBUILT    ${t.layout} (${t.orientation})`);
    console.log(`         ${t.note}`);
    built.push({ ...t, file: `${base}.html` });
  }

  const ok = built.filter((b) => !b.refused).length;
  console.log(`\n${ok} built, ${built.length - ok} refused. Files in ${out}`);
  fs.writeFileSync(path.join(out, "index.json"), JSON.stringify(built, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
