'use strict';

// A line of words in a stack keeps only the height its words need and hands
// the rest back. With no photograph or fill card to take it, that height used
// to go to nobody: the items closed up and left a band of background under the
// last of them. A Year 4 column addition Your Turn printed the place value
// chart the class writes in at half the height of the same chart on the Our
// Turn, above more than an inch of nothing (5 October 2026). The stack now asks
// each drawing whether it would be drawn taller, and gives it what it would use.

const test = require('node:test');
const assert = require('node:assert/strict');
const { stackLayout } = require('../src/content/stack');

const ZONE = { x: 0.22, y: 0.60, w: 7.62, h: 6.43, class: 'E-wide' };
const CTX = { slideIndex: 0, lessonDir: __dirname, imageDims: {}, cardLook: true, lesson: {} };
const BOTTOM = ZONE.y + ZONE.h;

const LINE = { type: 'text', value: 'Use column addition.' };
const QUESTIONS = {
  type: 'numbered-questions',
  weight: 1.1,
  questions: [{ text: '[[231 + 426 =]]' }, { text: '[[342 + 215 =]]' }]
};
const CHART = {
  type: 'place-value-chart',
  columns: ['Hundreds', 'Tens', 'Ones'],
  calculation: { operator: '+', numbers: ['', ''] }
};

const layout = (items) => stackLayout(ZONE, { type: 'stack', items }, CTX);
const endOf = (laid) => laid[laid.length - 1].zone.y + laid[laid.length - 1].zone.h;
const weightShare = (items, i) => {
  const weights = items.map((it) => it.weight || 1);
  const total = weights.reduce((a, b) => a + b, 0);
  return (ZONE.h - 0.10 * (items.length - 1)) * weights[i] / total;
};

test('the chart under a line and its questions takes the height the line hands back', () => {
  const items = [LINE, QUESTIONS, CHART];
  const laid = layout(items);
  const share = weightShare(items, 2);
  assert.ok(laid[0].zone.h < weightShare(items, 0) - 1, 'the line hands back more than an inch, or this proves nothing');
  assert.ok(laid[2].zone.h > share + 1, `the chart has ${laid[2].zone.h.toFixed(2)}in; its weight alone gave ${share.toFixed(2)}in`);
  assert.ok(Math.abs(endOf(laid) - BOTTOM) < 0.01, `the stack ends at ${endOf(laid).toFixed(2)}in of ${BOTTOM.toFixed(2)}in`);
  assert.ok(Math.abs(laid[1].zone.h - weightShare(items, 1)) < 1e-6, 'the questions keep the share their weight gave');
});

test('other drawings are asked the same way, with no list of them kept', () => {
  for (const drawing of [
    { type: 'fraction-wall', rows: [1, 2, 4] },
    { type: 'part-whole-model', whole: '10', parts: ['3', '7'] },
    { type: 'blank-surface', surface: 'number-line' }
  ]) {
    const items = [LINE, drawing];
    const laid = layout(items);
    assert.ok(laid[1].zone.h > weightShare(items, 1) + 1, `${drawing.type} has ${laid[1].zone.h.toFixed(2)}in`);
  }
});

test('a drawing takes only what it would be drawn in, and stops where it stops growing', () => {
  // Alone under the line the chart reaches its largest print before the bottom
  // of the zone, and takes no more than that.
  const items = [LINE, CHART];
  const laid = layout(items);
  assert.ok(laid[1].zone.h > weightShare(items, 1) + 0.3, 'it grew');
  assert.ok(endOf(laid) < BOTTOM - 0.5, 'and stopped short of the bottom, at the size it stops growing');
});

test('a drawing held by its width is left alone', () => {
  // A number line is as long as its zone is wide; more height draws it no bigger.
  const items = [LINE, { type: 'numberline', min: 0, max: 10, step: 1 }];
  const laid = layout(items);
  assert.ok(Math.abs(laid[1].zone.h - weightShare(items, 1)) < 1e-6, `the number line has ${laid[1].zone.h.toFixed(2)}in`);
});

test('words and cards are never stretched into the spare height', () => {
  for (const words of [QUESTIONS, { type: 'table', headers: ['a', 'b'], rows: [['1', '2'], ['3', '4']] }]) {
    const items = [LINE, words];
    const laid = layout(items);
    assert.ok(Math.abs(laid[1].zone.h - weightShare(items, 1)) < 1e-6, `${words.type} has ${laid[1].zone.h.toFixed(2)}in`);
  }
});
