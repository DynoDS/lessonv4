"use strict";

// One sheet that will not fit must not lose the pack.
//
// Maths 15 (22 September 2026, compare and order negative numbers) delivered no
// worksheets at all. The Expected sheet was repaired until it fit, the untouched
// Greater Depth sheet then failed on its own, and all three sheets and the
// answer key went with it. The class got a deck and nothing to write on.
//
// The teacher's standing rule for the deck is the rule this needed (16
// September 2026, "flag the slides and deliver it"): one bad slide never
// withholds a deck. These tests pin the same thing for sheets, and, just as
// importantly, pin the two limits on it - the last sheet standing is never
// omitted, and a fault that is not about page fit still refuses everything.

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const BUILD = path.join(__dirname, "..", "scripts", "build-worksheet.js");

// A sheet the page can hold, and one it cannot: the unfittable one asks for a
// stack of twelve ruled answers beside a table, which no layout in the library
// has room for at a readable size.
const fittingSheet = (question) => ({
  layout: "full",
  orientation: "portrait",
  zones: { a: { question: true, helper: "questions", items: [question] } },
});

// With "layout": "auto" the zones are an array of zone contents in reading
// order, one entry per zone.
const unfittableSheet = () => ({
  layout: "auto",
  zones: [
    {
      question: true,
      stack: Array.from({ length: 12 }, () => ({
        helper: "data-table",
        caption: "Use this table to answer every part of the question below.",
        rows: Array.from({ length: 14 }, (_, r) => [
          `Row ${r + 1}`,
          "a fairly long cell of words",
          "another fairly long cell of words",
          "a third fairly long cell of words",
        ]),
      })),
    },
  ],
});

function buildWith(spec, extraArgs) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "worksheet-omit-"));
  const specPath = path.join(dir, "worksheet.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));
  let stdout;
  let failed = false;
  try {
    stdout = execFileSync(
      process.execPath,
      [BUILD, specPath, dir, "Omission - Worksheets", ...(extraArgs || [])],
      { encoding: "utf8" }
    );
  } catch (e) {
    failed = true;
    stdout = e.stdout || e.message;
  }
  const files = fs.readdirSync(dir).filter((f) => f !== "worksheet.json");
  fs.rmSync(dir, { recursive: true, force: true });
  return { stdout, files, failed };
}

const specWithOneUnfittable = () => ({
  meta: {
    lesson: "Compare and order negative numbers",
    lo: "To compare and order negative numbers",
    yearGroup: 4,
    subject: "maths",
  },
  sheets: {
    expected: fittingSheet("Write these in order, smallest first: −6, 1, −2, 0."),
    greaterDepth: unfittableSheet(),
  },
  answerKey: {
    expected: [{ question: 1, answer: "−6, −2, 0, 1" }],
    greaterDepth: [{ question: 1, answer: "Various." }],
  },
});

test("without the flag, one unfittable sheet still refuses the pack", () => {
  // Unchanged behaviour, and deliberately so: a hand build, and every ordinary
  // run, should still be told the sheet does not fit rather than quietly
  // handed a pack with a tier missing.
  const { stdout, files } = buildWith(specWithOneUnfittable());
  assert.match(stdout, /SHEET_DOES_NOT_FIT/);
  assert.doesNotMatch(stdout, /SHEET_OMITTED/);
  assert.deepEqual(files, []);
});

test("with the flag, the sheets that fit are delivered and the omission is said out loud", () => {
  const { stdout, files } = buildWith(specWithOneUnfittable(), ["--omit-unfittable"]);

  assert.match(stdout, /^SHEET_OMITTED: .*Greater Depth/m);
  assert.match(stdout, /SHEET_OMITTED_SUMMARY: delivered expected; omitted greaterDepth/);
  assert.match(stdout, /^Built: .*Omission - Worksheets\.pdf$/m);
  assert.match(stdout, /^Built answers: /m);

  // The pupil pack and the teacher's key both exist, and the key covers what
  // was delivered rather than a tier nobody has.
  assert.ok(files.includes("Omission - Worksheets.pdf"));
  assert.ok(files.includes("Omission - Answers.txt"));
  assert.ok(files.some((f) => /expected\.html$/.test(f)));
  assert.ok(!files.some((f) => /greaterDepth\.html$/.test(f)));
});

test("the last sheet standing is never omitted", () => {
  // A pack with nothing in it is not a partial delivery, it is no delivery, and
  // the run has to hear the real refusal.
  const spec = specWithOneUnfittable();
  spec.sheets = { greaterDepth: spec.sheets.greaterDepth };
  spec.answerKey = { greaterDepth: spec.answerKey.greaterDepth };

  const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);
  assert.match(stdout, /SHEET_DOES_NOT_FIT/);
  assert.doesNotMatch(stdout, /SHEET_OMITTED_SUMMARY/);
  assert.deepEqual(files, []);
});

test("a criteria panel is refused before the fit, and never costs the pack a sheet", () => {
  // Success criteria stay on the board (the teacher, 23 September 2026). A
  // panel on a sheet that cannot fit was priced as content, so the last-resort
  // build dropped the whole sheet for it; the panel is now refused first.
  const spec = specWithOneUnfittable();
  spec.sheets.greaterDepth.zones.push({
    helper: "steps",
    items: ["Compare the thousands.", "Same? Move right."],
  });

  const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);
  assert.match(stdout, /Greater Depth - zones\[1\]: CRITERIA_NOT_ON_SHEETS/);
  assert.doesNotMatch(stdout, /SHEET_OMITTED/);
  assert.deepEqual(files, []);
});

