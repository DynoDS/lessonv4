"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  prepareWorksheetDecorations,
  renderDecorationLayers,
} = require("../src/decorations");
const { renderSheet, checkFit, measureFill } = require("../src/render");
const { sheetsOf } = require("../src/worksheet");
const { pageSize } = require("../src/page");
const { findChrome } = require("../src/chrome");

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAHgAAAAoCAYAAAA16j4lAAAAeElEQVR4nO3RAQkAIBDAwNf+nTWFCOMuwWBrZs6QtX8H8JbBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHGRxncJzBcQbHXedOAU8U4AvdAAAAAElFTkSuQmCC",
  "base64"
);

function tempLesson() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lr-worksheet-decoration-"));
  fs.mkdirSync(path.join(root, "icons"), { recursive: true });
  fs.writeFileSync(path.join(root, "icons", "leaf.png"), PNG);
  return root;
}

function decoration(overrides = {}) {
  return {
    id: "decoration-leaf",
    kind: "educational-svg",
    concept: "leaf",
    context: "A relevant leaf accent, not part of the task.",
    frame: { x: 0.8, y: 0.82, width: 0.18, height: 0.12 },
    layer: "high",
    rotation: -15,
    transparency: 20,
    educationalSvgId: "standard/le/leaf.svg",
    educationalSvgSlug: "leaf",
    imagePath: "icons/leaf.png",
    ...overrides,
  };
}

function pageSpec(overrides = {}) {
  return {
    title: "Proof sheet",
    lo: "To test the overlay.",
    layout: "full",
    orientation: "portrait",
    zones: {
      a: { helper: "instruction", text: "Core worksheet content" },
    },
    ...overrides,
  };
}

test("P3 does not enter worksheet fit, fill or zone geometry", () => {
  const root = tempLesson();
  const rawPage = pageSpec();
  const beforeFit = checkFit(rawPage);
  const beforeFill = measureFill(rawPage);

  const prepared = prepareWorksheetDecorations(
    {
      meta: { lesson: "Proof", yearGroup: 4 },
      sheets: {
        expected: {
          ...rawPage,
          decorations: [decoration()],
        },
      },
    },
    root
  );
  const renderedPage = sheetsOf(prepared.worksheet)[0].spec;
  // The engine's own numbering and year-group phase still apply, so the
  // baseline is the SAME sheet built without decorations rather than the raw
  // zones. That is what "decorations change no zone geometry" means here.
  const baselinePage = sheetsOf({
    meta: { lesson: "Proof", yearGroup: 4 },
    sheets: { expected: { ...rawPage } },
  })[0].spec;

  assert.deepEqual(checkFit(renderedPage), beforeFit);
  assert.deepEqual(measureFill(renderedPage), beforeFill);
  assert.deepEqual(renderedPage.zones, baselinePage.zones);
  assert.equal(renderedPage.decorations.length, 1);
});

test("sheetsOf carries one-page and per-page decoration data to renderSheet", () => {
  const root = tempLesson();
  const prepared = prepareWorksheetDecorations(
    {
      meta: { lesson: "Proof", yearGroup: 4 },
      sheets: {
        expected: {
          ...pageSpec(),
          decorations: [decoration()],
        },
        greaterDepth: {
          centralWriteOnVisualException: {
            visual: "large plotting grid",
            reason: "The pupil must write directly on it.",
          },
          pages: [
            { ...pageSpec(), decorations: [decoration()] },
            { ...pageSpec({ title: "Page 2" }), decorations: [] },
          ],
        },
      },
    },
    root
  );
  const pages = sheetsOf(prepared.worksheet);
  assert.equal(pages.length, 3);
  assert.equal(pages[0].spec.decorations.length, 1);
  assert.equal(pages[1].spec.decorations.length, 1);
  assert.equal(pages[2].spec.decorations.length, 0);
});

test("sheet-level decoration beside a pages array is omitted with a notice", () => {
  const root = tempLesson();
  const prepared = prepareWorksheetDecorations(
    {
      sheets: {
        expected: {
          decorations: [decoration()],
          centralWriteOnVisualException: {
            visual: "large plotting grid",
            reason: "The pupil must write directly on it.",
          },
          pages: [pageSpec(), pageSpec()],
        },
      },
    },
    root
  );
  assert.equal(prepared.worksheet.sheets.expected.decorations, undefined);
  assert.match(prepared.warnings[0], /individual page objects/);
});

