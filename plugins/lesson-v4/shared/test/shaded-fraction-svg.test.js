'use strict';

// The one shaded fraction every surface places (shared/visuals/shaded-fraction-svg.js).
// These hold what the drawing must guarantee on every surface; each surface's
// own tests hold how it places it.

const test = require('node:test');
const assert = require('node:assert/strict');
const shaded = require('../visuals/shaded-fraction-svg');
const { profileFor, PROFILES } = require('../visuals/surface-profiles');

const SHEET = profileFor('worksheets', { widthMm: 170 });
const PIECE = profileFor('stickin', { widthMm: 110 });
const fills = (svg) => [...svg.matchAll(/<(?:rect|path)[^>]*fill="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1]);

test('every part of a bar is the same width, and exactly the shaded count is shaded', () => {
  const out = shaded.tightSvg({ parts: 8, shaded: 3 }, SHEET);
  const cells = out.layout.rows[0].cells;
  assert.equal(cells.length, 8);
  cells.forEach((c) => assert.ok(Math.abs(c.w - cells[0].w) < 1e-9));
  assert.equal(cells.filter((c) => c.shaded).length, 3);
  assert.deepEqual(cells.map((c) => c.shaded), [true, true, true, false, false, false, false, false], 'shading starts at the left');
});

test('the same spec draws the same picture on every surface, only sized for where it is read', () => {
  for (const spec of [{ parts: 5, shaded: 2 }, { parts: 12, shaded: 3, shape: 'grid' }, { parts: 4, shaded: 1, shape: 'circle' }]) {
    const surfaces = Object.keys(PROFILES).map((s) =>
      shaded.tightSvg(spec, profileFor(s, s === 'slides' ? { widthMm: 200, heightMm: 100 } : { widthMm: 150 }))
    );
    const marks = surfaces.map((o) => (o.svg.match(/<(rect|path|line|circle)\b/g) || []).length);
    assert.equal(new Set(marks).size, 1, `${spec.shape || 'bar'}: every surface draws the same marks: ${marks.join(', ')}`);
  }
});

test('the older spellings draw the very same picture as the board spelling', () => {
  const board = shaded.normalise({ parts: 4, shaded: 3 });
  assert.deepEqual(shaded.normalise({ bars: [{ numerator: 3, denominator: 4 }] }).bars, board.bars, 'the sheet bar');
  assert.deepEqual(shaded.normalise({ type: 'fractionBar', numerator: 3, denominator: 4 }).bars, board.bars, 'the wall bar');
  const circle = shaded.normalise({ type: 'fractionCircle', numerator: 1, denominator: 4 });
  assert.equal(circle.shape, 'circle');
  assert.deepEqual([circle.parts, circle.shaded], [4, 1]);
  // The sheet said `shaded: false` for a bar with its numerator left blank.
  assert.equal(shaded.normalise({ bars: [{ numerator: 3, denominator: 8, shaded: false }] }).bars[0].shaded, 0);
});

test('a circle starts at twelve o\'clock and goes clockwise', () => {
  const out = shaded.tightSvg({ parts: 4, shaded: 1, shape: 'circle' }, SHEET);
  const first = /<path d="M([\d.]+) ([\d.]+) L([\d.]+) ([\d.]+) A[\d. ]+ ([\d.]+) ([\d.]+) Z"/.exec(out.svg).slice(1).map(Number);
  const [cx, cy, x1, y1, x2, y2] = first;
  assert.ok(Math.abs(x1 - cx) < 0.02 && y1 < cy, 'the first sector begins straight up');
  assert.ok(x2 > cx && Math.abs(y2 - cy) < 0.02, 'and ends at three o\'clock');
});

test('a grid keeps square cells, and a stated number of rows is kept', () => {
  const auto = shaded.describeLayout({ parts: 12, shaded: 3, shape: 'grid' }, SHEET);
  assert.equal(auto.rows * auto.cols, 12);
  assert.ok(auto.cols >= auto.rows, 'a wide sheet gets a wide grid');
  const two = shaded.describeLayout({ parts: 12, shape: 'grid', rows: 2 }, SHEET);
  assert.deepEqual([two.rows, two.cols], [2, 6]);
});

test('bar labels sit under their own bar, inside the picture, clear of the next bar', () => {
  const out = shaded.describeLayout({ bars: [{ parts: 4, shaded: 3, label: 'three quarters of the bar' }, { parts: 5, shaded: 2, label: '2/5' }] }, SHEET);
  const [a, b] = out.rows;
  assert.ok(a.label.y >= a.y + a.h, 'the first label is under its bar');
  assert.ok(a.label.y + a.label.h <= b.y, 'and above the second bar');
  for (const r of out.rows) assert.ok(r.label.x >= 0 && r.label.x + r.label.w <= out.w + 1e-6);
  assert.ok(b.label.y + b.label.h <= out.h + 1e-6);
});

test('the board fits its zone, and a zone too shallow for the bars refuses by name', () => {
  const board = profileFor('slides', { widthPt: 648, heightPt: 300 });
  const out = shaded.tightSvg({ bars: [{ parts: 4, shaded: 3, label: '3/4' }, { parts: 5, shaded: 2, label: '2/5' }] }, board);
  assert.ok(out.h <= 300 + 1e-6 && out.w <= 648 + 1e-6);
  assert.throws(
    () => shaded.tightSvg({ bars: [1, 2, 3].map(() => ({ parts: 4, shaded: 1, label: 'a label' })) }, profileFor('slides', { widthPt: 648, heightPt: 90 })),
    /SHADED_FRACTION_ZONE_TOO_SHALLOW/
  );
});

test('parts too narrow to count refuse rather than printing a smudge', () => {
  assert.throws(() => shaded.tightSvg({ parts: 60 }, profileFor('worksheets', { widthMm: 40 })), /SHADED_FRACTION_TOO_SMALL/);
});

test('the stick-in piece stays in ink, and a card\'s own colour is used where colour prints', () => {
  const piece = shaded.tightSvg({ parts: 4, shaded: 1, colour: 'EF4444' }, PIECE).svg;
  assert.ok(!fills(piece).some((f) => /A9DFBF|EF4444/i.test(f)), 'no colour reaches the photocopy');
  assert.ok(fills(shaded.tightSvg({ parts: 4, shaded: 1 }, SHEET).svg).includes('#A9DFBF'), 'the board green by default');
  assert.ok(fills(shaded.tightSvg({ parts: 4, shaded: 1, colour: 'EF4444' }, SHEET).svg).includes('#EF4444'));
});

test('impossible fractions fail clearly', () => {
  assert.throws(() => shaded.normalise({ parts: 4, shaded: 5 }), /SHADED_FRACTION_INVALID: .*5 of 4/);
  assert.throws(() => shaded.normalise({ parts: 0 }), /SHADED_FRACTION_INVALID/);
  assert.throws(() => shaded.normalise({ parts: 2.5 }), /SHADED_FRACTION_INVALID/);
  assert.throws(() => shaded.normalise({ parts: 4, shape: 'star' }), /SHADED_FRACTION_INVALID/);
  assert.throws(() => shaded.normalise({ shape: 'circle', bars: [{ parts: 2 }] }), /SHADED_FRACTION_INVALID/);
});

test('the caption under the whole shape is left to the surface, so it never prints twice', () => {
  const out = shaded.tightSvg({ parts: 4, shaded: 1, label: 'one quarter' }, SHEET);
  assert.ok(!out.svg.includes('one quarter'));
});