test("the preflight names a panel on an auto sheet and measures the page without it", () => {
  const CHECK = path.join(__dirname, "..", "scripts", "check-worksheet.js");
  const spec = specWithOneUnfittable();
  spec.sheets.greaterDepth = {
    layout: "auto",
    zones: [
      { question: true, helper: "questions", items: ["Write a number between −5 and −1."] },
      { helper: "steps", items: ["Compare the thousands.", "Same? Move right."] },
    ],
  };
  for (const sheet of Object.values(spec.sheets)) {
    sheet.recording = "sheet";
    sheet.recordingReason = "Q1: the child writes on the printed page.";
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "worksheet-panel-"));
  const specPath = path.join(dir, "worksheet.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));
  let stdout;
  try {
    stdout = execFileSync(process.execPath, [CHECK, specPath], { encoding: "utf8" });
  } catch (e) {
    stdout = String(e.stdout || e.message);
  }
  fs.rmSync(dir, { recursive: true, force: true });
  assert.match(stdout, /Greater Depth - zones\[1\]: CRITERIA_NOT_ON_SHEETS.*measured without it/);
  assert.match(stdout, /AUTO_LAYOUT: Greater Depth/);
  assert.doesNotMatch(stdout, /SHEET_DOES_NOT_FIT: Greater Depth/);
  assert.doesNotMatch(stdout, /WORKSHEET_PREFLIGHT_OK/);
});

function preflight(spec) {
  const CHECK = path.join(__dirname, "..", "scripts", "check-worksheet.js");
  for (const sheet of Object.values(spec.sheets)) {
    sheet.recording = "sheet";
    sheet.recordingReason = "Q1: the child writes on the printed page.";
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "worksheet-panel-"));
  const specPath = path.join(dir, "worksheet.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));
  let stdout;
  try {
    stdout = execFileSync(process.execPath, [CHECK, specPath], { encoding: "utf8" });
  } catch (e) {
    stdout = String(e.stdout || e.message);
  }
  fs.rmSync(dir, { recursive: true, force: true });
  return stdout;
}

// Eight steps a panel, two panels in a row of their own under seventeen
// questions: the page holds the questions only once both panels are off, as
// lesson 15's Greater Depth sheet did with its two panels side by side.
const panel = () => ({
  helper: "steps",
  title: "Use these steps to help you.",
  steps: Array.from({ length: 8 }, (_, i) => `Step ${i + 1}: compare the digits in the next column along carefully.`),
});
const sheetThatFitsOnlyWithoutItsPanels = () => ({
  layout: "auto",
  zones: [
    {
      stack: [
        {
          question: true,
          helper: "questions",
          items: Array.from({ length: 17 }, (_, i) => `Write a number between -${i + 5} and -${i + 1}.`),
        },
        { row: [panel(), panel()] },
      ],
    },
  ],
});

test("the preflight measures a sheet without its panels, and leaves no empty row behind", () => {
  const spec = specWithOneUnfittable();
  spec.sheets.greaterDepth = sheetThatFitsOnlyWithoutItsPanels();
  const stdout = preflight(spec);
  assert.match(stdout, /Greater Depth - zones\[0\]\.stack\[1\]\.row\[0\]: CRITERIA_NOT_ON_SHEETS/);
  assert.match(stdout, /Greater Depth - zones\[0\]\.stack\[1\]\.row\[1\]: CRITERIA_NOT_ON_SHEETS/);
  assert.match(stdout, /AUTO_LAYOUT: Greater Depth/);
  assert.doesNotMatch(stdout, /SHEET_DOES_NOT_FIT/);
  assert.doesNotMatch(stdout, /NaN/);
});

test("a named sheet's panel is named even when another sheet cannot be laid out", () => {
  // Lesson 15: its Expected sheet (a named layout) carried two panels, and its
  // Greater Depth sheet could not be laid out, so the Expected panels were named
  // nowhere and the last-resort build refused the pack over them after dropping
  // Greater Depth.
  const spec = specWithOneUnfittable();
  spec.sheets.expected.zones.a = {
    stack: [spec.sheets.expected.zones.a, panel()],
  };
  const stdout = preflight(JSON.parse(JSON.stringify(spec)));
  assert.match(stdout, /Expected - zones\.a\.stack\[1\]: CRITERIA_NOT_ON_SHEETS/);

  const built = buildWith(spec, ["--omit-unfittable"]);
  assert.match(built.stdout, /Expected - zones\.a\.stack\[1\]: CRITERIA_NOT_ON_SHEETS/);
  assert.doesNotMatch(built.stdout, /SHEET_OMITTED/);
  assert.deepEqual(built.files, []);
});

test("a panel held in a slot of its own is named once and said to be still measured", () => {
  const spec = specWithOneUnfittable();
  spec.sheets.greaterDepth = {
    layout: "full",
    orientation: "portrait",
    zones: { a: { stack: [panel(), panel()] } },
  };
  const stdout = preflight(spec);
  const named = stdout.match(/CRITERIA_NOT_ON_SHEETS/g) || [];
  assert.equal(named.length, 2);
  assert.match(stdout, /Greater Depth - zones\.a\.stack\[0\]: CRITERIA_NOT_ON_SHEETS.*one held on its own in a slot is still measured/);
  assert.doesNotMatch(stdout, /Infinity|NaN/);
});

test("a fault that is not about page fit still refuses everything", () => {
  // The guard that matters most. Omitting is allowed to rescue a pack from a
  // page that is too small; it may never rescue one from a sheet that would
  // quietly drop a line the child needed, because that is the "looks finished"
  // failure this engine exists to refuse.
  const spec = specWithOneUnfittable();
  spec.sheets.greaterDepth = fittingSheet("Write a number between −5 and −1.");
  spec.answerKey.greaterDepth = [];

  const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);
  assert.doesNotMatch(stdout, /SHEET_OMITTED/);
  assert.deepEqual(files, []);
});
