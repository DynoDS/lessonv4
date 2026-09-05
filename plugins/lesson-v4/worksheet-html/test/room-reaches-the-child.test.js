"use strict";

// Room the page has, reaching the child who needs it.
//
// One Year 4 science sheet produced three faults at once, and all three shared
// a shape: the engine knew about some space or some words, and the thing that
// needed them never got them.
//
//   A drawing box told to take a whole side came out 20mm tall, because
//   numbering the question pinned its content to the top of the zone.
//
//   The side it sat on stayed 44mm deep on a 180mm page, because a column
//   shorter than the one beside it was never offered its own leftover.
//
//   A sorting box's two columns came out 35mm and 65mm, because the browser
//   sized them by how long each heading happened to be.
//
// The teacher's words, after the second attempt: "I have no idea whats wrong
// or why you can't make it, it's html."

const assert = require("node:assert/strict");
const test = require("node:test");

const { renderSheet } = require("../src/render");
const { tightnessOf } = require("../src/tightness");

const PX_PER_MM = 96 / 25.4;

// Every zone the renderer actually drew, by id, with the height it was given.
function drawnZones(html) {
  const out = {};
  const re = /<div class="zone zone--(\w+)"[^>]*?height:([0-9.]+)mm/g;
  let m;
  while ((m = re.exec(html))) out[m[1]] = Number(m[2]);
  return out;
}

// The sheet that failed: a column of questions on the left, and one task on
// the right whose whole point is the room it gives the child to draw in.
function drawingBesideAColumn({ numbered }) {
  const box = {
    helper: "sort-grid",
    text: "Draw an object that uses electricity and one that works by hand.",
    columns: ["Uses electricity", "Works by hand"],
    rows: 1,
  };
  return {
    layout: "halves-side",
    orientation: "landscape",
    yearGroup: 4,
    zones: {
      a: {
        stack: [
          {
            question: true,
            helper: "written-answers",
            items: [{ text: "What makes an object an electrical appliance?", lines: 6 }],
          },
          {
            question: true,
            helper: "written-answers",
            items: [{ text: "Name two appliances that run from a battery.", lines: 6 }],
          },
        ],
      },
      // The same content, numbered or not. A number is a label; it must not be
      // a layout decision.
      b: numbered ? { question: true, ...box } : box,
    },
  };
}

test("numbering a question does not change the zone it is given", () => {
  const plain = drawnZones(renderSheet(drawingBesideAColumn({ numbered: false })));
  const numbered = drawnZones(renderSheet(drawingBesideAColumn({ numbered: true })));

  assert.ok(
    Math.abs(plain.b - numbered.b) < 1,
    `numbering the question changed its zone from ${plain.b}mm to ${numbered.b}mm. ` +
      "A question's number is a label beside it, not a decision about how much " +
      "room its content gets."
  );
});

test("a numbered question's body is stretched, and only its number is pinned", () => {
  // The zone above is the right size either way; what went wrong was INSIDE
  // it. The number and its body were pinned to the top together, so the body
  // was only ever as tall as its own text and a grid told to fill the zone
  // filled nothing. This is the browserless guard on that; the browser check
  // below measures what the child actually gets.
  const html = renderSheet(drawingBesideAColumn({ numbered: true }));

  assert.match(
    html,
    /\.h-numbered\s*\{[^}]*align-items:\s*stretch/,
    "the numbered wrapper pins its body to the top, so content told to fill " +
      "the zone stops at the height of its own text"
  );
  assert.match(
    html,
    /\.h-numbered-n\s*\{[^}]*align-self:\s*flex-start/s,
    "the number itself must stay beside the question's first line, not centre " +
      "down the side of a tall question"
  );
});

test("a short column's own leftover reaches the content that can use it", () => {
  const html = renderSheet(drawingBesideAColumn({ numbered: true }));
  const zones = drawnZones(html);

  assert.ok(
    zones.b > zones.a * 0.9,
    `the drawing side was drawn ${zones.b}mm deep beside a ${zones.a}mm column. ` +
      "The paper under it belongs to no other zone on the page, so it prints " +
      "as a hole rather than as room to draw in."
  );
});

test("a fixed helper in a short column is not inflated to fill it", () => {
  // The control. A column that CANNOT use height keeps its natural size: the
  // fix hands room to greedy content, never to a chart or a drawn figure that
  // gains nothing and would only be stretched out of shape.
  const html = renderSheet({
    layout: "halves-side",
    orientation: "landscape",
    yearGroup: 4,
    zones: {
      a: {
        stack: [
          {
            question: true,
            helper: "written-answers",
            items: [{ text: "Explain how you know.", lines: 8 }],
          },
        ],
      },
      b: {
        question: true,
        helper: "multiple-choice", // greed 0: a fixed set of options
        text: "Which of these uses electricity?",
        options: ["A kettle", "A hammer"],
        select: "one",
      },
    },
  });
  const zones = drawnZones(html);

  assert.ok(
    zones.b < zones.a * 0.6,
    `a fixed set of options was drawn ${zones.b}mm deep beside a ${zones.a}mm ` +
      "column. Spare height is for content that gains from it; growing this " +
      "only spreads two tick boxes down a page."
  );
});

