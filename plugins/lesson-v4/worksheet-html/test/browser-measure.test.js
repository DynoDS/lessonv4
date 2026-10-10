"use strict";

// The page is measured, not guessed (9 October 2026).
//
// On the sheets of twenty real lessons the helpers' arithmetic was more than
// 3mm taller than the browser in 43 of 83 zones and more than 1mm shorter in
// 11, so sheets that fitted were refused and cut, and sheets that passed came
// back clipped (the stress test of 7 October 2026). These hold the repairs:
// words set out with their real letter widths, each piece measured in the
// browser before a page is laid out, the planners' tool printing heights at
// the widths a sheet really gives, the 43mm strip being 43mm, and a short
// answer line asking only for the width it uses.

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const helpers = require("../src/helpers");
const { linesFor } = require("../src/helpers/shared");
const { calibrate } = require("../src/browser-measure");
const { contentArea } = require("../src/render");
const { EDGE_MM, TRIM_STRIP_MM, pageSize } = require("../src/page");
const { measuredCorrections } = require("../src/settle-fit");

function hasChrome() {
  try {
    return Boolean(require("../src/chrome").findChrome());
  } catch {
    return false;
  }
}

const WORD_BANK = {
  helper: "chip-bank",
  title: "Word bank",
  text: "Words you can use:",
  chips: ["rotates", "faces the Sun", "turns away", "so", "because"],
};

test("words are set out a word at a time with their real letter widths", () => {
  // Narrow letters: thirteen characters that an average letter width called
  // 27.5mm, and so two lines in a 27mm column, where Comic Sans sets them in
  // 26.2mm on one.
  assert.equal(linesFor("Tell us when:", 27), 1);
  // A line breaks at a space, never inside a word, so three words that each
  // nearly fill the line take three lines however few letters they hold.
  assert.equal(linesFor("wwwwwwww wwwwwwww wwwwwwww", 40), 3);
  // A blank counts at the width it prints, whatever was typed for it.
  assert.equal(linesFor("quarter ___ ___", 45, 11), 1);
  assert.equal(linesFor("quarter ___ ___", 30, 11), 2);
});

test("with no browser heights, every height is the helper's own arithmetic", () => {
  helpers.clearBrowserHeights();
  const estimate = helpers.REGISTRY["chip-bank"].measure(WORD_BANK, 144);
  assert.equal(helpers.measureContent(WORD_BANK, 144), estimate);
});

test("a piece is as tall as the browser draws it once the browser has been asked", { skip: !hasChrome() }, async () => {
  helpers.clearBrowserHeights();
  try {
    const estimate = helpers.measureContent(WORD_BANK, 144);
    const result = await calibrate(() => helpers.measureContent(WORD_BANK, 144));
    assert.equal(result.available, true);
    assert.equal(result.measured, 1);
    const drawn = helpers.measureContent(WORD_BANK, 144);
    // Five short chips sit on one row in 144mm. The arithmetic priced a second
    // row (44mm for 26mm), which is the over-estimate that had content cut.
    assert.ok(drawn < estimate - 5, `browser ${drawn}mm, arithmetic ${estimate}mm`);
    assert.ok(drawn > 15 && drawn < 32, `a one-row word bank is about 26mm, not ${drawn}mm`);
    // A width nobody measured is still answered, by the arithmetic.
    assert.equal(helpers.measureContent(WORD_BANK, 100), helpers.REGISTRY["chip-bank"].measure(WORD_BANK, 100));
  } finally {
    helpers.clearBrowserHeights();
  }
});

test("the browser may raise a piece that grows into spare height, and never lowers it", { skip: !hasChrome() }, async () => {
  // A sorting grid's rows have a height that was chosen. Drawn alone it shows
  // only its smallest self, which says nothing about the room it was given.
  const lines = { helper: "sort-grid", columns: ["Living", "Not living"], rows: 3 };
  helpers.clearBrowserHeights();
  try {
    const estimate = helpers.measureContent(lines, 144);
    await calibrate(() => helpers.measureContent(lines, 144));
    assert.ok(helpers.measureContent(lines, 144) >= estimate);
  } finally {
    helpers.clearBrowserHeights();
  }
});

test("a piece's minimum height comes down with it, so it is not refused as too short for itself", { skip: !hasChrome() }, async () => {
  helpers.clearBrowserHeights();
  try {
    const before = helpers.needsContent(WORD_BANK, 144).minHeightMm;
    await calibrate(() => helpers.measureContent(WORD_BANK, 144));
    const drawn = helpers.measureContent(WORD_BANK, 144);
    const after = helpers.needsContent(WORD_BANK, 144).minHeightMm;
    assert.ok(after <= drawn + 0.01, `minimum ${after}mm against a drawn ${drawn}mm`);
    assert.ok(after <= before);
    assert.equal(helpers.fits(WORD_BANK, 144, drawn).ok, true);
  } finally {
    helpers.clearBrowserHeights();
  }
});

