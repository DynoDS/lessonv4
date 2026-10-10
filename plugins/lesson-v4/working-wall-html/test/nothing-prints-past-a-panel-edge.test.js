"use strict";

// NOTHING PRINTS PAST A PANEL'S EDGE, AND A LONG STICKY FACT KEEPS ITS PHOTO.
//
// The body fitter planned a card with a letter at 0.55 of the type size, a line
// 1.3 times it and 0.4in of panel edge, and Chrome, which prints the wall, draws
// wider words, taller lines and more edge, so a card could print past its
// panel: a Christmas wall's sticky card did, and so did a 72-letter fact beside
// a photo (release 7A's second check, 26 September 2026). The fitter now plans
// the page Chrome draws (layout.js, What the page draws).
//
// A sticky fact too long to sit beside its photo keeps both: the photo narrows
// to about a third of the card and the whole sentence fits beside it (his
// answer, "yys"). The facts below are every saved sticky fact of 73 to 106
// letters in his lessons on that day. Each is built beside a photo and measured
// in the Chrome the wall prints with.

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
const { lineBoxPx, itemBlock } = require("../src/layout.js");
const { PHOTO_AT_A_THIRD, badgeInches, accentLabelPtFor, isStepLabel } = require("../src/visuals.js");

const LONG_FACTS = [
  "Adding or subtracting 1,000 leaves the hundreds, tens and ones unchanged.",
  "Lord Shaftesbury campaigned with others to protect children through laws.",
  "The stomach churns food and mixes it with digestive juices, including acid.",
  "Electricity can flow only when the circuit has one closed path with no gaps.",
  "Rest and sleep help our bodies recover; food and drinks can't replace sleep.",
  "Some things about children's lives changed a lot. Some hardly changed at all.",
  "At Christmas, Christians celebrate Jesus' birth. They believe he is God's Son.",
  "Tudor children learned in different ways: at school, at home and through work.",
  "Christmas celebrates the birth of Jesus, whom Christians believe is God's Son.",
  "A symbol may be associated with a religion without being used by every member.",
  "The cell provides the energy needed for electricity to flow around the circuit.",
  "Tudor children learned in different ways, including at school and through work.",
  "Children like Sarah worked because their families needed the money they earned.",
  "The acid the germs make eats away at the enamel and leaves a hole in the tooth.",
  "Apprentices learned skills through work in Tudor times, and they still do today.",
  "A biome is a large region with a similar climate, landscape, plants and animals.",
  "Each bit of air passes the vibration on to the next bit, all the way to your ear.",
  "Balance comes from what we eat over a day or week, not from one food or one meal.",
  "Ragged schools gave poorer children a chance to learn without paying school fees.",
  "The vibrating air makes your eardrum vibrate, and that is when you hear the sound.",
  "Foods high in fat, salt or sugar are best eaten less often and in smaller amounts.",
  "Continuity means something stayed the same; change means something became different.",
  "Activity uses energy now, but being active regularly helps our bodies become fitter.",
  "An apprenticeship could provide food and a home now, and a way to earn a living later.",
  "One source tells us about one person or one place. It doesn't tell us about everybody.",
  "The tens digit tells us whether a whole number has reached halfway to the next hundred.",
  "Rounding to the nearest 10 always gives one of the two tens either side of your number.",
  "As something falls, gravity pulls it down and air resistance pushes back up against it.",
  "Most tropical rainforests grow close to the Equator in places with a warm, wet climate.",
  "Keep private stories private. Tell a trusted adult if you're worried someone is unsafe.",
  "Different foods give the body different nutrients, so variety helps it get what it needs.",
  "The more air something has to push out of the way, the more air resistance slows it down.",
  "Christians celebrate Christmas because they believe God sent his Son, Jesus, into the world.",
  "Crossing a boundary can change more than one digit, but the jump is still exactly 10 or 100.",
  "Each bit of air passes the vibration on to the next bit, so it travels right across the room.",
  "The Vikings did not only raid. Later ones came with their families and settled on English land.",
  "The ones digit tells you which side of halfway a number is: 0 to 4 round down, 5 to 9 round up.",
  "Foods in different groups can share nutrients, and no single food gives you everything you need.",
  "A source gives us evidence about one place, person or moment. It cannot show every child's life.",
  "Some things about children's lives have changed since Victorian times. Some have stayed the same.",
  "Continuity is something that stays similar over time. Change is something that becomes different.",
  "The same celebration can mean different things to people, and one person can have several reasons.",
  "There was very little good farmland in Viking Scandinavia, so many families had no land of their own.",
  "British monasteries held gold and silver, stood close to the sea, and had no soldiers to defend them.",
  "When the vibrating air reaches your eardrum, your eardrum vibrates, and that is when you hear the sound.",
  "The Amazon rainforest is in South America and spreads across several countries; most of it is in Brazil.",
  "A lamp only lights when the loop is complete. If there's a gap anywhere, the electricity can't get round.",
  "Monasteries like Lindisfarne kept silver and gold and had nobody guarding them, so they were easy to raid.",
];

