"use strict";

// A lettered Part that is a drawing in a row may carry its number above it
// (15 October 2026). Beside each frame, three Year 4 column frames numbered
// (1a), (1b), (1c) needed 179mm on a 174mm page, so the Below planner's sheet
// lost a sum or went back to be planned again in three lessons of five. The
// teacher's ruling: the number above is good to use when the number beside
// does not fit, or instead of it, never forced; and the group's instruction
// line prints once with no "(1)" of its own.

const assert = require("node:assert/strict");
const test = require("node:test");

const helpers = require("../src/helpers");
const { numbered } = require("../src/worksheet");
const { pageFigures, measureFooter } = require("../src/page-figures");
const { NUMBER_ABOVE_MM } = require("../src/helpers/compose");

const PORTRAIT_MM = 174;

const frame = (top, bottom) => ({
  helper: "column-method-grid",
  operator: "-",
  top,
  bottom,
  showHeadings: true,
  phase: "upper",
});
const part = (id, content, prompt) => {
  const out = { question: true, questionGroupId: id, stack: [content] };
  if (prompt) out.groupPrompt = prompt;
  return out;
};
const threeFrames = (extra = {}) => ({
  ...extra,
  row: [
    part("g", frame(6453, 187), "Use column subtraction."),
    part("g", frame(4531, 216)),
    part("g", frame(8425, 431)),
  ],
});
const twoFrames = (extra = {}) => ({
  ...extra,
  row: [part("g", frame(6453, 187), "Use column subtraction."), part("g", frame(4531, 216))],
});
// The row as the engine prints it: the group's line spliced above it.
const rowOf = (items) => numbered([{ stack: [items] }])[0].stack.find((x) => x.row);
const html = (items) => helpers.renderContent(numbered([{ stack: [items] }])[0], PORTRAIT_MM);

const htmlAt = (items, widthMm) => helpers.renderContent(numbered([{ stack: [items] }])[0], widthMm);

test("three lettered column frames a little too wide keep their numbers beside, with squares a little smaller", () => {
  // Monday's Below sheet: beside, at full squares, three frames need 179mm of
  // 174mm. The teacher chose numbers beside with 9.7mm squares over numbers
  // above with full ones, and agreed 9.5mm as the least (15 October 2026).
  const row = rowOf(threeFrames());
  const beside = row.row.reduce((sum, p) => sum + helpers.needsContent(p).minWidthMm, 0) + 8;
  assert.ok(beside > PORTRAIT_MM, `at full squares they need ${beside}mm, more than the page`);
  const out = html(threeFrames());
  assert.ok(!out.includes("h-numbered--above"), "the numbers stay beside");
  for (const label of ["(1a)", "(1b)", "(1c)"]) assert.ok(out.includes(label), label);
  assert.ok(helpers.needsContent(row, PORTRAIT_MM).minWidthMm <= PORTRAIT_MM);
});

test("squares never come out under 9.5mm: a row that needs more goes above instead", () => {
  // 160mm: beside, even at 9.5mm squares, three frames do not fit; above, at
  // full squares, they do.
  const out = htmlAt(threeFrames(), 160);
  assert.equal((out.match(/h-numbered--above/g) || []).length, 3);
  const given = threeFrames();
  given.row = given.row.map((p) => ({ ...p, stack: [{ ...p.stack[0], squaresGive: true }] }));
  const tight = rowOf(given);
  const besideGiven = tight.row.reduce((sum, p) => sum + helpers.needsContent(p).minWidthMm, 0) + 8;
  assert.ok(besideGiven > 160, `beside at 9.5mm squares they need ${besideGiven}mm`);
});

