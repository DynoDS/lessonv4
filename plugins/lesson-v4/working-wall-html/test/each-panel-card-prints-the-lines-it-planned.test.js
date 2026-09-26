"use strict";

// EACH PANEL CARD PRINTS THE LINES IT PLANNED.
//
// Every wall card whose words wrap in a panel (sticky knowledge, a vocabulary
// definition, a worked example, sentence stems and the misconception pair) is
// sized by a plan of the page Chrome draws (layout.js, What the page draws).
// This builds cards of each type, beside a photo or a drawing, stacked over a
// figure, and on their own, prints each in the Chrome the wall prints with, and
// holds the plan to the page: every item takes the lines the plan gave it, the
// body is as tall as planned, and nothing strays into a panel's padding.

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
const { itemBlock } = require("../src/layout.js");
const { badgeInches, accentLabelPtFor, isStepLabel } = require("../src/visuals.js");
const style = require("../style.json");

// The fitter steps down from the card's largest size by 4pt at a time and
// takes the first size whose plan fits; an item may take at most five lines.

const PAGE = { size: "A3", orientation: "landscape" };
const PHOTO = "photos/pizza.jpg";
const DRAWING = { type: "line-pair", relationship: "perpendicular", form: "L", notation: "right-angle" };
const PARACHUTE = {
  type: "parachute-forces", canopyShape: "billowed-sheet", largeCanopyWidthRatio: 3, smallCanopyWidthRatio: 1,
  cordLengthRatio: 1, loadSizeRatio: 1, showEqualityTicks: true,
  labels: {
    largeCanopy: "More air to push out of the way", smallCanopy: "Less air to push out of the way",
    largeUpForce: "More air resistance", smallUpForce: "Less air resistance", downForce: "Gravity pulls down",
    cords: "Same cord length", loads: "Same load",
  },
};

