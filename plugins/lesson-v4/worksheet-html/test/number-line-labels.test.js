"use strict";

// A number line's end labels read the way the question beside them reads.
//
// The Monday rounding sheet asked "Round 6,734 to the nearest 10." over a line
// whose ends printed 6730 and 6740: the comma convention the lesson teaches on
// the question, and its absence on the line, in front of the same child at
// once. The slide engine formats its axis values (builder/src/content/
// numberline.js, 8 September 2026); the paper engine printed String(v). This
// holds the two engines to one convention, and keeps everything that is not a
// whole number of a thousand or more exactly as the designer wrote it.

const { test } = require("node:test");
const assert = require("node:assert");

const { renderHelper } = require("../src/helpers");

function labelsOf(spec) {
  const html = renderHelper({ helper: "number-line", ...spec }, { widthMm: 150, yearGroup: 4 });
  return Array.from(html.matchAll(/dominant-baseline="hanging"[^>]*>([^<]*)<\/text>/g)).map((m) => m[1]);
}

test("a number line in the thousands prints its ends with thousands commas", () => {
  assert.deepStrictEqual(labelsOf({ start: 6730, end: 6740, interval: 1, labels: "ends" }), ["6,730", "6,740"]);
});

test("every labelled tick gets the same treatment, and values under a thousand are untouched", () => {
  assert.deepStrictEqual(
    labelsOf({ start: 0, end: 5000, interval: 1000, labels: "all" }),
    ["0", "1,000", "2,000", "3,000", "4,000", "5,000"]
  );
});

test("decimals and authored string labels are printed exactly as written", () => {
  assert.deepStrictEqual(labelsOf({ start: 0, end: 1, interval: 0.5, labels: "all" }), ["0", "0.5", "1"]);
  assert.deepStrictEqual(labelsOf({ start: 0, end: 2000, interval: 1000, labels: ["0", "2000"] }), ["0", "2000"]);
});
