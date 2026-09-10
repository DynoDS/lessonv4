"use strict";

// How much room is ENOUGH.
//
// Three worksheet packs came back on 7 September 2026 looking like the thing
// they had been rebuilt to stop looking like: big empty rectangles on a page.
// Nobody had asked for them. Each one is the same missing question asked in a
// different place.
//
//   A maths sheet's transformation table wanted one four-digit number per cell
//   and was drawn with a 30.7mm blank row, because its zone had 30.7mm going
//   spare and a recording table is allowed to use spare height.
//
//   A balanced-diet sheet's drawing task was drawn as a 209.6mm blank cell,
//   because "somewhere to draw" was routed to a one-row sorting grid and a
//   sorting grid was declared bottomless.
//
//   A history sheet's answer blocks kept about 28mm of blank paper under
//   writing lines that had already stopped growing, because the lines were
//   capped and the box holding them was not.
//
// The engine knew how SMALL each of those could be. It had never been asked how
// big was big enough. `enough` is that question; these are its answers.

const assert = require("node:assert/strict");
const test = require("node:test");

const { renderSheet } = require("../src/render");
const { measure, enough } = require("../src/helpers");
const { tightnessOf } = require("../src/tightness");

// Every zone the renderer actually drew, by id, with the height it was given.
function drawnZones(html) {
  const out = {};
  const re = /<div class="zone zone--(\w+)"[^>]*?height:([0-9.]+)mm/g;
  let m;
  while ((m = re.exec(html))) out[m[1]] = Number(m[2]);
  return out;
}

// ─── the maths sheet ─────────────────────────────────────────────────────

const transformationTable = {
  helper: "recording-table",
  caption: "Complete the table.",
  columns: ["1,000 less", "Starting number", "1,000 more"],
  rows: [["", "4,382", ""]],
  writing: "number",
};

test("a box for one number is not made page-sized by a page with room to spare", () => {
  const html = renderSheet({
    layout: "full",
    orientation: "portrait",
    yearGroup: 4,
    zones: { a: { question: true, ...transformationTable } },
  });
  const zones = drawnZones(html);

  assert.ok(
    zones.a < 60,
    `a one-row table taking three numbers was drawn ${zones.a}mm deep on a 267mm ` +
      "page. The page had the room; the answer did not need it."
  );
  assert.ok(
    zones.a > measure({ ...transformationTable, helper: "recording-table" }, 174),
    "and it is not squeezed either: the row still gets what a written number needs"
  );
});

test("what a number cell may grow to is smaller than what a sentence cell may", () => {
  const numbers = { ...transformationTable };
  const sentences = { ...transformationTable, writing: "sentence" };

  const numberRoom = enough(numbers, 174) - measure(numbers, 174);
  const sentenceRoom = enough(sentences, 174) - measure(sentences, 174);

  assert.ok(
    sentenceRoom > numberRoom,
    `a sentence cell gained ${sentenceRoom.toFixed(1)}mm of useful room and a ` +
      `number cell ${numberRoom.toFixed(1)}mm. A child fitting more words into a ` +
      "box is genuinely better off; a four-digit number is the same four digits."
  );
});

test("a table that outgrew its answer is named, not passed as writing space", () => {
  // The report used to test `greed === 0`, which reads as "anything that can
  // grow has used what it was given". That is how a 30mm blank number row
  // shipped on a page the report called sound.
  const result = tightnessOf({
    layout: "halves-side",
    orientation: "portrait",
    yearGroup: 4,
    zones: {
      a: {
        helper: "written-answers",
        items: [
          { text: "Explain the pattern you can see.", lines: 6 },
          { text: "What happens to the hundreds digit?", lines: 6 },
          { text: "Write a rule for adding 1,000.", lines: 6 },
        ],
      },
      b: {
        row: [
          { ...transformationTable },
          {
            helper: "written-answers",
            items: [{ text: "How do you know?", lines: 1 }],
          },
        ],
      },
    },
  });

  const named = result.spare.find((s) => s.zone === "b");
  assert.ok(
    named,
    "a one-row number table handed a column's height reported nothing at all"
  );
  assert.equal(
    named.overgrown,
    true,
    "and it is the box-bigger-than-its-answer fault, not blank paper beneath one"
  );
});

// ─── the balanced-diet sheet ─────────────────────────────────────────────

const lunchbox = {
  helper: "drawing-space",
  text: "Design a balanced lunchbox. Draw four foods, label each one, and add an arrow saying why you chose it.",
  draw: 4,
  annotate: true,
};

