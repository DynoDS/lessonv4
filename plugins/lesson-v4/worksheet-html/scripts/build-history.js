#!/usr/bin/env node
"use strict";

// The same machinery, no maths anywhere.
//
// This exists to answer one question: is the layout system maths-shaped? It is
// not. A zone knows it is 180mm by 70mm. It does not know or care whether what
// sits in it is a bar chart or a Victorian school log book. Swap the content,
// keep the layout, and the page still works.
//
//   npm run history

const fs = require("node:fs");
const path = require("node:path");

const { renderSheet, checkFit } = require("../src/render");
const { htmlToPdf } = require("../src/chrome");

const CONTENT = {
  title: "Victorian schools",
  lo: "To use a source to work out what school was like for Victorian children",
  zones: {
    a: {
      helper: "source-text",
      heading: "From a school log book, Norfolk, 1876",
      paragraphs: [
        "Monday. Attendance poor again. Many of the older boys are away helping with the harvest and will not return until it is gathered in. Punished two boys for lateness.",
        "Wednesday. The Inspector called without warning. He heard the first class read and was satisfied, but found the arithmetic wanting. The room was very cold as we have no coal.",
        "Friday. Sarah Bell has left the school. She is eleven years old and is to go into service at the big house.",
      ],
      attribution: "Adapted from a real school log book.",
    },
    b: {
      helper: "questions",
      items: [
        "In which year was this written?",
        "Why were the older boys away?",
        "How old was Sarah Bell when she left?",
        "What did the Inspector think of the arithmetic?",
      ],
    },
    c: {
      helper: "written-answers",
      startAt: 5,
      phase: "upper",
      items: [
        { text: "What does this source tell you about why Victorian children missed school? Use two details.", lines: 4 },
        { text: "The teacher wrote this for himself, not for us to read. Does that make it more useful or less useful to a historian?", lines: 4 },
      ],
    },
  },
};

const TRIES = [
  { layout: "thirds-stacked", orientation: "portrait" },
  { layout: "big-above-two", orientation: "portrait" },
  { layout: "big-left-two", orientation: "landscape" },
];

async function main() {
  const out = path.join(__dirname, "..", "out", "history");
  fs.mkdirSync(out, { recursive: true });

  for (const t of TRIES) {
    const spec = { ...CONTENT, layout: t.layout, orientation: t.orientation };
    const problems = checkFit(spec);

    if (problems.length) {
      console.log(`\nREFUSED  ${t.layout} (${t.orientation})`);
      for (const p of problems) console.log(`         ${p}`);
      continue;
    }

    const html = renderSheet(spec);
    const base = `${t.layout}-${t.orientation}`;
    fs.writeFileSync(path.join(out, `${base}.html`), html);
    fs.writeFileSync(path.join(out, `${base}.pdf`), await htmlToPdf(html, {
      landscape: t.orientation === "landscape",
    }));
    console.log(`BUILT    ${t.layout} (${t.orientation})`);
  }

  console.log(`\nFiles in ${out}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
