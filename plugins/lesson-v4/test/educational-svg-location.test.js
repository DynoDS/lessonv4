"use strict";

// The drawings are a large shared asset set, so a working copy routinely sits
// outside the package while a published install carries its own. The location
// was fixed to the package folder, which meant a copy one directory away read as
// "the library is not installed" and every optional picture went quietly missing
// for the whole run, with nothing saying why. These tests hold the resolver that
// replaced the assumption, and the failure it has to keep reporting honestly.

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const SCRIPT = path.join(__dirname, "..", "scripts", "publish-educational-svg.js");
const VARIABLE = "LESSON_EDUCATIONAL_SVG_ROOT";

function resolveRoot(configured) {
  const env = { ...process.env };
  if (configured === undefined) delete env[VARIABLE];
  else env[VARIABLE] = configured;
  return execFileSync(process.execPath, [SCRIPT, "--resolve-root"], {
    encoding: "utf8",
    env,
  }).trim();
}

function makeLibrary({ withSearch = true, withLibrary = true } = {}) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "lr-educational-svg-home-"));
  if (withSearch) fs.writeFileSync(path.join(home, "search.js"), "// stand-in\n");
  if (withLibrary) {
    fs.mkdirSync(path.join(home, "library", "standard", "ba"), { recursive: true });
  }
  return home;
}

test("a library outside the package is found when its location is set", () => {
  const home = makeLibrary();
  assert.equal(resolveRoot(home), `EDUCATIONAL_SVG_ROOT=${home}`);
});

test("an unset location falls back to the copy the package would ship", () => {
  const output = resolveRoot(undefined);
  assert.match(output, /^(EDUCATIONAL_SVG_ROOT=|EDUCATIONAL_SVG_UNAVAILABLE)/);
  if (output.startsWith("EDUCATIONAL_SVG_ROOT=")) {
    const home = output.slice("EDUCATIONAL_SVG_ROOT=".length);
    assert.equal(path.basename(home), "educational-svg");
  }
});

test("a location pointing nowhere reports unavailable rather than half-working", () => {
  const output = resolveRoot(path.join(os.tmpdir(), "lr-educational-svg-absent"));
  assert.match(output, /^EDUCATIONAL_SVG_UNAVAILABLE:/);
});

test("a folder holding search.js but no drawings is not a usable library", () => {
  const home = makeLibrary({ withLibrary: false });
  assert.match(resolveRoot(home), /^EDUCATIONAL_SVG_UNAVAILABLE:/);
});

test("a folder of drawings with no search script is not a usable library", () => {
  const home = makeLibrary({ withSearch: false });
  assert.match(resolveRoot(home), /^EDUCATIONAL_SVG_UNAVAILABLE:/);
});

test("the unavailable line names the folder that was actually looked in", () => {
  const absent = path.join(os.tmpdir(), "lr-educational-svg-named");
  assert.ok(resolveRoot(absent).includes(absent));
});

test("publishing takes its library from the configured location", () => {
  const home = makeLibrary();
  const candidate = path.join(home, "library", "standard", "ba", "banana.svg");
  fs.writeFileSync(
    candidate,
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg>'
  );

  const previous = process.env[VARIABLE];
  process.env[VARIABLE] = home;
  try {
    delete require.cache[require.resolve("../scripts/publish-educational-svg")];
    const { publishEducationalSvgAsset } = require("../scripts/publish-educational-svg");
    const workingDir = fs.mkdtempSync(path.join(os.tmpdir(), "lr-educational-svg-work-"));
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFgAI/ScL+EwAAAABJRU5ErkJggg==",
      "base64"
    );
    const result = publishEducationalSvgAsset(candidate, workingDir, "banana", {
      rasterize: (_source, output) => fs.writeFileSync(output, png),
    });
    assert.equal(result.educationalSvgId, "standard/ba/banana.svg");
    assert.equal(result.educationalSvgSlug, "banana");
  } finally {
    if (previous === undefined) delete process.env[VARIABLE];
    else process.env[VARIABLE] = previous;
    delete require.cache[require.resolve("../scripts/publish-educational-svg")];
  }
});

test("the reference tells designers to resolve the folder, never to assume it", () => {
  const reference = fs.readFileSync(
    path.join(__dirname, "..", "references", "context-pictures.md"),
    "utf8"
  );
  assert.ok(reference.includes("--resolve-root"));
  assert.ok(reference.includes("[EDUCATIONAL_SVG_ROOT]/search.js"));
  assert.ok(!reference.includes("[PLUGIN_ROOT]/educational-svg/search.js"));
});
