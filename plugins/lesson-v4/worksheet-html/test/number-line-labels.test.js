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
  return Array.from(html.matchAll(/<text[^>]*>([^<]*)<\/text>/g)).map((m) => m[1]);
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

// Jumps and a highlighted space: the sheet draws the board's jump from the same
// shared meaning (shared/visuals/number-line-jumps.js), and refuses what it
// cannot place rather than drawing an arc through a box.
test("a sheet number line draws its jumps and highlight, and refuses jumps crowded with boxes", () => {
  const html = renderHelper(
    { helper: "number-line", start: 40, end: 90, interval: 10, labels: [40, 90],
      highlight: { from: 40, to: 50 }, jumps: [{ from: 40, to: 50, label: "+10" }, { from: 50, to: 60, box: true }] },
    { widthMm: 170, yearGroup: 4 }
  );
  assert.strictEqual((html.match(/<polyline /g) || []).length, 2, "two arcs");
  assert.ok(html.includes(">+10</text>"), "the jump carries its size");
  assert.strictEqual((html.match(/fill="#C65911"/g) || []).length, 2, "a wash and a bar for the highlight");
  assert.throws(
    () => renderHelper({ helper: "number-line", start: 0, end: 10, interval: 1, boxes: [3], jumps: [{ from: 1, to: 2 }] }, { widthMm: 170, yearGroup: 4 }),
    /NUMBERLINE_JUMPS_CROWDED/
  );
});

// A sentence about the line is its caption. On a printed Year 4 sheet the
// sentence went into `unit` (clipped to "Each in") and then into `object`,
// which drew a blue bar through every answer box (12 September 2026).
test("a sentence about the line is a caption, and unit and object refuse one", () => {
  const html = renderHelper(
    { helper: "number-line", start: 3000, end: 8000, interval: 1000, labels: [3000, 6000, 8000],
      boxes: [4000, 5000, 7000], caption: "Each interval is worth 1,000." },
    { widthMm: 170, yearGroup: 4 }
  );
  assert.ok(html.includes(">Each interval is worth 1,000.</text>"));
  assert.ok(!html.includes("var(--colour-question)"), "no blue bracket on a line that measures nothing");
  const opts = { widthMm: 170, yearGroup: 4 };
  assert.throws(() => renderHelper({ helper: "number-line", start: 0, end: 10, unit: "Each interval is worth 1." }, opts), /NUMBERLINE_UNIT_TOO_LONG/);
  assert.throws(() => renderHelper({ helper: "number-line", start: 0, end: 10, boxes: [3], object: { from: 0, to: 10 } }, opts), /NUMBERLINE_OBJECT_CROWDED/);
});

// A caption with a blank is somewhere to write. "Scale: ___" printed as black
// text with a three-underscore stub, and did not look like anything to fill in
// beside the answer box over A (13 September 2026).
test("a blank in a caption is drawn as an answer box under the numbers", () => {
  const opts = { widthMm: 170, yearGroup: 4 };
  const base = { helper: "number-line", start: 2100, end: 2500, interval: 100, labels: [2100, 2200], boxes: [2400], caption: "Scale: ___" };
  // Answer boxes are the rects with an outline; the axis and ticks are filled bars.
  const rects = (html) => Array.from(html.matchAll(/<rect [^>]*stroke=[^>]*>/g));
  const html = renderHelper(base, opts);
  assert.ok(!html.includes("___"), "no underscores reach the page");
  assert.ok(html.includes(">Scale:</text>"));
  const all = rects(html);
  assert.strictEqual(all.length, 2, "the A box and the scale box");
  const y = (r) => Number(/ y="([\d.]+)"/.exec(r[0])[1]);
  const [top, bottom] = all.map(y).sort((m, n) => m - n);
  assert.ok(bottom > top + 30, "the scale box sits under the line, not up beside the A box");

  // A sentence with no blank is still read, not written in.
  assert.ok(renderHelper({ ...base, caption: "Each interval is worth 100." }, opts).includes(">Each interval is worth 100.</text>"));
});

test("a label can print the wrong number at a mark, for a line children judge", () => {
  assert.deepStrictEqual(
    labelsOf({ start: 2400, end: 2900, interval: 100, labels: [2400, 2500, { at: 2600, text: "2,700" }, 2700, 2800, 2900] }),
    ["2,400", "2,500", "2,700", "2,700", "2,800", "2,900"]
  );
});
