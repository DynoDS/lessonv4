"use strict";

// The worksheet was the one surface an em dash could still reach a child on.
//
// The deck, wall and stick-in builders each run sanitizeHouseStyle on their
// spec the moment it is parsed, so a dash the authoring agents leaked was
// caught before print everywhere except here. On 30 August 2026 two lessons
// shipped worksheets carrying raw em dashes - the Year 4 water-cycle sheet's
// word bank ("evaporation — water goes into the air") and the Year 4
// friendships Greater Depth help line ("boundary — a limit") - while the same
// day's decks and walls were clean. This test holds the wiring: a spec with an
// em dash in it builds to HTML with the spaced hyphen the house style asks
// for, and no dash-shaped character survives anywhere a child reads.

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const BUILD = path.join(__dirname, "..", "scripts", "build-worksheet.js");
const FIXTURE = path.join(__dirname, "..", "fixtures", "maths-bar-chart-three-levels.json");

test("an em dash authored into worksheet.json never reaches the built HTML", () => {
  const spec = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
  spec.sheets.below.zones.a.row[1].items[0] =
    "Birch's total — how many books did they read?";

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "house-style-wiring-"));
  const specPath = path.join(dir, "worksheet.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));

  const result = spawnSync(process.execPath, [BUILD, specPath, dir, "House Style Test"], {
    encoding: "utf8",
    timeout: 120000,
  });
  assert.strictEqual(result.status, 0, `build failed:\n${result.stdout}\n${result.stderr}`);

  const htmlFiles = fs.readdirSync(dir).filter((f) => f.endsWith(".html"));
  assert.ok(htmlFiles.length > 0, "expected at least one built HTML sheet");

  let sawSanitizedQuestion = false;
  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(dir, file), "utf8");
    assert.ok(!html.includes("—"), `${file} still contains an em dash`);
    assert.ok(!html.includes("–"), `${file} still contains an en dash`);
    if (html.includes("Birch&#x27;s total - how many books") ||
        html.includes("Birch's total - how many books")) {
      sawSanitizedQuestion = true;
    }
  }
  assert.ok(
    sawSanitizedQuestion,
    "the em-dashed question should render with the spaced hyphen replacement"
  );

  // The separate answer key is part of what a person reads; it is built from
  // the same sanitized spec and must be clean too.
  const answerFiles = fs.readdirSync(dir).filter((f) => f.endsWith(".txt"));
  for (const file of answerFiles) {
    const text = fs.readFileSync(path.join(dir, file), "utf8");
    assert.ok(!text.includes("—"), `${file} still contains an em dash`);
  }

  fs.rmSync(dir, { recursive: true, force: true });
});
