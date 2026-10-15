'use strict';
// What each row of a long multiplication IS.
//
// The teacher looked at the finished 24 x 36 (14 October 2026) and could not
// tell what the rows were. Every UK scheme explains it as parts: 24 x 36 is
// 24 x 6 plus 24 x 30, each row one of those parts. Each digit of the
// multiplier now shares a colour with the row it makes, and each row says what
// it is in one of the two looks he chose from mock-ups: a label at its left
// ("labelled", for practice, answers and paper) or a sentence beside it
// ("explained", for modelling the method).
const test = require('node:test');
const assert = require('node:assert/strict');
const chart = require('../visuals/place-value-chart-svg');
const { profileFor } = require('../visuals/surface-profiles');
const { textWidthEm } = require('../text/comic-glyph-width');

const sum = (extra, numbers = ['24', '36']) => ({ calculation: { operator: 'x', numbers, ...extra } });
const SURFACES = {
  slides: { widthPt: 9 * 72, heightPt: 5.2 * 72 },
  worksheets: { widthMm: 85 },
  wall: { widthMm: 300 },
  stickin: { widthMm: 110 },
};
const layout = (spec, surface = 'slides') => chart.describeLayout(spec, profileFor(surface, SURFACES[surface]));
const textsOf = (L, role) => L.texts.filter((t) => t.role === role);
const inkAt = (L, row, column, y) => L.texts.find((t) => t.row === row && t.column === column && Math.abs(t.y - y) < 0.01).fill;
// Each row in its place's own colour, the colour `((ones))` and `((tens))`
// give the same words in a success criterion; the total in answer green.
const ONES = chart.SAME_COLOURS.O;
const TENS = chart.SAME_COLOURS.T;
const HUNDREDS = chart.SAME_COLOURS.H;
const BLUE = '#0070C0';
const PURPLE = '#7030A0';
const GREEN = '#00B050';

test('labelled is the look when none is asked for: "× 6", "× 30" and "add" at the left', () => {
  const L = layout(sum({ upTo: 'total' }));
  assert.deepEqual(textsOf(L, 'row-label').map((t) => t.text), ['× 6', '× 30', 'add']);
  assert.deepEqual(textsOf(L, 'row-label').map((t) => t.fill), [ONES, TENS, GREEN]);
  assert.equal(textsOf(L, 'say').length, 0, 'no sentences');
  const label = textsOf(L, 'row-label')[1];
  assert.ok(label.x - (textWidthEm(label.text, true) * label.pt) / 2 > 1, 'the label sits inside its cell');
  assert.ok(label.x + (textWidthEm(label.text, true) * label.pt) / 2 < L.labelW - 1, 'clear of the rule on its right');
});

test('each digit of the multiplier is the colour of its row, the place-holder zero included', () => {
  const L = layout(sum({ upTo: 'total' }));
  const [ones, tens] = L.rows.partials;
  assert.equal(inkAt(L, 'number', 'O', L.rows.numbers[1].y), ONES);
  assert.equal(inkAt(L, 'number', 'T', L.rows.numbers[1].y), TENS);
  assert.equal(inkAt(L, 'number', 'O', L.rows.numbers[0].y), '#000000', 'the top number stays black');
  assert.equal(inkAt(L, 'partial', 'H', ones.y), ONES);
  assert.equal(inkAt(L, 'partial', 'O', tens.y), TENS, "the zero is its row's colour");
  assert.equal(inkAt(L, 'answer', 'O', L.rows.answer.y), GREEN);
});

test('the row under the total is left out when the addition carries nothing', () => {
  assert.equal(layout(sum({ upTo: 'total' })).rows.carry, undefined, '144 + 720 carries nothing');
  assert.equal(layout(sum({ upTo: 'set out' })).rows.carry, undefined, 'and the frame matches its finished sum');
  assert.ok(layout(sum({ upTo: 'total' }, ['3152', '46'])).rows.carry, '18,912 + 126,080 carries, so the row stays');
  assert.ok(layout({ columns: ['Th', 'H', 'T', 'O'], ...sum({ partials: 2 }, ['', '']) }).rows.carry, 'a frame with no numbers keeps it');
});

