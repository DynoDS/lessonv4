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
const { answersText } = require("./answer-text");
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
  const keyFile = files.find((f) => f.endsWith(" - Answers.html"));
  const key = keyFile ? answersText(fs.readFileSync(path.join(dir, keyFile), "utf8")) : "";
  fs.rmSync(dir, { recursive: true, force: true });
  return { stdout, files, failed, key };
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

// The worksheets release (4.2.290): a Below or Greater Depth sheet the build
// cannot make at the last resort, for any fault, gets the Expected sheet in its
// place, flagged. The teacher's "yes" (25 September 2026) was for a sheet sent
// back to be redesigned that still cannot be fixed; the lead passed it on for
// any sheet the build cannot make. The exceptions: an Expected sheet the page
// cannot hold is omitted, one the browser finds clipped refuses the pack, and
// then nothing stands in.
const unfittableNamedLayout = () => ({
  layout: "full",
  orientation: "portrait",
  zones: { a: unfittableSheet().zones[0] },
});

const EXPECTED_ANSWER = "−6, −2, 0, 1";
const timesInKey = (key) => key.split(EXPECTED_ANSWER).length - 1;

for (const [how, greaterDepth] of [
  ["left to the engine", unfittableSheet],
  ["in a named layout", unfittableNamedLayout],
]) {
  test(`with the flag, the Expected sheet stands in for a Greater Depth sheet the page cannot hold (${how})`, () => {
    const spec = specWithOneUnfittable();
    spec.sheets.greaterDepth = greaterDepth();
    const { stdout, files, key } = buildWith(spec, ["--omit-unfittable"]);

    assert.match(
      stdout,
      /^SHEET_STANDS_IN: Greater Depth - the Expected sheet stands in for Greater Depth, .*: the page cannot hold the Greater Depth sheet \(/m
    );
    assert.doesNotMatch(stdout, /SHEET_OMITTED/);
    assert.doesNotMatch(stdout, /BUILD_DIAGNOSTIC: \{"signal":"SHEET_STANDS_IN"/);
    assert.match(stdout, /^Built: .*Omission - Worksheets\.pdf$/m);
    assert.match(stdout, /^Sheets: Expected, Greater Depth$/m);

    // The pupil pack holds a sheet for every tier, and the key covers the
    // Greater Depth tier with the Expected answers and says why.
    assert.ok(files.includes("Omission - Worksheets.pdf"));
    assert.ok(files.some((f) => /greaterDepth\.html$/.test(f)));
    assert.match(key, /The Expected sheet stands in here for the Greater Depth sheet, which the page could not hold\./);
    assert.equal(timesInKey(key), 2);
  });
}

test("an Expected sheet the page cannot hold is still omitted, and nothing stands in for it", () => {
  const spec = specWithOneUnfittable();
  spec.sheets = { below: fittingSheet("Put −3 and 2 in order, smallest first."), expected: unfittableSheet() };
  spec.answerKey = { below: [{ question: 1, answer: "−3, 2" }], expected: [{ question: 1, answer: "Various." }] };
  const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);

  assert.match(stdout, /^SHEET_OMITTED: Expected - /m);
  assert.match(stdout, /SHEET_OMITTED_SUMMARY: delivered below; omitted expected/);
  assert.doesNotMatch(stdout, /SHEET_STANDS_IN/);
  assert.ok(files.some((f) => /below\.html$/.test(f)));
  assert.ok(!files.some((f) => /expected\.html$/.test(f)));
});

for (const [how, unfittable] of [
  ["left to the engine", unfittableSheet],
  ["in a named layout", unfittableNamedLayout],
]) {
  test(`when the Expected sheet cannot fit either, a Below sheet the page cannot hold is omitted, not stood in for (${how})`, () => {
    const spec = specWithOneUnfittable();
    spec.sheets = {
      below: unfittable(),
      expected: unfittable(),
      greaterDepth: fittingSheet("Write a number between −5 and −1."),
    };
    spec.answerKey = {
      below: [{ question: 1, answer: "Various." }],
      expected: [{ question: 1, answer: "Various." }],
      greaterDepth: [{ question: 1, answer: "−3" }],
    };
    const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);

    assert.doesNotMatch(stdout, /SHEET_STANDS_IN/);
    assert.match(stdout, /SHEET_OMITTED_SUMMARY: delivered greaterDepth; omitted below, expected/);
    assert.ok(files.some((f) => /greaterDepth\.html$/.test(f)));
  });
}

