"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const {
  WALL_DECORATION_TYPES,
} = require("../../shared/decorations");
const {
  prepareWorkingWallOptionalImages,
  renderWorkingWallDecorationLayers,
  wrapWorkingWallPage,
} = require("../src/decorations");
const { preRenderSvgs } = require("../src/svg-renderer");

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAHgAAAAoCAYAAAA16j4lAAAAeElEQVR4nO3RAQkAIBDAwNf+nTWFCOMuwWBrZs6QtX8H8JbBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHXedOAU8U4AvdAAAAAElFTkSuQmCC",
  "base64"
);

function tempLesson() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lr-wall-decoration-"));
  fs.mkdirSync(path.join(root, "icons"), { recursive: true });
  fs.writeFileSync(path.join(root, "icons", "leaf.png"), PNG);
  return root;
}

function decoration(overrides = {}) {
  return {
    id: "decoration-leaf",
    kind: "educational-svg",
    concept: "leaf",
    context: "A relevant leaf accent, not the card's meaningful visual.",
    frame: { x: 0.78, y: 0.75, width: 0.25, height: 0.2 },
    layer: "high",
    rotation: 10,
    transparency: 20,
    educationalSvgId: "standard/le/leaf.svg",
    educationalSvgSlug: "leaf",
    imagePath: "icons/leaf.png",
    ...overrides,
  };
}

function card(type, overrides = {}) {
  return {
    type,
    page: { size: "A3", orientation: "landscape" },
    title: "Proof",
    items: [{ text: "Core wall content" }],
    decorations: [decoration()],
    ...overrides,
  };
}

test("the exact six ordinary wall types support P3", () => {
  assert.deepEqual(WALL_DECORATION_TYPES, [
    "stickyKnowledge",
    "workedExample",
    "sentenceStem",
    "misconception",
    "referenceTable",
    "equivalenceGrid",
  ]);

  const root = tempLesson();
  const cards = WALL_DECORATION_TYPES.map((type) => card(type));
  const prepared = prepareWorkingWallOptionalImages(cards, root, 15);
  assert.equal(prepared.notices.length, 0);
  for (let index = 0; index < cards.length; index += 1) {
    assert.equal(prepared.decorationPlans.get(index).high.length, 1);
  }
});

test("every forbidden wall family omits P3 with a nonfatal notice", () => {
  const root = tempLesson();
  const forbidden = [
    "vocabDefinition",
    "vocabChips",
    "banner",
    "sectionHeading",
    "mnemonicPoster",
    "labelledDiagram",
    "photoMapOverview",
    "heroCallouts",
    "causeCards",
  ];
  const cards = forbidden.map((type) => card(type));
  const prepared = prepareWorkingWallOptionalImages(cards, root, 15);
  assert.equal(prepared.notices.length, forbidden.length);
  for (let index = 0; index < cards.length; index += 1) {
    assert.deepEqual(prepared.decorationPlans.get(index), { low: [], high: [] });
  }
});

test("low and high wall layers wrap the unchanged page core", () => {
  const plan = {
    low: [
      {
        id: "decoration-low",
        href: "data:image/png;base64,AA==",
        x: 1,
        y: 2,
        width: 3,
        height: 1,
        rotation: 0,
        transparency: 20,
      },
    ],
    high: [
      {
        id: "decoration-high",
        href: "data:image/png;base64,AA==",
        x: 4,
        y: 5,
        width: 3,
        height: 1,
        rotation: 0,
        transparency: 20,
      },
    ],
  };
  const html = wrapWorkingWallPage("landscape", 15, "<main>CORE</main>", plan);
  const low = html.indexOf('data-decoration-layer="low"');
  const core = html.indexOf('class="page-core"');
  const high = html.indexOf('data-decoration-layer="high"');
  assert.ok(low < core);
  assert.ok(core < high);
  assert.match(html, /style="padding:15mm"/);
  assert.match(html, /alt="" aria-hidden="true" role="presentation"/);
});

test("unresolved and missing P3 produce notices but no plan item", () => {
  const root = tempLesson();
  const cards = [
    card("stickyKnowledge", {
      decorations: [
        decoration({
          educationalSvgId: undefined,
          educationalSvgSlug: undefined,
          imagePath: undefined,
        }),
        decoration({
          id: "decoration-missing",
          educationalSvgId: "standard/mi/missing.svg",
          educationalSvgSlug: "missing",
          imagePath: "icons/missing.png",
        }),
      ],
    }),
  ];
  const prepared = prepareWorkingWallOptionalImages(cards, root, 15);
  assert.equal(prepared.notices.length, 2);
  assert.deepEqual(prepared.decorationPlans.get(0), { low: [], high: [] });
});

