"use strict";

// EVERY ARROW ON THE WALL IS DRAWN FROM "WALL ARROWS", AS HEAVY AS THE DIGITS.
//
// Comic Sans MS has no arrows. Left to the stack's next font, Segoe Print, an
// arrow drew a line 1.78 times its type and printed its line 28% taller than
// planned; drawn from Arial it was a hairline beside the digits (release 7A's
// third check, 26 September 2026). "Wall Arrows" (shared.js, PAGE_CSS) is
// Segoe Print's own arrows drawn 40% larger and held inside Comic Sans's line.
// Every font stack the wall writes carries the face: the panels, the title bar
// and figure captions, tables, grids and chips, the display cards, the
// overviews, the diagram sections and the page's own default. This builds an
// arrow into each, and fails if any arrow is drawn another way (Segoe Print's
// or Arial's arrow is about 1em across; the face's is 1.4em), if a line holding
// an arrow is taller than one without, or if the arrow's shaft is thinner than
// the digits'.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const chrome = require("../../worksheet-html/src/chrome");
// Print nothing: the build then keeps each page as HTML, which is what is measured.
chrome.htmlToPdf = async () => {
  throw new Error("measured, not printed");
};
const { build } = require("../build.js");
const { PAGE_CSS } = require("../src/shared.js");

const PAGE = { size: "A3", orientation: "landscape" };
const PHOTO = "photos/pizza.jpg";

// One wall per place the face was written into, each with an arrow in the
// words that place draws.
const WALLS = {
  "a panel card's words and its title bar": { type: "stickyKnowledge", page: PAGE, title: "Round → up", items: [{ text: "3,462 → 3,500 because 6 tens → round up." }] },
  "a stacked figure's caption": { type: "workedExample", page: PAGE, title: "Count on", visual: { type: "numberLine", from: 40, to: 90, step: 10, label: "Each jump → 10 more." }, items: [{ label: "Step 1", text: "Find the first number." }] },
  "a table's cells": { type: "referenceTable", page: PAGE, title: "Rounding", columns: ["Number", "Rounded"], rows: [["3,462", "→ 3,500"], ["3,449", "→ 3,400"]] },
  "a section heading": { type: "sectionHeading", page: PAGE, heading: "Round → up", colour: "DC2626" },
  "an overview's callouts": { type: "heroCallouts", page: PAGE, title: "The canopy", heroPhoto: PHOTO, heroCaption: "Leaves → shade", groups: [
    { title: "What we see", items: ["Leaves → shade", "Rain → drips down"] },
    { title: "Why", items: ["Sun → the top layer"] },
  ] },
  "a diagram section's notes": { type: "diagramSection", page: PAGE, title: "Counting through zero", parts: [
    { heading: "Count backwards.", visual: { type: "numberLine", start: -5, end: 5, interval: 1, labels: "all" }, notes: ["2 → 1 → 0 → −1"] },
    { heading: "Count forwards.", visual: { type: "numberLine", start: -5, end: 5, interval: 1, labels: "all" }, notes: ["−1 → 0 → 1"] },
  ] },
};

async function buildWall(root, name, card) {
  const dir = path.join(root, name.replace(/[^a-z0-9]+/gi, "-"));
  fs.mkdirSync(path.join(dir, "photos"), { recursive: true });
  fs.copyFileSync(path.join(__dirname, "..", "test-fixtures-a3", "photos", "pizza.jpg"), path.join(dir, "photos", "pizza.jpg"));
  const specPath = path.join(dir, "working-wall.json");
  fs.writeFileSync(specPath, JSON.stringify({ topic: "Arrows", cards: [card] }));
  const log = console.log;
  const warn = console.warn;
  console.log = () => {};
  console.warn = () => {};
  try {
    return await build(specPath, dir);
  } finally {
    console.log = log;
    console.warn = warn;
  }
}

