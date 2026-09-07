"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

// Required DIRECTLY rather than through the registry, because the registry is
// not wired to this file yet. The one thing that costs is the legibility floor,
// which index.js applies on top of every helper's stated minimum, so the tests
// that care about it apply it here the same way index.js does.
const { helpers, css } = require("../src/helpers/money");
const { legibleWidthMm } = require("../src/helpers/shared");

const A_HALF_COLUMN_MM = 87;
const FULL_WIDTH_MM = 180;

function reportedMinWidthMm(name, spec) {
  const h = helpers[name];
  return Math.max(h.needs(spec).minWidthMm, legibleWidthMm(h.render(spec)));
}

function countOf(haystack, needle) {
  return haystack.split(needle).length - 1;
}

// ─── coin-strip ──────────────────────────────────────────────────────────

test("a coin strip draws one coin for every coin listed, repeats included", () => {
  // The job this helper exists for is "how much money is shown?". Drop a coin
  // and the answer changes, silently, and the sheet still looks finished.
  const html = helpers["coin-strip"].render({
    coins: ["£2", "£1", "20p", "20p", "10p"],
  });
  assert.equal(countOf(html, ">£2<"), 1);
  assert.equal(countOf(html, ">£1<"), 1);
  assert.equal(countOf(html, ">20p<"), 2, "the second 20p was not drawn");
  assert.equal(countOf(html, ">10p<"), 1);
});

test("coins keep the shapes that make them recognisable without reading them", () => {
  // A child sorting coins knows a 50p by its seven curved sides and a £1 by its
  // twelve, before they read anything. Draw them all as discs and the helper
  // still passes every fit and legibility check while teaching nothing.
  const round = helpers["coin-strip"].render({ coins: ["10p"] });
  assert.ok(round.includes("<circle"), "a 10p should be round");
  assert.ok(!round.includes("<path"), "a 10p should not be a polygon");

  const heptagon = helpers["coin-strip"].render({ coins: ["50p"] });
  assert.ok(heptagon.includes("<path"), "a 50p should be seven-sided");
  // Curved edges, not a plain straight-sided heptagon: the arcs are the
  // difference between a 50p and a generic token.
  assert.match(heptagon, /d="M [^"]*A /, "a 50p's edges should be arcs");

  const pound = helpers["coin-strip"].render({ coins: ["£1"] });
  assert.ok(pound.includes("<path"), "a £1 should be twelve-sided");
  // Bimetallic: the silver centre inside the gold ring.
  assert.ok(pound.includes("<circle"), "a £1 should have its silver centre");
});

test("a seven-sided coin sits centred in its place in the strip", () => {
  // A Reuleaux heptagon is NOT centred on its circumcircle: a vertex sits
  // further from the middle than the arc opposite it does. Drawn from the
  // circumcentre the 50p hangs above its own box and leans on whatever is above
  // it, and every other check still passes - it fits, it measures right, the
  // page looks finished.
  //
  // The top of the shape is its apex vertex, which is where the path starts.
  // The bottom is the middle of the arc opposite that apex, and that arc is
  // centred ON the apex, so it lies exactly one arc-radius below it. Measuring
  // by vertices instead would put the bottom at the two low CORNERS and report
  // a correctly centred coin as lopsided.
  const html = helpers["coin-strip"].render({ coins: ["50p"] });
  const [, , boxH] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(html).map(Number);
  const d = / d="([^"]+)"/.exec(html)[1];
  const apexY = Number(/^M [\d.-]+ ([\d.-]+)/.exec(d)[1]);
  const radius = Number(/A ([\d.-]+)/.exec(d)[1]);

  const above = apexY;
  const below = boxH - (apexY + radius);
  assert.ok(
    Math.abs(above - below) < 0.05,
    `the 50p leaves ${above.toFixed(2)} above it and ${below.toFixed(2)} below`
  );
});

