'use strict';

// One slide holding a sum shown happening becomes a run of slides
// (src/happening-runs.js); the clicks after the first open with Morph
// (src/morph-transitions.js); every other slide is left alone.

const test = require('node:test');
const assert = require('node:assert/strict');
const { expandHappenings } = require('../src/happening-runs');
const { addMorph } = require('../src/morph-transitions');

const lesson = () => ({
  slides: [
    { template: 'title', title: 'Start' },
    {
      template: 'split-h-70-30', title: 'My Turn', speakerNotes: 'Watch the ten.',
      primary: { type: 'stack', items: [{ type: 'exchange-happening', operator: '-', numbers: ['52', '28'] }] },
      secondary: { type: 'text', value: '52 − 28 =', revealPair: { id: 'p1', state: 'question' } },
    },
    { template: 'title', title: 'After' },
  ],
});

test('the happening slide becomes one slide per moment, the rest untouched', () => {
  const r = expandHappenings(lesson());
  assert.equal(r.lesson.slides.length, 1 + 5 + 1);
  assert.deepEqual(r.sourceOf, [1, 2, 2, 2, 2, 2, 3]);
  assert.deepEqual(r.stepOf, [null, 0, 1, 2, 3, 4, null]);
  assert.deepEqual(r.morph, [3, 4, 5, 6]);
  assert.deepEqual(r.lesson.slides[0], lesson().slides[0]);
  const steps = r.lesson.slides.slice(1, 6).map((s) => s.primary.items[0].step);
  assert.deepEqual(steps, [0, 1, 2, 3, 4]);
  assert.equal(r.lesson.slides[1].speakerNotes, 'Watch the ten.');
  assert.match(r.lesson.slides[2].speakerNotes, /^Click: /);
});

// A run's question card only ever shows the question, so no click is half of a
// pair and every click sizes it for the question alone: it keeps one size, and
// no longer shrinks on the last click (the teacher, 19 October 2026: "the
// question card doesn't need an answer"). The answers half is let go with it.
test('no click of a run is half of a reveal pair, and its answers half is let go', () => {
  const answers = { template: 'split-h-50-50', title: 'Answers',
    secondary: { type: 'text', value: '52 - 28 = ||24', revealPair: { id: 'p1', state: 'answer' } } };
  const l = lesson();
  l.slides.push(answers);
  const r = expandHappenings(l);
  assert.ok(r.lesson.slides.every((s) => !JSON.stringify(s).includes('"revealPair"')));
  assert.equal(l.slides[l.slides.length - 1].secondary.revealPair.id, 'p1', 'the lesson as written is untouched');
});

test('a deck with no happening slide is returned as it was', () => {
  const plain = { slides: [{ template: 'title', title: 'A' }] };
  const r = expandHappenings(plain);
  assert.equal(r.lesson, plain);
  assert.deepEqual(r.morph, []);
});

test('a slide given a step is drawn as that one moment', () => {
  const l = lesson();
  l.slides[1].primary.items[0].step = 'end';
  assert.equal(expandHappenings(l).lesson.slides.length, 3);
});

test('Morph goes straight after the colour map, once', () => {
  const xml = '<p:sld><p:cSld/><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
  const once = addMorph(xml);
  assert.ok(once.added);
  assert.match(once.xml, /<\/p:clrMapOvr><mc:AlternateContent[\s\S]*p159:morph[\s\S]*<\/mc:AlternateContent><\/p:sld>/);
  assert.equal(addMorph(once.xml).added, false);
});
