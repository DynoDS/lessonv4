'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { COLOURS } = require('../src/styles');

const {
  tokenizeWriteInContent,
  splitAnswerBoxText,
  answerBoxMetrics,
  drawAnswerBox
} = require('../src/answer-box');
const {
  PICTURE_TRANSPARENCY,
  resolvePictureSet,
  pictureMetrics,
  drawContentPicture
} = require('../src/content-picture');
const { drawQuestionCards } = require('../src/content/question-cards');
const { drawNumberedQuestions } = require('../src/content/numbered-questions');
const { validateLesson } = require('../src/validate');

function fakePptx() {
  return {
    shapes: { ROUNDED_RECTANGLE: 'roundRect' },
    ShapeType: { ellipse: 'ellipse' }
  };
}

function fakeSlide() {
  return {
    shapes: [],
    texts: [],
    images: [],
    addShape(type, options) { this.shapes.push({ type, options }); },
    addText(value, options) { this.texts.push({ value, options }); },
    addImage(options) { this.images.push(options); }
  };
}

test('answer-box syntax keeps one prompt and one reveal value', () => {
  assert.deepEqual(splitAnswerBoxText('6 × 7 = ||42'), {
    text: '6 × 7 =',
    answer: '42',
    revealed: true
  });
  assert.deepEqual(tokenizeWriteInContent('First ____ then □'), [
    { text: 'First ' },
    { box: true },
    { text: ' then ' },
    { box: true }
  ]);
});

test('the answer reveal stays white and adds green text without moving', () => {
  const slide = fakeSlide();
  const box = { x: 1, y: 2, w: 0.8, h: 0.5 };
  drawAnswerBox(fakePptx(), slide, box, '', false);
  drawAnswerBox(fakePptx(), slide, box, '42', true);

  assert.equal(slide.shapes[0].options.objectName, 'answer-box-empty');
  assert.equal(slide.shapes[1].options.objectName, 'answer-box-revealed');
  assert.ok(slide.shapes[0].options.shadow);
  assert.equal(slide.shapes[0].options.fill.color, COLOURS.pureWhite);
  assert.equal(slide.shapes[1].options.fill.color, COLOURS.pureWhite);
  assert.equal(slide.texts[0].options.color, COLOURS.green);
  assert.deepEqual(
    ['x', 'y', 'w', 'h'].map((key) => slide.shapes[0].options[key]),
    ['x', 'y', 'w', 'h'].map((key) => slide.shapes[1].options[key])
  );
  assert.equal(slide.texts[0].value, '42');
});

test('an answer cue is a generous square that respects the row height', () => {
  const metrics = answerBoxMetrics(40, 0.8);
  assert.equal(metrics.w, metrics.h);
  assert.ok(metrics.h >= 0.65);
  assert.ok(metrics.h <= 0.721);
});

test('a short money answer reduces enough to stay on one line', () => {
  const slide = fakeSlide();
  drawAnswerBox(fakePptx(), slide, { x: 1, y: 2, w: 0.95, h: 0.6 }, '£200', true, { fontSize: 28 });
  assert.ok(slide.texts[0].options.fontSize < 28);
  assert.ok(slide.texts[0].options.fontSize >= 12);
});

test('partial context pictures stay while unpictured questions close up', () => {
  const items = [
    { text: 'Spot the robin', picture: { kind: 'emoji', value: '🐦', alt: 'robin' } },
    'Which season is it?',
    { text: 'Choose the television', picture: { kind: 'emoji', value: '📺', alt: 'television' } }
  ];
  const pictures = resolvePictureSet(items, {});
  assert.equal(pictures[0].value, '🐦');
  assert.equal(pictures[1], null);
  assert.equal(pictures[2].value, '📺');

  const slide = fakeSlide();
  drawQuestionCards(
    fakePptx(),
    slide,
    { x: 0.5, y: 1, w: 12, h: 5, class: 'A' },
    { questions: items },
    { imageDims: {} }
  );
  const contextPictures = slide.texts.filter((entry) =>
    entry.options && /question-context-.*-emoji/.test(entry.options.objectName || '')
  );
  assert.equal(contextPictures.length, 2);
});

test('slide context pictures scale from row height and render at half transparency', () => {
  const metrics = pictureMetrics(
    { type: 'image', imagePath: 'robin.png' },
    1.1,
    { imageDims: { 'robin.png': { w: 600, h: 500 } } },
    1.55
  );
  assert.ok(metrics.h > 1.05);
  assert.ok(metrics.w > metrics.h);

  const slide = fakeSlide();
  drawContentPicture(
    slide,
    { type: 'image', resolvedPath: 'robin.png', alt: 'robin' },
    { x: 1, y: 1, w: 1.2, h: 1 }
  );
  drawContentPicture(
    slide,
    { type: 'emoji', value: '🐦', alt: 'robin' },
    { x: 2, y: 1, w: 1, h: 1 }
  );
  assert.equal(slide.images[0].transparency, PICTURE_TRANSPARENCY);
  assert.equal(slide.texts[0].options.transparency, PICTURE_TRANSPARENCY);
});

