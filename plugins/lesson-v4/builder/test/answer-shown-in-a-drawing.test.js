'use strict';

// An answers slide is the question slide duplicated with the answers swapped
// in, and the drawing is one of the places they go. The pair rule compared a
// drawing field by field, so a fraction bar shaded on the answers slide was
// refused as "a difference", and an exact answer left unpaired was refused as
// well. Eight of twenty lessons in one run (7 October 2026) came out with the
// answer green in the sum beside a bar left blank, or with the green mark
// dropped and a false "no reveal marker" warning on a slide whose answers were
// printed inside its chart. The teacher, asked what the rule was for: "so that
// there's not a massive visual jump. I make the questions slide, then
// duplicate it and swap them for answers. Whether that's text boxes, same
// visual like chart, fraction bar". A drawing keeps its kind and its place;
// what it shows may change. Everything else the pair protected still holds.

const assert = require('node:assert/strict');
const test = require('node:test');
const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawNumberedQuestions } = require('../src/content/numbered-questions');
const { validateLesson } = require('../src/validate');

const ZONE = { x: 0.5, y: 1, w: 12, h: 5.5, class: 'A' };

const bars = (shaded) => ({ type: 'shaded-fraction', bars: [{ parts: 2, shaded: 1 }, { parts: 10, shaded }] });

function pair(questionSide, answerSide) {
  const slide = (title, state, questions, side) => ({
    template: 'split-h-50-50',
    title,
    primary: { type: 'numbered-questions', revealPair: { id: 'set-a', state }, questions },
    secondary: side
  });
  return { slides: [
    slide('Your Turn', 'question', ['1/2 = ?/10'], questionSide),
    slide('Answers', 'answer', ['1/2 = ||5/10'], answerSide)
  ] };
}

function draw(spec) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  spec.slides.forEach((source, slideIndex) => {
    drawNumberedQuestions(pptx, pptx.addSlide(), ZONE, source.primary, { lesson: spec, slideIndex });
  });
}

test('the answers slide may shade the bars its question slide left blank', () => {
  assert.doesNotThrow(() => draw(pair(bars(0), bars(5))));
});

test('a chart may be filled in and a bar chart may gain its bars', () => {
  const chart = (calculation) => ({
    type: 'place-value-chart', columns: ['Tens', 'Ones'], calculation, weight: 2
  });
  assert.doesNotThrow(() => draw(pair(
    chart({ operator: '-', numbers: ['52', '18'] }),
    chart({ operator: '-', numbers: ['52', '18'], answer: '34' })
  )));
  const barChart = (values) => ({ type: 'bar-chart', categories: ['Cats', 'Dogs'], values });
  assert.doesNotThrow(() => draw(pair(barChart([0, 0]), barChart([4, 7]))));
});

test('answers may be swapped into the cells of a table', () => {
  const table = (cell) => ({ type: 'table', rows: [['For', 'Against'], [cell, '']] });
  assert.doesNotThrow(() => draw(pair(table(''), table('It saves time.'))));
});

test('a drawing swapped for another kind, moved, resized or taken away is still refused', () => {
  assert.throws(() => draw(pair(bars(0), { type: 'fraction-wall', fractions: [1, 2, 10] })),
    /REVEAL_PAIR_LAYOUT/, 'another kind of drawing');
  assert.throws(() => draw(pair(bars(0), { type: 'stack', items: [bars(5)] })),
    /REVEAL_PAIR_LAYOUT/, 'the drawing moved into another place');
  assert.throws(() => draw(pair(bars(0), Object.assign(bars(5), { weight: 3 }))),
    /REVEAL_PAIR_LAYOUT/, 'the drawing given a different share of the slide');
  assert.throws(() => draw(pair(bars(0), undefined)),
    /REVEAL_PAIR_LAYOUT/, 'the drawing gone');
});

test('the words beside the drawing are still held still', () => {
  const side = (shaded, colorRole) => ({ type: 'stack', items: [
    { type: 'text', value: 'Find the same amount on the second bar.', colorRole },
    bars(shaded)
  ] });
  assert.doesNotThrow(() => draw(pair(side(0, 'task-blue'), side(5, 'task-blue'))));
  assert.throws(() => draw(pair(side(0, 'task-blue'), side(5, 'worked-purple'))), /REVEAL_PAIR_LAYOUT/);
});

test('the pencil beside an instruction in the body may come off the answers slide', () => {
  const side = (signal) => ({ type: 'stack', items: [
    Object.assign({ type: 'text', value: 'Write each equivalent fraction.' }, signal ? { signal } : {}),
    bars(0)
  ] });
  assert.doesNotThrow(() => draw(pair(side('pencil'), side(null))));
});

function warningsOf(question, answer) {
  const slide = (title, body) => ({ template: 'body-full', title, designUnitId: 'u', body });
  const result = validateLesson({
    lessonName: 'x', yearGroup: 'Year 4', subject: 'Maths', lo: 'x',
    slides: [slide('Your Turn', question), slide('Answers', answer)]
  }, '.');
  return (result.warnings || []).join(' ');
}

test('an answers slide whose drawing shows the answer is not warned as having none', () => {
  assert.doesNotMatch(warningsOf(bars(0), bars(5)), /looks like an answer slide/);
  assert.doesNotMatch(
    warningsOf(bars(0), { type: 'stack', items: [bars(5), { type: 'text', value: 'Ones: 12 - 8 = 4' }] }),
    /looks like an answer slide/, 'the same drawing completed inside a new arrangement');
});

test('an answers slide that repeats a blank drawing under black answers is still warned', () => {
  const body = (value) => ({ type: 'stack', items: [{ type: 'text', value }, bars(0)] });
  assert.match(warningsOf(body('1/2 = ?/10'), body('1/2 = 5/10')), /looks like an answer slide/);
  assert.match(
    warningsOf({ type: 'text', value: '6 x 7 =' }, { type: 'text', value: '6 x 7 = 42' }),
    /looks like an answer slide/);
});
