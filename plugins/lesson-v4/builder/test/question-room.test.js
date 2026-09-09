'use strict';

// A Year 4 comparison deck printed its tasks at 19pt from a 28pt setting, with
// a band of empty board underneath. Two separate causes, both general:
//
//   1. the question height measure never looked at line breaks, so any
//      multi-line task was sized for a single line and then squeezed to fit;
//   2. room the visual could not use had nowhere to go, because a layout
//      container could not say how much of its zone it actually wanted.

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  measureQuestionsHeight,
  largestQuestionFont,
} = require('../src/templates/maths-turn');
const { measureCompositionExtent } = require('../src/content');

const TWO_LINE = 'Write <, > or =.\n3,406 ○ 2,406';
const THREE_LINE = 'Write <, > or =.\n3,406 ○ 3,460\n3,406 ○ 3,406';
const ONE_LINE = 'Write <, > or =.';

test('the question measure counts the lines the task was written with', () => {
  const one = measureQuestionsHeight([ONE_LINE], 7.99, null, {});
  const two = measureQuestionsHeight([TWO_LINE], 7.99, null, {});
  const three = measureQuestionsHeight([THREE_LINE], 7.99, null, {});

  assert.ok(two > one * 1.5, `a two-line task measured ${two.toFixed(2)}in against one line's ${one.toFixed(2)}in`);
  assert.ok(three > two, 'a three-line task measured no taller than a two-line one');
});

test('a single-line task measures exactly as it always did', () => {
  // The fix must not move the slides that were already right.
  assert.equal(measureQuestionsHeight([ONE_LINE], 7.99, null, {}).toFixed(3), '0.698');
});

test('a task grows into height it is given, and never below the ordinary size', () => {
  const roomy = largestQuestionFont([TWO_LINE], 7.99, 1.95, {});
  const tight = largestQuestionFont([TWO_LINE], 7.99, 0.40, {});

  assert.ok(roomy > 28, `a task with room to spare stayed at ${roomy}pt`);
  assert.equal(tight, 28, 'a task with no room was pushed below the ordinary size');
});

test('a container reports how much of its zone it actually wants', () => {
  const composition = {
    type: 'stack',
    items: [
      { type: 'text', value: 'Th = thousands   H = hundreds', weight: 0.3 },
      {
        type: 'row',
        weight: 1.05,
        items: [
          { type: 'place-value-chart', columns: ['Th', 'H', 'T', 'O'],
            rows: [{ label: '3,406', cells: ['3', '4', '0', '6'] }] },
          { type: 'comparison-slot' },
          { type: 'place-value-chart', columns: ['Th', 'H', 'T', 'O'],
            rows: [{ label: '2,406', cells: ['2', '4', '0', '6'] }] },
        ],
      },
    ],
  };

  const zone = { x: 0.22, y: 2.0, w: 7.99, h: 4.5, class: 'C' };
  const wanted = measureCompositionExtent(zone, composition, { slideIndex: 0, cardLook: true });

  assert.ok(wanted, 'a measurable composition reported nothing');
  assert.ok(wanted.h < zone.h, 'the composition claimed the whole zone');
  assert.ok(wanted.h > 1.5, `the composition under-reported at ${wanted.h.toFixed(2)}in`);
});

test('a composition holding anything unmeasurable says nothing at all', () => {
  // Under-reporting would hand away room the content itself needs, so an
  // unmeasured item makes the whole composition decline to answer.
  const zone = { x: 0, y: 0, w: 8, h: 4.5, class: 'C' };
  const wanted = measureCompositionExtent(
    zone,
    { type: 'row', items: [{ type: 'comparison-slot' }, { type: 'bar-chart', bars: [] }] },
    { slideIndex: 0, cardLook: true }
  );
  assert.equal(wanted, null);
});
