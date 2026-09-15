"use strict";

// The drawings are a large shared asset set, and where they live has now failed
// in two different ways worth keeping tests against.
//
// First they were copied into the package. That put 135,610 files into the
// history of the repository people install from, and git history is for ever:
// long after the files were deleted again, every install still downloaded about
// 290 MB of them. So the package must carry the index and no drawings, and a
// test says so, because the cost of the mistake is invisible in the folder that
// makes it.
//
// Then the resolver was pointed at one particular checkout in one particular
// home directory. That worked on the machine it was written on and nowhere
// else, and it failed silently: every optional picture went quietly missing for
// the whole run, and nothing said why. So no path under the user's home is
// consulted by convention any more, and a test says that too.

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const zlib = require("node:zlib");
const test = require("node:test");

const PACKAGE = path.join(__dirname, "..");
const SCRIPT = path.join(PACKAGE, "scripts", "publish-educational-svg.js");
const SEARCH = path.join(PACKAGE, "scripts", "search-educational-svg.js");
const INDEX = path.join(PACKAGE, "educational-svg", "index.txt.gz");

const ROOT_VARIABLE = "LESSON_EDUCATIONAL_SVG_ROOT";
const CACHE_VARIABLE = "LESSON_EDUCATIONAL_SVG_CACHE";
const OFFLINE_VARIABLE = "LESSON_EDUCATIONAL_SVG_OFFLINE";

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg>';

function scratch(label) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `lr-educational-svg-${label}-`));
}

// Every run is sealed off from this machine's own cache and login, so a test
// never passes because the developer happened to have drawings already.
function sealed({ configured, cache, home, offline = true } = {}) {
  const env = { ...process.env };
  delete env[ROOT_VARIABLE];
  delete env.GITHUB_TOKEN;
  delete env.GH_TOKEN;
  if (configured !== undefined) env[ROOT_VARIABLE] = configured;
  env[CACHE_VARIABLE] = cache || scratch("cache");
  env[OFFLINE_VARIABLE] = offline ? "1" : "0";
  const stand = home || scratch("home");
  env.USERPROFILE = stand;
  env.HOME = stand;
  return env;
}

function run(script, args, env) {
  return execFileSync(process.execPath, [script, ...args], { encoding: "utf8", env }).trim();
}

function makeLocalLibrary(dir, { withDrawings = true } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  if (withDrawings) {
    const leaf = path.join(dir, "library", "standard", "ba");
    fs.mkdirSync(leaf, { recursive: true });
    fs.writeFileSync(path.join(leaf, "banana.svg"), SVG);
  }
  return dir;
}

test("the package ships the index and not one drawing of the library", () => {
  // The whole point of the split. A library folder here means the download is
  // heavy again, and nothing else in the suite would notice.
  assert.ok(fs.existsSync(INDEX), "the drawing index must ship with the package");
  assert.ok(
    !fs.existsSync(path.join(PACKAGE, "educational-svg", "library")),
    "the drawings must not be copied into the package"
  );

  const shipped = fs.readdirSync(path.join(PACKAGE, "educational-svg"));
  assert.deepEqual(shipped, ["index.txt.gz"]);

  const bytes = fs.statSync(INDEX).size;
  assert.ok(bytes < 4 * 1024 * 1024, `the index should stay small, got ${bytes} bytes`);
});

test("the index really lists the whole library", () => {
  const ids = zlib
    .gunzipSync(fs.readFileSync(INDEX))
    .toString("utf8")
    .split("\n")
    .filter(Boolean);

  assert.ok(ids.length > 100000, `expected the full library, got ${ids.length} drawings`);
  assert.equal(new Set(ids).size, ids.length, "the index must not repeat a drawing");

  const shape = /^(?:standard|cartoon|solid)\/[a-z0-9]{2}\/[a-z0-9]+(?:-[a-z0-9]+)*\.svg$/;
  for (const id of ids) {
    // A path the publisher would refuse is worse in the index than absent from
    // it: it ranks, gets chosen, and fails at the one point where the picture
    // was supposed to arrive.
    assert.ok(shape.test(id), `index holds a path the publisher would refuse: ${id}`);
  }
});