test('answer boxes work on task and reveal versions of a numbered set', () => {
  const task = fakeSlide();
  drawNumberedQuestions(
    fakePptx(), task,
    { x: 0.5, y: 1, w: 8, h: 4, class: 'A' },
    { answerBoxes: true, questions: ['6 × 7 =', '9 × 4 ='] },
    {}
  );
  assert.equal(task.shapes.filter((s) => s.options.objectName === 'answer-box-empty').length, 2);
  const firstCard = task.shapes[0].options;
  const firstBox = task.shapes.find((s) => s.options.objectName === 'answer-box-empty').options;
  assert.ok(
    firstCard.x + firstCard.w - (firstBox.x + firstBox.w) <= 0.061,
    'answer box should sit close to the card edge'
  );

  const reveal = fakeSlide();
  drawNumberedQuestions(
    fakePptx(), reveal,
    { x: 0.5, y: 1, w: 8, h: 4, class: 'A' },
    { answerBoxes: true, questions: ['6 × 7 = ||42', '9 × 4 = ||36'] },
    {}
  );
  assert.equal(reveal.shapes.filter((s) => s.options.objectName === 'answer-box-revealed').length, 2);
  assert.deepEqual(
    reveal.texts.filter((t) => t.options.objectName === 'answer-box-value').map((t) => t.value),
    ['42', '36']
  );
});

test('long questions keep their pictures when wrapping still fits at the same font', () => {
  const slide = fakeSlide();
  drawNumberedQuestions(
    fakePptx(), slide,
    { x: 0.5, y: 1, w: 12, h: 5.5, class: 'A' },
    {
      answerBoxes: true,
      questions: [
        { text: 'A robin eats 3 worms, then 5 more. Total =', picture: { kind: 'emoji', value: '🐦' } },
        'Work out 12 - 5 =',
        { text: 'A television costs £240 and is reduced by £40. New price =', picture: { kind: 'emoji', value: '📺' } },
        { text: 'A baptism candle burns for 15 minutes. 5 minutes have passed. Minutes left =', picture: { kind: 'emoji', value: '🕯️' } }
      ]
    },
    {}
  );
  assert.equal(
    slide.texts.filter((entry) => /question-context-.*-emoji/.test(entry.options.objectName || '')).length,
    3
  );
});

test('number and picture form a tight left group when an answer box uses the right', () => {
  const slide = fakeSlide();
  // startAt places this question mid-run: a lone question at (1) prints no
  // number at all (see lone-question-number.test.js), and this test is about
  // where a printed number sits, so it needs one that prints.
  drawNumberedQuestions(
    fakePptx(), slide,
    { x: 0.5, y: 1, w: 12, h: 2, class: 'A' },
    {
      answerBoxes: true,
      startAt: 2,
      questions: [
        { text: 'A robin eats 3 worms, then 5 more. Total =', picture: { kind: 'emoji', value: '🐦' } }
      ]
    },
    {}
  );
  const label = slide.texts.find((entry) => entry.value === '(2)');
  const picture = slide.texts.find((entry) => /question-context-.*-emoji/.test(entry.options.objectName || ''));
  const card = slide.shapes[0];
  assert.ok(label.options.w < 1);
  assert.equal(label.options.align, 'right');
  assert.ok(picture.options.x < card.options.x + card.options.w / 2);
});

test('a question without an answer box puts its picture at the right-hand end', () => {
  const slide = fakeSlide();
  drawNumberedQuestions(
    fakePptx(), slide,
    { x: 0.5, y: 1, w: 12, h: 2, class: 'A' },
    {
      questions: [
        { text: 'A robin eats 3 worms, then 5 more. How many altogether?', picture: { kind: 'emoji', value: '🐦' } }
      ]
    },
    {}
  );
  const picture = slide.texts.find((entry) => /question-context-.*-emoji/.test(entry.options.objectName || ''));
  const card = slide.shapes[0];
  assert.ok(picture.options.x > card.options.x + card.options.w / 2);
});

test('pictures still disappear when the complete long set has no safe height', () => {
  const slide = fakeSlide();
  drawNumberedQuestions(
    fakePptx(), slide,
    { x: 0.5, y: 1, w: 5, h: 1.2, class: 'A' },
    {
      questions: [
        { text: 'A robin eats 3 worms, then 5 more. How many altogether?', picture: { kind: 'emoji', value: '🐦' } },
        { text: 'A television costs £240 and is reduced by £40. What is its new price?', picture: { kind: 'emoji', value: '📺' } }
      ]
    },
    {}
  );
  assert.equal(
    slide.texts.filter((entry) => /question-context-.*-emoji/.test(entry.options.objectName || '')).length,
    0
  );
});

test('validation accepts a partial set but rejects an unresolved Educational SVG request', () => {
  const lesson = {
    lessonName: 'Stage E validation',
    slides: [{
      template: 'body-full',
      body: {
        type: 'question-cards',
        questions: [
          { text: 'Robin', picture: { kind: 'emoji', value: '🐦' } },
          'No picture here',
          {
            text: 'Candle',
            picture: {
              kind: 'educational-svg',
              concept: 'lit candle',
              context: 'A plain candle used during a baptism'
            }
          }
        ]
      }
    }]
  };
  const result = validateLesson(lesson, path.join(__dirname, 'no-photos-here'));
  assert.deepEqual(result.errors, [
    'slide 1: an Educational SVG picture is unresolved - resolve it, use its emoji fallback, or remove it before build.'
  ]);
});
