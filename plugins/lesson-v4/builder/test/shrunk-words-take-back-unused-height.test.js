'use strict';

// A row of wide photographs cannot use the height its weight gives it: three
// across, each is as tall as its width allows. The single-item measure did not
// look inside a row, so the row kept its whole share, the part it did not use
// stood empty at the foot of the slide, and the question above it was fitted
// into its own small share at 19pt. A Year 4 food chains slide (15 October
// 2026), "Which is the producer? Which are consumers?" over grass, a rabbit and
// a fox. The teacher: "why couldn't pictures have moved down and text is
// bigger?" A row of pictures now hands back what it does not use, and words
// squeezed below their size take back only what brings them to reading size.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { stackLayout } = require('../src/content/stack');

const ZONE = { x: 0.22, y: 0.95, w: 12.89, h: 6.43, class: 'E-wide' };

function lessonWithWidePhotos() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shrunk-words-'));
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
  const imageDims = {};
  for (const name of ['grass.png', 'rabbit.png', 'fox.png']) {
    fs.writeFileSync(path.join(dir, name), png);
    imageDims[name] = { w: 1600, h: 1200 };
  }
  return { slideIndex: 0, lessonDir: dir, imageDims, cardLook: true, lesson: {} };
}

const QUESTION = { type: 'text', value: 'Which is the producer?\n\nWhich are consumers?', align: 'center', weight: 0.55 };
const PHOTOS = {
  type: 'row',
  weight: 2.5,
  items: ['grass', 'rabbit', 'fox'].map((n) => ({ type: 'image', imagePath: `${n}.png`, fit: 'contain', caption: n }))
};
const share = (weight) => (ZONE.h - 0.10) * weight / (0.55 + 2.5);

test('a row of wide photographs hands back the height it does not use, and the question takes it', () => {
  const laid = stackLayout(ZONE, { type: 'stack', items: [QUESTION, PHOTOS] }, lessonWithWidePhotos());
  assert.ok(laid[1].zone.h < share(2.5) - 0.5,
    `the row keeps ${laid[1].zone.h.toFixed(2)}in of the ${share(2.5).toFixed(2)}in its weight gave it`);
  assert.ok(laid[0].zone.h > share(0.55) + 0.5,
    `the question has ${laid[0].zone.h.toFixed(2)}in; its weight alone gave ${share(0.55).toFixed(2)}in`);
});

test('the question takes only what brings it to reading size, never a poster', () => {
  const laid = stackLayout(ZONE, { type: 'stack', items: [QUESTION, PHOTOS] }, lessonWithWidePhotos());
  const used = laid[0].zone.h + 0.10 + laid[1].zone.h;
  // What is left after the question reaches 28pt stays where it was handed
  // back, rather than inflating the card past its words.
  assert.ok(used < ZONE.h - 0.05, `the stack fills ${used.toFixed(2)}in of ${ZONE.h.toFixed(2)}in`);
});

test('words that already print at their size take nothing', () => {
  const short = { type: 'text', value: 'Look.', align: 'center', weight: 1.5 };
  const laid = stackLayout(ZONE, { type: 'stack', items: [short, PHOTOS] }, lessonWithWidePhotos());
  assert.ok(laid[0].zone.h <= share(1.5) + 1e-6, `the short line has ${laid[0].zone.h.toFixed(2)}in`);
});
