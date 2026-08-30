"use strict";

// The missing Below sheet of 30 August 2026: adaptation.md directed a separate
// Below sheet, the designer omitted it because its three adaptation
// photographs "had not arrived" (they are sourced only after worksheet.json
// names them), and preflight said OK at the exact moment the loss was still
// repairable. The preflight now holds the spec to the sheets the adaptation
// directed, and holds a content-gap omission to refs genuinely absent from the
// photo contract.

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const CHECK = path.join(__dirname, "..", "scripts", "check-worksheet.js");
const FIXTURE = path.join(
  __dirname,
  "..",
  "fixtures",
  "geography-grid-references-one-sheet.json"
);

// A spec the ordinary preflight already accepts, so these tests measure only
// the directed-sheet gate layered on top of it.
function baseSpec() {
  return JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
}

function runCheck(dir, worksheet, extraArgs = []) {
  const specPath = path.join(dir, "worksheet.json");
  fs.writeFileSync(specPath, JSON.stringify(worksheet));
  try {
    const stdout = execFileSync("node", [CHECK, specPath, ...extraArgs], {
      encoding: "utf8",
    });
    return { code: 0, stdout };
  } catch (error) {
    return { code: error.status, stdout: String(error.stdout || "") };
  }
}

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "directed-sheets-"));
}

const DIRECTIVE = "Resource decision: Generate separate Below adaptation\n";

test("a directed Below sheet missing with no gap note fails preflight", () => {
  const dir = tmpDir();
  const adaptation = path.join(dir, "adaptation.md");
  fs.writeFileSync(adaptation, DIRECTIVE);

  const result = runCheck(dir, baseSpec(), ["--adaptation", adaptation]);
  assert.notStrictEqual(result.code, 0);
  assert.ok(result.stdout.includes("SHEET_DIRECTED_MISSING"), result.stdout);
});

test("an omission over refs that ARE in the contract is refused", () => {
  const dir = tmpDir();
  const adaptation = path.join(dir, "adaptation.md");
  fs.writeFileSync(adaptation, DIRECTIVE);
  const contract = path.join(dir, "photos.json");
  fs.writeFileSync(
    contract,
    JSON.stringify({
      photos: [
        { id: "adaptation-photo-001", filename: "a1.png" },
        { id: "adaptation-photo-002", filename: "a2.png" },
      ],
    })
  );

  const spec = baseSpec();
  spec.notes = [
    "WORKSHEET_CONTENT_GAP: Below - required adaptation photographs " +
      "adaptation-photo-001 and adaptation-photo-002 have no usable " +
      "published pictures; return to adaptation designer.",
  ];
  const result = runCheck(dir, spec, [
    "--adaptation",
    adaptation,
    "--photo-requirements",
    contract,
  ]);
  assert.notStrictEqual(result.code, 0);
  assert.ok(result.stdout.includes("CONTENT_GAP_UNFOUNDED"), result.stdout);
});

test("an omission over a ref genuinely absent from the contract stands", () => {
  const dir = tmpDir();
  const adaptation = path.join(dir, "adaptation.md");
  fs.writeFileSync(adaptation, DIRECTIVE);
  const contract = path.join(dir, "photos.json");
  fs.writeFileSync(contract, JSON.stringify({ photos: [] }));

  const spec = baseSpec();
  spec.notes = [
    "WORKSHEET_CONTENT_GAP: Below - required adaptation photograph " +
      "adaptation-photo-009 has no approved request; return to adaptation designer.",
  ];
  const result = runCheck(dir, spec, [
    "--adaptation",
    adaptation,
    "--photo-requirements",
    contract,
  ]);
  assert.strictEqual(result.code, 0, result.stdout);
  assert.ok(result.stdout.includes("WORKSHEET_PREFLIGHT_OK"), result.stdout);
});

test("a spec carrying the directed sheet passes untouched", () => {
  const dir = tmpDir();
  const adaptation = path.join(dir, "adaptation.md");
  fs.writeFileSync(adaptation, DIRECTIVE);

  const spec = baseSpec();
  spec.sheets.below = JSON.parse(JSON.stringify(spec.sheets.expected));
  spec.answerKey.below = JSON.parse(JSON.stringify(spec.answerKey.expected));
  const result = runCheck(dir, spec, ["--adaptation", adaptation]);
  assert.strictEqual(result.code, 0, result.stdout);
  assert.ok(result.stdout.includes("WORKSHEET_PREFLIGHT_OK"), result.stdout);
});

test("without --adaptation the check behaves exactly as before", () => {
  const dir = tmpDir();
  const result = runCheck(dir, baseSpec());
  assert.strictEqual(result.code, 0, result.stdout);
  assert.ok(result.stdout.includes("WORKSHEET_PREFLIGHT_OK"), result.stdout);
});
