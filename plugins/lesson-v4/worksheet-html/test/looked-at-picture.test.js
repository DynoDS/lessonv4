"use strict";

// Three repairs from the worksheet designer's trial run on a Year 2 sheet
// (9 October 2026), each chosen by the teacher from real pages: a photograph
// the children look at is drawn a little smaller before a sheet is split into
// columns; a photograph trimmed on purpose is not read as lost work; and the
// line between two columns runs to the end of the longer one.

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const { resolveAutoLayouts, sheetsOf } = require("../src/worksheet");
const { renderSheet } = require("../src/render");
const { renderHelper, measureContent } = require("../src/helpers");
const { RENDERED_FIT_PROBE } = require("../src/chrome");

// A wide photograph, already resolved: 2.3 to 1, like the one that showed this.
const photo = (extra = {}) => ({
  helper: "card-row",
  columns: 1,
  cards: [{ imageHref: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", imageWidth: 2300, imageHeight: 1000 }],
  ...extra,
});

const answers = (count) =>
  Array.from({ length: count }, (_, i) => ({
    question: true,
    helper: "written-answers",
    items: [{ text: `Write a phrase for noun ${i + 1}.`, lines: 2 }],
  }));

function auto(stack, extra = {}) {
  return {
    meta: { yearGroup: 2 },
    sheets: {
      expected: {
        recording: "sheet",
        recordingReason: "the child writes on the printed lines",
        layout: "auto",
        zones: [{ stack }],
        ...extra,
      },
    },
    answerKey: { expected: [] },
  };
}

// The number of questions that puts this sheet a little over one column with
// the photograph at full size, found rather than assumed so the test does not
// depend on a line height.
function justTooTall(make) {
  for (let n = 3; n < 14; n += 1) {
    const { choices } = resolveAutoLayouts(auto(make(n)));
    if (choices[0].zoneCount > 1 || choices[0].pictureScale) return n;
  }
  throw new Error("no count overflowed one column");
}

test("a photograph the children look at is drawn smaller before the sheet is split", () => {
  const make = (n) => [photo(), ...answers(n)];
  const n = justTooTall(make);
  const { worksheet, choices } = resolveAutoLayouts(auto(make(n)));
  const choice = choices[0];

  assert.equal(choice.zoneCount, 1, "the sheet stays in one column");
  assert.ok(choice.pictureScale >= 2 / 3 - 1e-9 && choice.pictureScale < 1, `drawn at ${choice.pictureScale}`);
  assert.equal(choice.splitFrom, null, "and it is not reported as a split");
  const kept = worksheet.sheets.expected.zones.a.stack[0];
  assert.equal(kept.lookedAtScale, choice.pictureScale);
  // Everything else is exactly what was written.
  assert.deepEqual(
    worksheet.sheets.expected.zones.a.stack.slice(1).map((q) => q.items),
    make(n).slice(1).map((q) => q.items)
  );
});

test("the photograph is never drawn under two thirds: past that the split is tried, as before", () => {
  const make = (n) => [photo(), ...answers(n)];
  let n = justTooTall(make);
  let choice;
  // Keep adding questions until shrinking the photograph is no longer enough.
  for (; n < 16; n += 1) {
    try {
      choice = resolveAutoLayouts(auto(make(n))).choices[0];
    } catch (error) {
      assert.equal(error.signal, "SHEET_DOES_NOT_FIT");
      return; // refused, as a sheet too big for a page always was
    }
    if (!choice.pictureScale) break;
    assert.ok(choice.pictureScale >= 2 / 3 - 1e-9);
  }
  assert.ok(choice.zoneCount > 1, "what shrinking could not hold was set out in columns");
  assert.equal(choice.pictureScale, null);
});

test("a picture the children work on, or one the designer sized, is never shrunk", () => {
  for (const worked of [
    photo({ writeLabel: "Write why." }),
    photo({ markLabel: "Tick" }),
    photo({ imageHeightMm: 76 }),
    { ...photo(), cards: [{ ...photo().cards[0], caption: "A tree on a hill" }] },
  ]) {
    const make = (n) => [worked, ...answers(n)];
    for (let n = 3; n < 12; n += 1) {
      let choice;
      try {
        choice = resolveAutoLayouts(auto(make(n))).choices[0];
      } catch {
        break;
      }
      assert.equal(choice.pictureScale, null, JSON.stringify(worked).slice(0, 80));
    }
  }
});

test("a sheet that fits as written is drawn exactly as before", () => {
  const stack = [photo(), ...answers(2)];
  const { worksheet, choices } = resolveAutoLayouts(auto(stack));
  assert.equal(choices[0].pictureScale, null);
  assert.equal(worksheet.sheets.expected.zones.a.stack[0].lookedAtScale, undefined);
});

test("the smaller photograph is smaller on the page, and only when the engine asked", () => {
  const full = measureContent(photo(), 170);
  const smaller = measureContent(photo({ lookedAtScale: 0.7 }), 170);
  assert.ok(smaller < full * 0.8 && smaller > full * 0.6, `${smaller}mm against ${full}mm`);
  // Outside the range the engine uses, the field does nothing.
  assert.equal(measureContent(photo({ lookedAtScale: 0.3 }), 170), full);
  assert.equal(measureContent(photo({ lookedAtScale: 1.4 }), 170), full);
});

// ─── a trimmed photograph ────────────────────────────────────────────────

test("a photograph's trim is marked, and the page check leaves a marked trim alone", () => {
  const html = renderHelper(
    { ...photo(), cards: [{ ...photo().cards[0], crop: { top: 0.08, bottom: 0.18 } }] },
    170
  );
  assert.match(html, /class="h-card-view" style="[^"]*" data-trim-viewport>/);
  assert.match(RENDERED_FIT_PROBE, /hasAttribute\("data-trim-viewport"\)\) continue;/);
});

test("the drawn page passes with a trimmed photograph, and still catches a real cut", { skip: !hasChrome() }, async () => {
  const { launchBrowser } = require("../src/chrome");
  const worksheet = auto(
    [{ ...photo(), cards: [{ ...photo().cards[0], crop: { top: 0.08, bottom: 0.18 } }] }, ...answers(2)],
    { layout: "full", orientation: "portrait", zones: undefined }
  );
  worksheet.sheets.expected.zones = {
    a: { stack: [{ ...photo(), cards: [{ ...photo().cards[0], crop: { top: 0.08, bottom: 0.18 } }] }, ...answers(2)] },
  };
  const [sheet] = sheetsOf(resolveAutoLayouts(worksheet).worksheet);
  const html = renderSheet(sheet.spec);
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    assert.deepEqual(await page.evaluate(RENDERED_FIT_PROBE), [], "a deliberate trim is not a fit problem");

    // The same page with a box that really does cut its content off.
    await page.evaluate(() => {
      const box = document.createElement("div");
      box.style.cssText = "height:5mm;overflow:hidden";
      box.innerHTML = "<p style='height:30mm;margin:0'>cut off</p>";
      document.querySelector("[data-worksheet-zone]").firstElementChild.appendChild(box);
    });
    const problems = await page.evaluate(RENDERED_FIT_PROBE);
    assert.ok(problems.some((p) => p.kind === "child-clipped"), "lost work is still reported");
  } finally {
    await browser.close();
  }
});

