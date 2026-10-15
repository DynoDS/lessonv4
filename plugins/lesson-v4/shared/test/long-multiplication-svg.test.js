'use strict';
// Long multiplication is the written column calculation with rows of working.
//
// A Year 5 lesson (stress test, 7 October 2026) could draw the method only on
// its worksheet. The board's column sum had one answer row, so both models of
// the whole method were an empty box the teacher wrote in by hand, and the
// wall could put up one row of a five-step method. The sheet's own grid put
// the answer's first digit under the multiplication sign where the board gives
// it a column. `calculation` now holds the rows of working, works them out
// from the two numbers, and shows them as far as a named stage, so the board
// can reveal the method a move at a time (the teacher, 7 October 2026: "I love
// that the answers were one after the other in column method visual").
const test = require('node:test');
const assert = require('node:assert/strict');
const chart = require('../visuals/place-value-chart-svg');
const { profileFor } = require('../visuals/surface-profiles');

const sum = (extra, numbers = ['3152', '46']) => ({ calculation: { operator: 'x', numbers, ...extra } });
const SURFACES = {
  slides: { widthPt: 6 * 72, heightPt: 5.2 * 72 },
  worksheets: { widthMm: 85 },
  wall: { widthMm: 255 },
  stickin: { widthMm: 110 },
};
const layout = (spec, surface = 'slides') => chart.describeLayout(spec, profileFor(surface, SURFACES[surface]));
const written = (L, row) => L.texts.filter((t) => t.row === row).map((t) => t.text).join('');
const rowsOf = (spec) => {
  const c = chart.normalise(spec).calculation;
  return { partials: c.partials.map((p) => p.cells.join('')), carries: c.partials.map((p) => p.carry.join('')), answer: c.answer.join(''), carry: c.carry.join('') };
};

test('the drawing works the rows, the total and every carried digit out from the two numbers', () => {
  // 3,152 x 6: 12 (carry 1), 31 (carry 3), 9, 18. 3,152 x 40: 8, 20 (carry 2), 6, 12.
  const done = rowsOf(sum({ upTo: 'total' }));
  assert.deepEqual(done.partials, ['18912', '126080']);
  assert.deepEqual(done.carries, ['31', '2']);
  assert.equal(done.answer, '144992');
  assert.equal(done.carry, '1');
  const c = chart.normalise(sum({ upTo: 'total' }));
  assert.deepEqual(c.columns, ['HTh', 'TTh', 'Th', 'H', 'T', 'O'], 'a column for every digit of the answer');
  assert.deepEqual(c.calculation.partials[0].carry, ['', '', '', '3', '1', '']);
  assert.deepEqual(c.calculation.partials[1].carry, ['', '', '2', '', '', '']);
  assert.deepEqual(c.calculation.carry, ['', '1', '', '', '', '']);
});

test('`upTo` shows the working as far as one stage, so a run of slides grows the method', () => {
  const at = (upTo) => rowsOf(sum({ upTo }));
  assert.deepEqual(at('set out').partials, ['', '']);
  assert.deepEqual(at('ones row').partials, ['18912', '']);
  assert.deepEqual(at('tens zero').partials, ['18912', '0'], 'the new row holds only its place-holder zero');
  assert.deepEqual(at('tens row').partials, ['18912', '126080']);
  assert.equal(at('tens row').answer, '');
  assert.equal(at('total').answer, '144992');
  // The columns never move as the working grows, so slides in a run line up.
  const cols = ['set out', 'ones row', 'tens zero', 'tens row', 'total'].map((upTo) => chart.normalise(sum({ upTo })).columns.join());
  assert.equal(new Set(cols).size, 1);
});

test('a three-digit multiplier has three rows, the third beginning with two zeros', () => {
  const c = chart.normalise(sum({ upTo: 'hundreds zero' }, ['312', '124'])).calculation;
  assert.deepEqual(c.partials.map((p) => p.cells.join('')), ['1248', '6240', '00']);
  assert.equal(rowsOf(sum({ upTo: 'total' }, ['312', '124'])).answer, '38688');
});

