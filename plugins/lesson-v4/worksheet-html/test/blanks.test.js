"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  promptHtml,
  normaliseBlanks,
  linesFor,
  BLANK_CHARS,
} = require("../src/helpers/shared");
const { helpers } = require("../src/helpers/text");
const cards = require("../src/helpers/matching").helpers;
const forms = require("../src/helpers/forms").helpers;

test("caption completions use measured phrase space and preserve line breaks", () => {
  const caption = "Its ___ helps it ___.\nExplain why.";
  const html = cards['card-row'].render({cards:[{caption}], blankWidthMm:45});
  assert.equal((html.match(/width:45mm/g) || []).length, 2);
  assert.ok(!html.includes('___'));
  assert.ok(html.includes('<br>Explain why.'));
  assert.ok(linesFor(caption, 55, 45) > linesFor(caption, 55, 25));
  assert.throws(() => promptHtml('___', '45; color:red'), /blankWidthMm/);
});

test("separate instructions remain separate in rendering and measurement", () => {
  assert.equal(promptHtml('First.\n\nSecond.'), 'First.<br><br>Second.');
  assert.equal(linesFor('First.\n\nSecond.', 180), 3);
});

test("choice controls allow an external stem without printing an absent value", () => {
  const spec = {options:['Yes','No']};
  const html = forms['multiple-choice'].render(spec);
  assert.ok(!html.includes('undefined') && !html.includes('h-mc-stem'));
  assert.ok(html.includes('Tick one.'));
  assert.ok(forms['multiple-choice'].measure({...spec,text:'Is this correct?'},100) > forms['multiple-choice'].measure(spec,100));
});

// A run of underscores in a prompt is a blank the child writes INTO. Printed
// literally, "___" is a few millimetres wide: an answer space no pencil fits.
// A real lesson shipped a sentence stem as "___ gives ___ for ___." and the
// blanks were unusable.

test("a run of underscores prints as a uniform write-in blank", () => {
  const html = promptHtml("___ gives ___ for ___.");
  assert.equal(html.split('class="h-blank"').length - 1, 3);
  assert.ok(!html.includes("_"), "literal underscores still reached the page");
});

test("every blank is the same width whatever the designer typed", () => {
  // A blank's length must not leak which word it wants, so two underscores and
  // ten come out identical.
  assert.equal(promptHtml("__"), promptHtml("__________"));
});

test("a single underscore is left alone", () => {
  // One underscore is punctuation or a variable name, not a blank.
  assert.equal(promptHtml("snake_case"), "snake_case");
});

test("the measurement sees the width the blank will print at", () => {
  const stem = "___ gives ___ for ___.";
  const printed = normaliseBlanks(stem);
  assert.equal(
    printed.length,
    stem.length - 9 + BLANK_CHARS * 3,
    "normalisation and BLANK_CHARS disagree"
  );
  // A narrow zone that holds the typed underscores on one line does not hold
  // three printed blanks on one line; the estimate must say so.
  assert.ok(linesFor(stem, 40) > 1, "the estimate still measures the underscores");
});

test("blanks reach the page through the instruction helper", () => {
  const html = helpers.instruction.render({ text: "Toast gives ___." });
  assert.ok(html.includes('class="h-blank"'));
});

test("escaping still happens before the swap, so markup cannot be injected", () => {
  const html = promptHtml("<b>___</b>");
  assert.ok(html.includes("&lt;b&gt;"));
  assert.equal(html.split('class="h-blank"').length - 1, 1);
});
