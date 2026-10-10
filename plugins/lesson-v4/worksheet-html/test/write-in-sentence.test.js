"use strict";

// "Put the comma in each sentence" (stress test, 7 October 2026): the
// sentences a child writes a comma into were the smallest print on the sheet,
// centred, and up to 62mm from their question number, because the only piece
// that could hold them was the marked-text drawing in its write-on form, made
// for a whole passage with margins for notes. The teacher chose, from pictures
// of the real Year 4 sheet (10 October 2026): beside the number, a size bigger,
// wider gaps between the words.

const { test } = require("node:test");
const assert = require("node:assert");

const { renderContent, measureContent } = require("../src/helpers");
const { TYPE } = require("../src/tokens");

const sentence = (extra = {}) => ({ helper: "annotated-text", passage: "Suddenly the owl opened its eyes.", space: "annotate", ...extra });

test("one unmarked sentence to write into is a line of print, not a drawing", () => {
  const html = renderContent(sentence(), 170);
  assert.match(html, /<p class="h-write-in-sentence">Suddenly the owl opened its eyes\.<\/p>/);
  assert.ok(!/<svg/.test(html), "nothing is drawn");
  assert.ok(TYPE.writeIn > TYPE.body, "a size up from the words around it");
});

test("a child's few sentences to check are a line each", () => {
  const lines = ["In the middle, of the night an owl woke up.", "The hungry owl, flew over the field."];
  const html = renderContent({ helper: "annotated-text", lines, space: "annotate", text: "Fix his mistakes." }, 170);
  assert.strictEqual((html.match(/class="h-write-in-sentence"/g) || []).length, 2);
  assert.match(html, /Fix his mistakes\./);
  assert.ok(measureContent({ helper: "annotated-text", lines, space: "annotate" }, 170) > measureContent(sentence(), 170));
});

test("a marked text, a titled one and a whole passage are still drawn as a marked text", () => {
  const marked = sentence({ marks: [{ find: "Suddenly", style: "underline" }] });
  const titled = sentence({ title: "Example" });
  const passage = sentence({ passage: "As the sun set, the old keeper climbed the spiral stairs. ".repeat(4) });
  const set = { helper: "annotated-text", passage: "Suddenly the owl opened its eyes." };
  for (const spec of [marked, titled, passage, set]) {
    const html = renderContent(spec, 170);
    assert.match(html, /<svg/);
    assert.ok(!/h-write-in-sentence/.test(html));
  }
});
