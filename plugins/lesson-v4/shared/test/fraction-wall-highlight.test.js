'use strict';

// Pointing at a row of the fraction wall (shared/visuals/figure-highlight.js):
// "look at the thirds". A row is named by its fraction ("1/3") or its name
// ("thirds"); it stays at full strength with a ring drawn just inside it, the
// other rows step back with their names, and the wall keeps its size.

const test = require('node:test');
const assert = require('node:assert/strict');
const wall = require('../visuals/fraction-wall-svg');
const { RING, RING_INK, DIMMED } = require('../visuals/figure-highlight');
const { profileFor } = require('../visuals/surface-profiles');

const BOARD = profileFor('slides', { widthPt: 620, heightPt: 360 });
const SPEC = { fractions: [1, 2, 3, 4, 6] };

const ring = new RegExp(`fill="none" stroke="#${RING}"`, 'g');
// The pieces of a row are the rects at that row's height.
const piecesAt = (svg, y) => svg.match(new RegExp(`(<g opacity="${DIMMED}">)?<rect x="[\\d.]+" y="${y}" `, 'g')) || [];

test('the named row draws at full strength with one ring inside the wall, and the other rows fade', () => {
  const L = wall.describeLayout(SPEC, BOARD);
  const { svg, w, h } = wall.tightSvg({ ...SPEC, highlight: '1/3' }, BOARD);
  assert.equal((svg.match(ring) || []).length, 1);
  L.rows.forEach((row) => {
    const pieces = piecesAt(svg, Math.round(row.y * 100) / 100);
    assert.equal(pieces.length, row.denominator);
    const fadedCount = pieces.filter((p) => p.startsWith('<g')).length;
    assert.equal(fadedCount, row.denominator === 3 ? 0 : row.denominator, `the 1/${row.denominator} row`);
  });
  const r = svg.match(new RegExp(`<rect x="([\\d.]+)" y="[\\d.]+" width="([\\d.]+)"[^>]*stroke="#${RING}"`));
  assert.ok(Number(r[1]) >= 0 && Number(r[1]) + Number(r[2]) <= w + 0.01, 'the ring stays inside the wall');
  assert.equal(h, wall.tightSvg(SPEC, BOARD).h, 'the wall keeps its size');
});

test('a row answers to its name, and the top row is "whole"', () => {
  assert.equal(wall.tightSvg({ ...SPEC, highlight: 'thirds' }, BOARD).svg, wall.tightSvg({ ...SPEC, highlight: '1/3' }, BOARD).svg);
  assert.equal(wall.tightSvg({ ...SPEC, highlight: '1' }, BOARD).svg, wall.tightSvg({ ...SPEC, highlight: 'whole' }, BOARD).svg);
});

test('an unknown row is refused, and the refusal lists the rows', () => {
  assert.throws(() => wall.tightSvg({ ...SPEC, highlight: '1/8' }, BOARD), /FIGURE_HIGHLIGHT_UNKNOWN.*whole, 1\/2, 1\/3, 1\/4, 1\/6/s);
});

test('no highlight draws exactly as the wall with the field absent, under the same key', () => {
  for (const spec of [SPEC, { fractions: [1, 2, 4, 8], line: '1/2', shade: 'family' }]) {
    for (const none of [null, [], false]) {
      assert.equal(wall.tightSvg({ ...spec, highlight: none }, BOARD).svg, wall.tightSvg(spec, BOARD).svg);
      assert.equal(wall.cacheKey({ ...spec, highlight: none }, BOARD), wall.cacheKey(spec, BOARD));
    }
  }
  assert.notEqual(wall.cacheKey({ ...SPEC, highlight: 'halves' }, BOARD), wall.cacheKey(SPEC, BOARD));
});

test('on the photocopied pack the ring is dark ink', () => {
  const { svg } = wall.tightSvg({ ...SPEC, highlight: 'quarters' }, profileFor('stickin', { widthMm: 130 }));
  assert.ok(svg.includes(`fill="none" stroke="#${RING_INK}"`));
});
