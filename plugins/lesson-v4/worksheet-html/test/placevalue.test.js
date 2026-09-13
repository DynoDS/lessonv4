"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

// The place value family on the sheet. Since 13 September 2026 every picture
// here is a shared drawing (shared/visuals/) that the board, the wall and the
// stick-in pack place too, so these tests read the drawing's own layout at the
// sheet's printed width. The properties the sheet's CSS helpers held are held
// here: counts, blanks, highlights, labels, instances, floors and ceilings.

const { helpers, css } = require("../src/helpers/placevalue");
const { profileFor } = require("../../shared/visuals/surface-profiles");
const pvChart = require("../../shared/visuals/place-value-chart-svg");
const multGrid = require("../../shared/visuals/mult-grid-svg");
const pyramid = require("../../shared/visuals/pyramid-svg");
const blocks = require("../../shared/visuals/base-ten-blocks-svg");

const A_HALF_COLUMN_MM = 87;
const FULL_WIDTH_MM = 180;

function h(name) {
  const found = helpers[name];
  assert.ok(found, `no helper called "${name}"`);
  return found;
}

const sheet = (mm = FULL_WIDTH_MM) => profileFor("worksheets", { widthMm: mm });
const chartLayout = (spec, mm) => pvChart.describeLayout(spec, sheet(mm));
const texts = (layout, role) => layout.texts.filter((t) => t.role === role).map((t) => t.text);

// ─── the contract ────────────────────────────────────────────────────────

test("every place value helper signs the whole contract", () => {
  const expected = [
    "base-ten-blocks",
    "place-value-counter-chart",
    "counter-group",
    "place-value-chart",
    "place-value-mini",
    "digit-cards",
    "times-table-grid",
    "number-pyramid",
  ];
  assert.deepEqual(Object.keys(helpers).sort(), expected.slice().sort());
  for (const [name, helper] of Object.entries(helpers)) {
    assert.equal(typeof helper.render, "function", `${name} has no render`);
    assert.equal(typeof helper.measure, "function", `${name} has no measure`);
    assert.equal(typeof helper.needs, "function", `${name} has no needs`);
    assert.ok(Number.isFinite(helper.greed) && helper.greed >= 0 && helper.greed <= 5, `${name} has greed ${helper.greed}`);
  }
});

test("every picture here is placed from its one shared drawing", () => {
  for (const name of ["base-ten-blocks", "place-value-counter-chart", "counter-group", "place-value-chart", "place-value-mini", "times-table-grid", "number-pyramid"]) {
    assert.equal(helpers[name].physical, true, `${name} is not laid out at printed size`);
    assert.ok(helpers[name].geometry && typeof helpers[name].geometry.tightSvg === "function", `${name} draws its own picture`);
  }
});

test("every line-height is the 1.35 the height estimates assume", () => {
  const declared = css.match(/line-height:\s*([\d.]+)/g) || [];
  assert.ok(declared.length > 0, "no line-height is pinned anywhere");
  for (const rule of declared) assert.equal(Number(rule.split(":")[1]), 1.35, `"${rule.trim()}" is not 1.35`);
});

test("a stated minimum height is one the helper can actually be drawn in", () => {
  // If a helper measures TALLER at its own minimum width than the minimum
  // height it claims, the zone that accepted it clips it.
  const specs = {
    "base-ten-blocks": { counts: { thousands: 1, hundreds: 2, tens: 3, ones: 4 } },
    "place-value-counter-chart": { columns: ["hundreds", "tens", "ones"], counts: { hundreds: 2, tens: 7, ones: 9 } },
    "place-value-chart": { columns: ["Ones", ".", "Tenths", "Hundredths"], instances: 3 },
    "digit-cards": { digits: [0, 3, 4, 7] },
    "times-table-grid": { colHeaders: ["9", "6", ""], rowHeaders: ["3", "8", "6"], cells: [] },
    "number-pyramid": { rows: [[""], ["14", "20"], ["", "8", "12"]] },
  };
  for (const [name, spec] of Object.entries(specs)) {
    const need = h(name).needs(spec);
    const tall = h(name).measure(spec, need.minWidthMm);
    assert.ok(tall <= need.minHeightMm + 0.001, `"${name}" wants ${tall.toFixed(1)}mm but claims ${need.minHeightMm.toFixed(1)}mm is enough`);
  }
});

