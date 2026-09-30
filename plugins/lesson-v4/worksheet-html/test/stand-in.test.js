"use strict";

// His answer (25 September 2026, the worksheets ledger): if a Below or Greater
// Depth sheet sent back to be redesigned still cannot be made, those children
// get the Expected sheet in its place, flagged so he knows. A returned sheet is
// out of `sheets`, and while the spec records the return the build prints the
// Expected sheet in that tier's place, with the Expected answers as its key
// section; the redesign replaces it when it goes in and the record comes off.
// (The last resort's stand-ins, for a sheet the build cannot make, are held by
// omit-unfittable.test.js.)

const { test } = require("node:test");
const { answersText } = require("./answer-text");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const { withExpectedStandingIn } = require("../src/returned");

const BUILD = path.join(__dirname, "..", "scripts", "build-worksheet.js");
const FIXTURE = path.join(
  __dirname,
  "..",
  "fixtures",
  "geography-grid-references-one-sheet.json"
);
const EXPECTED_PROMPT = "Give the four-figure grid reference for the mill.";

function baseSpec() {
  const spec = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
  for (const sheet of Object.values(spec.sheets)) {
    sheet.recording = "sheet";
    sheet.recordingReason = "Q1: the child writes on the printed page.";
  }
  return spec;
}

// A pack whose Below sheet went back over a picture that will never arrive,
// taken out of `sheets` (what the designer and the focused repair both leave).
function returnedBelow() {
  const spec = baseSpec();
  spec.notes = [
    "WORKSHEET_CONTENT_GAP: Below - adaptation-photo-002 will never arrive and no published picture carries it; return to adaptation designer.",
  ];
  spec.returned = [{ sheet: "below", problem: "picture", refs: ["adaptation-photo-002"] }];
  return spec;
}

function build(spec) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stand-in-"));
  const specPath = path.join(dir, "worksheet.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const out = path.join(dir, "out");
  const result = spawnSync("node", [BUILD, specPath, out, "Grid refs - Worksheets"], {
    encoding: "utf8",
  });
  const files = fs.existsSync(out) ? fs.readdirSync(out) : [];
  const read = (name) => (files.includes(name) ? fs.readFileSync(path.join(out, name), "utf8") : "");
  return { ...result, files, read, key: answersText(read("Grid refs - Answers.html")) };
}

// The answer lines under one heading of the key, up to the next blank line.
function section(key, heading) {
  const lines = key.split("\n");
  const start = lines.findIndex((line) => line.startsWith(heading));
  if (start < 0) return null;
  const end = lines.indexOf("", start);
  return lines.slice(start + 1, end < 0 ? undefined : end);
}

test("the Expected sheet stands in for a returned Below sheet, with its answers and a flag", () => {
  const built = build(returnedBelow());
  assert.strictEqual(built.status, 0, built.stdout + built.stderr);
  // The flag names the tier and why, on its own line (the gap note printed
  // beside it names the ref too, so the line itself is what is read).
  const flag = built.stdout.split(/\r?\n/).find((line) => line.startsWith("SHEET_STANDS_IN: "));
  assert.ok(flag, built.stdout);
  assert.match(flag, /^SHEET_STANDS_IN: Below - the Expected sheet stands in for Below/);
  assert.ok(flag.includes("a picture it needs will never arrive: adaptation-photo-002"), flag);
  assert.ok(flag.includes("the Below sheet could not be used as printed"), flag);
  // What happened, never a promise of a redesign the run may not ask for.
  assert.ok(!/redesign/.test(flag), flag);
  // A flag for his report, never a fault for a repair round.
  assert.ok(!built.stdout.includes('BUILD_DIAGNOSTIC: {"signal":"SHEET_STANDS_IN"'), built.stdout);
  assert.match(built.stdout, /^Sheets: Below, Expected$/m);

  const below = built.read("Grid refs - Worksheets-below.html");
  assert.ok(below.includes(EXPECTED_PROMPT), "the Below slot holds the Expected sheet");

  const standIn = section(built.key, "BELOW");
  const expected = section(built.key, "EXPECTED");
  assert.ok(standIn && expected, built.key);
  assert.match(standIn[0], /^The Expected sheet stands in here for the Below sheet, whose picture never arrived\./);
  assert.ok(!/redesign|[A-Z]{3,}_/.test(standIn[0]), standIn[0]);
  assert.deepStrictEqual(standIn.slice(1), expected, "the key covers it with the Expected answers");
});

test("a pack that returned no sheet is built as it always was", () => {
  const built = build(baseSpec());
  assert.strictEqual(built.status, 0, built.stdout + built.stderr);
  assert.ok(!built.stdout.includes("SHEET_STANDS_IN"), built.stdout);
  assert.ok(!built.key.includes("stands in"), built.key);
  assert.match(built.stdout, /^Sheets: Expected$/m);
});

test("with no Expected sheet to print in its place, the build refuses rather than leave a tier with nothing", () => {
  const spec = returnedBelow();
  spec.sheets = { greaterDepth: spec.sheets.expected };
  spec.answerKey = { greaterDepth: spec.answerKey.expected };
  const built = build(spec);
  assert.notStrictEqual(built.status, 0, built.stdout);
  assert.match(built.stdout, /^RETURNED_INVALID: returned sends the Below sheet back, and there is no Expected sheet to print in its place/m);
});

test("both returned tiers hold the Expected sheet and its answers; a record beside a sheet changes nothing", () => {
  const spec = returnedBelow();
  spec.returned.push({ sheet: "greaterDepth", problem: "teaching" });
  const back = withExpectedStandingIn(spec);
  assert.deepStrictEqual(back.stoodIn.map((entry) => entry.sheet), ["below", "greaterDepth"]);
  for (const tier of ["below", "greaterDepth"]) {
    assert.strictEqual(back.worksheet.sheets[tier], spec.sheets.expected);
    assert.strictEqual(back.worksheet.answerKey[tier], spec.answerKey.expected);
  }
  assert.deepStrictEqual(back.noExpected, []);

  const kept = returnedBelow();
  kept.sheets.below = { redesigned: true };
  const left = withExpectedStandingIn(kept);
  assert.deepStrictEqual(left.stoodIn, []);
  assert.deepStrictEqual(left.leftOver.map((entry) => entry.sheet), ["below"]);
  assert.strictEqual(left.worksheet.sheets.below, kept.sheets.below);
});

test("a sheet returned for its teaching: the key says in plain words it could not be used as printed", () => {
  const spec = returnedBelow();
  spec.notes = ["WORKSHEET_CONTENT_GAP: Below - question 2 cannot be answered as printed; return to adaptation designer."];
  spec.returned = [{ sheet: "below", problem: "teaching" }];
  const built = build(spec);
  assert.strictEqual(built.status, 0, built.stdout + built.stderr);
  const standIn = section(built.key, "BELOW");
  assert.ok(standIn, built.key);
  assert.strictEqual(
    standIn[0],
    "The Expected sheet stands in here for the Below sheet, which could not be used as printed. These are the Expected answers."
  );
});
