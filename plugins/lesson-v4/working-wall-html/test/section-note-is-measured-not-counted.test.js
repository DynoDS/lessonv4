"use strict";

// A note under a section's picture is refused by the lines it prints, not by
// a count of its letters.
//
// The run this came from: the 20-lesson stress test of 7 October 2026. Under a
// half-sheet picture the wall allowed a note 52 letters, 26 a line at a
// guessed width, where the page prints about 30. Five lessons had sentences
// shortened or left off; two of those sentences (53 and 58 letters) fit their
// two lines as written. These pin the outcome on the printed page: the
// sentence that fits is built with every word, in the two lines Chrome gives
// it, and the sentence that needs a third line is still refused, by name.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const chrome = require("../../worksheet-html/src/chrome");
// The page is measured as HTML, so the build is given no PDF step and writes
// the HTML instead (it reads this when it is loaded).
chrome.htmlToPdf = async () => {
  throw new Error("HTML only");
};
const { build } = require("../build");

// Two compact pictures, so the parts stand side by side, half a sheet each.
const CLOCK = { type: "clock", time: "7:15" };
const FITS = "After an exchange, the column on the left has 1 less.";
const TOO_LONG = "When the parts are smaller, you need more of them to make the same amount.";

function wall(note) {
  return {
    topic: "Measured note",
    yearGroup: "Year 4",
    lessonSlug: "measured-note",
    rationaleNote: "test",
    cards: [{
      type: "diagramSection",
      page: { size: "A3", orientation: "landscape" },
      title: "Under a picture",
      parts: [
        { heading: "One half", visual: CLOCK, notes: [note] },
        { heading: "The other half", visual: CLOCK, notes: ["quarter past 7"] },
      ],
    }],
  };
}

async function buildWall(note) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wall-note-"));
  const spec = path.join(dir, "working-wall.json");
  fs.writeFileSync(spec, JSON.stringify(wall(note)));
  const warn = console.warn;
  const log = console.log;
  console.log = () => {};
  try {
    return { dir, out: await build(spec, dir) };
  } catch (err) {
    return { dir, error: String(err.message || err) };
  } finally {
    console.warn = warn;
    console.log = log;
  }
}

test("a 53-letter sentence that fits two lines under a half-sheet picture is built whole", async () => {
  assert.equal(FITS.length, 53, "one letter past the old count of 52");
  const built = await buildWall(FITS);
  assert.equal(built.error, undefined, built.error);
  const browser = await chrome.launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(fs.readFileSync(built.out, "utf8"), { waitUntil: "load" });
    await page.evaluate(async () => {
      if (document.fonts) await document.fonts.ready;
    });
    const note = await page.evaluate((words) => {
      const el = [...document.querySelectorAll('[data-part="note"]')].find((n) => n.textContent === words);
      if (!el) return null;
      const range = document.createRange();
      range.selectNodeContents(el);
      const tops = new Set([...range.getClientRects()].map((r) => Math.round(r.top)));
      return { lines: tops.size, pt: parseFloat(getComputedStyle(el).fontSize) * 0.75 };
    }, FITS);
    assert.ok(note, "the whole sentence is on the page");
    assert.ok(note.lines <= 2, `it printed on ${note.lines} lines`);
    assert.ok(note.pt >= 35.9, `at ${note.pt}pt, no smaller than the wall's floor`);
  } finally {
    await browser.close();
    fs.rmSync(built.dir, { recursive: true, force: true });
  }
});

test("a sentence that needs a third line is still refused, and the refusal names its lines", async () => {
  const built = await buildWall(TOO_LONG);
  fs.rmSync(built.dir, { recursive: true, force: true });
  assert.ok(built.error, "the wall is refused");
  assert.match(built.error, /part 1: item 1 takes 3 lines at 36pt, and 2 is the most one item may take/);
});
