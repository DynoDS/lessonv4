#!/usr/bin/env node
"use strict";

// Three newly ported helpers, in several layouts.
//
// A Venn to sort into, a table of values to read from, and a blank table to
// record in. Three different KINDS of work, none of them a question with a
// line under it, and none of them maths-only.
//
//   npm run science

const fs = require("node:fs");
const path = require("node:path");

const { renderSheet, checkFit } = require("../src/render");
const { htmlToPdf } = require("../src/chrome");

const CONTENT = {
  title: "Sorting materials",
  lo: "To sort materials by their properties and record what we find",
  zones: {
    a: {
      helper: "venn",
      label1: "waterproof",
      label2: "can be recycled",
      items: [{ region: "leftOnly", label: "Wax" }],
      showRegionHints: true,
    },
    b: {
      helper: "data-table",
      caption: "What we know already",
      columns: ["Material", "Waterproof?", "Recycled?"],
      rows: [
        ["Glass", "yes", "yes"],
        ["Cardboard", "no", "yes"],
        ["Wax", "yes", "no"],
        ["Wool", "no", "no"],
      ],
    },
    c: {
      helper: "recording-table",
      caption: "Test three more materials",
      columns: ["Material", "Waterproof?", "Recycled?", "Where it goes"],
      rowLabels: ["Foil", "Cling film", "Your choice"],
    },
  },
};

const TRIES = [
  { layout: "thirds-stacked", orientation: "portrait" },
  { layout: "big-above-two", orientation: "portrait" },
  { layout: "big-left-two", orientation: "landscape" },
  { layout: "band-two-cols", orientation: "portrait" },
  { layout: "halves-side", orientation: "landscape" },
];

async function main() {
  const out = path.join(__dirname, "..", "out", "science");
  fs.mkdirSync(out, { recursive: true });

  for (const t of TRIES) {
    const spec = { ...CONTENT, layout: t.layout, orientation: t.orientation };
    const problems = checkFit(spec);

    if (problems.length) {
      console.log(`REFUSED  ${t.layout} (${t.orientation})`);
      for (const p of problems) console.log(`         ${p}`);
      continue;
    }

    try {
      const html = renderSheet(spec);
      const base = `${t.layout}-${t.orientation}`;
      fs.writeFileSync(path.join(out, `${base}.html`), html);
      fs.writeFileSync(path.join(out, `${base}.pdf`), await htmlToPdf(html, {
        landscape: t.orientation === "landscape",
      }));
      console.log(`BUILT    ${t.layout} (${t.orientation})`);
    } catch (err) {
      console.log(`REFUSED  ${t.layout} (${t.orientation})`);
      console.log(`         ${String(err.message).split("\n").slice(1).join(" ").trim()}`);
    }
  }

  console.log(`\nFiles in ${out}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