const PAGE = { size: "A3", orientation: "landscape" };

const OTHER_CARDS = {
  // The Christmas wall's sticky card, which printed 50 pixels past its panel.
  "the Christmas sticky card": {
    type: "stickyKnowledge", page: PAGE, title: "Remember", photo: "photos/pizza.jpg",
    items: [{ text: "Christians celebrate Jesus' birth at Christmas." }, { text: "They believe Jesus is God's Son." }],
  },
  // Worked steps beside a photo that the second check found printing past the panel.
  "a one-step worked example": {
    type: "workedExample", page: PAGE, title: "How to do it", photo: "photos/pizza.jpg",
    items: [{ label: "Step 1", text: "When the bottom numbers match, add the tops and keep the bottom." }],
  },
  // A figure stacked beneath its panel with a caption under it (a saved number
  // line card), whose caption the plan once left out.
  "a worked example over a captioned number line": {
    type: "workedExample", page: PAGE, title: "Complete a number line",
    visual: { type: "numberLine", from: 40, to: 90, step: 10, label: "Each interval is worth 10." },
    items: [
      { label: "Step 1", text: "Find the first number." },
      { label: "Step 2", text: "Work out what each jump is worth." },
      { label: "Step 3", text: "Add that amount for each jump." },
      { label: "Step 4", text: "Write the missing numbers." },
      { label: "Step 5", text: "Check the numbers follow the same pattern." },
      { label: "Worked example", text: "40, 50, 60, 70, 80, 90." },
    ],
  },
  // One fact on three lines beside its photo, with two short ones: a card may
  // hold one fact that long (his answer, "yes").
  "a long fact and two short ones beside a photo": {
    type: "stickyKnowledge", page: PAGE, title: "Remember", photo: "photos/pizza.jpg",
    items: [
      { text: "Monasteries like Lindisfarne kept silver and gold and had nobody guarding them, so they were easy to raid." },
      { text: "Vikings came from Scandinavia." },
      { text: "Some came to settle." },
    ],
  },
  "a two-step worked example": {
    type: "workedExample", page: PAGE, title: "How to do it", photo: "photos/pizza.jpg",
    items: [
      { label: "Step 1", text: "When the bottom numbers match, add the top numbers together." },
      { label: "Step 2", text: "Keep the bottom number the same, so the answer is right again." },
    ],
  },
};

// `notes`, when given, keeps what the build says as it builds.
async function buildCard(root, name, card, notes) {
  const dir = path.join(root, name.replace(/[^a-z0-9]+/gi, "-"));
  fs.mkdirSync(path.join(dir, "photos"), { recursive: true });
  fs.copyFileSync(path.join(__dirname, "..", "test-fixtures-a3", "photos", "pizza.jpg"), path.join(dir, "photos", "pizza.jpg"));
  const specPath = path.join(dir, "working-wall.json");
  fs.writeFileSync(specPath, JSON.stringify({ topic: "Edge", cards: [card] }));
  const log = console.log;
  const warn = console.warn;
  console.log = notes ? (...args) => notes.push(args.join(" ")) : () => {};
  console.warn = () => {};
  try {
    return await build(specPath, dir);
  } finally {
    console.log = log;
    console.warn = warn;
  }
}

