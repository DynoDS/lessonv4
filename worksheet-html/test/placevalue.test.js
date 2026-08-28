"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

// Required directly rather than through the registry: these five are not
// wired into src/helpers/index.js yet, and a test that cannot run until the
// wiring lands is a test that proves nothing today.
const { helpers, css } = require("../src/helpers/placevalue");

const A_HALF_COLUMN_MM = 87;
const FULL_WIDTH_MM = 180;

function h(name) {
  const found = helpers[name];
  assert.ok(found, `no helper called "${name}"`);
  return found;
}

function occurrences(html, needle) {
  return html.split(needle).length - 1;
}

// The text inside every cell of a given class, blanks included, so a test can
// say "this box is empty" rather than only "this number is missing".
function cellTexts(html, className) {
  const found = [];
  const re = new RegExp(`class="[^"]*\\b${className}\\b[^"]*"[^>]*>([^<]*)<`, "g");
  let match;
  while ((match = re.exec(html)) !== null) found.push(match[1].trim());
  return found;
}

// ─── the contract ────────────────────────────────────────────────────────

test("all five helpers sign the whole contract", () => {
  const expected = [
    "place-value-counter-chart",
    "place-value-chart",
    "digit-cards",
    "times-table-grid",
    "number-pyramid",
  ];
  assert.deepEqual(Object.keys(helpers).sort(), expected.slice().sort());
  for (const [name, helper] of Object.entries(helpers)) {
    assert.equal(typeof helper.render, "function", `${name} has no render`);
    assert.equal(typeof helper.measure, "function", `${name} has no measure`);
    assert.equal(typeof helper.needs, "function", `${name} has no needs`);
    assert.ok(
      Number.isFinite(helper.greed) && helper.greed >= 0 && helper.greed <= 5,
      `${name} has greed ${helper.greed}`
    );
  }
});

test("every line-height is the 1.35 the height estimates assume", () => {
  // Left unset, Comic Sans uses its own 1.5, every line runs taller than
  // predicted, and the bottom of the zone is quietly clipped.
  const declared = css.match(/line-height:\s*([\d.]+)/g) || [];
  assert.ok(declared.length > 0, "no line-height is pinned anywhere");
  for (const rule of declared) {
    assert.equal(Number(rule.split(":")[1]), 1.35, `"${rule.trim()}" is not 1.35`);
  }
});

