"use strict";

// The sequencing trap, from the other end.
//
// Adaptation photographs are sourced only AFTER worksheet.json names them,
// because promotion reads the spec to decide which provisional entries are
// worth sourcing. But preflight resolved every imagePath off disk, so a Below
// sheet that correctly named its approved filenames could not pass its own
// gate. The designer's honest options were then to omit the sheet - at which
// point promotion found nothing to source and the pictures never arrived -
// which is exactly how a Below sheet was lost on 30 August 2026.
//
// A missing file is now only a fault when the spec invented the path.

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const CHECK = path.join(__dirname, "..", "scripts", "check-worksheet.js");

// A deliberately small spec, so the only thing these tests can fail on is the
// picture. Borrowing a real fixture made them fail on its page fit instead.
function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pending-pictures-"));
  const spec = {
    meta: { lesson: "Pending picture", yearGroup: 4, subject: "geography" },
    sheets: {
      expected: {
        layout: "full",
        orientation: "portrait",
        zones: {
          a: {
            stack: [
              { helper: "instruction", text: "Use this photograph." },
              {
                helper: "card-row",
                columns: 1,
                cards: [{ imagePath: "ai/river-meander.png" }],
              },
              {
                helper: "questions",
                question: true,
                items: ["What feature does the photograph show?"],
              },
            ],
          },
        },
      },
    },
    answerKey: { expected: [{ question: 1, answer: "A meander." }] },
  };
  return { dir, spec };
}

function run(dir, spec, contract) {
  const specPath = path.join(dir, "worksheet.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const args = [CHECK, specPath];
  if (contract) {
    const contractPath = path.join(dir, "contract.json");
    fs.writeFileSync(contractPath, JSON.stringify(contract));
    args.push("--photo-requirements", contractPath);
  }
  const result = spawnSync("node", args, { encoding: "utf8" });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

test("an approved picture that has not been published yet does not fail preflight", () => {
  const { dir, spec } = setup();
  const result = run(dir, spec, {
    photos: [{ id: "adaptation-photo-001", filename: "ai/river-meander.png" }],
  });
  assert.strictEqual(result.code, 0, result.stdout + result.stderr);
  assert.ok(result.stdout.includes("WORKSHEET_PREFLIGHT_OK"), result.stdout);
  assert.ok(
    result.stderr.includes("[pending-picture]"),
    `the pending picture must still be reported: ${result.stderr}`
  );
});

test("a path no contract approved still fails loudly", () => {
  const { dir, spec } = setup();
  const result = run(dir, spec, {
    photos: [{ id: "adaptation-photo-001", filename: "ai/a-different-picture.png" }],
  });
  assert.strictEqual(result.code, 1);
  assert.ok(result.stdout.includes("IMAGE_MISSING"), result.stdout);
});

test("with no contract supplied nothing counts as approved", () => {
  const { dir, spec } = setup();
  const result = run(dir, spec, null);
  assert.strictEqual(result.code, 1);
  assert.ok(result.stdout.includes("IMAGE_MISSING"), result.stdout);
});

test("a picture that IS on disk is read normally, not stood in for", () => {
  const { dir, spec } = setup();
  // A real 1x1 PNG at the named path.
  fs.mkdirSync(path.join(dir, "ai"), { recursive: true });
  fs.writeFileSync(
    path.join(dir, "ai", "river-meander.png"),
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    )
  );
  const result = run(dir, spec, {
    photos: [{ id: "adaptation-photo-001", filename: "ai/river-meander.png" }],
  });
  assert.strictEqual(result.code, 0, result.stdout + result.stderr);
  assert.ok(
    !result.stderr.includes("[pending-picture]"),
    `a picture on disk must not be reported as pending: ${result.stderr}`
  );
});