// Every arrow on the page: how wide it is for its type size.
async function arrowWidths(browser, html) {
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(async () => {
      if (document.fonts) await document.fonts.ready;
    });
    return await page.evaluate(() => {
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const text = node.textContent;
        for (let at = text.indexOf("→"); at >= 0; at = text.indexOf("→", at + 1)) {
          const range = document.createRange();
          range.setStart(node, at);
          range.setEnd(node, at + 1);
          const size = parseFloat(getComputedStyle(node.parentElement).fontSize);
          out.push({ em: range.getBoundingClientRect().width / size, words: text.trim().slice(0, 40) });
        }
      }
      return out;
    });
  } finally {
    await page.close();
  }
}

test("every place the wall writes words draws its arrows from the wall's arrow face", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "wall-arrows-"));
  const browser = await chrome.launchBrowser();
  try {
    for (const [name, card] of Object.entries(WALLS)) {
      const htmlPath = await buildWall(root, name, card);
      const arrows = await arrowWidths(browser, fs.readFileSync(htmlPath, "utf8"));
      assert.ok(arrows.length > 0, `${name}: no arrow was drawn`);
      for (const arrow of arrows) {
        assert.ok(arrow.em > 1.3, `${name}: the arrow in "${arrow.words}" is ${arrow.em.toFixed(2)}em across, not the wall's own arrow`);
      }
    }
    // The page's own default, for words that name no font of their own.
    const bare = await arrowWidths(browser, `<html><head><style>${PAGE_CSS}</style></head><body><div style="font-size:60pt;font-weight:bold">3,462 → 3,500</div></body></html>`);
    assert.ok(bare.length === 1 && bare[0].em > 1.3, `the page's default draws its arrow ${bare.length ? bare[0].em.toFixed(2) : "nowhere"}em across`);
  } finally {
    await browser.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("an arrow sits within its line and reads as heavy as the digits beside it", async () => {
  const sharp = require("sharp");
  const stack = "'Comic Sans MS', 'Wall Arrows', 'Segoe Print', cursive";
  const browser = await chrome.launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 300 });
    await page.setContent(
      `<html><head><style>${PAGE_CSS}</style></head><body style="margin:0;background:#fff">` +
      `<div id="plain" style="font-family:${stack};font-weight:bold;font-size:60pt;display:inline-block">3,462 3,500</div><br>` +
      `<div id="arrow" style="font-family:${stack};font-weight:bold;font-size:60pt;display:inline-block">3,462 <span id="a">→</span> 3,500</div>` +
      `</body></html>`,
      { waitUntil: "load" }
    );
    await page.evaluate(async () => {
      if (document.fonts) await document.fonts.ready;
    });
    const box = await page.evaluate(() => {
      const r = (id) => {
        const b = document.getElementById(id).getBoundingClientRect();
        return { top: b.top, left: b.left, width: b.width, height: b.height };
      };
      return { plain: r("plain").height, line: r("arrow"), arrow: r("a") };
    });
    assert.equal(box.line.height, box.plain, "a line holding an arrow is taller than one without");
    const png = await page.screenshot({ clip: { x: 0, y: box.line.top, width: 900, height: box.line.height } });
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    const dark = (x, y) => data[(y * info.width + x) * info.channels] < 110;
    // The shaft: the thickest dark run down the column through the arrow's middle.
    const x = Math.round(box.arrow.left + box.arrow.width / 2);
    let shaft = 0;
    let run = 0;
    for (let y = 0; y < info.height; y++) {
      run = dark(x, y) ? run + 1 : 0;
      shaft = Math.max(shaft, run);
    }
    // Comic Sans MS Bold's digits at 60pt stroke 11 to 13px; Arial Bold's
    // arrow is 4px and Segoe Print's own 8px.
    assert.ok(shaft >= 10, `the arrow's shaft is ${shaft}px at 60pt, fainter than the digits beside it`);
  } finally {
    await browser.close();
  }
});
