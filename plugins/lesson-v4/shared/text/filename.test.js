"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { safeFilenameComponent, lessonSlug } = require("./filename");

test("unsafe path punctuation cannot create folders or invalid Windows names", () => {
  assert.equal(
    safeFilenameComponent("Find 10/100 more: less?"),
    "Find 10-100 more less"
  );
});

test("lesson slugs turn every punctuation run into one boundary", () => {
  assert.equal(lessonSlug("Find 10/100 more or less"), "find-10-100-more-or-less");
});

test("empty results receive a usable fallback", () => {
  assert.equal(safeFilenameComponent("???"), "Lesson");
  assert.equal(lessonSlug("///"), "lesson");
});
