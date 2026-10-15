"use strict";

// The parts of one question read across the page like a grid: top left, top
// right, then the next row (the teacher, 14 October 2026). A Year 4 Below
// sheet put (1a) and (1b) down the left column and (1c) and (1d) down the
// right, with "Use column addition." over (1a) only, so the right column began
// a line higher, and Problem Solving tucked in under (1d).

const assert = require("node:assert/strict");
const test = require("node:test");

const { renderSheet, drawnZones, sheetGeometry } = require("../src/render");
const { sheetsOf } = require("../src/worksheet");

const sum = (text) => ({
  question: true,
  questionGroupId: "g1",
  stack: [
    { helper: "instruction", text },
    {
      helper: "place-value-chart",
      columns: ["Thousands", "Hundreds", "Tens", "Ones"],
      calculation: { operator: "+", numbers: ["2476", "1357"] },
    },
  ],
});

function below(zones, layout = "band-two-cols") {
  const [only] = sheetsOf({ sheets: { below: { layout, orientation: "portrait", zones } } });
  return only.spec;
}

const fluency = () => {
  const first = sum("2,476 + 1,357 =");
  first.groupPrompt = "Use column addition.";
  return {
    a: { stack: [{ helper: "section-label", text: "Fluency" }] },
    b: { stack: [first, sum("3,658 + 1,347 =")] },
    c: {
      stack: [
        sum("4,586 + 1,519 ="),
        sum("2,769 + 1,236 ="),
        { helper: "section-label", text: "Problem Solving" },
        { helper: "instruction", text: "A library has 2,786 story books and 1,219 information books." },
        { question: true, stack: [{ helper: "instruction", text: "How many books are there altogether?" }] },
      ],
    },
  };
};

const order = (html) => [...html.matchAll(/\((1[a-d])\)/g)].map((m) => m[1]);

test("one question's parts running into a second column are set out in rows across", () => {
  const spec = below(fluency());
  const { sheet } = sheetGeometry(spec);
  const stack = sheet.zones.b.stack;
  assert.equal(sheet.zones.c, undefined, "the two columns became one");
  const rows = stack.filter((item) => item.row);
  assert.deepEqual(
    rows.map((r) => r.row.map((cell) => cell.number)),
    [["1a", "1b"], ["1c", "1d"]],
    "(1a) beside (1b), then (1c) beside (1d)"
  );
  assert.equal(stack[0].groupPrompt, true, "the task line runs across above all four");
  const heading = stack.findIndex((item) => item.helper === "section-label");
  assert.ok(heading > stack.indexOf(rows[1]), "Problem Solving follows underneath, full width");

  const html = renderSheet(spec);
  assert.deepEqual(order(html), ["1a", "1b", "1c", "1d"]);
  assert.equal((html.match(/zone-rule zone-rule--down/g) || []).length, 0, "no line down between parts of one question");
  assert.equal((html.match(/class="[^"]*h-stack-item--new-question/g) || []).length, 1, "one line, above Problem Solving");
  assert.equal((html.match(/<div class="zone-rule" /g) || []).length, 0, "no line under the Fluency band");
});

test("a short last row keeps its part in the left-hand place", () => {
  const zones = fluency();
  zones.c.stack.splice(1, 1);
  const { sheet } = sheetGeometry(below(zones));
  const rows = sheet.zones.b.stack.filter((item) => item.row);
  assert.equal(rows[1].row.length, 2);
  assert.equal(rows[1].row[0].number, "1c");
  assert.deepEqual(rows[1].row[1], { stack: [] });
});

test("sections side by side are left as they are, with the line down between them", () => {
  const first = sum("2,476 + 1,357 =");
  first.groupPrompt = "Use column addition.";
  const spec = below(
    {
      a: { stack: [{ helper: "section-label", text: "Fluency" }, first, sum("3,658 + 1,347 =")] },
      b: {
        stack: [
          { helper: "section-label", text: "Problem Solving" },
          { question: true, stack: [{ helper: "instruction", text: "How many books are there altogether?" }] },
        ],
      },
    },
    "halves-side"
  );
  const { sheet } = sheetGeometry(spec);
  assert.ok(sheet.zones.b, "Problem Solving keeps its own column");
  assert.equal((renderSheet(spec).match(/zone-rule zone-rule--down/g) || []).length, 1);
});

test("when rows would not fit the page, the columns stay and the task line goes across both", () => {
  // Three parts down the left; the fourth and two more questions down the
  // right. Set out in rows the two questions fall under the rows at full
  // width and the page runs out; in columns it holds.
  const first = sum("2,476 + 1,357 =");
  first.groupPrompt = "Use column addition.";
  const other = (text) => ({ question: true, stack: [{ helper: "instruction", text }, sum("1 + 1 =").stack[1]] });
  const spec = below({
    a: { stack: [{ helper: "section-label", text: "Fluency" }] },
    b: { stack: [first, sum("3,658 + 1,347 ="), sum("4,586 + 1,519 =")] },
    c: { stack: [sum("2,769 + 1,236 ="), other("How many books?"), other("How many pens?")] },
  });
  const { sheet } = sheetGeometry(spec);
  assert.ok(sheet.zones.c, "the columns stay");
  const zones = drawnZones(spec);
  const line = zones.find((z) => z.content.groupPrompt === true);
  assert.ok(line, "the task line has a row of its own");
  const b = zones.find((z) => z.id === "b");
  const c = zones.find((z) => z.id === "c");
  assert.ok(Math.abs(b.y - c.y) < 0.01, "(1a) and (1d) start level");
  assert.ok(line.y < b.y && line.w >= b.w + c.w - 0.01, "the line runs across both columns, above them");
  const html = renderSheet(spec);
  assert.equal((html.match(/zone-rule zone-rule--down/g) || []).length, 1, "a line down: the right column holds other questions too");
});
