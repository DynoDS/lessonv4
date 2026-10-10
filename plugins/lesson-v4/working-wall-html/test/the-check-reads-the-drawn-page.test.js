"use strict";

// WHEN THE WALL CHECK SAYS FINE, THE PRINTED PAGE IS FINE.
//
// The run this came from: the 20-lesson stress test of 7 October 2026. A Year 5
// wall on the perimeter and area of an L-shape passed the layout check and
// printed its green answer strip 12mm below the bottom of its part. The wall
// worker found it only by building a copy and looking, and shortened two lines
// to fit, losing "Rectangle 1:" and "Rectangle 2:".
//
// The check was a set of sums about what Chrome would draw, and nothing read
// the page Chrome drew. So these pin the outcome on the drawn page:
//   - that poster, with its labels, builds with everything inside its parts;
//   - when a sum is wrong (made wrong here on purpose), a small overrun is
//     taken off the drawing and every word is kept, and a large one is refused
//     with its size, where the sums alone print the page past its part;
//   - words printed past a box or past the page are reported by the reader.
//
// The teacher's answers, from pictures of that poster (10 October 2026): the
// words shrink first, to their smallest readable size; then the drawing may
// give up a little, up to about a tenth; anything more goes back to be
// rewritten.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const chrome = require("../../worksheet-html/src/chrome");
// The page is measured as HTML, so the build is given no PDF step and writes
// the HTML instead.
chrome.htmlToPdf = async () => {
  throw new Error("HTML only");
};

// A sum made wrong on purpose: while `miscount` holds a line, that line is
// planned on one row however many it prints on. Set before the wall is loaded,
// because the section takes the function when it loads.
const layout = require("../src/layout");
const realWrappedLines = layout.wrappedLines;
let miscount = null;
layout.wrappedLines = (text, ...rest) => (miscount && text === miscount ? 1 : realWrappedLines(text, ...rest));

const { build } = require("../build");
const { measurePages, edgeMessage } = require("../src/page-measure");

const L_SHAPE = {
  type: "polygon",
  shapes: [{
    vertices: [[0, 0], [10, 0], [10, 3], [4, 3], [4, 8], [0, 8]],
    sideLabels: ["10 cm", "3 cm", "A = 6 cm", "B = 5 cm", "4 cm", "8 cm"],
  }],
};
const PERIMETER = "Perimeter = 10 + 3 + 6 + 5 + 4 + 8 = 36 cm";

// The stress test's poster, with the two labels the worker had to cut.
const PERIMETER_AND_AREA = {
  type: "diagramSection",
  page: { size: "A3", orientation: "landscape" },
  title: "Perimeter and area",
  parts: [
    { heading: "The perimeter", visual: L_SHAPE, notes: ["A = 10 − 4 = 6 cm", "B = 8 − 3 = 5 cm"], result: PERIMETER },
    { heading: "The area", visual: L_SHAPE, notes: ["Rectangle 1: 10 × 3 = 30 cm²", "Rectangle 2: 4 × 5 = 20 cm²"], result: "Area = 30 + 20 = 50 cm²" },
  ],
};

// One idea with a sheet to itself: a tall shape on a tall sheet, so the
// drawing is as tall as its room, with its result under it.
const TALL_SHAPE = {
  type: "polygon",
  shapes: [{ vertices: [[0, 0], [5, 0], [5, 12], [0, 12]], sideLabels: ["5 cm", "12 cm", "5 cm", "12 cm"] }],
};
const TALL_SHEET = {
  type: "diagramSection",
  page: { size: "A3", orientation: "portrait" },
  title: "Perimeter",
  parts: [{ heading: "The perimeter", visual: TALL_SHAPE, result: PERIMETER }],
};

async function buildCard(card, options = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wall-drawn-page-"));
  const spec = path.join(dir, "working-wall.json");
  fs.writeFileSync(spec, JSON.stringify({ topic: "Drawn page", yearGroup: "Year 5", lessonSlug: "drawn-page", rationaleNote: "test", cards: [card] }));
  const lines = [];
  const log = console.log;
  const warn = console.warn;
  console.log = (...args) => lines.push(args.join(" "));
  console.warn = () => {};
  try {
    const out = await build(spec, dir, options);
    return { dir, out, lines };
  } catch (error) {
    return { dir, error, lines };
  } finally {
    console.log = log;
    console.warn = warn;
  }
}

// Each part as Chrome drew it: how far its lowest piece sits past the inside
// of its panel, how tall its drawing printed, and its words.
async function drawnParts(browser, htmlPath) {
  const page = await browser.newPage();
  try {
    await page.setContent(fs.readFileSync(htmlPath, "utf8"), { waitUntil: "load" });
    await page.evaluate(async () => {
      if (document.fonts) await document.fonts.ready;
    });
    return await page.evaluate(() => [...document.querySelectorAll("[data-wall-part]")].map((part) => {
      const style = getComputedStyle(part);
      const inside = part.getBoundingClientRect().bottom - parseFloat(style.borderBottomWidth) - parseFloat(style.paddingBottom);
      const result = part.querySelector("[data-part='result']");
      const figure = part.querySelector("[data-wall-figure] img");
      return {
        pastMm: ((result ? result.getBoundingClientRect().bottom : inside) - inside) * 25.4 / 96,
        figureMm: figure ? figure.getBoundingClientRect().height * 25.4 / 96 : 0,
        text: part.textContent,
      };
    }));
  } finally {
    await page.close();
  }
}

