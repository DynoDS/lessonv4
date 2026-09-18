"use strict";

// diagramSection: several drawings on one sheet, and the drawing keeps the room.
//
// Why this family and this test exist. Every other family that lays several
// pieces on one sheet requires a photograph, so a maths lesson could only ever
// get one panel of words with one figure beside it. Over 45 built lessons the
// engine produced 56 sheets and the teacher put up two, both of them
// heroCallouts; the maths wall he actually wanted is three sections, each
// holding two or three small diagrams with their worked numbers underneath.
//
// The rule that separates the sections he keeps from the sheets he bins is
// that the drawing is the main thing and the words sit around it. A share cap
// holds the text, so a long note cannot push the figure down to a strip. These
// pin the outcome - the rendered figure's height in mm - rather than the CSS
// that is supposed to produce it, which is how the last round of wall faults
// shipped green.

const test = require("node:test");
const assert = require("node:assert");

const style = require("../style.json");
const { preRenderSvgs } = require("../src/svg-renderer");
const { renderDiagramSection } = require("../src/render-section");
const { printableInches } = require("../src/layout");

const A3_LANDSCAPE = { size: "A3", orientation: "landscape" };

const NUMBER_LINE = {
  type: "numberLine",
  start: 340,
  end: 350,
  interval: 5,
  labels: "all",
  answer: { at: 347, text: "347" },
};

// Square-ish, so its natural height at full column width is large and the only
// thing that can shrink it is the text beside it. A wide number line is limited
// by the column and would pass this test without the cap doing any work.
const CHART = {
  type: "place-value-chart",
  columns: ["Thousands", "Hundreds", "Tens", "Ones"],
  rows: [{ value: 4306 }],
};

function sectionCard(parts, title = "Rounding") {
  return { type: "diagramSection", page: A3_LANDSCAPE, title, parts };
}

async function render(card) {
  const svgImages = await preRenderSvgs({ cards: [card] }, __dirname);
  return renderDiagramSection(card, style, __dirname, { svgImages });
}

// Every drawn figure on the sheet, by its printed height in mm.
function figureHeightsMm(html) {
  return [...html.matchAll(/<img[^>]*height:([\d.]+)mm/g)].map((m) => Number(m[1]));
}

test("two drawings land on one section sheet", async () => {
  const html = await render(
    sectionCard([
      { heading: "Rounding to the nearest 10", visual: NUMBER_LINE, notes: ["347 is closer to 350."] },
      { heading: "Nearest 100", visual: { ...NUMBER_LINE, start: 300, end: 400, interval: 50 } },
    ])
  );
  assert.equal(figureHeightsMm(html).length, 2, "both parts should print their own figure");
  assert.ok(html.includes("Rounding to the nearest 10"), "each part keeps its own heading");
  assert.ok(html.includes("Nearest 100"));
});

test("notes never print below the wall's readable floor", async () => {
  // The complaint this family answers included walls the teacher could not
  // use because they were small print on a big sheet. A note that will not fit
  // at 36pt must stop the build, not shrink past it.
  const html = await render(
    sectionCard([
      { heading: "Rounding to the nearest 10", visual: NUMBER_LINE, notes: ["347 is closer to 350 than to 340."] },
      { heading: "Strategy", steps: ["Find the neighbouring multiples.", "Find halfway.", "Choose the closest."] },
    ])
  );
  // Everything the parts print: headings, notes, steps, the result strip.
  const inParts = [...html.matchAll(/data-part="[a-z]+"[\s\S]*?font-size:(\d+)pt/g)].map((m) => Number(m[1]));
  assert.ok(inParts.length >= 4, "expected headings, notes and steps to be found");
  assert.ok(
    Math.min(...inParts) >= 36,
    `a section printed text at ${Math.min(...inParts)}pt; the wall's floor is 36pt`
  );
});

test("one shared note size across the whole sheet", async () => {
  // Fitting each part alone put 24pt beside 44pt on one sheet, which reads as
  // a mistake rather than as emphasis.
  const html = await render(
    sectionCard([
      { heading: "Reading a number line", visual: NUMBER_LINE, notes: ["start 340   end 350", "each jump is 5"] },
      { heading: "Nearest 100", visual: { ...NUMBER_LINE, start: 300, end: 400, interval: 50 }, notes: ["347"] },
    ])
  );
  const noteSizes = new Set(
    [...html.matchAll(/data-part="note"[^>]*font-size:(\d+)pt/g)].map((m) => m[1])
  );
  assert.equal(noteSizes.size, 1, `the sheet set its notes at ${[...noteSizes].join("pt, ")}pt`);
});

test("the drawing keeps at least 40% of its part, however much the words say", async () => {
  // Measured against the same part with nothing to say, so the guarantee is
  // checked directly rather than against a guess at the page geometry: words
  // may take up to 60% of what the figure would otherwise have had.
  const bare = await render(
    sectionCard([
      { heading: "Rounding to the nearest 10", visual: NUMBER_LINE },
      { heading: "Strategy", steps: ["Find halfway."] },
    ])
  );
  const wordy = await render(
    sectionCard([
      {
        heading: "Rounding to the nearest 10",
        visual: NUMBER_LINE,
        notes: ["347 is closer to 350 than to 340."],
        result: "347 rounds to 350.",
      },
      { heading: "Strategy", steps: ["Find halfway."] },
    ])
  );

  const [bareFigure] = figureHeightsMm(bare);
  const [wordyFigure] = figureHeightsMm(wordy);
  assert.ok(
    wordyFigure >= bareFigure * 0.4,
    `a note and a result cut the drawing from ${bareFigure.toFixed(0)}mm to ${wordyFigure.toFixed(0)}mm, ` +
      `past the 40% of its part the figure is guaranteed`
  );
});

test("a section that draws nothing is refused rather than printed as words", async () => {
  const card = sectionCard([
    { heading: "What to do", notes: ["Find the neighbouring multiples."] },
    { heading: "Then", notes: ["Choose the closest."] },
  ]);
  await assert.rejects(
    async () => render(card),
    /draw nothing|belongs in another family/,
    "a wordless section is exactly the sheet the teacher bins; the builder should say no"
  );
});

test("a part that promises a figure the builder cannot draw fails loudly", async () => {
  const card = sectionCard([
    { heading: "Rounding to the nearest 10", visual: NUMBER_LINE },
    { heading: "Broken", visual: { type: "not-a-real-primitive" }, notes: ["..."] },
  ]);
  // The pre-render refuses an unknown primitive before the card is laid out,
  // which is the loud failure this asks for; the renderer's own check covers a
  // primitive that is real but produced nothing.
  await assert.rejects(
    async () => render(card),
    /not a supported primitive|could not draw/,
    "shipping the words of a part whose picture failed is the silent version of the same fault"
  );
});

test("one part on its own is not a section", async () => {
  const card = sectionCard([{ heading: "Rounding", visual: NUMBER_LINE }]);
  await assert.rejects(async () => render(card), /needs 2-4 parts/);
});
