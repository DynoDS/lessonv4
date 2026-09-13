'use strict';
// Counters can carry their value ("1000") so a child reads what each one is
// worth. Moved onto the shared chart (shared/visuals/place-value-chart-svg.js)
// on 13 September 2026; the properties the board's own chart held are held here.
const test = require('node:test');
const assert = require('node:assert/strict');
const { tightSvg, cacheKey, counterValue, labelledCounterGrid, describeLayout } = require('../../shared/visuals/place-value-chart-svg');
const { profileFor } = require('../../shared/visuals/surface-profiles');

const board = () => profileFor('slides', { widthPt: 7.8 * 72, heightPt: 2.8 * 72 });
const chart = () => ({ columns: ['Th', 'H', 'T', 'O'], rows: [{ cells: ['2', '4', '3', '5'], counters: { Th: 2, H: 4, T: 3, O: 5 }, counterLabels: true }] });

test('counters carry the correct value on every counter', () => {
  const { circles } = describeLayout(chart(), board());
  for (const [label, count] of [['1000', 2], ['100', 4], ['10', 3], ['1', 5]]) {
    assert.equal(circles.filter((c) => c.face === label).length, count);
  }
  assert.equal(circles.length, 14);
  for (const c of circles) assert.ok(c.pt >= 9, `a counter value printed at ${c.pt}pt`);
});

test('SVG values, zero placeholders and cache identity survive', () => {
  const data = chart();
  data.rows[0].counters.H = 0;
  data.rows[0].cells[1] = '0';
  const svg = tightSvg(data, board()).svg;
  assert.equal((svg.match(/>1000<\/text>/g) || []).length, 2);
  assert.equal((svg.match(/>100<\/text>/g) || []).length, 0);
  assert.match(svg, />0<\/text>/);
  const plain = structuredClone(data);
  delete plain.rows[0].counterLabels;
  assert.notEqual(cacheKey(data, board()), cacheKey(plain, board()));
  assert.doesNotMatch(tightSvg(plain, board()).svg, />1000<\/text>/);
});

test('plain chart does not gain labels', () => {
  const data = chart();
  delete data.rows[0].counterLabels;
  assert.equal(describeLayout(data, board()).circles.filter((c) => c.face).length, 0);
});

test('decimal values and full column names share the canonical value', () => {
  assert.equal(counterValue('Thousands'), '1000');
  assert.equal(counterValue('t'), '0.1');
  assert.equal(counterValue('h'), '0.01');
  assert.throws(() => counterValue('unknown'), /UNKNOWN_COLUMN/);
});

test('a label too small to read fails rather than shrinking silently', () => {
  assert.throws(() => labelledCounterGrid(0.2, 0.2, 9, '1000', 9, 1 / 72), /LABELS_DO_NOT_FIT/);
  // And the chart itself refuses a column too narrow for its counters' values.
  assert.throws(
    () => describeLayout(chart(), profileFor('slides', { widthPt: 2.0 * 72, heightPt: 2.8 * 72 })),
    /PLACE_VALUE_COUNTER_LABELS_DO_NOT_FIT|PLACE_VALUE_COUNTERS_TOO_SMALL/
  );
});

test('the sheet counter chart spelling draws counters with values and no digit row', () => {
  const layout = describeLayout({ columns: ['thousands', 'hundreds', 'tens', 'ones'], counts: { thousands: 2, tens: 9 } }, 'worksheets', { widthMm: 170 });
  assert.equal(layout.circles.length, 11);
  assert.ok(layout.circles.every((c) => c.face));
  assert.equal(layout.cells.filter((c) => c.role === 'digit' || c.role === 'write').length, 0);
  assert.deepEqual(layout.texts.filter((t) => t.role === 'heading').map((t) => t.text), ['Thousands', 'Hundreds', 'Tens', 'Ones']);
});