test("a sorting box's columns are equal, whatever its headings are called", () => {
  // The failure: one heading four times longer than the other, and the child
  // given a sliver for the drawing and a hall for the sentence.
  const html = renderSheet({
    layout: "full",
    orientation: "landscape",
    yearGroup: 4,
    zones: {
      a: {
        question: true,
        helper: "sort-grid",
        text: "Draw one more electrical appliance and name it.",
        columns: ["Your drawing", "What electricity helps it do"],
        rows: 1,
      },
    },
  });

  assert.match(
    html,
    /\.h-sortgrid-table\s*\{[^}]*table-layout:\s*fixed/,
    "a sorting grid's columns are sized by their headings unless the table is " +
      "laid out fixed, so the group with the longer name takes the page."
  );
  assert.ok(
    !/<th[^>]*style="[^"]*width/.test(html.split("h-sortgrid-table")[1] || ""),
    "no sorting column states its own width, so fixed layout divides the box evenly."
  );
});

test("room goes to the box, not to the writing lines beside it", async () => {
  // Two questions in one column: an explain-in-two-lines, and a box to draw
  // in. Shared equally, half the column's leftover printed as a hole under two
  // ruled lines and the box got half the space it should have had.
  //
  // "Can this use spare height?" and "does it keep gaining from it?" are
  // different questions. A writing line reaches its useful size; a box a child
  // draws in does not.
  const puppeteer = require("puppeteer-core");
  const { findChrome } = require("../src/chrome");

  const html = renderSheet({
    layout: "halves-side",
    orientation: "landscape",
    yearGroup: 4,
    zones: {
      a: {
        stack: [
          {
            question: true,
            helper: "written-answers",
            items: [{ text: "Explain how a torch works.", lines: 8 }],
          },
        ],
      },
      b: {
        stack: [
          {
            question: true,
            helper: "written-answers",
            items: [{ text: "Is Dev right? Explain.", lines: 2 }],
          },
          {
            question: true,
            stack: [
              { helper: "instruction", text: "Draw one more electrical appliance." },
              {
                helper: "sort-grid",
                columns: ["Your drawing", "What electricity helps it do"],
                rows: 1,
              },
            ],
          },
        ],
      },
    },
  });

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const drawn = await page.evaluate(() => {
      const zone = document.querySelector('[data-worksheet-zone="b"]');
      const items = [...zone.querySelectorAll(":scope > .h-stack > .h-stack-item")];
      const line = zone.querySelector(".h-line");
      return {
        explain: items[0].getBoundingClientRect().height,
        drawing: items[1].getBoundingClientRect().height,
        line: line.getBoundingClientRect().height,
      };
    });

    assert.ok(
      drawn.drawing > drawn.explain * 2,
      `the drawing block took ${Math.round(drawn.drawing)}px beside an ` +
        `explain-in-two-lines block of ${Math.round(drawn.explain)}px. Spare ` +
        "room belongs to the box that keeps gaining from it."
    );
    assert.ok(
      drawn.line < 40,
      `a ruled line came out ${Math.round(drawn.line)}px tall. A line gets ` +
        "roomier and then stops; past that it is an invitation to write an " +
        "essay the question never asked for."
    );
  } finally {
    await browser.close();
  }
});

// The one that matters: what a child is actually handed. Every assertion above
// reads markup or CSS, and the whole failure was that markup and CSS agreed
// with each other while the drawn page did not.
test("the drawing box really fills its side when the page is drawn", async () => {
  const puppeteer = require("puppeteer-core");
  const { findChrome } = require("../src/chrome");

  const html = renderSheet(drawingBesideAColumn({ numbered: true }));
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const drawn = await page.evaluate(() => {
      const zone = document.querySelector('[data-worksheet-zone="b"]');
      const grid = zone.querySelector(".h-sortgrid-table");
      const cells = [...zone.querySelectorAll(".h-sortgrid-table tbody td")];
      return {
        zone: zone.getBoundingClientRect().height,
        grid: grid.getBoundingClientRect().height,
        cellWidths: cells.map((c) => Math.round(c.getBoundingClientRect().width)),
      };
    });

    assert.ok(
      drawn.grid > drawn.zone * 0.7,
      `the drawing box was drawn ${Math.round(drawn.grid)}px inside a ` +
        `${Math.round(drawn.zone)}px zone. The room was there and the child ` +
        "did not get it."
    );
    assert.equal(
      drawn.cellWidths[0],
      drawn.cellWidths[1],
      `the two halves came out ${drawn.cellWidths.join("px and ")}px. Sorting ` +
        "columns are equal, however long their headings are."
    );
  } finally {
    await browser.close();
  }
});

