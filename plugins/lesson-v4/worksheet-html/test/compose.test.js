"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  needsContent,
  measureContent,
  greedContent,
  renderContent,
  describeContent,
  REGISTRY,
} = require("../src/helpers");

const ANGLE = { helper: "angle", degrees: 45, arc: true };
const QUESTIONS = { helper: "questions", items: ["Name each angle."] };
const WRITING = {
  helper: "written-answers",
  items: [{ text: "How did you decide?", lines: 2 }],
};

const angleNeeds = REGISTRY.angle.needs(ANGLE);

// The claim this whole thing rests on: putting several helpers in one zone
// does NOT need a new judgement per combination. A group's minimum follows
// from its parts, by the same two rules the layout tree already uses.

test("a row's width is the sum of its parts, plus the gaps", () => {
  const three = needsContent({ row: ANGLE, repeat: 3 });
  const one = needsContent(ANGLE);
  const gaps = three.minWidthMm - one.minWidthMm * 3;

  assert.ok(three.minWidthMm > one.minWidthMm * 3, "three should need more than three times one");
  assert.ok(gaps > 0 && gaps < 20, `the difference should be gaps, got ${gaps}mm`);
});

test("a row is only as tall as its tallest part", () => {
  const row = needsContent({ row: [ANGLE, QUESTIONS] });
  assert.equal(
    row.minHeightMm,
    Math.max(angleNeeds.minHeightMm, REGISTRY.questions.needs(QUESTIONS).minHeightMm)
  );
});

test("a stack's height is the sum of its parts, and its width the widest", () => {
  const stack = needsContent({ stack: [ANGLE, QUESTIONS] });
  const a = needsContent(ANGLE);
  const q = needsContent(QUESTIONS);

  assert.ok(stack.minHeightMm > a.minHeightMm + q.minHeightMm - 0.01);
  assert.equal(stack.minWidthMm, Math.max(a.minWidthMm, q.minWidthMm));
});

test("groups nest, and the arithmetic keeps working", () => {
  const question = { stack: [{ row: ANGLE, repeat: 3 }, QUESTIONS, WRITING] };
  const n = needsContent(question);

  // Width comes from the widest part, which is the row of three.
  assert.equal(
    Math.round(n.minWidthMm),
    Math.round(needsContent({ row: ANGLE, repeat: 3 }).minWidthMm)
  );
  assert.ok(n.minHeightMm > needsContent(WRITING).minHeightMm);
});

// Daniel's actual question: one is fine, three is now too small. It should be
// the engine that notices, not a person.
test("more of the same thing needs more room, and eventually stops fitting", () => {
  const WIDEST_PAGE_MM = 261; // A4 landscape, printable
  const widthFor = (n) => needsContent({ row: ANGLE, repeat: n }).minWidthMm;

  const counts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const widths = counts.map(widthFor);

  for (let i = 1; i < widths.length; i++) {
    assert.ok(widths[i] > widths[i - 1], "more items should need more width");
  }

  // Asserted as a property rather than against a fixed count, because the
  // count depends on a helper's own minimum and those change: lowering the
  // angle's floor on Daniel's say-so moved the answer from six to more, and a
  // test pinned to six would have failed for the wrong reason.
  const firstTooWide = counts.find((n) => widthFor(n) > WIDEST_PAGE_MM);
  assert.ok(firstTooWide, "enough of anything should eventually stop fitting");
  assert.ok(
    widthFor(firstTooWide - 1) <= WIDEST_PAGE_MM,
    "the one before it should still fit"
  );
});

test("a single helper still behaves exactly as it did", () => {
  assert.deepEqual(needsContent(ANGLE), REGISTRY.angle.needs(ANGLE));
  assert.equal(measureContent(ANGLE, 80), REGISTRY.angle.measure(ANGLE, 80));
  assert.equal(greedContent(ANGLE), REGISTRY.angle.greed);
});

test("a group can use spare height if any of its parts can", () => {
  assert.equal(greedContent({ stack: [ANGLE, WRITING] }), REGISTRY["written-answers"].greed);
  assert.equal(greedContent({ stack: [ANGLE, ANGLE] }), REGISTRY.angle.greed);
});

// Equal shares look right and are wrong: every drawing is cropped tight to its
// own outline, so a sharp angle is tall and narrow while a wide one is short.
// Given equal widths they came out 59mm and 17mm tall, side by side, in a
// question asking a child to compare them.
// The shares the row ACTUALLY hands out, read back off what it rendered.
// Worked out again here rather than read back, an earlier version of this test
// tested its own copy of the rule and passed while the real one was wrong.
// grow-share, shrink, then the starting size: the item's own minimum width by
// default, or zero when the row states its parts and means them exactly.
const SHARE = /flex: ([\d.]+) 1 (?:0|[\d.]+mm)/g;
function sharesRenderedBy(content) {
  return [...renderContent(content).matchAll(SHARE)].map((m) => Number(m[1]));
}

test("a row of differently shaped drawings comes out at one height", () => {
  const row = {
    row: [
      { helper: "angle", degrees: 30, arc: true },
      { helper: "angle", degrees: 90, arc: true },
      { helper: "angle", degrees: 150, arc: true },
    ],
  };

  const ROW_WIDTH_MM = 180;
  const usable = ROW_WIDTH_MM - 4 * (row.row.length - 1);
  const heights = sharesRenderedBy(row).map((share, i) =>
    measureContent(row.row[i], share * usable)
  );

  const spread = Math.max(...heights) - Math.min(...heights);
  assert.ok(
    spread < 3,
    `the three should be within 3mm of each other, got ${heights
      .map((h) => Math.round(h))
      .join(", ")}mm`
  );
  assert.ok(measureContent(row, ROW_WIDTH_MM) > 0);
});

