const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { build, buildHtml, renderMoments } = require("../build");

test("build writes a PDF or fallback HTML when items exist", async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "stickin-"));
  const result = await build(path.join(__dirname, "fixtures/two-moments.json"), out);
  assert.ok(result && fs.existsSync(result));
  assert.match(path.basename(result), /To identify angles - Stick-in Sheets\.(pdf|html)$/);
});

test("each cut-out in a multi-piece pack is stamped with its question handle", async () => {
  // The whole point of the pack: once a tile is cut free of the page, only what
  // is printed ON it says which question it is. So every tile must carry its
  // handle, and two pieces must not share one — here a designer `tag` keeps the
  // two "(a)" reflections (one straight, one diagonal) apart.
  const fixture = path.join(__dirname, "fixtures/tagged-pair.json");
  const spec = JSON.parse(fs.readFileSync(fixture, "utf8"));
  const { moments, dropped } = await renderMoments(spec.items, path.dirname(fixture));
  assert.deepStrictEqual(dropped, []);
  const { html } = buildHtml(moments, spec.classSize || 32);
  assert.ok(html.includes("Straight a"), "expected the 'Straight a' handle stamped in the pack");
  assert.ok(html.includes("Diagonal a"), "expected the 'Diagonal a' handle stamped in the pack");
});

test("build writes nothing and returns null when items is empty", async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "stickin-"));
  const result = await build(path.join(__dirname, "fixtures/empty.json"), out);
  assert.strictEqual(result, null);
  assert.strictEqual(fs.readdirSync(out).length, 0);
});

// ─── A pack that came out short must say so ──────────────────────────────
//
// A moment that cannot be drawn is skipped so it never tiles a page of blank
// copies, which is right. What was wrong is that the build then wrote the pack,
// printed "print once, cut along the dashed lines", and exited 0. A missing
// moment leaves NO gap on the page (unlike a missing slide, which at least
// leaves a blank slide), so the short pack looks finished. The teacher finds out
// when a child has nothing to glue in.
//
// build() signals the shortfall by setting process.exitCode, so each test here
// saves and restores it. Without that the whole `node --test` process inherits
// the 1 and the run reports failure even when every test passed.
async function buildCapturingExitCode(fixture, out) {
  const before = process.exitCode;
  process.exitCode = 0;
  try {
    const result = await build(path.join(__dirname, fixture), out);
    return { result, exitCode: process.exitCode };
  } finally {
    process.exitCode = before;
  }
}

test("a pack missing one of its moments names it and does not report success", async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "stickin-"));
  const { result, exitCode } = await buildCapturingExitCode("fixtures/short-pack.json", out);

  // The partial pack is still written, deliberately: it is how you see which
  // moments did work, the same reasoning the slide builder uses.
  assert.ok(result && fs.existsSync(result), "the partial pack should still be written");
  assert.notStrictEqual(exitCode, 0, "a short pack reported success, so nothing downstream would stop");
});

test("every moment failing is told apart from a lesson that had none", async () => {
  // These two outcomes both end with no file, and they used to print nearly the
  // same line and both exit 0, so a total failure wore the face of the quiet,
  // legitimate "this lesson had no write-on moments" case this builder uses
  // silence to mean.
  const outNone = fs.mkdtempSync(path.join(os.tmpdir(), "stickin-"));
  const none = await buildCapturingExitCode("fixtures/none-drawable.json", outNone);
  assert.strictEqual(none.result, null);
  assert.strictEqual(fs.readdirSync(outNone).length, 0, "nothing should be written when nothing drew");
  assert.notStrictEqual(none.exitCode, 0, "items were asked for and none drew, so this is a failure");

  const outEmpty = fs.mkdtempSync(path.join(os.tmpdir(), "stickin-"));
  const empty = await buildCapturingExitCode("fixtures/empty.json", outEmpty);
  assert.strictEqual(empty.result, null);
  assert.strictEqual(empty.exitCode, 0, "an empty spec is a real, quiet outcome and must stay a success");
});

test("a pack with every moment drawn still reports success", async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "stickin-"));
  const { result, exitCode } = await buildCapturingExitCode("fixtures/two-moments.json", out);
  assert.ok(result && fs.existsSync(result));
  assert.strictEqual(exitCode, 0, "a complete pack must not be reported as a failure");
});
