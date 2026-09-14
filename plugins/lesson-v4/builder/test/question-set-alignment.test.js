'use strict';

// A set of numbered questions shares one alignment. Each card used to choose
// its own (centred on one line, left once it wrapped), so the Tudor starter
// (14 September 2026) printed `What is a source?` centred above a wrapped
// second question hard left, and the teacher asked why the two did not match.

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawNumberedQuestions } = require('../src/content/numbered-questions');

function questionAligns(questions, zone) {
  const texts = [];
  const pptx = new PptxGenJS();
  const slide = {
    addShape: () => {},
    addText: (content, opts) => texts.push({ content, ...opts }),
    addImage: () => {},
  };
  drawNumberedQuestions(pptx, slide, zone, { questions }, { slideIndex: 0, lesson: { slides: [] } });
  return texts
    .filter((t) => !(typeof t.content === 'string' && /^\(\d+\)$/.test(t.content)))
    .map((t) => t.align);
}

const WIDE = { x: 0.4, y: 1.0, w: 12.0, h: 4.0 };

test('a set where one question wraps is left-aligned throughout', () => {
  const aligns = questionAligns([
    'What is a source?',
    "Think back to last lesson. What is one thing that has changed about children's lives since the Victorians, and how do you know?",
  ], { x: 0.4, y: 1.0, w: 6.0, h: 4.0 });
  assert.equal(aligns.length, 2);
  assert.deepEqual(new Set(aligns), new Set(['left']));
});

test('a set of one-line questions is centred throughout', () => {
  const aligns = questionAligns(['What is a source?', 'Name one Tudor job.'], WIDE);
  assert.equal(aligns.length, 2);
  assert.deepEqual(new Set(aligns), new Set(['center']));
});