test("no part of a coin is drawn outside the picture it declares", () => {
  const html = helpers["coin-strip"].render({
    coins: ["1p", "20p", "50p", "£1", "£2", "£5"],
  });
  const [, w, h] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(html).map(Number);
  const limit = Math.max(w, h);

  for (const [, d] of html.matchAll(/ d="([^"]+)"/g)) {
    for (const n of d.match(/-?\d+\.?\d*/g).map(Number)) {
      assert.ok(n >= -0.01 && n <= limit + 0.01, `a drawn point sits at ${n}`);
    }
  }
  for (const [, cx, cy, r] of html.matchAll(
    /<circle cx="([\d.-]+)" cy="([\d.-]+)" r="([\d.-]+)"/g
  )) {
    assert.ok(Number(cx) - Number(r) >= -0.01, "a coin runs off the left edge");
    assert.ok(Number(cx) + Number(r) <= w + 0.01, "a coin runs off the right edge");
    assert.ok(Number(cy) - Number(r) >= -0.01, "a coin runs off the top edge");
    assert.ok(Number(cy) + Number(r) <= h + 0.01, "a coin runs off the bottom edge");
  }
});

test("coins are drawn to scale with each other, smallest to biggest", () => {
  // The one the Word builder got wrong and the reference doc still recommends
  // getting wrong. Size is the first thing a child sorts coins by, before colour
  // and long before they read the number: a 2p is a third wider than a 5p, and a
  // picture that makes them the same object teaches the opposite of the lesson.
  // Nothing else catches it - the strip fits, nothing clips, the page looks
  // finished, and every coin is labelled correctly.
  const order = ["5p", "1p", "20p", "£1", "10p", "2p", "50p", "£2"];
  const html = helpers["coin-strip"].render({ coins: order });
  // Each coin's drawn width, read off the strip in the order it was listed.
  const widths = [...html.matchAll(/<(?:circle|path)[^>]*fill="#[0-9A-F]{6}" stroke=/g)]
    .map((m) => m.index)
    .map((start) => html.slice(start, html.indexOf("/>", start)));

  const spanOf = (denomination) => {
    const one = helpers["coin-strip"].render({ coins: [denomination] });
    const [, w] = /viewBox="0 0 ([\d.]+)/.exec(one).map(Number);
    return w;
  };
  const drawn = order.map(spanOf);
  for (let i = 1; i < drawn.length; i++) {
    assert.ok(
      drawn[i] > drawn[i - 1],
      `a ${order[i]} (${drawn[i]}mm) is not drawn bigger than a ${order[i - 1]} (${drawn[i - 1]}mm)`
    );
  }
  assert.ok(widths.length >= order.length, "not every coin was drawn");
});

test("a coin prints at its real size when there is room, and never bigger", () => {
  // A coin has a true size the way the ruler in geometry.js does. It may shrink
  // to fit a column, but growing past life size makes it a big disc rather than
  // a coin, and eats width the row has no use for.
  const spec = { coins: ["£2", "50p", "10p"] };
  const lifeSizeMm = 28.4 + 27.3 + 24.5 + 2 * 2; // real diameters plus the gaps
  const drawnAt = (widthMm) =>
    Number(/max-width:([\d.]+)mm/.exec(helpers["coin-strip"].render(spec))[1]) <= widthMm
      ? Number(/max-width:([\d.]+)mm/.exec(helpers["coin-strip"].render(spec))[1])
      : widthMm;

  assert.ok(
    Math.abs(drawnAt(260) - lifeSizeMm) < 0.1,
    `given a whole page the strip draws at ${drawnAt(260)}mm, not its true ${lifeSizeMm}mm`
  );
  assert.equal(drawnAt(60), 60, "in a narrow column it should shrink to fit");
});

test("the two pound coins do not come out as twins", () => {
  // Both are gold with a silver centre, so on shape alone a £1 drawn as a
  // twelve-sided disc and a £2 drawn as a round one are nearly the same picture
  // at worksheet size. The real difference a child sees first is the width of
  // the silver middle, and it has to survive.
  const radiusOf = (coin) =>
    Number(/<circle[^>]*r="([\d.]+)"[^>]*fill="#CFD3D8"/.exec(
      helpers["coin-strip"].render({ coins: [coin] })
    )[1]);
  assert.ok(
    radiusOf("£2") > radiusOf("£1") * 1.1,
    `a £2's centre is ${radiusOf("£2")} and a £1's is ${radiusOf("£1")}`
  );
});

