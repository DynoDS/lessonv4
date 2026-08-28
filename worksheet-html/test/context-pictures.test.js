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

test('a worksheet picture disappears when it would add a line of text', () => {
  const spec = {
    items: [{
      text: 'abcdefghijklmnopqrstuvwxy',
      picture: { kind: 'emoji', value: '🐦', alt: 'robin' }
    }]
  };
  const html = REGISTRY.questions.render(spec, 80);
  assert.doesNotMatch(html, /🐦/);
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