test("an open drawing task keeps a real working surface", () => {
  const html = renderSheet({
    layout: "thirds-stacked",
    orientation: "portrait",
    yearGroup: 4,
    zones: {
      a: { helper: "instruction", text: "Use the eatwell plate to help you." },
      b: { question: true, ...lunchbox },
      c: {
        helper: "written-answers",
        items: [{ text: "Why is your lunchbox balanced?", sentences: 2 }],
      },
    },
  });
  const zones = drawnZones(html);

  assert.ok(
    zones.b > 90,
    `the drawing surface came out ${zones.b}mm. Four foods, four labels and four ` +
      "arrows do not fit in a strip, and shrinking the task is not the repair."
  );
});

test("and it does not take the rest of the page while it is there", () => {
  const html = renderSheet({
    layout: "full",
    orientation: "portrait",
    yearGroup: 4,
    zones: { a: { question: true, ...lunchbox } },
  });
  const zones = drawnZones(html);

  assert.ok(
    zones.a < 160,
    `the drawing surface was drawn ${zones.a}mm deep on a 267mm page. The surface ` +
      "a task needs is a decision somebody makes, not whatever the page had left."
  );
});

test("a surface stated in millimetres is the surface that gets drawn", () => {
  // The escape hatch, and the reason the derived size is allowed to be modest:
  // a designer who has looked at the task can say what it wants.
  const stated = { ...lunchbox, heightMm: 140 };
  const html = renderSheet({
    layout: "full",
    orientation: "portrait",
    yearGroup: 4,
    zones: { a: { question: true, ...stated } },
  });
  const zones = drawnZones(html);

  assert.ok(
    zones.a > 140 && zones.a < 165,
    `asked for a 140mm surface and drew ${zones.a}mm`
  );
});

test("a sorting grid is a sorting grid, and stops where sorting stops gaining", () => {
  const grid = {
    helper: "sort-grid",
    text: "Sort these foods into the right column.",
    columns: ["Everyday", "Sometimes"],
    rows: 4,
    wordBank: ["apple", "crisps", "cheese", "cake", "carrot", "biscuit"],
  };
  const html = renderSheet({
    layout: "full",
    orientation: "portrait",
    yearGroup: 4,
    zones: { a: { question: true, ...grid } },
  });
  const zones = drawnZones(html);

  assert.ok(
    zones.a < 160,
    `a four-row sorting grid was drawn ${zones.a}mm deep on a 267mm page. Room to ` +
      "write words in is a real gain and it is not an unlimited one."
  );
});

// ─── the history sheet ───────────────────────────────────────────────────

test("a ruled line's cap is a cap on the block that holds it", () => {
  const answers = {
    helper: "written-answers",
    items: [{ text: "What can you tell about the Tudor doll?", lines: 2 }],
  };
  const html = renderSheet({
    layout: "halves-side",
    orientation: "portrait",
    yearGroup: 4,
    zones: {
      a: {
        helper: "written-answers",
        items: [{ text: "Compare the two dolls.", lines: 10 }],
      },
      b: answers,
    },
  });

  assert.match(
    html,
    /<div class="h-lines" style="max-height:[0-9.]+mm">/,
    "the box holding the ruled lines has to stop where the lines stop, or the " +
      "room they refused pools as a hole underneath them"
  );
  assert.match(
    html,
    /<li class="h-q h-written" style="flex-grow:2">/,
    "and spare room is shared out by how many lines each answer has, so a " +
      "one-line answer is not handed the same extra as a four-line one"
  );
});

test("what a written block may grow to is exactly what its lines may grow to", () => {
  const spec = {
    helper: "written-answers",
    items: [
      { text: "Explain your answer.", lines: 3 },
      { text: "And how you checked it.", lines: 2 },
    ],
    phase: "upper",
  };
  const naturalMm = measure(spec, 120);
  const usefulMm = enough(spec, 120);

  // Five lines at the upper-phase 6mm, each allowed half again.
  assert.ok(
    Math.abs(usefulMm - naturalMm - 5 * 3) < 0.01,
    `the block gained ${(usefulMm - naturalMm).toFixed(2)}mm of useful room where ` +
      "its five lines can between them use 15mm"
  );
});

// ─── the heading, on all six pages ───────────────────────────────────────
//
// Every page of all three packs carried the same tiny grey objective jammed
// against the physical corner of the paper, and the same sheet code jammed
// against the other. That is not six agents making the same unfortunate
// decision: it was two lines of CSS placing them at `left: 0; top: 0` on the
// body, which is outside the margin and inside the strip some classroom
// printers cannot print at all. No instruction to "give the worksheet a
// polished header" could ever have reached it.

test("the sheet's heading is aligned to the work, not to the edge of the paper", () => {
  const html = renderSheet({
    layout: "full",
    orientation: "portrait",
    yearGroup: 4,
    code: "C",
    zones: { a: { question: true, ...transformationTable } },
  });

  assert.match(
    html,
    /\.sheet-code \{[^}]*right: 15mm; top: 6mm/s,
    "the code sits on the same right edge as the work beneath it"
  );
});

