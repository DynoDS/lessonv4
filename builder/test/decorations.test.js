"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const requireGlobal = require("../src/require-global");
const PptxGenJS = requireGlobal("pptxgenjs");
const { preflightLayouts } = require("../src/layout-preflight");
const { clearWarnings, getWarnings } = require("../src/warnings");
const {
  withoutDecorations,
  inspectDecorations,
  fitContainedDecoration,
} = require("../../shared/decorations");
const {
  isVocabularySurface,
  forEachVocabularyEntry,
  emptyDecorationPlan,
  prepareSlideDecorationPlans,
  drawDecorationLayer,
  rebuildWithoutOptionalDecorations,
} = require("../src/decorations");

const WIDE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAHgAAAAoCAYAAAA16j4lAAAAeElEQVR4nO3RAQkAIBDAwNf+nTWFCOMuwWBrZs6QtX8H8JbBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHXedOAU8U4AvdAAAAAElFTkSuQmCC",
  "base64"
);
const TALL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAACgAAAB4CAYAAACAcLCaAAAAi0lEQVR4nO3OMQHAIBAAsQf/nlsJDDfAkCjImplvHrZvB04EK8FKsBKsBCvBSrASrAQrwUqwEqwEK8FKsBKsBCvBSrASrAQrwUqwEqwEK8FKsBKsBCvBSrASrAQrwUqwEqwEK8FKsBKsBCvBSrASrAQrwUqwEqwEK8FKsBKsBCvBSrASrAQrwUqwEqwEK8FKsBKsBCvBSrASrAQrwUqwEqwEK8FKsBKsBCvBSrASrAQrwUqw+gHatgHvUtPZEwAAAABJRU5ErkJggg==",
  "base64"
);

function tempLesson() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "lr-slide-decoration-"));
}

