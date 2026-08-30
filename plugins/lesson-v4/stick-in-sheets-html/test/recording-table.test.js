"use strict";

// The classification lesson of 30 August 2026: main practice asked children to
// complete a four-column recording table in their books, and the pack shipped
// empty because "table" was not a visual the pack could draw at all. The
// recording table is now a supported write-on piece: headers and given item
// names print, response cells stay blank at handwriting height, and any
// `||`-marked answer cell copied from a check slide is blanked automatically.

const { test } = require("node:test");
const assert = require("node:assert");
const { renderPieceHtml } = require("../src/render-piece-html");

const HEADERS = ["Device", "Electrical or not", "Power source", "What makes it work"];

test("renderPieceHtml draws a write-on recording table", async () => {
  const piece = await renderPieceHtml({
    visual: "table",
    spec: {
      headers: HEADERS,
      rows: [
        ["Television", "", "", ""],
        ["Wall clock", "", "", ""],
      ],
    },
  });
  assert.ok(piece, "the table rendered");
  assert.strictEqual(piece.widthMm, 160);
  assert.ok(piece.html.includes("<svg"));
  assert.ok(piece.html.includes("Device"));
  assert.ok(piece.html.includes("Television"));
  assert.ok(piece.html.includes("Wall clock"));
});

test("an answer table copied from a check slide is blanked to the question form", async () => {
  const piece = await renderPieceHtml({
    visual: "table",
    spec: {
      headers: HEADERS,
      rows: [
        ["Television", "||electrical", "||mains", "||electricity lights the screen."],
      ],
    },
  });
  assert.ok(piece, "the table rendered");
  assert.ok(piece.html.includes("Television"), "the given item name survives");
  assert.ok(!piece.html.includes("electrical"), "revealed answers must not print");
  assert.ok(!piece.html.includes("mains"), "revealed answers must not print");
});

test("a table without its question-defining content is skipped, not tiled blank", async () => {
  assert.strictEqual(
    await renderPieceHtml({ visual: "table", spec: { headers: ["One"], rows: [["a"]] } }),
    null
  );
  assert.strictEqual(
    await renderPieceHtml({ visual: "table", spec: { headers: HEADERS, rows: [] } }),
    null
  );
});
