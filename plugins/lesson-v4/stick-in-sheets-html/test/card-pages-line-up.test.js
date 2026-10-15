"use strict";

// Do the card pages line up, and stay on their page, as a browser draws them?
//
// Nothing looked at a drawn card page until the 20-lesson test of 7 October
// 2026, and every size on one was a fixed number or a stack centred in its
// card. Cut-out cards with a one-line caption carried their tag, picture and
// letter half a line lower than their two-line neighbours. The same sorts
// printed with nothing to cut were worse: a Year 2 timeline gave the days the
// letters A to F beside cards already lettered A to G and cut a caption with
// its card's edge, and eight Year 6 scenarios as a tick table ran off the
// bottom of the page. These tests read the drawn page. On a machine without a
// browser they skip, as the build itself falls back to its sums there.

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { normaliseCardSet, renderKitPages, renderSheetPages, renderSheetPagesMeasured } = require("../src/render-card-set");
const { wrapDocument, pageDiv, measureSheet, PRINTABLE_W_MM, PRINTABLE_H_MM, PORTRAIT_W_MM, PORTRAIT_H_MM } = require("../build");
const { findChrome, launchBrowser } = require("../../worksheet-html/src/chrome");

const PNG_1PX = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
const PAGE = {
  printableWMm: PRINTABLE_W_MM,
  printableHMm: PRINTABLE_H_MM,
  pageHtml: pageDiv,
  upright: { printableWMm: PORTRAIT_W_MM, printableHMm: PORTRAIT_H_MM },
};

function browserAvailable() {
  try {
    return Boolean(findChrome());
  } catch {
    return false;
  }
}

function kitOf({ form, headings, cards, pictures = false, per = "pair", instruction = "Put each one where it goes." }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "card-pages-"));
  const item = {
    visual: "card-set",
    tag: "Fire in order",
    label: "Put the Great Fire in order",
    spec: {
      sourceUnitId: "lesson-section/teaching-sequence/unit-008",
      form,
      instruction,
      headings: headings.map((label, i) => ({ id: `group-${i + 1}`, label })),
      cards: cards.map(([label, heading, letter], i) => {
        const card = { id: `item-${i + 1}`, label };
        if (letter) card.letter = letter;
        if (pictures) {
          fs.writeFileSync(path.join(dir, `p${i}.png`), PNG_1PX);
          Object.assign(card, { photoRef: `photo-${i + 1}`, imagePath: `p${i}.png` });
        }
        return card;
      }),
      sets: { per, groupCount: per === "group" ? 8 : null },
      teacher: {
        where: "At tables, one between two.",
        answer: cards.map(([, heading], i) => ({ cardId: `item-${i + 1}`, headingId: `group-${headings.indexOf(heading) + 1}` })),
      },
    },
  };
  const kit = normaliseCardSet(item, 32, dir);
  assert.strictEqual(typeof kit, "object", `expected a kit, got: ${kit}`);
  return kit;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Did not happen"];
const FIRE = [
  ["Buckets of water put the fire out.", "Did not happen", "A"],
  ["The wind stopped blowing.", "Wednesday", "B"],
  ["A fire started in a bakery.", "Sunday", "C"],
  ["Firefighters came in a fire engine.", "Did not happen", "D"],
  ["People pulled houses down.", "Tuesday", "E"],
  ["The fire was out.", "Thursday", "F"],
  ["People got away in boats.", "Monday", "G"],
];
const SCENARIOS = [
  ["A player Lily only knows from a game says, \"You're so funny! What's your address? I'll send you a present.\"", "Unsafe"],
  ["Bilal's cousin puts a photo of his new puppy on the family group chat.", "Safe"],
  ["A friend request comes from someone called Harry. Abdi has a Harry in his class. The profile picture is a cartoon cat.", "Not sure"],
  ["Bilal's best friend from school messages, \"Tell me your password and I'll get you extra coins.\"", "Unsafe"],
  ["A player Abdi only knows from a game asks, \"Which football team do you support?\"", "Safe"],
  ["A pop-up in Lily's game says, \"You have won 1,000 free coins! Click in the next 30 seconds!\"", "Unsafe"],
  ["Lily gets a message from her school friend's account. It says, \"Is this you in this video?\" It has a link to click.", "Not sure"],
  ["A player Bilal has chatted to for weeks says, \"Let's use a private chat. Don't tell your parents.\"", "Unsafe"],
];
const ADVERBIALS = [
  ["on the roof", "Where"], ["at bedtime", "When"], ["by accident", "How"], ["at the bus stop", "Where"], ["on tiptoe", "How"],
  ["by lunchtime", "When"], ["at top speed", "How"], ["on Saturday", "When"], ["by the pond", "Where"],
];

