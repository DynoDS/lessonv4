'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { REGISTRY } = require('../src/helpers');
const { resolveImages } = require('../src/images');

test('a worksheet question may have a picture while its neighbour stays text-only', () => {
  const spec = {
    items: [
      { text: 'Find the robin.', picture: { kind: 'emoji', value: '🐦', alt: 'robin' } },
      'Which season is shown?'
    ]
  };
  const html = REGISTRY.questions.render(spec, 120);
  assert.match(html, /🐦/);
  assert.match(html, /Which season is shown/);
  assert.equal((html.match(/h-context-picture--emoji/g) || []).length, 1);
});

const LONG_QUESTION = {
  items: [{
    text: 'abcdefghijklmnopqrstuvwxy',
    picture: { kind: 'emoji', value: '🐦', alt: 'robin' }
  }]
};

test('a worksheet picture disappears when it would add a line of text', () => {
  // 69mm: the words fit on one line without the picture and need two with it,
  // so the picture is costing the child a wrapped question and goes.
  //
  // It was 70mm until 12 September 2026, when the question-number column came
  // down from 9mm to 8mm (the label is set one step smaller than the question
  // now, so it needs less room). That hands every question row 1mm back, and
  // the width at which a picture starts costing a line moves 1mm with it. The
  // rule is unchanged; the threshold is a measurement, and the 80mm case below
  // is what holds the rule to a real boundary rather than to a number.
  const html = REGISTRY.questions.render(LONG_QUESTION, 69);
  assert.doesNotMatch(html, /🐦/);
});

// The discriminating case. This used to be the test above, at a width where the
// picture was believed to cost a line - it was not, and the widths the question
// row was measured against were simply wrong. A picture that costs the words
// nothing must be kept, or the rule quietly becomes "no pictures in a column".
test('a worksheet picture stays when the words do not pay for it', () => {
  const html = REGISTRY.questions.render(LONG_QUESTION, 80);
  assert.match(html, /🐦/);
});

test('a missing optional Educational SVG file does not fail the worksheet', () => {
  const spec = {
    helper: 'questions',
    items: [{
      text: 'Find the candle.',
      picture: {
        kind: 'educational-svg',
        concept: 'lit candle',
        context: 'A plain candle',
        imagePath: 'icons/not-there.png',
        fallbackEmoji: '🕯️'
      }
    }]
  };
  const resolved = resolveImages(spec, path.join(__dirname, 'missing-icon-folder'));
  assert.equal(resolved.items[0].picture.imageHref, undefined);
  const html = REGISTRY.questions.render(resolved, 120);
  assert.match(html, /🕯️/);
});
