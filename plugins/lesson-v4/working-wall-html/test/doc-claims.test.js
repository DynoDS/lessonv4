"use strict";

// DOCUMENT CLAIMS ABOUT THE WALL, PINNED.
//
// The truth sweep of 1 August 2026 found the wall documents quoting an
// engine that had moved: a 72pt readability floor the builder never had (the
// real autofit runs 80pt down to a 36pt floor), a "240-320pt" banner range
// that only holds for short words, and primitive lists two names short of
// the registry. These tests hold the re-measured numbers to the engine, so
// the next change fails here and the documents get re-measured rather than
// trusted.
//
// The documents quoting these numbers:
//   agents/working-wall-designer.md          the 36pt floor, the primitive and
//                                            card-type lists
//   references/working-wall-preferences.md   the 36pt floor, the banner point
//                                            sizes by word length
//   references/working-wall-visual-language.md  the primitive list

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const style = require("../style.json");
const { fitTitleSize } = require("../src/layout.js");
const { VISUAL_KEY_FNS } = require("../src/visuals.js");

const refDir = path.join(__dirname, "..", "..", "references");
const agentsDir = path.join(__dirname, "..", "..", "agents");
const read = (p) => fs.readFileSync(p, "utf8");

test("the body autofit runs from 80pt down to a 36pt floor", () => {
  assert.equal(style.sizes.a3BodyPt, 80, "A3 body start size moved");
  assert.equal(
    style.sizes.a3BodyMinPt,
    36,
    "the A3 body floor moved - the designer agent and working-wall-preferences.md quote 36pt"
  );
});

test("banner type shrinks with word length as preferences.md describes", () => {
  const fit = (word) => fitTitleSize(word, 320, "A3", "landscape", style);
  assert.ok(fit("Maths") >= 260, `a five-letter word fits at ${fit("Maths")}pt, docs say 260pt or more`);
  const nine = fit("Fractions");
  assert.ok(
    Math.abs(nine - 200) <= 24,
    `a nine-letter word fits at ${nine}pt - preferences.md's shrink ladder assumed about 200`
  );
  const fifteen = fit("Multiplication!");
  assert.ok(
    Math.abs(fifteen - 120) <= 16,
    `a fifteen-letter word fits at ${fifteen}pt - preferences.md says it drops to about 120`
  );
});

test("every live wall primitive is named in both designer-facing documents", () => {
  const designer = read(path.join(agentsDir, "working-wall-designer.md"));
  const visualLanguage = read(path.join(refDir, "working-wall-visual-language.md"));
  for (const key of Object.keys(VISUAL_KEY_FNS)) {
    assert.ok(
      designer.includes(key),
      `working-wall-designer.md never names the live primitive "${key}" - a designer cannot use what it has not been told exists`
    );
    assert.ok(
      visualLanguage.includes(key),
      `working-wall-visual-language.md never names the live primitive "${key}"`
    );
  }
});

test("more than two teaching cards is refused, furniture uncounted", async () => {
  const os = require("node:os");
  const { build } = require("../build.js");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wall-cap-"));
  const card = (type) => ({ type, page: { size: "A3", orientation: "landscape" }, title: "T", fact: "F" });
  const spec = { topic: "Cap Test", cards: [card("stickyKnowledge"), card("stickyKnowledge"), card("stickyKnowledge"), card("banner")] };
  const specPath = path.join(dir, "working-wall.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));
  await assert.rejects(
    () => build(specPath, dir),
    /3 teaching cards/,
    "three teaching cards should be refused - the designer's contract is 0-2"
  );
});

test("a vocab-chip card past 12 chips is refused, not silently clipped", async () => {
  const os = require("node:os");
  const { build } = require("../build.js");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wall-chips-"));
  const chips = Array.from({ length: 14 }, (_, i) => ({ word: `word${i}` }));
  const spec = {
    topic: "Chips Test",
    cards: [{ type: "vocabChips", page: { size: "A3", orientation: "landscape" }, chips }],
  };
  const specPath = path.join(dir, "working-wall.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));
  await assert.rejects(
    () => build(specPath, dir),
    /14 chips/,
    "fourteen chips used to print as twelve with two missing - it must refuse instead"
  );
});

test("every live card type is named in the designer agent", () => {
  const src = read(path.join(__dirname, "..", "build.js"));
  const block = src.match(/const RENDERERS = \{([\s\S]*?)\n\};/);
  assert.ok(block, "build.js no longer has a RENDERERS map this guard can read");
  const types = [...block[1].matchAll(/^\s*([A-Za-z]+):/gm)].map((m) => m[1]);
  assert.ok(types.length >= 15, `only ${types.length} card types parsed from build.js`);
  const designer = read(path.join(agentsDir, "working-wall-designer.md"));
  for (const t of types) {
    assert.ok(
      designer.includes(t),
      `working-wall-designer.md never names the live card type "${t}"`
    );
  }
});