test("an unknown denomination is refused by name, with the real ones listed", () => {
  assert.throws(
    () => helpers["coin-strip"].render({ coins: ["3p"] }),
    (err) => {
      assert.match(err.message, /UNKNOWN_DENOMINATION/);
      assert.match(err.message, /3p/);
      assert.match(err.message, /50p/); // the list is what makes it fixable
      return true;
    }
  );
});

test("a strip with no coins is refused rather than printed empty", () => {
  assert.throws(() => helpers["coin-strip"].render({ coins: [] }), /at least one/);
});

test("a longer coin strip needs a wider zone than a short one", () => {
  const three = { coins: ["£1", "50p", "20p"] };
  const eight = {
    coins: ["£1", "50p", "20p", "20p", "10p", "5p", "2p", "1p"],
  };
  assert.ok(
    reportedMinWidthMm("coin-strip", eight) >
      reportedMinWidthMm("coin-strip", three),
    "eight coins asked for no more room than three"
  );
});

test("a note asks for more width than a coin, because it is drawn wider", () => {
  const coins = { coins: ["£2", "£2"] };
  const withNote = { coins: ["£2", "£10"] };
  assert.ok(
    reportedMinWidthMm("coin-strip", withNote) >
      reportedMinWidthMm("coin-strip", coins)
  );
});

test("an answer line is drawn and its height is paid for in the measurement", () => {
  const without = { coins: ["£1", "50p"] };
  const with_ = { coins: ["£1", "50p"], answerLine: true };
  assert.ok(!helpers["coin-strip"].render(without).includes("h-money-answer"));
  assert.ok(helpers["coin-strip"].render(with_).includes("h-money-answer"));
  assert.ok(
    helpers["coin-strip"].measure(with_, FULL_WIDTH_MM) >
      helpers["coin-strip"].measure(without, FULL_WIDTH_MM),
    "the answer line was drawn but not measured, so it would be clipped"
  );
});

test("a coin strip stops growing once its coins are already bigger than real ones", () => {
  // Without a ceiling a three-coin strip in a full-width row printed coins the
  // size of drinks mats and took a third of the page to say "60p".
  const spec = { coins: ["20p", "20p", "20p"] };
  const wide = helpers["coin-strip"].measure(spec, 260);
  const wider = helpers["coin-strip"].measure(spec, 267);
  assert.equal(wide, wider, "the strip kept growing with the zone");
  assert.ok(wide < 30, `a row of three coins measured ${wide.toFixed(1)}mm tall`);
});

test("the width a coin strip demands stays inside a page", () => {
  const spec = { coins: ["£2", "£1", "50p", "20p", "10p", "5p"] };
  const min = reportedMinWidthMm("coin-strip", spec);
  assert.ok(min <= 267, `a six-coin strip demands ${min.toFixed(0)}mm`);
});

// ─── part-whole-money ────────────────────────────────────────────────────

test("a part-whole model puts the whole and every part on the page", () => {
  const html = helpers["part-whole-money"].render({
    whole: { label: "£5.80" },
    parts: [{ label: "Spent £2.40" }, { label: "Left" }],
  });
  assert.ok(html.includes("£5.80"), "the whole never reached the page");
  assert.ok(html.includes("Spent £2.40"), "the first part never reached the page");
  assert.ok(html.includes("Left"), "the second part never reached the page");
});

test("an empty whole still draws its bubble, because that is where the child writes", () => {
  const html = helpers["part-whole-money"].render({
    whole: {},
    parts: [{ label: "£1.40" }, { label: "£2.30" }],
  });
  // Three bubbles: the empty answer space plus the two given parts.
  assert.equal(countOf(html, "<rect"), 3);
});

test("every part is joined to the whole by its own connector", () => {
  const two = helpers["part-whole-money"].render({
    whole: {},
    parts: [{ label: "a" }, { label: "b" }],
  });
  const three = helpers["part-whole-money"].render({
    whole: {},
    parts: [{ label: "a" }, { label: "b" }, { label: "c" }],
  });
  assert.equal(countOf(two, "<line"), 2);
  assert.equal(countOf(three, "<line"), 3, "a part was drawn with nothing joining it");
});

