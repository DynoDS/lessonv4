'use strict';
// A written column calculation is set out the way the teacher teaches it.
//
// A Year 4 column addition deck (5 October 2026) drew every sum as a place value
// chart with "+" typed into a row caption. The teacher sent it back on four
// counts: the sign's column was wider than a digit's, the carried digit sat
// above the answer ("I teach answer 3rd row, what I carry 4th row"), the carry
// row was as tall as a row of digits, and every line was the same weight ("under
// the 2nd row the line should be thicker, and thicker under the answer: I teach
// children this is like a big equals sign"). The worksheet's own grid had the
// thick line and no colours, and a carry row too pale to print. `calculation`
// is the one drawing all of them place, and the rows are its to lay out.
const test = require('node:test');
const assert = require('node:assert/strict');
const chart = require('../visuals/place-value-chart-svg');
const { profileFor } = require('../visuals/surface-profiles');

const SUM = { calculation: { operator: '+', numbers: ['3426', '237'], answer: '3663', carry: { T: '1' } } };
const BLANK = { calculation: { operator: '+', numbers: ['3426', '237'] } };
const SURFACES = {
  slides: { widthPt: 5 * 72, heightPt: 3.6 * 72 },
  worksheets: { widthMm: 85 },
  wall: { widthMm: 255 },
  stickin: { widthMm: 85 },
};
const layout = (spec, surface = 'slides') => chart.describeLayout(spec, profileFor(surface, SURFACES[surface]));
const GREEN = '#00B050';
const PURPLE = '#7030A0';

for (const surface of Object.keys(SURFACES)) {
  test(`${surface}: the answer is the third row and the carried digit sits under it`, () => {
    const L = layout(SUM, surface);
    const { numbers, answer, carry } = L.rows;
    assert.ok(numbers[0].y < numbers[1].y && numbers[1].y < answer.y && answer.y < carry.y);
    const small = L.texts.filter((t) => t.role === 'carry');
    assert.deepEqual(small.map((t) => [t.column, t.text]), [['T', '1']]);
    assert.ok(Math.abs(small[0].y - carry.y) < 0.01, 'the carried digit is in the carry row');
  });

  test(`${surface}: the carry row is shallower than a row of digits, and its digit smaller`, () => {
    const L = layout(SUM, surface);
    assert.ok(L.rows.carry.h <= L.rows.answer.h * 0.6, `${L.rows.carry.h} against ${L.rows.answer.h}`);
    const small = L.texts.find((t) => t.role === 'carry');
    assert.ok(small.pt < L.D * 0.7);
  });

  test(`${surface}: two thick lines, under the last number and under the answer`, () => {
    const L = layout(SUM, surface);
    const heavy = L.lines.filter((l) => l.role === 'heavy-rule');
    assert.equal(heavy.length, 2);
    assert.ok(Math.abs(heavy[0].y1 - L.rows.answer.y) < 0.01);
    assert.ok(Math.abs(heavy[1].y1 - (L.rows.answer.y + L.rows.answer.h)) < 0.01);
    heavy.forEach((l) => {
      assert.ok(l.sw >= 3 * L.rule, 'thick enough to read as thick');
      assert.ok(l.x1 === 0 && Math.abs(l.x2 - L.chartW) < 0.01, 'across the whole calculation');
    });
  });

  test(`${surface}: the sign's column is narrower than a digit's`, () => {
    const L = layout(SUM, surface);
    assert.ok(L.labelW < L.colW * 0.7);
    const sign = L.texts.filter((t) => t.role === 'operator');
    assert.deepEqual(sign.map((t) => t.text), ['+']);
    assert.ok(Math.abs(sign[0].y - L.rows.numbers[1].y) < 0.01, 'beside the second number');
  });
}

test('the same column colours on the board, the sheet and the wall; ink on the stick-in', () => {
  const fills = (surface) => layout(BLANK, surface).cells.filter((c) => c.role === 'write').map((c) => c.fill);
  assert.deepEqual(fills('worksheets'), fills('slides'));
  assert.deepEqual(fills('wall'), fills('slides'));
  assert.equal(new Set(fills('slides')).size, 4, 'one colour per column');
  assert.deepEqual([...new Set(fills('stickin'))], ['#FFFFFF']);
});

test('a shorter number is lined up from the ones by the drawing', () => {
  const L = layout(BLANK);
  const second = L.texts.filter((t) => t.role === 'digit' && t.row === 'number' && Math.abs(t.y - L.rows.numbers[1].y) < 0.01);
  assert.deepEqual(second.map((t) => [t.column, t.text]), [['H', '2'], ['T', '3'], ['O', '7']]);
});

test('a blank answer prints nothing; a given one prints green; a worked one purple', () => {
  const worked = (L) => L.texts.filter((t) => t.row === 'answer' || t.role === 'carry');
  assert.equal(worked(layout(BLANK)).length, 0);
  assert.ok(worked(layout(SUM)).every((t) => t.fill === GREEN));
  const model = layout({ calculation: { ...SUM.calculation, worked: true } });
  assert.ok(model.texts.filter((t) => t.role !== 'heading').every((t) => t.fill === PURPLE));
});

test('subtraction has no carry row: an exchange is written above', () => {
  const L = layout({ calculation: { operator: '-', numbers: ['482', '157'] } });
  assert.equal(L.rows.carry, undefined);
  assert.equal(L.lines.filter((l) => l.role === 'heavy-rule').length, 2);
  assert.equal(L.texts.find((t) => t.role === 'operator').text, '−');
});

