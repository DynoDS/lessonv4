'use strict';

// On an answers slide a method frame's line turned everything after its one
// reveal marker green, so a number the question had given was coloured as an
// answer: `4 × ||2 = 8` printed `= 8` green, and `3/4 ||> 5/8` the given
// `5/8` (Year 5 equivalent fractions, 13 October 2026). The question slide
// says which parts are answers: the ones that stand where its boxes stood.

const assert = require('node:assert/strict');
const test = require('node:test');

const { drawMethodFrame } = require('../src/content/method-frame');
const { tellFramesWhatWasAsked, answerPieces } = require('../src/content/method-frame-answers');

const GREEN = '00B050';
const ZONE = { x: 0, y: 0, w: 9, h: 3, class: 'A' };

function colours(frame) {
  const texts = [];
  const slide = { addShape: () => {}, addText: (content, options) => texts.push([String(content), options.color]), addImage: () => {} };
  drawMethodFrame({ shapes: { RECTANGLE: 'rect', ROUNDED_RECTANGLE: 'rrect', OVAL: 'oval', LINE: 'line' } }, slide, ZONE, frame);
  return Object.fromEntries(texts);
}

const frame = (contents) => ({ type: 'method-frame', lines: contents.map((content, i) => ({ label: `Step ${i + 1}:`, content })) });
const deck = (...frames) => ({ slides: frames.map((f, i) => ({ template: 'body-full', title: i % 2 ? 'Answers' : 'My Turn', body: { type: 'stack', items: [f] } })) });

test('only what stands where a box stood prints green', () => {
  const answers = frame(['4 × ||2 = 8', '3 × ||2 = 6', '3/4 ||> 5/8']);
  tellFramesWhatWasAsked(deck(frame(['4 × ___ = 8', '3 × ___ = ___', '3/4 ___ 5/8']), answers));
  const drawn = colours(answers);
  assert.equal(drawn['2'], GREEN);
  assert.notEqual(drawn['= 8'], GREEN, 'the 8 the question gave is not an answer');
  assert.equal(drawn['6'], GREEN, 'the second answer on a line needs no marker of its own');
  assert.notEqual(drawn['='], GREEN);
  assert.equal(drawn['>'], GREEN);
  assert.notEqual(drawn['5/8'], GREEN);
});

test('a fraction with a part to find is an answer whole, and a list of answers stays one run', () => {
  const pieces = (asked, shown) => answerPieces(asked, shown).map((p) => (p.answer ? `[${p.text}]` : p.text)).join(' ');
  assert.equal(pieces('3/4 = ___/8', '3/4 = ||6/8'), '3/4 = [6/8]');
  assert.equal(pieces('2/3 = ___/___', '2/3 = ||8/12'), '2/3 = [8/12]');
  assert.equal(pieces('___/8 ___ 5/8', '||6/8 > 5/8'), '[6/8 >] 5/8');
  assert.equal(pieces('___/8, ___/8, ___/8', '||4/8, 5/8, 6/8'), '[4/8, 5/8, 6/8]');
  assert.equal(pieces('2/3 = ___   5/6 = ___', '2/3 = ||8/12   5/6 = 10/12'), '2/3 = [8/12] 5/6 = [10/12]');
});

test('a frame with no question before it, or an answer that is not its question filled in, is drawn as before', () => {
  const alone = frame(['4 × ||2 = 8']);
  tellFramesWhatWasAsked(deck(alone));
  assert.equal(alone.lines[0].asked, undefined);
  assert.equal(colours(alone)['2 = 8'], GREEN);

  const reworded = frame(['1 + 1 + 4 = ||6']);
  tellFramesWhatWasAsked(deck(frame(['3 + 1 + 2 = ___']), reworded));
  assert.equal(colours(reworded)['6'], GREEN);

  // A different frame (other labels) in the same slot shares nothing.
  const other = { type: 'method-frame', lines: [{ label: 'Then:', content: '4 × ||2 = 8' }] };
  tellFramesWhatWasAsked(deck(frame(['4 × ___ = 8']), other));
  assert.equal(other.lines[0].asked, undefined);
});
