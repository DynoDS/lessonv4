"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { publishEducationalSvgAsset } = require("../scripts/publish-educational-svg");

const SVG_A = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg>');
const SVG_B = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>');
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFgAI/ScL+EwAAAABJRU5ErkJggg==",
  "base64"
);

function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lr-educational-svg-publish-"));
  const libraryRoot = path.join(root, "library");
  const candidateA = path.join(libraryRoot, "standard", "aa", "a.svg");
  const candidateB = path.join(libraryRoot, "cartoon", "bb", "b.svg");
  fs.mkdirSync(path.dirname(candidateA), { recursive: true });
  fs.mkdirSync(path.dirname(candidateB), { recursive: true });
  fs.writeFileSync(candidateA, SVG_A);
  fs.writeFileSync(candidateB, SVG_B);
  const rasterize = (_source, output) => fs.writeFileSync(output, PNG);
  return { root, libraryRoot, candidateA, candidateB, rasterize };
}

test("first source claims the preferred slug", () => {
  const { root, libraryRoot, candidateA, rasterize } = setup();
  const result = publishEducationalSvgAsset(candidateA, root, "leaf", {
    libraryRoot,
    rasterize,
  });
  assert.deepEqual(result, {
    educationalSvgId: "standard/aa/a.svg",
    educationalSvgSlug: "leaf",
    sourcePath: "icons/source/leaf.svg",
    imagePath: "icons/leaf.png",
    reused: false,
  });
  assert.deepEqual(fs.readFileSync(path.join(root, result.sourcePath)), SVG_A);
  assert.deepEqual(fs.readFileSync(path.join(root, result.imagePath)), PNG);
});

test("identical source bytes reuse the existing slug without overwrite", () => {
  const { root, libraryRoot, candidateA, rasterize } = setup();
  publishEducationalSvgAsset(candidateA, root, "leaf", { libraryRoot, rasterize });
  const before = fs.statSync(path.join(root, "icons", "source", "leaf.svg")).mtimeMs;
  const result = publishEducationalSvgAsset(candidateA, root, "leaf", {
    libraryRoot,
    rasterize,
  });
  const after = fs.statSync(path.join(root, "icons", "source", "leaf.svg")).mtimeMs;
  assert.equal(result.educationalSvgSlug, "leaf");
  assert.equal(result.reused, true);
  assert.equal(after, before);
});

test("different source bytes allocate a stable numeric suffix", () => {
  const { root, libraryRoot, candidateA, candidateB, rasterize } = setup();
  publishEducationalSvgAsset(candidateA, root, "leaf", { libraryRoot, rasterize });
  const first = publishEducationalSvgAsset(candidateB, root, "leaf", {
    libraryRoot,
    rasterize,
  });
  const second = publishEducationalSvgAsset(candidateB, root, "leaf", {
    libraryRoot,
    rasterize,
  });
  assert.equal(first.educationalSvgSlug, "leaf-2");
  assert.equal(first.reused, false);
  assert.equal(second.educationalSvgSlug, "leaf-2");
  assert.equal(second.reused, true);
  assert.deepEqual(
    fs.readFileSync(path.join(root, "icons", "source", "leaf.svg")),
    SVG_A
  );
  assert.deepEqual(
    fs.readFileSync(path.join(root, "icons", "source", "leaf-2.svg")),
    SVG_B
  );
});

test("invalid preferred slug is refused before writing", () => {
  const { root, libraryRoot, candidateA, rasterize } = setup();
  assert.throws(
    () =>
      publishEducationalSvgAsset(candidateA, root, "Leaf Icon", {
        libraryRoot,
        rasterize,
      }),
    /lowercase kebab-case/
  );
});

test("a source outside the fixed library is refused", () => {
  const { root, libraryRoot, rasterize } = setup();
  const outside = path.join(root, "outside.svg");
  fs.writeFileSync(outside, SVG_A);
  assert.throws(
    () => publishEducationalSvgAsset(outside, root, "outside", { libraryRoot, rasterize }),
    /must come from the Educational SVG library/
  );
});

test("active SVG content is refused", () => {
  const { root, libraryRoot, rasterize } = setup();
  const unsafe = path.join(libraryRoot, "standard", "un", "unsafe.svg");
  fs.mkdirSync(path.dirname(unsafe), { recursive: true });
  fs.writeFileSync(
    unsafe,
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><script>alert(1)</script></svg>'
  );
  assert.throws(
    () => publishEducationalSvgAsset(unsafe, root, "unsafe", { libraryRoot, rasterize }),
    /unsafe script/
  );
});

test("with nothing configured, publishing reads the cache the search fills", () => {
  // Publishing never fetches. The search brought the drawing over in order to
  // show it, so by here the file is on this machine, and keeping publication
  // off the network is what stops a lesson stalling at its very last step.
  const cache = fs.mkdtempSync(path.join(os.tmpdir(), "lr-educational-svg-cache-"));
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lr-educational-svg-default-"));
  const candidate = path.join(cache, "library", "standard", "ro", "robin.svg");
  fs.mkdirSync(path.dirname(candidate), { recursive: true });
  fs.writeFileSync(candidate, SVG_A);
  const rasterize = (_source, output) => fs.writeFileSync(output, PNG);

  const previous = process.env.LESSON_EDUCATIONAL_SVG_CACHE;
  process.env.LESSON_EDUCATIONAL_SVG_CACHE = cache;
  try {
    delete require.cache[require.resolve("../scripts/publish-educational-svg")];
    const publish = require("../scripts/publish-educational-svg").publishEducationalSvgAsset;

    const result = publish(candidate, root, "robin", { rasterize });
    assert.equal(result.educationalSvgId, "standard/ro/robin.svg");
    assert.equal(result.imagePath, "icons/robin.png");

    // And a drawing nobody fetched is named plainly, not as a path error.
    const missing = path.join(cache, "library", "standard", "we", "wren.svg");
    assert.throws(
      () => publish(missing, root, "wren", { rasterize }),
      /Educational SVG drawing does not exist/
    );
  } finally {
    if (previous === undefined) delete process.env.LESSON_EDUCATIONAL_SVG_CACHE;
    else process.env.LESSON_EDUCATIONAL_SVG_CACHE = previous;
    delete require.cache[require.resolve("../scripts/publish-educational-svg")];
  }
});