function hasChrome() {
  try {
    require("../src/chrome").findChrome();
    return true;
  } catch {
    return false;
  }
}

// ─── the line between two columns ────────────────────────────────────────

test("the line between two columns runs to the end of the longer one", () => {
  const worksheet = {
    meta: { yearGroup: 2 },
    sheets: {
      expected: {
        recording: "sheet",
        recordingReason: "the child writes on the printed lines",
        layout: "halves-side",
        orientation: "landscape",
        zones: { a: { stack: answers(5) }, b: { stack: answers(1) } },
      },
    },
    answerKey: { expected: [] },
  };
  const [sheet] = sheetsOf(resolveAutoLayouts(worksheet).worksheet);
  const { drawnZones } = require("../src/render");
  const zones = drawnZones(sheet.spec);
  const longer = Math.max(...zones.map((z) => z.y + z.h));
  const shorter = Math.min(...zones.map((z) => z.y + z.h));
  assert.ok(longer - shorter > 40, "one column is much the longer");

  const html = renderSheet(sheet.spec);
  const rule = /class="zone-rule zone-rule--down" style="left:[0-9.]+mm;top:([0-9.]+)mm;height:([0-9.]+)mm"/.exec(html);
  assert.ok(rule, "a line is drawn between the columns");
  assert.ok(
    Math.abs(Number(rule[1]) + Number(rule[2]) - longer) < 0.5,
    `the line ends at ${Number(rule[1]) + Number(rule[2])}mm and the longer column at ${longer}mm`
  );
});
