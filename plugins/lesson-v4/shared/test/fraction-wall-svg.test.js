'use strict';

// The one fraction wall every surface places (shared/visuals/fraction-wall-svg.js).

const test = require('node:test');
const assert = require('node:assert/strict');
const wall = require('../visuals/fraction-wall-svg');
const { profileFor, PROFILES } = require('../visuals/surface-profiles');
const { textWidthEm } = require('../text/comic-glyph-width');

const SHEET = profileFor('worksheets', { widthMm: 170 });

test('every row spans the same whole, cut into equal pieces', () => {
  const out = wall.describeLayout({ fractions: [1, 2, 3, 4, 6, 8, 12] }, SHEET);
  const span = (row) => row.pieces[row.pieces.length - 1].x + row.pieces[row.pieces.length - 1].w - row.pieces[0].x;
  out.rows.forEach((row) => {
    assert.equal(row.pieces.length, row.denominator);
    assert.ok(Math.abs(span(row) - span(out.rows[0])) < 1e-6, `the 1/${row.denominator} row is the length of the whole`);
    row.pieces.forEach((p) => assert.ok(Math.abs(p.w - row.pieces[0].w) < 1e-9));
  });
  // Two quarters end where one half ends.
  const half = out.rows[1].pieces[0];
  const quarters = out.rows[3].pieces[1];
  assert.ok(Math.abs(half.x + half.w - (quarters.x + quarters.w)) < 1e-6);
});

test('every name fits inside its piece, at one size for the whole wall, never under the readable floor', () => {
  for (const s of Object.keys(PROFILES)) {
    const profile = profileFor(s, s === 'slides' ? { widthPt: 648, heightPt: 400 } : { widthMm: 170 });
    const out = wall.describeLayout({ fractions: [1, 2, 3, 4, 6, 8, 12] }, profile);
    assert.ok(out.labelPt >= profile.minFontPt, `${s}: names at ${out.labelPt}pt`);
    out.rows.forEach((row) => {
      const text = row.denominator === 1 ? '1' : out.stacked ? String(row.denominator) : `1/${row.denominator}`;
      assert.ok(textWidthEm(text, true) * out.labelPt <= row.pieces[0].w, `${s}: the 1/${row.denominator} name overflows its piece`);
    });
  }
});

test('the same spec draws the same pieces on every surface', () => {
  const spec = { fractions: [2, 4, 8] };
  const marks = Object.keys(PROFILES).map((s) => {
    const svg = wall.tightSvg(spec, profileFor(s, s === 'slides' ? { widthPt: 648, heightPt: 300 } : { widthMm: 170 })).svg;
    return (svg.match(/<rect\b[^>]*stroke=/g) || []).length;
  });
  assert.equal(new Set(marks).size, 1, marks.join(', '));
});

test('a wall too narrow or too shallow to name its pieces refuses by name', () => {
  assert.throws(() => wall.tightSvg({ fractions: [24] }, profileFor('worksheets', { widthMm: 40 })), /FRACTION_WALL_TOO_NARROW/);
  assert.throws(() => wall.tightSvg({ fractions: [1, 2, 3, 4, 5, 6, 8, 10, 12] }, profileFor('slides', { widthPt: 648, heightPt: 120 })), /FRACTION_WALL_ZONE_TOO_SHALLOW/);
});

test('the stick-in piece stays in ink', () => {
  const svg = wall.tightSvg({ fractions: [1, 2, 3] }, profileFor('stickin', { widthMm: 130 })).svg;
  assert.ok(!/#FFE4CC|#FFF8CC|#D6EEFF/.test(svg));
});

test('bad rows fail clearly', () => {
  assert.throws(() => wall.normalise({ fractions: [] }), /FRACTION_WALL_INVALID/);
  assert.throws(() => wall.normalise({ fractions: [2, 0] }), /FRACTION_WALL_INVALID/);
  assert.throws(() => wall.normalise({ fractions: [2.5] }), /FRACTION_WALL_INVALID/);
  assert.throws(() => wall.normalise({ fractions: Array.from({ length: 13 }, () => 2) }), /FRACTION_WALL_INVALID/);
  assert.deepEqual(wall.normalise({}).fractions, [1, 2, 3, 4]);
});
