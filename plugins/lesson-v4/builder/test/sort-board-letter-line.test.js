'use strict';

// A sorting card's letter is a line of its own. Its band was three tenths of
// the card whatever that came to, so on a short card the letter sat in a box
// thinner than one readable line and the deck was refused for it later (six of
// ten slide runs, 4 October 2026). The band now keeps one line's height, and an
// arrangement that cannot hold it loses to one that can.

const test = require('node:test');
const assert = require('node:assert/strict');
const PptxGenJS = require('pptxgenjs');
const { drawSortBoard } = require('../src/content/sort-board');

const BANK = [
  { label: 'A', text: 'A fizzy liquid that breaks the cracker down even more.' },
  { label: 'B', text: 'Two hands crushing the cracker into small pieces.' },
  { label: 'C', text: 'Squeezing the bag again and again to mix it all up.' },
  { label: 'D', text: 'Water poured in to make the cracker soft and wet.' }
];
const GROUPS = [{ label: 'Teeth' }, { label: 'Saliva' }, { label: 'Stomach acid' },
  { label: 'Stomach walls squeezing' }, { label: 'Small intestine' }];
const INSTRUCTION = 'Write the letter beside the part of your body it is like.';

function draw(height) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'W', width: 13.333, height: 7.5 });
  pptx.layout = 'W';
  const slide = pptx.addSlide();
  drawSortBoard(pptx, slide, { x: 0.3, y: 1.4, w: 12.7, h: height, class: 'A' }, { bank: BANK, groups: GROUPS, instruction: INSTRUCTION },
    { slideIndex: 0, lessonDir: __dirname, imageDims: {} });
  return slide;
}

const letters = (slide) => slide._slideObjects.filter((o) => {
  const t = o.text;
  const words = Array.isArray(t) ? t.map((r) => r.text).join('') : String(t || '');
  return o._type === 'text' && /^[A-D]$/.test(words.trim());
});

for (const height of [5.8, 4.4, 4.0]) {
  test(`in a ${height}in board every letter has the height of one readable line`, () => {
    const found = letters(draw(height));
    // Where the words cannot print at 18pt under their letters, the letters
    // lead the words instead and none takes a line (sort-board-letter-leads).
    assert.ok(found.length === 4 || found.length === 0, 'the letters take a line each, or none does');
    for (const letter of found) {
      assert.ok(letter.options.h >= 0.34 - 1e-6, `a letter's box is ${letter.options.h.toFixed(2)}in tall`);
    }
  });
}

test('a tall board keeps the roomier letter band it had', () => {
  const found = letters(draw(5.8));
  assert.ok(found.every((letter) => letter.options.h >= 0.34 && letter.options.h <= 0.45 + 1e-6));
});
