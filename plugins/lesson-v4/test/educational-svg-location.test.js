"use strict";

// The drawings are a large shared asset set, so a working copy routinely sits
// outside the package while a published install carries its own. The location
// was fixed to the package folder, which meant a copy one directory away read as
// "the library is not installed": every optional picture went quietly missing
// for the whole run, and nothing said why.
//
// Making it a setting alone would not have been enough. A setting nobody has
// filled in is exactly as empty as the fixed path was, so the folder is resolved
// in a fixed order and the conventional checkout is one of the places looked in,
// mirroring how verify-plugin-root.py finds a source tree.

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const SCRIPT = path.join(__dirname, "..", "scripts", "publish-educational-svg.js");
const VARIABLE = "LESSON_EDUCATIONAL_SVG_ROOT";
const CONVENTION = ["Projects", "lessonv4", "educational-svg"];

function resolveRoot({ configured, home } = {}) {
  const env = { ...process.env };
  if (configured === undefined) delete env[VARIABLE];
  else env[VARIABLE] = configured;
  if (home !== undefined) {
    env.USERPROFILE = home;
    env.HOME = home;
  }
  return execFileSync(process.execPath, [SCRIPT, "--resolve-root"], {
    encoding: "utf8",
    env,
  }).trim();
}

function makeLibrary(dir, { withSearch = true, withLibrary = true } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  if (withSearch) fs.writeFileSync(path.join(dir, "search.js"), "// stand-in\n");
  if (withLibrary) {
    fs.mkdirSync(path.join(dir, "library", "standard", "ba"), { recursive: true });
  }
  return dir;
}

function scratch() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "lr-educational-svg-"));
}

function emptyHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "lr-educational-svg-home-"));
}

test("a library outside the package is found when its location is set", () => {
  const home = makeLibrary(path.join(scratch(), "drawings"));
  const output = resolveRoot({ configured: home, home: emptyHome() });
  assert.ok(output.startsWith(`EDUCATIONAL_SVG_ROOT=${home}`));
  assert.match(output, new RegExp(`EDUCATIONAL_SVG_SOURCE: \\$${VARIABLE}`));
});

test("the conventional checkout is found with nothing set at all", () => {
  // The case that matters most: a teacher who never configures anything still
  // gets their drawings, because a setting nobody fills in helps nobody.
  const home = emptyHome();
  const library = makeLibrary(path.join(home, ...CONVENTION));
  const output = resolveRoot({ home });
  assert.ok(output.startsWith(`EDUCATIONAL_SVG_ROOT=${library}`));
  assert.match(output, /EDUCATIONAL_SVG_SOURCE: ~\/Projects\/lessonv4\/educational-svg/);
});

test("an explicit location wins over the conventional one", () => {
  const home = emptyHome();
  makeLibrary(path.join(home, ...CONVENTION));
  const chosen = makeLibrary(path.join(scratch(), "chosen"));
  assert.ok(resolveRoot({ configured: chosen, home }).startsWith(`EDUCATIONAL_SVG_ROOT=${chosen}`));
});

test("a broken location falls through to the next place rather than stopping", () => {
  const home = emptyHome();
  const library = makeLibrary(path.join(home, ...CONVENTION));
  const broken = makeLibrary(path.join(scratch(), "broken"), { withLibrary: false });
  const output = resolveRoot({ configured: broken, home });
  assert.ok(output.startsWith(`EDUCATIONAL_SVG_ROOT=${library}`));
});

test("a folder holding search.js but no drawings is not a usable library", () => {
  const broken = makeLibrary(path.join(scratch(), "broken"), { withLibrary: false });
  assert.match(resolveRoot({ configured: broken, home: emptyHome() }), /^EDUCATIONAL_SVG_UNAVAILABLE:/);
});

test("a folder of drawings with no search script is not a usable library", () => {
  const broken = makeLibrary(path.join(scratch(), "broken"), { withSearch: false });
  assert.match(resolveRoot({ configured: broken, home: emptyHome() }), /^EDUCATIONAL_SVG_UNAVAILABLE:/);
});

test("nothing anywhere reports unavailable and names every place looked in", () => {
  const absent = path.join(scratch(), "absent");
  const home = emptyHome();
  const output = resolveRoot({ configured: absent, home });
  assert.match(output, /^EDUCATIONAL_SVG_UNAVAILABLE:/);
  assert.ok(output.includes(absent));
  assert.ok(output.includes("the running package"));
  assert.ok(output.includes("~/Projects/lessonv4/educational-svg"));
});

test("publishing takes its library from the resolved location", () => {
  const home = makeLibrary(path.join(scratch(), "drawings"));
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
    const workingDir = scratch();
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

test("a drawing that is not there is named plainly, not as a path error", () => {
  const home = makeLibrary(path.join(scratch(), "drawings"));
  const missing = path.join(home, "library", "standard", "ro", "robin.svg");

  const previous = process.env[VARIABLE];
  process.env[VARIABLE] = home;
  try {
    delete require.cache[require.resolve("../scripts/publish-educational-svg")];
    const { publishEducationalSvgAsset } = require("../scripts/publish-educational-svg");
    assert.throws(
      () =>
        publishEducationalSvgAsset(missing, scratch(), "robin", {
          rasterize: () => {},
        }),
      /Educational SVG drawing does not exist/
    );
  } finally {
    if (previous === undefined) delete process.env[VARIABLE];
    else process.env[VARIABLE] = previous;
    delete require.cache[require.resolve("../scripts/publish-educational-svg")];
  }
});
