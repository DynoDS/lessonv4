'use strict';

// A vocabulary slide holding one word.
//
// Words used to arrive all together, so a card ALWAYS had four or five
// siblings and stretching the cards to fill the band was the same thing as
// hugging them. Vocabulary is now introduced where each word is needed, so a
// slide holding a single card is an ordinary lesson slide, and the stretch
// stopped being invisible: the word and its definition printed at four-card
// size in the top corner of a full-slide green rectangle with five inches of
// empty green under them (rendered and inspected, 5 September 2026). Legible,
// and it read as a rendering fault.
//
// Two things repair it, and both are pinned here. A card is as tall as what it
// holds, capped at its equal share so a full slate is untouched, and the stack
// sits in the middle of the band. And the type ceiling depends on how many
// cards share the slide, because "this looks like a poster" is only a fault
// while something else is sharing the board.

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawKeyVocabulary } = require('../src/templates/key-vocabulary');

// The band the cards live in, from the template's own coordinates.
const CONTENT_Y = 0.70;
const CONTENT_H = 6.55;

const WORDS = [
  { word: 'source', definition: 'A source gives us information about the past, such as a photograph, an object or a written account.' },
  { word: 'continuity', definition: 'A continuity is something that has stayed similar over time.' },
  { word: 'change', definition: 'A change is something that has become different over time.' },
  { word: 'evidence', definition: 'Evidence is what a source tells us when we look at it closely and think about it.' },
  { word: 'century', definition: 'A century is a hundred years.' },
];

// The green cards drawn for a slide of `count` words, and the type sizes used.
function cardsFor(count, words = WORDS) {
  const shapes = [];
  const texts = [];
  const slide = {
    addShape: (type, options) => shapes.push({ type, ...options }),
    addText: (value, options) => texts.push({ value, ...options }),
    addImage: () => {},
  };
  drawKeyVocabulary(
    new PptxGenJS(),
    slide,
    { title: 'Key vocabulary', words: words.slice(0, count) },
    { slideIndex: 0 }
  );
  // The header draws its own shapes; the cards are the ones the full content
  // width, which is the only thing this file measures.
  const cards = shapes.filter((s) => Math.abs(s.w - 12.89) < 0.001 && s.h > 0.5);
  return { cards, texts, shapes };
}

const wordSize = (texts, word) =>
  texts.find((t) => t.value === word).fontSize;

test('one card is as tall as its contents, not as tall as the slide', () => {
  const { cards } = cardsFor(1);
  assert.equal(cards.length, 1);
  // It used to be the whole 6.55" band. What it needs is a word, a
  // two-line definition and its padding.
  assert.ok(cards[0].h < 3.5, `a lone card came to ${cards[0].h}"`);
  assert.ok(cards[0].h > 1.5, `a lone card must still be a card, got ${cards[0].h}"`);
});

test('a short stack sits in the middle of the band, not pinned to the top', () => {
  const { cards } = cardsFor(1);
  const top = cards[0].y;
  const bottom = cards[0].y + cards[0].h;
  const above = top - CONTENT_Y;
  const below = CONTENT_Y + CONTENT_H - bottom;
  assert.ok(above > 0.5, 'a lone card should not start at the top of the band');
  assert.ok(Math.abs(above - below) < 0.02, `centred: ${above}" above, ${below}" below`);
});

test('the word on a lone card takes poster type', () => {
  // Alone on the board the card IS the poster, so the three-card ceiling that
  // kept it looking like a card has nothing left to protect.
  const one = cardsFor(1);
  const four = cardsFor(4);
  assert.ok(
    wordSize(one.texts, 'source') > wordSize(four.texts, 'source'),
    'a lone word must not print at four-card size'
  );
  assert.equal(wordSize(one.texts, 'source'), 44);
  // A pair reaches the same poster size, because a pair has the room for it and
  // 44 is now the one ceiling rather than the top row of a per-count table. The
  // teacher raised a two-card slide to exactly this by hand: "there's nothing
  // else on screen apart from the vocabulary" (19 September 2026).
  assert.equal(wordSize(cardsFor(2).texts, 'continuity'), 44);
});

test('a pair hugs its contents and stays two readable cards', () => {
  const { cards } = cardsFor(2, WORDS.slice(1));
  assert.equal(cards.length, 2);
  const share = (CONTENT_H - 0.15) / 2;
  assert.ok(cards[0].h < share, 'a pair should not stretch to half the band each');
  assert.ok(cards[0].h > 1.5);
  // Still in the design's order, still one gap apart.
  assert.ok(cards[1].y > cards[0].y);
  assert.ok(Math.abs(cards[1].y - (cards[0].y + cards[0].h) - 0.15) < 0.001);
});

test('a full slate is exactly where it always was', () => {
  // The control. Four and five cards are already over their equal share, so
  // they are clipped back to it and nothing about them moves - the ceiling
  // they use is the 34/24 it has always been.
  for (const count of [4, 5]) {
    const { cards, texts } = cardsFor(count);
    assert.equal(cards.length, count);
    const share = (CONTENT_H - 0.15 * (count - 1)) / count;
    // At or just under, not exactly on: the type is now grown to the largest
    // size whose card fits the share, so a full card hugs its contents within a
    // fraction of that share rather than being clipped to it.
    assert.ok(cards[0].h <= share + 0.001, `${count} cards: ${cards[0].h}" vs ${share}"`);
    assert.ok(cards[0].h > share - 0.1, `${count} cards left ${share - cards[0].h}" unused`);
    assert.ok(Math.abs(cards[0].y - CONTENT_Y) < 0.001, 'a full slate still starts at the top');
    assert.ok(wordSize(texts, 'source') <= 34);
  }
});

test('a card carrying a picture keeps room for the picture to be read', () => {
  // Hugging the text is the right answer for a text-only card and the wrong
  // one for a card with a panel down its side: the panel is the card minus its
  // padding, so a card hugged to two lines of definition would leave a picture
  // below the readable floor.
  const shapes = [];
  const slide = {
    addShape: (type, options) => shapes.push({ type, ...options }),
    addText: () => {},
    addImage: () => {},
  };
  drawKeyVocabulary(
    new PptxGenJS(),
    slide,
    {
      title: 'Key vocabulary',
      // `{ kind: 'built-in' }` has no `type`, so `resolveVocabVisual` returned
      // null and this card never carried a picture at all. The test passed
      // anyway because the old card reserved two fifths of its height for the
      // word, which happened to clear 2.4in. A real visual, so the picture
      // minimum is what is actually being tested.
      words: [{ word: 'century', definition: 'A century is a hundred years.', visual: { type: 'text', value: '100' } }],
    },
    { slideIndex: 0 }
  );
  const card = shapes.filter((s) => Math.abs(s.w - 12.89) < 0.001 && s.h > 0.5)[0];
  assert.ok(card, 'the card should draw');
  assert.ok(card.h >= 2.4, `a card with a picture came to ${card.h}"`);
});
