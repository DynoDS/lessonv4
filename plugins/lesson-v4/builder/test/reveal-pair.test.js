'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const JSZip = requireGlobal('jszip');
const { drawNumberedQuestions } = require('../src/content/numbered-questions');
const { drawQuestionCards } = require('../src/content/question-cards');
const { drawMathsYourTurnSc } = require('../src/templates/maths-your-turn-sc');

const ZONE = { x: 0.5, y: 1, w: 12, h: 5.5, class: 'A' };

function lesson(type, questionItems, answerItems) {
  return { slides: [
    { template: 'body-full', title: 'Your Turn', body: {
      type, revealPair: { id: 'set-a', state: 'question' }, questions: questionItems
    } },
    { template: 'body-full', title: 'Answers', body: {
      type, revealPair: { id: 'set-a', state: 'answer' }, questions: answerItems
    } }
  ] };
}

function drawPair(spec, draw) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  spec.slides.forEach((source, slideIndex) => {
    draw(pptx, pptx.addSlide(), ZONE, source.body, { lesson: spec, slideIndex });
  });
  return pptx;
}

function textOf(shape) {
  return [...shape.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => m[1]).join('');
}

function geometry(shape) {
  const off = /<a:off x="(\d+)" y="(\d+)"\/>/.exec(shape);
  const ext = /<a:ext cx="(\d+)" cy="(\d+)"\/>/.exec(shape);
  assert.ok(off && ext, 'emitted shape has coordinates');
  return [...off.slice(1), ...ext.slice(1)];
}

async function emitted(pptx) {
  const bytes = await pptx.write({ outputType: 'nodebuffer' });
  const zip = await JSZip.loadAsync(bytes);
  return Promise.all([1, 2].map(async (n) => {
    const xml = await zip.file(`ppt/slides/slide${n}.xml`).async('string');
    return [...xml.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)].map((m) => m[0]);
  }));
}

// A numbered-questions starter sizes its question slide on its own: sharing
// the answer slide's size left short questions small in big empty boxes, and
// the teacher accepted the questions shrinking when the answers appear
// (1 October 2026). The answer slide keeps the pair's fit group.
test('numbered-questions sizes its question slide on its own and keeps the pair group on the answer slide', async () => {
  const spec = lesson('numbered-questions',
    [{ id: 'a', text: 'VII' }, { id: 'b', text: 'IV' }, { id: 'c', text: 'IX' }, { id: 'd', text: 'XII' }],
    [{ id: 'a', text: '||VII is seven' }, { id: 'b', text: '||IV is four' },
      { id: 'c', text: '||IX is nine' }, { id: 'd', text: '||XII is twelve' }]
  );
  const [question, answer] = await emitted(drawPair(spec, drawNumberedQuestions));
  assert.equal(question.filter((shape) => /GROWFIT__revealpair-/.test(shape)).length, 0,
    'the question slide is not held to the answer slide size');
  assert.match(textOf(answer[answer.length - 1]), /twelve/);
  assert.match(answer.join(''), /00B050/i, 'answer green is emitted');
  assert.ok(answer.some((shape) => /GROWFIT__revealpair-/.test(shape)), 'the answer slide keeps the pair group');
});

for (const [type, draw] of [
  ['question-cards', drawQuestionCards]
]) {
  test(`${type} shares emitted card, label and text geometry with longer answers`, async () => {
    const spec = lesson(type,
      [{ id: 'a', text: 'VII' }, { id: 'b', text: 'IV' }, { id: 'c', text: 'IX' }, { id: 'd', text: 'XII' }],
      [{ id: 'a', text: '||VII is seven' }, { id: 'b', text: '||IV is four' },
        { id: 'c', text: '||IX is nine' }, { id: 'd', text: '||XII is twelve' }]
    );
    const [question, answer] = await emitted(drawPair(spec, draw));
    assert.equal(question.length, answer.length);
    assert.deepEqual(question.map(geometry), answer.map(geometry));
    assert.match(textOf(answer[answer.length - 1]), /twelve/);
    assert.match(answer.join(''), /00B050/i, 'answer green is emitted');
    const fitted = question.filter((shape) => /GROWFIT__revealpair-/.test(shape));
    assert.equal(fitted.length, 4);
    assert.match(textOf(fitted[0]), /VII/, 'the paired fit name belongs to answer-bearing text');
  });
}

test('a paired reveal rejects moved static reference or changed numbering', () => {
  const spec = lesson('numbered-questions', ['VII', 'IV'], ['||seven', '||four']);
  spec.slides[0].reference = { type: 'table', rows: [['I', '1']] };
  assert.throws(() => drawPair(spec, drawNumberedQuestions), /REVEAL_PAIR_LAYOUT/);
  delete spec.slides[0].reference;
  spec.slides[1].body.startAt = 2;
  assert.throws(() => drawPair(spec, drawNumberedQuestions), /REVEAL_PAIR_LAYOUT|REVEAL_PAIR_MISMATCH/);
});