test("resolved semantic vocab bypasses primitive SVG validation and keeps meaningful alt", async () => {
  const root = tempLesson();
  const cards = [
    {
      type: "vocabDefinition",
      page: { size: "A3", orientation: "landscape" },
      title: "Leaf",
      definition: "A flat part of a plant.",
      visual: {
        type: "image",
        kind: "educational-svg",
        concept: "leaf",
        context: "The vocabulary word means a plant leaf.",
        alt: "A plant leaf",
        educationalSvgId: "standard/le/leaf.svg",
        educationalSvgSlug: "leaf",
        imagePath: "icons/leaf.png",
      },
    },
  ];
  const prepared = prepareWorkingWallOptionalImages(cards, root, 15);
  assert.equal(prepared.notices.length, 0);
  assert.ok(cards[0].visual._educationalSvgBuffer);
  assert.equal(cards[0].visual.alt, "A plant leaf");
  await assert.doesNotReject(() => preRenderSvgs({ cards }));
});

test("unresolved semantic vocab is rejected before primitive rendering", () => {
  const root = tempLesson();
  const cards = [
    {
      type: "vocabDefinition",
      page: { size: "A3", orientation: "landscape" },
      title: "Leaf",
      definition: "A flat part of a plant.",
      visual: {
        type: "image",
        kind: "educational-svg",
        concept: "leaf",
        context: "The vocabulary word means a plant leaf.",
        alt: "A plant leaf",
      },
    },
  ];
  assert.throws(
    () => prepareWorkingWallOptionalImages(cards, root, 15),
    /VOCAB_EDUCATIONAL_SVG_UNRESOLVED/
  );
});

test("missing resolved semantic vocab is a blocking Working Wall error", () => {
  const root = tempLesson();
  const cards = [
    {
      type: "vocabDefinition",
      page: { size: "A3", orientation: "landscape" },
      title: "Leaf",
      definition: "A flat part of a plant.",
      visual: {
        type: "image",
        kind: "educational-svg",
        concept: "leaf",
        context: "The vocabulary word means a plant leaf.",
        alt: "A plant leaf",
        educationalSvgId: "standard/mi/missing.svg",
        educationalSvgSlug: "missing",
        imagePath: "icons/missing.png",
      },
    },
  ];
  assert.throws(
    () => prepareWorkingWallOptionalImages(cards, root, 15),
    /VOCAB_EDUCATIONAL_SVG_MISSING/
  );
});

test("malformed semantic vocab remains a blocking semantic contract error", () => {
  const root = tempLesson();
  const cards = [
    {
      type: "vocabDefinition",
      page: { size: "A3", orientation: "landscape" },
      title: "Leaf",
      definition: "A flat part of a plant.",
      visual: {
        type: "image",
        kind: "educational-svg",
        concept: "leaf",
        context: "The vocabulary word means a plant leaf.",
        alt: "",
      },
    },
  ];
  assert.throws(
    () => prepareWorkingWallOptionalImages(cards, root, 15),
    /VOCAB_EDUCATIONAL_SVG_INVALID/
  );
});

test("optional wall notices do not enter the fatal layout-warning channel", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lr-wall-build-notice-"));
  const specPath = path.join(root, "working-wall.json");
  fs.writeFileSync(
    specPath,
    JSON.stringify({
      topic: "Proof",
      cards: [
        {
          type: "stickyKnowledge",
          page: { size: "A3", orientation: "landscape" },
          title: "Remember",
          items: [{ text: "Core content" }],
          decorations: [
            {
              id: "decoration-leaf",
              kind: "educational-svg",
              concept: "leaf",
              context: "A relevant accent.",
              educationalSvgId: "standard/mi/missing.svg",
              educationalSvgSlug: "missing",
              imagePath: "icons/missing.png",
              frame: { x: 0.8, y: 0.8, width: 0.2, height: 0.2 },
              layer: "high",
            },
          ],
        },
      ],
    })
  );

  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, "..", "build.js"), specPath, root],
    { encoding: "utf8" }
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /OPTIONAL_DECORATION_OMITTED/);
  assert.doesNotMatch(result.stderr, /Layout validation failed/);
});

test("layer renderer uses print-safe opacity conversion", () => {
  const layers = renderWorkingWallDecorationLayers({
    low: [],
    high: [
      {
        id: "decoration-leaf",
        href: "data:image/png;base64,AA==",
        x: 1,
        y: 1,
        width: 10,
        height: 10,
        rotation: 0,
        transparency: 20,
      },
    ],
  });
  assert.match(layers.high, /opacity:0\.8/);
});
