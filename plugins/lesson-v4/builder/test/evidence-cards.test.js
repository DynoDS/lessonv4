'use strict';

// The starter cards of 30 August 2026: one photograph card spanning the whole
// body with white flanks either side of a contain-fitted photo, and field
// labels rendered "Uses electricity?:" - the renderer's joining colon stacked
// on the label's own question mark. A lone card now hugs the width its
// photograph can use, and a label that ends in punctuation keeps its own voice.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');

const { drawEvidenceCards } = require('../src/content/evidence-cards');

const ZONE = { x: 0.5, y: 1, w: 12, h: 5.5, class: 'A' };
const PAD = 0.12;

// A tiny real PNG on disk so the image resolves as delivered, with measured
// dimensions supplied through ctx.imageDims exactly as the build does.
function makeLessonDir(aspectW, aspectH) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-cards-'));
  // 1x1 transparent PNG; the drawn size comes from ctx.imageDims, not the file.
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync(path.join(dir, 'photo.png'), png);
  return {
    lessonDir: dir,
    imageDims: { 'photo.png': { w: aspectW, h: aspectH } },
    slideIndex: 0
  };
}

function record() {
  const shapes = [];
  const texts = [];
  return {
    slide: {
      addShape(type, opts) { shapes.push({ type, opts }); },
      addText(value, opts) { texts.push({ value, opts }); },
      addImage(opts) { shapes.push({ type: 'image', opts }); }
    },
    shapes,
    texts
  };
}

function flatText(value) {
  return Array.isArray(value) ? value.map((r) => r.text).join('') : String(value);
}

const PROMPT_FIELDS = [
  { label: 'Object name', value: ' ' },
  { label: 'Uses electricity?', value: ' ' },
  { label: 'Visible clue', value: ' ' }
];

test('a lone evidence card hugs its photograph instead of spanning the zone', () => {
  const pptx = new PptxGenJS();
  const ctx = makeLessonDir(400, 300); // 4:3 photo binds well below the floor
  const { slide, shapes } = record();

  drawEvidenceCards(pptx, slide, ZONE, {
    type: 'evidence-cards',
    items: [{ imagePath: 'photo.png', fit: 'contain', fields: PROMPT_FIELDS }]
  }, ctx);

  const card = shapes.find((s) => s.type === pptx.shapes.ROUNDED_RECTANGLE);
  assert.ok(card, 'the card rectangle was drawn');

  const innerW = ZONE.w - 2 * PAD;
  // A 4:3 photo cannot use the full width at the height a prompt card gives
  // it, so the card falls back to the field-line floor: half the zone, centred.
  assert.ok(
    Math.abs(card.opts.w - innerW * 0.5) < 0.01,
    `card width ${card.opts.w} should hug to half the zone (${innerW * 0.5})`
  );
  const expectedX = ZONE.x + PAD + (innerW - card.opts.w) / 2;
  assert.ok(
    Math.abs(card.opts.x - expectedX) < 0.01,
    `card x ${card.opts.x} should centre at ${expectedX}`
  );
});

test('a lone card with a genuinely wide photograph keeps the full zone width', () => {
  const pptx = new PptxGenJS();
  const ctx = makeLessonDir(1600, 300); // panorama: width is genuinely usable
  const { slide, shapes } = record();

  drawEvidenceCards(pptx, slide, ZONE, {
    type: 'evidence-cards',
    items: [{ imagePath: 'photo.png', fit: 'contain', fields: PROMPT_FIELDS }]
  }, ctx);

  const card = shapes.find((s) => s.type === pptx.shapes.ROUNDED_RECTANGLE);
  const innerW = ZONE.w - 2 * PAD;
  assert.ok(
    Math.abs(card.opts.w - innerW) < 0.01,
    `a panorama's card should span the zone, got ${card.opts.w}`
  );
});

test('two cards keep the ordinary side-by-side geometry', () => {
  const pptx = new PptxGenJS();
  const ctx = makeLessonDir(400, 300);
  const { slide, shapes } = record();

  drawEvidenceCards(pptx, slide, ZONE, {
    type: 'evidence-cards',
    items: [
      { imagePath: 'photo.png', fit: 'contain', fields: PROMPT_FIELDS },
      { imagePath: 'photo.png', fit: 'contain', fields: PROMPT_FIELDS }
    ]
  }, ctx);

  const cards = shapes.filter((s) => s.type === pptx.shapes.ROUNDED_RECTANGLE);
  assert.equal(cards.length, 2);
  const innerW = ZONE.w - 2 * PAD;
  const expectedW = (innerW - 0.18) / 2;
  for (const card of cards) {
    assert.ok(Math.abs(card.opts.w - expectedW) < 0.01);
  }
});

test('a label ending in punctuation takes no joining colon', () => {
  const pptx = new PptxGenJS();
  const ctx = makeLessonDir(400, 300);
  const { slide, texts } = record();

  drawEvidenceCards(pptx, slide, ZONE, {
    type: 'evidence-cards',
    items: [{
      imagePath: 'photo.png',
      fit: 'contain',
      fields: [
        { label: 'Object name', value: 'Torch' },
        { label: 'Uses electricity?', value: 'Yes' }
      ]
    }]
  }, ctx);

  const answer = texts.map((t) => flatText(t.value)).join('\n');
  assert.ok(answer.includes('Object name: '), 'a bare label keeps its colon');
  assert.ok(!answer.includes('?:'), `"?" must not gain a colon on top: ${answer}`);
  assert.ok(answer.includes('Uses electricity? '), 'the question label joins with a space');
});

test('whitespace-only values count as a prompt card, not answers', () => {
  const pptx = new PptxGenJS();
  const ctx = makeLessonDir(400, 300);
  const { slide, texts } = record();

  drawEvidenceCards(pptx, slide, ZONE, {
    type: 'evidence-cards',
    items: [{ imagePath: 'photo.png', fit: 'contain', fields: PROMPT_FIELDS }]
  }, ctx);

  const cardH = ZONE.h - 2 * PAD;
  const fieldBlock = texts[texts.length - 1];
  // PROMPT_RATIO (0.52), not ANSWER_RATIO (0.38): a space is not an answer.
  assert.ok(
    Math.abs(fieldBlock.opts.h - cardH * 0.52) < 0.01,
    `prompt fields should take the prompt share, got ${fieldBlock.opts.h}`
  );
});
