"use strict";

// The standing drift guard for the HTML builder - the working wall's
// equivalent of stick-in's footprint test. Every JSON in test-fixtures-a3/
// gets built once here; a future change that breaks a card type or a page
// count fails this file before it ever reaches a teacher. This is a sweep,
// not a visual review - it proves every saved fixture still builds and keeps
// its expected page count.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const { build } = require("../build");
const { mediaBoxes } = require("./pdf-util");

const FIXTURES_DIR = path.join(__dirname, "..", "test-fixtures-a3");

function scratchDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "working-wall-html-parity-"));
}

// mnemonicPoster spans 1 summary page + one page per item; banner spans one
// page per word; every other card type is a single page. Mirrors build.js's
// own flatMap comment (the source of truth for this arithmetic).
function expectedPageCount(spec) {
  return (spec.cards || []).reduce((total, card) => {
    if (card.type === "mnemonicPoster") return total + 1 + (card.items || []).length;
    if (card.type === "banner") return total + (card.words || []).length;
    return total + 1;
  }, 0);
}

const fixtureFiles = fs
  .readdirSync(FIXTURES_DIR)
  .filter((name) => name.endsWith(".json"))
  .sort();

// Sanity check on the sweep itself: if this ever comes back empty the loop
// below would silently pass with nothing tested.
assert.ok(fixtureFiles.length > 0, `expected at least one fixture in ${FIXTURES_DIR}`);

for (const fileName of fixtureFiles) {
  test(`sweep: ${fileName}`, async () => {
    const specPath = path.join(FIXTURES_DIR, fileName);
    const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
    const outDir = scratchDir();

    const outPath = await build(specPath, outDir);

    if (!spec.cards || spec.cards.length === 0) {
      assert.strictEqual(outPath, null, `${fileName} has no cards; build() should return null`);
      return;
    }

    assert.ok(outPath, `${fileName}: build() should return the output path`);
    assert.ok(fs.existsSync(outPath), `${fileName}: expected output file to exist at ${outPath}`);
    assert.match(outPath, /\.pdf$/, `${fileName}: expected a PDF; got ${outPath} (no Chrome on this machine?)`);

    const pdf = fs.readFileSync(outPath);
    const boxes = mediaBoxes(pdf);
    const expected = expectedPageCount(spec);
    assert.strictEqual(boxes.length, expected, `${fileName}: expected ${expected} pages, found ${boxes.length}`);
  });
}