const CARDS = [
  ["sticky knowledge beside a photo", { type: "stickyKnowledge", page: PAGE, title: "Remember", photo: PHOTO, items: [
    { text: "Christians celebrate Jesus' birth at Christmas." },
    { text: "They believe Jesus is God's Son." },
  ] }],
  ["a long sticky fact beside its photo", { type: "stickyKnowledge", page: PAGE, title: "Remember", photo: PHOTO, items: [
    { text: "Monasteries like Lindisfarne kept silver and gold and had nobody guarding them, so they were easy to raid." },
  ] }],
  // A figure made dominant sits beside the panel and reserves nothing beneath it.
  ["sticky knowledge beside a dominant figure", { type: "stickyKnowledge", page: PAGE, title: "Remember", visualScale: "dominant",
    visual: PARACHUTE, items: [{ text: "A bigger canopy pushes more air." }] }],
  // Arrows are drawn from Arial, inside the line's height (shared.js, "Wall
  // Arrows"); from Segoe Print a line holding one printed 28% taller.
  ["sticky knowledge with arrows", { type: "stickyKnowledge", page: PAGE, title: "Remember", items: [
    { text: "Round 3,462 → 3,500 because the tens digit is 6 → round up." },
    { text: "3,450 → 3,500 too, since halfway rounds up." },
  ] }],
  ["sticky knowledge on its own", { type: "stickyKnowledge", page: PAGE, title: "Remember", items: [
    { text: "A biome is a large region with a similar climate, landscape, plants and animals." },
    { text: "Most tropical rainforests grow close to the Equator." },
  ] }],
  ["a definition beside a drawing", { type: "vocabDefinition", page: PAGE, title: "Perpendicular", visual: DRAWING,
    definition: "Two lines are perpendicular when they meet or cross at a right angle, like the corner of a page." }],
  // Two definitions whose size the old letter count got wrong, one each way:
  // planned by letters, the first printed a size too large and the second a
  // size too small.
  ["a definition the letters planned too large", { type: "vocabDefinition", page: PAGE, title: "Perpendicular", visual: DRAWING,
    definition: "Two lines are perpendicular when they meet or cross at a right angle." }],
  ["a definition the letters planned too small", { type: "vocabDefinition", page: PAGE, title: "Perpendicular", visual: DRAWING,
    definition: "Two lines are perpendicular when they meet or cross at a right angle like the corner of." }],
  ["a definition on its own", { type: "vocabDefinition", page: PAGE, title: "Continuity",
    definition: "Continuity means something stayed the same over time." }],
  ["a worked example beside a photo", { type: "workedExample", page: PAGE, title: "How to do it", photo: PHOTO, items: [
    { label: "Step 1", text: "When the bottom numbers match, add the top numbers together." },
    { label: "Step 2", text: "Keep the bottom number the same." },
    { label: "Worked example", text: "Two fifths and one fifth make three fifths." },
  ] }],
  ["a worked example with arrows beside a photo", { type: "workedExample", page: PAGE, title: "How to round", photo: PHOTO, items: [
    { label: "Step 1", text: "Look at the tens digit → 6." },
    { label: "Step 2", text: "6 is 5 or more → round up." },
    { label: "Worked example", text: "3,462 → 3,500 ← not 3,400." },
  ] }],
  ["a worked example over a captioned number line", { type: "workedExample", page: PAGE, title: "Complete a number line",
    visual: { type: "numberLine", from: 40, to: 90, step: 10, label: "Each interval is worth 10." }, items: [
      { label: "Step 1", text: "Find the first number." },
      { label: "Step 2", text: "Work out what each jump is worth." },
      { label: "Step 3", text: "Add that amount for each jump." },
      { label: "Step 4", text: "Write the missing numbers." },
      { label: "Worked example", text: "40, 50, 60, 70, 80, 90." },
    ] }],
  ["sentence stems with their completions", { type: "sentenceStem", page: PAGE, title: "How to explain it", items: [
    { text: "The sound travels because ___", filled: "The sound travels because the vibrating air passes it along." },
    { text: "I know this because ___", filled: "I know this because my ear felt the vibration." },
  ] }],
  // Short enough that the bullet and its spaces are what push a word onto a
  // second line.
  ["a short sentence stem", { type: "sentenceStem", page: PAGE, title: "How to explain it", items: [
    { text: "The sound travels ___", filled: "It moves as a wave through the air." },
  ] }],
  ["sentence stems beside a drawing", { type: "sentenceStem", page: PAGE, title: "How to explain it", visual: DRAWING, items: [
    { text: "These lines are perpendicular because ___", filled: "These lines are perpendicular because they meet at a right angle." },
  ] }],
  ["a misconception pair", { type: "misconception", page: PAGE, title: "Look out for", items: [
    { label: "Don't", text: "Round 45 down to 40." },
    { label: "Do", text: "Round 45 up to 50." },
  ] }],
  ["a misconception pair over a drawing", { type: "misconception", page: PAGE, title: "Look out for", visual: DRAWING, items: [
    { label: "Don't", text: "Call any crossing lines perpendicular." },
    { label: "Do", text: "Check for a right angle." },
  ] }],
];

// The items as their HTML draws them, in the order the panel prints them.
function drawnItems(card) {
  if (card.type === "vocabDefinition") return [[{ text: card.definition, kind: "line" }]];
  if (card.type === "workedExample") {
    const steps = card.items.filter((item) => isStepLabel(item.label)).map((item) => ({ ...item, kind: "step" }));
    const rest = card.items.filter((item) => !isStepLabel(item.label)).map((item) => ({ ...item, kind: "trailing" }));
    return [steps.concat(rest)];
  }
  if (card.type === "sentenceStem") {
    return [card.items.flatMap((item) => [{ text: item.text, kind: "stem" }].concat(item.filled ? [{ text: item.filled, kind: "filled" }] : []))];
  }
  if (card.type === "misconception") return card.items.map((item) => [{ text: item.text, kind: "line" }]);
  return [card.items.map((item) => ({ ...item, kind: "line" }))];
}

