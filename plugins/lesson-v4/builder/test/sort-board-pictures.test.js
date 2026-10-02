'use strict';

// A sort on the board can carry a picture on each card, so a picture sort or
// a picture order a printed kit offers has its board version too (the
// Nativity trial of 30 September 2026 could not lay out its picture cards on
// a slide at all).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const PptxGenJS = require('pptxgenjs');
const { drawSortBoard } = require('../src/content/sort-board');

// A one-pixel PNG is all the board needs on disk; its shape comes from imageDims.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

function lessonDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sort-board-pictures-'));
  for (const name of ['a.png', 'b.png', 'c.png', 'd.png']) fs.writeFileSync(path.join(dir, name), PNG);
  return dir;
}

function draw(data, dims) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'W', width: 13.333, height: 7.5 });
  pptx.layout = 'W';
  const slide = pptx.addSlide();
  const dir = lessonDir();
  const imageDims = {};
  for (const name of ['a.png', 'b.png', 'c.png', 'd.png']) imageDims[name] = dims || { w: 400, h: 300 };
  drawSortBoard(pptx, slide, { x: 0.3, y: 1.4, w: 12.7, h: 5.8, class: 'A' }, data,
    { slideIndex: 0, lessonDir: dir, imageDims: imageDims });
  return slide;
}

const images = (slide) => slide._slideObjects.filter((o) => o._type === 'image');
const named = (slide, prefix) => slide._slideObjects.filter((o) => String((o.options && o.options.objectName) || '').startsWith(prefix));
const box = (o) => ({ x: o.options.x, y: o.options.y, w: o.options.w, h: o.options.h });

const MEANINGS = [
  { label: 'God showed people the way to Jesus.' },
  { label: 'Jesus only came for poor people.' },
  { label: 'Jesus came for people from every country.' },
  { label: 'The news about Jesus is good news to tell everyone.' }
];

test('each pictured card draws its picture whole, above its words, inside its card', () => {
  const slide = draw({
    bank: [
      { label: 'A', text: 'The shepherds told everyone what they had seen.', imagePath: 'a.png' },
      { label: 'B', text: 'A bright star led the wise men to Jesus.', imagePath: 'b.png' },
      { label: 'C', text: 'Wise men came from countries far away.', imagePath: 'c.png' }
    ],
    groups: MEANINGS
  });
  const pictures = images(slide);
  assert.equal(pictures.length, 3);
  const words = named(slide, '').filter((o) => /sort-bank-card-\d+$/.test(o.options.objectName));
  assert.equal(words.length, 3);
  pictures.forEach((picture, i) => {
    const p = box(picture);
    // Never stretched: the drawn box keeps the picture's own 4:3 shape.
    assert.ok(Math.abs(p.w / p.h - 4 / 3) < 0.01, `picture ${i + 1} keeps its shape`);
    // Large enough for the back row.
    assert.ok(p.h >= 0.9, `picture ${i + 1} is ${p.h.toFixed(2)}in tall`);
    assert.ok(p.y + p.h <= box(words[i]).y + 1e-6, `picture ${i + 1} sits above its words`);
  });
  // The three pictures line up: one shared layout, so one shared top.
  assert.equal(new Set(pictures.map((p) => p.options.y.toFixed(3))).size, 1);
});

test('a picture order gives each picture most of its card, with its short title under it', () => {
  const titles = ['The angel visits Mary', 'Jesus is born', 'The shepherds visit', 'The wise men visit'];
  const slide = draw({
    bank: ['a', 'b', 'c', 'd'].map((n, i) => ({ label: 'ABCD'[i], text: titles[i], imagePath: n + '.png' })),
    groups: [{ label: '1st' }, { label: '2nd' }, { label: '3rd' }, { label: '4th' }]
  }, { w: 300, h: 400 });
  const pictures = images(slide);
  assert.equal(pictures.length, 4);
  assert.equal(named(slide, 'GROWFIT').filter((o) => /sort-bank-card-/.test(o.options.objectName)).length, 4);
  pictures.forEach((picture) => assert.ok(box(picture).h >= 1.5, `a picture card's picture is ${box(picture).h.toFixed(2)}in tall`));
});

