"use strict";

// Small things every helper file needs. Kept apart from index.js so that a
// helper file can use them without importing the registry that imports it.

const { WRITING_LINE_MM, TYPE } = require("../tokens");

const BODY_PT = 12; // must track TYPE.body in tokens.js
const PT_MM = 0.3528;
const LINE_MM = BODY_PT * PT_MM * 1.35; // a line of body text, with leading
const NOTE_LINE_MM = TYPE.note * PT_MM * 1.35; // a line at the smallest size

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// A run of underscores in child-facing prompt text is a blank the child
// writes INTO - a sentence stem's gaps are its answer space. Printed as the
// designer's literal "___" it is a few millimetres wide: an answer space no
// pencil fits, on a page that looks finished. So every run of two or more
// underscores prints as one uniform write-in blank wide enough for a real
// written word, and every blank in a stem comes out the same width, so a
// blank's length never leaks which word it wants.
//
// BLANK_CHARS is what the measurement counts for each blank, and the printed
// width is derived from the same number, so the estimate and the page agree.
const BLANK_CHARS = 12;
const BLANK_MM = 25; // the printed width of one blank; tracks BLANK_CHARS at body size
const BLANK_RUN = /_{2,}/g;

function normaliseBlanks(text) {
  return String(text).replace(BLANK_RUN, "_".repeat(BLANK_CHARS));
}

// Escape first, then swap the runs: the replacement carries markup that must
// not itself be escaped.
function promptHtml(text) {
  return esc(text).replace(BLANK_RUN, '<span class="h-blank"></span>');
}

// Roughly how many characters of Comic Sans fit on a line at body size.
//
// A helper that over-estimates leaves a gap; one that under-estimates
// overflows the page, and a gap is the cheaper mistake. So this keeps a
// margin. But the margin used to be 0.52, which is what the lowercase
// alphabet measures with no spaces in it: a worst case that never occurs in a
// sentence. Measured in Chrome, real primary-school prose comes out between
// 0.464 and 0.489, so 0.52 bought roughly a whole extra line per paragraph,
// and that line became a hole in the page.
//
// 0.50 keeps a margin over the widest real sentence measured while costing
// nothing. `npm run check-render` is what proves it is still safe.
const CHAR_WIDTH_FACTOR = 0.5;

function linesFor(text, widthMm) {
  const charMm = BODY_PT * PT_MM * CHAR_WIDTH_FACTOR;
  const perLine = Math.max(8, Math.floor(widthMm / charMm));
  // Blanks are normalised so the count sees the width the blank will PRINT at,
  // not the two or three underscores the designer typed.
  return Math.max(1, Math.ceil(normaliseBlanks(text).length / perLine));
}

// A drawn visual's natural height follows from the width it is given and its
// own aspect. Capped, because one picture should not swallow a whole page.
function heightFromAspect(aspect, widthMm, capMm) {
  return Math.min(widthMm / aspect, capMm);
}

// The width at which a drawing's smallest label finally prints big enough to
// read.
//
// A drawn helper is an SVG scaled to fill whatever width its zone gives it, so
// its labels shrink with it. A helper can pass every other check, fit its zone,
// print without a pixel clipped, and still be useless because the numbers along
// its axis came out too small to read. A number line once stated a minimum of
// 70mm, at which its labels printed at three and a half point, and nothing
// objected: it fitted, it did not clip, the page looked finished.
//
// The floor is the design system's own smallest size. A label may be smaller
// than body text, but nothing on a worksheet is meant to be smaller than a
// note, so that is the honest limit rather than an invented one.
//
// Returns 0 for a drawing with no text, which has nothing to be illegible.
function legibleWidthMm(svg) {
  const viewBox = /viewBox="([^"]+)"/.exec(svg);
  if (!viewBox) return 0;

  let smallest = Infinity;
  const fonts = /font-size="([\d.]+)"/g;
  let match;
  while ((match = fonts.exec(svg)) !== null) {
    smallest = Math.min(smallest, Number(match[1]));
  }
  if (!Number.isFinite(smallest) || smallest <= 0) return 0;

  const unitsWide = Number(viewBox[1].trim().split(/\s+/)[2]);
  if (!unitsWide) return 0;

  // The SVG fills the zone's width, so a font of N units prints at N times
  // that scale. Solve for the width that puts the smallest font on the floor.
  return ((TYPE.note * PT_MM) / smallest) * unitsWide;
}

module.exports = {
  BODY_PT,
  PT_MM,
  LINE_MM,
  NOTE_LINE_MM,
  WRITING_LINE_MM,
  BLANK_CHARS,
  BLANK_MM,
  esc,
  promptHtml,
  normaliseBlanks,
  linesFor,
  heightFromAspect,
  legibleWidthMm,
};