test("coins put inside bubbles are actually drawn there", () => {
  const html = helpers["part-whole-money"].render({
    text: "Partition £3.40 into pounds and pence.",
    whole: { coins: ["£1", "£1", "£1", "20p", "20p"], label: "£3.40" },
    parts: [
      { coins: ["£1", "£1", "£1"], label: "Pounds" },
      { coins: ["20p", "20p"], label: "Pence" },
    ],
  });
  assert.equal(countOf(html, ">£1<"), 6, "the pound coins did not all draw");
  assert.equal(countOf(html, ">20p<"), 4, "the twenty pences did not all draw");
});

test("a part-whole with more parts needs a wider zone than one with two", () => {
  const two = { whole: {}, parts: [{ label: "£1.40" }, { label: "£2.30" }] };
  const four = {
    whole: {},
    parts: [
      { label: "£1.40" },
      { label: "£2.30" },
      { label: "£0.60" },
      { label: "£1.10" },
    ],
  };
  assert.ok(
    reportedMinWidthMm("part-whole-money", four) >
      reportedMinWidthMm("part-whole-money", two),
    "four parts asked for no more room than two"
  );
});

test("coins in the bubbles raise the minimum, because a coin has to stay identifiable", () => {
  const text = { whole: {}, parts: [{ label: "Pounds" }, { label: "Pence" }] };
  const coins = {
    whole: { coins: ["£1", "£1", "20p"] },
    parts: [{ coins: ["£1", "£1"] }, { coins: ["20p"] }],
  };
  assert.ok(
    reportedMinWidthMm("part-whole-money", coins) >
      reportedMinWidthMm("part-whole-money", text)
  );
});

test("a part-whole with no parts is refused rather than drawn as one lonely bubble", () => {
  assert.throws(
    () => helpers["part-whole-money"].render({ whole: { label: "£4" }, parts: [] }),
    /at least one part/
  );
});

// ─── stacked-fraction and fraction-sequence ──────────────────────────────

test("a fraction is stacked over a bar, not written flat as 3/4", () => {
  // The whole reason this helper exists. Flat "3/4" is a different notation
  // from the one being taught, and a helper that quietly emitted it would pass
  // every size and fit check on the sheet.
  const html = helpers["stacked-fraction"].render({
    fractions: [{ num: 3, den: 4 }],
  });
  assert.ok(html.includes("h-frac-num"), "no numerator cell");
  assert.ok(html.includes("h-frac-den"), "no denominator cell");
  assert.ok(!html.includes("3/4"), "the fraction came out flat");
  assert.ok(html.indexOf(">3<") < html.indexOf(">4<"), "the numerator is not on top");

  // The bar itself is a border on the numerator, and it has to be in the CSS
  // or the two numbers are just two numbers.
  assert.match(css, /\.h-frac-num\s*{[^}]*border-bottom/);
});

test('a "?" is a box to write in, not a printed question mark', () => {
  const html = helpers["fraction-sequence"].render({
    fractions: [{ num: 1, den: 4 }, "?", { num: 3, den: 4 }],
  });
  assert.ok(html.includes("h-frac-blank"), "the blank was not drawn as a box");
  assert.ok(!html.includes("?"), "a literal question mark reached the page");
  assert.equal(countOf(html, "h-frac-blank"), 1);
});

test("a separator is drawn between fractions and not after the last one", () => {
  const html = helpers["fraction-sequence"].render({
    fractions: [{ num: 1, den: 4 }, { num: 2, den: 4 }, { num: 3, den: 4 }],
    separator: ",",
  });
  assert.equal(countOf(html, "h-frac-sep"), 2);
});

test("a longer sequence, and a longer fraction, both need a wider zone", () => {
  const two = { fractions: [{ num: 1, den: 4 }, { num: 2, den: 4 }] };
  const five = {
    fractions: [
      { num: 1, den: 4 },
      { num: 2, den: 4 },
      { num: 3, den: 4 },
      { num: 4, den: 4 },
      { num: 5, den: 4 },
    ],
  };
  const big = { fractions: [{ num: 100, den: 1000 }, { num: 250, den: 1000 }] };
  assert.ok(
    helpers["fraction-sequence"].needs(five).minWidthMm >
      helpers["fraction-sequence"].needs(two).minWidthMm,
    "five fractions asked for no more room than two"
  );
  assert.ok(
    helpers["fraction-sequence"].needs(big).minWidthMm >
      helpers["fraction-sequence"].needs(two).minWidthMm,
    "three-digit fractions asked for no more room than one-digit ones"
  );
});

