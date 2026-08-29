'use strict';

// The optional visual layer has two routes: a drawing from the shared Educational
// SVG library, and an emoji as the fallback when no drawing fits. Only the drawing
// route used to leave a trace anyone looked for, so a pass that never opened the
// library and typed emojis instead reported "zero requests" and read exactly like
// a deck the library had nothing for. Counting both routes turns the route
// actually taken into a fact the check prints, rather than a claim in a report.

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  countOptionalPictures,
  optionalPictureLine,
} = require('../scripts/check-slide-design');

test('an empty deck counts nothing on either route', () => {
  const counts = countOptionalPictures({ slides: [] });
  assert.deepEqual(counts, { 'educational-svg': 0, emoji: 0 });
  assert.equal(
    optionalPictureLine(counts),
    'SLIDE_DESIGN_OPTIONAL_PICTURES: 0 educational-svg, 0 emoji'
  );
});

test('an all-emoji optional layer is visible instead of reading as zero', () => {
  const lesson = {
    slides: [
      { content: [{ text: 'sunny', picture: { kind: 'emoji', value: '☀️' } }] },
      { content: [{ text: 'rainy', picture: { kind: 'emoji', value: '🌧️' } }] },
    ],
  };
  const counts = countOptionalPictures(lesson);
  assert.equal(counts['educational-svg'], 0);
  assert.equal(counts.emoji, 2);
  assert.equal(
    optionalPictureLine(counts),
    'SLIDE_DESIGN_OPTIONAL_PICTURES: 0 educational-svg, 2 emoji'
  );
});

test('drawings are counted wherever they sit: picture, vocabulary visual, decoration', () => {
  const lesson = {
    slides: [
      {
        content: [
          {
            text: 'A candle is lit.',
            picture: { kind: 'educational-svg', concept: 'lit candle' },
          },
        ],
      },
      {
        visual: {
          type: 'image',
          kind: 'educational-svg',
          concept: 'magnifying glass',
          alt: 'A magnifying glass',
        },
      },
      {
        decorations: [
          { id: 'd1', kind: 'educational-svg', concept: 'forest' },
          { id: 'd2', kind: 'educational-svg', concept: 'leaf' },
        ],
      },
    ],
  };
  assert.equal(countOptionalPictures(lesson)['educational-svg'], 4);
});

test('a required photograph is not an optional picture', () => {
  const lesson = {
    slides: [
      { image: { kind: 'photo', file: 'photo-001.jpg' } },
      { image: { path: 'photo-002.jpg' } },
    ],
  };
  assert.deepEqual(countOptionalPictures(lesson), {
    'educational-svg': 0,
    emoji: 0,
  });
});

test('a shared object referenced twice is counted once', () => {
  const shared = { kind: 'emoji', value: '🕯️' };
  const lesson = { slides: [{ picture: shared }, { picture: shared }] };
  assert.equal(countOptionalPictures(lesson).emoji, 1);
});