// ─── place-value-counter-chart ───────────────────────────────────────────

test("a counter chart draws exactly the counters it was asked for", () => {
  const layout = chartLayout({ columns: ["ones", ".", "tenths", "hundredths"], counts: { ones: 3, tenths: 1, hundredths: 4 } });
  assert.equal(layout.circles.length, 8);
});

test("a counter shows its place's value, not the number of counters", () => {
  // The child reads 3 + 0.1 off the discs; a disc printing "3" would be showing
  // the answer to a different question.
  const layout = chartLayout({ columns: ["ones", ".", "tenths"], counts: { ones: 3, tenths: 1 } });
  assert.deepEqual(layout.circles.map((c) => c.face), ["1", "1", "1", "0.1"]);
});

test("a column with no counters is drawn empty, and keeps its heading", () => {
  const layout = chartLayout({ columns: ["tens", "ones"], counts: { tens: 2 } });
  assert.equal(layout.circles.length, 2);
  assert.ok(texts(layout, "heading").includes("Ones"), "the empty column still has its heading");
});

test("a counter chart asks no question in digits: there is no digit row", () => {
  const layout = chartLayout({ columns: ["tens", "ones"], counts: { tens: 2, ones: 3 } });
  assert.equal(layout.cells.filter((c) => c.role === "digit" || c.role === "write").length, 0);
});

test("a chart with nothing in it is left tall enough to draw counters in", () => {
  // "Draw counters to show 3.14" is the other half of this helper's job: a
  // blank chart keeps room for the nine counters a column can need.
  const helper = h("place-value-counter-chart");
  const blank = { columns: ["ones", ".", "tenths"] };
  const shown = { columns: ["ones", ".", "tenths"], counts: { ones: 3, tenths: 1 } };
  assert.ok(helper.measure(blank, FULL_WIDTH_MM) > helper.measure(shown, FULL_WIDTH_MM), "a blank chart is no taller than one already filled in");
});

test("a counter chart's minimum grows with columns, and its height with counters", () => {
  const helper = h("place-value-counter-chart");
  const narrow = helper.needs({ columns: ["tens", "ones"], counts: { ones: 4 } });
  const wide = helper.needs({ columns: ["thousands", "hundreds", "tens", "ones"], counts: { ones: 4 } });
  assert.ok(wide.minWidthMm > narrow.minWidthMm, "four columns ask no more room than two");
  const few = helper.needs({ columns: ["ones"], counts: { ones: 2 } });
  const many = helper.needs({ columns: ["ones"], counts: { ones: 12 } });
  assert.ok(many.minHeightMm > few.minHeightMm, "twelve counters stack no taller than two");
});

test("counters sit in rows of the house arrangement, inside their own column", () => {
  // Ten is two rows of five, nine is three rows of three: the same shapes in the
  // same places on every surface. And no counter may drift over a column rule.
  const layout = chartLayout({ columns: ["tens", "ones"], counts: { tens: 9, ones: 10 } });
  for (const column of ["T", "O"]) {
    const discs = layout.circles.filter((c) => c.column === column);
    const band = layout.cells.find((c) => c.role === "band" && c.column === column);
    const rows = new Set(discs.map((c) => Math.round(c.cy)));
    assert.equal(rows.size, column === "T" ? 3 : 2, `${column}: ${rows.size} rows`);
    for (const c of discs) {
      assert.ok(c.cx - c.r >= band.x - 0.01 && c.cx + c.r <= band.x + band.w + 0.01, "a counter crossed its column rule");
      assert.ok(c.cy - c.r >= band.y - 0.01 && c.cy + c.r <= band.y + band.h + 0.01, "a counter left its band");
    }
  }
});

test("counters never grow with the zone: the chart is a fixed object", () => {
  const spec = { columns: ["tens", "ones"], counts: { ones: 5 } };
  const helper = h("place-value-counter-chart");
  assert.equal(helper.measure(spec, A_HALF_COLUMN_MM), helper.measure(spec, FULL_WIDTH_MM));
});

