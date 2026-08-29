'use strict';

// A question number exists so a child can tell questions apart and match
// answers back. A starter holding exactly one question printed "(1)" anyway,
// which numbers nothing against nothing (flagged by Daniel, 29 Aug 2026).
//
// The boundary that keeps this safe: numbering can carry on across the
// independent slides that follow (preferences.md, Question Labelling), and a
// later block says so with `startAt`. When any block in the deck starts past
// (1), every number is kept so the run those slides continue stays whole.

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawNumberedQuestions } = require('../src/content/numbered-questions');

function drawn(data, lesson) {
  const texts = [];
  const pptx = new PptxGenJS();
  const slide = {
    addShape: () => {},
    addText: (content, opts) => texts.push({ content, ...opts }),
    addImage: () => {},
  };
  const zone = { x: 0.4, y: 1.0, w: 4.0, h: 3.0 };
  drawNumberedQuestions(pptx, slide, zone, data, { slideIndex: 0, lesson });
  return texts;
}

const labelTexts = (texts) =>
  texts.map((t) => (typeof t.content === 'string' ? t.content : '')).filter((s) => /^\(\d+\)$/.test(s));

test('a lone question prints no number', () => {
  const texts = drawn(
    { questions: ['Label the seven continents on the map.'] },
    { slides: [{ secondary: { type: 'numbered-questions', questions: ['x'] } }] }
  );
  assert.deepEqual(labelTexts(texts), []);
  // The question itself still prints.
  assert.equal(texts.length, 1);
});

test('two questions keep their numbers', () => {
  const texts = drawn(
    { questions: ['First thing.', 'Second thing.'] },
    { slides: [] }
  );
  assert.deepEqual(labelTexts(texts), ['(1)', '(2)']);
});

test('a lone question keeps "(1)" when a later slide continues the run', () => {
  // The deck carries the run on: (2) lives on a later slide, so dropping this
  // (1) would leave the child a sequence that starts at two.
  const continuing = {
    slides: [
      { body: { type: 'numbered-questions', questions: ['x'] } },
      { body: { type: 'numbered-questions', startAt: 2, questions: ['y'] } },
    ],
  };
  const texts = drawn({ questions: ['First of a run.'] }, continuing);
  assert.deepEqual(labelTexts(texts), ['(1)']);
});

test('a continuing block past (1) always keeps its own number', () => {
  const texts = drawn(
    { startAt: 3, questions: ['Third of a run.'] },
    { slides: [] }
  );
  assert.deepEqual(labelTexts(texts), ['(3)']);
});
