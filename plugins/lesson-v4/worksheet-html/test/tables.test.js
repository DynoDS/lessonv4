"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { helpers } = require("../src/helpers/tables");

// ─── data-table ──────────────────────────────────────────────────────────

test("a headerless data table emits no empty thead", () => {
  // A designer may hand over a table that has no heading row - a
  // nutrient | job | examples grid whose note beneath explains the columns.
  // An empty <thead><tr></tr></thead> is not harmless furniture: Chrome's
  // collapsed-border resolution treats the empty row as the table's first
  // row, the first body row's top border vanishes, and the table prints open
  // along its top edge. A real lesson shipped with its table looking clipped.
  for (const columns of [undefined, []]) {
    const html = helpers["data-table"].render({
      columns,
      rows: [
        ["Carbohydrates", "Energy", "Oat, rye"],
        ["Protein", "Growth and repair", "Egg, pea"],
      ],
    });
    assert.ok(!html.includes("<thead"), "an empty thead reached the page");
    assert.equal(html.split("<tr>").length - 1, 2);
  }
});

test("a data table with columns keeps its heading row", () => {
  const html = helpers["data-table"].render({
    columns: ["Material", "Waterproof?"],
    rows: [["Glass", "yes"]],
  });
  assert.ok(html.includes("<thead"));
  assert.ok(html.includes("<th>Material</th>"));
});

test("the measurement counts a heading row only when one prints", () => {
  const rows = [
    ["a", "b"],
    ["c", "d"],
  ];
  const withHead = helpers["data-table"].measure({ columns: ["x", "y"], rows }, 100);
  const headerless = helpers["data-table"].measure({ rows }, 100);
  assert.ok(
    headerless < withHead,
    "a headerless table was measured as though its heading row still printed"
  );
});
