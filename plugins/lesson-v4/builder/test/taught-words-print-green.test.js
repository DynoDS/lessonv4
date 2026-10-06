'use strict';

// A taught word is green wherever a child reads it, and the builder does the
// colouring. The rule sat in the visual profile, reached the slide designer,
// and four decks in a row printed every taught word black outside the word
// bank; a Year 4 RE deck had `Christingle` and `symbol` black twelve times
// (5 October 2026). Marking each occurrence by hand is the job that gets
// skipped, so it is no longer anyone's job.

const assert = require('node:assert/strict');
const test = require('node:test');

const { COLOURS } = require('../src/styles');
const { splitAnswerRuns, setTaughtWords } = require('../src/answer-text');
const { presentationRuns } = require('../src/presentation-text');

const green = (runs) => runs.filter((run) => run.options.color === COLOURS.green).map((run) => run.text);

test('a slide with no taught words prints exactly as it always has', () => {
  setTaughtWords([]);
  assert.equal(splitAnswerRuns('A Christingle is a symbol.', true), 'A Christingle is a symbol.');
});

test('a taught word is green in black text, a question and a line to remember, plurals included', () => {
  setTaughtWords(['Christingle', 'symbol']);
  try {
    const black = splitAnswerRuns('Some Christians make Christingles.\nA Christingle is a symbol.', true);
    assert.deepEqual(green(black), ['Christingles', 'Christingle', 'symbol']);
    assert.equal(black.map((run) => run.text).join(''), 'Some Christians make Christingles.\nA Christingle is a symbol.');
    // `symbolism` is a different word, and the rest of a question stays blue.
    const question = splitAnswerRuns('What does symbolism mean on a Christingle?', true, COLOURS.title);
    assert.deepEqual(green(question), ['Christingle']);
    assert.equal(question[0].options.color, COLOURS.title);
    assert.deepEqual(green(splitAnswerRuns('A symbol stands for something.', true, COLOURS.sticky)), ['symbol']);
  } finally {
    setTaughtWords([]);
  }
});

test('a colour that already says what the words are is left alone', () => {
  setTaughtWords(['Christingle', 'continuity and change']);
  try {
    // A weak example is red throughout, and an answer is already green.
    assert.equal(splitAnswerRuns('A Christingle has an orange.', true, COLOURS.problem), 'A Christingle has an orange.');
    assert.equal(splitAnswerRuns('A Christingle has an orange.', true, COLOURS.orange), 'A Christingle has an orange.');
    // The key line keeps its orange; the taught word outside it turns green.
    const card = presentationRuns('The Christingle matters. A Christingle is round.', true, undefined, {
      emphasis: [{ text: 'The Christingle matters.', role: 'key-line' }]
    });
    assert.equal(card[0].options.color, COLOURS.orange);
    assert.deepEqual(green(card), ['Christingle']);
    // A paired card is two words, each green by itself.
    assert.deepEqual(green(splitAnswerRuns('One change and one continuity.', true)), ['change', 'continuity']);
  } finally {
    setTaughtWords([]);
  }
});