async function buildCard(root, name, card) {
  const dir = path.join(root, name.replace(/[^a-z0-9]+/gi, "-"));
  fs.mkdirSync(path.join(dir, "photos"), { recursive: true });
  fs.copyFileSync(path.join(__dirname, "..", "test-fixtures-a3", "photos", "pizza.jpg"), path.join(dir, "photos", "pizza.jpg"));
  const specPath = path.join(dir, "working-wall.json");
  fs.writeFileSync(specPath, JSON.stringify({ topic: "Lines", cards: [card] }));
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

// Each panel (each cell of a misconception pair): its content box, and for each
// item's block the lines it printed, its height and its type size. A line is a
// run of text boxes that overlap from top to bottom, so a smaller label on the
// same line counts once; a step's badge column is not its words.
async function measure(browser, htmlPath, pair) {
  const page = await browser.newPage();
  try {
    await page.setContent(fs.readFileSync(htmlPath, "utf8"), { waitUntil: "load" });
    await page.evaluate(async () => {
      if (document.fonts) await document.fonts.ready;
    });
    return await page.evaluate((pairCard) => {
      const panels = pairCard
        ? [...document.querySelectorAll(".wall-body > div[style*='border:']")]
        : [...document.querySelectorAll(".wall-panel")];
      return panels.map((panel) => {
        const outer = panel.getBoundingClientRect();
        const s = getComputedStyle(panel);
        const box = {
          top: outer.top + parseFloat(s.borderTopWidth) + parseFloat(s.paddingTop),
          bottom: outer.bottom - parseFloat(s.borderBottomWidth) - parseFloat(s.paddingBottom),
          left: outer.left + parseFloat(s.borderLeftWidth) + parseFloat(s.paddingLeft),
          right: outer.right - parseFloat(s.borderRightWidth) - parseFloat(s.paddingRight),
        };
        const blocks = [...panel.children].map((child) => {
          const rects = [];
          let size = 0;
          const walker = document.createTreeWalker(child, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) {
            const node = walker.currentNode;
            if (!node.textContent.trim()) continue;
            const holder = node.parentElement;
            const row = holder.closest("[style*='display:flex']");
            const rowInBlock = row && (row === child || child.contains(row)) && row.children.length > 1;
            if (rowInBlock && row.firstElementChild.contains(holder)) continue;
            size = Math.max(size, parseFloat(getComputedStyle(holder).fontSize));
            const range = document.createRange();
            range.selectNodeContents(node);
            for (const r of range.getClientRects()) rects.push({ top: r.top, bottom: r.bottom });
          }
          rects.sort((a, b) => a.top - b.top);
          let lines = 0;
          let bottom = -Infinity;
          for (const r of rects) {
            if (r.top >= bottom - 1) {
              lines += 1;
              bottom = r.bottom;
            } else {
              bottom = Math.max(bottom, r.bottom);
            }
          }
          return { lines, height: child.getBoundingClientRect().height, pt: size * 0.75, text: child.textContent.trim() };
        });
        let past = 0;
        const walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const range = document.createRange();
          range.selectNodeContents(walker.currentNode);
          for (const r of range.getClientRects()) {
            past = Math.max(past, box.top - r.top, r.bottom - box.bottom, box.left - r.left, r.right - box.right);
          }
        }
        return { widthPx: box.right - box.left, heightPx: box.bottom - box.top, blocks, past };
      });
    }, pair);
  } finally {
    await page.close();
  }
}

