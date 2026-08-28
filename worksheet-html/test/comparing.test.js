"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

// Required DIRECTLY rather than through the registry, because the registry is
// not wired to this file yet.
const { helpers, css } = require("../src/helpers/comparing");

// What is tested here is the behaviour each helper exists FOR: that a box a
// child fills is empty, that there is one blank per number, that a question
// carrying more content asks for more room. A test that only checks a string
// comes back would pass on every one of the bugs below.

const COLUMN_MM = 87; // a half-width column on A4 portrait
const FULL_MM = 180; // the full printable width, portrait
const WIDE_MM = 261; // the full printable width, landscape

const render = (name, spec) => helpers[name].render(spec);
const measure = (name, spec, widthMm) => helpers[name].measure(spec, widthMm);
const needs = (name, spec) => helpers[name].needs(spec);
const count = (html, pattern) => (html.match(pattern) || []).length;

// ─── compare-row ─────────────────────────────────────────────────────────

test("a compare row gives the child an empty box and never the answer", () => {
  // The single thing this helper must not get wrong. A compare question that
  // arrives with the symbol already in it is not a question.
  const html = render("compare-row", { id: "1", left: "2.3", right: "7.1" });

  assert.match(html, /h-cmp-box/, "there is nowhere to write the symbol");
  assert.match(
    html,
    /<span class="h-cmp-box"><\/span>/,
    "the box must come out empty"
  );
  assert.match(html, /2\.3/);
  assert.match(html, /7\.1/);

  const visible = html.replace(/<[^>]*>/g, "").replace(/&lt;|&gt;/g, "<");
  assert.ok(
    !/[<>=]/.test(visible),
    `no comparison symbol may be printed: "${visible.trim()}"`
  );
});

test("a compare row asks for more width when its values are longer", () => {
  // "£3.40 against 340p" is a wider question than "2.3 against 7.1". A
  // constant per helper cannot know that, and would wrap the longer pair onto
  // two lines inside a box drawn for one.
  const short = { id: "1", left: "2.3", right: "7.1" };
  const long = { id: "1", left: "three hundred and forty pence", right: "£3.40" };
  assert.ok(
    needs("compare-row", long).minWidthMm > needs("compare-row", short).minWidthMm
  );
});

test("a compare row's stated minimum is wide enough for its own values", () => {
  // The guard against the two halves of this file drifting apart: the minimum
  // width is built from a character metric, and the measurement wraps text
  // with the engine's own. If those two disagree, a row measured as one line
  // prints as two and the bottom of it is clipped.
  for (const spec of [
    { id: "1", left: "2.3", right: "7.1" },
    { id: "4", left: "£3.40", right: "340p" },
    { id: "7", left: "three quarters of 80", right: "sixty" },
  ]) {
    const min = needs("compare-row", spec).minWidthMm;
    assert.equal(
      measure("compare-row", spec, min),
      measure("compare-row", spec, WIDE_MM),
      `"${spec.left}" wraps at the width this helper says it needs`
    );
  }
});

// ─── inequality-with-boxes ───────────────────────────────────────────────

test("a box token becomes a real empty box and the other tokens do not", () => {
  // The whole point of the helper. Rendered as text, "5 . □ 2 < 5 . □ 8" is a
  // row of characters with two symbols a child cannot write inside.
  const html = render("inequality-with-boxes", { expression: "5 . □ 2 < 5 . □ 8" });

  assert.equal(count(html, /h-ineq-box/g), 2, "one box per □");
  assert.equal(count(html, /h-ineq-token/g), 7, "every other token prints as a character");
  assert.ok(!html.includes("□"), "the □ must become a box, not print as a glyph");
  assert.match(html, /<span class="h-ineq-box"><\/span>/, "a box must come out empty");
  assert.match(html, /<span class="h-ineq-token">&lt;<\/span>/, "the < is a token, not a box");
});

test("a run of underscores is a box too, because that is what an author writes", () => {
  const html = render("inequality-with-boxes", { expression: "64 = ___ + ___" });
  assert.equal(count(html, /h-ineq-box/g), 2);
  assert.equal(count(html, /h-ineq-token/g), 3, "64, = and + are characters");
  assert.ok(!html.includes("___"), "the underscores must become a box, not print");
});