test("a counter's value is readable: never under the sheet's 9pt", () => {
  const layout = chartLayout({ columns: ["ones", ".", "tenths", "hundredths"], counts: { ones: 9, tenths: 9, hundredths: 9 } }, 170);
  for (const c of layout.circles) assert.ok(c.pt >= 9, `"${c.face}" printed at ${c.pt.toFixed(1)}pt`);
});

// ─── place-value-chart ───────────────────────────────────────────────────

test("a place-value chart draws one chart per instance, all of them empty", () => {
  const layout = chartLayout({ columns: ["Ones", ".", "Tenths", "Hundredths"], instances: 3 });
  assert.equal(layout.cells.filter((c) => c.role === "header").length, 12, "4 headings x 3 charts");
  assert.equal(layout.cells.filter((c) => c.role === "write").length, 12, "4 columns x 3 charts");
  // Nothing is written in for the child. A worksheet never shows an answer.
  assert.equal(texts(layout, "digit").length, 0);
});

test("a place-value chart prints the column names it was given", () => {
  assert.deepEqual(texts(chartLayout({ columns: ["Tens", "Ones"] }), "heading"), ["Tens", "Ones"]);
});

test("three charts on a row need three charts' worth of width", () => {
  const helper = h("place-value-chart");
  const one = helper.needs({ columns: ["Tens", "Ones"], instances: 1 });
  const three = helper.needs({ columns: ["Tens", "Ones"], instances: 3 });
  assert.ok(three.minWidthMm > one.minWidthMm * 2.5);
});

test("a heading too long for its column prints its short name, never half a word", () => {
  // "Hundredths" is one unbreakable word. In a narrow column the chart prints
  // h, and every heading changes together; in a wide one it prints the word.
  const spec = { columns: ["Ones", ".", "Tenths", "Hundredths"] };
  const narrow = chartLayout(spec, 60);
  for (const t of narrow.texts.filter((x) => x.role === "heading")) {
    const { textWidthEm } = require("../../shared/text/comic-glyph-width");
    assert.ok(textWidthEm(t.text, true) * t.pt <= narrow.colW, `"${t.text}" is wider than its column`);
  }
  assert.deepEqual(texts(chartLayout(spec, FULL_WIDTH_MM), "heading"), ["Ones", "Tenths", "Hundredths"]);
});

test("widening a usable place-value chart does not make it fail its height floor", () => {
  const { fits } = require("../src/helpers");
  for (const content of [
    { helper: "place-value-chart", columns: ["Thousands", "Hundreds", "Tens", "Ones"] },
    { helper: "place-value-chart", columns: ["Ones", ".", "Tenths", "Hundredths"], rows: [{ label: "one hundredth less", cells: [] }, { cells: [] }] },
  ]) {
    const helper = h(content.helper);
    const floor = helper.needs(content);
    for (const width of [floor.minWidthMm, 91, FULL_WIDTH_MM].filter((w) => w >= floor.minWidthMm)) {
      const natural = helper.measure(content, width);
      assert.equal(fits(content, width, natural).ok, true, `chart refused at ${width}mm`);
    }
    assert.equal(fits(content, floor.minWidthMm - 1, 200).ok, false, "narrow charts remain refused");
  }
});

test("the chart's actual width reaches it through numbered stacks and rows", () => {
  const { fits, measureContent } = require("../src/helpers");
  const chart = { helper: "place-value-chart", columns: ["Thousands", "Hundreds", "Tens", "Ones"] };
  for (const content of [{ number: 1, stack: [chart] }, { row: [chart, chart] }]) {
    assert.equal(fits(content, FULL_WIDTH_MM, measureContent(content, FULL_WIDTH_MM)).ok, true);
  }
});

test("a chart can hand the child a number to work from", () => {
  const layout = chartLayout({ columns: ["Th", "H", "T", "O"], rows: [{ cells: ["3", "4", "6", "2"] }] });
  assert.deepEqual(texts(layout, "digit"), ["3", "4", "6", "2"]);
  assert.equal(layout.cells.filter((c) => c.role === "write").length, 0);
});