test('explained: each row has its sentence and its small line, in its colour', () => {
  const L = layout(sum({ upTo: 'total', look: 'explained' }));
  assert.deepEqual(textsOf(L, 'say').map((t) => t.text), ['24 × 6 = 144', '24 × 30 = 720', '144 + 720 = 864']);
  assert.deepEqual(textsOf(L, 'say').map((t) => t.fill), [ONES, TENS, GREEN]);
  assert.deepEqual(textsOf(L, 'say-note').map((t) => t.text), ['the 6 ones', 'the 3 tens, so a 0 goes in first', 'add the two rows']);
  assert.equal(textsOf(L, 'row-label').length, 0, 'no labels beside the sentences');
  assert.ok(textsOf(L, 'say').every((t) => t.x > L.chartW), 'beside the grid');
  assert.equal(L.lines.filter((l) => l.role === 'say-arrow').length, 3);
  assert.ok(L.w <= SURFACES.slides.widthPt && L.h <= SURFACES.slides.heightPt);
});

test('explained: a sentence gives no answer until its row is written', () => {
  const says = (upTo) => textsOf(layout(sum({ upTo, look: 'explained' })), 'say').map((t) => t.text);
  assert.deepEqual(says('set out'), ['24 × 6 =', '24 × 30 =', 'add the two rows']);
  assert.deepEqual(says('ones row'), ['24 × 6 = 144', '24 × 30 =', 'add the two rows']);
  assert.deepEqual(says('tens zero'), ['24 × 6 = 144', '24 × 30 =', 'add the two rows']);
  assert.deepEqual(says('tens row'), ['24 × 6 = 144', '24 × 30 = 720', '144 + 720 =']);
});

test('explained: the slides of one build are one size, so they line up', () => {
  const sizes = ['set out', 'ones row', 'tens zero', 'tens row', 'total'].map((upTo) => {
    const L = layout(sum({ upTo, look: 'explained' }));
    return [L.D, L.w, L.h, L.colW].map((v) => v.toFixed(2)).join();
  });
  assert.equal(new Set(sizes).size, 1);
});

test('explained: rows written by hand never have their answers said for them', () => {
  const L = layout(sum({ partials: ['18912', '12608'], answer: '31520', worked: true, look: 'explained' }, ['3152', '46']));
  assert.deepEqual(textsOf(L, 'say').map((t) => t.text), ['3,152 × 6 =', '3,152 × 40 =', 'add the two rows']);
});

test('a three-digit multiplier: a purple hundreds row with two zeros first', () => {
  const L = layout(sum({ upTo: 'total', look: 'explained' }, ['312', '124']), 'wall');
  assert.equal(textsOf(L, 'say')[2].text, '312 × 100 = 31,200');
  assert.equal(textsOf(L, 'say')[2].fill, HUNDREDS);
  assert.equal(textsOf(L, 'say-note')[2].text, 'the 1 hundred, so two 0s go in first');
  assert.equal(textsOf(L, 'say')[3].text, '1,248 + 6,240 + 31,200 = 38,688');
  assert.deepEqual(textsOf(layout(sum({ upTo: 'total' }, ['312', '124'])), 'row-label').map((t) => t.text), ['× 4', '× 20', '× 100', 'add']);
});

test('paper is always the labelled look, and a pupil sheet prints the written digits black', () => {
  for (const surface of ['worksheets', 'stickin']) {
    const L = layout(sum({ upTo: 'ones row', look: 'explained' }), surface);
    assert.equal(textsOf(L, 'say').length, 0, surface);
    assert.deepEqual(textsOf(L, 'row-label').map((t) => t.text), ['× 6', '× 30', 'add'], surface);
  }
  const sheet = layout(sum({ upTo: 'ones row' }), 'worksheets');
  assert.ok(sheet.texts.filter((t) => t.row === 'partial').every((t) => t.fill === '#000000'), 'given ink on a sheet');
  assert.equal(textsOf(sheet, 'row-label')[0].fill, ONES, 'the label keeps its colour');
  assert.ok(textsOf(layout(sum({ upTo: 'set out' }), 'stickin'), 'row-label').every((t) => t.fill === '#1A1A1A'), 'ink on a photocopy');
});

