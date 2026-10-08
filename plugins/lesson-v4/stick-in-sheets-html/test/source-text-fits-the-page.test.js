"use strict";

// Does a full-page text source fit the page a browser actually draws?
//
// The copy chose its size by sums and never looked. On 6 October 2026 a Year 4
// science sheet, two explanations of the stomach to choose between, drew 209mm
// tall on a page that holds 185mm, and the page cut the bottom of its frame
// off. On a machine without a browser this skips, as the build itself falls
// back to its sums there.

const { test } = require("node:test");
const assert = require("node:assert");
const { normaliseSourceText, renderSourceTextPagesMeasured } = require("../src/render-source-text");
const { measureBodyMm, pageDiv, PRINTABLE_W_MM, PRINTABLE_H_MM } = require("../build");
const { findChrome, launchBrowser } = require("../../worksheet-html/src/chrome");

const PAGE = { printableWMm: PRINTABLE_W_MM, printableHMm: PRINTABLE_H_MM, pageHtml: pageDiv };

const stomach = {
  visual: "source-text",
  label: "Which explanation helps the reader?",
  spec: {
    title: "Which explanation helps the reader?",
    instruction: "Your teeth have already broken food into small pieces. Why is the stomach still needed? Choose the explanation that tells us why the stomach is still needed after chewing. With your partner, mark the words that helped you choose.",
    text: "Chewed food travels down the oesophagus to the stomach. The stomach churns it with digestive juices, so it is mixed before passing into the small intestine, where digestion carries on.\n\nChewed food travels down the oesophagus to the stomach. The stomach churns it with digestive juices, so those juices help break it down further before it passes into the small intestine.",
    per: "pair",
  },
};

function browserAvailable() {
  try {
    return Boolean(findChrome());
  } catch {
    return false;
  }
}

test("a full-page text source is drawn inside the page, not past the bottom of it", { timeout: 120000 }, async (t) => {
  if (!browserAvailable()) {
    t.skip("no browser on this machine, so nothing could be measured");
    return;
  }
  const browser = await launchBrowser();
  try {
    const measure = (html) => measureBodyMm(browser, html);
    const laid = await renderSourceTextPagesMeasured(normaliseSourceText(stomach, 32), PAGE, measure);
    assert.ok(!laid.error, laid.error);
    assert.strictEqual(laid.pages.length, 16);
    const drawn = await measure(laid.pages[0]);
    assert.ok(drawn <= PRINTABLE_H_MM, `the copy draws ${drawn.toFixed(1)}mm tall on a page that holds ${PRINTABLE_H_MM}mm`);
    assert.ok(laid.pt >= 20, `the words should stay large on a whole page, and came out at ${laid.pt}pt`);
  } finally {
    await browser.close();
  }
});

test("a source that draws too tall at every size is refused by name, never cut short", async () => {
  const laid = await renderSourceTextPagesMeasured(normaliseSourceText(stomach, 32), PAGE, async () => 400);
  assert.ok(laid.error, "expected a refusal");
  assert.match(laid.error, /draws 400 mm tall/);
  assert.match(laid.error, /will not shrink the words/);
});

test("with no browser to measure in, the copy is laid out by its sums as before", async () => {
  const laid = await renderSourceTextPagesMeasured(normaliseSourceText(stomach, 32), PAGE, null);
  assert.ok(!laid.error, laid.error);
  assert.strictEqual(laid.pages.length, 16);
});