test("a row with any cell left empty is a row the child writes in, at a handwriting height", () => {
  const layout = chartLayout({ columns: ["Th", "H", "T", "O"], rows: [{ cells: ["3", "4", "6", "2"] }, { cells: [] }] });
  const write = layout.cells.filter((c) => c.role === "write");
  const given = layout.cells.filter((c) => c.role === "digit");
  assert.equal(write.length, 4);
  assert.ok(write[0].h >= (16 * 72) / 25.4 - 0.01, "a write row is shorter than the 16mm a child writes a digit in");
  assert.ok(write[0].h > given[0].h, "the write row shrank to a printed row");
  assert.ok(layout.colW >= (14 * 72) / 25.4 - 0.01, "a write-in column is narrower than one handwritten digit");
});

test("a highlighted cell is picked out, and only that cell", () => {
  const layout = chartLayout({ columns: ["Th", "H", "T", "O"], rows: [{ label: "10 more", cells: ["3", "4", "7", "2"], highlight: ["T"] }] });
  assert.equal(layout.rings.length, 1);
  assert.deepEqual(layout.texts.filter((t) => t.picked).map((t) => t.text), ["7"]);
  // The ring sits inside its own cell, so two neighbouring rings stay two.
  const cell = layout.cells.find((c) => c.role === "digit" && c.column === "T");
  const ring = layout.rings[0];
  assert.ok(ring.x > cell.x && ring.x + ring.w < cell.x + cell.w, "the ring spills out of its cell");
});

test("a highlight can name its column or its position, and a wrong name marks nothing", () => {
  const picked = (highlight) =>
    chartLayout({ columns: ["Th", "H", "T", "O"], rows: [{ cells: ["3", "4", "7", "2"], highlight }] }).texts.filter((t) => t.picked).map((t) => t.text);
  assert.deepEqual(picked("T"), ["7"]);
  assert.deepEqual(picked([2]), ["7"]);
  assert.deepEqual(picked(["Tens"]), ["7"]);
  // A column this chart does not have is a designer's slip, and marking the
  // wrong digit would teach the wrong thing. Nothing is marked instead.
  assert.deepEqual(picked(["Tenths"]), []);
});

test("a row label names the row and takes a column of its own", () => {
  const layout = chartLayout({ columns: ["Th", "H", "T", "O"], rows: [{ label: "3,462", cells: ["3", "4", "6", "2"] }, { label: "10 more", cells: [] }] });
  assert.deepEqual(texts(layout, "label"), ["3,462", "10 more"]);
  // The cell above the captions stays blank: the labels name rows, not a column.
  assert.equal(layout.cells.filter((c) => c.role === "label-head").length, 1);
});

test("labelling the rows makes the chart wider, and the measurement knows", () => {
  const chart = h("place-value-chart");
  const plain = { columns: ["Th", "H", "T", "O"], rows: [{ cells: ["3", "4", "6", "2"] }] };
  const labelled = { columns: ["Th", "H", "T", "O"], rows: [{ label: "3,462", cells: ["3", "4", "6", "2"] }] };
  assert.ok(chart.needs(labelled).minWidthMm > chart.needs(plain).minWidthMm);
});

test("every extra row is measured, or the last one prints off the bottom", () => {
  const chart = h("place-value-chart");
  const spec = (n) => ({ columns: ["Th", "H", "T", "O"], rows: Array.from({ length: n }, (_, i) => ({ label: `row ${i}`, cells: [] })) });
  const one = chart.measure(spec(1), FULL_WIDTH_MM);
  const three = chart.measure(spec(3), FULL_WIDTH_MM);
  assert.ok(three > one * 2, `three rows measured ${three}mm against one row's ${one}mm`);
});

test("a chart given no rows is the empty chart it has always been", () => {
  const layout = chartLayout({ columns: ["Ones", ".", "Tenths"], instances: 2 });
  assert.equal(texts(layout, "label").length, 0);
  assert.equal(texts(layout, "digit").length, 0, "the decimal point belongs to a number, so an empty row prints none");
  assert.equal(layout.cells.filter((c) => c.role === "write").length, 6, "3 columns x 2 charts");
});

