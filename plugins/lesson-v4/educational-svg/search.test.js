"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { scoreLabel, search } = require("./search");

function fixtureLibrary() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "educational-svg-search-"));
  const files = [
    "cartoon/ca/candle-lit.svg",
    "cartoon/pe/person-standing-prayer.svg",
    "standard/vo/volcano.svg",
    "solid/vo/volcano.svg",
  ];
  for (const relative of files) {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"/>');
  }
  return root;
}

test("exact labels rank above partial labels", () => {
  assert.ok(scoreLabel("volcano", "volcano") > scoreLabel("volcano cross section", "volcano"));
});

test("alternative queries find a nearby file-name phrase", () => {
  const result = search(
    { queries: ["man praying", "person prayer"], styles: ["cartoon"], limit: 5 },
    fixtureLibrary()
  );
  assert.equal(result.available, true);
  assert.equal(result.candidates[0].libraryId, "cartoon/pe/person-standing-prayer.svg");
});

test("style filters and limits are deterministic", () => {
  const result = search(
    { queries: ["volcano"], styles: ["solid"], limit: 1 },
    fixtureLibrary()
  );
  assert.deepEqual(
    result.candidates.map((candidate) => candidate.libraryId),
    ["solid/vo/volcano.svg"]
  );
});

test("a missing library is an available fallback, not a process failure", () => {
  const result = search(
    { queries: ["volcano"], styles: [], limit: 5 },
    path.join(os.tmpdir(), "educational-svg-library-that-does-not-exist")
  );
  assert.equal(result.available, false);
  assert.deepEqual(result.candidates, []);
});
