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
