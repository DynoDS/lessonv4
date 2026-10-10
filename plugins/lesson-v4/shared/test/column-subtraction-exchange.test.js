'use strict';
// A column subtraction shows its exchanges on the sum itself.
//
// The run this came from: the Year 4 wall for column subtraction with more than
// one exchange (stress test of 7 October 2026). The drawing could not cross out
// a digit or write a small 1, so the wall listed "12 - 8 = 4" under a sum that
// showed 2 - 8, the six steps were left off, and a sentence tried to say what
// the picture did not. The teacher, shown the steps down a page (10 October):
// "way better, but for number one, I'd highlight the two takeaway in some way.
// And then on the second one, actually showing that on the place value chart
// too." These pin what is drawn, on every surface: which digit is crossed out,
// what is written above it, where the small 1 stands, and that the marks are
// worked out from the numbers and can never disagree with them.
const test = require('node:test');
const assert = require('node:assert/strict');
const chart = require('../visuals/place-value-chart-svg');
const { profileFor } = require('../visuals/surface-profiles');

const TWICE = { calculation: { operator: '-', numbers: ['5342', '2178'], answer: '3164', exchanges: [{ from: 'T', to: 'O' }, { from: 'H', to: 'T' }] } };
const ACROSS_ZERO = { calculation: { operator: '-', numbers: ['502', '178'], answer: '324', exchanges: [{ from: 'H', to: 'T' }, { from: 'T', to: 'O' }] } };
const PLAIN = { calculation: { operator: '-', numbers: ['5342', '2178'], answer: '3164' } };
const SURFACES = {
  slides: { widthPt: 5 * 72, heightPt: 3.6 * 72 },
  worksheets: { widthMm: 85 },
  wall: { widthMm: 255 },
  stickin: { widthMm: 85 },
};
const layout = (spec, surface = 'wall', extra = {}) => chart.describeLayout(spec, profileFor(surface, { ...SURFACES[surface], ...extra }));
const marksOf = (L, role) => L.texts.filter((t) => t.role === role).map((t) => [t.column, t.row, t.text]);

for (const surface of Object.keys(SURFACES)) {
  test(`${surface}: two exchanges cross out the 4 and the 3, write 3 and 2 above them, and make 12 ones and 13 tens`, () => {
    const L = layout(TWICE, surface);
    assert.deepEqual(L.strikes.map((s) => s.column), ['H', 'T'], 'the hundreds and tens digits are crossed out, the ones and thousands are not');
    assert.deepEqual(marksOf(L, 'exchange'), [['H', 'exchange', '2'], ['T', 'exchange', '3']]);
    assert.deepEqual(marksOf(L, 'exchange-one'), [['T', 'exchange', '1'], ['O', 'number', '1']], 'a small 1 in front of the 3 above the tens, and in front of the 2 ones');
  });

  test(`${surface}: the digit written above sits over its own crossed-out digit, inside the top number's cell`, () => {
    const L = layout(TWICE, surface);
    const top = L.rows.numbers[0];
    const cell = L.cells.find((c) => c.row === 'number' && c.column === 'T');
    const above = L.texts.find((t) => t.role === 'exchange' && t.column === 'T');
    const digit = L.texts.find((t) => t.role === 'digit' && t.row === 'number' && t.column === 'T');
    assert.ok(cell.y <= above.y + 0.01 && above.y + above.h <= top.y + 0.01, 'above the digits, below the top of the cell');
    assert.ok(Math.abs((above.x - digit.x)) < L.colW / 2, 'in the same column');
    assert.ok(above.pt < digit.pt, 'smaller than the digit it replaces');
    const strike = L.strikes.find((s) => s.column === 'T');
    assert.ok(strike.x1 < digit.x && digit.x < strike.x2 && strike.y2 < digit.y + digit.h / 2 && digit.y + digit.h / 2 < strike.y1, 'the line goes through the digit');
  });
}

test('an exchange across a zero: the 0 gets its small 1, then both are crossed out with a 9 above', () => {
  const L = layout(ACROSS_ZERO, 'worksheets');
  assert.deepEqual(marksOf(L, 'exchange'), [['H', 'exchange', '4'], ['T', 'exchange', '9']]);
  assert.deepEqual(marksOf(L, 'exchange-one'), [['T', 'number', '1'], ['O', 'number', '1']]);
  const one = L.texts.find((t) => t.role === 'exchange-one' && t.column === 'T');
  const strike = L.strikes.find((s) => s.column === 'T');
  assert.ok(strike.x1 < one.x, 'the crossing-out starts left of the small 1, so the 10 is crossed out whole');
});

test('the crossing-out is drawn over its digit, not under it', () => {
  const { svg } = chart.tightSvg(TWICE, profileFor('wall', SURFACES.wall));
  assert.ok(svg.lastIndexOf('<text') < svg.indexOf('stroke-linecap="round"'), 'every digit is drawn before the first crossing-out');
});

test('a subtraction with no exchanges is drawn exactly as before', () => {
  const L = layout(PLAIN);
  assert.deepEqual(L.strikes, []);
  assert.equal(L.rows.exchange, undefined);
  const cell = L.cells.find((c) => c.row === 'number' && c.column === 'T');
  assert.ok(Math.abs(cell.h - L.rows.numbers[0].h) < 0.01, 'the top number has no band above it');
  assert.ok(layout(TWICE).h > L.h, 'and the band is added only when there is an exchange to write in it');
});

