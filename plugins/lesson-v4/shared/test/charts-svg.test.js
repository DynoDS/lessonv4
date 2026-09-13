'use strict';

// The bar chart and the line graph every surface places (13 September 2026,
// when the board stopped drawing its own). These hold what the board's charts
// guaranteed, now that the board draws the shared ones, and what laying them
// out at printed size adds.

const test = require('node:test');
const assert = require('node:assert/strict');
const barChart = require('../visuals/bar-chart-svg');
const lineGraph = require('../visuals/line-graph-svg');
const labelDiagram = require('../visuals/label-diagram-svg');
const { profileFor } = require('../visuals/surface-profiles');

const fontSizes = (svg) => [...svg.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
const texts = (svg) => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
const BOARD = profileFor('slides', { widthPt: 12 * 72, heightPt: 5 * 72 });
const CHART = { title: 'Our favourite sports', categories: ['Football', 'Swimming', 'Tennis', 'Netball'], values: [12, 8, 6, 10], y_interval: 2, y_label: 'Children', x_label: 'Sport' };

test('a bar chart reads the board spelling and the sheet spelling as the same chart', () => {
  const board = barChart.tightSvg(CHART);
  const sheet = barChart.tightSvg({ ...CHART, y_interval: undefined, y_label: undefined, x_label: undefined, yInterval: 2, yLabel: 'Children', xLabel: 'Sport' });
  assert.equal(board.svg, sheet.svg);
  assert.ok(texts(board.svg).includes('Children') && texts(board.svg).includes('Sport'), 'axis titles print, as they did on the board');
});

test('with no interval the scale steps in a number a child counts in, never a silent 1', () => {
  assert.equal(barChart.readSpec({ categories: ['A'], values: [30] }).interval, 10);
  assert.equal(barChart.readSpec({ categories: ['A'], values: [4] }).interval, 1);
});

test('on the board the scale numbers print at the board size, and the plot fills the zone', () => {
  const out = barChart.tightSvg(CHART, BOARD);
  assert.ok(Math.min(...fontSizes(out.svg)) >= BOARD.minFontPt, `smallest type ${Math.min(...fontSizes(out.svg))}pt`);
  assert.ok(Math.abs(out.w - BOARD.widthPt) < 0.5 && Math.abs(out.h - BOARD.heightPt) < 0.5, 'the drawing is the zone');
});

test('names that will not sit side by side drop to a second row before going under the floor', () => {
  const half = profileFor('slides', { widthPt: 6 * 72, heightPt: 5 * 72 });
  const out = barChart.tightSvg(CHART, half);
  assert.ok(Math.min(...fontSizes(out.svg)) >= half.minFontPt);
  const labelYs = new Set([...out.svg.matchAll(/<text x="[\d.]+" y="([\d.]+)"[^>]*alphabetic/g)].map((m) => m[1]));
  assert.equal(labelYs.size, 2, 'the category names sit on two rows');
});

test('a zone too small for a readable chart is refused by name, never drawn small', () => {
  assert.throws(() => barChart.tightSvg(CHART, profileFor('slides', { widthPt: 150, heightPt: 300 })), /BAR_CHART_TOO_NARROW/);
  assert.throws(() => barChart.tightSvg({ ...CHART, y_interval: 1 }, profileFor('slides', { widthPt: 800, heightPt: 150 })), /BAR_CHART_ZONE_TOO_SMALL/);
  assert.throws(() => barChart.tightSvg({ categories: [], values: [] }, BOARD), /BAR_CHART_EMPTY/);
});

const GRAPH = { title: 'Temperature through the day', points: [{ x: 0, y: 4 }, { x: 3, y: 9 }, { x: 6, y: 11 }, { x: 9, y: 16 }, { x: 12, y: 17 }], xLabel: 'Hours', yLabel: 'Degrees', xMax: 12, yMax: 20, xStep: 3, yStep: 5 };

test('a line graph on the board numbers both axes at board size and keeps its title', () => {
  const out = lineGraph.tightSvg(GRAPH, BOARD);
  assert.ok(Math.min(...fontSizes(out.svg)) >= BOARD.minFontPt);
  assert.ok(texts(out.svg).includes('Temperature through the day'), 'the title the board used to drop now prints');
  for (const n of ['0', '3', '6', '9', '12', '20']) assert.ok(texts(out.svg).includes(n), `axis number ${n}`);
  assert.equal((out.svg.match(/<circle/g) || []).length, GRAPH.points.length, 'a dot at every reading');
});

test('a long title is set smaller on its own and never pulls the axis numbers down', () => {
  const narrow = profileFor('slides', { widthPt: 6 * 72, heightPt: 5 * 72 });
  const out = lineGraph.tightSvg(GRAPH, narrow);
  const tick = fontSizes(out.svg).filter((s) => s < 30);
  assert.ok(tick.every((s) => s >= narrow.minFontPt));
});

test('a line graph that cannot be numbered readably is refused by name', () => {
  assert.throws(() => lineGraph.tightSvg({ ...GRAPH, xStep: 0.5 }, profileFor('slides', { widthPt: 200, heightPt: 300 })), /LINE_GRAPH_TOO_NARROW/);
  assert.throws(() => lineGraph.tightSvg({ ...GRAPH, yStep: 1 }, profileFor('slides', { widthPt: 800, heightPt: 160 })), /LINE_GRAPH_ZONE_TOO_SMALL/);
});

test('a labelled photograph keeps the board poster rules wherever it is placed', () => {
  const spec = { imagePath: 'x.jpg', imageHref: 'data:image/png;base64,AA==', imageWidth: 600, imageHeight: 400, layout: 'sides', callouts: [{ anchor: [20, 50], label: 'a very long part name here', given: true }] };
  const viaSpec = labelDiagram.tightSvg(spec);
  const direct = labelDiagram.buildLabelDiagramSvg({ href: spec.imageHref, width: 600, height: 400, callouts: spec.callouts, layout: 'sides', marginXRatio: 0.22, marginYRatio: 0.02, labelMaxChars: 16, arrow: false });
  assert.equal(viaSpec.svg, direct.svg);
  assert.throws(() => labelDiagram.tightSvg({ imagePath: 'x.jpg', callouts: [] }), /LABEL_DIAGRAM_IMAGE_MISSING/);
  assert.notEqual(labelDiagram.cacheKey(spec), labelDiagram.cacheKey({ ...spec, layout: 'auto' }));
});
