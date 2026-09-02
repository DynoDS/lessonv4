"use strict";

// A wall's real capacity - the characters a table cell holds at its column
// width, the inches a panel of items needs at the 36pt readable floor - is only
// reachable by drawing the pages, so the designer could not check its own card
// and found out by handing the spec to the builder and reading the failure back.
// Two consecutive lessons lost a designer-and-builder round trip that way: a
// Year 4 PSHE agreement table 75 characters long where 74 fit, and a Year 4
// maths worked example 0.1in over its panel at 36pt. `--validate-only` runs the
// same checks and writes nothing, so the designer pays one command instead.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const { build } = require("../build");

function scratchDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "working-wall-validate-only-"));
}

function writeSpec(dir, spec) {
  const file = path.join(dir, "working-wall.json");
  fs.writeFileSync(file, JSON.stringify(spec, null, 2));
  return file;
}

function capture(run) {
  const lines = [];
  const original = console.log;
  console.log = (...args) => lines.push(args.map(String).join(" "));
  return Promise.resolve()
    .then(run)
    .finally(() => {
      console.log = original;
    })
    .then((value) => ({ value, lines }));
}

test("validate-only reports a good wall and writes no file", async () => {
  const specPath = path.join(__dirname, "..", "test-fixtures-a3", "section-headings.json");
  const outDir = scratchDir();

  const { value, lines } = await capture(() =>
    build(specPath, outDir, { validateOnly: true })
  );

  assert.strictEqual(value, null, "validate-only returns no output path");
  assert.ok(
    lines.some((line) => /^WORKING_WALL_LAYOUT_OK: /.test(line)),
    `expected WORKING_WALL_LAYOUT_OK, got:\n${lines.join("\n")}`
  );
  assert.deepStrictEqual(
    fs.readdirSync(outDir),
    [],
    "validate-only must not write a PDF or an HTML fallback"
  );
});

test("validate-only fails an overlong cell with the budget it has to meet", async () => {
  // A reference table cell one character over what its column holds: the exact
  // shape of the PSHE failure, and the message has to name the budget so the
  // repair is a cut to a number rather than a guess.
  const dir = scratchDir();
  const specPath = writeSpec(dir, {
    topic: "Our PSHE rules",
    yearGroup: "Year 4",
    lessonSlug: "our-pshe-rules",
    rationaleNote: "The agreement children look back at.",
    cards: [
      {
        type: "referenceTable",
        title: "Our agreement",
        page: { size: "A3", orientation: "landscape" },
        columns: ["Rule", "What it means"],
        rows: [
          [
            "Safe rules",
            "Everyone has a choice about personal sharing and nobody is ever put on the spot to answer a question about themselves in front of the whole class."
          ]
        ]
      }
    ]
  });

  await assert.rejects(
    () => build(specPath, dir, { validateOnly: true }),
    (error) => {
      assert.match(error.message, /Layout validation failed/);
      assert.match(error.message, /characters/);
      return true;
    }
  );
});