test('each exchange can be given a colour of its own, and all its marks share it', () => {
  const L = layout({ calculation: { ...TWICE.calculation, exchanges: [{ from: 'T', to: 'O', colour: 'E46C0A' }, { from: 'H', to: 'T', colour: '#7030a0' }] } });
  const colourAt = (role, column) => L.texts.find((t) => t.role === role && t.column === column).fill;
  assert.equal(L.strikes.find((s) => s.column === 'T').stroke, '#E46C0A', 'first exchange: the crossed-out 4');
  assert.equal(colourAt('exchange', 'T'), '#E46C0A', 'the 3 above it');
  assert.equal(colourAt('exchange-one', 'O'), '#E46C0A', 'and the small 1 that makes 12 ones');
  assert.equal(L.strikes.find((s) => s.column === 'H').stroke, '#7030A0', 'second exchange: the crossed-out 3');
  assert.equal(colourAt('exchange-one', 'T'), '#7030A0', 'and the small 1 that makes 13 tens');
});

test('`ring` puts one ring round the digits being worked in a column', () => {
  const L = layout({ calculation: { ...PLAIN.calculation, answer: '', ring: 'O' } });
  assert.equal(L.rings.length, 1);
  const ring = L.rings[0];
  const [first, last] = [L.rows.numbers[0], L.rows.numbers[1]];
  assert.equal(ring.column, 'O');
  assert.ok(ring.y >= first.y && ring.y + ring.h <= last.y + last.h, 'round both numbers and not the answer');
});

test('exchanges that the numbers cannot make are refused in words that say what to do', () => {
  const sum = (calculation) => () => layout({ calculation });
  assert.throws(sum({ operator: '+', numbers: ['247', '135'], exchanges: [{ from: 'T', to: 'O' }] }), /crossings-out of a column subtraction.*`carry`/);
  assert.throws(sum({ operator: '-', numbers: ['5342', '2178'], exchanges: [{ from: 'H', to: 'O' }] }), /the column to its right/);
  assert.throws(sum({ operator: '-', numbers: ['502', '178'], exchanges: [{ from: 'T', to: 'O' }] }), /has none there yet. List the exchange INTO that column first/);
  assert.throws(sum({ operator: '-', numbers: ['5342', '2178'], ring: 'M' }), /`ring` names "M"/);
});

// The same ruling the same day, on a clock: a step's number on the face reads
// as one of the clock's own numbers, so the face names its numerals as places
// to point at and a surface stands the number outside.
test('a clock names its numerals, and not its hands, as places to point at', () => {
  const clock = require('../visuals/clock-svg');
  const { anchors } = clock.tightSvg({ time: '7:15' }, profileFor('wall', { widthMm: 150 }));
  const names = Object.keys(anchors.pointAt);
  assert.deepEqual(names, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `number ${n}`));
  const [x3] = anchors.pointAt['number 3'];
  const [x9] = anchors.pointAt['number 9'];
  assert.ok(x3 > 60 && x9 < 40, 'the 3 is on the right of the face and the 9 on the left');
  const pair = clock.tightSvg({ clocks: [{ time: '7:15' }, { time: '4:45' }] }, profileFor('wall', { widthMm: 300 }));
  assert.ok(pair.anchors.pointAt['clock 2 number 9'], 'in a row, each face names its own');
});

test('on the wall an exchange nobody coloured is orange, then purple, never the answer green', () => {
  const L = layout(TWICE, 'wall');
  assert.equal(L.strikes.find((s) => s.column === 'T').stroke, '#E46C0A');
  assert.equal(L.strikes.find((s) => s.column === 'H').stroke, '#7030A0');
  assert.equal(L.texts.find((t) => t.role === 'digit' && t.row === 'answer').fill, GREEN_ANSWER, 'the answer stays green');
  const board = layout(TWICE, 'slides');
  assert.equal(board.strikes[0].stroke, GREEN_ANSWER, 'the board keeps the worked colour it always had');
});
const GREEN_ANSWER = '#00B050';

test('a `pastTo` clock shades the right half and the left half, under its numerals and hands', () => {
  const clock = require('../visuals/clock-svg');
  const svg = (spec, surface) => clock.tightSvg(spec, profileFor(surface, { widthMm: 150 })).svg;
  const shaded = svg({ time: '7:15', pastTo: true }, 'wall');
  const halves = [...shaded.matchAll(/<path d="M [^"]+ A [^"]+ Z" fill="(#[0-9A-F]{6})"\/>/g)].map((m) => m[1]);
  assert.deepEqual(halves, ['#D9EAF8', '#FCE3CC'], 'past in pale blue, to in pale orange');
  assert.ok(shaded.indexOf('<path') < shaded.indexOf('<text'), 'drawn before the numerals, so they sit on top');
  assert.doesNotMatch(svg({ time: '7:15' }, 'wall'), /<path/, 'a plain clock is unchanged');
  assert.match(svg({ time: '7:15', pastTo: true }, 'worksheets'), /fill="#D9EAF8"/, 'the same face on the sheet');
});
