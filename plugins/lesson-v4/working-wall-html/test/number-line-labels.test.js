"use strict";

// Two faults found on the same printed sheet, in the same primitive.
//
// A Year 4 wall about reading numbers on a scale carried the line's own ticks
// as "2500 5000 7500 10000" while the card's text beside it read "Mark 2,500,
// 5,000 and 7,500". One sheet, two ways of writing the same number, on the
// lesson where telling those numbers apart is the whole point.
//
// On a second sheet from the same lesson, a mark labelled "3,000" and a mark
// labelled "A = 3,500" were placed 500 apart on a 2,000-to-4,000 line. Both
// labels are centred on their own dot at the same height, nothing checks
// whether they meet, and on the page they ran together as "3,000A = 3,500".

const test = require("node:test");
const assert = require("node:assert");

const { numberLineSvg } = require("../src/svg-renderer");

// Every <text> in the SVG, with the x and y it is drawn at.
function texts(svg) {
  return [...svg.matchAll(/<text x="([-\d.]+)" y="([-\d.]+)"[^>]*font-size="([\d.]+)"[^>]*>([^<]*)<\/text>/g)].map(
    (m) => ({ x: Number(m[1]), y: Number(m[2]), size: Number(m[3]), text: m[4] })
  );
}

// Arial bold is about 0.58 of its point size per character across digits and
// commas. Deliberately generous: a near miss on the page is still a collision.
function halfWidth(t) {
  return (t.text.length * t.size * 0.58) / 2;
}

test("tick labels on a four-digit line are written the way the card writes them", () => {
  const svg = numberLineSvg({ from: 0, to: 10000, step: 2500 });
  const drawn = texts(svg).map((t) => t.text);

  assert.ok(
    drawn.includes("2,500"),
    `the line's ticks were drawn as ${JSON.stringify(drawn)}; a card that says "2,500" in its text ` +
      `cannot label the same number "2500" on its own picture`
  );
  assert.ok(drawn.includes("10,000"), `expected a separated 10,000, got ${JSON.stringify(drawn)}`);
});

test("a three-digit line is left alone", () => {
  const svg = numberLineSvg({ from: 0, to: 900, step: 300 });
  const drawn = texts(svg).map((t) => t.text);
  assert.ok(drawn.includes("300"), `expected a plain 300, got ${JSON.stringify(drawn)}`);
});

test("two marks close together do not print on top of each other", () => {
  const svg = numberLineSvg({
    from: 2000,
    to: 4000,
    step: 500,
    marks: [
      { at: 3000, label: "3,000" },
      { at: 3500, label: "A = 3,500" },
    ],
  });

  // Mark labels sit above the line; tick labels sit below it, and since the
  // ticks are now written with separators too, one of them also reads "3,000".
  const labels = texts(svg).filter((t) => t.y < 300 && (t.text === "3,000" || t.text === "A = 3,500"));
  assert.strictEqual(labels.length, 2, "expected both mark labels to be drawn");

  const [a, b] = labels.sort((p, q) => p.x - q.x);
  const sameRow = Math.abs(a.y - b.y) < Math.max(a.size, b.size) * 0.8;
  const overlapping = a.x + halfWidth(a) > b.x - halfWidth(b);

  assert.ok(
    !(sameRow && overlapping),
    `"${a.text}" ends at x=${(a.x + halfWidth(a)).toFixed(0)} and "${b.text}" starts at ` +
      `x=${(b.x - halfWidth(b)).toFixed(0)} on the same row (y=${a.y} and y=${b.y}), so they print over each other`
  );
});

test("marks that are far apart stay on one row", () => {
  const svg = numberLineSvg({
    from: 0,
    to: 10000,
    step: 2500,
    marks: [
      { at: 1000, label: "1,000" },
      { at: 9000, label: "9,000" },
    ],
  });
  const labels = texts(svg).filter((t) => t.y < 300 && (t.text === "1,000" || t.text === "9,000"));
  assert.strictEqual(labels.length, 2);
  assert.strictEqual(
    labels[0].y,
    labels[1].y,
    "two marks with the whole line between them were staggered for no reason"
  );
});

// Jumps and a highlighted space on a wall card, from the same shared meaning as
// the board, and part of the picture's cache identity: without that, two cards
// with different jumps would share one cached drawing.
test("a wall number line draws jumps and a highlight, and they change its cache key", () => {
  const { numberLineKey } = require("../src/svg-renderer");
  const svg = numberLineSvg({ from: 0, to: 20, step: 10, highlight: { from: 0, to: 10 }, jumps: [{ from: 10, to: 20, label: "+10" }] });
  assert.strictEqual((svg.match(/<polyline /g) || []).length, 1);
  assert.ok(svg.includes(">+10</text>"));
  assert.notStrictEqual(
    numberLineKey({ from: 0, to: 20, step: 10 }),
    numberLineKey({ from: 0, to: 20, step: 10, jumps: [{ from: 0, to: 10 }] })
  );
  assert.throws(
    () => numberLineSvg({ from: 0, to: 20, step: 10, marks: [{ at: 10 }], jumps: [{ from: 0, to: 10 }] }),
    /NUMBERLINE_JUMPS_CROWDED/
  );
});
