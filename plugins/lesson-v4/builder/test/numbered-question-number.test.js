'use strict';

// The question number is a marker, not part of the question. Daniel, 12
// September 2026, reading a rounding deck: "Is it possible to make numbered
// questions font size 24, aligned left, which means more space for question/
// answer text box and answer centred aligned."
//
// It used to grow with the question, so a two-question check on a whole zone
// printed "(1)" at the same size as the number being rounded, and the label
// column it paid for came out of the words. It is now set once at 24pt, pinned
// to the card's left edge, and the question and its answer sit centred in the
// width that frees.
const test = require('node:test');
const assert = require('node:assert/strict');

const { drawNumberedQuestions } = require('../src/content/numbered-questions');

function fakePptx() {
  return { shapes: { ROUNDED_RECTANGLE: 'roundRect' }, ShapeType: { ellipse: 'ellipse' } };
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

function draw(zone, data) {
  const slide = fakeSlide();
  drawNumberedQuestions(fakePptx(), slide, Object.assign({ class: 'A' }, zone), data, {});
  return slide;
}

function label(slide, value) {
  return slide.texts.find((entry) => entry.value === value);
}

function questionText(slide) {
  return slide.texts.find((entry) =>
    /question-text-/.test(entry.options.objectName || '')
  );
}

const SHORT_SET = { startAt: 1, questions: [{ text: '67' }, { text: '85' }] };

test('a short set on a whole zone keeps its number at 24pt while the question grows', () => {
  // The zone is deliberately generous: this is the case that used to print a
  // 40pt "(1)" beside a 40pt "67".
  const slide = draw({ x: 0.5, y: 1, w: 8, h: 4 }, SHORT_SET);
  const number = label(slide, '(1)');
  assert.equal(number.options.fontSize, 24);
  assert.ok(
    questionText(slide).options.fontSize > 24,
    'the question should still take the room the zone gives it'
  );
});

test('the number sits at the card left edge', () => {
  const slide = draw({ x: 0.5, y: 1, w: 8, h: 4 }, SHORT_SET);
  const card = slide.shapes[0];
  const number = label(slide, '(1)');
  assert.equal(number.options.align, 'left');
  assert.ok(number.options.x >= card.options.x);
  assert.ok(number.options.x < card.options.x + 0.4);
});

test('the question and its answer are centred in the box that is left', () => {
  const slide = draw(
    { x: 0.5, y: 1, w: 8, h: 4 },
    { startAt: 6, questions: [{ text: '5,273 → ||5,300' }, { text: '7,950 → ||8,000' }] }
  );
  const text = questionText(slide);
  assert.equal(text.options.align, 'center');
  const card = slide.shapes[0];
  assert.ok(text.options.x > card.options.x, 'the text box starts after the number');
});

test('a smaller number leaves the question more width than the old sizing did', () => {
  // The point of the change, and the half that is not about looks: the label
  // column is priced from the label, so a smaller label is width the question
  // gets back.
  const zone = { x: 0.5, y: 1, w: 8, h: 4 };
  const wide = draw(zone, SHORT_SET);
  const narrow = draw(zone, { startAt: 1, questions: [{ text: '67' }, { text: '85' }] });
  const gap = questionText(wide).options.x - wide.shapes[0].options.x;
  assert.ok(gap < 0.85, `the number column should stay narrow, got ${gap.toFixed(2)}in`);
  assert.equal(gap.toFixed(3), (questionText(narrow).options.x - narrow.shapes[0].options.x).toFixed(3));
});

test('the number never comes out bigger than the question it labels', () => {
  // A long set in a tight zone drives the question font below 24. A 24pt
  // number beside a 14pt question would read as the point of the card.
  const slide = draw(
    { x: 0.5, y: 1, w: 3.4, h: 1.6 },
    {
      startAt: 1,
      questions: [
        { text: 'Round 5,273 to the nearest 10 and explain your choice.' },
        { text: 'Round 7,950 to the nearest 100 and explain your choice.' },
        { text: 'Round 8,012 to the nearest 100 and explain your choice.' }
      ]
    }
  );
  const number = label(slide, '(1)');
  assert.ok(number.options.fontSize <= questionText(slide).options.fontSize);
});

test('a lone unnumbered question still spends no width on a number column', () => {
  const slide = draw({ x: 0.5, y: 1, w: 8, h: 4 }, { questions: [{ text: '67' }] });
  assert.equal(label(slide, '(1)'), undefined);
  const card = slide.shapes[0];
  const text = questionText(slide);
  assert.ok(Math.abs(text.options.x - card.options.x) < 0.25);
});

test('a question that wraps keeps its left edge', () => {
  // Centring shares a card's spare width. A question that wraps has none left,
  // and centring it strands the tail of the sentence in the middle of the card.
  const slide = draw(
    { x: 0.5, y: 1, w: 4.2, h: 3 },
    {
      startAt: 10,
      questions: [
        { text: '2,649 rounds to ||2,650 to the nearest 10, and the same number rounds to 2,600 to the nearest 100.' }
      ]
    }
  );
  assert.equal(questionText(slide).options.align, 'left');
});
