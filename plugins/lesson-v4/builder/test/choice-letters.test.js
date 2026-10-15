'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { markChoiceLetters, isChoiceSet } = require('../src/choice-letters');
const { presentationRuns } = require('../src/presentation-text');
const { COLOURS } = require('../src/styles');

const card = (value, extra) => Object.assign({ type: 'text', value }, extra);

test('a run of cards lettered from A is a set of choices, and each letter prints blue', () => {
  const lesson = { slides: [{ secondary: { type: 'stack', items: [
    card('A: Ask a teaching assistant about the worry now.'),
    card('B: Leave a note about the worry and ask when the teacher can talk.'),
    card('C: Leave a note about the worry and go back to class.')
  ] } }] };
  markChoiceLetters(lesson);
  const first = lesson.slides[0].secondary.items[0];
  assert.equal(first.choiceLetter, true);
  const runs = presentationRuns(first.value, true, COLOURS.body, first);
  assert.equal(runs[0].text, 'A:');
  assert.equal(runs[0].options.color, COLOURS.title);
  assert.equal(runs.map((run) => run.text).join(''), first.value);
  assert.equal(runs[1].options.color, COLOURS.body);
});

test('one lettered line, letters out of order and a set that is not all lettered are left alone', () => {
  assert.equal(isChoiceSet([card('A: 24 cm')]), false);
  assert.equal(isChoiceSet([card('A: first'), card('C: third')]), false);
  assert.equal(isChoiceSet([card('A: first'), card('The teacher is busy.')]), false);
  assert.equal(isChoiceSet([card('A stitch in time.'), card('B flat is a note.')]), false);
});

test('a card that is not black keeps its one colour, and an unmarked card is untouched', () => {
  const blue = card('A: Which step helps most?', { choiceLetter: true, colorRole: 'focus-blue' });
  const blueRuns = presentationRuns(blue.value, true, COLOURS.body, blue);
  const texts = typeof blueRuns === 'string' ? [blueRuns] : blueRuns.map((run) => run.text);
  assert.notEqual(texts[0], 'A:');
  const plain = presentationRuns('A: Ask an adult.', true, COLOURS.body, card('A: Ask an adult.'));
  assert.equal(typeof plain === 'string' ? plain : plain.map((run) => run.text).join(''), 'A: Ask an adult.');
  assert.ok(typeof plain === 'string' || plain[0].text !== 'A:');
});