test("every row of one chart draws from the same set of column tracks", () => {
  // Photographed by Daniel on the Below sheet: the reference chart at the top of
  // the page was visibly crooked, because each row sized its own cells. One set
  // of column positions, used by every row, is a rule about the CHART.
  const layout = chartLayout({ columns: ["Tens", "Ones"], rows: [{ label: "34", cells: ["3", "4"] }, { label: "10 more", cells: ["4", "4"], highlight: ["Tens"] }] });
  const edges = (role) => layout.cells.filter((c) => c.role === role).map((c) => [c.x.toFixed(2), c.w.toFixed(2)].join("/"));
  const header = edges("header");
  const rows = layout.cells.filter((c) => c.role === "digit");
  assert.deepEqual(rows.slice(0, 2).map((c) => [c.x.toFixed(2), c.w.toFixed(2)].join("/")), header);
  assert.deepEqual(rows.slice(2, 4).map((c) => [c.x.toFixed(2), c.w.toFixed(2)].join("/")), header);
});

test("a chart with a decimal point still prices it as a narrower column", () => {
  const layout = chartLayout({ columns: ["Ones", ".", "Tenths"] });
  const widths = layout.cells.filter((c) => c.role === "header").map((c) => c.w);
  assert.ok(widths[1] < widths[0] * 0.5, "the point column is as wide as a digit column");
  assert.equal(widths[0].toFixed(2), widths[2].toFixed(2));
});

test("a sheet chart is the board's chart: the column colours, and a green ring", () => {
  const layout = chartLayout({ columns: ["Th", "H", "T", "O"], rows: [{ cells: ["3", "4", "7", "2"], highlight: ["T"] }] });
  const fills = layout.cells.filter((c) => c.role === "header").map((c) => c.fill);
  assert.deepEqual(fills, ["#8AB8E8", "#8AC88A", "#E8D84A", "#E89090"]);
  assert.ok(pvChart.tightSvg({ columns: ["Th", "H", "T", "O"], rows: [{ cells: ["3", "4", "7", "2"], highlight: ["T"] }] }, sheet()).svg.includes('stroke="#00B050"'));
});

// ─── digit-cards ─────────────────────────────────────────────────────────

test("digit cards draw one card per digit, zero included", () => {
  const html = h("digit-cards").render({ digits: [0, 3, 4, 7] });
  assert.deepEqual([...html.matchAll(/class="h-digitcard">([^<]*)</g)].map((m) => m[1]), ["0", "3", "4", "7"]);
});

test("a longer set of digit cards needs a longer row", () => {
  const helper = h("digit-cards");
  assert.ok(helper.needs({ digits: [1, 2, 3, 4, 5, 6] }).minWidthMm > helper.needs({ digits: [1, 2, 3] }).minWidthMm);
});

// ─── times-table-grid ────────────────────────────────────────────────────

const gridLayout = (spec, mm) => multGrid.describeLayout(spec, sheet(mm));

test("a times-table grid draws a row per row header and a column per column header", () => {
  const layout = gridLayout({ colHeaders: ["9", "6", ""], rowHeaders: ["3", "8", "6"], cells: [["", "18", "21"], ["72", "", "56"], ["54", "36", "42"]] });
  assert.equal(layout.rows, 4, "3 rows plus the headings");
  assert.equal(layout.cols, 4, "3 columns plus the headings");
  assert.equal(layout.grid.flat().filter((c) => !c.header).length, 9, "3 x 3 products");
  assert.equal(layout.grid[0][0].text, "×");
});

test("a times-table grid prints its given values and leaves its blanks blank", () => {
  const layout = gridLayout({ operator: "×", colHeaders: ["9", ""], rowHeaders: ["3"], cells: [["27", "24"]] });
  assert.deepEqual(layout.grid[0].slice(1).map((c) => c.text), ["9", ""]);
  assert.deepEqual(layout.grid[1].map((c) => c.text), ["3", "27", "24"]);
});

test("a missing row of products is still drawn as empty boxes", () => {
  const layout = gridLayout({ colHeaders: ["4", "5"], rowHeaders: ["6", "7"] });
  assert.deepEqual(layout.grid.slice(1).map((r) => r.slice(1).map((c) => c.text)), [["", ""], ["", ""]]);
});

test("an answer marked || is revealed in green, and the marker never prints", () => {
  const { svg } = multGrid.tightSvg({ colHeaders: ["9"], rowHeaders: ["3"], cells: [["||27"]] }, sheet());
  assert.match(svg, /fill="#00B050">27</);
  assert.doesNotMatch(svg, /\|\|/);
});

