"use strict";

// Both tables used to price every row at one line of text, whatever the row
// held. A given cell carrying a sentence therefore made the table taller than
// the engine had promised, and because the error only ever ran one way - the
// estimate never rose - a page could pass its fit check and then clip in the
// browser. Found on 30 August 2026 while re-running the Electrical Appliances
// worksheet: a four-clue recording table claimed 61mm and drew 91mm.

const { test } = require("node:test");
const assert = require("node:assert");

const { helpers } = require("../src/helpers/tables");

const recording = helpers["recording-table"];
const data = helpers["data-table"];

const CLUE =
  "Hairdryer: its three-pin plug is disconnected beside it; when connected " +
  "to a wall socket, electricity heats the air and spins a fan.";

function clueTable(writing = "word") {
  return {
    helper: "recording-table",
    columns: ["Clue", "What it is"],
    rows: [[CLUE, null], ["Portable radio: two batteries power its speaker.", null]],
    writing,
  };
}

test("a wrapped given cell makes its table taller than the flat count", () => {
  const wrapped = clueTable();
  const flat = { ...wrapped, rows: [["Foil", null], ["Paper", null]] };
  const measured = recording.measure(wrapped, 174);
  const flatMm = recording.measure(flat, 174);
  // The old code returned the flat figure for both, which is the whole bug.
  assert.ok(
    measured > flatMm + 10,
    `a table holding a 130-character clue measured ${measured.toFixed(1)}mm, ` +
      `barely above the ${flatMm.toFixed(1)}mm it would take with one-word cells`
  );
});

test("the estimate tracks the real drawn height rather than merely exceeding it", () => {
  // The rendered table measured about 91mm across four clue rows at 174mm.
  const four = clueTable();
  four.rows = [
    [CLUE, null],
    ["Portable radio: two batteries power its speaker.", null],
    ["Manual pencil sharpener: turning the handle spins the blade; it has no battery or plug.", null],
    ["Hand bell: shaking it makes the metal clapper strike the bell; it has no battery or plug.", null],
  ];
  const measured = recording.measure(four, 174);
  assert.ok(
    measured > 80 && measured < 105,
    `expected roughly the drawn 91mm, got ${measured.toFixed(1)}mm`
  );
});

test("a narrower table wraps harder and is measured taller", () => {
  const wide = recording.measure(clueTable(), 174);
  const narrow = recording.measure(clueTable(), 100);
  assert.ok(narrow > wide, `narrow ${narrow.toFixed(1)}mm was not taller than wide ${wide.toFixed(1)}mm`);
});

test("rows whose cells fit on one line are measured exactly as before", () => {
  const plain = {
    helper: "recording-table",
    columns: ["Material", "Result"],
    rows: [["Foil", null], ["Cling film", null], ["Paper", null]],
    writing: "word",
  };
  // caption 0 + header (LINE_MM*1.6) + 3 rows at 12mm + 4.
  const expected = 12 * 0.3528 * 1.35 * 1.6 + 12 * 3 + 4;
  assert.ok(
    Math.abs(recording.measure(plain, 174) - expected) < 0.01,
    `single-line tables must not move: ${recording.measure(plain, 174)} vs ${expected}`
  );
});

test("a compact data table of short cells is unchanged", () => {
  const dt = {
    helper: "data-table",
    compact: true,
    columns: ["A", "B"],
    rows: [["1", "2"], ["3", "4"]],
  };
  const LINE_MM = 12 * 0.3528 * 1.35;
  // Header + 2 rows at the calibrated row price: the browser's line box
  // (LINE_MM * 1.05), 1mm of padding above and below, one collapsed border.
  // The old price (LINE_MM * 1.35) ran a third of a millimetre short per row,
  // which compounded on a ten-row hundred square and clipped it.
  const expected = (LINE_MM * 1.05 + 2 * 1 + 0.4) * 3 + 4;
  assert.ok(
    Math.abs(data.measure(dt, 174) - expected) < 0.01,
    `compact data tables must not move: ${data.measure(dt, 174)} vs ${expected}`
  );
});

test("a data table with a sentence cell grows too", () => {
  const dt = {
    helper: "data-table",
    columns: ["Object", "What we know"],
    rows: [["Hairdryer", CLUE], ["Radio", "Two batteries power its speaker."]],
  };
  const flat = data.measure(
    { ...dt, rows: [["Hairdryer", "Mains"], ["Radio", "Battery"]] },
    174
  );
  assert.ok(
    data.measure(dt, 174) > flat + 8,
    "a sentence in a data cell must add real height"
  );
});

test("the stated floor stays reachable, so a wrapping table is not refused everywhere", () => {
  // needs() must NOT report the table's tallest possible height, or the helper
  // is refused from every zone that could have grown to hold it.
  const spec = clueTable();
  assert.ok(
    recording.needs(spec).minHeightMm < recording.measure(spec, 174),
    "the floor must sit below the natural height, not above it"
  );
});
