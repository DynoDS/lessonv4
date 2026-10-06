'use strict';

// A question slide and its answer slide keep one composition, and the pair
// rule used to count the header's sign, cue and Do badge as part of it. The
// builder adds the badge to the task slide alone, so every paired Do beat was
// refused until the designer named the bolt on the answer slide as well, and
// no pair could carry a pencil on the question and a tick on the answers.
// Three runs out of ten spent a repair pass on it and the teacher met the bolt
// on answer slides and no tick (4 October 2026). The pair may now differ in
// that header furniture, the tick is the builder's, and a sign draws alone
// where the slide has no cue.

const assert = require('node:assert/strict');
const test = require('node:test');
const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawNumberedQuestions } = require('../src/content/numbered-questions');
const { applyAnswerTicks } = require('../src/do-signs');
const { settlePairedHeaders } = require('../src/content/reveal-pair');
const { bodyZone } = require('../src/layout');
const { drawTitleHeader, drawStarterHeader } = require('../src/headers');

const ZONE = { x: 0.5, y: 1, w: 12, h: 5.5, class: 'A' };
const QUESTIONS = [{ id: 'a', text: 'VII' }, { id: 'b', text: 'IV' }];
const ANSWERS = [{ id: 'a', text: '||VII is seven' }, { id: 'b', text: '||IV is four' }];

function pair(question, answer) {
  return { slides: [
    Object.assign({ template: 'body-full', title: 'Your Turn', body: {
      type: 'numbered-questions', revealPair: { id: 'set-a', state: 'question' }, questions: QUESTIONS
    } }, question),
    Object.assign({ template: 'body-full', title: 'Answers', body: {
      type: 'numbered-questions', revealPair: { id: 'set-a', state: 'answer' }, questions: ANSWERS
    } }, answer)
  ] };
}

function draw(spec) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  spec.slides.forEach((source, slideIndex) => {
    drawNumberedQuestions(pptx, pptx.addSlide(), ZONE, source.body, { lesson: spec, slideIndex });
  });
}

test('a pair may carry the badge, the pencil and the cue on its question slide alone', () => {
  const spec = pair({ doSign: 'quick', signal: 'pencil', instruction: 'Answer on your own.' }, { signal: 'tick' });
  assert.doesNotThrow(() => draw(spec));
});

test('a pair whose answer slide moves anything else is still refused', () => {
  const spec = pair({}, { headerStyle: 'starter' });
  assert.throws(() => draw(spec), /REVEAL_PAIR_LAYOUT/);
});

test('the tick is put on answer and check slides, and nowhere else', () => {
  const lesson = pair({ signal: 'pencil' }, {});
  lesson.slides.push({ template: 'body-full', title: 'Put it all together - check', body: { type: 'text', value: 'x' } });
  lesson.slides.push({ template: 'body-full', title: 'What should Harry do?', body: { type: 'text', value: 'x' } });
  lesson.slides.push({ template: 'body-full', title: 'Answers', signal: 'magnifier', body: { type: 'text', value: 'x' } });
  applyAnswerTicks(lesson);
  assert.equal(lesson.slides[0].signal, 'pencil', 'the question slide keeps its own sign');
  assert.equal(lesson.slides[1].signal, 'tick', 'the answer slide of a pair');
  assert.equal(lesson.slides[2].signal, 'tick', 'a check slide by its title');
  assert.equal(lesson.slides[3].signal, undefined, 'a task slide takes none');
  assert.equal(lesson.slides[4].signal, 'magnifier', 'a sign the slide names is kept');
});

test('a starter check that keeps the starter header takes the tick from its pair', () => {
  const lesson = pair({ headerStyle: 'starter', title: 'Starter' }, { headerStyle: 'starter', title: 'Starter' });
  applyAnswerTicks(lesson);
  assert.equal(lesson.slides[0].signal, undefined);
  assert.equal(lesson.slides[1].signal, 'tick');
});

test('when the question slide needs a two-line header, its answers start at the same height', () => {
  const long = 'Write each answer in your book, then check it with your partner.';
  const lesson = pair({ instruction: long, signal: 'pencil', doSign: 'quick' }, {});
  assert.notEqual(bodyZone('title', lesson.slides[0]).y, bodyZone('title', lesson.slides[1]).y,
    'before settling, the answer slide would sit higher');
  applyAnswerTicks(lesson);
  settlePairedHeaders(lesson);
  assert.equal(bodyZone('title', lesson.slides[0]).y, bodyZone('title', lesson.slides[1]).y);
  assert.doesNotThrow(() => draw(lesson));
});

test('a pair whose cues both fit one line is left as it was', () => {
  const lesson = pair({ instruction: 'Use the table.' }, {});
  settlePairedHeaders(lesson);
  assert.equal(lesson.slides[0].pairedHeaderTwoLine, undefined);
  assert.equal(lesson.slides[1].pairedHeaderTwoLine, undefined);
});

function capture(drawer, data) {
  const shapes = [];
  const images = [];
  const texts = [];
  const slide = {
    addShape: (kind, options) => shapes.push(Object.assign({ kind }, options)),
    addText: (content, options) => texts.push(Object.assign({ content }, options)),
    addImage: (options) => images.push(options)
  };
  drawer(slide, data, { cardLook: true });
  return { shapes, images, texts };
}

for (const [name, drawer, extra] of [
  ['title header', drawTitleHeader, { title: 'Answers' }],
  ['starter header', drawStarterHeader, { headerStyle: 'starter', title: 'Starter' }]
]) {
  test(`a sign with no cue draws alone in the ${name}`, () => {
    const result = capture(drawer, Object.assign({ signal: 'tick' }, extra));
    assert.equal(result.images.length, 1, 'the tick is drawn');
    assert.equal(result.shapes.length, 1, 'in a small pill of its own');
    const pill = result.shapes[0];
    const icon = result.images[0];
    assert.ok(icon.x >= pill.x && icon.x + icon.w <= pill.x + pill.w + 0.001, 'the sign sits inside its pill');
    assert.ok(pill.w < 1, 'the pill hugs the sign');
  });

  test(`a pencil with no cue is not drawn in the ${name}`, () => {
    // It sat beside the Do badge while the card that said "Write..." had none.
    const result = capture(drawer, Object.assign({ signal: 'pencil' }, extra));
    assert.equal(result.images.length, 0);
    assert.equal(result.shapes.length, 0);
  });

  test(`no sign and no cue leaves the ${name} bare`, () => {
    const result = capture(drawer, Object.assign({}, extra));
    assert.equal(result.images.length, 0);
    assert.equal(result.shapes.length, 0);
  });
}
