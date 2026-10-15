"use strict";

// A missing digit inside a number is a box a digit fits in.
//
// "2,4□8 + 1,3□6 =" on a Year 4 Greater Depth slip printed each box as the
// font's empty-box character, about 2mm square beside 6mm digits (stress test
// of 7 October 2026, round two; Daniel: "the missing-number boxes are tiny
// beside the digits"). The statement helper drew a box only when the box stood
// alone between spaces ("5 . □ 2"), so a box written into the number the way a
// question writes it was printed as a letter. Two other saved lessons wrote the
// same thing ("4,3□0", "3,2□8 + 14□ =").

const { test } = require("node:test");
const assert = require("node:assert");

const { renderContent, measureContent } = require("../src/helpers");
const { NUMBER_BOX_MM } = require("../src/tokens");

test("a box inside a number is drawn as the one number box", () => {
  const html = renderContent({ helper: "inequality-with-boxes", expression: "2,4□8 + 1,3□6 =" }, 174);
  assert.doesNotMatch(html, /□/);
  assert.strictEqual((html.match(/class="h-ineq-box"/g) || []).length, 2);
  // The digits either side stay with their box: one number, not three tokens.
  assert.match(html, /h-ineq-glued[^>]*>\s*<span class="h-ineq-part">2,4<\/span><span class="h-ineq-box"><\/span><span class="h-ineq-part">8<\/span>/);
});

test("a box standing alone still prints as before", () => {
  const html = renderContent({ helper: "inequality-with-boxes", expression: "5 . □ 2 < 5 . □ 8" }, 174);
  assert.strictEqual((html.match(/class="h-ineq-box"/g) || []).length, 2);
  assert.doesNotMatch(html, /h-ineq-glued/);
});

test("a number with a box in it is priced with the box's full width", () => {
  const glued = measureContent({ helper: "inequality-with-boxes", expression: "2,4□8" }, 20);
  const plain = measureContent({ helper: "inequality-with-boxes", expression: "2,4 8" }, 20);
  // Narrow enough that the wider row has to wrap: if the box were priced as a
  // character the two would measure alike.
  assert.ok(glued >= plain, `glued ${glued} plain ${plain}`);
  const { needs } = require("../src/helpers/comparing").helpers["inequality-with-boxes"];
  assert.ok(needs({ expression: "2,4□8" }).minWidthMm >= NUMBER_BOX_MM + 8);
});

test("a box inside a number in a source text is drawn as a box", () => {
  const html = renderContent({ helper: "source-text", paragraphs: ["Milo puts the same digit in both boxes.", "3,2□8 + 14□ ="] }, 174);
  assert.doesNotMatch(html, /□/);
  assert.match(html, /3,2<span class="h-digit-box"><\/span>8/);
});
