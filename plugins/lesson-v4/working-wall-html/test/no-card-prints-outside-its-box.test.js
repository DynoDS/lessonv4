"use strict";

// NO WALL CARD PRINTS OUTSIDE ITS BOX.
//
// A standing guard across every card type the wall draws. It builds every one
// of the engine's own A3 fixtures, a diagram section (which no fixture holds),
// and every saved wall this checkout has beside the plugin, prints each page in
// the Chrome the wall prints with, and fails if any line of text lies outside
// the nearest drawn box around it (a fill or a border: a panel, a strip, a
// cell, a chip) or outside the page. Release 7A's audit of 26 September 2026
// found one card doing it (a diagram section's heading, by 2.3px) once the
// panel cards were planned as drawn; this keeps any later change from bringing
// an overflow back unnoticed. A saved wall the build refuses draws nothing and
// is skipped; the fixtures and the section must draw every card type.
//
// It also builds the third check's arrow cards: worked examples and sticky
// facts with an arrow on most lines, landscape and portrait, beside a photo and
// on their own. Drawn from Segoe Print, a line holding an arrow printed 28%
// taller than planned and 45 of 178 such cards printed past their panel; the
// arrows are now drawn from Arial, inside the line (shared.js, "Wall Arrows").

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
// Mark every page with the card type that drew it, before build.js takes the
// renderers.
for (const name of ["render-panels", "render-grids", "render-display", "render-overview", "render-section", "render-steps"]) {
  const renderers = require(`../src/${name}`);
  for (const [key, render] of Object.entries(renderers)) {
    if (!/^render/.test(key) || typeof render !== "function") continue;
    renderers[key] = (card, ...rest) => {
      const marker = `<div data-card-type="${card.type}" style="display:none"></div>`;
      const drawn = render(card, ...rest);
      return Array.isArray(drawn) ? drawn.map((page) => marker + page) : marker + drawn;
    };
  }
}
const { build } = require("../build.js");

const FIXTURES = path.join(__dirname, "..", "test-fixtures-a3");
const REPO = path.resolve(__dirname, "..", "..", "..", "..");

// The saved lesson "Counting through zero" (Year 4 maths): the section whose
// heading printed past its strip.
const SECTION = {
  topic: "Counting through zero",
  cards: [{
    type: "diagramSection", page: { size: "A3", orientation: "landscape" }, title: "Counting through zero",
    parts: [
      {
        heading: "Count backwards in ones.",
        visual: { type: "numberLine", start: -5, end: 5, interval: 1, labels: "all", jumps: [{ from: 2, to: 1 }, { from: 1, to: 0 }, { from: 0, to: -1 }, { from: -1, to: -2 }] },
        notes: ["2, 1, 0, −1, −2"],
      },
      {
        heading: "Count forwards in ones.",
        visual: { type: "numberLine", start: -5, end: 5, interval: 1, labels: "all", jumps: [{ from: -3, to: -2 }, { from: -2, to: -1 }, { from: -1, to: 0 }, { from: 0, to: 1 }] },
        notes: ["−3, −2, −1, 0, 1"],
      },
    ],
  }],
};

// A method told step by step, with its longest card: the column sum whose
// "Exchange" step wraps its key line and its sentence (5 October 2026).
const stepSum = (answer, carry) => ({ type: "place-value-chart", columns: ["Hundreds", "Tens", "Ones"], calculation: { operator: "+", numbers: ["247", "135"], ...(answer ? { answer } : {}), ...(carry ? { carry } : {}) } });
const STEPS = {
  topic: "Column addition step by step",
  cards: [{
    type: "stepByStep", page: { size: "A3", orientation: "portrait" }, title: "How to add in columns", example: "247 + 135",
    steps: [
      { heading: "Line up the digits", text: ["Ones under ones.", "Tens under tens."], visual: stepSum() },
      { heading: "Add the ones", key: "7 + 5 = 12", text: "Write the 2 in the ones.", visual: stepSum("2"), note: ["7 + 5 = 12", "Write 2 ones"], point: "ones answer" },
      { heading: "Exchange", key: "12 ones = 1 ten and 2 ones", text: "Write a small 1 under the tens.", visual: stepSum("2", { Tens: "1" }), note: ["10 ones", "for 1 ten"], point: "tens carry" },
      { heading: "Add the tens", key: "4 + 3 + 1 = 8", text: "Add the small 1 too.", visual: stepSum("82", { Tens: "1" }), note: ["4 + 3 + 1 = 8"], point: "tens answer" },
      { heading: "Add the hundreds", key: "2 + 1 = 3", text: "The answer is 382.", visual: stepSum("382", { Tens: "1" }), note: ["247 + 135", "= 382"], point: "hundreds answer" },
    ],
  }],
};

