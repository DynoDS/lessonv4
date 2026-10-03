"use strict";

// A renga lesson of 2 October 2026 printed its two activities in ways that
// broke the task. The six stanza cards children were to order lost their line
// breaks, so "check the pattern: 3 lines, 2 lines" could not be done from
// them; they carried no letters, though the board and the answer slide named
// them A to F; and they filled half a page. The seaside renga to count printed
// on half a sideways page with `[ ]` typed where the boxes should be.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { buildKits } = require("../build");
const { normaliseTaskSheet, taskSheetPages } = require("../src/render-activity-page");

const STANZAS = [
  "A grey heron waits,\nstanding still on one long leg.\nSnap! It has the fish.",
  "It sits on my bedroom shelf\nto bring me luck on test days.",
  "Rain on the green hill\ntrickles down into the stream.\nThe water rushes.",
  "The heron flaps its great wings,\nand one grey feather drifts down.",
  "A small silver fish swims fast\nagainst the rush of water.",
  "I find the feather,\nsoft and long, beside the path.\nI keep it for luck.",
];
const ORDER = [3, 6, 1, 4, 5, 2]; // the heading each card belongs under

function stanzaKit() {
  return {
    visual: "card-set",
    tag: "Stanzas",
    label: "Put the renga back together",
    spec: {
      sourceUnitId: "lesson-section/teaching-sequence/unit-005",
      form: "cards",
      instruction: "Put all six back in order.",
      headings: ["1st", "2nd", "3rd", "4th", "5th", "6th"].map((label, i) => ({ id: `g${i + 1}`, label })),
      cards: STANZAS.map((label, i) => ({ id: `c${i + 1}`, label })),
      sets: { per: "pair" },
      teacher: {
        where: "At tables, one set between two.",
        answer: STANZAS.map((_, i) => ({ cardId: `c${i + 1}`, headingId: `g${ORDER[i]}` })),
      },
    },
  };
}

function lessonWithBoard(dir) {
  fs.writeFileSync(path.join(dir, "lesson.json"), JSON.stringify({
    slides: [{
      designUnitId: "lesson-section/teaching-sequence/unit-005",
      body: { type: "sort-board", bank: STANZAS.map((text, i) => ({ label: "ABCDEF"[i], text })) },
    }],
  }));
}

test("a stanza card keeps its own lines, each on one printed line, when the set fills its page", () => {
  const { pageDivs } = buildKits([stanzaKit()], 32);
  const html = pageDivs[0];
  assert.match(html, /A grey heron waits,<br>standing still on one long leg\.<br>Snap! It has the fish\./);
  // Filled: the cards print larger than the standard 12pt.
  const sizes = [...html.matchAll(/font-size:([\d.]+)pt;color/g)].map((m) => Number(m[1]));
  assert.ok(Math.max(...sizes) > 12, `cards printed at ${Math.max(...sizes)}pt, not grown to the page`);
});

test("printed cards carry the letters the board gives the same cards", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "board-letters-"));
  lessonWithBoard(dir);
  const { kits, pageDivs } = buildKits([stanzaKit()], 32, dir);
  assert.deepEqual(kits[0].cards.map((c) => c.letter), ["A", "B", "C", "D", "E", "F"]);
  for (const letter of "ABCDEF") {
    assert.match(pageDivs[0], new RegExp(`font-weight:bold;font-size:\\d+pt;margin-bottom:1\\.5mm">${letter}<`));
  }
});

test("a board that letters cards which do not all match prints no letters rather than the wrong ones", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "board-letters-"));
  lessonWithBoard(dir);
  const kit = stanzaKit();
  kit.spec.cards[0].label = "A different stanza,\nnot on the board.";
  const { kits } = buildKits([kit], 32, dir);
  assert.ok(kits[0].cards.every((c) => !c.letter));
});

test("a kit with no lesson beside it prints as before, with no letters", () => {
  const { kits } = buildKits([stanzaKit()], 32);
  assert.ok(kits[0].cards.every((c) => !c.letter));
});

test("a poem to count prints its boxes as drawn boxes lined up after each line, larger than 16pt where the page allows", () => {
  const sheet = normaliseTaskSheet({
    visual: "task-sheet",
    label: "Count the seaside renga",
    spec: {
      task: "Count the syllables in every line.",
      material: { text: "Waves crash on the rocks.   [   ]\nWhite foam sprays into the air.   [   ]\nSeagulls cry above.   [   ]\n\nA seagull swoops down to me   [   ]\nand steals my last chip.   [   ]" },
      prompts: ["Which stanza breaks the pattern?"],
      per: "pair",
    },
  });
  const laid = taskSheetPages(sheet, { printableWMm: 190, printableHMm: 267, classSize: 32, pageHtml: (c, b) => b });
  const page = laid.pages[0];
  assert.ok(!page.includes("[   ]") && !page.includes("[ ]"), "the typed brackets are not printed");
  assert.equal((page.match(/border-radius:1mm;vertical-align:middle/g) || []).length, 5, "one drawn box per counted line");
  assert.match(page, /grid-template-columns:minmax\(0, max-content\) auto/, "the words may wrap, so a box never leaves the page");
  const textPt = Number(page.match(/font-size:(\d+)pt;line-height/)[1]);
  assert.ok(textPt > 16, `the poem printed at ${textPt}pt on a page with room to spare`);
  assert.match(page, /border-bottom:0\.3mm solid/, "lines to answer on");
  assert.match(page, /flex:1 1 0;min-height:0;overflow:hidden/, "the lines take whatever height the page has left");
});

test("a box typed inside a sentence is a gap drawn where it stands, not moved to the end of the line", () => {
  const sheet = normaliseTaskSheet({
    visual: "task-sheet",
    label: "Fill the gap",
    spec: { task: "Fill in the gap.", material: { text: "The Romans built [ ] roads." }, per: "pair" },
  });
  const page = taskSheetPages(sheet, { printableWMm: 190, printableHMm: 267, classSize: 32, pageHtml: (c, b) => b }).pages[0];
  assert.ok(!/grid-template-columns/.test(page), "no column of end boxes");
  assert.match(page, /The Romans built <span[^>]*border-radius:1mm[^>]*><\/span> roads\./);
});

test("a task sheet prints upright, like a mini worksheet", async () => {
  const { build } = require("../build");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "task-portrait-"));
  const specPath = path.join(dir, "stick-in-sheets.json");
  fs.writeFileSync(specPath, JSON.stringify({
    meta: { lesson: "Portrait test" },
    items: [{ visual: "task-sheet", label: "Count it", spec: { task: "Count.", material: { text: "One line   [ ]" }, per: "pair" } }],
  }));
  const out = path.join(dir, "out");
  await build(specPath, out);
  const folder = path.join(out, "Portrait test - Activities");
  const written = fs.readdirSync(folder)[0];
  if (written.endsWith(".html")) {
    assert.match(fs.readFileSync(path.join(folder, written), "utf8"), /@page \{ size: A4 portrait/);
  } else {
    const pdf = fs.readFileSync(path.join(folder, written)).toString("latin1");
    const box = pdf.match(/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)/);
    assert.ok(box && Number(box[1]) < Number(box[2]), "the page is taller than it is wide");
  }
});