function writeIcon(root, slug, buffer) {
  const dir = path.join(root, "icons");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${slug}.png`), buffer);
}

function decoration(overrides = {}) {
  return {
    id: "decoration-forest",
    kind: "educational-svg",
    concept: "forest",
    context: "A relevant forest accent, not teaching content.",
    frame: { x: 0.78, y: 0.72, width: 0.3, height: 0.3 },
    layer: "low",
    rotation: 0,
    transparency: 50,
    educationalSvgId: "standard/fo/forest.svg",
    educationalSvgSlug: "forest",
    imagePath: "icons/forest.png",
    ...overrides,
  };
}

test("strict decoration numbers reject numeric strings and null", () => {
  const checked = inspectDecorations(
    [
      decoration({
        frame: { x: "0.2", y: 0.2, width: 0.3, height: 0.3 },
      }),
      decoration({
        id: "decoration-null-rotation",
        rotation: null,
      }),
    ],
    {
      surface: "slide",
      supported: true,
      baseDir: process.cwd(),
      label: "slide 1",
    }
  );

  assert.equal(checked.decorations.length, 0);
  assert.equal(checked.warnings.length, 2);
  assert.match(checked.warnings[0], /JSON numbers/);
  assert.match(checked.warnings[1], /rotation must be a JSON number/);
});

test("large frames and full useful rotation are accepted", () => {
  const checked = inspectDecorations(
    [
      decoration({
        frame: { x: -0.5, y: 0.1, width: 1.2, height: 0.8 },
        rotation: 90,
      }),
    ],
    {
      surface: "slide",
      supported: true,
      baseDir: process.cwd(),
      label: "slide 1",
    }
  );

  assert.equal(checked.warnings.length, 0);
  assert.equal(checked.decorations[0].rotation, 90);
  assert.equal(checked.decorations[0].frame.width, 1.2);
});

test("contain fitting preserves wide and tall natural proportions", () => {
  const wide = fitContainedDecoration(
    decoration({ frame: { x: 0, y: 0, width: 0.5, height: 0.5 } }),
    12,
    8,
    120,
    40
  );
  const tall = fitContainedDecoration(
    decoration({ frame: { x: 0, y: 0, width: 0.5, height: 0.5 } }),
    12,
    8,
    40,
    120
  );

  assert.equal(wide.width / wide.height, 3);
  assert.equal(tall.width / tall.height, 1 / 3);
});

test("vocabulary surfaces include the dedicated template and nested vocab helpers", () => {
  assert.equal(isVocabularySurface({ template: "key-vocabulary" }), true);
  assert.equal(
    isVocabularySurface({
      template: "body-full",
      body: { type: "vocab", words: [{ word: "torch" }] },
    }),
    true
  );
  assert.equal(
    isVocabularySurface({
      template: "body-full",
      body: { type: "text", text: "No vocabulary helper" },
    }),
    false
  );
});

test("semantic vocabulary entries are found in both current routes", () => {
  const seen = [];
  forEachVocabularyEntry(
    {
      template: "key-vocabulary",
      words: [{ word: "torch" }],
      inset: { type: "vocab", words: [{ word: "candle" }] },
    },
    (entry) => seen.push(entry.word)
  );
  assert.deepEqual(seen.sort(), ["candle", "torch"]);
});

test("withoutDecorations strips P3 before every core traversal", () => {
  const lesson = {
    decorations: [decoration()],
    slides: [
      {
        template: "body-full",
        body: { type: "text", text: "Core" },
        decorations: [decoration()],
      },
    ],
  };
  const core = withoutDecorations(lesson);
  assert.equal(core.decorations, undefined);
  assert.equal(core.slides[0].decorations, undefined);
  assert.deepEqual(core.slides[0].body, lesson.slides[0].body);
});

test("partly off-slide resolved decoration is retained", async () => {
  clearWarnings();
  const root = tempLesson();
  writeIcon(root, "forest", WIDE_PNG);
  const plans = await prepareSlideDecorationPlans(
    [
      {
        template: "body-full",
        decorations: [
          decoration({
            frame: { x: -0.08, y: 0.1, width: 0.2, height: 0.2 },
          }),
        ],
      },
    ],
    root
  );

  assert.equal(plans[0].low.length, 1);
  assert.equal(getWarnings().length, 0);
  clearWarnings();
});

test("completely off-slide and missing decorations are omitted without throwing", async () => {
  clearWarnings();
  const root = tempLesson();
  writeIcon(root, "forest", WIDE_PNG);
  const plans = await prepareSlideDecorationPlans(
    [
      {
        template: "body-full",
        decorations: [
          decoration({
            frame: { x: 1.4, y: 1.4, width: 0.05, height: 0.05 },
          }),
          decoration({
            id: "decoration-missing",
            educationalSvgId: "standard/mi/missing.svg",
            educationalSvgSlug: "missing",
            imagePath: "icons/missing.png",
          }),
        ],
      },
    ],
    root
  );

  assert.deepEqual(plans[0], emptyDecorationPlan());
  assert.equal(getWarnings().length, 2);
  clearWarnings();
});

test("P3 is omitted on every mechanically recognised vocabulary surface", async () => {
  clearWarnings();
  const root = tempLesson();
  writeIcon(root, "forest", WIDE_PNG);
  const plans = await prepareSlideDecorationPlans(
    [
      {
        template: "body-full",
        body: { type: "vocab", words: [{ word: "forest" }] },
        decorations: [decoration()],
      },
    ],
    root
  );

  assert.deepEqual(plans[0], emptyDecorationPlan());
  assert.match(getWarnings()[0], /not supported on this surface/);
  clearWarnings();
});

test("only slides that explicitly carry P3 receive a decoration plan", async () => {
  const root = tempLesson();
  writeIcon(root, "forest", TALL_PNG);
  const plans = await prepareSlideDecorationPlans(
    [
      { template: "body-full", decorations: [decoration()] },
      { template: "body-full" },
    ],
    root
  );
  assert.equal(plans[0].low.length, 1);
  assert.deepEqual(plans[1], emptyDecorationPlan());
});

test("drawing tags P3 for accessibility without creating a text box", () => {
  const images = [];
  drawDecorationLayer(
    { addImage: (options) => images.push(options) },
    {
      low: [
        {
          id: "decoration-forest",
          path: "forest.png",
          x: 1,
          y: 2,
          width: 3,
          height: 1,
          rotation: 30,
          transparency: 50,
        },
      ],
      high: [],
    },
    "low",
    0
  );

  assert.equal(images.length, 1);
  assert.equal(images[0].objectName, "Decoration/decoration-forest");
  assert.equal(images[0].altText, "");
  assert.equal(images[0].rotate, 30);
  assert.equal(images[0].transparency, 50);
});

test("layout preflight sees the same core lesson with or without P3", () => {
  const withP3 = {
    slides: [
      {
        template: "body-full",
        body: { type: "text", text: "Core" },
        decorations: [decoration()],
      },
    ],
  };
  const core = withoutDecorations(withP3);
  const draw = () => {};
  const contextForSlide = (index) => ({ slideIndex: index });

  const a = preflightLayouts({
    PptxGenJS,
    lesson: core,
    contextForSlide,
    drawSlide: draw,
  });
  const b = preflightLayouts({
    PptxGenJS,
    lesson: withoutDecorations(core),
    contextForSlide,
    drawSlide: draw,
  });
  assert.deepEqual(a, b);
});

test("technical P3 post-process fallback invokes one decoration-free rebuild", () => {
  const calls = [];
  const result = rebuildWithoutOptionalDecorations("lesson.json", "out", {
    scriptPath: "/plugin/builder/build.js",
    stdio: "pipe",
    env: { TEST: "1" },
    spawnSync(command, args, options) {
      calls.push({ command, args, options });
      return { status: 0 };
    },
  });

  assert.equal(result.status, 0);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, process.execPath);
  assert.deepEqual(calls[0].args, [
    "/plugin/builder/build.js",
    "lesson.json",
    "out",
    "--skip-optional-decorations",
  ]);
});
