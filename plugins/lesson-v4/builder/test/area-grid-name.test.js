'use strict';

// A lettered shape is named inside its own drawing, not on a card of its own.
//
// On a Year 4 area deck (28 October 2026) each shape's letter had a card above
// or below the grid, a whole row of the slide with a gap, and the shape was
// drawn smaller to make room. A large letter beside the shape kept it biggest
// but read as part of the shape (the teacher, 7 November 2026), so the name is
// a caption, "Shape C", above the grid by default and below it when asked.

const test = require('node:test');
const assert = require('node:assert/strict');
const grid = require('../../shared/visuals/area-grid-svg');
const { profileFor } = require('../../shared/visuals/surface-profiles');

// A board zone shaped like a turn slide's work area: wide, held by its height.
const box = { widthPt: 600, heightPt: 300 };
const caption = (svg) => svg.match(/<text x="[\d.]+" y="([\d.]+)"[^>]*text-anchor="middle"[^>]*>Shape C<\/text>/);

test('the name is a caption above the grid by default', () => {
  const drawn = grid.tightSvg({ cols: 4, rows: 3, name: 'Shape C' }, profileFor('slides', box));
  const L = drawn.layout;
  const found = caption(drawn.svg);
  assert.ok(found, 'the caption is drawn');
  assert.ok(Number(found[1]) < L.oy, 'it sits above the grid');
});

test('below puts it under the grid', () => {
  const drawn = grid.tightSvg({ cols: 4, rows: 3, name: 'Shape C', namePlace: 'below' }, profileFor('slides', box));
  const L = drawn.layout;
  assert.ok(Number(caption(drawn.svg)[1]) > L.oy + L.gridH, 'it sits under the grid');
});

test('the caption costs the shape only its own line, inside the drawing', () => {
  const plain = grid.describeLayout({ cols: 4, rows: 3 }, profileFor('slides', box));
  const named = grid.describeLayout({ cols: 4, rows: 3, name: 'Shape C' }, profileFor('slides', box));
  assert.ok(named.cell < plain.cell, 'the shape gives up some height for the caption');
  assert.ok(named.h <= box.heightPt + 1e-6, 'the drawing still fits its space');
  assert.ok(named.gridH > plain.gridH * 0.8, `the shape kept most of its size (${named.gridH.toFixed(0)} of ${plain.gridH.toFixed(0)})`);
});

test('beside still draws a large letter on the left, clear of the shape', () => {
  const drawn = grid.tightSvg({ cols: 4, rows: 3, name: 'C', namePlace: 'beside' }, profileFor('slides', box));
  const letter = drawn.svg.match(/<text x="([\d.]+)"[^>]*text-anchor="end"[^>]*>C<\/text>/);
  assert.ok(letter && Number(letter[1]) < drawn.layout.ox - drawn.layout.T, 'the letter keeps a clear gap from the grid');
});

test('a grid with no name draws as it did', () => {
  const plain = grid.describeLayout({ cols: 4, rows: 3 }, profileFor('slides', box));
  assert.equal(plain.nameW, 0);
  assert.equal(plain.nameH, 0);
});