// Where each card's parts were drawn, in millimetres down the page, with the
// cards grouped into the rows they sit in.
async function drawnCards(browser, pageHtml, portrait = false) {
  const page = await browser.newPage();
  try {
    await page.setContent(wrapDocument([pageHtml], portrait), { waitUntil: "load" });
    return await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const mm = (px) => (px * 25.4) / 96;
      return [...document.querySelectorAll('[data-card="item"]')].map((card) => {
        const box = card.getBoundingClientRect();
        const top = (part) => {
          const el = card.querySelector(`[data-part="${part}"]`);
          return el ? mm(el.getBoundingClientRect().top) : null;
        };
        return {
          row: Math.round(mm(box.top)),
          tag: top("tag"), picture: top("picture"), letter: top("letter"),
          spilled: card.scrollHeight > card.clientHeight + 1,
        };
      });
    });
  } finally {
    await page.close();
  }
}

function assertRowsLineUp(cards, parts) {
  const rows = new Map();
  for (const card of cards) rows.set(card.row, [...(rows.get(card.row) || []), card]);
  for (const [row, inRow] of rows) {
    for (const part of parts) {
      const tops = inRow.map((c) => c[part]).filter((t) => t !== null);
      const spread = Math.max(...tops) - Math.min(...tops);
      assert.ok(spread <= 0.3, `in the row at ${row}mm the ${part}s sit ${spread.toFixed(1)}mm apart, and a row should line up`);
    }
  }
}

test("cut-out picture cards line up from the top whatever the length of their captions, and no words leave a card", { timeout: 120000 }, async (t) => {
  if (!browserAvailable()) return t.skip("no browser on this machine, so nothing could be measured");
  const browser = await launchBrowser();
  try {
    const laid = renderKitPages(kitOf({ form: "cards", headings: DAYS, cards: FIRE, pictures: true }), PAGE);
    assert.ok(!laid.error, laid.error);
    const cards = await drawnCards(browser, laid.pages[0]);
    assert.strictEqual(cards.length, 7);
    assertRowsLineUp(cards, ["tag", "picture", "letter"]);
    assert.ok(cards.every((c) => !c.spilled), "a caption ran out of its card");
  } finally {
    await browser.close();
  }
});

test("on word cards the kit's small tag sits at the top of every card, not wherever the words put it", { timeout: 120000 }, async (t) => {
  if (!browserAvailable()) return t.skip("no browser on this machine, so nothing could be measured");
  const browser = await launchBrowser();
  try {
    const laid = renderKitPages(kitOf({ form: "cards", headings: ["Safe", "Unsafe", "Not sure"], cards: SCENARIOS, per: "group" }), PAGE);
    assert.ok(!laid.error, laid.error);
    const cards = await drawnCards(browser, laid.pages[0]);
    assertRowsLineUp(cards, ["tag"]);
    assert.ok(cards.every((c) => !c.spilled), "the words ran out of a card");
  } finally {
    await browser.close();
  }
});

test("pictures put under named headings print with nothing to cut: a box under each heading, one letter on each item, and no second set of letters", { timeout: 120000 }, async (t) => {
  const kit = kitOf({ form: "sheet", headings: DAYS, cards: FIRE, pictures: true });
  const bySums = renderSheetPages(kit, PAGE);
  assert.ok(!bySums.error, bySums.error);
  assert.ok(bySums.places, "named headings print as places to write a letter under");
  const html = bySums.pages[0];
  assert.ok(!html.includes("dashed"), "nothing to cut");
  assert.strictEqual(html.split('data-part="answer-box"').length - 1, DAYS.length, "one box under each heading");
  assert.deepStrictEqual(bySums.letters, ["A", "B", "C", "D", "E", "F", "G"], "the board's letters, in the board's order");
  assert.ok(!/<b>[A-F]<\/b> = /.test(html), "the headings are not given letters of their own");
  assert.strictEqual(bySums.pages.length, 16, "one sheet between two");
  if (!browserAvailable()) return t.diagnostic("no browser on this machine, so the drawn page was not measured");
  const browser = await launchBrowser();
  try {
    const laid = await renderSheetPagesMeasured(kit, PAGE, (page, portrait) => measureSheet(browser, page, portrait));
    assert.ok(!laid.error, laid.error);
    const drawn = await measureSheet(browser, laid.pages[0], laid.portrait);
    assert.ok(drawn.heightMm <= laid.setHeightMm + 0.5, `the sheet draws ${drawn.heightMm.toFixed(1)}mm on a page that holds ${laid.setHeightMm}mm`);
    assert.strictEqual(drawn.spilled, 0, "a caption ran out of its card");
    assertRowsLineUp(await drawnCards(browser, laid.pages[0], laid.portrait), ["letter"]);
  } finally {
    await browser.close();
  }
});

