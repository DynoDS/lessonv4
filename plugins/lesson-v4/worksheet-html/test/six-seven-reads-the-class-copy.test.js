"use strict";

// The no-67 rule is about a number a class reads, and the designer's notes to
// the teacher are not that.
//
// On 4 October 2026 three worksheet designers were given the same Year 4
// history lesson. Two wrote a note for the teacher about a sheet that would
// not fit ("352mm against 267mm available", "measured 167mm over"), quoting
// the page height the engine itself prints, and the build refused both packs
// with NUMBER_CONTAINS_SIX_SEVEN. Nothing a child would have read held the
// digits. This test holds both halves: a measurement in `notes` or in a
// sheet's `recordingReason` builds, and the same digits in a question are
// still refused.

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const BUILD = path.join(__dirname, "..", "scripts", "build-worksheet.js");
const FIXTURE = path.join(__dirname, "..", "fixtures", "maths-bar-chart-three-levels.json");

function build(change) {
  const spec = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
  change(spec);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "six-seven-class-copy-"));
  const specPath = path.join(dir, "worksheet.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));
  return spawnSync(process.execPath, [BUILD, specPath, dir, "Six Seven Test"], {
    encoding: "utf8",
    timeout: 120000,
  });
}

test("a page measurement in the designer's notes to the teacher does not refuse the pack", () => {
  const result = build((spec) => {
    spec.notes = ["Below: the content measured 352mm against 267mm available, so question 4 came off."];
    spec.sheets.below.recordingReason = "Sheet: the table is 167mm wide and cannot be ruled in a book.";
  });
  assert.doesNotMatch(result.stdout + result.stderr, /NUMBER_CONTAINS_SIX_SEVEN/);
  assert.strictEqual(result.status, 0, `build failed:\n${result.stdout}\n${result.stderr}`);
});

test("the same digits in a question a child reads are still refused", () => {
  const result = build((spec) => {
    spec.sheets.below.zones.a.row[1].items[0] = "Birch read 267 books. How many more is that than Oak?";
  });
  assert.match(result.stdout + result.stderr, /NUMBER_CONTAINS_SIX_SEVEN/);
  assert.notStrictEqual(result.status, 0);
});
