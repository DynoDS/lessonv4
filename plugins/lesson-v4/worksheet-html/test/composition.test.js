"use strict";

// The Electrical Appliances sheet of 30 August 2026: the designer transcribed
// the design's pupilAction, pupilPrompt and support as three stacked
// instruction helpers saying overlapping things, the page fitted and rendered
// legally, and a child got a wall of near-identical directions. Composition
// advisories now surface that shape at preflight, while the spec is still the
// designer's to change - reporting, never refusing, in the tightness.js
// tradition.

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const { compositionAdvisories } = require("../src/composition");

const CHECK = path.join(__dirname, "..", "scripts", "check-worksheet.js");

function instruction(text) {
  return { helper: "instruction", text };
}

function sheetWith(zoneContent) {
  return {
    meta: { lesson: "Test", yearGroup: "Year 4", subject: "Science" },
    sheets: {
      expected: {
        layout: "full",
        orientation: "portrait",
        zones: { a: zoneContent },
      },
    },
  };
}

test("three consecutive instruction helpers raise one advisory", () => {
  const spec = sheetWith({
    stack: [
      instruction("Use each clue to complete one row of the table."),
      instruction("For each object, write whether it is electrical."),
      instruction("Use the reference above to help you."),
      { helper: "recording-table", columns: ["a", "b"], rows: [["x", null]] },
    ],
  });
  const advisories = compositionAdvisories(spec);
  assert.strictEqual(advisories.length, 1);
  assert.ok(/3 instruction helpers in a row/.test(advisories[0]), advisories[0]);
  assert.ok(advisories[0].includes('zone "a"'), advisories[0]);
});

test("two consecutive instructions are left alone", () => {
  const spec = sheetWith({
    stack: [
      instruction("Use this to help you with question 1."),
      instruction("Complete one row per object."),
      { helper: "questions", items: ["What is it?"] },
    ],
  });
  assert.deepStrictEqual(compositionAdvisories(spec), []);
});

test("instructions separated by content are separate runs", () => {
  const spec = sheetWith({
    stack: [
      instruction("First."),
      instruction("Second."),
      { helper: "questions", items: ["Q"] },
      instruction("Third."),
      instruction("Fourth."),
    ],
  });
  assert.deepStrictEqual(compositionAdvisories(spec), []);
});

test("a sprawl inside a nested stack is still found", () => {
  const spec = sheetWith({
    question: true,
    stack: [
      {
        stack: [
          instruction("One."),
          instruction("Two."),
          instruction("Three."),
        ],
      },
    ],
  });
  assert.strictEqual(compositionAdvisories(spec).length, 1);
});

test("a malformed spec raises no advisories rather than throwing", () => {
  assert.deepStrictEqual(compositionAdvisories(null), []);
  assert.deepStrictEqual(compositionAdvisories({ sheets: { expected: null } }), []);
  assert.deepStrictEqual(
    compositionAdvisories({ sheets: { expected: { zones: { a: { stack: "not-an-array" } } } } }),
    []
  );
});

test("check-worksheet.js prints the advisory without blocking on it", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "composition-"));
  const spec = sheetWith({
    question: true,
    stack: [
      instruction("Use each clue to complete one row."),
      instruction("For each object, write what makes it work."),
      instruction("Use the reference above."),
      {
        helper: "questions",
        items: ["Which object is electrical?"],
      },
    ],
  });
  spec.answerKey = { expected: [{ question: 1, answer: "The toaster." }] };
  const specPath = path.join(dir, "worksheet.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));

  const result = spawnSync("node", [CHECK, specPath], { encoding: "utf8" });
  assert.ok(
    result.stderr.includes("[composition]"),
    `expected a [composition] warning on stderr, got: ${result.stderr}`
  );
  // The advisory itself must never be the reason a spec fails preflight: any
  // failure printed on stdout must be a real named signal, not composition.
  assert.ok(
    !result.stdout.includes("[composition]"),
    `advisory leaked onto stdout: ${result.stdout}`
  );
});
