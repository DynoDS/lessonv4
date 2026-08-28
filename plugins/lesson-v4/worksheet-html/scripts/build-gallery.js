#!/usr/bin/env node
"use strict";

// The layout gallery, as a file rather than a server.
//
//   npm run gallery
//
// Every layout in the library drawn as an empty labelled skeleton, both
// orientations, with each zone's real printed size in millimetres and how many
// of the helpers it could actually hold.
//
// It already existed behind `npm run serve`, which means it existed behind a
// terminal, a running process and a browser tab. This is the same page written
// to a file that opens with a double click, because the person who has to judge
// these shapes is not going to start a server to do it.
//
// Deliberately EMPTY. Content is what made the first studio hard to read: you
// cannot judge an arrangement while you are reading questions sitting inside it.
// The question this page has to answer is Daniel's own: which page shapes are
// missing, which would never be used, and which he wants that are not here.

const fs = require("node:fs");
const path = require("node:path");

const { buildGalleryHtml } = require("../studio/gallery");
const { LAYOUTS, VARIANTS } = require("../src/layouts");

function main() {
  const out = path.join(__dirname, "..", "out");
  fs.mkdirSync(out, { recursive: true });

  const file = path.join(out, "layouts.html");
  fs.writeFileSync(file, buildGalleryHtml());

  console.log(
    `\n${LAYOUTS.length} named layouts and ${VARIANTS.length} variants ` +
      `(ratios, mirrors and turns), both orientations.`
  );
  console.log(`\n  ${file}\n`);
  console.log("Open it in a browser. Nothing to run, nothing to serve.");
}

main();
