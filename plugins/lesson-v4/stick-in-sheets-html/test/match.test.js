"use strict";

// The Year 4 geography Yanomami lesson (5 November 2026) asked children to draw
// lines from what someone did to whether they would try it. The board drew it,
// but the pack had no match piece, so a teacher who printed got nothing for the
// task. The pack now prints the design's `match` as a write-on piece.

const { test } = require("node:test");
const assert = require("node:assert");
const { renderPieceHtml } = require("../src/render-piece-html");
const { missingQuestionContent } = require("../src/visual-registry");

const SPEC = {
  left: [
    { id: "left-001", label: "Swept the rubbish out of the yard." },
    { id: "left-002", label: "Ate the fish they caught that day." },
    { id: "left-003", label: "Slept in a hammock by the fire." },
  ],
  right: [
    { id: "right-001", label: "Would try it" },
    { id: "right-002", label: "Would not try it" },
  ],
  togetherPair: { leftRef: "left-001", rightRef: "right-001" },
};

test("renderPieceHtml draws a match piece at its book width", async () => {
  const piece = await renderPieceHtml({ visual: "match", spec: SPEC });
  assert.ok(piece, "the match rendered");
  assert.strictEqual(piece.widthMm, 150);
  assert.ok(piece.heightMm < 185, "it fits the landscape page depth");
  assert.ok(piece.html.includes("Would not try it"));
  assert.strictEqual((piece.html.match(/<line /g) || []).length, 1, "only the together pair is joined");
});

test("a match that is not a question is skipped by name, not tiled", async () => {
  assert.match(missingQuestionContent({ visual: "match", spec: { left: SPEC.left.slice(0, 1), right: SPEC.right } }), /2 to 8 left/);
  assert.match(missingQuestionContent({ visual: "match", spec: { ...SPEC, togetherPair: { leftRef: "left-009", rightRef: "right-001" } } }), /togetherPair/);
  assert.strictEqual(missingQuestionContent({ visual: "match", spec: SPEC }), null);
  assert.strictEqual(await renderPieceHtml({ visual: "match", spec: { left: [], right: SPEC.right } }), null);
});