test("HTML places low P3 before core and high P3 after core", () => {
  const root = tempLesson();
  const prepared = prepareWorksheetDecorations(
    {
      meta: { lesson: "Proof", yearGroup: 4 },
      sheets: {
        expected: {
          ...pageSpec(),
          decorations: [
            decoration({ id: "decoration-low", layer: "low" }),
            decoration({ id: "decoration-high", layer: "high" }),
          ],
        },
      },
    },
    root
  );
  const html = renderSheet(sheetsOf(prepared.worksheet)[0].spec);
  const low = html.indexOf('data-decoration-layer="low"');
  const core = html.indexOf('class="area');
  const high = html.indexOf('data-decoration-layer="high"');
  assert.ok(low < core);
  assert.ok(core < high);
  assert.match(html, /alt="" aria-hidden="true" role="presentation"/);
  assert.match(html, /\.decoration-layer \{[\s\S]*inset: 0;/);
  assert.doesNotMatch(html, /left:-15mm|top:-15mm/);
});

test("partly clipped P3 survives but printer-fringe-only P3 is omitted", () => {
  const root = tempLesson();
  const prepared = prepareWorksheetDecorations(
    {
      sheets: {
        expected: {
          ...pageSpec(),
          decorations: [
            decoration({
              id: "decoration-clipped",
              frame: { x: -0.05, y: 0.3, width: 0.2, height: 0.2 },
            }),
            decoration({
              id: "decoration-fringe",
              frame: { x: 0, y: 0, width: 0.02, height: 0.02 },
            }),
          ],
        },
      },
    },
    root
  );
  const values = prepared.worksheet.sheets.expected.decorations;
  assert.deepEqual(values.map((item) => item.id), ["decoration-clipped"]);
  assert.ok(prepared.warnings.some((warning) => /printer-edge margin/.test(warning)));
});

test("missing and malformed P3 are warning-only and page count is unchanged", () => {
  const root = tempLesson();
  const input = {
    meta: { lesson: "Proof", yearGroup: 4 },
    sheets: {
      expected: {
        ...pageSpec(),
        decorations: [
          decoration({
            id: "decoration-missing",
            educationalSvgId: "standard/mi/missing.svg",
            educationalSvgSlug: "missing",
            imagePath: "icons/missing.png",
          }),
          decoration({ id: "bad id" }),
        ],
      },
    },
  };
  const beforeCount = sheetsOf({
    ...input,
    sheets: { expected: pageSpec() },
  }).length;
  const prepared = prepareWorksheetDecorations(input, root);
  const afterCount = sheetsOf(prepared.worksheet).length;
  assert.equal(beforeCount, afterCount);
  assert.equal(prepared.worksheet.sheets.expected.decorations.length, 0);
  assert.equal(prepared.warnings.length, 2);
});

test("decoration layer occupies the full physical page origin in Chromium", async (t) => {
  let chrome;
  try {
    chrome = findChrome();
  } catch (_) {
    t.skip("Chrome unavailable on this machine");
    return;
  }

  const root = tempLesson();
  const prepared = prepareWorksheetDecorations(
    {
      meta: { lesson: "Proof", yearGroup: 4 },
      sheets: {
        expected: {
          ...pageSpec(),
          decorations: [decoration()],
        },
      },
    },
    root
  );
  const html = renderSheet(sheetsOf(prepared.worksheet)[0].spec);
  const puppeteer = require("puppeteer-core");
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const rectangles = await page.evaluate(() => {
      const body = document.body.getBoundingClientRect();
      const layer = document
        .querySelector('[data-decoration-layer="low"]')
        .getBoundingClientRect();
      return {
        body: { x: body.x, y: body.y, width: body.width, height: body.height },
        layer: {
          x: layer.x,
          y: layer.y,
          width: layer.width,
          height: layer.height,
        },
      };
    });
    assert.deepEqual(rectangles.layer, rectangles.body);
  } finally {
    await browser.close();
  }
});

test("standalone layer renderer preserves configured opacity", () => {
  const layers = renderDecorationLayers(
    [
      {
        ...decoration(),
        imageHref: "data:image/png;base64,AA==",
        imageWidth: 120,
        imageHeight: 40,
      },
    ],
    pageSize("portrait")
  );
  assert.match(layers.high, /opacity:0\.8/);
});