test("items with no board letters are lettered A, B, C down the printed order, which is never the answer's order", () => {
  const kit = kitOf({ form: "sheet", headings: DAYS, cards: FIRE.map(([label, heading]) => [label, heading]), pictures: true });
  const laid = renderSheetPages(kit, PAGE);
  assert.deepStrictEqual(laid.letters, ["A", "B", "C", "D", "E", "F", "G"]);
  assert.notDeepStrictEqual(kit.printOrder.map((c) => c.id), kit.cards.map((c) => c.id));
});

test("an order still prints with a number box on each picture, and a long caption never leaves its card", { timeout: 120000 }, async (t) => {
  const places = ["1st", "2nd", "3rd", "4th", "5th"];
  const story = [
    ["Hanuman finds Sita in the garden and gives her the ring", "3rd", "A"], ["The lamps are lit to welcome them home", "5th", "B"],
    ["Rama and Sita go to live in the forest", "1st", "C"], ["Rama fights Ravana for ten days", "4th", "D"], ["Ravana carries Sita away", "2nd", "E"],
  ];
  const kit = kitOf({ form: "sheet", headings: places, cards: story, pictures: true });
  const laid = renderSheetPages(kit, PAGE);
  assert.ok(!laid.error, laid.error);
  assert.ok(!laid.places && laid.pages[0].includes("Write 1 to 5 in the boxes."), "an order keeps its number boxes");
  if (!browserAvailable()) return t.diagnostic("no browser on this machine, so the drawn page was not measured");
  const browser = await launchBrowser();
  try {
    const drawn = await measureSheet(browser, laid.pages[0]);
    assert.strictEqual(drawn.spilled, 0, "a caption ran out of its card");
    assert.ok(drawn.heightMm <= PRINTABLE_H_MM + 0.5, `the sheet draws ${drawn.heightMm.toFixed(1)}mm tall`);
  } finally {
    await browser.close();
  }
});

test("a tick table of long sentences is fitted to the page a browser draws, never run off the bottom of it", { timeout: 120000 }, async (t) => {
  if (!browserAvailable()) return t.skip("no browser on this machine, so nothing could be measured");
  const browser = await launchBrowser();
  try {
    const kit = kitOf({ form: "sheet", headings: ["Safe", "Unsafe", "Not sure"], cards: SCENARIOS, per: "group", instruction: "Sort the cards with your group. When you find a warning sign, say which one it is." });
    const laid = await renderSheetPagesMeasured(kit, PAGE, (page, portrait) => measureSheet(browser, page, portrait));
    assert.ok(!laid.error, laid.error);
    assert.ok(laid.table && !laid.twoUp, "long sentences keep a whole page");
    assert.ok(laid.pt >= 12, `the words stay readable, and came out at ${laid.pt}pt`);
    const drawn = await measureSheet(browser, laid.pages[0], laid.portrait);
    assert.ok(drawn.heightMm <= laid.setHeightMm + 0.5, `the table draws ${drawn.heightMm.toFixed(1)}mm on a page that holds ${laid.setHeightMm}mm`);
    for (const [label] of SCENARIOS) assert.ok(laid.pages[0].includes(label.split('"')[0].trim().slice(0, 20)), `every scenario is on the page: ${label.slice(0, 30)}`);
  } finally {
    await browser.close();
  }
});

test("a tick table of short words prints two sheets to a page with one cut between them, half the paper", () => {
  const kit = kitOf({ form: "sheet", headings: ["When", "Where", "How"], cards: ADVERBIALS });
  const laid = renderSheetPages(kit, PAGE);
  assert.ok(!laid.error, laid.error);
  assert.ok(laid.table && laid.twoUp, "short words leave room for a second sheet");
  assert.strictEqual(laid.pages.length, 8, "16 sheets on 8 pages");
  assert.strictEqual(laid.pages[0].split("dashed").length - 1, 1, "one cut, down the middle");
  assert.strictEqual(laid.pages[0].split("data-tick-table").length - 1, 2);
});

test("a tick table whose words need the width keeps its whole page, as it always printed", () => {
  const wide = ADVERBIALS.map(([label, heading]) => [`${label}, when nobody at all was looking`, heading]);
  const laid = renderSheetPages(kitOf({ form: "sheet", headings: ["When", "Where", "How"], cards: wide }), PAGE);
  assert.ok(!laid.error, laid.error);
  assert.ok(laid.table && !laid.twoUp);
  assert.strictEqual(laid.pages.length, 16);
  assert.ok(laid.pages[0].includes("width:12mm;height:12mm"), "the tick boxes keep their size");
});

test("a sheet no layout holds is refused by name, never printed cut short", async () => {
  const kit = kitOf({ form: "sheet", headings: ["Safe", "Unsafe", "Not sure"], cards: SCENARIOS, per: "group" });
  const laid = await renderSheetPagesMeasured(kit, PAGE, async () => ({ heightMm: 400, spilled: 0 }));
  assert.ok(laid.error, "expected a refusal");
  assert.match(laid.error, /draws 400 mm tall/);
  assert.match(laid.error, /never cut short/);
});
