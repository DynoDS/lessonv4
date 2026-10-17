'use strict';

// A picture whose white border is trimmed is drawn at the trimmed shape.
//
// The build trims a near-white matte off a picture and puts the trimmed copy on
// the slide, but laid it out by the untrimmed file's shape, so PowerPoint
// squeezed the copy into the original's box. A leather fire bucket, 899 x 1200
// trimmed to 819 x 891, went onto two Great Fire of London slides 18% too
// narrow, and a seagull went onto a renga slide 21% out (17 October 2026).
// What is pinned here is that the shape a slide lays out is the shape of the
// file it embeds, and that a trimmed copy never outlives the picture it was
// made from.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const requireGlobal = require('../src/require-global');
const sharp = requireGlobal('sharp');
const PptxGenJS = requireGlobal('pptxgenjs');
const { preResizeAll } = require('../src/images/resize');
const { preMeasureAll } = require('../src/images/measure');
const { resolveForEmbed } = require('../src/images/resolve');
const { drawImage, clearPictureFloor } = require('../src/content/image');
const { clearWarnings } = require('../src/warnings');

const RED = { r: 200, g: 30, b: 30 };
const WHITE = { r: 255, g: 255, b: 255 };
const PICTURE = 'photos/box.png';

// A 300 x 300 red square on a 300 x 400 white page: the trim keeps three
// quarters of the file, inside the area floors, and turns tall into square.
async function mattedSquare(file) {
  const square = await sharp({ create: { width: 300, height: 300, channels: 3, background: RED } }).png().toBuffer();
  await sharp({ create: { width: 300, height: 400, channels: 3, background: WHITE } })
    .composite([{ input: square, top: 50, left: 0 }])
    .png()
    .toFile(file);
}

async function plainPicture(file, width, height) {
  await sharp({ create: { width, height, channels: 3, background: RED } }).png().toFile(file);
}

function lessonDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trimmed-picture-'));
  fs.mkdirSync(path.join(dir, 'photos'));
  return dir;
}

function lessonWith(body) {
  return { slides: [{ template: 'body-full', body }] };
}

async function prepare(dir, lesson) {
  await preResizeAll(lesson, dir);
  return preMeasureAll(lesson, dir);
}

function draw(dir, lesson, imageDims) {
  const added = [];
  const shapes = [];
  const ctx = { slideIndex: 0, lessonDir: dir, lesson, imageDims };
  clearWarnings();
  clearPictureFloor();
  const realWarn = console.warn;
  console.warn = () => {};
  try {
    drawImage(new PptxGenJS(), {
      addShape: (...a) => shapes.push(a),
      addText: () => {},
      addImage: (o) => added.push(o),
    }, { x: 1, y: 1.5, w: 6, h: 5 }, lesson.slides[0].body, ctx);
  } finally {
    console.warn = realWarn;
    clearPictureFloor();
    clearWarnings();
  }
  return { added, shapes };
}

async function fileShape(file) {
  const meta = await sharp(file).metadata();
  return meta.width / meta.height;
}

test('a trimmed picture is drawn at the shape of the trimmed file it embeds', async () => {
  const dir = lessonDir();
  await mattedSquare(path.join(dir, PICTURE));
  const lesson = lessonWith({ type: 'image', imagePath: PICTURE });
  const dims = await prepare(dir, lesson);

  const embedded = resolveForEmbed(PICTURE, { lessonDir: dir });
  assert.ok(embedded.includes('.resized'), 'the white page was trimmed into a cached copy');
  assert.ok(Math.abs((await fileShape(embedded)) - 1) < 0.01, 'the copy is square');

  const { added } = draw(dir, lesson, dims);
  assert.equal(added.length, 1);
  assert.equal(added[0].path, embedded);
  const drawn = added[0].w / added[0].h;
  assert.ok(Math.abs(drawn - 1) < 0.01, `drawn ${added[0].w.toFixed(2)}" by ${added[0].h.toFixed(2)}", not square`);
});

test('a filling picture is cropped from the trimmed file without stretching it', async () => {
  const dir = lessonDir();
  await mattedSquare(path.join(dir, PICTURE));
  const lesson = lessonWith({ type: 'image', imagePath: PICTURE, fit: 'cover' });
  const { added } = draw(dir, lesson, await prepare(dir, lesson));
  assert.equal(added.length, 1);
  assert.ok(Math.abs(added[0].w / added[0].h - 1) < 0.01, 'the scaled file keeps the copy\'s square shape');
});

test('a labelled diagram base keeps its framing even when an old trimmed copy is lying about', async () => {
  const dir = lessonDir();
  await mattedSquare(path.join(dir, PICTURE));
  // First built as a plain photo, which leaves a trimmed copy behind.
  await prepare(dir, lessonWith({ type: 'image', imagePath: PICTURE }));
  // Then the same picture becomes the base of a labelled diagram, whose dots
  // sit at percentages of the whole, untrimmed picture.
  await prepare(dir, lessonWith({ type: 'label-diagram', imagePath: PICTURE, labels: [] }));
  const embedded = resolveForEmbed(PICTURE, { lessonDir: dir });
  assert.ok(Math.abs((await fileShape(embedded)) - 0.75) < 0.01, 'the diagram is drawn on the whole picture');
});

test('a replaced picture that needs no trim is drawn, not the old trimmed copy', async () => {
  const dir = lessonDir();
  const file = path.join(dir, PICTURE);
  await mattedSquare(file);
  await prepare(dir, lessonWith({ type: 'image', imagePath: PICTURE }));
  assert.ok(fs.existsSync(path.join(dir, '.resized', PICTURE)));

  await plainPicture(file, 400, 200);
  const later = new Date(Date.now() + 5000);
  fs.utimesSync(file, later, later);
  const lesson = lessonWith({ type: 'image', imagePath: PICTURE });
  const dims = await prepare(dir, lesson);

  assert.equal(fs.existsSync(path.join(dir, '.resized', PICTURE)), false, 'the old copy is gone');
  const { added } = draw(dir, lesson, dims);
  assert.equal(added[0].path, file);
  assert.ok(Math.abs(added[0].w / added[0].h - 2) < 0.01, 'drawn at the new picture\'s shape');
});

test('a picture that has gone shows its placeholder, not a copy left from before', async () => {
  const dir = lessonDir();
  const file = path.join(dir, PICTURE);
  await mattedSquare(file);
  await prepare(dir, lessonWith({ type: 'image', imagePath: PICTURE }));
  fs.unlinkSync(file);

  const lesson = lessonWith({ type: 'image', imagePath: PICTURE });
  const dims = await prepare(dir, lesson);
  const { added, shapes } = draw(dir, lesson, dims);
  assert.equal(added.length, 0, 'no picture is embedded');
  assert.ok(shapes.length > 0, 'the grey placeholder is drawn');
});

test('a trimmed copy made from the current picture is reused, not made again', async () => {
  const dir = lessonDir();
  await mattedSquare(path.join(dir, PICTURE));
  const lesson = lessonWith({ type: 'image', imagePath: PICTURE });
  await prepare(dir, lesson);
  const copy = path.join(dir, '.resized', PICTURE);
  const before = fs.statSync(copy).mtimeMs;
  await prepare(dir, lesson);
  assert.equal(fs.statSync(copy).mtimeMs, before);
});
