'use strict';

// A pupil sheet shows nothing in the answer colour.
//
// Green means "this is the answer" on the board and on the teacher's answer
// sheet (30 September 2026). The shared drawings painted a worked-out value
// green on every surface, so a Year 4 Greater Depth sheet of missing-digit
// subtractions printed the digits it GAVE the child in green and read as
// already marked (stress test, 7 October 2026). The teacher's rulings of
// 9 October 2026: every digit printed in a sum on a pupil sheet is black, a
// worked example stays purple, and a ring round a digit keeps its green with
// the digit inside it black.

const test = require('node:test');
const assert = require('node:assert/strict');
const { profileFor, answerColour, SHEET_COLOURING } = require('../visuals/surface-profiles');
const chart = require('../visuals/place-value-chart-svg');
const pyramid = require('../visuals/pyramid-svg');
const multGrid = require('../visuals/mult-grid-svg');
const tally = require('../visuals/tally-chart-svg');

const GREEN = /#00B050/i;
const PURPLE = /#7030A0/i;
const sheet = () => profileFor('worksheets', { widthMm: 170 });
const board = () => profileFor('slides', { widthPt: 600, heightPt: 400 });
const wall = () => profileFor('wall', { widthMm: 400 });

const MISSING_DIGIT = { calculation: { operator: '-', numbers: ['8452', '3 76'], answer: '45 6' } };

test('the one question every drawing asks', () => {
  assert.equal(answerColour(sheet(), 'green', 'ink'), 'ink');
  assert.equal(answerColour(SHEET_COLOURING, 'green', 'ink'), 'ink');
  for (const p of [board(), wall(), profileFor('stickin', { widthMm: 90 }), undefined, null]) {
    assert.equal(answerColour(p, 'green', 'ink'), 'green');
  }
  assert.equal(sheet().colours.answer, sheet().colours.ink, 'and the drawings that read the palette get the same answer');
  assert.match(board().colours.answer, GREEN);
});

test('a sum on a pupil sheet prints every digit in ink; the board and the wall keep the green answer', () => {
  const digits = (profile) => chart.describeLayout(MISSING_DIGIT, profile).texts.filter((t) => t.role === 'digit' || t.role === 'carry');
  const onSheet = digits(sheet());
  assert.ok(onSheet.some((t) => t.row === 'answer'), 'the answer row has printed digits');
  assert.deepEqual([...new Set(onSheet.map((t) => t.fill))], ['#000000']);
  assert.doesNotMatch(chart.tightSvg(MISSING_DIGIT, sheet()).svg, GREEN);
  for (const profile of [board(), wall()]) {
    const answer = digits(profile).filter((t) => t.row === 'answer');
    assert.ok(answer.length && answer.every((t) => GREEN.test(t.fill)));
  }
});

test('a worked example on a pupil sheet stays purple', () => {
  const worked = { calculation: { operator: '+', numbers: ['245', '138'], answer: '383', carry: { T: '1' }, worked: true } };
  const svg = chart.tightSvg(worked, sheet()).svg;
  assert.match(svg, PURPLE);
  assert.doesNotMatch(svg, GREEN);
});

test('a ringed digit on a pupil sheet is a green ring round an ink digit', () => {
  const ringed = { columns: ['H', 'T', 'O'], rows: [{ cells: ['3', '4', '5'], highlight: ['T'] }] };
  const onSheet = chart.describeLayout(ringed, sheet());
  assert.deepEqual([...new Set(onSheet.texts.filter((t) => t.role === 'digit').map((t) => t.fill))], ['#000000']);
  assert.equal(onSheet.rings.length, 1);
  assert.match(chart.tightSvg(ringed, sheet()).svg, GREEN, 'the ring is still green');
  const onBoard = chart.describeLayout(ringed, board());
  assert.ok(onBoard.texts.some((t) => t.picked && GREEN.test(t.fill)), 'on the board the ringed digit is green too');
});

test('a row marked as an answer in a place value chart is ink on a pupil sheet', () => {
  const revealed = { columns: ['H', 'T', 'O'], rows: [{ cells: ['3', '4', '5'] }, { cells: ['3', '5', '5'], answer: true }] };
  assert.doesNotMatch(chart.tightSvg(revealed, sheet()).svg, GREEN);
  assert.match(chart.tightSvg(revealed, board()).svg, GREEN);
});

test('a pyramid brick, a grid cell and a tally total marked as answers are ink on a pupil sheet', () => {
  const brick = { rows: [['||12'], ['5', '7']] };
  assert.doesNotMatch(pyramid.tightSvg(brick, sheet()).svg, GREEN);
  assert.match(pyramid.tightSvg(brick, board()).svg, GREEN);

  const cell = { colHeaders: ['9'], rowHeaders: ['3'], cells: [['||27']] };
  assert.doesNotMatch(multGrid.tightSvg(cell, sheet()).svg, GREEN);
  assert.match(multGrid.tightSvg(cell, board()).svg, GREEN);

  const totals = { headers: ['Pet', 'Tally', 'Total'], rows: [{ label: 'Cat', count: 4, total: '||4' }] };
  assert.doesNotMatch(tally.tightSvg(totals, SHEET_COLOURING).svg, GREEN);
});
