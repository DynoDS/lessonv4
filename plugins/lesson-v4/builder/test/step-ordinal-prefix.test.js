'use strict';

// "1 stage 1: Say it or show it".
//
// The Year 4 friendships deck of 30 August 2026 (slides 8 and 9) carried the
// lesson design's planning labels straight into a steps helper: each item's
// text began "stage 1:", "stage 2:", "stage 3:", and the helper then drew its
// own number badge beside it, so children read the ordinal twice, once as a
// badge and once as words. Nothing rejected it. This validator does.

const test = require('node:test');
const assert = require('node:assert/strict');

const { validateLesson } = require('../src/validate');

function lessonWithSteps(steps) {
  return {
    title: 'Test lesson',
    slides: [
      {
        template: 'body-full',
        title: 'A safe response',
        body: { type: 'steps', steps }
      }
    ]
  };
}

function errorsFor(steps) {
  const { errors } = validateLesson(lessonWithSteps(steps), __dirname);
  return errors.filter((e) => /prints twice/.test(e));
}

test('a "stage N:" prefix inside step text is rejected', () => {
  const errors = errorsFor([
    'stage 1: Say it or show it, using Stop, No, or moving away if safe',
    'stage 2: Stop and listen',
    'stage 3: Get help'
  ]);
  assert.equal(errors.length, 3);
});

test('a "step N" or bare "1." ordinal prefix is rejected too', () => {
  assert.equal(errorsFor(['Step 1: Line up place values.']).length, 1);
  assert.equal(errorsFor(['1. Line up place values.']).length, 1);
  assert.equal(errorsFor(['(1) Line up place values.']).length, 1);
});

test('a step that merely begins with a number is untouched', () => {
  assert.equal(errorsFor(['10 ones become 1 ten.']).length, 0);
  assert.equal(errorsFor(['2p coins go first.']).length, 0);
  assert.equal(errorsFor(['Exchange if the top is smaller.']).length, 0);
});

test('object-form steps are checked the same way', () => {
  assert.equal(errorsFor([{ text: 'stage 1: Say it or show it' }]).length, 1);
  assert.equal(errorsFor([{ text: 'Say it or show it' }]).length, 0);
});
