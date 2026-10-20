'use strict';

// A ? that stands for a missing number prints in question blue, on the slides
// and on the worksheets; a ? that ends a sentence stays in the line's colour.
// The teacher, 19 October 2026, on a Year 4 Your Turn of "3,000 − ? = 1,200":
// the ? should be blue "because it makes it clear that that's the missing
// thing they need to work out".

const test = require('node:test');
const assert = require('node:assert/strict');
const { missingNumberMarks } = require('../../shared/text/missing-number');
const { splitAnswerRuns } = require('../src/answer-text');
const { COLOURS } = require('../src/styles');
const { promptHtml } = require('../../worksheet-html/src/helpers/shared');

const BLUE = COLOURS.title;

function blueQuestionMarks(runs) {
  if (!Array.isArray(runs)) return 0;
  return runs.filter((r) => r.text === '?' && String(r.options.color).toUpperCase() === BLUE.toUpperCase()).length;
}

test('a ? standing for a number is found; a ? ending a sentence is not', () => {
  assert.deepEqual(missingNumberMarks('3,000 − ? = 1,200'), [8]);
  assert.deepEqual(missingNumberMarks('? + 2,650 = 6,000'), [0]);
  assert.deepEqual(missingNumberMarks('100 − 65 = ?'), [11]);
  assert.deepEqual(missingNumberMarks('?'), [0]);
  assert.deepEqual(missingNumberMarks('Who is correct?'), []);
  assert.deepEqual(missingNumberMarks('Is 4 + 5 = 9?'), []);
  assert.deepEqual(missingNumberMarks('How many? 4'), []);
});

test('on a slide the missing-number ? is blue and the rest of the sum stays black', () => {
  const runs = splitAnswerRuns('(1) 3,000 − ? = 1,200', true);
  assert.equal(blueQuestionMarks(runs), 1);
  const black = runs.filter((r) => /1,200/.test(r.text));
  assert.equal(String(black[0].options.color).toUpperCase(), COLOURS.body.toUpperCase());
});

test('a sentence question keeps its colour', () => {
  assert.equal(splitAnswerRuns('Who is correct?', true), 'Who is correct?');
});

test('a question ending on a coloured number is read as a whole line, not run by run', () => {
  // Read alone, the run "? " after an orange 3,682 looked like a ? beside 600.
  assert.equal(blueQuestionMarks(splitAnswerRuns('(1) What is the 6 worth in <<3,682>>? ||600', true)), 0);
  assert.equal(blueQuestionMarks(splitAnswerRuns('<<5,200>> − ? = <<1,900>>', true)), 1);
});

test('an answer is left green', () => {
  const runs = splitAnswerRuns('3,000 − ? = ||1,200', true);
  assert.equal(blueQuestionMarks(runs), 1);
  assert.ok(runs.some((r) => r.text.includes('1,200') && String(r.options.color).toUpperCase() === COLOURS.textGreen.toUpperCase()));
});

test('on a worksheet the missing-number ? takes the question colour', () => {
  assert.match(promptHtml('8,300 − ? = 2,500'), /<span class=h-missing>\?<\/span>/);
  assert.doesNotMatch(promptHtml('Who is correct?'), /h-missing/);
});