test('pair identifiers and authored reveals are required', () => {
  const spec = lesson('question-cards',
    [{ id: 'a', text: 'VII' }, { id: 'b', text: 'IV' }],
    [{ id: 'b', text: '||seven' }, { id: 'a', text: '||four' }]
  );
  assert.throws(() => drawPair(spec, drawQuestionCards), /different ids/);
  spec.slides[1].body.questions[0].id = 'a';
  spec.slides[1].body.questions[1].id = 'b';
  spec.slides[1].body.questions[0].text = 'seven';
  assert.throws(() => drawPair(spec, drawQuestionCards), /authored \|\| reveal/);
});

test('paired items preserve pictures, styling and unique identifiers', () => {
  const spec = lesson('numbered-questions',
    [{ id: 'a', text: 'VII', colorRole: 'task-blue' }, { id: 'b', text: 'IV' }],
    [{ id: 'a', text: '||seven', colorRole: 'worked-purple' }, { id: 'b', text: '||four' }]
  );
  assert.throws(() => drawPair(spec, drawNumberedQuestions), /changed non-text content/);
  spec.slides[1].body.questions[0].colorRole = 'task-blue';
  spec.slides[0].body.questions[1].id = 'a';
  spec.slides[1].body.questions[1].id = 'a';
  assert.throws(() => drawPair(spec, drawNumberedQuestions), /duplicate item ids/);
});

test('question state cannot pre-reveal an answer', () => {
  const spec = lesson('question-cards', ['||VII', 'IV'], ['||seven', '||four']);
  assert.throws(() => drawPair(spec, drawQuestionCards), /already contains an answer reveal/);
});

test('pair IDs cannot collapse to another final-fit group name', () => {
  const spec = lesson('numbered-questions', ['VII'], ['||seven']);
  spec.slides[0].body.revealPair.id = '-set';
  spec.slides[1].body.revealPair.id = '-set';
  assert.throws(() => drawPair(spec, drawNumberedQuestions), /REVEAL_PAIR_INVALID/);
  spec.slides[0].body.revealPair.id = 'set a';
  spec.slides[1].body.revealPair.id = 'set a';
  assert.throws(() => drawPair(spec, drawNumberedQuestions), /REVEAL_PAIR_INVALID/);
});

test('two valid pair IDs receive different emitted final-fit groups', async () => {
  const first = lesson('numbered-questions', ['VII'], ['||seven']).slides;
  const second = lesson('numbered-questions', ['IX'], ['||nine']).slides;
  second.forEach((slide) => { slide.body.revealPair.id = 'set-b'; });
  const spec = { slides: [...first, ...second] };
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  spec.slides.forEach((source, slideIndex) => {
    drawNumberedQuestions(pptx, pptx.addSlide(), ZONE, source.body,
      { lesson: spec, slideIndex });
  });
  const bytes = await pptx.write({ outputType: 'nodebuffer' });
  const zip = await JSZip.loadAsync(bytes);
  // The answer slides carry the pair's group; question slides size on their own.
  const xml = await Promise.all([2, 4].map((n) => zip.file(`ppt/slides/slide${n}.xml`).async('string')));
  const groups = xml.map((slide) => /GROWFIT__(revealpair-[^_]+)__/.exec(slide)?.[1]);
  assert.ok(groups[0] && groups[1]);
  assert.notEqual(groups[0], groups[1]);
});

test('a short question with a long card answer keeps the same row and font', async () => {
  const spec = lesson('question-cards', ['XIX'],
    ['||Nineteen is ten plus nine, with IX used once.']);
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  spec.slides.forEach((source, slideIndex) => {
    drawQuestionCards(pptx, pptx.addSlide(), { x: 1, y: 1, w: 4, h: 3 },
      source.body, { lesson: spec, slideIndex });
  });
  const [question, answer] = await emitted(pptx);
  assert.deepEqual(question.map(geometry), answer.map(geometry));
  const questionText = question.find((shape) => /GROWFIT__revealpair-/.test(shape));
  const answerText = answer.find((shape) => /GROWFIT__revealpair-/.test(shape));
  const size = (shape) => Number(/\bsz="(\d+)"/.exec(shape)?.[1]);
  assert.equal(size(questionText), size(answerText));
  assert.ok(size(questionText) > 1800, 'a one-line short question does not force an answer that fits larger to the floor');
});

test('the fixed maths practice with criteria shares emitted positions', async () => {
  const spec = { slides: [
    { template: 'maths-your-turn-sc', title: 'Your Turn',
      revealPair: { id: 'fixed-a', state: 'question' },
      questions: ['VII', 'IV', 'IX'],
      criteria: { type: 'steps', steps: ['Start at the left.', 'Read in order.'] } },
    { template: 'maths-your-turn-sc', title: 'Answers',
      revealPair: { id: 'fixed-a', state: 'answer' },
      questions: ['||VII is seven', '||IV is four', '||IX is nine'],
      criteria: { type: 'steps', steps: ['Start at the left.', 'Read in order.'] } }
  ] };
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  spec.slides.forEach((source, slideIndex) => {
    drawMathsYourTurnSc(pptx, pptx.addSlide(), source,
      { lesson: spec, slideIndex, date: '26/09/2026', cardLook: true });
  });
  const [question, answer] = await emitted(pptx);
  assert.equal(question.length, answer.length);
  assert.deepEqual(question.map(geometry), answer.map(geometry));
});
