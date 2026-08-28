#!/usr/bin/env node
'use strict';

// Fast regression check for card-sized vocabulary visuals. It builds the
// shapes in memory with the real PptxGenJS API, so a bad shape name or a type
// dropped from the vocab-card gate fails `npm run check` without writing a
// deck or invoking LibreOffice.

const assert = require('node:assert/strict');
const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { resolveVocabVisual } = require('../src/content/vocab');
const { drawPlaceValueMini } = require('../src/content/place-value-mini');

const specs = [
  { type: 'place-value-mini', mode: 'digit-value', digit: 6, value: 600 },
  { type: 'place-value-mini', mode: 'column', column: 'H' },
  { type: 'place-value-mini', mode: 'exchange' },
  { type: 'place-value-mini', mode: 'placeholder', number: '4050' },
];

const pptx = new PptxGenJS();
const slide = pptx.addSlide();

specs.forEach(function (spec, index) {
  assert.equal(resolveVocabVisual(spec), spec,
    `place-value-mini mode "${spec.mode}" was rejected by the vocab-card gate`);
  drawPlaceValueMini(pptx, slide, {
    x: 0.2, y: 0.2 + index * 1.2, w: 2.04, h: 1.0,
  }, spec);
});

console.log('Vocab visuals OK: all four place-value-mini modes draw in a card-sized panel.');
