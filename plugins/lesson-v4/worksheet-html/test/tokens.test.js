"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { FONT, COLOUR, TYPE, SPACE, RULE, INSET, WRITING_LINE_MM, cssVariables } = require("../src/tokens");

test("the worksheet uses the pipeline's shared typeface", () => {
  // Locked pipeline-wide across slides, stick-in sheets and the
  // shared visuals.
  assert.equal(FONT, "Comic Sans MS");
});

test("every colour is a full six-digit hex with a leading hash", () => {
  for (const [role, value] of Object.entries(COLOUR)) {
    assert.match(value, /^#[0-9A-F]{6}$/, `${role} was "${value}"`);
  }
});

test("vocabulary uses the slide deck's green", () => {
  // Green on a worksheet means "a word that matters", which is the deck's
  // vocabulary meaning. The deck's other meaning for green, a revealed answer,
  // cannot arise on a sheet, so there is no ambiguity to design around.
  assert.equal(COLOUR.vocab, "#00B050");
});

test("the question colour matches the slide deck's focus blue", () => {
  assert.equal(COLOUR.question, "#0070C0");
});

test("given material uses the deck's orange", () => {
  assert.equal(COLOUR.given, "#E46C0A");
});

test("the worksheet declares no answer colour", () => {
  // A worksheet never reveals an answer: the child writes it and the board
  // reveals it. An `answer` token would invite someone to print one.
  assert.equal(COLOUR.answer, undefined);
});

test("scaffold carries no colour of its own", () => {
  // Sentence-starters are set apart by size, weight and their own line. A
  // scaffold colour would make five meanings where four will do, and the
  // retired dark green 355947 must not come back.
  assert.equal(COLOUR.scaffold, undefined);
  for (const value of Object.values(COLOUR)) {
    assert.notEqual(value, "#355947", "the retired scaffold green is back");
    assert.notEqual(value, "#24536B", "the retired worksheet blue is back");
  }
});

test("writing lines are tall enough for primary handwriting", () => {
  assert.ok(WRITING_LINE_MM.lower >= 8, "lower phase lines must be at least 8mm");
  assert.ok(WRITING_LINE_MM.upper >= 6, "upper phase lines must be at least 6mm");
  assert.ok(WRITING_LINE_MM.lower > WRITING_LINE_MM.upper);
});

test("type sizes ascend from note to section label", () => {
  assert.ok(TYPE.note < TYPE.body);
  assert.ok(TYPE.body <= TYPE.question);
  assert.ok(TYPE.question < TYPE.sectionLabel);
});

test("a box is drawn with the same pen wherever it appears", () => {
  // An audit found NINE different border widths across the helper files, three
  // of which (0.3, 0.35, 0.4) were doing the same job. Nobody chose that: each
  // author picked a sensible-looking number and they drifted apart. It shows on
  // a sheet carrying a table beside a grid beside a card, where three boxes of
  // the same kind print in three slightly different weights and the page reads
  // as assembled rather than designed.
  //
  // So the weights are tokens now, and this holds the line. The exceptions are
  // named: a speech bubble's tail is drawn with CSS triangles, whose "borders"
  // are geometry rather than rules, and a source's quote bar is a deliberate
  // heavy stripe.
  const { helperCss } = require("../src/helpers");
  const TRIANGLES_AND_BARS = new Set(["5mm", "4.2mm", "2mm", "1mm"]);

  const widths = new Set();
  const re = /border(?:-[a-z]+)?:\s*([\d.]+mm)\s/g;
  let match;
  while ((match = re.exec(helperCss)) !== null) {
    if (!TRIANGLES_AND_BARS.has(match[1])) widths.add(match[1]);
  }

  const strayed = [...widths].filter(
    (w) => !Object.values(RULE).map((v) => `${v}mm`).includes(w)
  );
  assert.deepEqual(
    strayed,
    [],
    `these line weights are not in the design system: ${strayed.join(", ")}. ` +
      `Use var(--rule-hair), var(--rule-line) or var(--rule-heavy).`
  );
});

test("a box is drawn in the same ink wherever it appears", () => {
  // The companion to the test above, and the same fault found a second time.
  // Once the widths were settled, sixteen box edges were still drawn in rule
  // grey and eleven in ink, for the same job: a storyboard's cells printed
  // black while the match-up cards beside them printed grey, and the page read
  // as assembled from parts even though every line was now the same weight.
  //
  // The rule, and it follows what --colour-rule already says it is for
  // ("writing lines and hairline borders"): grey belongs to the hair weight.
  // A box edge is either ink, or a colour that MEANS something - given for
  // material handed to the child, question for the thing being asked.
  const { helperCss } = require("../src/helpers");

  const offenders = [];
  const re = /border(?:-[a-z]+)?:\s*([^;]*?)\s+(?:solid|dotted|dashed)\s+var\(--colour-rule\)/g;
  let match;
  while ((match = re.exec(helperCss)) !== null) {
    if (!match[1].includes("--rule-hair")) offenders.push(match[0].trim());
  }

  assert.deepEqual(
    offenders,
    [],
    `these box edges are drawn in rule grey at a weight heavier than a ` +
      `hairline: ${offenders.join(" | ")}. Grey is for a line the child writes ` +
      `on. A box edge is var(--colour-ink), or a colour that carries a meaning.`
  );
});

test("no helper invents a colour outside the system", () => {
  // "white" was the only one, on the timeline's era chips, and it arrived with
  // a solid black fill behind it. A raw colour is how a second, undocumented
  // palette starts. SVG fill and stroke are exempt: a drawn rainforest layer
  // or a coin is a picture of a real thing, not type in a design system.
  const { helperCss } = require("../src/helpers");

  const named = [
    ...helperCss.matchAll(
      /(?:^|[^-])(?:background|color|border-color)(?:-color)?:\s*([a-z]+|#[0-9a-fA-F]{3,8})\s*[;}]/g
    ),
  ]
    .map((m) => m[1])
    .filter((v) => !["none", "transparent", "inherit", "currentColor"].includes(v));

  assert.deepEqual(
    named,
    [],
    `these colours are not in the design system: ${named.join(", ")}. ` +
      `Use one of var(--colour-${Object.keys(COLOUR).join("|")}).`
  );
});

test("the three line weights are far enough apart to tell apart", () => {
  // A weight that only exists to be different from another one is not a
  // decision, it is drift with a name. Each has to read as its own thing on
  // paper: a hairline, a box edge, and an emphasis rule that says "the answer
  // goes below here".
  assert.ok(RULE.hair < RULE.line, "a writing line must be lighter than a box");
  assert.ok(
    RULE.heavy >= RULE.line * 1.8,
    `an emphasis rule at ${RULE.heavy}mm does not clearly beat a ${RULE.line}mm box edge`
  );
});

test("a box is padded from the inset scale, not from a number someone liked", () => {
  // The third time the same fault turned up: after the widths and the ink came
  // the room inside the box. Five values were in use with nothing to say which
  // belonged where, and two of them were a place value cell inset 1.5mm in one
  // file and 1.4mm in another.
  //
  // Exempt, and named rather than skipped: `padding: 0`, which is a list reset
  // and not a measurement; percentage padding, which the writing frame uses
  // deliberately because its point is a share of the frame's width; and the
  // method frame's label drop, which is not an inset at all but the arithmetic
  // that lands a label on the centre line of the first row of boxes beside it.
  const { helperCss } = require("../src/helpers");
  const GEOMETRY = new Set([".h-mframe-label"]);

  const allowed = new Set();
  for (const pair of Object.values(INSET)) {
    allowed.add(`${pair.v}mm`);
    allowed.add(`${pair.h}mm`);
  }
  for (const value of Object.values(SPACE)) allowed.add(`${value}mm`);

  const strayed = [];
  for (const m of helperCss.matchAll(/padding(?:-[a-z]+)?:\s*([^;}]+)[;}]/g)) {
    // The selector this declaration belongs to, so an exemption can be granted
    // to a rule rather than to a number that might mean anything.
    const selector = (helperCss.slice(0, m.index).match(/([^{};]+)\{[^{}]*$/) || [
      "",
      "",
    ])[1].trim();
    if ([...GEOMETRY].some((g) => selector.includes(g))) continue;
    for (const part of m[1].trim().split(/\s+/)) {
      if (part === "0" || part.endsWith("%") || part.startsWith("var(")) continue;
      if (!allowed.has(part)) strayed.push(`${m[0].trim()} (${part})`);
    }
  }

  assert.deepEqual(
    strayed,
    [],
    `these paddings are not on the inset or spacing scales: ${strayed.join(" | ")}. ` +
      `Use var(--inset-cell|card|panel) inside a box, or var(--space-*) between two.`
  );
});

test("every inset step is tighter top to bottom than side to side", () => {
  // The rule the scale is built on, and the one worth holding: a line of text
  // brings its own leading above and below it and nothing at all at its sides,
  // so a box padded equally both ways reads as though the words are falling out
  // of it sideways. Every step must also be bigger than the one before, or it
  // is not a step.
  const steps = Object.entries(INSET);
  for (const [name, pair] of steps) {
    assert.ok(pair.h > pair.v, `${name} is padded ${pair.v}mm by ${pair.h}mm`);
  }
  for (let i = 1; i < steps.length; i++) {
    const [name, pair] = steps[i];
    const [, before] = steps[i - 1];
    assert.ok(pair.v > before.v && pair.h > before.h, `${name} did not grow`);
  }
});

test("spacing steps always increase", () => {
  const steps = [SPACE.hair, SPACE.tight, SPACE.item, SPACE.section];
  for (let i = 1; i < steps.length; i++) {
    assert.ok(steps[i] > steps[i - 1], `step ${i} did not increase`);
  }
});

test("cssVariables emits every token as a custom property", () => {
  const css = cssVariables();
  assert.match(css, /^:root \{/);
  for (const role of Object.keys(COLOUR)) {
    assert.ok(css.includes(`--colour-${role}:`), `missing --colour-${role}`);
  }
});