test("fraction-sequence carries no question stem, so it can sit inside a compound", () => {
  const html = helpers["fraction-sequence"].render({
    text: "this should be ignored",
    fractions: [{ num: 1, den: 2 }],
  });
  assert.ok(!html.includes("this should be ignored"));
  assert.ok(!html.includes("h-money-stem"));
});

test("the height a fraction row claims is the height its CSS gives the blank box", () => {
  // The two numbers are the same fact written twice: the blank's height in the
  // CSS, and the row height the measurement assumes. Let them drift and a row
  // containing a blank runs taller than its zone and is clipped along the
  // bottom edge, which looks like nothing at all.
  const rowMm = helpers["fraction-sequence"].measure(
    { fractions: [{ num: 1, den: 2 }] },
    FULL_WIDTH_MM
  );
  const declared = /\.h-frac-blank\s*{[^}]*height:\s*([\d.]+)mm/.exec(css);
  assert.ok(declared, "the blank box has no pinned height");
  assert.ok(
    Math.abs(Number(declared[1]) - rowMm) < 0.05,
    `the CSS draws the blank ${declared[1]}mm tall but the measurement allows ${rowMm.toFixed(2)}mm`
  );
});

// ─── chip-bank ───────────────────────────────────────────────────────────

test("every chip reaches the page as its own bordered choice", () => {
  const chips = ["square", "rectangle", "rhombus", "parallelogram", "trapezium"];
  const html = helpers["chip-bank"].render({ title: "Word bank", chips });
  assert.equal(countOf(html, "h-chip\""), chips.length);
  for (const chip of chips) {
    assert.ok(html.includes(`>${chip}<`), `"${chip}" never reached the page`);
  }
  assert.ok(html.includes("Word bank"));
});

