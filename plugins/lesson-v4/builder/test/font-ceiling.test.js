'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { validateLesson } = require('../src/validate');
const { MIN_FONT_PT } = require('../src/styles');

// A `fontSize` in a spec is the size text STARTS at. The build's fit pass then
// brings it down to whatever its box will hold, and stops at the projection
// floor. So a ceiling at the floor is not small text, it is text with nowhere
// to go, and the first line that runs a word long fails the whole build.
//
// Twenty-five of these were sitting in decks written when the floor was 10pt,
// where a ceiling of 18 left eight points of room. Nothing about the spec looks
// wrong, which is why this is worth naming against the file rather than leaving
// it to surface later as an overflow on innocent-looking words.
function problems(fontSize) {
  const lesson = {
    slides: [{
      template: 'body-full',
      title: 'Compare 4-digit numbers',
      content: { type: 'text', value: 'Th = thousands  H = hundreds', fontSize },
    }],
  };

  return validateLesson(lesson, '.').errors.filter((e) => /fontSize/.test(e));
}

test('a ceiling above the floor is left alone', () => {
  assert.equal(problems(MIN_FONT_PT + 1).length, 0);
  assert.equal(problems(28).length, 0);
});

test('a ceiling at the floor is refused, because it cannot shrink', () => {
  const found = problems(MIN_FONT_PT);

  assert.equal(found.length, 1);
  assert.match(found[0], new RegExp(`${MIN_FONT_PT}pt projection floor`));
  assert.match(found[0], /no room to shrink/);
});

test('a ceiling under the floor is refused too', () => {
  assert.equal(problems(MIN_FONT_PT - 4).length, 1);
});

test('the refusal quotes the words, so the line can be found on the slide', () => {
  assert.match(problems(MIN_FONT_PT)[0], /Th = thousands/);
});

test('a spec that sets no size of its own is not second-guessed', () => {
  const lesson = {
    slides: [{
      template: 'body-full',
      title: 'Compare 4-digit numbers',
      content: { type: 'text', value: 'Th = thousands  H = hundreds' },
    }],
  };

  assert.equal(validateLesson(lesson, '.').errors.filter((e) => /fontSize/.test(e)).length, 0);
});
