'use strict';

// The part-whole bar model children meet first: the whole bar with the parts
// bar touching underneath, no gap and no guide line. A Year 4 lesson drew it
// with the comparison shape and so printed a gap and a grey dashed line between
// the bars (the teacher, 19 October 2026: "aren't bar models together rather
// than a gap?"). It also builds up one box per click.

const test = require('node:test');
const assert = require('node:assert/strict');
const bar = require('../../shared/visuals/bar-model-svg');
const { expandHappenings } = require('../src/happening-runs');

const MODEL = { type: 'bar-model', shape: 'whole-parts',
  whole: { label: '100', value: 100 }, parts: [{ label: '30', value: 30 }, { label: '?', answer: '70' }] };

const rects = (svg) => [...svg.matchAll(/<rect x="([\d.-]+)" y="([\d.-]+)" width="([\d.]+)" height="([\d.]+)"/g)]
  .map((m) => ({ x: +m[1], y: +m[2], w: +m[3], h: +m[4] }));

test('the parts bar touches the whole bar, is as long, and has no guide line', () => {
  const { svg } = bar.tightSvg(MODEL);
  const [whole, a, b] = rects(svg);
  assert.equal(a.y, whole.y + whole.h, 'the parts sit directly under the whole');
  assert.ok(Math.abs((a.w + b.w) - whole.w) < 0.01, 'the parts together are as long as the whole');
  assert.ok(Math.abs(a.w / b.w - 30 / 70) < 0.01, 'the missing part is drawn its true length');
  assert.doesNotMatch(svg, /<line/, 'no guide line between the bars');
});

test('the missing number ? is question blue', () => {
  assert.match(bar.tightSvg(MODEL).svg, /fill="#0070C0">\?<\/text>/);
});

test('a slide run brings in the whole, then each part, then the answer, in one frame', () => {
  const lesson = { slides: [{ template: 'body-full', title: 'How to find a missing part',
    body: { type: 'stack', items: [Object.assign({ build: 'explain' }, MODEL)] } }] };
  const r = expandHappenings(lesson);
  assert.equal(r.lesson.slides.length, 4);
  assert.deepEqual(r.morph, [2, 3, 4]);
  const drawn = r.lesson.slides.map((s) => bar.tightSvg(s.body.items[0]));
  assert.deepEqual(drawn.map((d) => rects(d.svg).length), [1, 2, 3, 3]);
  drawn.forEach((d) => assert.equal(d.w.toFixed(2), drawn[0].w.toFixed(2), 'every click keeps one frame'));
  assert.match(drawn[3].svg, />70<\/text>/);
});

test('the teacher kind brings every box in empty for the teacher to write in', () => {
  const steps = bar.buildSteps(Object.assign({ build: 'teacher' }, MODEL));
  assert.equal(steps.length, 3, 'no answer click: the teacher writes it');
  const last = bar.tightSvg(Object.assign({ build: 'teacher', step: 2 }, MODEL));
  assert.doesNotMatch(last.svg, /<text/);
  assert.equal((last.svg.match(/stroke-dasharray/g) || []).length, 3);
});

test('a bar model without build is one slide, as before', () => {
  const r = expandHappenings({ slides: [{ template: 'body-full', body: MODEL }] });
  assert.equal(r.lesson.slides.length, 1);
  assert.throws(() => bar.buildSteps(Object.assign({}, MODEL, { build: 'slow' })), /use "explain"/);
});
