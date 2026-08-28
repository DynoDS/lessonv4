"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const { suggestLayouts } = require("../src/suggest");
const { needsContent, measure, renderContent, helperNames, REGISTRY } = require("../src/helpers");
const { LAYOUTS } = require("../src/layouts");
const { VARIANTS } = require("../src/layouts");
const { printableArea, DEFAULT_MARGIN_MM } = require("../src/page");
const { zoneContentMm } = require("../src/render");
const { flatten } = require("../src/layouts");
const EXAMPLES = require("./helper-examples");

// MORE DOCUMENT CLAIMS, PINNED.
//
// photo-costing.test.js pins what a photograph costs. This file pins the other
// measured numbers the truth sweep of 1 August 2026 found quoted in documents
// with nothing holding them to the engine. Each test names the documents that
// quote the number, so when an engine change moves it, the failure lands here
// and the documents get re-measured rather than trusted.
//
// The claims pinned, and where they are quoted:
//   - a picture beside a word is cheap (a photo word bank costs a sliver, not
//     a page)                     agents/lesson-designer.md   "A small picture beside a word is cheap"
//                                 agents/adaptation-designer.md  "a picture-and-word bank are cheap"
//   - six cheap numbered items (coin strips, part-whole money) are an ordinary
//     page; eight are not         the same two documents ("six of those on a page is ordinary")
//   - the numbered photograph-and-list unit is about 148mm across
//                                 references/worksheet-helpers/science.md
//   - about a third of the helpers carry a `text` stem
//                                 references/worksheet-helpers/shared.md
//   - a circuit has three fault states beside working
//                                 references/worksheet-helpers/science.md
//   - blank-surface and method-frame exist, at roughly their quoted sizes
//                                 references/subject-maths.md
//   - a four-column counter chart is about 138mm wide and only about 39mm tall
//                                 references/worksheet-helpers/maths.md
//   - the page is 180x267mm portrait / 267x180mm landscape, a quarters zone is
//     84 x 133.5mm, and numbering a zone costs 9mm of width
//                                 agents/worksheet-designer.md, references/worksheet-helpers.md
//   - the generated catalogue and compositions documents match the engine
//                                 references/worksheet-helpers.md ("never out of date")
//   - check-render draws the four widths the catalogue's preamble claims
//                                 references/worksheet-helpers/catalogue.md (via build-catalogue.js)

const AREA_PORTRAIT = printableArea("portrait", DEFAULT_MARGIN_MM);

const fits = (items) =>
  suggestLayouts(items, { extra: { title: "Doc claims" } }).fits.length > 0;

test("a photo word bank costs a sliver of the page, not a page (lesson-designer, adaptation-designer)", () => {
  const words = ["torch", "leaf", "coin", "map", "jug", "rope", "shell", "drum"];
  const bare = {
    question: true,
    helper: "sort-grid",
    text: "Sort these into the right column.",
    columns: ["Natural", "Made"],
    rows: 4,
    wordBank: words.slice(),
  };
  const pictured = {
    ...bare,
    wordBank: words.map((w) => ({ word: w, imagePath: `photos/${w}.jpg` })),
  };
  const bareMm = measure(bare, 174);
  const picturedMm = measure(pictured, 174);
  const premium = picturedMm - bareMm;
  assert.ok(
    premium >= 0 && premium < 30,
    `eight pictures beside their words cost ${Math.round(premium)}mm over bare words - ` +
      "the documents call this cheap, and past 30mm it is not"
  );
  const writtenAnswers = {
    question: true,
    helper: "written-answers",
    items: [
      { text: "Why does the foil belong there?", lines: 2 },
      { text: "Which was hardest to place?", lines: 2 },
      { text: "Name one more natural material.", lines: 1 },
      { text: "Name one more made material.", lines: 1 },
    ],
  };
  assert.ok(
    fits([pictured, writtenAnswers]),
    "a pictured word bank alongside four written answers should still make a page"
  );
});

