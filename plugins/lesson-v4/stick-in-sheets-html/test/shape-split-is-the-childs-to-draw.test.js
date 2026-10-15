"use strict";

// An L-shape a child splits into rectangles is printed plain. The designer
// copies the figure from the slide that shows it, and the answers slide shows
// the dashed line and the numbered rectangles, so a copied answer has to print
// as the question. A split the lesson hands over (no answer flag) stays.

const { test } = require("node:test");
const assert = require("node:assert");
const { renderPieceHtml } = require("../src/render-piece-html");

const L = [[0, 0], [10, 0], [10, 3], [4, 3], [4, 8], [0, 8]];
const parts = [{ corners: [[0, 0], [10, 3]], label: "1" }, { corners: [[0, 3], [4, 8]], label: "2" }];
const shape = { vertices: L, sideLabels: ["10 cm", "3 cm", "6 cm", "5 cm", "4 cm", "8 cm"], parts };

test("a split copied from an answers slide is left off the child's copy", async () => {
  const piece = await renderPieceHtml({ visual: "polygon", spec: { partsAnswer: true, shapes: [shape] } });
  assert.ok(!piece.html.includes("stroke-dasharray"), "the answer line was printed for the child");
  assert.ok(!piece.html.includes("<circle"), "the numbered rectangles were printed for the child");
  assert.ok(piece.html.includes("10 cm"), "the shape lost its lengths");
});

test("a split the lesson hands the child is printed, in ink", async () => {
  const piece = await renderPieceHtml({ visual: "polygon", spec: { shapes: [shape] } });
  assert.ok(piece.html.includes("stroke-dasharray"));
  assert.strictEqual((piece.html.match(/<circle/g) || []).length, 2);
  assert.ok(!/#00B050|#CCE2F5|#C65911/i.test(piece.html), "a photocopied piece carries colour");
});
