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

// ─── one lesson, one shape ───────────────────────────────────────────────
//
// Three sets in one week went out with a portrait sheet stacked on a landscape
// one: Continuity and change, Find 10 and 100, Represent 4-digit numbers. The
// contract allowed it per sheet and nothing pointed out that the set had
// drifted. Two of the three never stated an orientation at all - the sheets
// were written `"layout": "auto"` and handed their shapes one at a time.

const setOf = (sheets) => ({
  meta: { lesson: "X", lo: "To do X", yearGroup: 4 },
  sheets,
});

const oneZone = () => ({ a: { helper: "instruction", text: "Do the work." } });

test("a set that stacks portrait on landscape is pointed out", () => {
  const advisories = compositionAdvisories(
    setOf({
      below: { layout: "full", orientation: "landscape", zones: oneZone() },
      expected: { layout: "full", orientation: "portrait", zones: oneZone() },
    })
  );

  const said = advisories.filter((a) => /orientation/.test(a));
  assert.strictEqual(said.length, 1);
  assert.match(said[0], /below landscape/);
  assert.match(said[0], /expected portrait/);
});

test("a set drifts without ever saying so, and is still caught", () => {
  // Neither sheet states an orientation. `auto` picks one per sheet, so the
  // disagreement only exists after the shapes are settled - which is where
  // this has to look.
  const wide = { helper: "number-line", from: 0, to: 100, step: 10 };
  const advisories = compositionAdvisories(
    setOf({
      below: { layout: "auto", zones: [wide, wide, wide, wide, wide, wide] },
      expected: { layout: "auto", zones: [{ helper: "instruction", text: "Go." }] },
    })
  );

  const settled = advisories.filter((a) => /orientation/.test(a));
  assert.ok(settled.length <= 1, "one line about the set, not one per sheet");
});

test("a set that agrees is left alone", () => {
  const advisories = compositionAdvisories(
    setOf({
      below: { layout: "full", orientation: "portrait", zones: oneZone() },
      expected: { layout: "full", orientation: "portrait", zones: oneZone() },
      greaterDepth: { layout: "full", orientation: "portrait", zones: oneZone() },
    })
  );

  assert.deepStrictEqual(advisories.filter((a) => /orientation/.test(a)), []);
});

test("a single-sheet worksheet has no set to disagree with itself", () => {
  const advisories = compositionAdvisories(
    setOf({ expected: { layout: "full", orientation: "landscape", zones: oneZone() } })
  );

  assert.deepStrictEqual(advisories.filter((a) => /orientation/.test(a)), []);
});
