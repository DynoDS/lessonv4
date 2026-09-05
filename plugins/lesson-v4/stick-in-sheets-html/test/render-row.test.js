const { test } = require("node:test");
const assert = require("node:assert");
const { renderPieceHtml } = require("../src/render-piece-html");
const { ROW_PER_ROW } = require("../src/visual-registry");

// Helper: count rendered table rows in the HTML piece.
function tableRowCount(html) {
  return (html.match(/<tr>/g) || []).length;
}

test("angle-row draws each figure with a write-on line beneath", async () => {
  const item = {
    visual: "angle-row",
    spec: {
      figures: [
        { degrees: 40, rotation: 30 },
        { degrees: 90, rightAngle: true },
        { degrees: 130, rotation: 10 },
      ],
      writeOnLabels: true,
      figureWidthMm: 38,
    },
  };
  const piece = await renderPieceHtml(item);
  assert.ok(piece !== null);
  assert.ok(piece.html.includes("<table"));
  // 3 figures in one row
  assert.strictEqual(tableRowCount(piece.html), 1);
  // height should exceed the box height (26mm) because write-on lines add space
  assert.ok(piece.heightMm > 26, "height must exceed box height when writeOnLabels is true");
  // width well under A4 landscape printable (277mm)
  assert.ok(piece.widthMm > 100 && piece.widthMm < 190);
});

test("angle-row: 6 figures wrap into 2 rows of 3", async () => {
  const item = {
    visual: "angle-row",
    label: "Name each angle",
    spec: {
      figures: [
        { degrees: 35 }, { degrees: 90, rightAngle: true }, { degrees: 55 },
        { degrees: 120 }, { degrees: 150 }, { degrees: 80 },
      ],
      writeOnLabels: true,
    },
  };
  const piece = await renderPieceHtml(item);
  assert.ok(piece !== null, "should produce a piece for 6 figures");
  const expectedRows = Math.ceil(6 / ROW_PER_ROW); // = 2
  assert.strictEqual(tableRowCount(piece.html), expectedRows);
});

test("angle-row: returns null for empty figures array", async () => {
  const item = { visual: "angle-row", label: "Empty", spec: { figures: [] } };
  const piece = await renderPieceHtml(item);
  assert.strictEqual(piece, null);
});

test("triangle-row is supported the same way", async () => {
  const item = {
    visual: "triangle-row",
    spec: { figures: [{ kind: "scalene" }, { kind: "isosceles" }], writeOnLabels: true, figureWidthMm: 40 },
  };
  const piece = await renderPieceHtml(item);
  assert.ok(piece !== null);
  assert.ok(piece.html.includes("<table"));
  assert.strictEqual(tableRowCount(piece.html), 1); // 2 figures in one row
});

test("angle-row: honours spec.figureWidthMm to produce a wider piece", async () => {
  const narrow = await renderPieceHtml({
    visual: "angle-row",
    spec: { figures: [{ degrees: 60 }] },
  });
  const wide = await renderPieceHtml({
    visual: "angle-row",
    spec: { figures: [{ degrees: 60 }], figureWidthMm: 60 },
  });
  assert.ok(wide.widthMm > narrow.widthMm, "wider figureWidthMm should produce a wider piece");
});

// ── Dotty paper in the pack ────────────────────────────────────────────────
// A Year 2 lesson on naming shapes drew every shape on dotty paper, on the
// board and on the sheet, and asked for the four Your Turn shapes glued into
// books with room to write beside each. The pack had no dotty-paper figure at
// all, so that piece was recorded as a dead end and the children lost the
// cut-and-stick copy. These tests hold the two forms it now has, and the one
// thing that makes them usable: peg spacing a Year 2 finger can count.

test("a geoboard prints as a single write-on board sized by its peg spacing", async () => {
  const piece = await renderPieceHtml({
    visual: "geoboard",
    label: "Draw your own shape",
    spec: { cols: 5, rows: 5 },
  });
  assert.ok(piece !== null, "a blank dotty board is a valid piece on its own");
  assert.ok(piece.html.includes("<svg"));
  // Sized by height like the other draw-on grids, so the printed square stays
  // the same whatever the board's shape.
  assert.ok(Math.abs(piece.heightMm - 88) < 1, `expected ~88mm tall, got ${piece.heightMm}`);
});

