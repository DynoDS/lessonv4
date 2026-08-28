'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { drawQuestions } = require('../src/templates/maths-turn');

function fakePptx() {
  return { shapes: { ROUNDED_RECTANGLE: 'roundRect', RECTANGLE: 'rect' } };
}

function fakeSlide() {
  return {
    shapes: [],
    texts: [],
    images: [],
    addShape(type, options) { this.shapes.push({ type, options }); },
    addText(value, options) { this.texts.push({ value, options }); },
    addImage(options) { this.images.push(options); }
  };
}

const BOX = { x: 0.22, y: 0.75, w: 7.99, h: 1.65 };
const FOUR = [
  'What is 7 + 5?',
  'What is 12 - 4?',
  'What is 3 × 4?',
  'What is 20 - 8?'
];

const LABELS = /^\([a-d]\)$/;

test('a set without questionNumbering stays unlabelled', () => {
  const slide = fakeSlide();
  drawQuestions(slide, FOUR, BOX, fakePptx(), null, {});
  assert.ok(
    !slide.texts.some((entry) => LABELS.test(entry.value)),
    'no (a)-(d) labels without an explicit numbering request'
  );
  assert.equal(
    slide.texts.filter((entry) => !LABELS.test(entry.value)).length,
    4,
    'all four questions still render'
  );
});

test('a teacher-led set of four is lettered (a) to (d)', () => {
  const slide = fakeSlide();
  drawQuestions(slide, FOUR, BOX, fakePptx(), null, {
    questionNumbering: 'teacher-led'
  });
  assert.deepEqual(
    slide.texts.map((entry) => entry.value).filter((value) => LABELS.test(value)),
    ['(a)', '(b)', '(c)', '(d)']
  );
});

test('a single teacher-led question stays unlabelled', () => {
  const slide = fakeSlide();
  drawQuestions(slide, ['What is 7 + 5?'], BOX, fakePptx(), null, {
    questionNumbering: 'teacher-led'
  });
  assert.ok(
    !slide.texts.some((entry) => LABELS.test(entry.value)),
    'a lone (a) reads as a fault, so a single teacher-led question loses its numbering'
  );
  assert.ok(
    slide.texts.some((entry) => entry.value === 'What is 7 + 5?'),
    'the question itself still renders'
  );
});
