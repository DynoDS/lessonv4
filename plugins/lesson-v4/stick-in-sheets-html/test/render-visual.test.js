const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { renderPieceHtml } = require("../src/render-piece-html");

test("renderPieceHtml draws a blank labelled venn and sizes it in mm", async () => {
  const item = { visual: "venn", spec: { label1: "has a right angle", label2: "has 4 equal sides" }, widthMm: 150 };
  const piece = await renderPieceHtml(item);
  assert.strictEqual(piece.widthMm, 150);
  assert.ok(piece.heightMm > 0 && piece.heightMm < 150); // venn is wider than tall
  assert.ok(typeof piece.html === "string" && piece.html.includes("<svg"));
});

test("renderPieceHtml falls back to the visual's default width", async () => {
  const piece = await renderPieceHtml({ visual: "carroll", spec: { rowLabel: "is a quadrilateral", rowNotLabel: "is NOT a quadrilateral", colLabel: "has a right angle", colNotLabel: "has NO right angle" } });
  // 118mm: Carroll's aspect (≈1.321) makes the tile ~89mm tall; 2×89+6mm gap = 184mm fits
  // the 185mm printable height (margin 10mm each side) — 4 Carrolls on one landscape page.
  assert.strictEqual(piece.widthMm, 118);
});

test("renderPieceHtml rejects an unknown visual", async () => {
  await assert.rejects(() => renderPieceHtml({ visual: "nope", spec: {} }), /Unknown stick-in visual/);
});

test("renderPieceHtml skips a Venn with no labels", async () => {
  const piece = await renderPieceHtml({ visual: "venn", spec: {} });
  assert.strictEqual(piece, null);
});

test("renderPieceHtml renders label-diagram through its own sharp dependency", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stickin-label-"));
  const image = path.join(dir, "diagram.svg");


  fs.writeFileSync(
    image,
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>'
  );


  const piece = await renderPieceHtml({
    visual: "label-diagram",
    spec: {
      image,
      callouts: [{ anchor: [50, 50], label: "Part" }],
    },
  }, { baseDir: dir });


  assert.ok(piece);
  assert.ok(piece.html.includes("<svg"));
});