test("a longer statement needs more width, because it must stay on one line", () => {
  // A statement broken across two lines stops being a statement: a child
  // reading "5 . □ 2 <" then "5 . □ 8" has to reassemble it before they can
  // compare anything.
  const shortExpr = { expression: "3 □ 5" };
  const longExpr = { expression: "5 . □ 2 < 5 . □ 8" };
  assert.ok(
    needs("inequality-with-boxes", longExpr).minWidthMm >
      needs("inequality-with-boxes", shortExpr).minWidthMm
  );
});

test("a statement too wide for its column is measured as the two rows it takes", () => {
  const many = { expression: "1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20" };
  assert.ok(
    measure("inequality-with-boxes", many, 60) >
      measure("inequality-with-boxes", many, WIDE_MM),
    "wrapping must cost height, or the extra rows are clipped"
  );
});

test("task content starts where its instruction starts, not in the middle of the zone", () => {
  // From a printed Below sheet. "Count on in tens:" was at the left margin and
  // "26, 36, □ □ □" sat eighty millimetres away in the middle of a full-width
  // zone, with empty page between the question and the thing it was asking
  // about. A child has to cross that gap to find what they are counting.
  //
  // Spare width belongs at the right-hand edge, where it reads as margin. It
  // never belongs between an instruction and its content. Both rows below sit
  // directly under a stem, so the rule is one rule.
  for (const selector of ["h-ineq-row", "h-circle-row"]) {
    const rule = new RegExp(String.raw`\.${selector}\s*{[^}]*}`).exec(css);
    assert.ok(rule, `${selector} has no styling at all`);
    assert.ok(
      !/justify-content:\s*(center|flex-end)/.test(rule[0]),
      `${selector} centres its content away from the instruction above it`
    );
  }
});

// ─── order-numbers ───────────────────────────────────────────────────────