// A sheet does not print the learning objective. The class has it on the board
// and in their books, so the paper repeating it bought a line of the child's
// page on every sheet and nothing else. It was also the string the combined-PDF
// merge corrupted, which is how two September 2026 packs went out headed "To ex"
// and "To id". The strongest guarantee against a clipped objective is a sheet
// that has no objective to clip, so this is checked at the renderer rather than
// asked of a designer.
test("no sheet prints the learning objective, whatever the spec carries", () => {
  const html = renderSheet({
    layout: "full",
    orientation: "portrait",
    yearGroup: 4,
    lo: "To add and subtract 1,000 from a four-digit number",
    code: "C",
    zones: { a: { question: true, ...transformationTable } },
  });

  assert.ok(
    !html.includes("To add and subtract 1,000 from a four-digit number"),
    "a stale `lo` left in a spec must not reach the page"
  );
  assert.ok(
    !/class="lo"/.test(html),
    "and no objective element is emitted at all"
  );
});

test("the compact heading uses the existing top margin, not teaching space", () => {
  const { contentArea } = require("../src/render");
  const bare = contentArea({ orientation: "portrait" });
  const headed = contentArea({ orientation: "portrait", code: "C" });

  assert.equal(headed.heightMm, bare.heightMm,
    "the compact product header belongs in the existing printer margin");
});

// The band is now a fixed one line, because the only thing in it is a one- or
// two-character code. An objective is what used to make it unpredictable.
test("an objective in the spec cannot change the band's height", () => {
  const { contentArea } = require("../src/render");
  const short = contentArea({ orientation: "portrait", code: "C" });
  const withStaleLo = contentArea({
    orientation: "portrait",
    code: "C",
    lo: "To identify the continuities and changes to children's lives using a range of sources across the Tudor period and the present day",
  });

  assert.equal(
    withStaleLo.heightMm,
    short.heightMm,
    "the objective is not printed, so it cannot cost the page any height"
  );
});

// ─── one person saying one thing ─────────────────────────────────────────

test("a claim to judge does not need two people and two bubbles", () => {
  const { measure } = require("../src/helpers");
  const claim = {
    helper: "named-claim",
    text: "Tick or cross, then explain how you know.",
    speaker: "Ethan",
    says: "If I add 1,000 to 4,382, the hundreds digit changes.",
    lines: 3,
  };
  const asAScene = {
    helper: "speech-scene",
    text: "Is Ethan right? Tick or cross, then explain how you know.",
    turns: [
      { speaker: "Ethan", says: "If I add 1,000 to 4,382, the hundreds digit changes." },
      { speaker: "You", lines: 3 },
    ],
  };

  const html = renderSheet({
    layout: "full",
    orientation: "portrait",
    yearGroup: 4,
    zones: { a: { question: true, ...claim } },
  });

  assert.ok(
    !html.includes('<span class="h-speech-figure">'),
    "an explanation question is not a staged dialogue, and drawing one says it is"
  );
  assert.match(html, /Ethan/, "the speaker keeps their name");
  assert.match(html, /hundreds digit changes/, "and their exact words");
  assert.match(html, /h-speech-judge-box/, "and the tick or cross still has a box");
  assert.ok(
    measure(claim, 174) < measure(asAScene, 174),
    "the same claim and the same response cost less page without the furniture"
  );
});

test("the code band clears the work below it", async () => {
  // The band used to have to price a teacher-written objective, and a band
  // fixed at one line under a two-line objective was the second line printing
  // across the top of the first zone. Nothing wraps in it now, but the clearance
  // it was built to guarantee is still the thing that keeps a zone's top line
  // readable, so it stays checked on the rendered page rather than in millimetres.
  const puppeteer = require("puppeteer-core");
  const { findChrome } = require("../src/chrome");

  const html = renderSheet({
    layout: "full",
    orientation: "portrait",
    yearGroup: 4,
    code: "C",
    zones: { a: { question: true, ...transformationTable } },
  });

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const gap = await page.evaluate(() => {
      const code = document.querySelector(".sheet-code").getBoundingClientRect();
      const area = document.querySelector(".area").getBoundingClientRect();
      return { clearMm: (area.top - code.bottom) / (96 / 25.4) };
    });

    assert.ok(
      gap.clearMm >= 0,
      `the code ran ${(-gap.clearMm).toFixed(1)}mm into the work below it`
    );
    assert.ok(
      gap.clearMm < 5,
      `the band left ${gap.clearMm.toFixed(1)}mm of nothing under the code. ` +
        "It is a heading, not a title page."
    );
  } finally {
    await browser.close();
  }
});