test("an Expected sheet in a named layout the page cannot hold, beside a Greater Depth sheet too tall: no stand-in is announced", () => {
  // The second check's mixed case: the Expected sheet is measured the same way
  // before any stand-in is decided, so none is announced and then dropped.
  const spec = specWithOneUnfittable();
  spec.sheets = {
    below: fittingSheet("Put −3 and 2 in order, smallest first."),
    expected: unfittableNamedLayout(),
    greaterDepth: unfittableSheet(),
  };
  spec.answerKey = {
    below: [{ question: 1, answer: "−3, 2" }],
    expected: [{ question: 1, answer: "Various." }],
    greaterDepth: [{ question: 1, answer: "Various." }],
  };
  const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);

  assert.doesNotMatch(stdout, /SHEET_STANDS_IN/);
  assert.match(stdout, /^SHEET_OMITTED: Greater Depth - /m);
  assert.match(stdout, /^SHEET_OMITTED: Expected - /m);
  assert.ok(files.some((f) => /below\.html$/.test(f)));
});

test("a Below sheet with a word bank typed into its question gets the Expected sheet at the last resort, and still refuses without it", () => {
  const spec = specWithOneUnfittable();
  spec.sheets = {
    below: fittingSheet("Word bank: less, more. Which is less, −3 or 2?"),
    expected: spec.sheets.expected,
  };
  spec.answerKey = { below: [{ question: 1, answer: "−3" }], expected: spec.answerKey.expected };

  const plain = buildWith(spec);
  assert.match(plain.stdout, /WORD_BANK_INLINE/);
  assert.deepEqual(plain.files, []);

  const { stdout, files, key } = buildWith(spec, ["--omit-unfittable"]);
  assert.match(stdout, /^SHEET_STANDS_IN: Below - .*: the Below sheet cannot be built \(WORD_BANK_INLINE/m);
  assert.ok(files.includes("Omission - Worksheets.pdf"));
  assert.match(key, /The Expected sheet stands in here for the Below sheet, which could not be built\./);
  assert.equal(timesInKey(key), 2);
});

test("a Below sheet whose picture cannot be read gets the Expected sheet at the last resort", () => {
  const spec = specWithOneUnfittable();
  spec.sheets = {
    below: {
      layout: "full",
      orientation: "portrait",
      zones: {
        a: {
          stack: [
            { helper: "card-row", columns: 1, cards: [{ imagePath: "photos/never-arrived.png" }] },
            { question: true, helper: "questions", items: ["Which number is shown?"] },
          ],
        },
      },
    },
    expected: spec.sheets.expected,
  };
  spec.answerKey = { below: [{ question: 1, answer: "−3" }], expected: spec.answerKey.expected };

  const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);
  assert.match(stdout, /^SHEET_STANDS_IN: Below - .*: the Below sheet cannot be built \(IMAGE_MISSING/m);
  assert.doesNotMatch(stdout, /^IMAGE_MISSING/m);
  assert.ok(files.includes("Omission - Worksheets.pdf"));
});

test("a Below sheet the browser finds clipped gets the Expected sheet at the last resort", () => {
  // Every zone passes the arithmetic, and the drawn page does not: a word too
  // long for its table cell pushes the table wider than the page.
  const spec = specWithOneUnfittable();
  spec.sheets = {
    below: {
      layout: "full",
      orientation: "portrait",
      zones: {
        a: {
          question: true,
          helper: "data-table",
          caption: "Use the table.",
          rows: [["Name", "W".repeat(260)], ["b", "c"]],
        },
      },
    },
    expected: spec.sheets.expected,
  };
  spec.answerKey = { below: [{ question: 1, answer: "b" }], expected: spec.answerKey.expected };

  const plain = buildWith(spec);
  assert.match(plain.stdout, /^SHEET_DOES_NOT_FIT: Below page 1/m);

  const { stdout, files, key } = buildWith(spec, ["--omit-unfittable"]);
  if (/^PDF_SKIPPED/m.test(stdout)) return; // no browser, so nothing is measured
  assert.match(stdout, /^SHEET_STANDS_IN: Below - .*: the page cannot hold the Below sheet \(rendered content/m);
  assert.doesNotMatch(stdout, /^SHEET_DOES_NOT_FIT/m);
  assert.ok(files.includes("Omission - Worksheets.pdf"));
  assert.match(key, /The Expected sheet stands in here for the Below sheet, which the page could not hold\./);
});

test("an Expected sheet with a fault other than page fit still refuses the pack at the last resort", () => {
  const spec = specWithOneUnfittable();
  spec.sheets = {
    below: fittingSheet("Put −3 and 2 in order, smallest first."),
    expected: fittingSheet("Word bank: less, more. Which is less, −6 or 1?"),
  };
  spec.answerKey = { below: [{ question: 1, answer: "−3, 2" }], expected: [{ question: 1, answer: "−6" }] };
  const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);
  assert.match(stdout, /WORD_BANK_INLINE/);
  assert.doesNotMatch(stdout, /SHEET_STANDS_IN/);
  assert.deepEqual(files, []);
});

test("when the Expected sheet cannot fit, a Below sheet with another fault still refuses the pack: nothing can stand in", () => {
  // The one exception, and what follows from it: the Expected sheet is
  // measured before anything stands in, and a copy of a sheet the page cannot
  // hold is no stand-in.
  const spec = specWithOneUnfittable();
  spec.sheets = {
    below: fittingSheet("Word bank: less, more. Which is less, −3 or 2?"),
    expected: unfittableSheet(),
    greaterDepth: fittingSheet("Write a number between −5 and −1."),
  };
  spec.answerKey = {
    below: [{ question: 1, answer: "−3" }],
    expected: [{ question: 1, answer: "Various." }],
    greaterDepth: [{ question: 1, answer: "−3" }],
  };
  const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);
  assert.doesNotMatch(stdout, /SHEET_STANDS_IN/);
  assert.match(stdout, /WORD_BANK_INLINE/);
  assert.deepEqual(files, []);
});

