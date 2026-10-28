'use strict';

// Pointing at one bar of a bar chart (shared/visuals/figure-highlight.js). The
// bar is named by its own category, so the ring follows it whatever the values
// do; the bar and its name stay at full strength, the other bars and names step
// back, and the scale, gridlines and title stay readable.

const test = require('node:test');
const assert = require('node:assert/strict');
const chart = require('../visuals/bar-chart-svg');
const { RING, RING_INK, DIMMED } = require('../visuals/figure-highlight');
const { profileFor } = require('../visuals/surface-profiles');

const BOARD = profileFor('slides', { widthPt: 620, heightPt: 360 });
const SPEC = { title: 'Favourite sports', categories: ['Football', 'Swimming', 'Tennis', 'Rugby'], values: [12, 7, 4, 9], y_label: 'Children' };

const ring = new RegExp(`fill="none" stroke="#${RING}"`, 'g');
const faded = (svg, word) => new RegExp(`<g opacity="${DIMMED}">(?:(?!</g>).)*>${word}<`).test(svg);

test('the named bar draws at full strength with one ring, and the other bars fade with their names', () => {
  const { svg } = chart.tightSvg({ ...SPEC, highlight: 'swimming' }, BOARD);
  assert.equal((svg.match(ring) || []).length, 1);
  assert.ok(!faded(svg, 'Swimming'));
  ['Football', 'Tennis', 'Rugby'].forEach((c) => assert.ok(faded(svg, c), `${c} steps back`));
  assert.ok(!faded(svg, 'Favourite sports') && !faded(svg, 'Children'), 'title and axis title stay readable');
});

test('an unknown bar is refused, and the refusal lists the bars', () => {
  assert.throws(() => chart.tightSvg({ ...SPEC, highlight: 'Cricket' }, BOARD), /FIGURE_HIGHLIGHT_UNKNOWN.*Football, Swimming, Tennis, Rugby/s);
});

test('no highlight draws exactly as the chart with the field absent, under the same key', () => {
  for (const none of [null, [], false]) {
    assert.equal(chart.tightSvg({ ...SPEC, highlight: none }, BOARD).svg, chart.tightSvg(SPEC, BOARD).svg);
    assert.equal(chart.cacheKey({ ...SPEC, highlight: none }, BOARD), chart.cacheKey(SPEC, BOARD));
  }
  assert.notEqual(chart.cacheKey({ ...SPEC, highlight: 'Tennis' }, BOARD), chart.cacheKey(SPEC, BOARD));
});

test('the chart keeps its size and its anchors when a bar is pointed at', () => {
  const plain = chart.tightSvg(SPEC, BOARD);
  const lit = chart.tightSvg({ ...SPEC, highlight: 'Rugby' }, BOARD);
  assert.equal(lit.w, plain.w);
  assert.equal(lit.h, plain.h);
  assert.deepEqual(lit.anchors, plain.anchors);
});

test('on the photocopied pack the ring is dark ink', () => {
  const { svg } = chart.tightSvg({ ...SPEC, highlight: 'Football' }, profileFor('stickin', { widthMm: 130 }));
  assert.ok(svg.includes(`fill="none" stroke="#${RING_INK}"`));
});