test("each panel card prints the lines it planned, and nothing strays into a panel's padding", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "wall-lines-"));
  const browser = await chrome.launchBrowser();
  const planPage = { badgeInches, labelPt: accentLabelPtFor };
  const types = new Set();
  try {
    for (const [name, card] of CARDS) {
      const htmlPath = await buildCard(root, name, card);
      const pair = card.type === "misconception";
      const panels = await measure(browser, htmlPath, pair);
      const expected = drawnItems(card);
      assert.equal(panels.length, expected.length, `${name}: ${panels.length} panels drawn`);
      panels.forEach((panel, index) => {
        assert.ok(panel.past <= 0.5, `${name}: text strays ${panel.past.toFixed(1)}px into the padding or past the edge`);
        // A misconception cell prints its label line first, then its sentence.
        const printed = pair ? panel.blocks.slice(1) : panel.blocks;
        const items = expected[index];
        assert.equal(printed.length, items.length, `${name}: ${printed.length} blocks printed for ${items.length} items`);
        items.forEach((item, at) => {
          const block = printed[at];
          const planned = itemBlock(item, block.pt, panel.widthPx, planPage);
          assert.equal(block.lines, planned.lines, `${name}: "${item.text}" printed on ${block.lines} lines at ${block.pt}pt, planned on ${planned.lines}`);
          assert.ok(Math.abs(block.height - planned.px) < 1.5, `${name}: "${item.text}" printed ${block.height.toFixed(1)}px tall, planned ${planned.px.toFixed(1)}px`);
        });
      });
      // And the size is the largest that fits: one step larger, the plan would
      // not fit what Chrome gave it, so no card is drawn smaller than it needs.
      const pt = Math.round((pair ? panels[0].blocks[1] : panels[0].blocks[0]).pt * 10) / 10;
      if (pt + 4 <= style.sizes.a3BodyPt) {
        const larger = panels.map((panel, index) => expected[index].map((item) => itemBlock(item, pt + 4, panel.widthPx, planPage)));
        const tooManyLines = larger.some((blocks) => blocks.some((block) => block.lines > 5));
        const plannedPx = pair
          ? panels[0].blocks[0].height + Math.max(...larger.map((blocks) => blocks[0].px))
          : larger[0].reduce((sum, block) => sum + block.px, 0);
        assert.ok(tooManyLines || plannedPx > panels[0].heightPx,
          `${name}: drawn at ${pt}pt, but ${pt + 4}pt would have fitted (${plannedPx.toFixed(1)}px of ${panels[0].heightPx.toFixed(1)}px)`);
      }
      types.add(card.type);
    }
    assert.deepStrictEqual([...types].sort(), ["misconception", "sentenceStem", "stickyKnowledge", "vocabDefinition", "workedExample"]);
  } finally {
    await browser.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a figure stacked under a panel is planned at the height it is drawn", () => {
  // A very wide figure is drawn across the sheet less the panel's padding, so
  // it is shorter than the reserve it is offered; the words' plan takes the
  // drawn height and its gap, never the reserve.
  const { stackedFigureInches } = require("../src/visuals.js");
  const { panelWithVisualHtml } = require("../src/shared.js");
  const visual = { _educationalSvgBuffer: Buffer.from("figure"), _educationalSvgAspect: 6 };
  const card = { type: "workedExample", page: PAGE, visual };
  for (const reserve of [2, 2.5, 3.2]) {
    const html = panelWithVisualHtml("", { buf: visual._educationalSvgBuffer, aspect: 6 }, null, "EDE3F5", "7030A0", style,
      "A3", "landscape", { panelFraction: 1, aspect: 6, maxVisualHeightIn: reserve - 0.25 });
    const gapMm = Number(html.match(/text-align:center;margin-top:([\d.]+)mm;/)[1]);
    const heightMm = Number(html.match(/display:block;width:[\d.]+mm;height:([\d.]+)mm;margin:0 auto;/)[1]);
    const planned = stackedFigureInches(card, {}, style, reserve);
    assert.ok(Math.abs(planned - (gapMm + heightMm) / 25.4) < 0.001, `reserve ${reserve}in: planned ${planned.toFixed(3)}in, drawn ${((gapMm + heightMm) / 25.4).toFixed(3)}in`);
  }
});

test("a fact too long beside a drawing is refused against its four lines, never the photo's three", async () => {
  // The photo's third line (his answer, a photo narrowed to a third) is a
  // photo's only: a drawing's words already run to four lines at the floor.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "wall-drawing-"));
  const words = "x ".repeat(120).slice(0, 151).trim();
  const specPath = path.join(root, "working-wall.json");
  fs.writeFileSync(specPath, JSON.stringify({ topic: "Drawing", cards: [
    { type: "stickyKnowledge", page: PAGE, title: "Remember", visual: DRAWING, items: [{ text: words }] },
  ] }));
  const log = console.log;
  const warn = console.warn;
  console.log = () => {};
  console.warn = () => {};
  try {
    await assert.rejects(() => build(specPath, root), (err) => {
      assert.match(String(err.message), /is the most that fits in 4 lines at 36pt/);
      return true;
    });
  } finally {
    console.log = log;
    console.warn = warn;
    fs.rmSync(root, { recursive: true, force: true });
  }
});
