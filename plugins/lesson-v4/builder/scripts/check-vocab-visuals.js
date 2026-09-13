#!/usr/bin/env node
'use strict';

// Fast regression check for card-sized vocabulary visuals. It lays the shared
// small place-value picture out in a card-sized panel on the board's profile,
// so a mode that cannot fit the panel, or a type dropped from the vocab-card
// gate, fails `npm run check` without writing a deck.

const assert = require('node:assert/strict');
const { resolveVocabVisual } = require('../src/content/vocab');
const { tightSvg } = require('../../shared/visuals/place-value-mini-svg');
const { profileFor } = require('../../shared/visuals/surface-profiles');

const specs = [
  { type: 'place-value-mini', mode: 'digit-value', digit: 6, value: 600 },
  { type: 'place-value-mini', mode: 'column', column: 'H' },
  { type: 'place-value-mini', mode: 'exchange' },
  { type: 'place-value-mini', mode: 'placeholder', number: '4050' },
];

specs.forEach(function (spec) {
  assert.equal(resolveVocabVisual(spec), spec,
    `place-value-mini mode "${spec.mode}" was rejected by the vocab-card gate`);
  // The panel's inner box: 2.04in x 1.0in less the placer's 0.1in each side.
  const built = tightSvg(spec, profileFor('slides', { widthPt: 1.84 * 72, heightPt: 0.8 * 72 }));
  assert.ok(built.w <= 1.84 * 72 + 0.5 && built.h <= 0.8 * 72 + 0.5,
    `place-value-mini mode "${spec.mode}" drew larger than its panel`);
});

console.log('Vocab visuals OK: all four place-value-mini modes draw in a card-sized panel.');
