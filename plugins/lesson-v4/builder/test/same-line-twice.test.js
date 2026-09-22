'use strict';

// One sentence printed twice on one slide, and the parallel layouts that are
// not that. The fault case is the real slide 8 of the Year 4 leisure deck
// (22 September 2026), where the teacher's note was "Twice."

const assert = require('node:assert/strict');
const test = require('node:test');

const { repeatedLineWarnings } = require('../scripts/check-slide-design');

const STEAM = 'Steam engines brought new fairground rides in Victorian times.';

function signals(slides) {
  return repeatedLineWarnings({ slides }).map((warning) => warning.signal);
}

test('a card and the star line saying one sentence is refused', () => {
  const slide = {
    template: 'teach-layout',
    layout: 'question-lines-picture',
    title: 'From Tudor games to Victorian rides',
    question: 'How did a steam engine change what a fair could offer?',
    lines: [STEAM],
    sticky: STEAM,
    speakerNotes: 'Say to children: ...'
  };
  const warnings = repeatedLineWarnings({ slides: [slide] });
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].signal, 'SAME_LINE_TWICE_ON_ONE_SLIDE');
  assert.equal(warnings[0].slide, 1);
  assert.match(warnings[0].message, /Keep it once/);
});

test('two identical lines in one list are refused', () => {
  const line = 'Children still ride together for fun at the fair.';
  assert.deepEqual(signals([{ lines: [line, line] }]), ['SAME_LINE_TWICE_ON_ONE_SLIDE']);
});

test('the same label on every card of a set is a parallel layout', () => {
  const card = (imagePath) => ({
    imagePath,
    fields: [{ label: 'Tooth type', value: '' }, { label: 'How does its shape help it do its job?', value: '' }]
  });
  const slide = { body: { type: 'evidence-cards', items: [card('a.jpg'), card('b.jpg')] } };
  assert.deepEqual(signals([slide]), []);
});

test('the same note under each of several figures is a parallel layout', () => {
  const figure = (start) => ({
    type: 'stack',
    items: [{ type: 'numberline', start, end: start + 500 }, { type: 'text', value: 'Each interval is worth 100.' }]
  });
  const slide = { primary: { type: 'stack', items: [figure(6500), figure(9500)] } };
  assert.deepEqual(signals([slide]), []);
});

test('the same sentence on two different slides is not this fault', () => {
  assert.deepEqual(signals([{ lines: [STEAM] }, { sticky: STEAM }]), []);
});

test('the title, the notes and an emphasis span are not second copies', () => {
  const slide = {
    title: STEAM,
    lead: { value: STEAM, emphasis: [{ text: STEAM, role: 'vocabulary' }] },
    speakerNotes: STEAM
  };
  assert.deepEqual(signals([slide]), []);
});

test('a short caption repeated under two pictures is left alone', () => {
  assert.deepEqual(signals([{ captions: ['Drawn by an artist', 'Drawn by an artist'] }]), []);
});