test("the millimetre-to-pixel assumption these heights are read against", () => {
  // Kept honest: the zone heights above are millimetres in the markup, and the
  // browser check works in pixels.
  assert.ok(Math.abs(PX_PER_MM - 3.7795) < 0.001);
});


// ─── the report measures the page that is drawn ──────────────────────────
//
// A zone's height is not its share of the layout tree. `growToFit` sizes each
// zone to what it holds, which is why two stacked layouts with different
// declared ratios draw the identical page. The report used to measure against
// the SHARE, so it invented blank paper nobody prints: a balanced-diet sheet's
// four step lines were reported as "needs 46mm and was given 267mm, so 221mm
// below it prints empty" while the build drew that zone at 47.79mm with the
// questions beside it. The same false line fired on any short support panel in
// a full-height column, which is most of them, and a designer chasing it pads
// or moves a panel that was right (5 September 2026).

test("a short support panel beside a full column is not called blank paper", () => {
  // Four instruction lines in a narrow column, questions down the wide one.
  // The support zone is drawn at its own content height; the paper beside it
  // is where the questions are.
  const result = tightnessOf({
    layout: "side-30-70",
    zones: {
      a: {
        stack: [
          { helper: "instruction", text: "Partition each amount." },
          { helper: "instruction", text: "Add the pounds." },
          { helper: "instruction", text: "Add the pence." },
          { helper: "instruction", text: "Write the total." },
        ],
      },
      b: {
        question: true,
        helper: "written-answers",
        items: [
          { text: "Work out the total.", lines: 6 },
          { text: "Explain your method.", lines: 6 },
          { text: "Check it another way.", lines: 6 },
        ],
      },
    },
  });
  assert.deepEqual(
    result.spare,
    [],
    `a support panel drawn at its content height was called blank paper: ${JSON.stringify(result.spare)}`
  );
});

test("a page that really does leave most of itself empty is still reported", () => {
  // The discrimination. A single full-page zone genuinely owns the whole
  // printable page, so one short question on it leaves real blank paper and
  // the report must still say so.
  const result = tightnessOf({
    layout: "full",
    zones: { a: { question: true, helper: "questions", items: ["What is 4 x 3?"] } },
  });
  assert.ok(
    result.spare.length > 0,
    "one short question on a whole page was passed as spending its height"
  );
});

// ─── the report has to describe the page the browser draws ───────────────
//
// Zone heights were repaired for this once. One level down, a stack item
// marked as growing is given "flex: 1 1 auto", so the browser shares the
// stack's leftover between those items - and the report was still printing
// their natural heights. A Year 4 Greater Depth sheet's answer blocks were
// drawn at 73mm and reported at 33mm.

test("a growing stack item is reported at the height the stack gives it", () => {
  const { inspectContent, measureContent } = require("../src/helpers");
  const stack = {
    stack: [
      { helper: "section-label", text: "Going Deeper" },
      { helper: "written-answers", items: [{ text: "Write a rule.", sentences: 3 }] },
    ],
  };
  const widthMm = 174;
  const natural = measureContent(stack, widthMm);
  const given = natural + 60;

  const grown = inspectContent(stack, widthMm, given);
  const answers = grown.parts[1];
  const label = grown.parts[0];

  assert.ok(answers.gotHeightMm > answers.needHeightMm + 50,
    `the answers block should carry the stack's spare, got ${answers.gotHeightMm} needing ${answers.needHeightMm}`);
  assert.ok(answers.heightImposed, "a height the stack handed over is imposed, not chosen");
  assert.ok(Math.abs(label.gotHeightMm - label.needHeightMm) < 0.01,
    "a heading gains nothing from spare height and must not be reported as taller than it is");

  // And with nothing spare, nothing changes: this must not invent height.
  const tight = inspectContent(stack, widthMm, natural);
  assert.ok(Math.abs(tight.parts[1].gotHeightMm - tight.parts[1].needHeightMm) < 0.01,
    "a stack with no spare must report every item at its natural height");
});

test("a written answer line grows into spare room but only so far", () => {
  // Growth that never reached the rules was the fault; growth without a
  // ceiling is the overcorrection. A two-centimetre gap between ruled lines
  // reads as a mistake, and how many lines a question deserves belongs to the
  // designer's sentences field, not to stretching three of them.
  const { renderSheet } = require("../src/render.js");
  const { WRITING_LINE_MM, WRITING_LINE_GROWN_RATIO } = require("../src/tokens");
  const html = renderSheet({
    title: "t", orientation: "portrait", layout: "full",
    zones: { a: { stack: [{ question: true, helper: "written-answers", phase: "upper", items: [{ text: "Write a rule.", sentences: 3 }] }] } },
  });
  const expected = (WRITING_LINE_MM.upper * WRITING_LINE_GROWN_RATIO).toFixed(2);
  assert.ok(html.includes(`max-height:${expected}mm`),
    `every ruled line should carry its growth ceiling (${expected}mm)`);
  assert.match(html, /\.h-answers \.h-written \{ align-items: stretch; \}/,
    "the body must be allowed to stretch, or the height never reaches the rules");
});
