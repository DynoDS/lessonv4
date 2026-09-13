"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { REGISTRY, helperNames } = require("../src/helpers");
const { TYPE } = require("../src/tokens");
const EXAMPLES = require("./helper-examples");

// A minimum size must mean "a child can still use this", not "it still fits".
//
// Every drawing is an SVG scaled to whatever width its zone gives it, so its
// labels shrink with it. A helper can therefore pass every other check, fit its
// zone perfectly, print without a pixel clipped, and still be useless, because
// the numbers along its axis have come out too small to read.
//
// That is not hypothetical. A number line stated a minimum of 70mm, at which
// its labels printed at THREE AND A HALF POINT. Nothing anywhere objected: it
// fitted, it did not clip, and the page looked finished.
//
// The floor is the design system's own smallest size. A label may be smaller
// than body text, but nothing on a worksheet is meant to be smaller than a
// note, so `TYPE.note` is the honest limit rather than an invented one.

const PT_MM = 0.3528;
const FLOOR_PT = TYPE.note;

// The printed size of a helper's smallest text, at the narrowest zone the
// helper says it can live in. Returns null for a drawing with no text at all,
// which has nothing to be illegible.
function smallestTextPt(name) {
  const spec = { helper: name, ...EXAMPLES[name] };
  // A shared drawing laid out at its printed width (the number line) writes
  // real point sizes: render it at its narrowest width and read them directly.
  if (REGISTRY[name].physical) {
    const narrow = REGISTRY[name].render(spec, REGISTRY[name].needs(spec).minWidthMm);
    const sizes = [...narrow.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
    return sizes.length ? Math.min(...sizes) : null;
  }
  const html = REGISTRY[name].render(spec);
  if (!html.includes("<svg")) return null; // HTML helpers use the token sizes

  const viewBox = html.match(/viewBox="([^"]+)"/);
  const fonts = [...html.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
  if (!viewBox || !fonts.length) return null;

  const svgUnitsWide = Number(viewBox[1].trim().split(/\s+/)[2]);
  const minWidthMm = REGISTRY[name].needs(spec).minWidthMm;

  // The SVG is scaled so its whole width fits the zone, so a font of N SVG
  // units prints at N times that same scale.
  const mmPerUnit = minWidthMm / svgUnitsWide;
  return (Math.min(...fonts) * mmPerUnit) / PT_MM;
}

test("no drawing's labels print smaller than the smallest size in the design system", () => {
  const tooSmall = [];

  for (const name of helperNames()) {
    const pt = smallestTextPt(name);
    if (pt === null) continue;
    if (pt < FLOOR_PT - 0.05) {
      tooSmall.push(`${name}: labels print at ${pt.toFixed(1)}pt at its stated minimum width`);
    }
  }

  assert.deepEqual(
    tooSmall,
    [],
    `\nThese helpers can be approved into a zone where a child cannot read them ` +
      `(the floor is ${FLOOR_PT}pt):\n  ${tooSmall.join("\n  ")}\n` +
      `Raise the helper's minWidthMm until its labels clear the floor.`
  );
});

test("the check would actually catch a drawing whose labels are too small", () => {
  // The test above passes when nothing is wrong, which is also what it would
  // do if it silently measured nothing. This proves it can fail.
  const shrunk = 1200; // SVG units wide
  const font = 22; // SVG units
  const minWidthMm = 70; // what the number line used to claim
  const pt = (font * (minWidthMm / shrunk)) / PT_MM;

  assert.ok(pt < FLOOR_PT, `expected ${pt.toFixed(1)}pt to be under the floor`);
});

test("a helper made only of HTML is not measured this way", () => {
  // HTML helpers take their sizes from the token variables directly, so they
  // do not scale with their zone and cannot shrink out of legibility.
  assert.equal(smallestTextPt("questions"), null);
  assert.equal(smallestTextPt("data-table"), null);
});
