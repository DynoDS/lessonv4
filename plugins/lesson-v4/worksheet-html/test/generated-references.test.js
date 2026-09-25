"use strict";

// The two references the designer reads that the engine writes -
// `references/worksheet-helpers/catalogue.md` and
// `references/worksheet-compositions.md` - must be exactly what their
// generators write today. The compositions reference quoted every zone height
// up to six millimetres short for two weeks after the title band went, and
// nothing noticed until the worksheets release (4.2.290) regenerated it; its
// first check then put the stale heights back and every test still passed.
// `--check` writes nothing and says whether the file matches.

const { test } = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

for (const [script, reference] of [
  ["build-catalogue.js", "catalogue.md"],
  ["build-layouts-doc.js", "worksheet-compositions.md"],
]) {
  test(`${reference} is what ${script} writes today`, () => {
    const result = spawnSync("node", [path.join(__dirname, "..", "scripts", script), "--check"], {
      encoding: "utf8",
    });
    assert.strictEqual(result.status, 0, result.stdout + result.stderr);
    assert.ok(result.stdout.includes(`GENERATED_MATCHES: ${reference}`), result.stdout);
  });
}