// Daniel, on the first real maths sheet: "the questions are not uniform". Each
// row was allocated on its own, so a question column beside a chart, a bar
// model and a column method came out three different widths and the sheet read
// as three unrelated blocks.
test("the same parts on different rows put their edge in the same place", () => {
  const CHART = {
    helper: "bar-chart",
    title: "Books read",
    categories: ["Oak", "Elm", "Birch"],
    values: [24, 18, 30],
    yMax: 32,
    yInterval: 4,
  };
  const MODEL = {
    helper: "bar-model",
    shape: "part-whole",
    whole: { label: "84" },
    parts: [{ label: "24" }, { label: "?" }],
  };
  const SPLIT = [1.8, 1];
  const ROW_MM = 174;

  const widthOfSecondItem = (drawing) => {
    const shares = sharesRenderedBy({ parts: SPLIT, row: [drawing, QUESTIONS] });
    const usable = ROW_MM - 4;
    return shares[1] * usable;
  };

  const beside = [CHART, MODEL, ANGLE].map(widthOfSecondItem);
  for (const w of beside) {
    assert.ok(
      Math.abs(w - beside[0]) < 0.01,
      `stated parts should give the same width whatever is beside them, got ${beside
        .map((x) => x.toFixed(1))
        .join(", ")}mm`
    );
  }
});

test("explicit parts override the shape-based default", () => {
  const even = sharesRenderedBy({ row: [ANGLE, ANGLE], parts: [1, 1] });
  assert.ok(Math.abs(even[0] - even[1]) < 1e-9, "equal parts should share equally");

  const lopsided = sharesRenderedBy({ row: [ANGLE, ANGLE], parts: [3, 1] });
  assert.ok(
    lopsided[0] > lopsided[1] * 2.9,
    `3:1 should give the first three times the width, got ${lopsided.join(" and ")}`
  );
});

test("a group renders, and a lettered row labels its items", () => {
  const html = renderContent({ row: ANGLE, repeat: 3, letters: true });
  assert.match(html, /\(a\)/);
  assert.match(html, /\(b\)/);
  assert.match(html, /\(c\)/);
  assert.equal((html.match(/<svg/g) || []).length, 3);
});

test("a refusal names the group in a way a person can read", () => {
  const text = describeContent({ stack: [{ row: ANGLE, repeat: 4 }, QUESTIONS] });
  assert.match(text, /4 x angle/, "repeats should be counted, not listed out");
  assert.match(text, /stack/);
  assert.match(text, /row/);
});

// ─── the step between two questions is bigger than any step inside one ────
//
// A Year 4 sheet of stacked number lines gave the join between question 1's
// "Scale:" and question 2's number the same 4mm as the joins inside question 1,
// so the slot read as belonging to the question below (13 September 2026).

test("a new question starts further down than the next part of the same question", () => {
  const line = { helper: "number-line", start: 0, end: 10, interval: 1, boxes: [4] };
  const question = (number) => ({ number, stack: [{ helper: "instruction", text: "Find A." }, line] });
  const inside = measureContent({ stack: [line, line] }, 170) - 2 * measureContent(line, 170);
  const between = measureContent({ stack: [question(1), question(2)] }, 170) - 2 * measureContent(question(1), 170);
  assert.ok(between > inside, `between questions ${between}mm, inside one ${inside}mm`);

  const parts = measureContent({ stack: [question("1a"), question("1b")] }, 170) - 2 * measureContent(question("1a"), 170);
  assert.ok(Math.abs(parts - inside) < 1e-9, "a second Part is the same question and keeps the ordinary gap");

  const html = renderContent({ stack: [question(1), question(2)] }, 170);
  assert.match(html, new RegExp(`margin-top:${Math.round(between)}mm`), "the page draws the gap it measured");
});

test("the line above a run of questions goes above the words that introduce it", () => {
  // "Round to the nearest 1,000." above (3a) to (3f) sat at the ordinary step
  // with no rule, so on a slip where (1) and (2) shared the row above it, it
  // read as belonging to them (Daniel, 19 September 2026).
  const q = (number) => ({ number, stack: [{ helper: "instruction", text: "Find A." }] });
  const intro = { helper: "instruction", text: "Round to the nearest 1,000." };
  const html = renderContent({ stack: [q(1), intro, q("2a"), q("2b")] }, 170);
  const marks = (html.match(/h-stack-item--new-question/g) || []).length;
  assert.equal(marks, 1, "above the introducer, and not again above (2a)");
  // The introducer keeps its tight join to the questions it introduces.
  assert.match(html, /margin-top:2mm/);
  // An introducer with no question under it is still just an item.
  const loose = renderContent({ stack: [q(1), intro, { helper: "instruction", text: "More." }] }, 170);
  assert.ok(!loose.includes("h-stack-item--new-question"), "nothing to introduce, nothing to mark");
});

test("the rule between two questions sits inside the gap and adds no height", () => {
  const line = { helper: "number-line", start: 0, end: 10, interval: 1, boxes: [4] };
  const question = (number) => ({ number, stack: [{ helper: "instruction", text: "Find A." }, line] });
  const html = renderContent({ stack: [question(1), question(2), question("3a"), question("3b")] }, 170);
  assert.equal((html.match(/h-stack-item--new-question/g) || []).length, 2, "above (2) and (3a), not above (1) or (3b)");
  const plainSection = renderContent({ stack: [question(1), { helper: "section-label", text: "Reasoning" }] }, 170);
  assert.ok(!plainSection.includes("h-stack-item--new-question"), "a heading marks itself");
});