test("a 12 x 12 grid needs far more width than a 3 x 3", () => {
  const helper = h("times-table-grid");
  const twelve = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const small = helper.needs({ colHeaders: ["2", "3", "4"], rowHeaders: ["5", "6", "7"] });
  const big = helper.needs({ colHeaders: twelve, rowHeaders: twelve });
  assert.ok(big.minWidthMm > small.minWidthMm * 3);
  assert.ok(big.minHeightMm > small.minHeightMm * 2.5);
});

test("a times-table cell stays big enough to write a product in", () => {
  const helper = h("times-table-grid");
  const spec = { colHeaders: ["9", "6", "7"], rowHeaders: ["3", "8"] };
  assert.ok(helper.needs(spec).minWidthMm / 4 >= 12, "the stated minimum leaves cells too small for a nine-year-old's handwriting");
  assert.ok(gridLayout(spec, 180).cell >= (12 * 72) / 25.4 - 0.01);
});

test("a times-table grid does not swell to fill a wide page", () => {
  const spec = { colHeaders: ["9", "6"], rowHeaders: ["3", "8"] };
  const helper = h("times-table-grid");
  assert.equal(helper.measure(spec, FULL_WIDTH_MM), helper.measure(spec, 267));
});

// ─── number-pyramid ──────────────────────────────────────────────────────

const pyramidBricks = (spec, mm) => pyramid.tightSvg(spec, sheet(mm)).layout.bricks;

test("a pyramid draws a row per row, with the right number of bricks in each", () => {
  const bricks = pyramidBricks({ rows: [[""], ["14", "20"], ["", "8", "12"]] });
  assert.equal(new Set(bricks.map((b) => b.row)).size, 3);
  assert.equal(bricks.length, 6, "1 + 2 + 3 bricks");
});

test("a pyramid prints the bricks it gives and leaves the rest empty", () => {
  assert.deepEqual(pyramidBricks({ rows: [[""], ["14", "20"], ["", "8", "12"]] }).map((b) => b.text), ["", "14", "20", "", "8", "12"]);
});

test("an upper brick sits over the join of the two beneath it", () => {
  const bricks = pyramidBricks({ rows: [[""], ["14", "20"], ["", "8", "12"]] });
  const mid = (b) => b.x + b.w / 2;
  const [top, a, b] = bricks;
  assert.ok(Math.abs(mid(top) - (a.x + a.w + b.x) / 2) < 0.5, "the apex is not over the join of the course below");
});

test("a pyramid grows in both directions with its own shape", () => {
  const helper = h("number-pyramid");
  const three = helper.needs({ rows: [[""], ["4", "5"], ["1", "3", "2"]] });
  const six = helper.needs({ rows: [[""], ["", ""], ["", "", ""], ["", "", "", ""], ["", "", "", "", ""], ["", "", "", "", "", ""]] });
  assert.ok(six.minWidthMm > three.minWidthMm, "a six-brick base asks no more width");
  assert.ok(six.minHeightMm > three.minHeightMm, "a six-course pyramid asks no more height");
});

test("a taller pyramid measures taller at the same width", () => {
  const helper = h("number-pyramid");
  assert.ok(helper.measure({ rows: [["19"], ["", "8"], ["4", "", "5"]] }, A_HALF_COLUMN_MM) > helper.measure({ rows: [["19"], ["", "8"]] }, A_HALF_COLUMN_MM));
});

test("a pyramid's bricks stop growing before they become slabs", () => {
  const spec = { rows: [["19"], ["", "8"]] };
  const helper = h("number-pyramid");
  assert.equal(helper.measure(spec, FULL_WIDTH_MM), helper.measure(spec, 267));
  assert.ok(pyramidBricks(spec, 267)[0].w <= (22 * 72) / 25.4 + 0.01, "a brick is wider than 22mm");
});

// ─── base-ten-blocks ─────────────────────────────────────────────────────

test("base-ten blocks draw the blocks they are given, in four headed columns", () => {
  const { svg } = blocks.tightSvg({ counts: { thousands: 1, hundreds: 2, tens: 3, ones: 4 } }, sheet());
  assert.equal((svg.match(/<g /g) || []).length, 10);
  for (const label of ["Thousands", "Hundreds", "Tens", "Ones"]) assert.match(svg, new RegExp(`>${label}<`));
  assert.throws(() => blocks.tightSvg({ counts: { tens: 11 } }, sheet()), /whole number from 0 to 10/);
});
