'use strict';

// A lettered sorting card gives its letter a line of its own. When no
// arrangement holds every card's words at 18pt that way, the letter leads the
// words on the same line, as it does on a picture card, and the words take the
// whole card. A board that still cannot hold its cards says so once, drawn in
// the arrangement nearest to fitting (4 October 2026: one-sentence cards were
// refused once for every card, in the arrangement furthest from fitting).

const test = require('node:test');
const assert = require('node:assert/strict');
const PptxGenJS = require('pptxgenjs');
const { drawSortBoard } = require('../src/content/sort-board');
const warnings = require('../src/warnings');

const POND = [
  'Morning by the pond. A frog sits still on a leaf, waiting for a fly.',
  'The fly buzzes past too close. Snap! The long tongue of the frog shoots out.',
  'The frog jumps, then splash! Ripples spread across the pond in wide circles.',
  'The ripples rock a small duck. She tucks in her head and floats.',
  'Then five ducklings wake. They paddle after their mum in a wobbly line.',
  'The line of ducklings reaches the reeds, where they hide and rest.'
].map((text, i) => ({ label: 'ABCDEF'[i], text }));
const PLACES = ['1st', '2nd', '3rd', '4th', '5th', '6th'].map((label) => ({ label }));

function draw(zone, bank) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'W', width: 13.333, height: 7.5 });
  pptx.layout = 'W';
  const slide = pptx.addSlide();
  warnings.clearWarnings();
  const log = console.warn;
  console.warn = () => {};
  try {
    drawSortBoard(pptx, slide, Object.assign({ class: 'A' }, zone),
      { bank, groups: PLACES, instruction: 'Put the stanzas back in order.' },
      { slideIndex: 0, lessonDir: __dirname, imageDims: {} });
  } finally {
    console.warn = log;
  }
  const named = (pattern) => slide._slideObjects.filter((o) => o._type === 'text' && pattern.test(o.options.objectName || ''));
  return { cards: named(/sort-bank-card-\d+$/), letters: named(/sort-bank-label-\d+$/), said: warnings.getWarnings() };
}

const words = (object) => (Array.isArray(object.text) ? object.text.map((run) => run.text).join('') : String(object.text || ''));

test('a roomy board keeps each letter on a line of its own', () => {
  const { cards, letters, said } = draw({ x: 0.22, y: 0.6, w: 12.893, h: 6.65 }, POND);
  assert.equal(letters.length, 6);
  assert.equal(words(cards[0]), POND[0].text);
  assert.equal(said.length, 0);
});

test('where the words cannot print at 18pt under their letter, the letter leads the words', () => {
  const { cards, letters, said } = draw({ x: 0.22, y: 0.6, w: 8.885, h: 6.65 }, POND);
  assert.equal(letters.length, 0, 'no letter takes a line of its own');
  assert.equal(cards.length, 6);
  cards.forEach((card, i) => {
    assert.equal(words(card), 'ABCDEF'[i] + '  ' + POND[i].text);
    assert.equal(card.text[0].options.color, '0070C0', 'the letter is house blue, as on a picture card');
  });
  assert.equal(said.length, 0, 'and the board fits, so it says nothing');
});

test('a board that cannot hold its cards either way says so once, in the nearest arrangement', () => {
  const { cards, said } = draw({ x: 0.22, y: 0.6, w: 8.885, h: 4.6 }, POND);
  assert.equal(said.length, 1);
  assert.match(said[0], /6 cards to sort do not all fit their words at the 18pt floor/);
  assert.match(said[0], /needs the board about \d+\.\d\din taller/);
  const across = new Set(cards.map((card) => card.options.x.toFixed(2))).size;
  assert.ok(across < 4, `sentences are drawn ${across} across, not the 4 that is furthest from fitting`);
});
