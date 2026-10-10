"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { withTaughtChips } = require("../src/taught-chips");

const design = { vocabulary: [{ term: "stem" }, { term: "Diva lamp" }, { term: "adverbial" }] };
const bank = (chips) => ({ sheets: { below: { zones: { a: [{ helper: "chip-bank", title: "Word bank", chips }] } } } });
const chips = (spec) => spec.sheets.below.zones.a[0].chips;

test("a chip that is one of the lesson's taught words is marked, and a choice is not", () => {
  const before = bank(["stem", "diva lamps", "at bedtime", "a long stem", { word: "Adverbial", meaning: "tells us when" }]);
  const { spec, marked } = withTaughtChips(before, design);
  assert.equal(marked, 3);
  assert.deepEqual(chips(spec), ["{{stem}}", "{{diva lamps}}", "at bedtime", "a long stem", { word: "{{Adverbial}}", meaning: "tells us when" }]);
  assert.equal(chips(before)[0], "stem", "the spec it was given is left alone");
});

test("a chip already marked, a bank in another helper and a lesson with no word list are left alone", () => {
  const already = bank(["{{stem}}"]);
  assert.equal(withTaughtChips(already, design).spec, already);
  const other = { sheets: { below: { zones: { a: [{ helper: "sort-grid", wordBank: ["stem"] }] } } } };
  assert.equal(withTaughtChips(other, design).spec, other);
  for (const none of [null, {}, { vocabulary: [] }]) {
    const b = bank(["stem"]);
    assert.equal(withTaughtChips(b, none).spec, b);
  }
});
