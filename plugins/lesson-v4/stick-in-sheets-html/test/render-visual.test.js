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

const WORLD_MAP_SPEC = {
  continentMarkers: [
    { marker: "1", at: [0.208, 0.25] }, { marker: "2", at: [0.333, 0.583] },
    { marker: "3", at: [0.556, 0.222] }, { marker: "4", at: [0.556, 0.472] },
    { marker: "5", at: [0.75, 0.278] }, { marker: "6", at: [0.875, 0.639] },
    { marker: "7", at: [0.5, 0.933] },
  ],
  oceanMarkers: [
    { marker: "A", at: [0.417, 0.444] }, { marker: "B", at: [0.722, 0.611] },
    { marker: "C", at: [0.069, 0.5], repeatAt: [0.944, 0.5] },
    { marker: "D", at: [0.5, 0.833] }, { marker: "E", at: [0.5, 0.083] },
  ],
  seaInitialSpaces: [[0.55, 0.305], [0.292, 0.41], [0.508, 0.19]],
};

test("the world map a child labels in their book is the real shipped one", async () => {
  // This piece used to be a schematic world drawn from typed coordinates, so a
  // class was taught from the real map on the board and then tested on a
  // different world in their books. Both are now the same asset.
  const piece = await renderPieceHtml({ visual: "map", spec: WORLD_MAP_SPEC });
  assert.strictEqual(piece.widthMm, 150);
  assert.ok(piece.html.includes("data:image/png;base64,"), "the land must come from the shipped image");
});

test("a labelled teaching map copied across still prints as a write-on piece", async () => {
  // The registry forces the write-on form, so an answer map pasted in from the
  // slide cannot become thirty pre-labelled copies.
  const piece = await renderPieceHtml({
    visual: "map",
    spec: { ...WORLD_MAP_SPEC, map: "south-america", worksheetMode: "annotated" },
  });
  assert.ok(piece.html.includes("<svg"));
  assert.ok(!/>Africa</.test(piece.html), "no continent may be named for the child");
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
