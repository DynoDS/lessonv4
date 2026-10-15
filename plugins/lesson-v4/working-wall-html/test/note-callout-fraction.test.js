"use strict";

// A fraction in a note that points at a wall drawing is written top and
// bottom. On 12 October 2026 a Year 5 wall showed bars labelled with stacked
// fractions and, beside them, two notes typed "3/4 = 6/8" and "6/8 > 5/8": the
// note is drawn by the wall on top of the picture, so it was neither the
// wall's words nor a shared drawing, and the 10 October repair reached both of
// those and not this.

const assert = require("node:assert/strict");
const test = require("node:test");

const { noteCalloutsSvg } = require("../src/note-callouts");

const draw = (note) => noteCalloutsSvg([{ anchor: [70, 50], note }], {}, 400, 300, "x.png", "Comic Sans MS");

test("a fraction in a note is stacked, with no slash left", () => {
  const { svg } = draw(["3/4 = 6/8"]);
  assert.equal(svg.match(/class="stacked-fraction-label"/g).length, 1);
  assert.equal(svg.match(/<line /g).length, 2, "one bar for each fraction");
  assert.doesNotMatch(svg, />[^<]*\d\/\d[^<]*</);
});

test("the note's box is taller for a fraction, so it stands inside it", () => {
  assert.ok(draw(["3/4 = 6/8"]).height >= draw(["six eighths"]).height);
  const lineH = (svg) => Number(/<rect [^>]*height="([\d.]+)" rx/.exec(svg)[1]);
  assert.ok(lineH(draw(["3/4 = 6/8"]).svg) > lineH(draw(["six eighths"]).svg));
});

test("a note with no fraction is drawn as it always was", () => {
  const { svg } = draw(["The zero", "holds the tens place"]);
  assert.doesNotMatch(svg, /stacked-fraction-label/);
  assert.equal(svg.match(/<text /g).length, 2);
});
