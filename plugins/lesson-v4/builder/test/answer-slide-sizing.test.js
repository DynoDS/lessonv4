'use strict';

// 19 September 2026. The teacher, on the Codex nearest-1,000 deck: "the only
// thing on these answer slides are answers, they can be bigger right?" and, of
// a two-line starter reveal, "the card isnt great because its the full width of
// deadspace".
const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawContent } = require('../src/content');
const { measureText } = require('../src/content/text');

const ZONE = { x: 0.2, y: 1.2, w: 12.0, h: 5.4, class: 'A' };

function fakeSlide() {
  const texts = [];
  const shapes = [];
  return {
    texts,
    shapes,
    addText: (content, options) => texts.push({ content, ...options }),
    addShape: (kind, options) => shapes.push({ kind, ...options }),
    addImage: () => {}
  };
}

function draw(data) {
  const slide = fakeSlide();
  drawContent(new PptxGenJS(), slide, ZONE, data, { slideIndex: 0, imageDims: {}, cardLook: true });
  return slide;
}

function largestFont(slide) {
  return slide.texts.reduce((most, t) => Math.max(most, t.fontSize || 0), 0);
}

test('a set that is all answers is set larger than the same set of questions', () => {
  const answers = ['||499 → 0.', '||2,650 → 3,000.', '||500 → 1,000.'];
  const questions = ['499', '2,650', '500'];
  const answerFont = largestFont(draw({ type: 'numbered-questions', questions: answers }));
  const questionFont = largestFont(draw({ type: 'numbered-questions', questions: questions }));
  assert.ok(answerFont > questionFont, `answers ${answerFont} vs questions ${questionFont}`);
});

test('an answer block fills its zone rather than hugging in the corner', () => {
  const reveal = { type: 'text', value: '||346 → 300.\n350 → 400.' };
  assert.equal(measureText(ZONE, reveal, {}), null, 'a reveal measures as a fill');

  const teaching = { type: 'text', value: '346 → 300.\n350 → 400.' };
  const hugged = measureText(ZONE, teaching, {});
  assert.ok(hugged && hugged.h < ZONE.h, 'ordinary text still hugs');
});

test('a designer who names a height mode still gets it', () => {
  const hugged = { type: 'text', value: '||346 → 300.', heightMode: 'hug' };
  const measured = measureText(ZONE, hugged, {});
  assert.ok(measured && measured.h < ZONE.h, 'an explicit hug is honoured on a reveal');
});