test('a worksheet asks for room for the labels, so the write-in squares stay full size', () => {
  const spec = { headings: false, ...sum({ upTo: 'set out' }, ['3152', '46']) };
  const width = chart.minWidthPt(spec, 'worksheets');
  const L = chart.describeLayout(spec, profileFor('worksheets', { widthPt: width }));
  assert.ok((L.colW / 72) * 25.4 >= 10 - 0.01, `${((L.colW / 72) * 25.4).toFixed(1)}mm`);
});

test("a colour a surface gives a row reaches its label and its multiplier digit", () => {
  const L = layout(sum({ upTo: 'ones row', colours: { 'ones row': '0070C0', 'tens row': '7030A0' } }), 'wall');
  assert.deepEqual(textsOf(L, 'row-label').slice(0, 2).map((t) => t.fill), [BLUE, PURPLE]);
  assert.equal(inkAt(L, 'number', 'T', L.rows.numbers[1].y), PURPLE);
});

test('explained in a zone too narrow for its sentences is refused with the width it needs', () => {
  assert.throws(
    () => chart.describeLayout(sum({ upTo: 'tens zero', look: 'explained' }, ['2314', '32']), profileFor('slides', { widthPt: 7.5 * 72, heightPt: 5 * 72 })),
    /PLACE_VALUE_CHART_TOO_NARROW: this long multiplication explained.*needs \d+\.\d\din of width/
  );
  assert.throws(() => chart.normalise(sum({ upTo: 'total', look: 'fancy' })), /"explained".*"labelled"/);
});

test('explained: every sentence is level with its row and its arrow', () => {
  for (const upTo of ['set out', 'total']) {
    const L = layout(sum({ upTo, look: 'explained' }));
    const rows = L.rows.partials.concat(L.rows.answer);
    textsOf(L, 'say').forEach((t, k) => {
      const mid = rows[k].y + rows[k].h / 2;
      assert.ok(Math.abs(t.y + t.h / 2 - mid) < 0.5, `${upTo}: "${t.text}" is level with its row`);
    });
  }
});

test("on a slide the sentences and their small lines print at the board's 20pt label size", () => {
  // Beside a success criteria panel (the zone maths-turn-sc gives its picture)
  // the small lines had sat at the 18pt floor, too small from the back.
  const beside = chart.describeLayout(sum({ upTo: 'tens zero', look: 'explained' }), profileFor('slides', { widthPt: 7.5 * 72, heightPt: 5.2 * 72 }));
  for (const role of ['say', 'say-note']) assert.ok(textsOf(beside, role).every((t) => t.pt >= 20 - 0.01), role);
  // A sum that needs the room falls to 18pt before it is refused, never under.
  const tight = chart.describeLayout(sum({ upTo: 'tens zero', look: 'explained' }, ['342', '27']), profileFor('slides', { widthPt: 7.5 * 72, heightPt: 5.2 * 72 }));
  assert.ok(textsOf(tight, 'say-note').every((t) => t.pt >= 18 - 0.01));
});

test("a row's colour is the colour a success criterion gives its place", () => {
  const { criteriaSegments } = require('../text/criteria-marks');
  const L = layout(sum({ upTo: 'total', look: 'explained' }));
  const [ones, tens] = criteriaSegments('Multiply by the ((ones)) digit, then the ((tens)) digit.').filter((x) => x.mark === 'picture').map((x) => x.colour);
  assert.deepEqual(textsOf(L, 'say').slice(0, 2).map((t) => t.fill), [ones, tens]);
});

test('labels never squeeze the columns under their digits and headings: too narrow is refused', () => {
  // The wall tries narrower and narrower layouts to fit a room, and took one
  // where "TTh" and "Th" ran together beside the labels (14 October 2026).
  const narrow = () => chart.describeLayout(sum({ upTo: 'total' }, ['2314', '32']), profileFor('wall', { widthMm: 60 }));
  assert.throws(narrow, /PLACE_VALUE_CHART_TOO_NARROW/);
  assert.doesNotThrow(() => layout(sum({ upTo: 'total' }, ['2314', '32']), 'wall'));
});