test("the strip left clear is the 43mm the teacher ruled, and no more", () => {
  const portrait = contentArea({ orientation: "portrait" });
  const landscape = contentArea({ orientation: "landscape" });
  assert.equal(pageSize("portrait").heightMm - EDGE_MM - portrait.heightMm, TRIM_STRIP_MM);
  assert.equal(pageSize("landscape").widthMm - EDGE_MM - landscape.widthMm, TRIM_STRIP_MM);
});

test("a short answer line asks for the width it uses; a sentence keeps its 45mm", () => {
  const width = (text, extra = {}) =>
    helpers.needsContent({ helper: "instruction", text, ...extra }).minWidthMm;
  assert.ok(width("quarter ___ ___", { blankWidthMm: 11 }) <= 30);
  assert.equal(width("Draw the hands on each clock to show the time written under it."), 45);

  // Four clocks across a portrait sheet, each with its number and its line:
  // 232mm of a 174mm page before, and the reason a lesson was rewritten.
  const clock = (time) => ({
    question: true,
    stack: [
      { helper: "clock-row", clocks: [{ time, hands: true }] },
      { helper: "instruction", text: "quarter ___ ___", blankWidthMm: 11 },
    ],
  });
  const { numbered } = require("../src/worksheet");
  const [row] = numbered([{ row: ["2:15", "9:45", "12:45", "4:15"].map(clock) }]);
  assert.ok(helpers.needsContent(row).minWidthMm <= 174);
});

test("a zone reported twice is grown by the larger of what it was told", () => {
  const overflow = { zone: "a", kind: "zone-overflow", scrollHeight: 120, clientHeight: 100, scrollWidth: 10, clientWidth: 10 };
  const nudge = { zone: "a", kind: "child-clipped" };
  const wanted = measuredCorrections([overflow, nudge], {});
  assert.ok(wanted.a > 5, `the measured shortfall was overwritten by the 2mm nudge: ${wanted.a}mm`);
});

test("three picture cards are no wider than the row they are in", () => {
  const html = helpers.renderHelper(
    { helper: "card-row", columns: 3, cards: [1, 2, 3].map(() => ({ imageHref: "data:x", imageWidth: 1000, imageHeight: 1000 })) },
    174
  );
  const view = Number(/class="h-card-view" style="width:([0-9.]+)mm/.exec(html)[1]);
  const { INSET, RULE } = require("../src/tokens");
  const gap = Number(/gap: ([0-9.]+)mm/.exec(helpers.helperCss.slice(helpers.helperCss.indexOf(".h-cardrow-list {")))[1]);
  const cardMm = view + INSET.card.h * 2 + RULE.line * 2;
  assert.ok(cardMm * 3 + gap * 2 <= 174 + 0.01, `three cards and their gaps come to ${cardMm * 3 + gap * 2}mm`);
});

test("the measuring tool prices a piece at the widths a sheet gives, and one bad entry does not stop it", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "measure-real-widths-"));
  try {
    const file = path.join(dir, "content.json");
    fs.writeFileSync(
      file,
      JSON.stringify([
        { helper: "instruction", text: "Line one.\nLine two.\nLine three." },
        WORD_BANK,
      ])
    );
    const result = spawnSync(
      process.execPath,
      [path.join(__dirname, "..", "scripts", "suggest.js"), file, "5", "--measure"],
      { encoding: "utf8" }
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /Entry 1: cannot be measured as written\. INSTRUCTION_IS_A_LIST/);
    assert.match(result.stdout, /Entry 2: chip-bank: needs at least \d+mm of width\./);
    assert.match(result.stdout, /174mm wide \(portrait, full width\): \d+mm tall/);
    assert.match(result.stdout, /84mm wide \(portrait, one of two columns\): \d+mm tall/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("the designer's check draws the page, so it passes only what the build will pass", { skip: !hasChrome() }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "check-draws-the-page-"));
  try {
    const file = path.join(dir, "worksheet.json");
    fs.writeFileSync(
      file,
      JSON.stringify({
        meta: { lesson: "Day and night", yearGroup: 5, subject: "science" },
        sheets: {
          expected: {
            recording: "sheet",
            recordingReason: "Q1: the child writes on the printed lines.",
            layout: "auto",
            zones: [
              {
                stack: [
                  WORD_BANK,
                  { question: true, helper: "written-answers", items: [{ text: "Explain why we have day and night.", lines: 4 }] },
                ],
              },
            ],
          },
        },
        answerKey: { expected: [{ question: 1, answer: "The Earth rotates." }] },
      })
    );
    const result = spawnSync(
      process.execPath,
      [path.join(__dirname, "..", "scripts", "check-worksheet.js"), file],
      { encoding: "utf8" }
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /WORKSHEET_PREFLIGHT_OK/);
    assert.doesNotMatch(result.stderr, /No browser on this machine/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
