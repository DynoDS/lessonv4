"use strict";

// The coordinate grid on a sheet is told the width it prints at.
//
// Its axis numbers were a fixed third of a square, so they printed smaller on a
// grid of many squares. The shared drawing now sizes them for the surface, but
// only when the surface says how big the grid will print, and the sheet's
// ordinary way of placing an older shared drawing does not say. These hold
// that the sheet does, and that every field of the grid still reaches it (a
// sheet that dropped `min` drew a first-quadrant grid under a four-quadrant
// question).

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { REGISTRY: helpers } = require("../src/helpers");
const coordinateGrid = require("../../shared/visuals/coordinate-grid-svg");
const { profileFor, PROFILES } = require("../../shared/visuals/surface-profiles");

const MINUS = "−";
const FOUR = { min: -5, max: 5, shapes: [{ points: [[1, 2], [4, 2], [1, 5]], labels: ["A", "B", "C"] }] };

test("a ten-square grid prints its axis numbers at the sheet's type size", () => {
  const html = helpers["coordinate-grid"].render(FOUR, 110);
  const sized = coordinateGrid.describeLayout(FOUR, profileFor("worksheets", { widthMm: 110, heightMm: 150 }));
  assert.ok(Math.abs(sized.numberPt - PROFILES.worksheets.fontPt) < 0.3, `the numbers print at ${sized.numberPt.toFixed(1)}pt`);
  assert.ok(sized.textScale > 1, "the grid was not told its width");
  assert.ok(html.includes(`font-size="${(34 * sized.textScale).toFixed(2)}"`), "the sheet drew the grid without its printed width");
});

test("every field of a four-quadrant grid reaches the sheet", () => {
  const html = helpers["coordinate-grid"].render(FOUR, 110);
  assert.ok(html.includes(`>${MINUS}5<`), "the negative numbers are missing");
  ["A", "B", "C"].forEach((letter) => assert.ok(html.includes(`>${letter}<`), `vertex ${letter} is missing`));
});

test("the sheet measures the grid at the height it draws it", () => {
  const widthMm = 110;
  const drawn = coordinateGrid.tightSvg(coordinateGrid.pickSpec(FOUR), profileFor("worksheets", { widthMm, heightMm: 150 }));
  assert.ok(Math.abs(helpers["coordinate-grid"].measure(FOUR, widthMm) - widthMm / drawn.aspect) < 0.01);
});

test("a ten-square grid asks for a width that stands beside a column of questions", () => {
  // A portrait page's zone is 174mm; the Year 6 translation sheet stood its
  // grid beside a 62mm column of questions with 4mm between, which leaves 108.
  const needs = helpers["coordinate-grid"].needs({ min: -5, max: 5 });
  assert.ok(needs.minWidthMm >= 100 && needs.minWidthMm <= 108, `it asks for ${needs.minWidthMm.toFixed(1)}mm`);
  assert.equal(needs.minHeightMm, 100);
});

// A grid copied from an answers slide carries its answers marked. The pupil
// sheet is the child's to fill in, so it prints the question; the teacher's
// answer sheet prints the answers in green (14 October 2026).
test("a pupil sheet leaves a grid's answers off, and the answer sheet's picture of it prints them green", () => {
  const answered = {
    helper: "coordinate-grid", min: -5, max: 5,
    shapes: [{ points: [[2, 1], [4, 1], [4, 3]], labels: ["A", "B", "C"], translate: { dx: -5, dy: 0 }, showImage: true, imageAnswer: true, imageLabels: ["A'", "B'", "C'"] }],
  };
  const pupil = helpers["coordinate-grid"].render(answered, 110);
  assert.doesNotMatch(pupil, /#00B050/);
  assert.doesNotMatch(pupil, /A&apos;/);
  const key = helpers["coordinate-grid"].render({ ...answered, showAnswers: true }, 80);
  assert.match(key, /stroke="#00B050"/);
  assert.match(key, /A&apos;/);
});