test("the perimeter and area poster keeps its labels and prints inside its parts", async () => {
  const browser = await chrome.launchBrowser();
  try {
    const checked = await buildCard(PERIMETER_AND_AREA, { validateOnly: true });
    assert.ok(!checked.error, checked.error && checked.error.message);
    assert.ok(checked.lines.some((line) => /^WORKING_WALL_LAYOUT_OK: /.test(line)));

    const built = await buildCard(PERIMETER_AND_AREA);
    assert.ok(!built.error, built.error && built.error.message);
    const parts = await drawnParts(browser, built.out);
    assert.equal(parts.length, 2);
    for (const part of parts) assert.ok(part.pastMm <= 0.3, `a part prints ${part.pastMm.toFixed(1)}mm past the inside of its panel`);
    assert.ok(parts[1].text.includes("Rectangle 1: 10 × 3 = 30 cm²"));
    assert.ok(parts[1].text.includes("Rectangle 2: 4 × 5 = 20 cm²"));
    // The same shape in both parts prints one size.
    assert.ok(Math.abs(parts[0].figureMm - parts[1].figureMm) < 0.5, `${parts[0].figureMm} and ${parts[1].figureMm}`);
  } finally {
    await browser.close();
  }
});

test("a small overrun the sums missed comes off the drawing, and the words are kept", async () => {
  const browser = await chrome.launchBrowser();
  miscount = PERIMETER;
  try {
    // On a tall sheet the result prints on two lines and is planned on one.
    const card = TALL_SHEET;

    // The sums alone: the page prints past its part, and nothing says so.
    const bySums = await buildCard(card, { measure: false });
    assert.ok(!bySums.error, bySums.error && bySums.error.message);
    const [before] = await drawnParts(browser, bySums.out);
    assert.ok(before.pastMm > 5, `the miscounted line should overrun its part; it is ${before.pastMm.toFixed(1)}mm past`);

    // The drawn page read: the drawing gives the overrun up, within a tenth.
    const measured = await buildCard(card);
    assert.ok(!measured.error, measured.error && measured.error.message);
    const [after] = await drawnParts(browser, measured.out);
    assert.ok(after.pastMm <= 0.3, `still ${after.pastMm.toFixed(1)}mm past the inside of its panel`);
    assert.ok(after.text.includes(PERIMETER), "the result lost words");
    assert.ok(after.figureMm < before.figureMm, "the drawing gave nothing up");
    assert.ok(after.figureMm >= before.figureMm * 0.9 - 0.5, `the drawing gave up more than a tenth: ${before.figureMm.toFixed(1)}mm to ${after.figureMm.toFixed(1)}mm`);
  } finally {
    miscount = null;
    await browser.close();
  }
});

test("an overrun too big for the drawing to give up is refused with its size, by the check too", async () => {
  miscount = PERIMETER;
  try {
    // Half a landscape sheet: the drawing is short, so a whole line is more
    // than a tenth of it.
    const built = await buildCard(PERIMETER_AND_AREA);
    assert.ok(built.error, "the build passed a part that prints past its panel");
    assert.match(built.error.message, /^WALL_PART_TOO_TALL: .*part 1 \("The perimeter"\) prints \d+\.\dmm taller than its panel/);
    assert.match(built.error.message, /sheet of its own/);
    assert.deepStrictEqual(fs.readdirSync(built.dir).filter((name) => /\.(pdf|html)$/.test(name)), []);

    const checked = await buildCard(PERIMETER_AND_AREA, { validateOnly: true });
    assert.ok(checked.error, "the check said OK to a part that prints past its panel");
    assert.match(checked.error.message, /^WALL_PART_TOO_TALL: /);
    assert.ok(!checked.lines.some((line) => /WORKING_WALL_LAYOUT_OK/.test(line)));
  } finally {
    miscount = null;
  }
});

test("words past the edge of a box, and words the page cuts off, are reported", async () => {
  const browser = await chrome.launchBrowser();
  const page = (inner) => `<!doctype html><html><head><style>html,body{margin:0}.page{box-sizing:border-box;width:420mm;height:297mm;overflow:hidden;position:relative}</style></head><body><div class="page"><div class="page-core">${inner}</div></div></body></html>`;
  try {
    const clean = await measurePages(browser, page(`<div style="border:1mm solid #000;width:200mm;height:60mm;font-size:36pt;">Inside the box</div>`));
    assert.deepStrictEqual(clean.edges, []);

    const boxed = await measurePages(browser, page(`<div style="border:1mm solid #000;width:200mm;height:20mm;font-size:36pt;line-height:1.3;">A first line<br>A second line<br>A third line</div>`));
    assert.equal(boxed.edges.length, 1);
    assert.equal(boxed.edges[0].side, "bottom");
    assert.match(edgeMessage(boxed.edges[0]), /^WALL_PRINTS_PAST_ITS_BOX: page 1: "A third line" prints \d+(\.\d)?mm below the bottom of the box that starts "A first line/);

    const cut = await measurePages(browser, page(`<div style="margin-top:290mm;font-size:36pt;">Lost off the page</div>`));
    assert.equal(cut.edges.length, 1);
    assert.equal(cut.edges[0].frame, "the page");
    assert.match(edgeMessage(cut.edges[0]), /where the page cuts it off/);
  } finally {
    await browser.close();
  }
});