test('a stage this multiplication does not have is refused with the stages it does', () => {
  assert.throws(() => chart.normalise(sum({ upTo: 'hundreds row' })), /not a stage of this long multiplication.*"set out", "ones row", "tens zero", "tens row", "total"/);
  assert.throws(() => chart.normalise(sum({ upTo: 'total', answer: '144992' })), /leave `partials`, `answer` and `carry` out/);
  assert.throws(() => chart.normalise({ calculation: { operator: '+', numbers: ['31', '46'], upTo: 'total' } }), /long multiplication, so the operator is "x"/);
  assert.throws(() => chart.normalise(sum({ upTo: 'total' }, ['345', '6'])), /one-digit multiplier give `answer`/);
});

test('rows written by hand draw as written, for a mistake the class inspects', () => {
  const spec = sum({ partials: ['18912', { answer: '12608', carry: { H: '2' } }], answer: '31520', worked: true });
  const c = chart.normalise(spec).calculation;
  assert.deepEqual(c.partials.map((p) => p.cells.join('')), ['18912', '12608']);
  assert.deepEqual(c.partials[1].carry, ['', '', '', '2', '', '']);
  const L = layout(spec);
  assert.ok(L.texts.filter((t) => t.row === 'partial').every((t) => t.fill === '#7030A0'), 'worked purple');
});

test('`partials: 2` with empty numbers is the frame a class sets a multiplication out in', () => {
  const spec = { columns: ['TTh', 'Th', 'H', 'T', 'O'], calculation: { operator: 'x', numbers: ['', ''], partials: 2 } };
  const L = layout(spec);
  assert.equal(L.rows.partials.length, 2);
  assert.deepEqual(L.texts.filter((t) => t.role === 'digit').map((t) => t.text), []);
});

for (const surface of Object.keys(SURFACES)) {
  test(`${surface}: numbers, the working, the total, each carried digit under its own row`, () => {
    const L = layout(sum({ upTo: 'total' }), surface);
    const { numbers, partials, answer, carry } = L.rows;
    const order = [numbers[0], numbers[1], partials[0], partials[0].carry, partials[1], partials[1].carry, answer, carry];
    order.forEach((r, i) => { if (i) assert.ok(r.y >= order[i - 1].y + order[i - 1].h - 0.01, `row ${i} follows row ${i - 1}`); });
    assert.equal(written(L, 'partial'), '18912126080');
    assert.equal(written(L, 'partial-carry'), '312');
    assert.equal(written(L, 'answer'), '144992');
    partials.forEach((p) => assert.ok(p.carry.h <= p.h * 0.6, 'a carry row is shallow'));
    assert.ok(Math.abs(order[order.length - 1].y + order[order.length - 1].h - L.h) < 0.01, 'cropped to the last row');
  });

  test(`${surface}: three thick lines, under the numbers, under the working and under the total`, () => {
    const L = layout(sum({ upTo: 'total' }), surface);
    const heavy = L.lines.filter((l) => l.role === 'heavy-rule').map((l) => l.y1);
    const { partials, answer } = L.rows;
    assert.equal(heavy.length, 3);
    assert.ok(Math.abs(heavy[0] - partials[0].y) < 0.01);
    assert.ok(Math.abs(heavy[1] - answer.y) < 0.01);
    assert.ok(Math.abs(heavy[2] - (answer.y + answer.h)) < 0.01);
  });

  test(`${surface}: every digit sits inside its own cell`, () => {
    const L = layout(sum({ upTo: 'total' }, ['4326', '52']), surface);
    L.texts.filter((t) => t.row).forEach((t) => {
      const cell = L.cells.find((c) => c.row === t.row && c.column === t.column && Math.abs(c.y - t.y) < 0.01 + (c.h - t.h));
      assert.ok(cell, `${t.row} ${t.column} has a cell`);
      assert.ok(t.pt <= cell.h, `${t.row} ${t.column}: ${t.pt}pt in a ${cell.h}pt row`);
      assert.ok(t.x > cell.x && t.x < cell.x + cell.w);
    });
  });
}

