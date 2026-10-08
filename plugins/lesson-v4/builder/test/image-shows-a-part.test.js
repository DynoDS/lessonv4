'use strict';

// An image that names a part of its own picture is drawn as that part alone.
//
// A Year 6 science slide asked children to find a red tube on a whole-body
// diagram of the blood vessels, 1920 x 4249. No slide can show a body that
// shape at a size where the tubes are more than hairlines, and the teacher
// chose the chest alone for that slide and for the word card (8 October 2026).
// What is pinned here is that everything which asks about the picture's shape
// is answered for the part shown: the fit, the shape a layout reserves, and
// the readable floor.

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawImage, imageAspect, widthAtHeight, pictureFloorFindings, clearPictureFloor } = require('../src/content/image');
const { clearWarnings } = require('../src/warnings');

const REAL_FILE = path.join(__dirname, '..', 'assets', 'maps', 'europe.png');
const BODY = { w: 1920, h: 4249 };
// Head and legs cut away: the chest, 1920 x 1572 of the file.
const CHEST = { x: 0, y: 0.13, w: 1, h: 0.37 };

function draw(zone, data) {
  const added = [];
  const lesson = { slides: [{ template: 'body-full', body: data }] };
  const ctx = { slideIndex: 0, lesson, imageDims: { [REAL_FILE]: BODY } };
  clearWarnings();
  clearPictureFloor();
  const realWarn = console.warn;
  console.warn = () => {};
  try {
    drawImage(new PptxGenJS(), { addShape: () => {}, addText: () => {}, addImage: (o) => added.push(o) }, zone, data, ctx);
  } finally {
    console.warn = realWarn;
  }
  const findings = pictureFloorFindings();
  clearPictureFloor();
  clearWarnings();
  return { added, findings, ctx };
}

const COLUMN = { x: 8, y: 1.5, w: 5, h: 5.24 };

test('the named part is what fills the frame, cropped from the whole file', () => {
  const { added } = draw(COLUMN, { type: 'image', imagePath: REAL_FILE, detail: CHEST });
  assert.equal(added.length, 1);
  const image = added[0];
  // The frame is 4.76" by 5.00"; the chest is 1.22 times as wide as tall, so
  // width binds and the part is drawn 4.76" by 3.90".
  assert.equal(image.sizing.type, 'crop');
  assert.ok(Math.abs(image.sizing.w - 4.76) < 0.01, `part width ${image.sizing.w}`);
  assert.ok(Math.abs(image.sizing.h - 3.9) < 0.01, `part height ${image.sizing.h}`);
  // The whole file is scaled so the part is that size, and nothing is stretched.
  assert.ok(Math.abs(image.w / image.h - BODY.w / BODY.h) < 1e-6);
  assert.ok(Math.abs(image.w - 4.76) < 0.01);
  // The crop starts 13 percent of the way down the scaled file.
  assert.ok(Math.abs(image.sizing.y - 0.13 * image.h) < 1e-6);
  assert.ok(Math.abs(image.sizing.x) < 1e-6);
});

test('the same image with no part named is drawn whole, uncropped', () => {
  const { added } = draw(COLUMN, { type: 'image', imagePath: REAL_FILE, essential: false });
  assert.equal(added.length, 1);
  assert.equal(added[0].sizing, undefined);
  assert.ok(Math.abs(added[0].w / added[0].h - BODY.w / BODY.h) < 1e-6);
});

test('a layout is told the shape of the part, not of the file', () => {
  const ctx = { imageDims: { [REAL_FILE]: BODY } };
  const whole = { type: 'image', imagePath: REAL_FILE };
  const part = { ...whole, detail: CHEST };
  assert.ok(Math.abs(imageAspect(whole, ctx) - 1920 / 4249) < 1e-6);
  assert.ok(Math.abs(imageAspect(part, ctx) - 1920 / (4249 * 0.37)) < 1e-6);
  assert.ok(widthAtHeight(part, 4, ctx) > widthAtHeight(whole, 4, ctx) * 2);
});

test('the readable floor measures the part shown', () => {
  // A word card's picture box, about 1.4" by 2.7". The whole body draws 1.1"
  // wide and is refused; the chest fills the width and is not. The two
  // companions put both in the base tier, where a word card's picture sits.
  const box = { x: 9, y: 4, w: 2.2, h: 2.68 };
  const companions = [
    { type: 'image', imagePath: 'unsplash/a.jpg' },
    { type: 'image', imagePath: 'unsplash/b.jpg' },
  ];
  const run = (data) => {
    const lesson = { slides: [{ template: 'body-full', body: { type: 'stack', items: [data, ...companions] } }] };
    const ctx = { slideIndex: 0, lesson, imageDims: { [REAL_FILE]: BODY } };
    clearPictureFloor();
    clearWarnings();
    const realWarn = console.warn;
    console.warn = () => {};
    try {
      drawImage(new PptxGenJS(), { addShape: () => {}, addText: () => {}, addImage: () => {} }, box, data, ctx);
    } finally {
      console.warn = realWarn;
    }
    const findings = pictureFloorFindings();
    clearPictureFloor();
    clearWarnings();
    return findings;
  };
  assert.equal(run({ type: 'image', imagePath: REAL_FILE }).length, 1);
  assert.equal(run({ type: 'image', imagePath: REAL_FILE, detail: CHEST }).length, 0);
});
