'use strict';

// A My Turn shown happening moves only the pieces; the written sum stays as it
// was set so the teacher writes on it. The teacher, 19 October 2026, after
// teaching from a run whose sum filled itself: "I couldn't really write over
// it" while the counters moved.

const test = require('node:test');
const assert = require('node:assert/strict');
const happening = require('../../shared/visuals/exchange-happening-svg');

const BOX = { widthPt: 960, heightPt: 400 };
const answerDigits = (svg) => (svg.match(/>3,?997<|>[79]</g) || []).length;

test('left as it is, the sum fills itself as the pieces move', () => {
  const steps = happening.stepsFor({ operator: '-', numbers: ['4003', '6'] });
  const last = happening.tightSvg({ operator: '-', numbers: ['4003', '6'], step: steps.length - 1 }, 'slides', BOX);
  assert.ok(answerDigits(last.svg) > 0, 'the finished run shows its answer');
});

test('"sum": "teacher" keeps the sum as set on every click, and the pieces still move', () => {
  const spec = { operator: '-', numbers: ['4003', '6'], sum: 'teacher' };
  const steps = happening.stepsFor(spec);
  const first = happening.tightSvg(Object.assign({}, spec, { step: 0 }), 'slides', BOX);
  const last = happening.tightSvg(Object.assign({}, spec, { step: steps.length - 1 }), 'slides', BOX);
  assert.equal(answerDigits(last.svg), 0, 'no answer digit is written for the teacher');
  assert.notEqual(first.svg, last.svg, 'the pieces moved between the first and last click');
  assert.notEqual(happening.cacheKey(spec, 'slides', BOX), happening.cacheKey({ operator: '-', numbers: ['4003', '6'] }, 'slides', BOX));
});

test('any other value is refused with what to write', () => {
  assert.throws(() => happening.normalise({ operator: '-', numbers: ['52', '28'], sum: 'class' }), /use "teacher"/);
});
