'use strict';
// The picture takes what the bubble leaves.
//
// The figure and name block was a flat 0.46 of the speaker column whatever the
// person said, so a long piece of reasoning was squeezed while the face kept
// nearly half the space. What she says is the teaching and the portrait is the
// frame for it: the teacher shrank one to 72% and gave the room to the bubble
// (19 September 2026), and `slide-speech-and-characters.md` had already said the
// portraits can be smaller when something else needs the room. Only the code had
// not read it.
const test = require('node:test');
const assert = require('node:assert/strict');
const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawSpeechBubbles1 } = require('../src/templates/speech-bubbles');

function render(speech) {
  const shapes = [];
  const slide = {
    addShape: (type, options) => shapes.push({ type, ...options }),
    addText: () => {},
    addImage: (options) => shapes.push({ type: 'image', ...options }),
  };
  drawSpeechBubbles1(new PptxGenJS(), slide, {
    title: 'Apply',
    statement: 'Is Isla correct?',
    speakers: [{ name: 'Isla', child: 'miss-brooker', speech }]
  }, {});
  const picture = shapes.find((s) => s.type === 'image');
  const bubble = shapes.filter((s) => s.type !== 'image' && s.h > 0.8 && s.w > 3)[0];
  return { picture, bubble };
}

const LONG = 'I rounded 4,451 to 10 and got 4,450. Then I rounded 4,450 to 100 '
  + 'and got 4,500. So 4,451 rounded to 1,000 is 5,000.';
const SHORT = 'I think it is 5,000.';

test('a long piece of reasoning takes room from the picture', () => {
  const long = render(LONG);
  const short = render(SHORT);
  assert.ok(long.bubble.h > short.bubble.h, 'the bubble must grow with the speech');
  assert.ok(long.picture.h < short.picture.h, 'the picture must give the room up');
});

test('a short line leaves the picture at full size', () => {
  // Shrinking a face nobody needed to shrink is the opposite fault.
  const short = render(SHORT);
  const spare = render('Yes.');
  assert.equal(short.picture.h, spare.picture.h);
});

test('the face never shrinks past being a face', () => {
  // A postage stamp stops a child picturing a person, which is the only reason
  // the portrait is on the slide at all.
  const huge = render('Something quite long to say. '.repeat(20));
  const short = render(SHORT);
  assert.ok(huge.picture.h > 0.9, `the face came to ${huge.picture.h}in`);
  assert.ok(huge.picture.h >= short.picture.h * 0.5);
});

test('a hard break is a line the bubble has to hold', () => {
  // The estimator split on any whitespace and packed the words back together,
  // so a speech written on three lines measured as one flowing paragraph and
  // the bubble came out too short for text it had been told the shape of.
  const flowing = render('One. Two. Three.');
  const broken = render('One.\n\nTwo.\n\nThree.');
  assert.ok(broken.bubble.h > flowing.bubble.h, 'breaks must add height');
});