test("six cheap numbered items are an ordinary page; eight are not (lesson-designer, adaptation-designer)", () => {
  const coinStrip = () => ({
    question: true,
    helper: "coin-strip",
    text: "How much money is this?",
    coins: ["£2", "£1", "20p", "20p", "10p"],
    answerLine: true,
  });
  const partWhole = () => ({
    question: true,
    helper: "part-whole-money",
    text: "£1.40 + £2.30",
    whole: {},
    parts: [{ label: "£1.40" }, { label: "£2.30" }],
  });
  for (const [name, make] of [["coin-strip", coinStrip], ["part-whole-money", partWhole]]) {
    assert.ok(
      fits(Array.from({ length: 6 }, make)),
      `six ${name} questions should fit a page - the documents call six ordinary`
    );
    assert.ok(
      !fits(Array.from({ length: 8 }, make)),
      `eight ${name} questions should be refused - if they now fit, six is no longer the ceiling's shape`
    );
  }
});

test("the numbered photograph-and-list unit is about 148mm across (science.md)", () => {
  const unit = {
    parts: [1.4, 1],
    row: [
      {
        helper: "label-diagram",
        imageHref: "photo.jpg",
        imageWidth: 800,
        imageHeight: 600,
        labels: Array.from({ length: 4 }, (_, i) => ({
          label: String(i + 1),
          given: true,
          anchor: [i % 2 ? 80 : 20, 10 + i * 17],
        })),
      },
      {
        question: true,
        helper: "questions",
        items: Array.from({ length: 4 }, (_, i) => `Name part ${i + 1}.`),
      },
    ],
  };
  const need = needsContent(unit);
  assert.ok(
    Math.abs(need.minWidthMm - 148) < 10,
    `the numbered unit needs ${Math.round(need.minWidthMm)}mm - science.md says about 148mm`
  );
});

test("about a third of the helpers carry a text stem (shared.md)", () => {
  const marker = "ZZTESTZZ";
  let carriers = 0;
  let total = 0;
  for (const name of helperNames()) {
    const example = EXAMPLES[name];
    if (!example) continue;
    total += 1;
    let html;
    try {
      html = renderContent({ ...example, helper: name, text: marker }, 160);
    } catch (e) {
      continue; // a helper that cannot render in isolation still counts in the total
    }
    if (String(html).includes(marker)) carriers += 1;
  }
  const share = carriers / total;
  assert.ok(
    share > 0.25 && share < 0.45,
    `${carriers} of ${total} helpers print a text stem - shared.md says about a third, ` +
      "and this is no longer near a third"
  );
});

test("a circuit has three fault states beside working (science.md)", () => {
  const one = (state) =>
    String(
      renderContent(
        { helper: "circuit-diagram", circuits: [{ label: "A", state }] },
        120
      )
    );
  const drawings = ["complete", "gap", "no-cell", "switch-open"].map(one);
  for (let i = 0; i < drawings.length; i += 1) {
    for (let j = i + 1; j < drawings.length; j += 1) {
      assert.notEqual(
        drawings[i],
        drawings[j],
        "two circuit states draw the same picture - science.md counts three distinct faults"
      );
    }
  }
});

test("blank-surface and method-frame exist at roughly their quoted sizes (subject-maths.md)", () => {
  assert.ok("blank-surface" in REGISTRY, "blank-surface has left the registry - subject-maths.md says it is built");
  assert.ok("method-frame" in REGISTRY, "method-frame has left the registry - subject-maths.md says it is built");
  const surface = needsContent({ ...EXAMPLES["blank-surface"], helper: "blank-surface" });
  const frame = needsContent({ ...EXAMPLES["method-frame"], helper: "method-frame" });
  assert.ok(Math.abs(surface.minWidthMm - 100) < 15, `blank-surface minimum width is ${surface.minWidthMm}mm`);
  assert.ok(Math.abs(frame.minWidthMm - 95) < 15, `method-frame minimum width is ${frame.minWidthMm}mm`);
});

test("a four-column counter chart is wide and shallow (maths.md)", () => {
  const spec = {
    helper: "place-value-counter-chart",
    columns: ["Th", "H", "T", "O"],
    rows: [{ cells: [2, 3, 4, 5] }],
  };
  const need = needsContent(spec);
  assert.ok(
    Math.abs(need.minWidthMm - 138) < 8,
    `a four-column counter chart needs ${Math.round(need.minWidthMm)}mm of width - maths.md says about 138mm`
  );
  const height = measure(spec, need.minWidthMm);
  assert.ok(
    height < 60,
    `it stands ${Math.round(height)}mm - maths.md says it is shallow (about 39mm), not most of a page`
  );
});

