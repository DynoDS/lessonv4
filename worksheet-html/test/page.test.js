"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  mmToPx,
  pageSize,
  printableArea,
  DEFAULT_MARGIN_MM,
} = require("../src/page");

test("a millimetre is 96/25.4 CSS pixels", () => {
  assert.ok(Math.abs(mmToPx(25.4) - 96) < 0.001);
  assert.ok(Math.abs(mmToPx(1) - 3.779527559) < 0.000001);
});

test("A4 portrait is 210 by 297 millimetres", () => {
  assert.deepEqual(pageSize("portrait"), { widthMm: 210, heightMm: 297 });
});

test("landscape swaps the edges", () => {
  assert.deepEqual(pageSize("landscape"), { widthMm: 297, heightMm: 210 });
});

test("the printable area is the page less a margin on each side", () => {
  assert.deepEqual(printableArea("portrait", 15), {
    widthMm: 180,
    heightMm: 267,
  });
});

test("the default margin is 15mm", () => {
  assert.equal(DEFAULT_MARGIN_MM, 15);
});

test("an impossible margin is rejected rather than producing a negative page", () => {
  assert.throws(() => printableArea("portrait", 150), /margin/i);
});
