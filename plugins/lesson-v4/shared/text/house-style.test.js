"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { houseStyleString } = require("./house-style");

test("unsupported cross glyph is normalised before any renderer sees it", () => {
  assert.equal(houseStyleString("✗ Not this"), "✘ Not this");
});
