const { test } = require("node:test");
const assert = require("node:assert");
const { renderPieceHtml } = require("../src/render-piece-html");
const { BOXES_PER_ROW } = require("../src/visual-registry");

// Helper: count rendered table rows in the HTML piece.
function tableRowCount(html) {
  return (html.match(/<tr>/g) || []).length;
}

test("draw-box-row makes one bordered square per box", async () => {
  const item = {
    visual: "draw-box-row",
    spec: { boxes: [{ caption: "a)" }, { caption: "b)" }, { caption: "c)" }], boxWidthMm: 40 },
  };
  const piece = await renderPieceHtml(item);
  assert.ok(piece !== null);
  assert.ok(piece.html.includes("<table"));
  // 3 boxes fit in one row (BOXES_PER_ROW = 3)
  assert.strictEqual(tableRowCount(piece.html), 1);
  assert.ok(piece.widthMm > 100);
});

test("draw-box-row: 6 boxes wrap into 2 rows of 3", async () => {
  const item = {
    visual: "draw-box-row",
    label: "Draw each angle",
    spec: {
      boxes: [
        { caption: "a) 40°" }, { caption: "b) 110°" }, { caption: "c) 75°" },
        { caption: "d) 25°" }, { caption: "e) 95°" }, { caption: "f) 60°" },
      ],
      boxWidthMm: 40,
    },
  };
  const piece = await renderPieceHtml(item);
  assert.ok(piece !== null, "should produce a piece for 6 boxes");
  const expectedRows = Math.ceil(6 / BOXES_PER_ROW); // = 2
  assert.strictEqual(tableRowCount(piece.html), expectedRows);
  // Total piece width: 3 boxes at (40+6)mm + 8mm padding = 146mm — well under 277mm
  assert.ok(piece.widthMm < 200, `widthMm ${piece.widthMm} should fit within landscape printable area`);
});

test("draw-box-row: returns null for empty boxes array", async () => {
  const item = { visual: "draw-box-row", label: "Empty", spec: { boxes: [] } };
  const piece = await renderPieceHtml(item);
  assert.strictEqual(piece, null);
});
