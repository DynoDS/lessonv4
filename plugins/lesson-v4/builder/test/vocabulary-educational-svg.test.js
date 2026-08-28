"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  validateSemanticEducationalSvgVisual,
} = require("../../shared/educational-svg-asset");
const { resolveVocabVisual } = require("../src/content/vocab");
const { drawKeyVocabulary } = require("../src/templates/key-vocabulary");
const { drawImage } = require("../src/content/image");

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAHgAAAAoCAYAAAA16j4lAAAAeElEQVR4nO3RAQkAIBDAwNf+nTWFCOMuwWBrZs6QtX8H8JbBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHXedOAU8U4AvdAAAAAElFTkSuQmCC",
  "base64"
);

function lessonDir() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lr-vocab-educational-svg-"));
  fs.mkdirSync(path.join(root, "icons"), { recursive: true });
  fs.writeFileSync(path.join(root, "icons", "torch.png"), PNG);
  return root;
}

function visual(overrides = {}) {
  return {
    type: "image",
    kind: "educational-svg",
    concept: "torch",
    context: "The vocabulary word means a handheld light.",
    alt: "A handheld torch",
    educationalSvgId: "standard/to/torch.svg",
    educationalSvgSlug: "torch",
    imagePath: "icons/torch.png",
    ...overrides,
  };
}

function fakePptx() {
  return { shapes: { ROUNDED_RECTANGLE: "roundRect" } };
}

function fakeSlide() {
  return {
    shapes: [],
    texts: [],
    images: [],
    addShape(type, options) {
      this.shapes.push({ type, options });
    },
    addText(value, options) {
      this.texts.push({ value, options });
    },
    addImage(options) {
      this.images.push(options);
    },
  };
}

test("resolved semantic vocabulary Educational SVG is drawable", () => {
  const root = lessonDir();
  const value = visual();
  const checked = validateSemanticEducationalSvgVisual(value, root, "torch");
  assert.equal(checked.error, null);
  assert.equal(resolveVocabVisual(value, { lessonDir: root }), value);
});

test("unresolved or missing semantic Educational SVG closes up text-only", () => {
  const root = lessonDir();
  const unresolved = visual({
    educationalSvgId: undefined,
    educationalSvgSlug: undefined,
    imagePath: undefined,
  });
  const missing = visual({
    educationalSvgId: "standard/mi/missing.svg",
    educationalSvgSlug: "missing",
    imagePath: "icons/missing.png",
  });
  assert.equal(resolveVocabVisual(unresolved, { lessonDir: root }), null);
  assert.equal(resolveVocabVisual(missing, { lessonDir: root }), null);
});

test("semantic Educational SVG rejects fallback emoji, missing alt and unknown fields", () => {
  const root = lessonDir();
  assert.match(
    validateSemanticEducationalSvgVisual(
      visual({ fallbackEmoji: "🔦" }),
      root,
      "torch"
    ).error,
    /unsupported field|fallbackEmoji/
  );
  assert.match(
    validateSemanticEducationalSvgVisual(visual({ alt: "" }), root, "torch").error,
    /alt is required/
  );
  assert.match(
    validateSemanticEducationalSvgVisual(visual({ decorative: true }), root, "torch").error,
    /unsupported field/
  );
});

test("unresolved key-vocabulary visual reserves no empty panel", () => {
  const root = lessonDir();
  const slide = fakeSlide();
  drawKeyVocabulary(
    fakePptx(),
    slide,
    {
      title: "Vocabulary",
      words: [
        {
          word: "torch",
          definition: "A handheld light.",
          visual: visual({
            educationalSvgId: undefined,
            educationalSvgSlug: undefined,
            imagePath: undefined,
          }),
        },
      ],
    },
    { lessonDir: root, slideIndex: 0 }
  );
  assert.equal(slide.shapes.length, 1, "only the vocabulary card should draw");
  assert.equal(slide.images.length, 0);
});

test("resolved key-vocabulary visual uses the normal semantic panel", () => {
  const root = lessonDir();
  const slide = fakeSlide();
  drawKeyVocabulary(
    fakePptx(),
    slide,
    {
      title: "Vocabulary",
      words: [
        {
          word: "torch",
          definition: "A handheld light.",
          visual: visual(),
        },
      ],
    },
    {
      lessonDir: root,
      slideIndex: 0,
      imageDims: { "icons/torch.png": { w: 120, h: 40 } },
    }
  );
  assert.equal(slide.shapes.length, 2, "card plus semantic visual panel");
  assert.equal(slide.images.length, 1);
});

test("semantic Educational SVG carries meaningful alt text and no Decoration object name", () => {
  const root = lessonDir();
  const slide = fakeSlide();
  drawImage(
    fakePptx(),
    slide,
    { x: 0, y: 0, w: 4, h: 2 },
    visual(),
    {
      lessonDir: root,
      slideIndex: 0,
      imageDims: { "icons/torch.png": { w: 120, h: 40 } },
    }
  );
  assert.equal(slide.images.length, 1);
  assert.equal(slide.images[0].altText, "A handheld torch");
  assert.equal(slide.images[0].objectName, undefined);
});