test("the three variants are three different colours, all from the token system", () => {
  const chips = ["one", "two"];
  const seen = new Set();
  for (const variant of ["blue", "yellow", "green"]) {
    const html = helpers["chip-bank"].render({ variant, chips });
    const cls = /h-chipbank--(\w+)/.exec(html);
    assert.ok(cls, `the "${variant}" variant carries no class`);
    seen.add(cls[1]);
    assert.equal(
      html.match(/#[0-9a-fA-F]{3,6}\b/),
      null,
      `the "${variant}" variant hard-codes a colour`
    );
  }
  assert.equal(seen.size, 3, "two variants came out the same colour");
});

test("an unknown variant falls back to the neutral one rather than losing its border", () => {
  const html = helpers["chip-bank"].render({ variant: "puce", chips: ["one"] });
  assert.ok(html.includes("h-chipbank--question"));
});

test("a bank of longer words needs a wider zone than a bank of short ones", () => {
  const short = { chips: ["cat", "dog", "cow"] };
  const long = { chips: ["parallelogram", "perpendicular", "quadrilateral"] };
  assert.ok(
    helpers["chip-bank"].needs(long).minWidthMm >
      helpers["chip-bank"].needs(short).minWidthMm
  );
});

test("a chip bank in a narrow column wraps to more rows, and says so", () => {
  const spec = {
    chips: ["square", "rectangle", "rhombus", "parallelogram", "trapezium"],
  };
  const narrow = helpers["chip-bank"].measure(spec, A_HALF_COLUMN_MM);
  const wide = helpers["chip-bank"].measure(spec, FULL_WIDTH_MM);
  assert.ok(
    narrow > wide,
    `a half column measured ${narrow.toFixed(1)}mm and a full width ${wide.toFixed(1)}mm`
  );
});

test("a bank titled Word bank prints in vocabulary green unless told otherwise", () => {
  // The teacher's colour system: green IS what a bank of taught words means on
  // paper. A designer who leaves `variant` off a word bank has not chosen blue.
  const bank = helpers["chip-bank"].render({
    title: "Word bank",
    chips: ["energy", "variety"],
  });
  assert.ok(bank.includes("h-chipbank--vocab"), "a word bank came out blue");

  // An explicit variant still wins: a bank can genuinely be something else.
  const given = helpers["chip-bank"].render({
    title: "Word bank",
    variant: "yellow",
    chips: ["energy", "variety"],
  });
  assert.ok(given.includes("h-chipbank--given"));

  // A bank with no title and no variant keeps the neutral colour.
  const bare = helpers["chip-bank"].render({ chips: ["energy", "variety"] });
  assert.ok(bare.includes("h-chipbank--question"));
});

test("each chip hugs its own word instead of matching the longest in the bank", () => {
  // "beans" beside "vitamins and minerals" must not print beans-sized dead
  // space: a child reads empty room inside a border as a place to write. So a
  // mixed bank packs into fewer rows than a bank of all-long chips would.
  const mixed = {
    chips: ["beans", "apple", "energy", "protein", "vitamins and minerals"],
  };
  const allLong = {
    chips: [
      "vitamins and minerals",
      "vitamins and mineralz",
      "vitamins and mineralx",
      "vitamins and mineralw",
      "vitamins and mineralv",
    ],
  };
  const mixedMm = helpers["chip-bank"].measure(mixed, A_HALF_COLUMN_MM);
  const longMm = helpers["chip-bank"].measure(allLong, A_HALF_COLUMN_MM);
  assert.ok(
    mixedMm < longMm,
    `short chips still cost long-chip room: ${mixedMm.toFixed(1)}mm vs ${longMm.toFixed(1)}mm`
  );

  // And the uniform-track mechanism is genuinely gone from the page.
  const html = helpers["chip-bank"].render(mixed);
  assert.ok(!html.includes("--h-chip-track"), "chips still share one track width");
});

// ─── the contract, for all six ───────────────────────────────────────────

const EXAMPLES = {
  "stacked-fraction": {
    text: "Continue the sequence.",
    fractions: [{ num: 1, den: 4 }, { num: 2, den: 4 }, "?", { num: 4, den: 4 }],
    separator: ",",
  },
  "fraction-sequence": {
    fractions: [{ num: 1, den: 2 }, "?"],
    separator: "=",
  },
  "coin-strip": {
    text: "Sam has these coins. How much money does he have?",
    coins: ["£2", "£1", "20p", "20p", "10p"],
    answerLine: true,
  },
  "part-whole-money": {
    text: "£1.40 + £2.30",
    whole: {},
    parts: [{ label: "£1.40" }, { label: "£2.30" }],
  },
  "part-whole": {
    whole: { value: "6,731" },
    joiner: "+",
    parts: [
      { blank: true, caption: "Thousands" },
      { blank: true, caption: "Hundreds" },
      { blank: true, caption: "Tens" },
      { blank: true, caption: "Ones" },
    ],
  },
  "chip-bank": {
    title: "Word bank",
    variant: "yellow",
    chips: ["square", "rectangle", "rhombus", "parallelogram", "trapezium"],
  },
};

test("all six sign the whole contract", () => {
  for (const [name, h] of Object.entries(helpers)) {
    assert.equal(typeof h.render, "function", `"${name}" has no render`);
    assert.equal(typeof h.measure, "function", `"${name}" has no measure`);
    assert.equal(typeof h.needs, "function", `"${name}" has no needs`);
    assert.ok(
      Number.isFinite(h.greed) && h.greed >= 0 && h.greed <= 5,
      `"${name}" has greed ${h.greed}`
    );
    assert.ok(EXAMPLES[name], `"${name}" has no example to check against`);
  }
});

test("every stated minimum is a real size that fits on a page", () => {
  for (const [name, spec] of Object.entries(EXAMPLES)) {
    const need = helpers[name].needs(spec);
    assert.ok(need.minWidthMm > 0 && need.minHeightMm > 0, `"${name}" states nothing`);
    // After the legibility floor index.js puts on top, not before it. A helper
    // whose labels are tiny relative to its viewBox passes its own check and
    // then demands half a metre of paper.
    const reported = reportedMinWidthMm(name, spec);
    assert.ok(
      reported <= 267,
      `"${name}" ends up demanding ${reported.toFixed(0)}mm, wider than any A4 page`
    );
  }
});

test("every helper measures to a real height at a column and at full width", () => {
  for (const [name, spec] of Object.entries(EXAMPLES)) {
    for (const widthMm of [A_HALF_COLUMN_MM, FULL_WIDTH_MM]) {
      const h = helpers[name].measure(spec, widthMm);
      assert.ok(Number.isFinite(h) && h > 0, `"${name}" measured ${h}mm`);
      assert.ok(h <= 297, `"${name}" wants ${Math.round(h)}mm, taller than a page`);
    }
  }
});

test("a drawing never measures shorter than the shape it actually draws", () => {
  // The failure this catches is the expensive one: an estimate that runs short
  // does not look like a bug, the zone just clips the bottom off and the page
  // still looks finished.
  for (const name of ["coin-strip", "part-whole-money"]) {
    const spec = EXAMPLES[name];
    const svg = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(helpers[name].render(spec));
    const aspect = Number(svg[1]) / Number(svg[2]);
    const declaredMax = Number(
      /max-width:([\d.]+)mm/.exec(helpers[name].render(spec))[1]
    );
    for (const widthMm of [60, A_HALF_COLUMN_MM, FULL_WIDTH_MM, 260]) {
      const drawnMm = Math.min(widthMm, declaredMax) / aspect;
      assert.ok(
        helpers[name].measure(spec, widthMm) >= drawnMm - 0.01,
        `"${name}" at ${widthMm}mm draws ${drawnMm.toFixed(1)}mm of picture but claims ` +
          `${helpers[name].measure(spec, widthMm).toFixed(1)}mm in total`
      );
    }
  }
});

test("every line height is pinned at 1.35, which is what the estimates assume", () => {
  const declared = css.match(/line-height:\s*([\d.]+)/g) || [];
  assert.ok(declared.length > 0, "no line-height is pinned anywhere");
  for (const rule of declared) {
    assert.equal(Number(rule.split(":")[1]), 1.35, `found "${rule}"`);
  }
});

test("spec fields are camelCase, matching the rest of the engine", () => {
  for (const [name, spec] of Object.entries(EXAMPLES)) {
    for (const field of Object.keys(spec)) {
      assert.ok(!field.includes("_"), `"${name}" uses the field "${field}"`);
    }
  }
});

test("the only hard-coded colours are the ones a coin cannot do without", () => {
  // Orange means material handed to the child, blue means the question. A
  // second colour system starting inside a helper is how a child meets two
  // meanings for one colour in a single lesson. The metals are the stated
  // exception: a coin that is not copper or silver is not a coin.
  for (const name of ["stacked-fraction", "fraction-sequence", "chip-bank"]) {
    const html = helpers[name].render(EXAMPLES[name]);
    const hex = html.match(/#[0-9a-fA-F]{3,6}\b/);
    assert.equal(hex, null, `"${name}" hard-codes ${hex && hex[0]}`);
  }
  // And where a hex does appear, it is on a drawn coin and nowhere else.
  const model = helpers["part-whole-money"].render(EXAMPLES["part-whole-money"]);
  assert.equal(model.match(/#[0-9a-fA-F]{3,6}\b/), null, "the shell should be tokens only");
});

test("text reaching the page is escaped, so a stray bracket cannot break it", () => {
  const stem = helpers["coin-strip"].render({
    text: "Bill said <b>this</b> & that",
    coins: ["1p"],
  });
  assert.ok(!stem.includes("<b>"), "raw markup survived into the page");
  assert.ok(stem.includes("&lt;b&gt;") && stem.includes("&amp;"));

  const chips = helpers["chip-bank"].render({
    title: "Bank <of> words",
    chips: ["a & b"],
  });
  assert.ok(!chips.includes("<of>"));
  assert.ok(chips.includes("&amp;"));

  const model = helpers["part-whole-money"].render({
    whole: { label: "a & b" },
    parts: [{ label: "<x>" }, { label: "y" }],
  });
  assert.ok(model.includes("&amp;") && model.includes("&lt;x&gt;"));
});
