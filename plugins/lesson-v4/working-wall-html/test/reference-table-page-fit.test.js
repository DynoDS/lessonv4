"use strict";

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { build } = require("../build");

const exactRows = [
  ["Fruit and vegetables", "Vitamins, minerals and fibre"],
  ["Starchy foods", "Carbohydrate for energy, and fibre in wholegrain foods"],
  ["Protein foods", "Protein for growth and repair, plus vitamins and minerals"],
  ["Dairy and alternatives", "Protein and calcium for growth, bones and teeth"],
  ["Oils and spreads", "Fats that provide energy and help the body use some vitamins"],
];

function writeWall(orientation) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "working-wall-reference-fit-"));
  const specPath = path.join(dir, "working-wall.json");
  fs.writeFileSync(specPath, JSON.stringify({
    topic: "The importance of a balanced diet",
    yearGroup: "Year 3",
    lessonSlug: `balanced-diet-${orientation}`,
    rationaleNote: "A readable food-group reference.",
    cards: [{
      type: "referenceTable",
      title: "Food groups",
      page: { size: "A3", orientation },
      columns: ["Food group", "Some useful nutrients"],
      rows: exactRows,
    }],
  }, null, 2));
  return { dir, specPath };
}

test("rejects a landscape table whose final row would fall below the page", async () => {
  const { dir, specPath } = writeWall("landscape");
  await assert.rejects(
    () => build(specPath, dir, { validateOnly: true }),
    /Layout validation failed:[\s\S]*5 rows need/
  );
});

test("accepts the same exact rows in measured A3 portrait at the 36pt floor", async () => {
  const { dir, specPath } = writeWall("portrait");
  const messages = [];
  const original = console.log;
  console.log = (...args) => messages.push(args.map(String).join(" "));
  try {
    assert.strictEqual(await build(specPath, dir, { validateOnly: true }), null);
  } finally {
    console.log = original;
  }
  assert.ok(messages.some((line) => /^WORKING_WALL_LAYOUT_OK: 1 card\(s\), 1 page\(s\)$/.test(line)));
  assert.deepStrictEqual(fs.readdirSync(dir), ["working-wall.json"]);
});
