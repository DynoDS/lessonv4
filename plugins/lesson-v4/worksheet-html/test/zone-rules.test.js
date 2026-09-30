"use strict";

// The hairline between questions where one zone of a sheet sits under another.
//
// The stack rules between the questions inside a zone, but a zone's first
// question has nothing above it in its own stack. On Daniel's Year 4 number
// bonds sheets (29 September 2026), (1) and (2) were ruled apart and (2) ran
// straight into (3), which began the zone below.

const assert = require("node:assert/strict");
const test = require("node:test");

const { renderSheet } = require("../src/render");
const { sheetsOf } = require("../src/worksheet");

const q = (text) => ({ helper: "questions", question: true, items: [text] });

function sheet(layout, zones) {
  const [only] = sheetsOf({ sheets: { expected: { layout, orientation: "portrait", zones } } });
  return renderSheet(only.spec);
}

function rules(html) {
  return [...html.matchAll(/<div class="zone-rule" style="left:([\d.]+)mm;top:([\d.]+)mm;width:([\d.]+)mm"/g)].map(
    (m) => ({ left: Number(m[1]), top: Number(m[2]), width: Number(m[3]) })
  );
}

test("a zone under another is ruled off from it, and the top zone is not", () => {
  const html = sheet("thirds-stacked", {
    a: { stack: [q("Work out 2 + 5 + 8.")] },
    b: { stack: [q("Work out 9 + 3 + 1.")] },
    c: { stack: [q("Work out 4 + 6 + 3.")] },
  });
  const found = rules(html);
  assert.equal(found.length, 2, "one line above b and one above c");
  assert.ok(found.every((r) => r.top > 0));
  assert.match(html, /\.zone-rule \{ position: absolute; border-top: var\(--rule-hair\) solid var\(--colour-rule\); \}/);
});

test("a row of zones under a zone gets one line across the gutter between them", () => {
  const html = sheet("big-above-two", {
    a: { stack: [q("Work out 2 + 5 + 8."), q("Work out 9 + 3 + 1.")] },
    b: { stack: [q("Work out 8 + 4 + 2.")] },
    c: { stack: [q("Is Ben correct?")] },
  });
  const [left, right] = rules(html).sort((x, y) => x.left - y.left);
  assert.ok(left && right, html.slice(0, 200));
  assert.equal(left.top, right.top);
  assert.ok(Math.abs(left.left + left.width - right.left) < 0.01, "the left line runs on across the gutter to meet the right");
});

test("a zone that opens with a heading is not ruled, as a heading marks itself", () => {
  const html = sheet("halves-stacked", {
    a: { stack: [q("Work out 2 + 5 + 8.")] },
    b: { stack: [{ helper: "section-label", text: "Going Deeper" }, q("Is Omar correct?")] },
  });
  assert.equal(rules(html).length, 0);
});