test('carry: false leaves the row out and keeps both thick lines', () => {
  const L = layout({ calculation: { operator: '+', numbers: ['324', '253'], answer: '577', carry: false } });
  assert.equal(L.rows.carry, undefined);
  assert.equal(L.lines.filter((l) => l.role === 'heavy-rule').length, 2);
});

test('on paper the cells a child writes in are square and stop at 15mm', () => {
  const L = chart.describeLayout(BLANK, profileFor('worksheets', { widthMm: 170 }));
  assert.ok(Math.abs(L.colW - L.rows.answer.h) < 0.01);
  assert.ok(L.colW <= 15 * (72 / 25.4) + 0.01);
});

test('the empty frame the class sets a calculation out in', () => {
  const L = layout({ columns: ['Hundreds', 'Tens', 'Ones'], calculation: { operator: '+', numbers: ['', ''] } });
  assert.equal(L.texts.filter((t) => t.role === 'digit').length, 0);
  assert.equal(L.rows.numbers.length, 2);
});

test('a number typed cell by cell stays where it was put, for a misalignment the class catches', () => {
  const L = layout({ columns: ['Th', 'H', 'T', 'O'], calculation: { numbers: ['3052', ['4', '0', '2', '']] } });
  const second = L.texts.filter((t) => t.row === 'number' && Math.abs(t.y - L.rows.numbers[1].y) < 0.01);
  assert.deepEqual(second.map((t) => t.column), ['Th', 'H', 'T']);
});

test('an answer wider than the columns given is refused by name', () => {
  assert.throws(
    () => chart.normalise({ columns: ['H', 'T', 'O'], calculation: { numbers: ['950', '70'], answer: '1020' } }),
    /PLACE_VALUE_CALCULATION_DOES_NOT_FIT/
  );
  assert.deepEqual(chart.normalise({ calculation: { numbers: ['950', '70'], answer: '1020' } }).columns, ['Th', 'H', 'T', 'O']);
});

test('a column sum typed as rows with a sign for a caption is refused, and told what to write', () => {
  const asRows = {
    columns: ['Hundreds', 'Tens', 'Ones'],
    rows: [{ cells: ['2', '4', '7'] }, { label: '+', cells: ['1', '3', '5'] }, { cells: ['', '¹', ''] }, { cells: ['3', '8', '2'] }],
  };
  assert.throws(() => chart.normalise(asRows), /PLACE_VALUE_CHART_IS_A_CALCULATION.*"calculation"/s);
});

test('a row captioned with words is still an ordinary chart', () => {
  const ok = { columns: ['Th', 'H', 'T', 'O'], rows: [{ label: '3,462', cells: ['3', '4', '6', '2'] }, { label: '10 more', cells: ['3', '4', '7', '2'] }] };
  assert.equal(chart.normalise(ok).form, 'rows');
});

// A step on the working wall points at the place it happens. The wall's first
// column sum (5 October 2026) had its step circles dropped on by eye: all five
// landed on the lines between the digits. So the sum names its places, each
// the box of what is written there.
test('a calculation names the places a step can point at, each on its own digit', () => {
  const drawn = chart.tightSvg(SUM, profileFor('wall', SURFACES.wall));
  const at = drawn.anchors.pointAt;
  for (const name of ['sign', 'ones heading', 'ones number 1', 'tens number 2', 'thousands answer', 'tens carry']) {
    assert.ok(Array.isArray(at[name]), `"${name}" is a place`);
  }
  const tens = drawn.layout.texts.find((t) => t.row === 'answer' && t.column === 'T');
  const [x, y] = at['tens answer'];
  assert.ok(Math.abs((x / 100) * drawn.w - (tens.x + 1.5)) < 0.5, 'across: the middle of the tens answer digit');
  assert.ok(Math.abs((y / 100) * drawn.h - (tens.y + tens.h / 2 + 1.5)) < 0.5, 'down: the middle of the tens answer digit');
  assert.equal(at['tens carry'][4], 1, 'the carried 1 is written');
  assert.equal(at['ones carry'][4], 0, 'nothing is carried into the ones');
});

test('an ordinary chart names no places to point at', () => {
  const drawn = chart.tightSvg({ columns: ['H', 'T', 'O'], rows: [['2', '4', '7']] }, profileFor('wall', SURFACES.wall));
  assert.equal(drawn.anchors, undefined);
});

test('the sign can be left blank, for a problem where the child chooses the operation', () => {
  // 7 October 2026: a Below sheet asked for an empty frame with the sign
  // position blank ("so the pupil chooses addition from altogether"). The
  // drawing always printed a sign, so the worksheet designer handed the whole
  // sheet back in five goes of six and the level was lost.
  const L = layout({ columns: ['Thousands', 'Hundreds', 'Tens', 'Ones'], calculation: { operator: '', numbers: ['', ''] } });
  assert.equal(L.texts.filter((t) => t.role === 'operator').length, 0);
  assert.equal(L.rows.numbers.length, 2);
  // Left out altogether it is still an addition, as it always was.
  const plus = layout({ calculation: { numbers: ['324', '253'] } });
  assert.equal(plus.texts.find((t) => t.role === 'operator').text, '+');
  assert.throws(() => layout({ calculation: { operator: '?', numbers: ['324', '253'] } }), /PLACE_VALUE_CALCULATION_INVALID/);
});