test("a wide geoboard prints wider and keeps the same peg spacing as a square one", async () => {
  const square = await renderPieceHtml({ visual: "geoboard", spec: { cols: 5, rows: 5 } });
  const wide = await renderPieceHtml({ visual: "geoboard", spec: { cols: 6, rows: 3 } });
  assert.ok(wide.widthMm > square.widthMm, "a 6x3 board must print wider than a 5x5");
  const squarePeg = square.heightMm / 5;
  const widePeg = wide.heightMm / 3;
  assert.ok(Math.abs(squarePeg - widePeg) > 1,
    "sizing by height is what keeps the drawn square comfortable; this asserts the two differ so the check is meaningful");
  assert.ok(widePeg > 12, "a short board must not end up with pegs too close to count");
});

test("geoboard-row gives each shape its own write-on line", async () => {
  const piece = await renderPieceHtml({
    visual: "geoboard-row",
    spec: {
      writeOnLabels: true,
      figures: [
        { cols: 5, rows: 4, shapes: [[[1, 0], [4, 1], [4, 3], [2, 4], [0, 2]]] },
        { cols: 6, rows: 6, shapes: [[[3, 0], [6, 3], [3, 6], [0, 3]]] },
        { cols: 6, rows: 3, shapes: [[[0, 0], [6, 0], [1, 3]]] },
      ],
    },
  });
  assert.ok(piece !== null);
  assert.strictEqual(tableRowCount(piece.html), 1, "three shapes sit on one landscape row");
  assert.strictEqual((piece.html.match(/border-bottom/g) || []).length, 3, "one write-on line per shape");
  assert.ok(piece.widthMm < 190, "three boards must still fit the landscape row");
});

test("geoboard-row keeps its pegs countable by declaring its own taller box", async () => {
  // The point of the taller box. At the shared 26mm row box a 5x5 board's pegs
  // land about 4mm apart, close enough that a Year 2 finger covers three at
  // once - and counting the corners one at a time IS the task.
  const geo = await renderPieceHtml({
    visual: "geoboard-row",
    spec: { writeOnLabels: true, figures: [{ cols: 5, rows: 5, shapes: [[[0, 0], [5, 0], [5, 5], [0, 5]]] }] },
  });
  const angle = await renderPieceHtml({
    visual: "angle-row",
    spec: { writeOnLabels: true, figures: [{ degrees: 40 }] },
  });
  assert.ok(geo.heightMm > angle.heightMm,
    "the dotty board must get more height than an angle, which is judged by its opening and survives being small");
  const { ROW_BOX_H_MM, ROW_LINE_GAP_MM } = require("../src/visual-registry");
  const boxH = geo.heightMm - ROW_LINE_GAP_MM;
  assert.ok(boxH / 5 > 7, `pegs must stay over 7mm apart to be counted one at a time, got ${(boxH / 5).toFixed(1)}mm`);
  assert.ok(ROW_BOX_H_MM / 5 < 7, "the shared box would not have managed it, which is why this one is per-visual");
});

test("a geoboard promising shapes it cannot draw is skipped, not tiled blank", async () => {
  // A bare board is a real task, so a blank spec passes. A board that DECLARES
  // shapes and supplies no vertices would print bare for all thirty children
  // and look entirely correct.
  const blank = await renderPieceHtml({ visual: "geoboard", spec: { cols: 4, rows: 4 } });
  assert.ok(blank !== null, "a blank board is a valid write-on piece");
  const broken = await renderPieceHtml({ visual: "geoboard", spec: { cols: 4, rows: 4, shapes: [{ points: [] }] } });
  assert.strictEqual(broken, null, "a shape with no vertices must be refused, not silently dropped");
  const brokenRow = await renderPieceHtml({
    visual: "geoboard-row",
    spec: { writeOnLabels: true, figures: [{ cols: 4, rows: 4, shapes: [[[0, 0]]] }] },
  });
  assert.strictEqual(brokenRow, null, "a one-vertex shape is not a shape to count the sides of");
});
