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
  const board = barChart.tightSvg(CHART, BOARD);
  const sheet = barChart.tightSvg({ ...CHART, y_interval: undefined, y_label: undefined, x_label: undefined, yInterval: 2, yLabel: 'Children', xLabel: 'Sport' }, BOARD);
  assert.equal(board.svg, sheet.svg);
  assert.ok(texts(board.svg).includes('Children') && texts(board.svg).includes('Sport'), 'axis titles print, as they did on the board');
});

test('a chart is only drawn at the size it prints, so a call without a surface is refused by name', () => {
  assert.throws(() => barChart.tightSvg(CHART), /BAR_CHART_NO_PROFILE/);
  assert.throws(() => lineGraph.tightSvg({ points: [{ x: 0, y: 1 }] }), /LINE_GRAPH_NO_PROFILE/);
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

// The grid: squared paper where squares leave the chart its size (the teacher's
// choice from the Year 3 weather sheet, 9 October 2026), lines across where they
// would not.
const gridLines = (svg) => {
  const lines = [...svg.matchAll(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)" stroke="#8C8C8C"/g)].map((m) => m.slice(1).map(Number));
  return { up: lines.filter((l) => l[0] === l[2]), across: lines.filter((l) => l[1] === l[3]) };
};
const WEATHER = { title: 'The weather in March', categories: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'], values: [0, 0, 9, 0], yMax: 12, yInterval: 2, yLabel: 'Number of days' };

test('on paper a chart is squared: true squares, and every bar starts and ends on a line', () => {
  const out = barChart.tightSvg(WEATHER, profileFor('worksheets', { widthMm: 125 }));
  const { up, across } = gridLines(out.svg);
  assert.ok(up.length >= 8, 'lines run up as well as across');
  const stepUp = across[0][1] - across[1][1];
  const stepAcross = up[1][0] - up[0][0];
  assert.ok(Math.abs(stepUp - stepAcross) < 0.05, `a square is ${stepAcross.toFixed(2)} across and ${stepUp.toFixed(2)} up`);
  const bar = /<rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/.exec(out.svg).slice(1).map(Number);
  const onALine = (x) => up.some((l) => Math.abs(l[0] - x) < 0.05);
  assert.ok(onALine(bar[0]) && onALine(bar[0] + bar[1]), 'the drawn bar sits between two grid lines');
  assert.ok(!out.svg.includes('#DDDDDD'), 'no line is the pale grey a photocopier loses');
});

test('where squares would cost the chart its size it keeps its lines across and its own shape', () => {
  const many = { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [3, 1, 2, 0, 2, 1, 3], yMax: 3, yInterval: 1 };
  const out = barChart.tightSvg(many, profileFor('worksheets', { widthMm: 125 }));
  const { up, across } = gridLines(out.svg);
  assert.equal(up.length, 0, 'seven bars and three lines up would be a strip of squares, so there are none');
  assert.equal(across.length, 3);
  const board = barChart.tightSvg(CHART, BOARD);
  assert.equal(gridLines(board.svg).up.length, 0, 'a wide board zone keeps the chart that fills it');
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