test("the page and zone numbers the designer docs quote (worksheet-designer.md, worksheet-helpers.md)", () => {
  assert.deepEqual(
    { w: AREA_PORTRAIT.widthMm, h: AREA_PORTRAIT.heightMm },
    { w: 180, h: 267 },
    "portrait printable area moved - worksheet-designer.md quotes 267mm of height"
  );
  const landscape = printableArea("landscape", DEFAULT_MARGIN_MM);
  assert.deepEqual(
    { w: landscape.widthMm, h: landscape.heightMm },
    { w: 267, h: 180 },
    "landscape printable area moved - worksheet-designer.md quotes 180mm of height"
  );

  const quarters = LAYOUTS.find((l) => l.id === "quarters");
  assert.ok(quarters, "the quarters layout is gone - worksheet-designer.md uses it as its worked example");
  const zone = flatten(quarters.tree)[0];
  const { wMm, hMm } = zoneContentMm(zone, AREA_PORTRAIT);
  assert.ok(
    Math.abs(wMm - 84) < 2 && Math.abs(hMm - 133.5) < 2,
    `a quarters zone is ${wMm}x${hMm}mm - worksheet-designer.md quotes 84mm by 134mm`
  );

  const plain = needsContent({ helper: "questions", items: ["One line."] });
  const numbered = needsContent({ number: 1, helper: "questions", items: ["One line."] });
  assert.equal(
    numbered.minWidthMm - plain.minWidthMm,
    9,
    "the question-number gutter is no longer 9mm - worksheet-designer.md explains the width cost with it"
  );
});

test("the generated catalogue and compositions documents match the engine (worksheet-helpers.md)", () => {
  const refDir = path.join(__dirname, "..", "..", "references");
  const catalogue = fs.readFileSync(path.join(refDir, "worksheet-helpers", "catalogue.md"), "utf8");
  const names = helperNames();
  for (const name of names) {
    assert.ok(
      catalogue.includes("#### `" + name + "`"),
      `catalogue.md has no entry for ${name} - run npm run catalogue`
    );
  }
  assert.ok(
    catalogue.includes(`The ${names.length} helpers`),
    `catalogue.md's own count is not ${names.length} - run npm run catalogue`
  );

  const compositions = fs.readFileSync(path.join(refDir, "worksheet-compositions.md"), "utf8");
  assert.ok(
    compositions.includes(`${LAYOUTS.length} shapes and ${VARIANTS.length} variants`),
    `worksheet-compositions.md does not say "${LAYOUTS.length} shapes and ${VARIANTS.length} variants" - run npm run layouts`
  );
});

test("a written-out year group is read correctly, and garbage is refused (worksheet-helpers.md: 1 to 6)", () => {
  const { parseYearGroup, phaseFor } = require("../src/worksheet");
  assert.equal(parseYearGroup(4), 4);
  assert.equal(parseYearGroup("4"), 4);
  assert.equal(parseYearGroup("Year 4"), 4, '"Year 4" used to be silently measured as Years 1 to 3');
  assert.equal(phaseFor("Year 6"), "upper");
  assert.equal(parseYearGroup(null), null, "a missing year group still takes the taller-line fallback");
  for (const bad of ["reception", 7, "Y9", "four"]) {
    assert.throws(
      () => parseYearGroup(bad),
      /yearGroup must be/,
      `${JSON.stringify(bad)} should be refused, not measured on a guessed line height`
    );
  }
});

test("check-render draws the four widths the catalogue's preamble claims", () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "scripts", "check-render.js"), "utf8");
  const block = src.match(/const CASES = \[([\s\S]*?)\n\];/);
  assert.ok(block, "check-render.js no longer has a CASES list this guard can read");
  const cases = (block[1].match(/name:/g) || []).length;
  const generator = fs.readFileSync(path.join(__dirname, "..", "scripts", "build-catalogue.js"), "utf8");
  assert.ok(
    cases === 4 && generator.includes("four widths"),
    `check-render has ${cases} width cases while the catalogue preamble says "four widths" - ` +
      "change both together (build-catalogue.js, then npm run catalogue)"
  );
});
