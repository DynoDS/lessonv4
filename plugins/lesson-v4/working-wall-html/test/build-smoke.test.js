"use strict";

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const { build } = require("../build");
const { mediaBoxes } = require("./pdf-util");

function scratchDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "working-wall-html-smoke-"));
}

test("builds section-headings.json to a PDF with one page per card", async () => {
  const specPath = path.join(__dirname, "..", "test-fixtures-a3", "section-headings.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const outDir = scratchDir();

  const outPath = await build(specPath, outDir);

  assert.ok(outPath, "build() should return the output path");
  assert.ok(fs.existsSync(outPath), `expected output file to exist at ${outPath}`);
  assert.match(outPath, /\.pdf$/, `expected a PDF; got ${outPath} (no Chrome on this machine?)`);

  const pdf = fs.readFileSync(outPath);
  const boxes = mediaBoxes(pdf);
  assert.strictEqual(boxes.length, spec.cards.length, `expected ${spec.cards.length} pages, found ${boxes.length}`);
});

test("builds single-sticky.json to a PDF with one page per card", async () => {
  const specPath = path.join(__dirname, "..", "test-fixtures-a3", "single-sticky.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const outDir = scratchDir();

  const outPath = await build(specPath, outDir);

  assert.ok(outPath, "build() should return the output path");
  assert.ok(fs.existsSync(outPath), `expected output file to exist at ${outPath}`);
  assert.match(outPath, /\.pdf$/, `expected a PDF; got ${outPath} (no Chrome on this machine?)`);

  const pdf = fs.readFileSync(outPath);
  const boxes = mediaBoxes(pdf);
  assert.strictEqual(boxes.length, spec.cards.length, `expected ${spec.cards.length} pages, found ${boxes.length}`);
});

test("builds sticky-with-photo.json to a PDF with one page per card", async () => {
  const specPath = path.join(__dirname, "..", "test-fixtures-a3", "sticky-with-photo.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const outDir = scratchDir();

  const outPath = await build(specPath, outDir);

  assert.ok(outPath, "build() should return the output path");
  assert.ok(fs.existsSync(outPath), `expected output file to exist at ${outPath}`);
  assert.match(outPath, /\.pdf$/, `expected a PDF; got ${outPath} (no Chrome on this machine?)`);

  const pdf = fs.readFileSync(outPath);
  const boxes = mediaBoxes(pdf);
  assert.strictEqual(boxes.length, spec.cards.length, `expected ${spec.cards.length} pages, found ${boxes.length}`);
});

test("builds single-worked-example.json to a PDF with one page per card", async () => {
  const specPath = path.join(__dirname, "..", "test-fixtures-a3", "single-worked-example.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const outDir = scratchDir();

  const outPath = await build(specPath, outDir);

  assert.ok(outPath, "build() should return the output path");
  assert.ok(fs.existsSync(outPath), `expected output file to exist at ${outPath}`);
  assert.match(outPath, /\.pdf$/, `expected a PDF; got ${outPath} (no Chrome on this machine?)`);

  const pdf = fs.readFileSync(outPath);
  const boxes = mediaBoxes(pdf);
  assert.strictEqual(boxes.length, spec.cards.length, `expected ${spec.cards.length} pages, found ${boxes.length}`);
});

test("builds single-stem.json to a PDF with one page per card", async () => {
  const specPath = path.join(__dirname, "..", "test-fixtures-a3", "single-stem.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const outDir = scratchDir();

  const outPath = await build(specPath, outDir);

  assert.ok(outPath, "build() should return the output path");
  assert.ok(fs.existsSync(outPath), `expected output file to exist at ${outPath}`);
  assert.match(outPath, /\.pdf$/, `expected a PDF; got ${outPath} (no Chrome on this machine?)`);

  const pdf = fs.readFileSync(outPath);
  const boxes = mediaBoxes(pdf);
  assert.strictEqual(boxes.length, spec.cards.length, `expected ${spec.cards.length} pages, found ${boxes.length}`);
});

test("builds paired-stems.json to a PDF with one page per card", async () => {
  const specPath = path.join(__dirname, "..", "test-fixtures-a3", "paired-stems.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const outDir = scratchDir();

  const outPath = await build(specPath, outDir);

  assert.ok(outPath, "build() should return the output path");
  assert.ok(fs.existsSync(outPath), `expected output file to exist at ${outPath}`);
  assert.match(outPath, /\.pdf$/, `expected a PDF; got ${outPath} (no Chrome on this machine?)`);

  const pdf = fs.readFileSync(outPath);
  const boxes = mediaBoxes(pdf);
  assert.strictEqual(boxes.length, spec.cards.length, `expected ${spec.cards.length} pages, found ${boxes.length}`);
});

test("builds single-misconception.json to a PDF with one page per card", async () => {
  const specPath = path.join(__dirname, "..", "test-fixtures-a3", "single-misconception.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const outDir = scratchDir();

  const outPath = await build(specPath, outDir);

  assert.ok(outPath, "build() should return the output path");
  assert.ok(fs.existsSync(outPath), `expected output file to exist at ${outPath}`);
  assert.match(outPath, /\.pdf$/, `expected a PDF; got ${outPath} (no Chrome on this machine?)`);

  const pdf = fs.readFileSync(outPath);
  const boxes = mediaBoxes(pdf);
  assert.strictEqual(boxes.length, spec.cards.length, `expected ${spec.cards.length} pages, found ${boxes.length}`);
});

test("builds vocab-chips.json to a PDF with one page per card", async () => {
  const specPath = path.join(__dirname, "..", "test-fixtures-a3", "vocab-chips.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const outDir = scratchDir();

  const outPath = await build(specPath, outDir);

  assert.ok(outPath, "build() should return the output path");
  assert.ok(fs.existsSync(outPath), `expected output file to exist at ${outPath}`);
  assert.match(outPath, /\.pdf$/, `expected a PDF; got ${outPath} (no Chrome on this machine?)`);

  const pdf = fs.readFileSync(outPath);
  const boxes = mediaBoxes(pdf);
  assert.strictEqual(boxes.length, spec.cards.length, `expected ${spec.cards.length} pages, found ${boxes.length}`);
});

test("builds equivalenceGrid-a3.json to a PDF with one page per card", async () => {
  const specPath = path.join(__dirname, "..", "test-fixtures-a3", "equivalenceGrid-a3.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const outDir = scratchDir();

  const outPath = await build(specPath, outDir);

  assert.ok(outPath, "build() should return the output path");
  assert.ok(fs.existsSync(outPath), `expected output file to exist at ${outPath}`);
  assert.match(outPath, /\.pdf$/, `expected a PDF; got ${outPath} (no Chrome on this machine?)`);

  const pdf = fs.readFileSync(outPath);
  const boxes = mediaBoxes(pdf);
  assert.strictEqual(boxes.length, spec.cards.length, `expected ${spec.cards.length} pages, found ${boxes.length}`);
});

test("builds geom-wall-test.json (referenceTable with diagram cells) to a PDF with one page per card", async () => {
  const specPath = path.join(__dirname, "..", "test-fixtures-a3", "geom-wall-test.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const outDir = scratchDir();

  const outPath = await build(specPath, outDir);

  assert.ok(outPath, "build() should return the output path");
  assert.ok(fs.existsSync(outPath), `expected output file to exist at ${outPath}`);
  assert.match(outPath, /\.pdf$/, `expected a PDF; got ${outPath} (no Chrome on this machine?)`);

  const pdf = fs.readFileSync(outPath);
  const boxes = mediaBoxes(pdf);
  assert.strictEqual(boxes.length, spec.cards.length, `expected ${spec.cards.length} pages, found ${boxes.length}`);
});

test("builds symmetry-wall-test.json (referenceTable with diagram cells) to a PDF with one page per card", async () => {
  const specPath = path.join(__dirname, "..", "test-fixtures-a3", "symmetry-wall-test.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const outDir = scratchDir();

  const outPath = await build(specPath, outDir);

  assert.ok(outPath, "build() should return the output path");
  assert.ok(fs.existsSync(outPath), `expected output file to exist at ${outPath}`);
  assert.match(outPath, /\.pdf$/, `expected a PDF; got ${outPath} (no Chrome on this machine?)`);

  const pdf = fs.readFileSync(outPath);
  const boxes = mediaBoxes(pdf);
  assert.strictEqual(boxes.length, spec.cards.length, `expected ${spec.cards.length} pages, found ${boxes.length}`);
});

test("builds banner.json to a PDF with one page per word", async () => {
  const specPath = path.join(__dirname, "..", "test-fixtures-a3", "banner.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const outDir = scratchDir();

  const outPath = await build(specPath, outDir);

  assert.ok(outPath, "build() should return the output path");
  assert.ok(fs.existsSync(outPath), `expected output file to exist at ${outPath}`);
  assert.match(outPath, /\.pdf$/, `expected a PDF; got ${outPath} (no Chrome on this machine?)`);

  const wordCount = spec.cards[0].words.length;
  const pdf = fs.readFileSync(outPath);
  const boxes = mediaBoxes(pdf);
  assert.strictEqual(boxes.length, wordCount, `expected ${wordCount} pages (one per word), found ${boxes.length}`);
});

test("builds mnemonicPoster-a3.json to a PDF with a summary page plus one page per letter", async () => {
  const specPath = path.join(__dirname, "..", "test-fixtures-a3", "mnemonicPoster-a3.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const outDir = scratchDir();

  const outPath = await build(specPath, outDir);

  assert.ok(outPath, "build() should return the output path");
  assert.ok(fs.existsSync(outPath), `expected output file to exist at ${outPath}`);
  assert.match(outPath, /\.pdf$/, `expected a PDF; got ${outPath} (no Chrome on this machine?)`);

  const expectedPages = 1 + spec.cards[0].items.length;
  const pdf = fs.readFileSync(outPath);
  const boxes = mediaBoxes(pdf);
  assert.strictEqual(boxes.length, expectedPages, `expected ${expectedPages} pages (1 summary + one per letter), found ${boxes.length}`);
});

test("builds line-graph-test.json (labelledDiagram) to a PDF with one page per card", async () => {
  const specPath = path.join(__dirname, "..", "test-fixtures-a3", "line-graph-test.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const outDir = scratchDir();

  const outPath = await build(specPath, outDir);

  assert.ok(outPath, "build() should return the output path");
  assert.ok(fs.existsSync(outPath), `expected output file to exist at ${outPath}`);
  assert.match(outPath, /\.pdf$/, `expected a PDF; got ${outPath} (no Chrome on this machine?)`);

  const pdf = fs.readFileSync(outPath);
  const boxes = mediaBoxes(pdf);
  assert.strictEqual(boxes.length, spec.cards.length, `expected ${spec.cards.length} pages, found ${boxes.length}`);
});

test("builds photoMapOverview-a3.json to a PDF with one page per card", async () => {
  const specPath = path.join(__dirname, "..", "test-fixtures-a3", "photoMapOverview-a3.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const outDir = scratchDir();

  const outPath = await build(specPath, outDir);

  assert.ok(outPath, "build() should return the output path");
  assert.ok(fs.existsSync(outPath), `expected output file to exist at ${outPath}`);
  assert.match(outPath, /\.pdf$/, `expected a PDF; got ${outPath} (no Chrome on this machine?)`);

  const pdf = fs.readFileSync(outPath);
  const boxes = mediaBoxes(pdf);
  assert.strictEqual(boxes.length, spec.cards.length, `expected ${spec.cards.length} pages, found ${boxes.length}`);
});

test("builds heroCallouts-a3.json to a PDF with one page per card", async () => {
  const specPath = path.join(__dirname, "..", "test-fixtures-a3", "heroCallouts-a3.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const outDir = scratchDir();

  const outPath = await build(specPath, outDir);

  assert.ok(outPath, "build() should return the output path");
  assert.ok(fs.existsSync(outPath), `expected output file to exist at ${outPath}`);
  assert.match(outPath, /\.pdf$/, `expected a PDF; got ${outPath} (no Chrome on this machine?)`);

  const pdf = fs.readFileSync(outPath);
  const boxes = mediaBoxes(pdf);
  assert.strictEqual(boxes.length, spec.cards.length, `expected ${spec.cards.length} pages, found ${boxes.length}`);
});

test("builds causeCards-a3.json to a PDF with one page per card", async () => {
  const specPath = path.join(__dirname, "..", "test-fixtures-a3", "causeCards-a3.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const outDir = scratchDir();

  const outPath = await build(specPath, outDir);

  assert.ok(outPath, "build() should return the output path");
  assert.ok(fs.existsSync(outPath), `expected output file to exist at ${outPath}`);
  assert.match(outPath, /\.pdf$/, `expected a PDF; got ${outPath} (no Chrome on this machine?)`);

  const pdf = fs.readFileSync(outPath);
  const boxes = mediaBoxes(pdf);
  assert.strictEqual(boxes.length, spec.cards.length, `expected ${spec.cards.length} pages, found ${boxes.length}`);
});

test("unresolved Working Wall Educational SVG requests are rejected before render", async () => {
  const outDir = scratchDir();
  const specPath = path.join(outDir, "unresolved-educational-svg.json");
  fs.writeFileSync(
    specPath,
    JSON.stringify({
      topic: "Unresolved Educational SVG Test",
      fixtureSweep: true,
      cards: [
        {
          type: "workedExample",
          page: { size: "A3", orientation: "landscape" },
          title: "How to do it",
          items: [{ label: "Step 1", text: "Check the plug." }],
          picture: {
            kind: "educational-svg",
            concept: "electrical plug",
            context: "A recognisable electrical plug.",
            avoid: [],
            fallbackEmoji: "\u{1F50C}",
          },
        },
        {
          type: "vocabDefinition",
          page: { size: "A3", orientation: "landscape" },
          title: "Conductor",
          definition: "A material that lets electricity flow through it.",
          visual: {
            type: "image",
            kind: "educational-svg",
            concept: "wire",
            context: "A simple electrical wire.",
            avoid: [],
            alt: "electrical wire",
          },
        },
        {
          type: "stickyKnowledge",
          page: { size: "A3", orientation: "landscape" },
          title: "Remember",
          items: [{ text: "Keep electrical appliances away from water." }],
          decorations: [
            {
              id: "decoration-plug",
              kind: "educational-svg",
              concept: "plug",
              context: "A small relevant electrical accent.",
              avoid: [],
              frame: { x: 0.78, y: 0.75, width: 0.2, height: 0.2 },
              layer: "high",
              rotation: 0,
              transparency: 20,
            },
          ],
        },
      ],
    })
  );

  await assert.rejects(
    () => build(specPath, outDir),
    /Unresolved Working Wall Educational SVG request\(s\): \/cards\/0\/picture, \/cards\/1\/visual, \/cards\/2\/decorations\/0/
  );
});

test("an incomplete Working Wall emoji picture is rejected before render", async () => {
  const outDir = scratchDir();
  const specPath = path.join(outDir, "incomplete-emoji.json");
  fs.writeFileSync(
    specPath,
    JSON.stringify({
      topic: "Incomplete Emoji Test",
      cards: [
        {
          type: "workedExample",
          page: { size: "A3", orientation: "landscape" },
          title: "How to do it",
          items: [{ label: "Step 1", text: "Check the plug." }],
          picture: { kind: "emoji", value: "\u{1F50C}", alt: "" },
        },
      ],
    })
  );

  await assert.rejects(
    () => build(specPath, outDir),
    /Incomplete Working Wall emoji picture\(s\): \/cards\/0\/picture/
  );
});

test("card-level pictures are rejected on unsupported Working Wall card types", async () => {
  const outDir = scratchDir();
  const specPath = path.join(outDir, "unsupported-card-picture.json");
  fs.writeFileSync(
    specPath,
    JSON.stringify({
      topic: "Unsupported Picture Test",
      cards: [
        {
          type: "sentenceStem",
          page: { size: "A3", orientation: "landscape" },
          title: "How to explain it",
          items: [{ text: "I know this because ___." }],
          picture: {
            kind: "emoji",
            value: "\u{1F4A1}",
            alt: "light bulb",
          },
        },
      ],
    })
  );

  await assert.rejects(
    () => build(specPath, outDir),
    /Unsupported Working Wall card-level picture\(s\): \/cards\/0\/picture/
  );
});

test("a card-level picture is rejected when it coexists with a P1 visual", async () => {
  const outDir = scratchDir();
  const specPath = path.join(outDir, "visual-plus-picture.json");
  fs.writeFileSync(
    specPath,
    JSON.stringify({
      topic: "Visual Plus Picture Test",
      cards: [
        {
          type: "stickyKnowledge",
          page: { size: "A3", orientation: "landscape" },
          title: "Remember",
          items: [{ text: "A quarter is one of four equal parts." }],
          visual: { type: "fraction-circle", numerator: 1, denominator: 4 },
          picture: { kind: "emoji", value: "\u{1F355}", alt: "pizza" },
        },
      ],
    })
  );

  await assert.rejects(
    () => build(specPath, outDir),
    /Conflicting Working Wall card visual\(s\): \/cards\/0\/picture/
  );
});

test("a card-level picture is rejected when it coexists with a P1 photo", async () => {
  const outDir = scratchDir();
  const specPath = path.join(outDir, "photo-plus-picture.json");
  fs.writeFileSync(
    specPath,
    JSON.stringify({
      topic: "Photo Plus Picture Test",
      cards: [
        {
          type: "workedExample",
          page: { size: "A3", orientation: "landscape" },
          title: "How to do it",
          items: [{ label: "Step 1", text: "Check the plug." }],
          photo: "photos/pizza.jpg",
          picture: {
            kind: "educational-svg",
            concept: "electrical plug",
            context: "A recognisable electrical plug.",
            avoid: [],
            educationalSvgId: "standard/uk/uk-mains-plug.svg",
            educationalSvgSlug: "electrical-plug",
            imagePath: "icons/electrical-plug.png",
          },
        },
      ],
    })
  );

  await assert.rejects(
    () => build(specPath, outDir),
    /Conflicting Working Wall card visual\(s\): \/cards\/0\/picture/
  );
});

test("a non-A3 card rejects with the A3-only message", async () => {
  const outDir = scratchDir();
  const specPath = path.join(outDir, "a4-card.json");
  fs.writeFileSync(
    specPath,
    JSON.stringify({
      topic: "A4 Rejection Test",
      cards: [
        {
          type: "sectionHeading",
          page: { size: "A4", orientation: "landscape" },
          heading: "Vocabulary",
          colour: "DC2626",
        },
      ],
    })
  );

  await assert.rejects(
    () => build(specPath, outDir),
    (err) => {
      assert.match(err.message, /is A4; the working wall is A3 only\. Set page\.size to "A3"\./);
      return true;
    }
  );
});

test("an empty cards array returns null and writes nothing", async () => {
  const outDir = scratchDir();
  const specPath = path.join(outDir, "empty.json");
  fs.writeFileSync(specPath, JSON.stringify({ topic: "Empty Wall", cards: [] }));

  const result = await build(specPath, outDir);

  assert.strictEqual(result, null);
  const written = fs.readdirSync(outDir).filter((f) => f !== "empty.json");
  assert.strictEqual(written.length, 0, `expected no output files, found: ${written.join(", ")}`);
});