test("a returned Below sheet with the Expected sheet omitted at the last resort: nothing is announced and then dropped", () => {
  // The third check's E7: the guard that names a stand-in only once the pack
  // is built, in the one mix that needs it. Below is named for its own reason,
  // never with the Expected sheet's measurement as if it were its own.
  const spec = specWithOneUnfittable();
  spec.sheets = {
    expected: unfittableSheet(),
    greaterDepth: fittingSheet("Write a number between −5 and −1."),
  };
  spec.answerKey = {
    expected: [{ question: 1, answer: "Various." }],
    greaterDepth: [{ question: 1, answer: "−3" }],
  };
  spec.notes = ["WORKSHEET_CONTENT_GAP: Below - question 2 cannot be answered as printed; return to adaptation designer."];
  spec.returned = [{ sheet: "below", problem: "teaching" }];
  const { stdout, files, key } = buildWith(spec, ["--omit-unfittable"]);

  assert.doesNotMatch(stdout, /SHEET_STANDS_IN/);
  assert.match(
    stdout,
    /^SHEET_OMITTED: Below - the Below sheet could not be used as printed \(a problem a child could not get past as printed.*\), and the Expected sheet cannot stand in for it: the page cannot hold the Expected sheet either/m
  );
  assert.match(stdout, /^SHEET_OMITTED: Expected - /m);
  assert.ok(files.some((f) => /greaterDepth\.html$/.test(f)));
  assert.doesNotMatch(key, /stands in/);
});