// The arrow cards, each on a wall of its own with a photo beside it where it
// has one.
const BANK = "Round 3,462 → 3,500 because the tens digit is 6 → round up and 3,450 → 3,500 too since halfway rounds up → 3,500".split(" ");
function arrowSentence(length, seed) {
  const words = [];
  let index = seed;
  while (words.join(" ").length < length) words.push(BANK[index++ % BANK.length]);
  let text = words.join(" ");
  while (text.length > length && text.includes(" ")) text = text.slice(0, text.lastIndexOf(" "));
  return text[0].toUpperCase() + text.slice(1) + ".";
}
function arrowWalls(root) {
  const specs = [];
  for (const orientation of ["landscape", "portrait"]) for (const photo of [true, false]) for (const count of [1, 3, 5]) for (const length of [30, 50, 70]) {
    const page = { size: "A3", orientation };
    const items = Array.from({ length: count }, (_, k) => ({ label: `Step ${k + 1}`, text: arrowSentence(length, k * 4 + length) }));
    const cards = [{ type: "workedExample", page, title: "How to round", items }];
    if (count <= 3) cards.push({ type: "stickyKnowledge", page, title: "Remember", items: items.map((item) => ({ text: item.text })) });
    for (const card of cards) {
      const dir = path.join(root, `arrows-${specs.length}`);
      fs.mkdirSync(path.join(dir, "photos"), { recursive: true });
      if (photo) {
        fs.copyFileSync(path.join(FIXTURES, "photos", "pizza.jpg"), path.join(dir, "photos", "pizza.jpg"));
        card.photo = "photos/pizza.jpg";
      }
      const spec = path.join(dir, "working-wall.json");
      fs.writeFileSync(spec, JSON.stringify({ topic: "Arrows", cards: [card] }));
      specs.push(spec);
    }
  }
  return specs;
}

// Every saved wall beside the plugin in this checkout (none in an installed
// copy), found by name.
function savedWalls() {
  const found = [];
  const walk = (dir, depth) => {
    if (depth > 6) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, depth + 1);
      else if (entry.name === "working-wall.json") found.push(full);
    }
  };
  for (const entry of fs.readdirSync(REPO, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    if (["plugins", "plans", "node_modules"].includes(entry.name)) continue;
    walk(path.join(REPO, entry.name), 1);
  }
  return found;
}

// The card types build.js draws, read from its own table.
function cardTypes() {
  const source = fs.readFileSync(path.join(__dirname, "..", "build.js"), "utf8");
  const table = source.match(/const RENDERERS = \{([\s\S]*?)\};/)[1];
  return [...table.matchAll(/^\s*(\w+):/gm)].map((match) => match[1]).sort();
}

async function buildQuietly(specPath, outDir) {
  const log = console.log;
  const warn = console.warn;
  console.log = () => {};
  console.warn = () => {};
  try {
    return await build(specPath, outDir);
  } catch (err) {
    return null;
  } finally {
    console.log = log;
    console.warn = warn;
  }
}

// Every page: its card type, and the text lying furthest outside its box.
async function audit(browser, htmlPath) {
  const page = await browser.newPage();
  try {
    await page.setContent(fs.readFileSync(htmlPath, "utf8"), { waitUntil: "load" });
    await page.evaluate(async () => {
      if (document.fonts) await document.fonts.ready;
    });
    return await page.evaluate(() => {
      const drawnBox = (el) => {
        const s = getComputedStyle(el);
        const fill = s.backgroundColor && s.backgroundColor !== "rgba(0, 0, 0, 0)" && s.backgroundColor !== "transparent";
        const border = ["Top", "Right", "Bottom", "Left"].some((side) => parseFloat(s[`border${side}Width`]) > 0 && s[`border${side}Style`] !== "none");
        return fill || border || el.classList.contains("page-core");
      };
      return [...document.querySelectorAll(".page")].map((sheet) => {
        const marker = sheet.querySelector("[data-card-type]");
        let worst = 0;
        let words = "";
        const walker = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (!node.textContent.trim()) continue;
          let box = node.parentElement;
          while (box && !drawnBox(box)) box = box.parentElement;
          if (!box) continue;
          const edge = box.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const r of range.getClientRects()) {
            const out = Math.max(edge.top - r.top, r.bottom - edge.bottom, edge.left - r.left, r.right - edge.right);
            if (out > worst) {
              worst = out;
              words = node.textContent.trim().slice(0, 50);
            }
          }
        }
        return { type: marker ? marker.getAttribute("data-card-type") : "unknown", worst, words };
      });
    });
  } finally {
    await page.close();
  }
}

test("no wall card prints outside its box, on every fixture, a diagram section and every saved wall", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "wall-boxes-"));
  const sectionPath = path.join(root, "section.json");
  fs.writeFileSync(sectionPath, JSON.stringify(SECTION));
  const stepsPath = path.join(root, "steps.json");
  fs.writeFileSync(stepsPath, JSON.stringify(STEPS));
  const specs = fs.readdirSync(FIXTURES).filter((name) => name.endsWith(".json")).map((name) => ({ spec: path.join(FIXTURES, name), own: true }))
    .concat([{ spec: sectionPath, own: true }, { spec: stepsPath, own: true }])
    .concat(arrowWalls(root).map((spec) => ({ spec, own: true, arrows: true })))
    .concat(savedWalls().map((spec) => ({ spec, own: false })));
  const browser = await chrome.launchBrowser();
  const drawn = new Set();
  const outside = [];
  let arrowSheets = 0;
  try {
    for (const [index, { spec, own, arrows }] of specs.entries()) {
      const outDir = path.join(root, String(index));
      fs.mkdirSync(outDir);
      const htmlPath = await buildQuietly(spec, outDir);
      if (!htmlPath) continue;
      for (const sheet of await audit(browser, htmlPath)) {
        if (own) drawn.add(sheet.type);
        if (arrows) arrowSheets += 1;
        if (sheet.worst > 0.5) {
          outside.push(`${path.relative(REPO, spec)} (${sheet.type}): "${sheet.words}" ${sheet.worst.toFixed(1)}px outside its box`);
        }
      }
    }
  } finally {
    await browser.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
  assert.deepStrictEqual(outside, [], outside.join("\n"));
  assert.ok(arrowSheets >= 40, `only ${arrowSheets} arrow cards were drawn`);
  assert.deepStrictEqual([...drawn].sort(), cardTypes(), "the fixtures and the section should draw every card type");
});