test("no path under the user's home is consulted by convention", () => {
  // The exact failure that sent every install looking at one person's checkout.
  const home = scratch("home");
  const abandoned = makeLocalLibrary(path.join(home, "Projects", "lessonv4", "educational-svg"));
  const output = run(SCRIPT, ["--resolve-root"], sealed({ home }));

  assert.match(output, /^EDUCATIONAL_SVG_UNAVAILABLE:/);
  assert.ok(!output.includes(abandoned), "a home-directory checkout must not be searched for");
});

test("a configured local copy is used, and never the network", () => {
  const library = makeLocalLibrary(path.join(scratch("local"), "drawings"));
  const output = run(SCRIPT, ["--resolve-root"], sealed({ configured: library }));

  assert.ok(output.startsWith(`EDUCATIONAL_SVG_ROOT=${library}`));
  assert.match(output, new RegExp(`EDUCATIONAL_SVG_SOURCE: \\$${ROOT_VARIABLE}`));
});

test("a configured folder holding no drawings falls through rather than stopping", () => {
  const broken = makeLocalLibrary(path.join(scratch("broken"), "empty"), { withDrawings: false });
  const output = run(SCRIPT, ["--resolve-root"], sealed({ configured: broken }));

  assert.match(output, /^EDUCATIONAL_SVG_UNAVAILABLE:/);
  assert.ok(output.includes(broken), "the folder that was tried should be named");
});

test("drawings already fetched are a working library with no network at all", () => {
  // The offline case that matters: a machine that has used the library before
  // keeps every drawing it has, rather than reporting the whole layer off.
  const cache = scratch("warm");
  makeLocalLibrary(cache);
  const output = run(SCRIPT, ["--resolve-root"], sealed({ cache }));

  assert.ok(output.startsWith(`EDUCATIONAL_SVG_ROOT=${cache}`));
  assert.match(output, /EDUCATIONAL_SVG_SOURCE: .*fetched as needed/);
});

test("an empty cache with nothing reachable is reported as unavailable, and says why", () => {
  const output = run(SCRIPT, ["--resolve-root"], sealed({}));

  assert.match(output, /^EDUCATIONAL_SVG_UNAVAILABLE:/);
  assert.match(output, /could not be reached/);
});

test("searching ranks from the index with no drawings on this machine", () => {
  // Search quality cannot depend on what has been fetched, or a fresh install
  // would quietly search a nearly empty library and find nothing.
  const printed = run(
    SEARCH,
    ["--query", "lit candle", "--limit", "5", "--no-fetch"],
    sealed({})
  );
  const line = printed
    .split("\n")
    .find((entry) => entry.startsWith("EDUCATIONAL_SVG_SEARCH:"));
  assert.ok(line, "an index search should still run with no drawings present");

  const payload = JSON.parse(line.slice("EDUCATIONAL_SVG_SEARCH:".length));
  assert.equal(payload.available, true);
  assert.ok(payload.candidates.length > 0);
  assert.equal(payload.candidates[0].libraryId.endsWith("/candle-lit.svg"), true);
});

test("a drawing that could not be brought over is not offered as a candidate", () => {
  // Offering a path that is not there would put an unresolvable drawing into a
  // specification, or let a designer claim it rejected one it never saw. The
  // library here is genuinely available - one drawing is already cached - so
  // this is about the individual drawing, not about the library being off.
  const cache = scratch("partial");
  const leaf = path.join(cache, "library", "standard", "ca");
  fs.mkdirSync(leaf, { recursive: true });
  fs.writeFileSync(path.join(leaf, "candle-lit.svg"), SVG);

  const printed = run(SEARCH, ["--query", "lit candle", "--limit", "5"], sealed({ cache }));
  const line = printed
    .split("\n")
    .find((entry) => entry.startsWith("EDUCATIONAL_SVG_SEARCH:"));
  const payload = JSON.parse(line.slice("EDUCATIONAL_SVG_SEARCH:".length));

  assert.deepEqual(
    payload.candidates.map((entry) => entry.libraryId),
    ["standard/ca/candle-lit.svg"],
    "only the drawing that is actually here should be offered"
  );
  assert.ok(payload.unavailable.length > 0, "and the ones that are not say so");
  assert.match(printed, /EDUCATIONAL_SVG_NOT_FETCHED: /);

  for (const candidate of payload.candidates) {
    assert.ok(fs.existsSync(candidate.sourcePath), "every candidate path must be a real file");
  }
});

