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
// A heading line, with the newline on each side that makes it a heading.
const NL = String.fromCharCode(10);
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const style = require("../style.json");
const { fitTitleSize } = require("../src/layout.js");
const { VISUAL_KEY_FNS } = require("../src/visuals.js");

const refDir = path.join(__dirname, "..", "..", "references");
const agentsDir = path.join(__dirname, "..", "..", "agents");
// A Windows checkout gives these files CRLF line endings, and a heading search
// written with a bare newline then finds nothing; read them the same everywhere.
const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");

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
  // The contracts file is what the designer reads: working-wall-packet.py cuts
  // its `### <primitive>` sections into the designer's reference packet.
  const contracts = read(path.join(refDir, "working-wall-card-contracts.md"));
  const visualLanguage = read(path.join(refDir, "working-wall-visual-language.md"));
  for (const key of Object.keys(VISUAL_KEY_FNS)) {
    assert.ok(
      contracts.includes(NL + "### " + key + NL),
      `working-wall-card-contracts.md has no "### ${key}" section - a designer cannot use what it has not been told exists`
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

// A Year 4 PSHE wall was lost twice to body text a few characters over the
// two-line cap. The refusal named no card, no item and no target, so the one
// permitted repair was a guess, and the designer had never been told a
// character budget at all - only that the builder shrinks to 36pt. These two
// tests hold the measured budgets to the renderer and keep the refusal aimed.
function wallDir(prefix) {
  const os = require("node:os");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(dir, "photos"));
  fs.copyFileSync(
    path.join(__dirname, "..", "test-fixtures-a3", "photos", "pizza.jpg"),
    path.join(dir, "photos", "pizza.jpg")
  );
  return dir;
}

async function itemOfLengthBuilds(dir, length, withPicture) {
  const { build } = require("../build.js");
  const card = {
    type: "stickyKnowledge",
    page: { size: "A3", orientation: "landscape" },
    title: "Remember",
    items: [{ text: "x ".repeat(120).slice(0, length).trim() }],
  };
  if (withPicture) card.photo = "photos/pizza.jpg";
  const specPath = path.join(dir, "working-wall.json");
  fs.writeFileSync(specPath, JSON.stringify({ topic: "Budget", cards: [card] }));
  const warn = console.warn;
  const log = console.log;
  console.warn = () => {};
  console.log = () => {};
  try {
    await build(specPath, dir);
    return true;
  } catch (err) {
    return false;
  } finally {
    console.warn = warn;
    console.log = log;
  }
}

test("the per-item character budgets the designer documents are the real ones", async () => {
  const dir = wallDir("wall-budget-");
  assert.equal(await itemOfLengthBuilds(dir, 62, true), true, "a 62-character item on a picture card should build");
  assert.equal(await itemOfLengthBuilds(dir, 63, true), false, "63 characters should be one over the picture-card budget");
  assert.equal(await itemOfLengthBuilds(dir, 106, false), true, "a 106-character item on a full-width card should build");
  assert.equal(await itemOfLengthBuilds(dir, 107, false), false, "107 characters should be one over the full-width budget");
  for (const doc of [
    path.join(agentsDir, "working-wall-designer.md"),
    path.join(refDir, "working-wall-preferences.md"),
  ]) {
    const text = read(doc);
    assert.ok(text.includes("62 characters"), `${path.basename(doc)} no longer quotes the 62-character budget`);
    assert.ok(text.includes("106 characters"), `${path.basename(doc)} no longer quotes the 106-character budget`);
  }
});

test("an over-long body item is refused by name, item and overage", async () => {
  const { build } = require("../build.js");
  const dir = wallDir("wall-diag-");
  // The exact worked-example card that lost the 1 September 2026 wall.
  const spec = {
    topic: "Diagnostic Test",
    cards: [
      {
        type: "workedExample",
        page: { size: "A3", orientation: "landscape" },
        title: "Improve a lunch",
        photo: "photos/pizza.jpg",
        items: [
          { label: "Step 1", text: "Spot the food groups." },
          {
            label: "Worked example",
            text: "Add hummus and peppers: protein for growth; vitamins and minerals.",
          },
        ],
      },
    ],
  };
  const specPath = path.join(dir, "working-wall.json");
  fs.writeFileSync(specPath, JSON.stringify(spec));
  await assert.rejects(
    () => build(specPath, dir),
    (err) => {
      const message = String(err && err.message);
      // Which card, which item, how long it is, and what to cut it to. Without
      // all four the single permitted repair is aimed at nothing, which is how
      // two runs in a row shipped with no wall at all.
      assert.match(message, /workedExample "Improve a lunch"/, "the refusal must name the card");
      assert.match(message, /item 2 is 82 characters/, "the refusal must name the item and its length");
      assert.match(message, /Cut it to 62 characters or fewer/, "the refusal must name the target");
      return true;
    }
  );
});

test("every live card type is named in the designer agent", () => {
  const src = read(path.join(__dirname, "..", "build.js"));
  const block = src.match(/const RENDERERS = \{([\s\S]*?)\n\};/);
  assert.ok(block, "build.js no longer has a RENDERERS map this guard can read");
  const types = [...block[1].matchAll(/^\s*([A-Za-z]+):/gm)].map((m) => m[1]);
  assert.ok(types.length >= 15, `only ${types.length} card types parsed from build.js`);
  const contracts = read(path.join(refDir, "working-wall-card-contracts.md"));
  for (const t of types) {
    assert.ok(
      contracts.includes(NL + "### " + t + NL),
      `working-wall-card-contracts.md has no "### ${t}" section, so the designer's packet cannot offer it`
    );
  }
});
