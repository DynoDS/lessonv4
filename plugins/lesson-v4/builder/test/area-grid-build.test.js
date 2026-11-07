'use strict';

// An area grid can show the rows-times-squares method happening, one row per
// click (the teacher, 6 November 2026, agreeing the Area lesson's board should
// light "4, 8, 12" and then "3 rows of 4": numbers come in by themselves, so a
// cover teacher has the whole method without the notes).

const test = require('node:test');
const assert = require('node:assert/strict');
const { expandHappenings } = require('../src/happening-runs');
const grid = require('../../shared/visuals/area-grid-svg');

const C = { type: 'area-grid', cols: 4, rows: 3, build: 'rows' };

test('the moments are the plain shape, one per row, then the sum', () => {
  const steps = grid.buildSteps(C);
  assert.equal(steps.length, 1 + 3 + 1);
  assert.deepEqual(steps.map((s) => s.lit), [0, 1, 2, 3, 3]);
  assert.deepEqual(steps.map((s) => s.sum), [false, false, false, false, true]);
  assert.match(steps[4].sentence, /3 rows of 4: 3 × 4 = 12/);
});

test('each click adds the next running total, and the sum comes last', () => {
  const at = (step) => grid.tightSvg(Object.assign({ step }, C), 'slides', { widthPt: 420, heightPt: 300 }).svg;
  assert.doesNotMatch(at(0), />4</);
  assert.match(at(1), />4</);
  assert.doesNotMatch(at(1), />8</);
  assert.match(at(3), />12</);
  assert.doesNotMatch(at(3), /rows of/);
  assert.match(at(4), /3 rows of 4/);
  assert.match(at(4), /3 × 4 = /);
});

test('the grid keeps one size and place on every click, so Morph has nothing to move but the rows', () => {
  const sizes = [0, 1, 2, 3, 4].map((step) => {
    const L = grid.tightSvg(Object.assign({ step }, C), 'slides', { widthPt: 420, heightPt: 300 }).layout;
    return [L.w, L.h, L.cell, L.ox, L.oy].map((n) => n.toFixed(2)).join();
  });
  assert.equal(new Set(sizes).size, 1);
});

test('the slide becomes a run of clicks that open with Morph', () => {
  const lesson = { slides: [{ template: 'body-full', title: 'My Turn', speakerNotes: 'Watch the rows.', body: { type: 'stack', items: [C] } }] };
  const r = expandHappenings(lesson);
  assert.equal(r.lesson.slides.length, 5);
  assert.deepEqual(r.morph, [2, 3, 4, 5]);
  assert.equal(r.lesson.slides[0].speakerNotes, 'Watch the rows.');
  assert.match(r.lesson.slides[4].speakerNotes, /^Click: 3 rows of 4/);
});

test('without build it is the ordinary grid, and a build of many patches is refused by name', () => {
  const r = expandHappenings({ slides: [{ template: 'body-full', body: { type: 'area-grid', cols: 4, rows: 3 } }] });
  assert.equal(r.lesson.slides.length, 1);
  assert.doesNotMatch(grid.tightSvg({ type: 'area-grid', cols: 4, rows: 3 }, 'slides').svg, /rows of/);
  assert.throws(() => grid.buildSteps({ type: 'area-grid', build: 'rows', rects: [{ x: 0, y: 0, w: 2, h: 2 }, { x: 3, y: 0, w: 2, h: 2 }] }), /AREA_GRID_BUILD_ONE_SHAPE/);
  assert.throws(() => grid.buildSteps({ type: 'area-grid', build: 'columns' }), /the only build is "rows"/);
});

test('the wall and the sheet draw the finished build', () => {
  const svg = grid.tightSvg(C, 'wall', { widthPt: 400, heightPt: 300 }).svg;
  assert.match(svg, /3 rows of 4/);
});

// Practice where counting one by one stops working (the teacher, 4 and 6 November
// 2026: most grids keep every square, "maybe when we're making it a little bit
// challenging" only the top row and left column are drawn).
test('"edges" covers every square but the top row and left column, and keeps the outline', () => {
  const plain = grid.tightSvg({ type: 'area-grid', cols: 6, rows: 4 }, 'slides', { widthPt: 360, heightPt: 260 });
  const edges = grid.tightSvg({ type: 'area-grid', cols: 6, rows: 4, drawn: 'edges' }, 'slides', { widthPt: 360, heightPt: 260 });
  assert.equal(edges.w, plain.w);
  assert.equal((edges.svg.match(/fill="#FFFFFF"/g) || []).length, 1);
  assert.doesNotMatch(plain.svg, /fill="#FFFFFF"/);
  assert.throws(() => grid.tightSvg({ type: 'area-grid', drawn: 'edges', build: 'rows' }, 'slides'), /AREA_GRID_EDGES_ONE_SHAPE/);
  assert.throws(() => grid.tightSvg({ type: 'area-grid', drawn: 'some' }, 'slides'), /use "edges"/);
});
