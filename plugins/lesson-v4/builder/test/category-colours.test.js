'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { CARD } = require('../src/styles');
const {
  CATEGORY_COLOUR_KEYS,
  categoryColourFor
} = require('../src/category-colours');
const { drawContent } = require('../src/content');
const { drawQuestionCards } = require('../src/content/question-cards');
const { drawTeachCompare } = require('../src/templates/teach-compare');
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
    addShape(type, options) { this.shapes.push({ type, options }); },
    addText(value, options) { this.texts.push({ value, options }); }
  };
}

function ctx() {
  return { cardLook: true, slideIndex: 0 };
}

test('the category palette is named, small and excludes green', () => {
  assert.deepEqual(CATEGORY_COLOUR_KEYS, ['blue', 'orange', 'purple']);
  assert.equal(categoryColourFor('blue'), '0070C0');
  assert.equal(categoryColourFor('orange'), 'E46C0A');
  assert.equal(categoryColourFor('purple'), '7030A0');
  assert.equal(categoryColourFor('green'), null);
});

test('a category card stays white and gains only the requested border', () => {
  const slide = fakeSlide();
  drawContent(
    fakePptx(),
    slide,
    { x: 1, y: 1, w: 4, h: 2, class: 'C' },
    { type: 'text', value: 'National government', categoryColor: 'blue' },
    ctx()
  );

  assert.equal(slide.shapes.length, 1);
  const card = slide.shapes[0].options;
  assert.equal(card.fill.color, CARD.fill);
  assert.deepEqual(card.line, { color: '0070C0', width: CARD.categoryLineW });
  assert.deepEqual(card.shadow, CARD.shadow);
});

test('a category wraps a stack once and can repeat on a short hint bar', () => {
  const stackSlide = fakeSlide();
  drawContent(
    fakePptx(),
    stackSlide,
    { x: 1, y: 1, w: 4, h: 3, class: 'C' },
    {
      type: 'stack',
      categoryColor: 'orange',
      items: [
        { type: 'text', value: 'Local' },
        { type: 'bullets', items: ['Parks', 'Libraries'] }
      ]
    },
    ctx()
  );
  assert.equal(stackSlide.shapes.length, 1);
  assert.equal(stackSlide.shapes[0].options.line.color, 'E46C0A');

  const hintSlide = fakeSlide();
  drawContent(
    fakePptx(),
    hintSlide,
    { x: 1, y: 5, w: 4, h: 0.5, class: 'F' },
    { type: 'text', value: 'Think local', categoryColor: 'orange' },
    ctx()
  );
  assert.equal(hintSlide.shapes.length, 1);
  assert.equal(hintSlide.shapes[0].options.line.color, 'E46C0A');
});

test('teach-compare uses white cards with category borders and the shared shadow', () => {
  const slide = fakeSlide();
  drawTeachCompare(fakePptx(), slide, {
    title: 'Compare the two roles',
    leftHeading: 'National',
    rightHeading: 'Local',
    leftContent: { type: 'text', value: 'Runs the country', categoryColor: 'purple' },
    rightContent: { type: 'text', value: 'Runs local services' }
  }, ctx());

  const cards = slide.shapes.filter((shape) => shape.type === 'roundRect');
  assert.equal(cards.length, 2);
  assert.deepEqual(cards.map((shape) => shape.options.fill.color), [CARD.fill, CARD.fill]);
  assert.deepEqual(cards.map((shape) => shape.options.line.color), ['7030A0', 'E46C0A']);
  cards.forEach((shape) => assert.deepEqual(shape.options.shadow, CARD.shadow));
});

test('ordinary question cards stay plain and never borrow category colours', () => {
  const slide = fakeSlide();
  drawQuestionCards(
    fakePptx(),
    slide,
    { x: 0.5, y: 1, w: 10, h: 4, class: 'A' },
    { questions: ['6 × 7', '9 × 4', '8 × 8'] }
  );

  const cards = slide.shapes.filter((shape) => shape.type === 'roundRect');
  assert.equal(cards.length, 3);
  cards.forEach((shape) => {
    assert.equal(shape.options.fill.color, CARD.fill);
    assert.deepEqual(shape.options.line, { type: 'none' });
    assert.deepEqual(shape.options.shadow, CARD.shadow);
  });
});

test('validation accepts real category containers and rejects green, unknown and ignored uses', () => {
  const valid = {
    lessonName: 'Category colour validation',
    slides: [{
      template: 'cards-and-bars',
      cards: [
        { type: 'stack', categoryColor: 'blue', items: [{ type: 'text', value: 'National' }] },
        { type: 'stack', categoryColor: 'orange', items: [{ type: 'text', value: 'Local' }] }
      ],
      bars: [
        { type: 'text', value: 'Think national', categoryColor: 'blue' },
        { type: 'text', value: 'Think local', categoryColor: 'orange' }
      ]
    }]
  };
  assert.deepEqual(validateLesson(valid, path.join(__dirname, 'no-photos-here')).errors, []);

  const invalid = {
    lessonName: 'Invalid category colours',
    slides: [{
      template: 'body-full',
      body: {
        type: 'stack',
        items: [
          { type: 'text', value: 'Reserved', categoryColor: 'green' },
          { type: 'text', value: 'Invented', categoryColor: 'red' },
          { type: 'question-cards', questions: ['1 + 1'], categoryColor: 'blue' },
          { type: 'steps', steps: ['Read the question.'], categoryColor: 'orange' }
        ]
      }
    }]
  };
  const errors = validateLesson(invalid, path.join(__dirname, 'no-photos-here')).errors;
  assert.equal(errors.length, 4);
  assert.match(errors[0], /cannot be green/);
  assert.match(errors[1], /unknown categoryColor/);
  assert.match(errors[2], /ordinary question lists and success-criteria steps uncoloured/);
  assert.match(errors[3], /ordinary question lists and success-criteria steps uncoloured/);
});

test('the template contract owns the container-border rule and the playbook keeps the cue', () => {
  const designer = fs.readFileSync(path.join(__dirname, '..', '..', 'agents', 'slide-designer.md'), 'utf8');
  const playbook = fs.readFileSync(path.join(__dirname, '..', '..', 'references', 'slide-composition-playbook.md'), 'utf8');
  const templates = fs.readFileSync(path.join(__dirname, '..', '..', 'references', 'templates.md'), 'utf8');
  assert.match(templates, /categoryColor[\s\S]*border of the ordinary white card/);
  assert.match(templates, /Repeat the same value when the category returns elsewhere on the slide, including a hint bar/);
  assert.match(templates, /Green and unknown values fail validation/);
  assert.match(templates, /Do not put the field on `question-cards`, `numbered-questions`, `steps`/);
  assert.match(playbook, /A category container takes its colour on the border through the documented `categoryColor` field/);
  assert.match(playbook, /Ordinary question lists and success-criteria steps stay out of that palette/);
  assert.doesNotMatch(designer, /colour-cycled cards/);
  assert.match(templates, /plain white card with the shared soft shadow/);
  assert.doesNotMatch(templates, /cards cycle the house colours/);
});
