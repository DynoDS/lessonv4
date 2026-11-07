'use strict';

// A question with its answer printed beside it has stopped being a question.
// The check prints a prompt to look again, never a refusal, because whether a
// line really answers the question is the slide designer's judgement.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { answerBesideQuestionLookAgainLines } = require('../scripts/check-slide-design');

const UNIT = 'lesson-section/teaching-sequence/unit-001';

function teach(extra) {
  return { template: 'teach-layout', layout: 'lead-picture-lines', title: 'The cacao tree', designUnitId: UNIT, ...extra };
}

function notes(slides) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'answer-beside-question-'));
  const file = path.join(root, 'lesson.json');
  fs.writeFileSync(file, JSON.stringify({ slides }));
  try {
    return answerBesideQuestionLookAgainLines(file);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('a question leading a slide with its answer underneath is named', () => {
  const lines = notes([teach({
    lead: 'What is chocolate made from?',
    lines: ['Chocolate is made from the beans of the cacao tree.'],
  })]);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /^SLIDE_DESIGN_LOOK_AGAIN: slide 1 leads with the question "What is chocolate made from\?"/);
});

test('a question beside a star line is named the first time it is asked', () => {
  const lines = notes([teach({
    lead: 'The Maya made chocolate into a drink, not a bar.',
    question: 'How was Maya chocolate different from the chocolate you know?',
    sticky: 'Maya chocolate was bitter and frothy. They had no sugar.',
  })]);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /slide 1 asks "How was Maya chocolate different/);
});

test('the question asked first, its answer opening the next slide, passes', () => {
  const lines = notes([
    teach({ lead: 'What is chocolate made from?' }),
    teach({ lead: 'Chocolate is made from the beans of the cacao tree.', lines: ['The beans grow inside big pods.'] }),
    teach({ lead: 'The Maya made chocolate into a drink, not a bar.', question: 'How was it different from yours?' }),
    teach({ question: 'How was it different from yours?', lines: ['A drink, not a bar.'], sticky: 'It was bitter and frothy.' }),
  ]);
  assert.deepEqual(lines, []);
});

test('the lesson question slide, with no unit and no lines, is left alone', () => {
  const lines = notes([{ template: 'teach-layout', layout: 'picture-with-statement', title: 'Our question',
    lead: 'Why did they care so much about a few beans?', pictures: [] }]);
  assert.deepEqual(lines, []);
});

test('a slide outside a Teach layout is not read', () => {
  const lines = notes([{ template: 'strong-and-weak', designUnitId: UNIT, lead: 'Which is better?', sticky: 'A star.' }]);
  assert.deepEqual(lines, []);
});
