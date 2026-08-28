'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  drawTitleHeader,
  drawStarterHeader
} = require('../src/headers');

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
  assert.ok(pill.w < 2.7);
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
      shape.w < 2.7 &&
      shape.h < 1
  );
  assert.ok(pill);
});