test("an ordering row has exactly one blank per number", () => {
  // Four numbers ordered into three blanks is a question nobody can answer,
  // and it looks perfectly finished on the page.
  for (const numbers of [["0.9", "0.34"], ["0.9", "0.34", "0.6", "0.07"], ["1", "2", "3", "4", "5", "6"]]) {
    const html = render("order-numbers", { id: "1", numbers });
    assert.equal(
      count(html, /h-order-blank"/g),
      numbers.length,
      `${numbers.length} numbers must give ${numbers.length} blanks`
    );
    assert.equal(
      count(html, /h-order-sep/g),
      numbers.length - 1,
      "a separator sits between blanks, not after the last one"
    );
  }
});

test("the numbers are shown on the card and never in the blanks", () => {
  const html = render("order-numbers", {
    id: "1",
    numbers: ["0.9", "0.34", "0.6", "0.07"],
    prompt: "Order from smallest to largest.",
  });
  assert.equal(count(html, /h-order-given/g), 4, "every number is on the card");
  assert.match(html, /<span class="h-order-blank"><\/span>/, "the blanks come out empty");
  assert.match(html, /Order from smallest to largest\./);
});

test("the separator the sheet asks for is the one it gets", () => {
  const commas = render("order-numbers", { numbers: ["1", "2", "3"], separator: "," });
  assert.equal(count(commas, /<span class="h-order-sep">,<\/span>/g), 2);

  const byDefault = render("order-numbers", { numbers: ["1", "2", "3"] });
  assert.equal(count(byDefault, /<span class="h-order-sep">&lt;<\/span>/g), 2);
});

test("six numbers to order need more width than three", () => {
  const three = { numbers: ["0.9", "0.34", "0.6"] };
  const six = { numbers: ["0.9", "0.34", "0.6", "0.07", "0.45", "0.5"] };
  assert.ok(
    needs("order-numbers", six).minWidthMm > needs("order-numbers", three).minWidthMm
  );
  assert.ok(
    measure("order-numbers", six, COLUMN_MM) > measure("order-numbers", three, COLUMN_MM),
    "more numbers in a fixed column wrap onto more rows, which costs height"
  );
});

// ─── order-table ─────────────────────────────────────────────────────────

test("an order table gives one filled cell and one empty cell per number", () => {
  const html = render("order-table", {
    id: "2",
    text: "Order these decimals from smallest to largest.",
    numbers: ["0.6", "0.06", "0.60", "0.16"],
  });
  assert.equal(count(html, /h-cq-given/g), 4, "the numbers are handed to the child");
  assert.equal(count(html, /h-cq-write/g), 4, "and there is a cell under each one");
  assert.ok(
    !/h-cq-write[^>]*>[^<]/.test(html),
    "an answer cell must come out empty"
  );
});

test("an order table reads the camelCase field names, not the Word builder's", () => {
  // The reference doc writes top_label and bottom_label. An author who copies
  // those in gets no error and no label: the field is simply never read.
  const html = render("order-table", {
    numbers: ["0.6", "0.06"],
    topLabel: "Decimals",
    bottomLabel: "Lightest → Heaviest",
  });
  assert.match(html, /Decimals/);
  assert.match(html, /Lightest → Heaviest/);
  assert.ok(!html.includes("Numbers"), "the default must give way to the field");
});

test("an order table with more numbers needs more width", () => {
  const three = { numbers: ["0.6", "0.06", "0.60"] };
  const six = { numbers: ["0.6", "0.06", "0.60", "0.16", "0.1", "0.66"] };
  assert.ok(
    needs("order-table", six).minWidthMm > needs("order-table", three).minWidthMm,
    "a cell a child writes a decimal into cannot shrink to fit more of them"
  );
});

test("a follow-up gives two writing lines a mark, and none when it is worth none", () => {
  const base = { numbers: ["0.6", "0.06"] };
  const oneMark = render("order-table", {
    ...base,
    followUp: { text: "Which surprised you?", marks: 1 },
  });
  const twoMarks = render("order-table", {
    ...base,
    followUp: { text: "Explain how you know.", marks: 2 },
  });
  const noLines = render("order-table", {
    ...base,
    followUp: { text: "Say the order aloud to your partner.", marks: 0 },
  });

  assert.equal(count(oneMark, /h-cq-line/g), 2);
  assert.equal(count(twoMarks, /h-cq-line/g), 4);
  assert.equal(count(noLines, /h-cq-line/g), 0);
  assert.match(noLines, /Say the order aloud/, "the prompt still prints");

  assert.ok(
    measure("order-table", { ...base, followUp: { text: "Explain how you know.", marks: 2 } }, COLUMN_MM) >
      measure("order-table", { ...base, followUp: { text: "Which surprised you?", marks: 1 } }, COLUMN_MM),
    "more writing lines must cost more height"
  );
});

test("younger children get taller writing lines than older ones", () => {
  const spec = { numbers: ["0.6", "0.06"], followUp: { text: "Explain.", marks: 2 } };
  assert.ok(
    measure("order-table", { ...spec, phase: "lower" }, COLUMN_MM) >
      measure("order-table", { ...spec, phase: "upper" }, COLUMN_MM)
  );
});

test("the height allowed for an answer cell is the height the CSS draws", () => {
  // The same drift that once sliced the bottom off a fact file. The estimate
  // and the stylesheet are the same fact written twice, and nothing about a
  // clipped table row looks wrong on the page.
  const declared = /\.h-ordertable-answer td \{[^}]*height:\s*([\d.]+)mm/.exec(css);
  assert.ok(declared, "the answer row declares no height at all");

  const rowMm = Number(declared[1]);
  const one = measure("order-table", { numbers: ["1"] }, FULL_MM);
  const topOnly = measure(
    "order-table",
    { numbers: ["1"], bottomLabel: "x" },
    FULL_MM
  );
  assert.equal(one, topOnly, "sanity: the label length is not what is being measured");
  assert.ok(rowMm >= 12, `an answer cell of ${rowMm}mm is too small to write a number in`);
});

// ─── data-table-with-ordering ────────────────────────────────────────────

const JUMPS = {
  id: "7",
  text: "Four children jumped in PE.",
  rows: [
    { label: "Child", values: ["Kai", "Mia", "Leo", "Ava"] },
    { label: "Jump (m)", values: ["0.85", "0.7", "0.68", "0.9"] },
  ],
  ordering: { leftLabel: "Shortest", rightLabel: "Longest", blanks: 4, separator: "<" },
  followUp: { text: "Explain how you worked it out.", marks: 1 },
};

test("a data table hands over its values and keeps the ordering row empty", () => {
  const html = render("data-table-with-ordering", JUMPS);
  assert.equal(count(html, /h-cq-given/g), 8, "every value is handed to the child");
  assert.match(html, /Child/);
  assert.match(html, /Jump \(m\)/);
  assert.equal(count(html, /h-order-blank"/g), 4, "one blank per thing to order");
  assert.match(html, /<span class="h-order-blank"><\/span>/, "the blanks come out empty");
  assert.match(html, /Shortest/);
  assert.match(html, /Longest/);
  assert.equal(count(html, /h-cq-line/g), 2, "one mark is two lines to explain on");
});

test("the ordering row defaults to one blank per value, not to a fixed four", () => {
  // A table of six results ordered into four blanks is unanswerable, and a
  // table of three into four invites a child to invent a fourth.
  const six = {
    rows: [{ label: "Score", values: ["1", "2", "3", "4", "5", "6"] }],
    ordering: { leftLabel: "Lowest", rightLabel: "Highest" },
  };
  assert.equal(count(render("data-table-with-ordering", six), /h-order-blank"/g), 6);

  const three = {
    rows: [{ label: "Score", values: ["1", "2", "3"] }],
    ordering: { leftLabel: "Lowest", rightLabel: "Highest" },
  };
  assert.equal(count(render("data-table-with-ordering", three), /h-order-blank"/g), 3);
});

test("a data table of five rows needs more height than one of two", () => {
  // The mistake a constant makes, and the one that gets caught last: the fit
  // check reports no problem while the last two rows sit off the bottom.
  const two = { rows: JUMPS.rows, ordering: JUMPS.ordering };
  const five = {
    rows: [
      ...JUMPS.rows,
      { label: "Throw (m)", values: ["4.2", "3.9", "5.1", "4.8"] },
      { label: "Sprint (s)", values: ["9.1", "8.7", "9.4", "8.9"] },
      { label: "Points", values: ["12", "15", "11", "18"] },
    ],
    ordering: JUMPS.ordering,
  };
  assert.ok(
    needs("data-table-with-ordering", five).minHeightMm >
      needs("data-table-with-ordering", two).minHeightMm
  );
  assert.ok(
    measure("data-table-with-ordering", five, FULL_MM) >
      measure("data-table-with-ordering", two, FULL_MM)
  );
});

test("a data table with more columns needs more width", () => {
  const four = { rows: [{ label: "Jump (m)", values: ["0.85", "0.7", "0.68", "0.9"] }] };
  const two = { rows: [{ label: "Jump (m)", values: ["0.85", "0.7"] }] };
  assert.ok(
    needs("data-table-with-ordering", four).minWidthMm >
      needs("data-table-with-ordering", two).minWidthMm,
    "four results cannot be squeezed into the room two of them needed"
  );
});

test("the ordering row's labels are camelCase, and both of them are read", () => {
  const html = render("data-table-with-ordering", {
    rows: [{ label: "Length", values: ["3cm", "5cm"] }],
    ordering: { leftLabel: "Shortest", rightLabel: "Longest" },
  });
  assert.equal(count(html, /h-dto-label/g), 2);
});

// ─── circle-the-answer ───────────────────────────────────────────────────

test("short options sit on one row, so each one is its own thing to circle", () => {
  const html = render("circle-the-answer", {
    id: "1",
    prompt: "Circle the larger decimal.",
    options: ["0.48", "0.6"],
  });
  assert.match(html, /h-circle-row/, "two short numbers read best side by side");
  assert.equal(count(html, /h-circle-option/g), 2);
  assert.match(html, /Circle the larger decimal\./);
});

test("options too long to read side by side each take their own line", () => {
  // Sentence-length options joined inline wrap mid-option, so the alternatives
  // stop being visually separable and the child cannot see where one choice
  // ends and the next begins. The task breaks, not just its looks.
  const html = render("circle-the-answer", {
    id: "3",
    prompt: "Circle the statement that is always true.",
    options: [
      "A longer decimal is always a larger number",
      "The digits after the point decide the size",
      "Compare the tenths before the hundredths",
    ],
  });
  assert.match(html, /h-circle-list/);
  assert.ok(!html.includes("h-circle-row"), "these must not be crammed onto one line");
  assert.equal(count(html, /<li class="h-circle-option">/g), 3);
});

test("a row of options needs more width the more options share it", () => {
  const two = { prompt: "Circle the larger.", options: ["0.48", "0.6"] };
  const five = {
    prompt: "Circle the odd one out.",
    options: ["0.48", "0.6", "0.55", "0.07", "0.9"],
  };
  assert.ok(
    needs("circle-the-answer", five).minWidthMm >
      needs("circle-the-answer", two).minWidthMm
  );
});

test("options are given room for the circle a child draws round one", () => {
  // Found by drawing on a printout: options set on consecutive lines with no
  // room between them cannot be circled without the circle running through the
  // option above.
  const padding = /\.h-circle-option \{[^}]*padding:\s*([\d.]+)mm/.exec(css);
  assert.ok(padding, "an option reserves no room around it at all");
  assert.ok(
    Number(padding[1]) >= 2,
    `${padding[1]}mm above and below is not room for a pencil circle`
  );

  // And the estimate has to pay for it, or the last option is clipped.
  const stacked = {
    options: [
      "A longer decimal is always a larger number",
      "The digits after the point decide the size",
    ],
  };
  const one = measure("circle-the-answer", { options: [stacked.options[0]] }, COLUMN_MM);
  const two = measure("circle-the-answer", stacked, COLUMN_MM);
  assert.ok(two > one + 2 * Number(padding[1]));
});

// ─── the rules that hold across all six ──────────────────────────────────

test("every line height is pinned to the one the estimates assume", () => {
  // Left unset, Comic Sans uses its own 1.5, every line runs taller than
  // predicted, and the bottom of the zone is quietly clipped. Nothing about
  // the page looks wrong; a question is simply half missing.
  const declared = css.match(/line-height:\s*([\d.]+)/g) || [];
  assert.ok(declared.length > 0, "no line height is pinned anywhere");
  for (const rule of declared) {
    assert.equal(Number(rule.split(":")[1]), 1.35, `"${rule.trim()}" is not 1.35`);
  }
});

test("colour comes from the design system, never from a hex code", () => {
  // Orange is material handed to the child, black is what the child reads and
  // writes, green is vocabulary, blue names a block. A hex code in here is a
  // fifth meaning nobody agreed to.
  //
  // This used to assert the question number was BLUE. Daniel changed that rule:
  // a number is bold black in brackets wherever it appears, because a sheet
  // carrying a blue unbracketed number beside a black bracketed one reads as
  // two sheets stapled together. Every number on the page is now checked
  // together in helpers.test.js.
  assert.ok(!/#[0-9a-fA-F]{3,6}\b/.test(css), "a colour is hard-coded in the CSS");
  assert.match(css, /var\(--colour-given\)/, "given material must carry its colour");
  assert.match(css, /var\(--colour-ink\)/, "what the child reads must be ink");
});

test("every helper answers all four parts of the contract", () => {
  const expected = [
    "compare-row",
    "inequality-with-boxes",
    "order-numbers",
    "order-table",
    "data-table-with-ordering",
    "circle-the-answer",
  ];
  assert.deepEqual(Object.keys(helpers).sort(), [...expected].sort());

  for (const [name, helper] of Object.entries(helpers)) {
    assert.equal(typeof helper.render, "function", `"${name}" has no render`);
    assert.equal(typeof helper.measure, "function", `"${name}" has no measure`);
    assert.equal(typeof helper.needs, "function", `"${name}" has no needs`);
    assert.ok(
      Number.isFinite(helper.greed) && helper.greed >= 0 && helper.greed <= 5,
      `"${name}" has greed ${helper.greed}, which is outside 0 to 5`
    );
  }
});

test("no helper asks for more room than a page can ever give it", () => {
  const specs = {
    "compare-row": { id: "1", left: "£3.40", right: "340p" },
    "inequality-with-boxes": { expression: "5 . □ 2 < 5 . □ 8" },
    "order-numbers": { id: "1", numbers: ["0.9", "0.34", "0.6", "0.07"] },
    "order-table": { id: "2", numbers: ["0.6", "0.06", "0.60", "0.16"] },
    "data-table-with-ordering": JUMPS,
    "circle-the-answer": { id: "1", prompt: "Circle the larger.", options: ["0.48", "0.6"] },
  };
  for (const [name, spec] of Object.entries(specs)) {
    const need = needs(name, spec);
    assert.ok(need.minWidthMm > 0 && need.minWidthMm <= WIDE_MM, `${name}: ${need.minWidthMm}mm wide`);
    assert.ok(need.minHeightMm > 0 && need.minHeightMm <= 190, `${name}: ${need.minHeightMm}mm tall`);
    // A minimum height is the SHORTEST the content can come out, which is what
    // it measures at the widest a zone can be. Narrower than that it can only
    // grow, so a zone shorter than the minimum cannot hold it at any width.
    assert.ok(
      measure(name, spec, need.minWidthMm) >= need.minHeightMm - 0.001,
      `${name} claims a minimum height taller than it ever measures`
    );
  }
});