test("a frame asked to give is no more than 5% narrower, and an ordinary frame does not give", () => {
  const plain = helpers.needsContent(frame(6453, 187)).minWidthMm;
  const given = helpers.needsContent({ ...frame(6453, 187), squaresGive: true }).minWidthMm;
  assert.ok(given < plain, "it gives");
  assert.ok(given >= plain * 0.95 - 0.01, `${given}mm against ${plain}mm`);
  assert.throws(() => helpers.renderContent(frame(6453, 187), plain * 0.95), /WRITE_IN_TOO_NARROW/);
});

test("numbers above cost height and no width", () => {
  const row = rowOf(threeFrames({ numbersAbove: true }));
  const bare = { row: row.row.map(({ number, ...rest }) => rest) };
  assert.equal(Math.round(helpers.needsContent(row).minWidthMm), Math.round(helpers.needsContent(bare).minWidthMm));
  assert.equal(
    Math.round(helpers.measureContent(row, PORTRAIT_MM)),
    Math.round(helpers.measureContent(bare, PORTRAIT_MM) + NUMBER_ABOVE_MM)
  );
});

test("a row that fits with its numbers beside keeps them beside", () => {
  const out = html(twoFrames());
  assert.ok(!out.includes("h-numbered--above"), "nothing moves when the row fits");
  assert.ok(out.includes("(1a)") && out.includes("(1b)"));
});

test("a designer may ask for the numbers above even when beside would fit", () => {
  const out = html(twoFrames({ numbersAbove: true }));
  assert.equal((out.match(/h-numbered--above/g) || []).length, 2);
});

test("the group's instruction prints once, with no number of its own", () => {
  const out = html(threeFrames());
  assert.equal((out.match(/Use column subtraction\./g) || []).length, 1);
  assert.ok(!/\(1\)</.test(out), "no (1) beside the instruction");
});

test("a written Part keeps its number beside, however tight the row", () => {
  const written = (id, text, prompt) =>
    part(id, { helper: "questions", items: [text], showNumbers: false, phase: "upper" }, prompt);
  const row = {
    numbersAbove: true,
    row: [written("w", "62", "Write each number as Roman numerals."), written("w", "85")],
  };
  assert.ok(!html(row).includes("h-numbered--above"));
});

test("an unlettered question in a row keeps its number beside", () => {
  const items = {
    numbersAbove: true,
    row: [
      { question: true, stack: [frame(6453, 187)] },
      { question: true, stack: [frame(4531, 216)] },
    ],
  };
  assert.ok(!html(items).includes("h-numbered--above"));
});

test("the measuring tool's note tells the planner how lettered drawings are numbered", () => {
  const f = pageFigures();
  assert.equal(f.numberAboveMm, NUMBER_ABOVE_MM);
  assert.match(measureFooter(f), new RegExp(`above its drawing instead[^.]*${f.numberAboveMm}mm of height and no width`));
});

test("a worked example beside column frames starts level with them", () => {
  // The column frame draws as "h-figure h-colgrid", and was read as no drawing
  // at all, so the worked example sat a line higher than the frames under
  // their written sums (the teacher, 15 October 2026: "if one helper like that
  // is misaligned it looks weird").
  const worked = {
    stack: [{
      helper: "place-value-chart",
      phase: "upper",
      columns: ["Th", "H", "T", "O"],
      calculation: { operator: "-", numbers: ["4586", "342"], answer: "4244", worked: true },
    }],
  };
  const withSum = (id, sum, top, bottom, prompt) => {
    const out = { question: true, questionGroupId: id, stack: [{ helper: "instruction", text: sum, phase: "upper" }, frame(top, bottom)] };
    if (prompt) out.groupPrompt = prompt;
    return out;
  };
  const row = {
    row: [worked, withSum("w", "879 - 245 =", 879, 245, "Use column subtraction."), withSum("w", "8,546 - 3,126 =", 8546, 3126)],
  };
  const out = html(row);
  const firstCell = out.split('class="h-row-item')[1];
  assert.match(firstCell, /h-stack-item[^>]*style="margin-top:[1-9]/, "the worked example comes down to the frames");
});
