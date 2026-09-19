"use strict";

// One repair round, three missing pictures.
//
// A Year 4 Below sheet named three adaptation photographs that had never been
// sourced. The build reported the first, the focused repair removed it, the
// rebuild reported the second, and the run's one allowed repair was already
// spent: no worksheet and no answer key went home that night.
//
// Every one of those faults existed at the first build. Only the reporting made
// them arrive one at a time, so the repair could never catch up with them.
// Missing pictures are now named together, by sheet and zone, in one failure.

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const BUILD = path.join(__dirname, "..", "scripts", "build-worksheet.js");
const CHECK = path.join(__dirname, "..", "scripts", "check-worksheet.js");

const MISSING = [
  "generated/adaptation-mains-desk-fan-uk-plug.png",
  "generated/adaptation-battery-torch-open-compartment.png",
  "generated/adaptation-cordless-vacuum-battery-and-uk-charger.png",
];

function specNaming(imagePaths) {
  return {
    meta: { lesson: "Electrical appliances", yearGroup: 4, subject: "science" },
    sheets: {
      below: {
        recording: "sheet",
        recordingReason: "Q1: the child writes on the printed page.",
        layout: "full",
        orientation: "portrait",
        zones: {
          a: {
            stack: [
              { helper: "instruction", text: "Sort each appliance." },
              {
                helper: "card-row",
                columns: imagePaths.length,
                cards: imagePaths.map((imagePath) => ({ imagePath })),
              },
              {
                helper: "questions",
                question: true,
                items: ["Which of these use mains electricity?"],
              },
            ],
          },
        },
      },
    },
    answerKey: { below: [{ question: 1, answer: "The desk fan." }] },
  };
}

function run(script, imagePaths) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "missing-pictures-"));
  const specPath = path.join(dir, "worksheet.json");
  fs.writeFileSync(specPath, JSON.stringify(specNaming(imagePaths)));
  const args =
    script === BUILD ? [script, specPath, path.join(dir, "out")] : [script, specPath];
  const result = spawnSync("node", args, { encoding: "utf8" });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

function namedIn(output) {
  return MISSING.filter((imagePath) => output.includes(path.basename(imagePath)));
}

test("the build names every picture the spec cannot have, not just the first", () => {
  const result = run(BUILD, MISSING);
  assert.strictEqual(result.code, 1);
  assert.deepStrictEqual(namedIn(result.stdout), MISSING);
});

test("each missing picture is placed by sheet and zone", () => {
  const result = run(BUILD, MISSING);
  const diagnostics = result.stdout
    .split("\n")
    .filter((line) => line.startsWith("BUILD_DIAGNOSTIC:"))
    .map((line) => JSON.parse(line.slice("BUILD_DIAGNOSTIC:".length)));
  assert.strictEqual(diagnostics.length, MISSING.length);
  for (const entry of diagnostics) {
    assert.strictEqual(entry.signal, "IMAGE_MISSING");
    assert.strictEqual(entry.location.sheet, "below");
    assert.strictEqual(entry.location.zone, "a");
  }
  assert.deepStrictEqual(
    diagnostics.map((entry) => entry.location.imagePath),
    MISSING
  );
});

test("preflight also names them all, so the fault never reaches the build", () => {
  const result = run(CHECK, MISSING);
  assert.strictEqual(result.code, 1);
  assert.deepStrictEqual(namedIn(result.stdout), MISSING);
});

test("a spec whose pictures are all present still builds", () => {
  // Discrimination: collecting instead of throwing must not turn a clean spec
  // into a reported fault, and must not let one through either.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "present-pictures-"));
  fs.mkdirSync(path.join(dir, "generated"), { recursive: true });
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
  for (const imagePath of MISSING) fs.writeFileSync(path.join(dir, imagePath), png);
  const specPath = path.join(dir, "worksheet.json");
  fs.writeFileSync(specPath, JSON.stringify(specNaming(MISSING)));
  const result = spawnSync("node", [CHECK, specPath], { encoding: "utf8" });
  assert.strictEqual(result.status, 0, result.stdout + result.stderr);
  assert.ok(!result.stdout.includes("IMAGE_MISSING"), result.stdout);
});
