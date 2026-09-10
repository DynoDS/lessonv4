"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { renderContent, measureContent, needsContent } = require("../src/helpers");
const { renderSheet } = require("../src/render");

const chart = (digits) => ({
  helper: "place-value-chart",
  columns: ["Th", "H", "T", "O"],
  rows: [{ cells: digits }],
});

test("comparisonPair keeps arbitrary representations around one empty target", () => {
  const pair = { number: 1, comparisonPair: { left: chart(["4", "3", "2", "1"]), right: chart(["4", "2", "9", "9"]) } };
  const html = renderContent(pair, 180);
  assert.equal((html.match(/h-pvchart/g) || []).length >= 2, true);
  assert.equal((html.match(/h-comparison-target/g) || []).length, 1);
  assert.match(html, /h-comparison-pair/);
  assert.match(html, /h-numbered-n/);
  assert.ok(measureContent(pair, 180) > 0);
  assert.ok(needsContent(pair).minWidthMm > 0);
});

test("the shared worksheet shell renders a title, code badge and structural rule", () => {
  const html = renderSheet({
    title: "Compare numbers",
    code: "Sheet B",
    layout: "full",
    orientation: "portrait",
    zones: { a: { helper: "instruction", text: "Choose the correct symbol." } },
  });
  assert.match(html, /class="sheet-header"/);
  assert.match(html, /class="sheet-title">Compare numbers/);
  assert.match(html, /class="sheet-code">Sheet B/);
  assert.match(html, /--colour-surface/);
});

test("base-ten blocks draw thousands, hundreds, tens and ones as native SVG", () => {
  const html = renderContent({
    helper: "base-ten-blocks",
    counts: { thousands: 1, hundreds: 2, tens: 3, ones: 4 },
  }, 180);
  assert.equal((html.match(/<svg/g) || []).length, 10);
  for (const label of ["Thousands", "Hundreds", "Tens", "Ones"]) assert.match(html, new RegExp(label));
  assert.doesNotMatch(html, /<img/);
});