// Every panel's text, how far any line of it strays into the panel's padding
// or past its edge, and whether the panel has a picture beside or beneath it.
// The plan gives the words the room inside the padding, so that is the test.
async function measure(browser, htmlPath) {
  const page = await browser.newPage();
  try {
    await page.setContent(fs.readFileSync(htmlPath, "utf8"), { waitUntil: "load" });
    await page.evaluate(async () => {
      if (document.fonts) await document.fonts.ready;
    });
    return await page.evaluate(() => [...document.querySelectorAll(".wall-panel")].map((panel) => {
      const outer = panel.getBoundingClientRect();
      const style = getComputedStyle(panel);
      const box = {
        top: outer.top + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop),
        bottom: outer.bottom - parseFloat(style.borderBottomWidth) - parseFloat(style.paddingBottom),
        left: outer.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft),
        right: outer.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight),
      };
      let past = 0;
      const walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(walker.currentNode);
        for (const rect of range.getClientRects()) {
          past = Math.max(past, box.top - rect.top, rect.bottom - box.bottom, box.left - rect.left, rect.right - box.right);
        }
      }
      // The photo sits beside the panel in the card's body, never inside it
      // (a worked example's step badges are pictures inside the panel).
      const body = panel.closest(".wall-body");
      const picture = !!body && [...body.querySelectorAll("img")].some((img) => !panel.contains(img));
      // What the words take, and the size and width they were drawn at.
      const drawnPx = [...panel.children].reduce((sum, child) => sum + child.getBoundingClientRect().height, 0);
      const sized = [...panel.querySelectorAll("[style*='font-size']")].find((el) => /font-weight:bold/.test(el.getAttribute("style")) && el.textContent.trim());
      return {
        text: panel.textContent, past, picture, drawnPx,
        pt: sized ? parseFloat(getComputedStyle(sized).fontSize) * 0.75 : 0,
        widthPx: box.right - box.left,
      };
    }));
  } finally {
    await page.close();
  }
}