test("publishing takes its library from the configured local copy", () => {
  const library = makeLocalLibrary(path.join(scratch("publish"), "drawings"));
  const candidate = path.join(library, "library", "standard", "ba", "banana.svg");

  const previous = process.env[ROOT_VARIABLE];
  process.env[ROOT_VARIABLE] = library;
  try {
    delete require.cache[require.resolve("../scripts/publish-educational-svg")];
    const { publishEducationalSvgAsset } = require("../scripts/publish-educational-svg");
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFgAI/ScL+EwAAAABJRU5ErkJggg==",
      "base64"
    );
    const result = publishEducationalSvgAsset(candidate, scratch("work"), "banana", {
      rasterize: (_source, output) => fs.writeFileSync(output, png),
    });
    assert.equal(result.educationalSvgId, "standard/ba/banana.svg");
    assert.equal(result.educationalSvgSlug, "banana");
  } finally {
    if (previous === undefined) delete process.env[ROOT_VARIABLE];
    else process.env[ROOT_VARIABLE] = previous;
    delete require.cache[require.resolve("../scripts/publish-educational-svg")];
  }
});

test("a drawing that is not there is named plainly, not as a path error", () => {
  const library = makeLocalLibrary(path.join(scratch("missing"), "drawings"));
  const missing = path.join(library, "library", "standard", "ro", "robin.svg");

  const previous = process.env[ROOT_VARIABLE];
  process.env[ROOT_VARIABLE] = library;
  try {
    delete require.cache[require.resolve("../scripts/publish-educational-svg")];
    const { publishEducationalSvgAsset } = require("../scripts/publish-educational-svg");
    assert.throws(
      () => publishEducationalSvgAsset(missing, scratch("work"), "robin", { rasterize: () => {} }),
      /Educational SVG drawing does not exist/
    );
  } finally {
    if (previous === undefined) delete process.env[ROOT_VARIABLE];
    else process.env[ROOT_VARIABLE] = previous;
    delete require.cache[require.resolve("../scripts/publish-educational-svg")];
  }
});

test("the reference sends designers to the resolver and the packaged search", () => {
  const reference = fs.readFileSync(
    path.join(PACKAGE, "references", "context-pictures.md"),
    "utf8"
  );
  assert.ok(reference.includes("--resolve-root"));
  assert.ok(reference.includes("[PLUGIN_ROOT]/scripts/search-educational-svg.js"));
  assert.ok(!reference.includes("[EDUCATIONAL_SVG_ROOT]/search.js"));
  assert.ok(!reference.includes("[PLUGIN_ROOT]/educational-svg/search.js"));
  // The promise that stopped being true when the drawings moved out.
  assert.ok(!reference.includes("does not search the computer or use the network"));
});

test("a machine that reaches the internet through a proxy fetches through it", async () => {
  // Cloud runs sit behind an HTTPS_PROXY that git and Python follow on their
  // own and Node does not. Before this, the clone and the photo fetchers worked
  // on such a machine while every drawing request went nowhere, and the run
  // said only that the library "could not be reached".
  const http = require("node:http");
  const library = require("../shared/educational-svg-library");
  const tunnels = [];
  const proxy = http.createServer();
  proxy.on("connect", (request, socket) => {
    tunnels.push(request.url);
    socket.end("HTTP/1.1 403 Forbidden\r\n\r\n");
  });
  await new Promise((resolve) => proxy.listen(0, "127.0.0.1", resolve));
  try {
    const env = sealed({ offline: false });
    env.HTTPS_PROXY = `http://127.0.0.1:${proxy.address().port}`;
    delete env.NO_PROXY;
    delete env.no_proxy;
    const resolved = await library.resolveLibrary({ env });

    assert.equal(resolved.root, null);
    assert.ok(tunnels.includes("raw.githubusercontent.com:443"), "the plain file address goes through the proxy");
    assert.match(resolved.notes.join("\n"), /proxy refused the connection \(HTTP 403\)/);

    env.NO_PROXY = "githubusercontent.com";
    assert.equal(library.proxyFor("https://raw.githubusercontent.com/x", env), null);
    assert.ok(library.proxyFor("https://api.github.com/x", env));
  } finally {
    proxy.close();
  }
});
