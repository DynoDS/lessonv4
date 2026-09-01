'use strict';

// Catches a shape whose written coordinates no presentation program can read.
//
// The layout code positions everything in inches, and pptxgenjs turns inches
// into EMU (914,400 per inch) when it writes the file. For a table that lands
// at a NEGATIVE position, that conversion is applied more than once: -0.42in
// becomes -384,048 EMU, which still looks like "an inch value below 100" to
// the next pass, so it is multiplied again, and again. The written file then
// carries a y of around -3.2e17 - far outside the range the format allows -
// and PowerPoint greets the teacher with "PowerPoint found a problem with
// content" and an offer to repair the deck.
//
// The layout fault that produces a negative table position has its own named
// refusal at the helper that caused it. This check is the backstop for every
// other helper, present and future: it reads the package that was actually
// written - the same habit as the picture and marker checks - and refuses any
// coordinate so far outside the slide that it can only be corrupt arithmetic,
// never a design.
//
// It reads the package and changes nothing.

const { loadJSZip } = require('./fix-paragraph-props');

const SLIDE_PART = /^ppt\/slides\/slide(\d+)\.xml$/;

// Position and extent, wherever they appear in a slide part.
const COORD = /<a:(off|ext)\s+([^>]*?)\/?>/g;
const VALUE = /\b(x|y|cx|cy)="(-?\d+)"/g;

// About 33 inches. The slide itself is 13.33in x 7.5in, and nothing this
// builder draws sits more than a slide's width outside it; a deliberate bleed
// is a fraction of an inch. Every corrupt double- or triple-converted value
// observed or constructible is thousands of times larger than this, so the
// bound separates the two cleanly. It is a validity floor, not a layout
// opinion: content merely overflowing its zone is for the design checks.
const LIMIT_EMU = 30000000;

async function verifyGeometry(pptxPath, deps) {
  const JSZip = (deps && deps.JSZip) || loadJSZip();
  const fs = (deps && deps.fs) || require('fs');

  const zip = await JSZip.loadAsync(fs.readFileSync(pptxPath));
  const faults = [];
  let checked = 0;

  const parts = Object.keys(zip.files)
    .filter((name) => SLIDE_PART.test(name))
    .sort(
      (a, b) => Number(SLIDE_PART.exec(a)[1]) - Number(SLIDE_PART.exec(b)[1])
    );

  for (const part of parts) {
    const slide = Number(SLIDE_PART.exec(part)[1]);
    const xml = await zip.file(part).async('string');
    const bad = new Set();
    let coord;
    COORD.lastIndex = 0;
    while ((coord = COORD.exec(xml)) !== null) {
      let value;
      VALUE.lastIndex = 0;
      while ((value = VALUE.exec(coord[2])) !== null) {
        checked += 1;
        const n = Number(value[2]);
        if (Number.isFinite(n) && Math.abs(n) <= LIMIT_EMU) continue;
        bad.add(`${value[1]}="${value[2]}"`);
      }
    }
    if (bad.size) {
      faults.push({
        slide,
        part,
        values: [...bad],
        message:
          `slide ${slide} carries invalid shape coordinates ` +
          `(${[...bad].join(', ')}). A value this far outside the slide is ` +
          `corrupt arithmetic, not a layout, and PowerPoint will refuse the ` +
          `file or offer to repair it. It usually means a helper placed ` +
          `content at a negative position because its zone was too small for ` +
          `it: fix the slide's layout so the content fits its zone.`,
      });
    }
  }

  return { faults, slides: parts.length, coordinates: checked };
}

module.exports = { verifyGeometry, LIMIT_EMU };