test("a long sticky fact keeps its photo and its whole sentence, and nothing prints past a panel's edge", async () => {
  assert.deepStrictEqual(PHOTO_AT_A_THIRD, { share: 0.7, floorLines: 3, factsOnThreeLines: 1 });
  assert.equal(LONG_FACTS.length, 48);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "wall-edge-"));
  const browser = await chrome.launchBrowser();
  try {
    const cards = LONG_FACTS.map((text, index) => [`fact ${index + 1}`, {
      type: "stickyKnowledge", page: PAGE, title: "Remember", photo: "photos/pizza.jpg", items: [{ text }],
    }]).concat(Object.entries(OTHER_CARDS));
    for (const [name, card] of cards) {
      const htmlPath = await buildCard(root, name, card);
      const panels = await measure(browser, htmlPath);
      assert.equal(panels.length, 1, `${name} should draw one panel`);
      const [panel] = panels;
      assert.ok(panel.picture, `${name} lost its photo`);
      for (const item of card.items) {
        assert.ok(panel.text.includes(item.text), `${name} does not print "${item.text}" whole`);
      }
      assert.ok(panel.past <= 0.5, `${name} prints ${panel.past.toFixed(1)}px into its panel's padding or past its edge`);
      // And the plan is the page: the fitter's own measure of these items, at
      // the size and width drawn, is what Chrome drew, to a pixel.
      const items = card.items.map((item) => ({
        ...item,
        kind: card.type === "workedExample" ? (isStepLabel(item.label) ? "step" : "trailing") : "line",
      }));
      const page = { badgeInches, labelPt: accentLabelPtFor };
      const plannedPx = items.reduce((sum, item) => sum + itemBlock(item, panel.pt, panel.widthPx, page).px, 0);
      assert.ok(Math.abs(plannedPx - panel.drawnPx) < 1, `${name}: planned ${plannedPx.toFixed(1)}px, drawn ${panel.drawnPx.toFixed(1)}px`);
    }
  } finally {
    await browser.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// His answer of 10 October 2026, from pictures of his own Year 6 poster: a
// fact and the picture beside it take a real half of the sheet each ("way
// better"). Until then a fact a few letters over two lines narrowed its photo
// to 35% of the sheet and a longer one to under a third (his answers of 26
// September), and the words were then printed far larger than the room they
// had been given needed. A fact of either length now keeps half.
test("a fact and the photo beside it take half the sheet each", async () => {
  const { printableInches, photoAspect } = require("../src/layout.js");
  const PIZZA_ASPECT = photoAspect(fs.readFileSync(path.join(__dirname, "..", "test-fixtures-a3", "photos", "pizza.jpg")));
  const style = require("../style.json");
  const shareMm = (share) => Math.round(printableInches("A3", "landscape", style).width * share * 25.4 * 100) / 100;
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "wall-give-way-"));
  try {
    const cases = [
      ["Most tropical rainforests grow near the Equator, where it is warm.", 0.5],
      ["Rainforests grow close to the Equator, in places that are warm and wet.", 0.5],
      ["On the x-axis, negative numbers are to the left of zero. On the y-axis, they are below zero.", 0.5],
    ];
    for (const [text, share] of cases) {
      const htmlPath = await buildCard(root, `a fact of ${text.length} letters`, {
        type: "stickyKnowledge", page: PAGE, title: "Remember", photo: "photos/pizza.jpg", items: [{ text }],
      });
      const width = Number(fs.readFileSync(htmlPath, "utf8").match(/<div style="width:([\d.]+)mm;flex:none;display:flex;"><div class="wall-panel"/)[1]);
      assert.equal(width, shareMm(share), `a ${text.length}-letter fact's words should take ${share * 100}% of the sheet`);
      // And the photo is drawn at its own shape, not squeezed into a square.
      const [, w, h] = fs.readFileSync(htmlPath, "utf8").match(/<img [^>]*style="display:block;width:([\d.]+)mm;height:([\d.]+)mm/);
      assert.ok(Math.abs(Number(w) / Number(h) - PIZZA_ASPECT) < 0.02, `the photo beside a ${text.length}-letter fact is ${w}mm by ${h}mm, not its own shape`);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// His answer to the third check (26 September 2026): asked whether a long fact
// may run to three lines but a card holds only one of them, any other going on
// a second card, he said "yes". The move to a second card is the wall
// designer's, where the wall has room; a card that still holds two or more at
// build time is never lost for it (the fourth check): it builds with its photo
// off and every sentence whole, and says so. Never two three-line facts beside
// one photo.
test("a card beside a photo holds one three-line fact, and a card with more is built without losing the wall", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "wall-one-long-"));
  const long = LONG_FACTS.filter((text) => text.length >= 101).slice(0, 3);
  assert.equal(long.length, 3);
  const card = (items) => ({ type: "stickyKnowledge", page: PAGE, title: "Remember", photo: "photos/pizza.jpg", items: items.map((text) => ({ text })) });
  const browser = await chrome.launchBrowser();
  try {
    for (const count of [2, 3]) {
      const notes = [];
      const htmlPath = await buildCard(root, `${count} long facts`, card(long.slice(0, count)), notes);
      const [panel] = await measure(browser, htmlPath);
      assert.ok(!panel.picture, `${count} long facts were kept beside one photo, each on three lines`);
      for (const text of long.slice(0, count)) assert.ok(panel.text.includes(text), `${count} long facts: "${text}" is not printed whole`);
      assert.ok(panel.past <= 0.5, `${count} long facts print ${panel.past.toFixed(1)}px outside the panel`);
      assert.ok(notes.some((note) => /a card holds one fact that long, so this card is built with its photo off and every sentence whole/.test(note)
        && /moves the next long fact to a second card where the wall has room/.test(note)), `${count} long facts: no note names the move`);
    }
    for (const [index, text] of long.entries()) {
      const [panel] = await measure(browser, await buildCard(root, `the long fact ${index + 1} alone`, card([text])));
      assert.ok(panel.picture, `long fact ${index + 1} on a card of its own should keep its photo`);
    }
  } finally {
    await browser.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("the line the fitter plans is the line Chrome draws", () => {
  // Comic Sans MS Bold's own line box, measured in the Chrome the wall prints
  // with on 26 September 2026: 67px at 36pt and 149px at 80pt, where the old
  // plan of 1.3 times the type gave 62.4px and 138.7px.
  assert.equal(lineBoxPx(36), 67);
  assert.equal(lineBoxPx(80), 149);
});