test("an Expected sheet the browser finds clipped refuses the whole pack, names the tier it stood in for, and leaves no answer key", () => {
  // As on 4.2.289, an Expected sheet the browser finds clipped refuses the pack.
  // A Below sheet it stood in for is named as that, with Below's own reason, and
  // the key written before the pages were drawn is taken away.
  const spec = specWithOneUnfittable();
  spec.sheets = {
    below: unfittableSheet(),
    expected: {
      layout: "full",
      orientation: "portrait",
      zones: {
        a: {
          question: true,
          helper: "data-table",
          caption: "Use the table.",
          rows: [["Name", "W".repeat(260)], ["b", "c"]],
        },
      },
    },
  };
  spec.answerKey = { below: [{ question: 1, answer: "Various." }], expected: [{ question: 1, answer: "b" }] };
  const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);
  if (/^PDF_SKIPPED/m.test(stdout)) return; // no browser, so nothing is measured
  assert.match(stdout, /^SHEET_DOES_NOT_FIT: Expected page 1/m);
  assert.match(stdout, /^SHEET_DOES_NOT_FIT: Below page 1 zone "a" \(the Expected sheet, standing in because the page cannot hold the Below sheet/m);
  assert.doesNotMatch(stdout, /SHEET_STANDS_IN/);
  assert.ok(!files.some((f) => / - Answers\.(pdf|html)$/.test(f)), files.join(", "));
  assert.ok(!files.some((f) => f.endsWith(".pdf")), files.join(", "));
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

  // Without the flag the panel refuses the pack. At the last resort (the
  // worksheets release, 4.2.290) the sheet carrying it cannot be made, so the
  // Expected sheet stands in for it: the panel is still never printed, and no
  // sheet is omitted for the room it took.
  const plain = buildWith(spec);
  assert.match(plain.stdout, /Greater Depth - zones\[1\]: CRITERIA_NOT_ON_SHEETS/);
  assert.deepEqual(plain.files, []);

  const { stdout, files } = buildWith(spec, ["--omit-unfittable"]);
  assert.match(stdout, /^SHEET_STANDS_IN: Greater Depth - .*cannot be built \(CRITERIA_NOT_ON_SHEETS: zones\[1\]/m);
  assert.doesNotMatch(stdout, /SHEET_OMITTED/);
  assert.ok(files.includes("Omission - Worksheets.pdf"));
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

test("a fault that is not about page fit never prints the faulty sheet", () => {
  // The guard that matters most. Omitting is allowed to rescue a pack from a
  // page that is too small; it may never rescue one from a sheet that would
  // quietly drop a line the child needed, because that is the "looks finished"
  // failure this engine exists to refuse. Since the worksheets release
  // (4.2.290) a Below or Greater Depth sheet with such a fault gets the
  // Expected sheet in its place at the last resort, so it is still never
  // printed; the same fault on the Expected sheet still refuses everything.
  const spec = specWithOneUnfittable();
  spec.sheets.greaterDepth = fittingSheet("Write a number between −5 and −1.");
  spec.answerKey.greaterDepth = [];

  const { stdout, files, key } = buildWith(spec, ["--omit-unfittable"]);
  assert.doesNotMatch(stdout, /SHEET_OMITTED/);
  assert.match(stdout, /^SHEET_STANDS_IN: Greater Depth - .*cannot be built \(ANSWER_KEY_MISSING/m);
  assert.ok(files.includes("Omission - Worksheets.pdf"));
  assert.equal(timesInKey(key), 2);

  const broken = specWithOneUnfittable();
  broken.sheets.greaterDepth = fittingSheet("Write a number between −5 and −1.");
  broken.answerKey.greaterDepth = [{ question: 1, answer: "−3" }];
  broken.answerKey.expected = [];
  const refused = buildWith(broken, ["--omit-unfittable"]);
  assert.doesNotMatch(refused.stdout, /SHEET_OMITTED|SHEET_STANDS_IN/);
  assert.deepEqual(refused.files, []);
});
