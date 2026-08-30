"use strict";

// The class's own sheet going missing quietly.
//
// SHEET_DIRECTED_MISSING covers Below and Greater Depth because adaptation.md
// names them. Nothing covered Expected. So on 30 August 2026 a re-run whose
// Expected content genuinely would not fit an A4 side returned a PAGE_PLAN_GAP
// note, produced a spec holding only a Below sheet, and passed preflight - and
// nothing downstream reads that note, so the run would have delivered a lesson
// pack with no worksheet for most of the class.
//
// The gap itself is legitimate. Dropping the sheet on a note is not.

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const CHECK = path.join(__dirname, "..", "scripts", "check-worksheet.js");

function sheet() {
  return {
    layout: "full",
    orientation: "portrait",
    zones: {
      a: {
        stack: [
          { helper: "questions", question: true, items: ["Name one appliance."] },
        ],
      },
    },
  };
}

function run({ design, sheets, notes }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "expected-sheet-"));
  const designPath = path.join(dir, "lesson-design.json");
  if (design) fs.writeFileSync(designPath, JSON.stringify(design));

  const spec = {
    meta: {
      lesson: "Test",
      yearGroup: 4,
      subject: "science",
      lessonDesignPath: designPath,
    },
    sheets,
    answerKey: Object.fromEntries(
      Object.keys(sheets).map((key) => [key, [{ question: 1, answer: "A torch." }]])
    ),
  };
  if (notes) spec.notes = notes;

  const specPath = path.join(dir, "worksheet.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const result = spawnSync("node", [CHECK, specPath], { encoding: "utf8" });
  return { code: result.status, stdout: result.stdout };
}

const GENERATED = { worksheet: { status: "generated", resourceMode: "per-child" } };

test("a generated worksheet with no Expected sheet fails, even with a gap note", () => {
  const result = run({
    design: GENERATED,
    sheets: { below: sheet() },
    notes: ["PAGE_PLAN_GAP: Expected - the protected set does not fit one A4 side."],
  });
  assert.strictEqual(result.code, 1, result.stdout);
  assert.ok(result.stdout.includes("EXPECTED_SHEET_MISSING"), result.stdout);
  // The reasoning is carried back, so the owner is not asked to rediscover it.
  assert.ok(result.stdout.includes("does not fit one A4 side"), result.stdout);
});

test("the failure also names the case where no note explains the absence", () => {
  const result = run({ design: GENERATED, sheets: { below: sheet() } });
  assert.strictEqual(result.code, 1);
  assert.ok(result.stdout.includes("nothing records why"), result.stdout);
});

test("a spec carrying its Expected sheet passes", () => {
  const result = run({ design: GENERATED, sheets: { expected: sheet() } });
  assert.strictEqual(result.code, 0, result.stdout);
  assert.ok(result.stdout.includes("WORKSHEET_PREFLIGHT_OK"), result.stdout);
});

test("a teacher-provided worksheet is not required to generate an Expected sheet", () => {
  // The supplied sheet IS the Expected resource, and it lives outside this spec.
  const result = run({
    design: { worksheet: { status: "provided-by-teacher", resourceMode: "per-child" } },
    sheets: { below: sheet() },
  });
  assert.strictEqual(result.code, 0, result.stdout);
});

test("an unreadable lesson design warns rather than inventing a verdict", () => {
  const result = run({ design: null, sheets: { below: sheet() } });
  assert.strictEqual(result.code, 0, result.stdout);
});

test("a spec with no lessonDesignPath is left alone", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "expected-sheet-"));
  const specPath = path.join(dir, "worksheet.json");
  fs.writeFileSync(
    specPath,
    JSON.stringify({
      meta: { lesson: "Test", yearGroup: 4, subject: "science" },
      sheets: { below: sheet() },
      answerKey: { below: [{ question: 1, answer: "A torch." }] },
    })
  );
  const result = spawnSync("node", [CHECK, specPath], { encoding: "utf8" });
  assert.strictEqual(result.status, 0, result.stdout);
});
