'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  drawTitleHeader,
  drawStarterHeader
} = require('../src/headers');
const { HEADER_TITLE, HEADER_STARTER } = require('../src/layout');

// "Compact" means the pill hugs its cue instead of running the width of the
// band it sits in, so the bound is read off the band rather than written out.
// It was a flat 2.7in, which silently encoded the old 16pt instruction size:
// raising that to the deck's 18pt floor (19 September 2026) made the same
// seventeen characters 2.74in wide and failed a test whose point had not
// changed. A cue that hugs is comfortably under two thirds of its band.
const HUGS = (band) => band * 0.66;

function capture(drawer, data) {
  const shapes = [];
  const texts = [];

  const slide = {
    addShape: (kind, options) =>
      shapes.push({
        kind,
        ...options
      }),
    addText: (content, options) =>
      texts.push({
        content,
        ...options
      }),
    addImage: () => {}
  };

  drawer(
    slide,
    data,
    { cardLook: true }
  );

  return {
    shapes,
    texts
  };
}

test('a short title-header cue gets a compact right-side pill', () => {
  const result = capture(
    drawTitleHeader,
    {
      title: 'Look carefully',
      instruction: 'Use the word bank'
    }
  );

  const pill = result.shapes[0];
  const instruction = result.texts.find(
    (entry) =>
      entry.content === 'Use the word bank'
  );

  assert.ok(pill);
  assert.ok(pill.w < HUGS(HEADER_TITLE.instructionW), `pill ${pill.w}in`);
  assert.ok(instruction);
  assert.equal(instruction.align, 'right');
});

test('a short starter-header cue also keeps the compact pill', () => {
  const result = capture(
    drawStarterHeader,
    {
      headerStyle: 'starter',
      lo: 'To explain how switches work',
      heading: 'Starter',
      instruction: 'Use the word bank'
    }
  );

  const instruction = result.texts.find(
    (entry) =>
      entry.content === 'Use the word bank'
  );

  assert.ok(instruction);
  const pill = result.shapes.find(
    (shape) =>
      shape.w < HUGS(HEADER_STARTER.instructionW) &&
      shape.h < 1
  );
  assert.ok(pill);
});

// A short cue grows into its band, up to 20pt; a cue that only fits at 16pt, or
// wraps to two lines, keeps 16 (layout.js, instructionCuePt). Every Your Turn of
// a Year 4 week printed "Use column subtraction." at 16pt with room to spare
// (15 October 2026).
test('a short header cue grows to 20pt and a long one keeps 16pt', () => {
  const sizeOf = (data) => capture(drawTitleHeader, { title: 'Your Turn', ...data })
    .texts.find((entry) => entry.content === data.instruction).fontSize;

  assert.equal(sizeOf({ instruction: 'Use column subtraction.', signal: 'pencil' }), 20);
  const long = 'Work with your partner and check each answer using the inverse.';
  assert.equal(sizeOf({ instruction: long, signal: 'pencil' }), 16);

  const starter = capture(drawStarterHeader, {
    headerStyle: 'starter', lo: 'To subtract in columns', heading: 'Starter',
    instruction: 'Use column subtraction for the first one.'
  }).texts.find((entry) => entry.content === 'Use column subtraction for the first one.');
  assert.equal(starter.fontSize, 20);
});
