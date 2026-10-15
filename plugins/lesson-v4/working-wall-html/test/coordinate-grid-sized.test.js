'use strict';

// The coordinate grid on the wall is told the width it prints at.
//
// Its axis numbers were a fixed third of a square, so on a wall sheet they
// could not be read across the room. The shared drawing sizes them for the
// surface when the surface says how big the grid prints, and the wall's build
// lays a drawing out again once it knows the room a card really gave it. These
// hold that the grid takes part in both.

const test = require('node:test');
const assert = require('node:assert/strict');
const { coordinateGridKey } = require('../src/svg-renderer');
const coordinateGrid = require('../../shared/visuals/coordinate-grid-svg');
const { profileFor, PROFILES } = require('../../shared/visuals/surface-profiles');

const FOUR = { type: 'coordinate-grid', min: -5, max: 5 };

test('the same grid laid out for a different width is a different picture', () => {
  assert.notEqual(coordinateGridKey(FOUR), coordinateGridKey({ ...FOUR, _wallWidthMm: 120 }));
  assert.notEqual(coordinateGridKey(FOUR), coordinateGrid.cacheKey(FOUR));
});

test('across a full sheet a ten-square grid prints its numbers above the wall floor', () => {
  const full = coordinateGrid.describeLayout(FOUR, profileFor('wall', { widthMm: 180 }));
  assert.ok(full.numberPt >= PROFILES.wall.minFontPt, `the numbers print at ${full.numberPt.toFixed(1)}pt`);
  // In a narrower room they are as large as a square holds, not a fixed third of it.
  const narrow = coordinateGrid.describeLayout(FOUR, profileFor('wall', { widthMm: 110 }));
  assert.ok(narrow.numberPt >= narrow.squarePt * 0.5);
});
