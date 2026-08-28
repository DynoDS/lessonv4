"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { formatStickInHandle, pieceHandle } = require("../src/layout-rules");

test("a question-like handle is bracketed", () => {
  // A bare "a" stamped on a cut-out reads as part of the picture rather than as
  // the question it belongs to.
  assert.equal(formatStickInHandle("a"), "(a)");
  assert.equal(formatStickInHandle("2"), "(2)");
  assert.equal(formatStickInHandle("1b"), "(1b)");
});

test("a handle already written with brackets is not double-bracketed", () => {
  assert.equal(formatStickInHandle("(a)"), "(a)");
});

test("a descriptive handle keeps the designer's own word", () => {
  // "Challenge" is a name, not a question number. Bracketing it would dress a
  // designer's word up as one.
  assert.equal(formatStickInHandle("Apply"), "Apply");
  assert.equal(formatStickInHandle("Our Turn"), "Our Turn");
  assert.equal(formatStickInHandle("Challenge"), "Challenge");
});

test("a generated fallback letter is bracketed like any question label", () => {
  const items = [{}, {}, {}];
  assert.equal(pieceHandle(items[0], 0, items.length), "(a)");
  assert.equal(pieceHandle(items[2], 2, items.length), "(c)");
});

test("a single-piece pack still needs no handle", () => {
  assert.equal(pieceHandle({}, 0, 1), null);
});

test("a designer's tag is preferred over the generated letter", () => {
  assert.equal(pieceHandle({ tag: "Challenge" }, 1, 3), "Challenge");
  assert.equal(pieceHandle({ tag: "2" }, 1, 3), "(2)");
});