test('on paper a row of working is a square a child writes one digit in', () => {
  const L = layout(sum({ upTo: 'set out' }), 'worksheets');
  const mm = (pt) => (pt / 72) * 25.4;
  assert.ok(mm(L.colW) >= 10 - 0.01 && mm(L.colW) <= 12 + 0.01, `${mm(L.colW)}mm`);
  L.rows.partials.forEach((p) => assert.ok(Math.abs(p.h - L.colW) < 0.01, 'square'));
  assert.equal(L.cells.filter((c) => c.role === 'write' && c.row === 'partial').length, 12);
});

test('a slide refuses a zone too short for the rows at a size the room reads', () => {
  assert.throws(
    () => chart.describeLayout(sum({ upTo: 'total' }), profileFor('slides', { widthPt: 6 * 72, heightPt: 2.5 * 72 })),
    /PLACE_VALUE_CHART_DOES_NOT_FIT.*2 rows of working/
  );
});

test('the ring is round the one digit being multiplied by', () => {
  const L = layout(sum({ upTo: 'tens row', ring: 'T' }));
  const [ring] = L.rings;
  const second = L.rows.numbers[1];
  assert.ok(ring.y >= second.y && ring.y + ring.h <= second.y + second.h, 'inside the second number only');
});

test('a stage can be given its own ink, and the place-holder zero is a stage', () => {
  const colours = { 'ones row': '0070C0', 'tens zero': 'E46C0A', 'tens row': '7030A0', total: 'C2185B' };
  const L = layout(sum({ upTo: 'total', colours }), 'wall');
  const ink = (row, column, y) => L.texts.find((t) => t.row === row && t.column === column && Math.abs(t.y - y) < 0.01).fill;
  const [ones, tens] = L.rows.partials;
  assert.equal(ink('partial', 'O', ones.y), '#0070C0');
  assert.equal(ink('partial', 'O', tens.y), '#E46C0A', 'the zero keeps its own colour');
  assert.equal(ink('partial', 'T', tens.y), '#7030A0');
  assert.equal(ink('partial-carry', 'Th', tens.carry.y), '#7030A0');
  assert.equal(ink('answer', 'O', L.rows.answer.y), '#C2185B');
});

test('a step can point at any place in the working by name', () => {
  const out = chart.tightSvg(sum({ upTo: 'total' }), profileFor('wall', SURFACES.wall));
  ['ones row 1', 'ones row 2', 'hundreds row 1 carry', 'hundred thousands row 2', 'ones answer', 'ten thousands carry'].forEach((name) => {
    assert.ok(Array.isArray(out.anchors.pointAt[name]), name);
  });
  assert.equal(out.anchors.pointAt['ones row 2'][4], 1, 'the zero is written');
});

test('a surface can ask how far a long multiplication has been worked', () => {
  assert.deepEqual(chart.longMultiplicationProgress({ operator: 'x', numbers: ['3152', '46'], upTo: 'tens zero' }),
    { stages: ['set out', 'ones row', 'tens zero', 'tens row', 'total'], at: 2 });
  assert.equal(chart.longMultiplicationProgress({ operator: '+', numbers: ['31', '46'], answer: '77' }), null);
});

test('a short multiplication, and every other calculation, is drawn as it was', () => {
  const L = layout({ calculation: { operator: 'x', numbers: ['345', '6'], answer: '2070', carry: { T: '3', H: '2' } }, columns: ['Th', 'H', 'T', 'O'] });
  assert.equal(L.rows.partials, undefined);
  assert.equal(L.lines.filter((l) => l.role === 'heavy-rule').length, 2);
  assert.equal(chart.normalise({ calculation: { operator: 'x', numbers: ['345', '6'] } }).columns.join(), 'H,T,O');
});