test("no colour is hard-coded into the markup", () => {
  // The counter palette is declared by name in the CSS; a hex reaching the
  // page would be a second colour system starting.
  const specs = {
    "place-value-counter-chart": { columns: ["ones", ".", "tenths"], counts: { ones: 3 } },
    "place-value-chart": { columns: ["Tens", "Ones"] },
    "digit-cards": { digits: [4, 7] },
    "times-table-grid": { colHeaders: ["3"], rowHeaders: ["4"], cells: [["12"]] },
    "number-pyramid": { rows: [["9"], ["4", "5"]] },
  };
  for (const [name, spec] of Object.entries(specs)) {
    const hex = h(name).render(spec).match(/#[0-9a-fA-F]{3,6}\b/);
    assert.equal(hex, null, `"${name}" hard-codes ${hex && hex[0]}`);
  }
});

test("a stated minimum height is one the helper can actually be drawn in", () => {
  // If a helper measures TALLER at its own minimum width than the minimum
  // height it claims, the zone that accepted it clips it.
  const specs = {
    "place-value-counter-chart": {
      columns: ["hundreds", "tens", "ones"],
      counts: { hundreds: 2, tens: 7, ones: 9 },
    },
    "place-value-chart": { columns: ["Ones", ".", "Tenths", "Hundredths"], instances: 3 },
    "digit-cards": { digits: [0, 3, 4, 7] },
    "times-table-grid": { colHeaders: ["9", "6", ""], rowHeaders: ["3", "8", "6"], cells: [] },
    "number-pyramid": { rows: [[""], ["14", "20"], ["", "8", "12"]] },
  };
  for (const [name, spec] of Object.entries(specs)) {
    const need = h(name).needs(spec);
    const tall = h(name).measure(spec, need.minWidthMm);
    assert.ok(
      tall <= need.minHeightMm + 0.001,
      `"${name}" wants ${tall.toFixed(1)}mm but claims ${need.minHeightMm.toFixed(1)}mm is enough`
    );
  }
});

// ─── place-value-counter-chart ───────────────────────────────────────────

test("a counter chart draws exactly the counters it was asked for", () => {
  const spec = {
    columns: ["ones", ".", "tenths", "hundredths"],
    counts: { ones: 3, tenths: 1, hundredths: 4 },
  };
  const html = h("place-value-counter-chart").render(spec);
  assert.equal(occurrences(html, 'class="h-pvc-counter"'), 8);
});

test("a counter shows its place's value, not the number of counters", () => {
  // The child reads 3 + 0.1 + 0.04 off the discs; a disc printing "3" would
  // be showing the answer to a different question.
  const html = h("place-value-counter-chart").render({
    columns: ["ones", ".", "tenths"],
    counts: { ones: 3, tenths: 1 },
  });
  const faces = cellTexts(html, "h-pvc-counter");
  assert.deepEqual(faces, ["1", "1", "1", "0.1"]);
});

test("a column with no counters is drawn empty", () => {
  const html = h("place-value-counter-chart").render({
    columns: ["tens", "ones"],
    counts: { tens: 2 },
  });
  assert.equal(occurrences(html, 'class="h-pvc-counter"'), 2);
  assert.ok(html.includes("Ones"), "the empty column still has its heading");
});

test("a chart with nothing in it is left tall enough to draw counters in", () => {
  // "Draw counters to show 3.14" is the other half of this helper's job, and
  // Word gave that case a single empty row: a chart a child cannot answer in.
  const blank = { columns: ["ones", ".", "tenths"] };
  const shown = { columns: ["ones", ".", "tenths"], counts: { ones: 3, tenths: 1 } };
  const helper = h("place-value-counter-chart");
  assert.ok(
    helper.measure(blank, FULL_WIDTH_MM) > helper.measure(shown, FULL_WIDTH_MM),
    "a blank chart is no taller than one already filled in"
  );
});

test("a counter chart's minimum grows with columns, and its height with counters", () => {
  const helper = h("place-value-counter-chart");
  const narrow = helper.needs({ columns: ["tens", "ones"], counts: { ones: 4 } });
  const wide = helper.needs({
    columns: ["thousands", "hundreds", "tens", "ones"],
    counts: { ones: 4 },
  });
  assert.ok(wide.minWidthMm > narrow.minWidthMm, "four columns ask no more room than two");

  const few = helper.needs({ columns: ["ones"], counts: { ones: 2 } });
  const many = helper.needs({ columns: ["ones"], counts: { ones: 9 } });
  assert.ok(many.minHeightMm > few.minHeightMm, "nine counters stack no taller than two");
});

test("the height maths wraps counters exactly where the CSS wraps them", () => {
  // The rule this engine keeps learning: the measurement has to match the CSS,
  // to the millimetre. Here the CSS decides how many discs fit on a line and
  // the arithmetic decides how tall that makes the chart, and if the two
  // disagree by one disc the bottom row is drawn outside the zone and clipped
  // without a word. So the CSS is read back and the arithmetic checked against
  // it rather than against itself.
  const helper = h("place-value-counter-chart");
  const disc = Number(/\.h-pvc-counter\s*{[^}]*width:\s*([\d.]+)mm/.exec(css)[1]);
  const gap = Number(/\.h-pvc-body-cell\s*{[^}]*gap:\s*([\d.]+)mm/.exec(css)[1]);
  const pad = Number(/\.h-pvc-body-cell\s*{[^}]*padding:\s*([\d.]+)mm/.exec(css)[1]);

  const spec = (ones) => ({ columns: ["ones"], counts: { ones } });
  const columnMm = Number(
    /h-pvc-body-cell[^"]*" style="width:([\d.]+)mm/.exec(helper.render(spec(1)))[1]
  );
  const perRow = Math.floor((columnMm - 2 * pad + gap) / (disc + gap));
  assert.ok(perRow >= 1, "the column is too narrow for a single counter");

  const one = helper.measure(spec(1), FULL_WIDTH_MM);
  for (let count = 1; count <= 9; count++) {
    const linesOfDiscs = Math.ceil(count / perRow);
    assert.ok(
      Math.abs(helper.measure(spec(count), FULL_WIDTH_MM) - (one + (linesOfDiscs - 1) * (disc + gap))) < 0.001,
      `${count} counters wrap onto ${linesOfDiscs} lines in the CSS, and the height does not say so`
    );
  }
});

test("counters never grow with the zone: the chart is a fixed object", () => {
  const spec = { columns: ["tens", "ones"], counts: { ones: 5 } };
  const helper = h("place-value-counter-chart");
  assert.equal(
    helper.measure(spec, A_HALF_COLUMN_MM),
    helper.measure(spec, FULL_WIDTH_MM)
  );
});

// ─── place-value-chart ───────────────────────────────────────────────────

test("a place-value chart draws one chart per instance, all of them empty", () => {
  const html = h("place-value-chart").render({
    columns: ["Ones", ".", "Tenths", "Hundredths"],
    instances: 3,
  });
  assert.equal(occurrences(html, 'class="h-pvchart-one"'), 3);
  assert.equal(occurrences(html, "h-pvchart-write"), 12, "4 columns x 3 charts");
  // Nothing is written in for the child. A worksheet never shows an answer.
  assert.deepEqual(cellTexts(html, "h-pvchart-write"), Array(12).fill(""));
});

test("a place-value chart prints the column names it was given", () => {
  const html = h("place-value-chart").render({ columns: ["Tens", "Ones"] });
  assert.deepEqual(cellTexts(html, "h-pvchart-head-cell"), ["Tens", "Ones"]);
});

test("three charts on a row need three charts' worth of width", () => {
  const helper = h("place-value-chart");
  const one = helper.needs({ columns: ["Tens", "Ones"], instances: 1 });
  const three = helper.needs({ columns: ["Tens", "Ones"], instances: 3 });
  assert.ok(three.minWidthMm > one.minWidthMm * 2.5);
});

test("a heading that wraps is counted, not ignored", () => {
  // "Hundredths" is two lines in a narrow column and one in a wide one. Miss
  // that and the chart measures a whole line short, and the row the child
  // writes in is what gets sliced off.
  const spec = { columns: ["Ones", ".", "Tenths", "Hundredths"] };
  const helper = h("place-value-chart");
  assert.ok(
    helper.measure(spec, 60) > helper.measure(spec, FULL_WIDTH_MM),
    "a chart squeezed into 60mm is measured no taller than one given the full width"
  );
});

test("a chart can hand the child a number to work from", () => {
  const html = h("place-value-chart").render({
    columns: ["Th", "H", "T", "O"],
    rows: [{ cells: ["3", "4", "6", "2"] }],
  });
  assert.deepEqual(cellTexts(html, "h-pvchart-given"), ["3", "4", "6", "2"]);
  assert.equal(occurrences(html, "h-pvchart-write"), 0);
});

test("a row with any cell left empty is still a row the child writes in", () => {
  // The lesson's own shape: here is the number, now write ten more. The second
  // row must keep the tall write height, not shrink to a printed row.
  const html = h("place-value-chart").render({
    columns: ["Th", "H", "T", "O"],
    rows: [{ cells: ["3", "4", "6", "2"] }, { cells: [] }],
  });
  assert.equal(occurrences(html, "h-pvchart-write"), 4);
});

test("a highlighted cell is picked out, and only that cell", () => {
  // The whole point of a 10-more lesson is WHICH column changed, so the mark
  // has to land on one digit and leave the rest of the row alone.
  const html = h("place-value-chart").render({
    columns: ["Th", "H", "T", "O"],
    rows: [{ label: "10 more", cells: ["3", "4", "7", "2"], highlight: ["T"] }],
  });
  assert.equal(occurrences(html, "h-pvchart-picked"), 1);
  assert.deepEqual(cellTexts(html, "h-pvchart-picked"), ["7"]);
});

test("a highlight can name its column or its position, and a wrong name marks nothing", () => {
  const chart = h("place-value-chart");
  const byName = chart.render({
    columns: ["Th", "H", "T", "O"],
    rows: [{ cells: ["3", "4", "7", "2"], highlight: "T" }],
  });
  const byIndex = chart.render({
    columns: ["Th", "H", "T", "O"],
    rows: [{ cells: ["3", "4", "7", "2"], highlight: [2] }],
  });
  assert.deepEqual(cellTexts(byName, "h-pvchart-picked"), ["7"]);
  assert.deepEqual(cellTexts(byIndex, "h-pvchart-picked"), ["7"]);
  // A column this chart does not have is a designer's slip, and marking the
  // wrong digit would teach the wrong thing. Nothing is marked instead.
  const wrong = chart.render({
    columns: ["Th", "H", "T", "O"],
    rows: [{ cells: ["3", "4", "7", "2"], highlight: ["Tenths"] }],
  });
  assert.equal(occurrences(wrong, "h-pvchart-picked"), 0);
});

test("a row label names the row and takes a column of its own", () => {
  const html = h("place-value-chart").render({
    columns: ["Th", "H", "T", "O"],
    rows: [
      { label: "3,462", cells: ["3", "4", "6", "2"] },
      { label: "10 more", cells: [] },
    ],
  });
  // Three label cells: the blank one over the captions, then one per row.
  assert.deepEqual(cellTexts(html, "h-pvchart-label-cell"), ["", "3,462", "10 more"]);
});

test("labelling the rows makes the chart wider, and the measurement knows", () => {
  const chart = h("place-value-chart");
  const plain = { columns: ["Th", "H", "T", "O"], rows: [{ cells: ["3", "4", "6", "2"] }] };
  const labelled = {
    columns: ["Th", "H", "T", "O"],
    rows: [{ label: "3,462", cells: ["3", "4", "6", "2"] }],
  };
  assert.ok(chart.needs(labelled).minWidthMm > chart.needs(plain).minWidthMm);
});

test("every extra row is measured, or the last one prints off the bottom", () => {
  const chart = h("place-value-chart");
  const spec = (n) => ({
    columns: ["Th", "H", "T", "O"],
    rows: Array.from({ length: n }, (_, i) => ({ label: `row ${i}`, cells: [] })),
  });
  const one = chart.measure(spec(1), FULL_WIDTH_MM);
  const three = chart.measure(spec(3), FULL_WIDTH_MM);
  assert.ok(three > one * 2, `three rows measured ${three}mm against one row's ${one}mm`);
});

test("a chart given no rows is the empty chart it has always been", () => {
  // The guarantee every existing sheet rests on: nothing about the new fields
  // changes a spec that does not use them.
  const html = h("place-value-chart").render({
    columns: ["Ones", ".", "Tenths"],
    instances: 2,
  });
  assert.equal(occurrences(html, "h-pvchart-label-cell"), 0);
  assert.equal(occurrences(html, "h-pvchart-given"), 0);
  assert.equal(occurrences(html, "h-pvchart-write"), 6, "3 columns x 2 charts");
});

test("every row of one chart draws from the same set of column tracks", () => {
  // Photographed by Daniel on the Below sheet: the reference chart at the top
  // of the page was visibly crooked. "10 more" sat in a caption column wider
  // than the one "34" sat in a row above it, and the Tens column under the
  // heading started somewhere else again.
  //
  // The cause was that each row sized its own cells. Weights on flex items
  // look like they divide a row into fixed proportions and do not: a flex item
  // cannot be narrower than its own padding and border, so that part is taken
  // out first and only the remainder is shared. A header cell is padded and a
  // digit cell is not, and a highlighted cell carries the heavy rule - so the
  // same weights landed in a different place on every row.
  //
  // The rule, and it is a rule about the CHART rather than about any row: one
  // set of column tracks, declared once, that every row draws on. Then no
  // cell's own padding, border or content can knock its row out of line.
  const chart = h("place-value-chart");
  const html = chart.render({
    columns: ["Tens", "Ones"],
    rows: [
      { label: "34", cells: ["3", "4"] },
      { label: "10 more", cells: ["4", "4"], highlight: ["Tens"] },
    ],
  });

  const templates = [...html.matchAll(/grid-template-columns:([^"]+)"/g)].map((m) =>
    m[1].trim()
  );
  assert.equal(templates.length, 1, "the chart declares its tracks once, for the whole chart");
  assert.equal(
    templates[0],
    "minmax(0, 1.8fr) minmax(0, 1fr) minmax(0, 1fr)",
    "the caption column and the two digit columns, at the weights the measurement prices them at"
  );

  // minmax(0, ...) and not a bare fr: a bare fr track refuses to shrink below
  // its own content, so a long caption would widen the label column and drag
  // the digit columns along with it - the same crookedness by another route.
  assert.ok(
    !/:\s*[\d.]+fr/.test(templates[0]),
    "a track without a zero floor grows to fit its content"
  );

  // Nothing on a cell may size it. This is the line that was crossed before.
  assert.ok(
    !/class="h-pvchart-cell[^"]*"[^>]*style="[^"]*(?:flex|width)/.test(html),
    "a cell is sizing itself, so its row can differ from the row above it"
  );

  // And the row draws no box of its own, or its cells would sit on the row's
  // tracks instead of the chart's.
  assert.match(css, /\.h-pvchart-row\s*{[^}]*display:\s*contents/);
});

test("a chart with a decimal point still prices it as a narrower column", () => {
  // The point column has always been worth less than a digit column. Moving the
  // weights from the cells to the chart's tracks is exactly the sort of change
  // that quietly drops one of them.
  const html = h("place-value-chart").render({
    columns: ["Ones", ".", "Tenths"],
  });
  const template = /grid-template-columns:([^"]+)"/.exec(html)[1].trim();
  assert.equal(template, "minmax(0, 1fr) minmax(0, 0.6fr) minmax(0, 1fr)");
});

// ─── digit-cards ─────────────────────────────────────────────────────────

test("digit cards draw one card per digit, zero included", () => {
  // 0 is a digit a child is regularly handed, and it is exactly the value a
  // falsy check drops without saying anything.
  const html = h("digit-cards").render({ digits: [0, 3, 4, 7] });
  assert.deepEqual(cellTexts(html, "h-digitcard"), ["0", "3", "4", "7"]);
});

test("a longer set of digit cards needs a longer row", () => {
  const helper = h("digit-cards");
  assert.ok(
    helper.needs({ digits: [1, 2, 3, 4, 5, 6] }).minWidthMm >
      helper.needs({ digits: [1, 2, 3] }).minWidthMm
  );
});

// ─── times-table-grid ────────────────────────────────────────────────────

test("a times-table grid draws a row per row header and a column per column header", () => {
  const spec = {
    colHeaders: ["9", "6", ""],
    rowHeaders: ["3", "8", "6"],
    cells: [
      ["", "18", "21"],
      ["72", "", "56"],
      ["54", "36", "42"],
    ],
  };
  const html = h("times-table-grid").render(spec);
  assert.equal(occurrences(html, 'class="h-ttgrid-row"'), 4, "3 rows plus the headings");
  assert.equal(occurrences(html, "h-ttgrid-product"), 9, "3 x 3 products");
  assert.equal(occurrences(html, "h-ttgrid-corner"), 1);
});

test("a times-table grid prints its given values and leaves its blanks blank", () => {
  const html = h("times-table-grid").render({
    colHeaders: ["9", ""],
    rowHeaders: ["3"],
    cells: [["27", "24"]],
  });
  assert.deepEqual(cellTexts(html, "h-ttgrid-head"), ["9", "", "3"]);
  assert.deepEqual(cellTexts(html, "h-ttgrid-product"), ["27", "24"]);
});

test("a missing row of products is still drawn as empty boxes", () => {
  // A grid built for the child to fill in completely gives no `cells` at all,
  // and it must still print a box per product rather than a collapsed row.
  const html = h("times-table-grid").render({
    colHeaders: ["4", "5"],
    rowHeaders: ["6", "7"],
  });
  assert.deepEqual(cellTexts(html, "h-ttgrid-product"), ["", "", "", ""]);
});

test("the times-table spec is read in camelCase", () => {
  // The Word builder writes col_headers; this engine writes colHeaders, and
  // an author who mixes them should not get silence.
  const html = h("times-table-grid").render({
    colHeaders: ["11"],
    rowHeaders: ["12"],
    cells: [["132"]],
  });
  assert.ok(html.includes("11") && html.includes("12") && html.includes("132"));
});

test("a 12 x 12 grid needs far more width than a 3 x 3", () => {
  const helper = h("times-table-grid");
  const twelve = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const small = helper.needs({ colHeaders: ["2", "3", "4"], rowHeaders: ["5", "6", "7"] });
  const big = helper.needs({ colHeaders: twelve, rowHeaders: twelve });
  assert.ok(big.minWidthMm > small.minWidthMm * 3);
  assert.ok(big.minHeightMm > small.minHeightMm * 3);
});

test("a times-table cell stays big enough to write a product in", () => {
  const helper = h("times-table-grid");
  const spec = { colHeaders: ["9", "6", "7"], rowHeaders: ["3", "8"] };
  const cols = 4;
  assert.ok(
    helper.needs(spec).minWidthMm / cols >= 12,
    "the stated minimum leaves cells too small for a nine-year-old's handwriting"
  );
});

test("a times-table grid does not swell to fill a wide page", () => {
  // The matchbox trap in reverse: cells that scale with whatever width they
  // are handed give a three-column grid 60mm boxes on a full-width row.
  const spec = { colHeaders: ["9", "6"], rowHeaders: ["3", "8"] };
  const helper = h("times-table-grid");
  assert.equal(helper.measure(spec, FULL_WIDTH_MM), helper.measure(spec, 267));
});

// ─── number-pyramid ──────────────────────────────────────────────────────

test("a pyramid draws a row per row, with the right number of bricks in each", () => {
  const html = h("number-pyramid").render({
    rows: [[""], ["14", "20"], ["", "8", "12"]],
  });
  assert.equal(occurrences(html, 'class="h-pyramid-row"'), 3);
  assert.equal(occurrences(html, "h-pyramid-brick"), 6, "1 + 2 + 3 bricks");
});

test("a pyramid prints the bricks it gives and leaves the rest empty", () => {
  // The empty brick IS the question, and a pyramid that filled it in would be
  // handing the child the answer.
  const html = h("number-pyramid").render({
    rows: [[""], ["14", "20"], ["", "8", "12"]],
  });
  assert.deepEqual(cellTexts(html, "h-pyramid-brick"), ["", "14", "20", "", "8", "12"]);
});

test("a pyramid grows in both directions with its own shape", () => {
  const helper = h("number-pyramid");
  const three = helper.needs({ rows: [[""], ["4", "5"], ["1", "3", "2"]] });
  const six = helper.needs({
    rows: [[""], ["", ""], ["", "", ""], ["", "", "", ""], ["", "", "", "", ""], ["", "", "", "", "", ""]],
  });
  assert.ok(six.minWidthMm > three.minWidthMm, "a six-brick base asks no more width");
  assert.ok(six.minHeightMm > three.minHeightMm, "a six-course pyramid asks no more height");
});

test("a taller pyramid measures taller at the same width", () => {
  const helper = h("number-pyramid");
  const short = { rows: [["19"], ["", "8"]] };
  const tall = { rows: [["19"], ["", "8"], ["4", "", "5"]] };
  assert.ok(
    helper.measure(tall, A_HALF_COLUMN_MM) > helper.measure(short, A_HALF_COLUMN_MM)
  );
});

test("a pyramid's bricks stop growing before they become slabs", () => {
  const spec = { rows: [["19"], ["", "8"]] };
  const helper = h("number-pyramid");
  assert.equal(helper.measure(spec, FULL_WIDTH_MM), helper.measure(spec, 267));
});