test('a sentence heading prints at 24pt or more in its place', () => {
  const slide = draw({
    bank: [
      { label: 'A', text: 'The shepherds told everyone.', imagePath: 'a.png' },
      { label: 'B', text: 'A star led the wise men.', imagePath: 'b.png' }
    ],
    groups: MEANINGS
  });
  const { wrappedLineCount } = require('../src/glyph-width');
  named(slide, '').filter((o) => /sort-heading-\d+$/.test(o.options.objectName)).forEach((heading) => {
    const words = String(Array.isArray(heading.text) ? heading.text.map((r) => r.text).join('') : heading.text);
    const lines = wrappedLineCount(words, 24, heading.options.w - 0.05, true);
    assert.ok(lines * 1.26 * 24 / 72 <= heading.options.h + 0.05, `"${words}" has room at 24pt`);
  });
});

test('a picture still to come holds its place and is recorded; no title or a partly pictured sort is refused by name', () => {
  assert.throws(() => draw({
    bank: [{ label: 'A', imagePath: 'a.png' }, { label: 'B', text: 'Wise men', imagePath: 'b.png' }],
    groups: MEANINGS.slice(0, 2)
  }), /SORT_BOARD_BANK_PICTURE_UNTITLED: card 1/);
  // A picture not there yet holds its card's place and is recorded as a
  // missing required picture, which the final build refuses; the preview,
  // built before the pictures land, still lays the sort out.
  const { clearMissingPictures, missingPictureFindings } = require('../src/content/image');
  clearMissingPictures();
  const pending = draw({
    bank: [{ text: 'Shepherds', imagePath: 'a.png' }, { text: 'Wise men', imagePath: 'nowhere.png' }],
    groups: MEANINGS.slice(0, 2)
  });
  assert.equal(images(pending).length, 1);
  assert.ok(missingPictureFindings().some((f) => f.part === 'nowhere.png'), 'the missing picture is recorded');
  assert.throws(() => draw({
    bank: [{ text: 'Shepherds', imagePath: 'a.png' }, 'Wise men'],
    groups: MEANINGS.slice(0, 2)
  }), /SORT_BOARD_BANK_PICTURE_MIXED/);
});

test('a words-only sort draws no picture and keeps its words beside their names', () => {
  const slide = draw({
    bank: [{ label: 'A', text: 'Burn tar in the street.' }, { label: 'B', text: 'Boil the water.' }],
    groups: MEANINGS.slice(0, 2)
  });
  assert.equal(images(slide).length, 0);
  const words = named(slide, '').filter((o) => /sort-bank-card-\d+$/.test(o.options.objectName));
  words.forEach((o) => assert.equal(o.options.align, 'left'));
});

test('the places are a heading and room for a letter, so twelve picture cards fit', () => {
  const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
  const slide = draw({
    bank: Array.from({ length: 12 }, (_, i) => ({ label: String.fromCharCode(65 + i), text: 'Part ' + (i + 1), imagePath: 'abcd'[i % 4] + '.png' })),
    groups: ordinals.map((label) => ({ label: label }))
  });
  assert.equal(images(slide).length, 12);
  const panels = slide._slideObjects.filter((o) => o.options && o.options.line && o.options.line.dashType === 'dash');
  assert.equal(panels.length, 6);
  // One row of places, none deeper than an inch and a quarter.
  assert.equal(new Set(panels.map((p) => p.options.y.toFixed(3))).size, 1);
  panels.forEach((p) => assert.ok(p.options.h <= 1.25, `a place is ${p.options.h.toFixed(2)}in deep`));
  images(slide).forEach((p) => assert.ok(box(p).h >= 0.9));
});
