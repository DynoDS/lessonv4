"use strict";

// A fraction with a part to write is printed top and bottom, with the box a
// child writes in on the bar.
//
// On 12 October 2026 a Year 5 Below sheet printed a stacked 2/3, an equals
// sign, a box, and then "/6" typed on the line, twelve times: every piece cut
// its line at the blank before anything looked for a fraction, so the one
// fraction the child had to finish was the only one not written the way the
// lesson taught. The teacher chose, from the real sheet (13 October 2026): a
// box big enough to write in on top of the bar; and where the whole fraction
// is missing, a box over a box for Years 1 to 4 and any Below sheet, one tall
// box for older children.

const assert = require("node:assert/strict");
const test = require("node:test");

const { renderHelper, measureContent } = require("../src/helpers");
const { fractionBlankFor, sheetsOf } = require("../src/worksheet");

const frame = (content, extra = {}) => ({ helper: "method-frame", lines: [{ content }], ...extra });
const FRACTION = /<span class="h-mframe-frac">(.*?)<span class="h-mframe-frac-bar"><\/span>(.*?)<\/span>(?=<|$)/;
const BOX = '<span class="h-mframe-box"></span>';

test("a missing numerator is a box on the bar over its denominator", () => {
  const html = renderHelper(frame("2/3 = ___/6"), 120);
  const [, top, bottom] = FRACTION.exec(html);
  assert.equal(top, BOX);
  assert.match(bottom, />6$/);
  assert.doesNotMatch(html, /\/6/, "no slash is left typed on the line");
});

test("a missing denominator is its numerator over a box", () => {
  const html = renderHelper(frame("3/___ = 6/8"), 120);
  const [, top, bottom] = FRACTION.exec(html);
  assert.match(top, />3</);
  assert.match(bottom, /h-mframe-box/);
});

test("an empty-box character is read the same as underscores", () => {
  assert.match(renderHelper(frame("1/2 = □/10"), 120), /h-mframe-frac-bar/);
});

test("three in a row keep their commas and each is its own fraction", () => {
  const html = renderHelper(frame("___/12, ___/12, ___/12"), 150);
  assert.equal(html.match(/h-mframe-frac-bar/g).length, 3);
  assert.equal(html.match(/h-mframe-punct/g).length, 2);
});

test("a whole fraction to write is a box over a box for a younger child", () => {
  const html = renderHelper(frame("2/3 = ___/___", { fractionBlank: "boxes" }), 120);
  const [, top, bottom] = FRACTION.exec(html);
  assert.equal(top, BOX);
  assert.match(bottom, /h-mframe-box/);
});

test("and one tall box for an older one", () => {
  const html = renderHelper(frame("2/3 = ___/___", { fractionBlank: "tall" }), 120);
  assert.match(html, /h-mframe-box-tall/);
  assert.doesNotMatch(html, /h-mframe-frac-bar/);
});

test("Years 1 to 4 and every Below sheet are younger; a sheet with no year takes the two boxes", () => {
  assert.equal(fractionBlankFor("expected", 3), "boxes");
  assert.equal(fractionBlankFor("expected", "Year 4"), "boxes");
  assert.equal(fractionBlankFor("expected", 5), "tall");
  assert.equal(fractionBlankFor("greaterDepth", 6), "tall");
  assert.equal(fractionBlankFor("below", 6), "boxes");
  assert.equal(fractionBlankFor("expected", undefined), "boxes");
});

test("the line with a fraction to finish is measured taller, so the page plans for it", () => {
  const plain = measureContent(frame("5 + ___ = 9"), 120);
  const partial = measureContent(frame("2/3 = ___/6"), 120);
  const twoBoxes = measureContent(frame("2/3 = ___/___", { fractionBlank: "boxes" }), 120);
  assert.ok(partial > plain + 5, `${partial} against ${plain}`);
  assert.ok(twoBoxes > partial);
});

test("a frame with no fraction to finish prints as it always did", () => {
  const html = renderHelper(frame("5 + ___ = 9"), 120);
  assert.doesNotMatch(html, /h-mframe-frac/);
  assert.equal(html.match(/h-mframe-box/g).length, 1);
});

test("a date beside a blank is not a fraction", () => {
  assert.doesNotMatch(renderHelper(frame("___ on 9/10/2026"), 120), /h-mframe-frac|sfr/);
});

test("a blank fraction in an ordinary sentence is stacked too, with a box to write in", () => {
  const html = renderHelper({ helper: "instruction", text: "Fill in: 2/3 = ___/6" }, 150);
  assert.match(html, /<span class="sfr-n"><span class="sfr-box"><\/span><\/span><span class="sfr-bar"><\/span><span class="sfr-d">6</);
  assert.doesNotMatch(html.replace(/<[^>]*>/g, ""), /\/6/);
});

test("a fraction sequence's missing fraction follows the same younger and older rule", () => {
  const spec = { helper: "fraction-sequence", fractions: ["?", { num: 1, den: 2 }], separator: "," };
  assert.match(renderHelper({ ...spec, fractionBlank: "boxes" }, 120), /h-frac-two-bar/);
  assert.match(renderHelper({ ...spec, fractionBlank: "tall" }, 120), /h-frac-blank/);
  assert.match(renderHelper(spec, 120), /h-frac-blank/);
});
