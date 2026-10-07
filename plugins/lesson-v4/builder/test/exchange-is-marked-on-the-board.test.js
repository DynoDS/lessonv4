'use strict';

// The exchange, marked on the board's counters pair.
//
// The working wall's pair had its exchange marked first: the ten counters that
// go ringed as one group, the counter they become ringed, the arrow in the
// rings' green. The teacher saw it and said "the working wall is better yes,
// I'd want it on slides for sure" (6 October 2026). On the board the pair's
// arrow is long and carries the words, so the words turn green with it.
//
// What must hold on a slide: the marks are added and nothing else changes.
// The charts, the counters, the headings and the picture's own size are what
// they were, so no slide that fitted is refused and nothing moves; and a pair
// whose charts do not differ by one clean exchange is drawn exactly as before.

const test = require('node:test');
const assert = require('node:assert');

const { build } = require('../src/content/shared-figure');
const placeValueChart = require('../../shared/visuals/place-value-chart-svg');
const { profileFor } = require('../../shared/visuals/surface-profiles');

const GREEN = '#00B050';
const ZONE = { x: 0.4, y: 1.2, w: 12.5, h: 5 };
const pairOf = (from, to, columns = ['Hundreds', 'Tens', 'Ones'], operation = '10 tens = 1 hundred') => ({
  type: 'place-value-chart',
  columns,
  pair: { from: columns.map(() => ''), to: columns.map(() => ''), title: '', operation, counters: { from, to } },
});
const onTheBoard = (spec) => build('place-value-chart', ZONE, spec);
const marksOf = (layout) => layout.rings.filter((r) => /^exchange-/.test(r.role || ''));
const plain = (o) => JSON.stringify(o, (k, v) => (v instanceof Set ? [...v] : v));
// The same pair in the same box, drawn the way the board drew it before the marks.
const asBefore = (laid, spec) => placeValueChart.tightSvg(spec, profileFor('slides', { widthPt: laid.box.w * 72, heightPt: laid.box.h * 72 }));

test('a counters pair on a slide has its exchange ringed, and the arrow and its words turn green', () => {
  const spec = pairOf({ H: 3, T: 13, O: 6 }, { H: 4, T: 3, O: 6 });
  const layout = onTheBoard(spec).built.layout;
  const group = layout.rings.find((r) => r.role === 'exchange-group');
  const one = layout.rings.find((r) => r.role === 'exchange-one');
  assert.ok(group && one, 'the group and the counter it becomes are both ringed');
  const inside = (ring) => layout.circles.filter((c) => c.role === 'counter' && c.cx > ring.x && c.cx < ring.x + ring.w && c.cy > ring.y && c.cy < ring.y + ring.h);
  assert.deepEqual([inside(group).length, group.column, group.x < layout.chartW], [10, 'T', true], 'ten tens, in the chart before');
  assert.deepEqual([inside(one).length, one.column, one.x > layout.chartW], [1, 'H', true], 'one hundred, in the chart after');
  assert.equal(layout.polys[layout.polys.length - 1].fill, GREEN, 'the arrow is the rings\' green');
  const words = layout.texts.find((t) => t.role === 'operation');
  assert.equal(words.text, '10 tens = 1 hundred', 'the words stay on the arrow');
  assert.equal(words.fill, GREEN, 'and take its colour');
  assert.ok(words.pt >= 18, `at the board's floor or above (${words.pt.toFixed(1)}pt)`);
});

test('the marks are added and nothing else moves: charts, counters, headings and size are what they were', () => {
  for (const [from, to] of [[{ H: 3, T: 13, O: 6 }, { H: 4, T: 3, O: 6 }], [{ T: 5, O: 2 }, { T: 4, O: 12 }], [{ H: 4, T: 1 }, { H: 3, T: 11 }]]) {
    const columns = 'H' in from ? ['Hundreds', 'Tens', 'Ones'] : ['Tens', 'Ones'];
    const spec = pairOf(from, to, columns);
    const laid = onTheBoard(spec);
    const now = laid.built;
    const before = asBefore(laid, spec);
    assert.ok(marksOf(now.layout).length > 0, 'this pair is marked');
    assert.equal(now.w, before.w);
    assert.equal(now.h, before.h);
    assert.equal(now.layout.D, before.layout.D, 'the digits are the size they were');
    for (const part of ['cells', 'circles', 'bars']) assert.equal(plain(now.layout[part]), plain(before.layout[part]), `${part} are untouched`);
    const notWords = (layout) => layout.texts.filter((t) => t.role !== 'operation');
    assert.equal(plain(notWords(now.layout)), plain(notWords(before.layout)), 'every heading and digit is untouched');
    const wordsNow = now.layout.texts.find((t) => t.role === 'operation');
    const wordsBefore = before.layout.texts.find((t) => t.role === 'operation');
    assert.equal(wordsNow.pt, wordsBefore.pt, 'the arrow\'s words are the size they were');
  }
});

test('the arrow moves level with the ringed group only while its words stay inside the charts', () => {
  const spec = pairOf({ H: 3, T: 13, O: 6 }, { H: 4, T: 3, O: 6 });
  const layout = onTheBoard(spec).built.layout;
  const words = layout.texts.find((t) => t.role === 'operation');
  const header = layout.cells.find((c) => c.role === 'header');
  const bottom = Math.max(...layout.cells.map((c) => c.y + c.h));
  assert.ok(words.y >= header.y && words.y + words.h <= bottom, 'the words sit within the charts\' own height');
  const gapLeft = layout.chartW;
  const gapRight = layout.w - layout.chartW;
  for (const c of layout.circles.filter((k) => k.role === 'counter')) {
    assert.ok(c.cx + c.r <= gapLeft || c.cx - c.r >= gapRight, 'no counter stands in the strip the arrow and its words use');
  }
});

test('a pair with no clean exchange in it is drawn on the board exactly as it was', () => {
  const unmarked = [
    pairOf({ Th: 0, H: 8, T: 9, O: 0 }, { Th: 0, H: 9, T: 0, O: 0 }, ['Thousands', 'Hundreds', 'Tens', 'Ones'], '100 more'),
    pairOf({ H: 3, T: 13, O: 12 }, { H: 4, T: 4, O: 2 }),
    { type: 'place-value-chart', columns: ['Th', 'H', 'T', 'O'], pair: { operation: '10 more', from: ['3', '4', '6', '2'], to: ['3', '4', '7', '2'] } },
  ];
  for (const spec of unmarked) {
    const laid = onTheBoard(spec);
    assert.equal(laid.built.svg, asBefore(laid, spec).svg);
  }
});

test('a chart that is not a pair is untouched by the board asking for the marks', () => {
  const chart = { type: 'place-value-chart', columns: ['Hundreds', 'Tens', 'Ones'], rows: [{ cells: ['2', '6', '4'], counters: { H: 2, T: 6, O: 4 } }] };
  const sum = { type: 'place-value-chart', columns: ['Hundreds', 'Tens', 'Ones'], calculation: { operator: '+', numbers: ['264', '172'], answer: '436', carry: { H: '1' } } };
  for (const spec of [chart, sum]) {
    const laid = onTheBoard(spec);
    assert.equal(laid.built.svg, asBefore(laid, spec).svg);
  }
});
