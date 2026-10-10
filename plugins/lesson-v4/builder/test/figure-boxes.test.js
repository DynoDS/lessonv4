'use strict';

// The builder says where each figure sits, so a decoration stays off it.
//
// The decorator's clear space is measured from the rendered page by its ink,
// which forgives pale fills and thin lines because a card is made of them. A
// chart's gridlines and a shape's inside are made of them too, so the empty
// middle of a bar chart was offered as a clear place and a ladybird went where
// the teacher draws a bar (six of twenty lessons, 7 October 2026). Only the
// builder knows which pale box is the figure.

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  watchFigure, figureBoxes, clearFigureBoxes, isFigure, leavesASumOpen, noteAnswerSpace
} = require('../src/content/_figure-boxes');
const { withoutRecording } = require('../src/warnings');

function fakeSlide() {
  const calls = [];
  const slide = {
    background: null,
    addImage(options) { calls.push(['addImage', options]); return slide; },
    addShape(name, options) { calls.push(['addShape', options]); return slide; },
    addText(text, options) { calls.push(['addText', options]); return slide; }
  };
  return { slide, calls };
}

test('a chart, a shape and a table are figures; words and labelled photographs are not', () => {
  assert.equal(isFigure('bar-chart'), true);
  assert.equal(isFigure('polygon'), true);
  assert.equal(isFigure('table'), true);
  assert.equal(isFigure('text'), false);
  assert.equal(isFigure('stack'), false);
  // The teacher ruled the gaps between a labelled picture and its labels open
  // (a moon beside a labelled Earth, 8 October 2026); its photograph and
  // labels are protected as ink.
  assert.equal(isFigure('label-diagram'), false);
  assert.equal(isFigure('image'), false);
});

test('a figure is noted as the one box that holds everything it drew', () => {
  clearFigureBoxes();
  const { slide, calls } = fakeSlide();
  const watched = watchFigure(slide, 'bar-chart', { slideIndex: 7 });
  watched.slide.addImage({ x: 4.8, y: 1.6, w: 4.0, h: 5.0 });
  watched.slide.addText('Number of children', { x: 4.2, y: 3.0, w: 0.5, h: 2.0 });
  watched.done();
  assert.equal(calls.length, 2, 'the deck is drawn exactly as it was');
  assert.deepEqual(figureBoxes(), [{ slide: 8, type: 'bar-chart', x: 4.2, y: 1.6, w: 4.6, h: 5 }]);
});

test('what is not a figure is drawn on the slide it was given', () => {
  clearFigureBoxes();
  const { slide } = fakeSlide();
  const watched = watchFigure(slide, 'text', { slideIndex: 0 });
  assert.equal(watched.slide, slide);
  watched.slide.addText('words', { x: 1, y: 1, w: 2, h: 1 });
  watched.done();
  assert.deepEqual(figureBoxes(), []);
});

test('an unseen try at a figure notes nothing', () => {
  clearFigureBoxes();
  const { slide } = fakeSlide();
  withoutRecording(() => {
    const watched = watchFigure(slide, 'polygon', { slideIndex: 2 });
    watched.slide.addImage({ x: 1, y: 1, w: 3, h: 3 });
    watched.done();
  });
  assert.deepEqual(figureBoxes(), []);
});

test('a watched slide still takes what a helper sets on it', () => {
  const { slide } = fakeSlide();
  const watched = watchFigure(slide, 'polygon', { slideIndex: 0 });
  watched.slide.background = { color: 'FFFFFF' };
  assert.deepEqual(slide.background, { color: 'FFFFFF' });
  assert.equal(watched.slide.addImage({ x: 0, y: 0, w: 1, h: 1 }), watched.slide);
});

// The blank after "2,347 + 126 =" is where the teacher writes the answer. By
// ink it is the clearest place on the slide, and twelve drawings on one column
// addition deck went there; the teacher moved every one (8 October 2026).
test('a line that ends in an equals sign is a sum left open', () => {
  assert.equal(leavesASumOpen('2,347 + 126 ='), true);
  assert.equal(leavesASumOpen('347\u00a0+\u00a0126\u00a0=\u00a0'), true);
  assert.equal(leavesASumOpen('3 + 4 = ||7'), false, 'the answer is printed, and print is protected as ink');
  assert.equal(leavesASumOpen('10 tens = ___ hundred.'), false);
  assert.equal(leavesASumOpen('What do five tens and seven tens make?'), false);
});

test('the card is kept from the open sum down, and the card above it stays open', () => {
  clearFigureBoxes();
  noteAnswerSpace({ slideIndex: 4 }, { x: 0.22, y: 0.75, w: 7.09, h: 1.6 }, ['Use column addition with one exchange.', '347 + 126 =']);
  assert.deepEqual(figureBoxes(), [{ slide: 5, type: 'answer-space', whole: true, x: 0.22, y: 1.55, w: 7.09, h: 0.8 }]);
  clearFigureBoxes();
  noteAnswerSpace({ slideIndex: 6 }, { x: 0.22, y: 0.75, w: 7.99, h: 1.05 }, ['2,347 + 126 =']);
  assert.deepEqual(figureBoxes(), [{ slide: 7, type: 'answer-space', whole: true, x: 0.22, y: 0.75, w: 7.99, h: 1.05 }]);
});

test('a card with no open sum, and an unseen try, note nothing', () => {
  clearFigureBoxes();
  noteAnswerSpace({ slideIndex: 0 }, { x: 1, y: 1, w: 5, h: 1 }, ['What do five tens and seven tens make?']);
  withoutRecording(() => {
    noteAnswerSpace({ slideIndex: 0 }, { x: 1, y: 1, w: 5, h: 1 }, ['12 + 9 =']);
  });
  assert.deepEqual(figureBoxes(), []);
});
