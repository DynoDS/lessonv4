'use strict';

// Pointing at one reading on a line graph (shared/visuals/figure-highlight.js):
// "at week 3 it was 12cm". The reading is named by its x value as the axis
// prints it; its dot stays at full strength with a ring round it, the line and
// the other dots step back, and the axes stay readable.

const test = require('node:test');
const assert = require('node:assert/strict');
const graph = require('../visuals/line-graph-svg');
const { RING, RING_INK, DIMMED } = require('../visuals/figure-highlight');
const { profileFor } = require('../visuals/surface-profiles');

const BOARD = profileFor('slides', { widthPt: 620, heightPt: 360 });
const SPEC = {
  title: 'Plant height',
  points: [{ x: 0, y: 2 }, { x: 1, y: 5 }, { x: 2, y: 9 }, { x: 3, y: 12 }, { x: 4, y: 14 }],
  xLabel: 'Week',
  yLabel: 'Height (cm)',
};

const ring = new RegExp(`<circle[^>]*fill="none" stroke="#${RING}"`, 'g');

test('the named reading draws at full strength with one ring, and the line and other dots fade', () => {
  const { svg } = graph.tightSvg({ ...SPEC, highlight: 3 }, BOARD);
  assert.equal((svg.match(ring) || []).length, 1);
  const dots = svg.match(/(<g opacity="[\d.]+">)?<circle cx="[\d.]+" cy="[\d.]+" r="[\d.]+" fill="#C00000"\/>/g);
  assert.equal(dots.length, 5);
  assert.equal(dots.filter((d) => d.startsWith(`<g opacity="${DIMMED}">`)).length, 4, 'the other four dots step back');
  assert.ok(new RegExp(`<g opacity="${DIMMED}"><polyline`).test(svg), 'the line steps back');
  assert.ok(!/<g opacity[^>]*><text/.test(svg), 'no axis number or title is faded');
});

test('a reading answers to "point 3" and "x 3" as well as "3"', () => {
  const lit = graph.tightSvg({ ...SPEC, highlight: '3' }, BOARD).svg;
  assert.equal(graph.tightSvg({ ...SPEC, highlight: 'point 3' }, BOARD).svg, lit);
  assert.equal(graph.tightSvg({ ...SPEC, highlight: 'x 3' }, BOARD).svg, lit);
});

test('an unknown reading is refused, and the refusal lists the readings', () => {
  assert.throws(() => graph.tightSvg({ ...SPEC, highlight: '7' }, BOARD), /FIGURE_HIGHLIGHT_UNKNOWN.*0, 1, 2, 3, 4/s);
});

test('no highlight draws exactly as the graph with the field absent, under the same key', () => {
  for (const none of [null, [], false]) {
    assert.equal(graph.tightSvg({ ...SPEC, highlight: none }, BOARD).svg, graph.tightSvg(SPEC, BOARD).svg);
    assert.equal(graph.cacheKey({ ...SPEC, highlight: none }, BOARD), graph.cacheKey(SPEC, BOARD));
  }
  assert.notEqual(graph.cacheKey({ ...SPEC, highlight: '2' }, BOARD), graph.cacheKey(SPEC, BOARD));
});

test('on the photocopied pack the ring is dark ink', () => {
  const { svg } = graph.tightSvg({ ...SPEC, highlight: '1' }, profileFor('stickin', { widthMm: 130 }));
  assert.ok(svg.includes(`fill="none" stroke="#${RING_INK}"`));
});
