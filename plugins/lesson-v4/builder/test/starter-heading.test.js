'use strict';

// The word "Starter" on the lesson's opening slide.
//
// The starter header's heading slot used to be filled from `heading`, then
// `title`, and only fall back to "Starter" when a deck offered neither. A Year 4
// PSHE deck offered a question, so the class met "What do you remember about
// PSHE?" shrunk onto two lines of small print inside a four-inch label bar, and
// the word "Starter" was nowhere on the slide (flagged by Daniel, 2 September
// 2026: "Starter heading must ALWAYS be there").
//
// Two things were wrong and both are pinned here. The label is how a class and a
// cold teacher find the beginning of the lesson, so it is not a slot to fill;
// and a question is not label-shaped, so it needs a full-width line of its own
// at a size a class can read - underneath the label, above the questions.

const assert = require('node:assert/strict');
const test = require('node:test');

const { drawStarterHeader } = require('../src/headers');
const {
  bodyZone,
  HEADER_STARTER,
  HEADER_STARTER_H,
  starterPrompt
} = require('../src/layout');

function capture(data) {
  const texts = [];
  const slide = {
    addShape: () => {},
    addText: (content, options) => texts.push({ content, ...options }),
    addImage: () => {}
  };
  drawStarterHeader(slide, data, { cardLook: true });
  return texts;
}

const PSHE = {
  headerStyle: 'starter',
  title: 'What do you remember about PSHE?',
  heading: 'What do you remember about PSHE?',
  lo: 'To create an RSE and PSHE agreement through discussion.'
};

test('the heading is the word Starter, whatever the slide is titled', () => {
  const texts = capture(PSHE);
  const heading = texts.find((entry) => entry.y === HEADER_STARTER.headingY);

  assert.ok(heading, 'the starter header must draw a heading row');
  assert.equal(heading.content, 'Starter');
});

test("the slide's own question reads underneath, full width and at title size", () => {
  const texts = capture(PSHE);
  const prompt = texts.find(
    (entry) => entry.content === 'What do you remember about PSHE?'
  );

  assert.ok(prompt, 'the starter question must still reach the board');
  // Under the label, not beside it and not instead of it.
  assert.ok(prompt.y > HEADER_STARTER.headingY);
  // The label bar is four inches wide; a question needs the whole page.
  assert.ok(prompt.w > 10);
  // And a size a class reads from the back, not heading size shrunk to fit.
  assert.ok(prompt.fontSize >= 28);
});

test('a starter with nothing else to say keeps its old shape exactly', () => {
  // The discrimination case: adding a row that is not there must not push the
  // body of every other starter in the catalogue down the page.
  const bare = { headerStyle: 'starter', title: 'Starter', lo: 'To round numbers.' };
  const texts = capture(bare);

  assert.equal(texts.filter((entry) => entry.content === 'Starter').length, 1);
  assert.equal(starterPrompt(bare), '');
  assert.equal(bodyZone('starter', bare).y, 0.25 + HEADER_STARTER_H);
});

test('the body starts below the question when there is one', () => {
  const withPrompt = bodyZone('starter', PSHE);
  const without = bodyZone('starter', { headerStyle: 'starter', title: 'Starter' });

  assert.ok(withPrompt.y > without.y, 'the prompt row must claim its own height');
  assert.ok(withPrompt.h < without.h);
  // Still a usable body: the starter's questions are the point of the slide.
  assert.ok(withPrompt.h > 3.9);
});

test('a title-headed slide is untouched by any of this', () => {
  assert.equal(bodyZone('title', { title: 'Use made-up stories' }).y, 0.60);
});

test('a title never becomes the starter prompt', () => {
  // The prompt row is for something the designer deliberately put there, which
  // is what `heading` says. A title falling through to it printed the slide's
  // own title as a prompt directly above the body saying the same thing, and
  // took a row of the body's height to do it: "Rounding to 1,000" at 28pt over
  // "Round to the nearest 1,000:" at 48pt. The teacher deletes these by hand and
  // wants none of them: the underlined "Starter" already says what the slide is.
  assert.equal(starterPrompt({ title: 'Rounding to 1,000' }), '');
  assert.equal(starterPrompt({ heading: 'What is 6,432 to the nearest 1,000?' }),
    'What is 6,432 to the nearest 1,000?');
  // A titled starter now keeps the height the phantom prompt was spending.
  const titled = { headerStyle: 'starter', title: 'Rounding to 1,000' };
  assert.equal(bodyZone('starter', titled).y, 0.25 + HEADER_STARTER_H);
});
