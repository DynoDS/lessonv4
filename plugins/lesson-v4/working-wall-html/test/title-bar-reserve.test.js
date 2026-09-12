"use strict";

// The height a card reserves for its title bar is the height the title bar
// draws at.
//
// The run this came from: the panel renderers reserved a flat 1.6in (1.8 with
// step badges) for the title while an A3 bar actually drew at about 2.19in.
// Nothing set a line-height, so the bar's height was decided by Comic Sans' own
// line box (nearer 1.4 than the 1.25 the layout constant assumes) rather than by
// anything the layout pass could see. A card fitted against six tenths of an
// inch it did not have ran past the bottom of the sheet, and a Year 4
// place-value wall shipped with "times the place to its right." alone on a
// second A3 page.
//
// Two moves, both already used by render-grids for reference tables: pin the
// line-height in the CSS so the bar's height is decided here, and reserve
// exactly that. These hold both halves together, because either one alone is
// how the drift got in.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const style = require("../style.json");
const {
  titleBarHeightInches,
  TITLE_BAR_LINE_HEIGHT,
  TITLE_BAR_PADDING_DXA,
} = require("../src/layout");
const {
  renderStickyKnowledge,
  renderWorkedExample,
  renderMisconception,
  renderSentenceStem,
  renderVocabDefinition,
} = require("../src/render-panels");

const FIXTURES_DIR = path.join(__dirname, "..", "test-fixtures-a3");
const A3_LANDSCAPE = { size: "A3", orientation: "landscape" };

// The title bar is the outer div: its own padding top and bottom, around a
// child line box of font-size x line-height.
function drawnTitleInches(html) {
  const pad = html.match(/background:#[0-9A-Fa-f]{6};padding:([\d.]+)mm;/);
  const inner = html.match(/font-size:(\d+)pt;line-height:([\d.]+);/);
  assert.ok(pad, "could not find the title bar's padding in the rendered card");
  assert.ok(inner, "the title bar did not pin a line-height, so its height is the font's to decide");
  const padIn = (Number(pad[1]) / 25.4) * 2;
  return padIn + (Number(inner[1]) * Number(inner[2])) / 72;
}

const CARDS = {
  stickyKnowledge: [
    renderStickyKnowledge,
    { type: "stickyKnowledge", page: A3_LANDSCAPE, title: "Remember", items: [{ text: "A circuit needs a closed path." }] },
  ],
  workedExample: [
    renderWorkedExample,
    {
      type: "workedExample",
      page: A3_LANDSCAPE,
      title: "How to do it",
      items: [{ label: "Step 1", text: "Find the tens column." }],
    },
  ],
  misconception: [
    renderMisconception,
    {
      type: "misconception",
      page: A3_LANDSCAPE,
      title: "Look out for",
      items: [{ label: "Don't", text: "Leave a wire loose." }, { label: "Do", text: "Clip each wire firmly." }],
    },
  ],
  sentenceStem: [
    renderSentenceStem,
    { type: "sentenceStem", page: A3_LANDSCAPE, title: "Say it like this", items: [{ text: "I think ___ because ___." }] },
  ],
  vocabDefinition: [
    renderVocabDefinition,
    {
      type: "vocabDefinition",
      page: A3_LANDSCAPE,
      title: "Exchange",
      items: [{ text: "Swapping ten in one column for one next door." }],
    },
  ],
};

for (const [name, [renderer, card]] of Object.entries(CARDS)) {
  test(`${name} draws its title bar at the height it reserves`, () => {
    const html = renderer(card, style, FIXTURES_DIR, { svgImages: {} });
    const titlePt = Number(html.match(/font-size:(\d+)pt;line-height:/)[1]);
    const drawn = drawnTitleInches(html);
    const reserved = titleBarHeightInches(titlePt);
    assert.ok(
      Math.abs(drawn - reserved) < 0.01,
      `${name} draws its title bar at ${drawn.toFixed(3)}in and reserves ${reserved.toFixed(3)}in. ` +
        `The panel below is fitted to what is reserved, so the difference is room the card thinks it has.`
    );
  });
}

test("the padding the reserve assumes is the padding the bar is given", () => {
  const html = renderStickyKnowledge(CARDS.stickyKnowledge[1], style, FIXTURES_DIR, { svgImages: {} });
  const pad = Number(html.match(/background:#[0-9A-Fa-f]{6};padding:([\d.]+)mm;/)[1]);
  const expected = (TITLE_BAR_PADDING_DXA / 1440) * 25.4;
  assert.ok(
    Math.abs(pad - expected) < 0.05,
    `the title bar is padded ${pad}mm and titleBarHeightInches assumes ${expected.toFixed(2)}mm`
  );
});

test("no panel renderer reserves a flat title allowance any more", () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "src", "render-panels.js"), "utf8");
  const flat = src.match(/titleAreaInches[^\n]*?\b\d+\.\d+\s*\+/g) || [];
  const offenders = flat.filter((m) => !m.includes("BADGE_COLUMN_INCHES"));
  assert.deepStrictEqual(
    offenders,
    [],
    `a flat inch allowance is back in render-panels: ${offenders.join(", ")}. ` +
      `Reserve titleBarHeightInches(titlePt) so the number follows the title that is actually set.`
  );
  assert.ok(
    TITLE_BAR_LINE_HEIGHT > 0,
    "TITLE_BAR_LINE_HEIGHT must stay exported; the renderers pin the CSS to it"
  );
});
