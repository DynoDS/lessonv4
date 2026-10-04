'use strict';

// The gap between ideas and the colour on an all-black card: both asked for by
// the teacher on slide after slide (4 October 2026), both nudges rather than
// refusals, and one sentence of a card can now be orange by itself.

const assert = require('node:assert/strict');
const test = require('node:test');
const { readabilityWarnings } = require('../src/readability-nudges');
const { validatePresentationSpec, EMPHASIS_ROLES } = require('../src/presentation-text');
const { expandTeachLayouts } = require('../src/teach-layouts');

const THREE = 'In your small intestine the soup is broken down even more. Only tiny pieces can pass through the walls. The lumps stay inside.';

function nudges(slide) {
  const warnings = [];
  readabilityWarnings(slide, 1, warnings);
  return warnings;
}

function body(card) {
  return { template: 'body-full', title: 'x', body: card };
}

test('a card of three run-on sentences is asked for a gap and for its key line', () => {
  const found = nudges(body({ type: 'text', value: THREE }));
  assert.equal(found.filter((w) => /no gap between its ideas/.test(w)).length, 1);
  assert.equal(found.filter((w) => /is all black/.test(w)).length, 1);
});

test('a gap between the ideas and one sentence in orange answers both', () => {
  const card = { type: 'text', value: THREE.replace(/\. /g, '.\n\n'),
    emphasis: [{ text: 'Only tiny pieces can pass through the walls.', role: 'key-line' }] };
  assert.deepEqual(nudges(body(card)), []);
});

test('a long card of two sentences is still a wall of black', () => {
  const long = 'In your small intestine, the soup is broken down even more, and only really tiny pieces can pass through the walls.\n' +
    'It is a bit like squeezing soup through a pair of tights: the runny part drips through, and the lumps stay inside.';
  const found = nudges({ template: 'teach-layout', layout: 'lead-picture-lines', title: 'x', lines: [long] });
  assert.equal(found.filter((w) => /is all black/.test(w)).length, 1);
  assert.equal(found.filter((w) => /no gap/.test(w)).length, 0, 'two sentences are not asked for a gap');
});

test('a short card, a question in blue, a taught word and a line to remember are left alone', () => {
  assert.deepEqual(nudges(body({ type: 'text', value: 'Look at both pictures. What is the same?' })), []);
  assert.deepEqual(nudges(body({ type: 'text', value: THREE.replace(/\. /g, '.\n\n'), colorRole: 'task-blue' })), []);
  assert.deepEqual(nudges(body({ type: 'text', value: THREE.replace(/\. /g, '.\n\n'), emphasis: [{ text: 'small intestine', role: 'vocabulary' }] })), []);
  assert.deepEqual(nudges(body({ type: 'text', value: '✨ ' + THREE.replace(/\. /g, '.\n\n') })), []);
});

test('lines kept tight on purpose are not asked for a gap, only a model answer is', () => {
  const deal = 'This was the deal.\nThe apprentice worked for the master.\nThe master gave him food, clothes and a bed.\nHe was not paid.';
  assert.equal(nudges(body({ type: 'text', value: deal })).filter((w) => /no gap/.test(w)).length, 0);
  const model = '||My teeth crush my sandwich into smaller pieces.\nMy stomach squeezes it until it is a runny soup.\nOnly tiny pieces can get through the walls.';
  const found = nudges(body({ type: 'text', value: model }));
  assert.equal(found.filter((w) => /no gap/.test(w)).length, 1, 'a model answer takes the gap');
  assert.equal(found.filter((w) => /is all black/.test(w)).length, 0, 'and is not black: it is green');
});

test('a vocabulary slide and a strong-and-weak pair are not judged as cards of prose', () => {
  assert.deepEqual(nudges({ template: 'key-vocabulary', words: [{ word: 'x', definition: THREE }] }), []);
  assert.deepEqual(nudges({ template: 'strong-and-weak', strong: { type: 'text', value: THREE }, weak: { type: 'text', value: THREE } }), []);
});

test('key-line is an emphasis the builder draws, in orange and once', () => {
  assert.ok(EMPHASIS_ROLES.has('key-line'));
  assert.ok(!validatePresentationSpec({ type: 'text', value: THREE,
    emphasis: [{ text: 'The lumps stay inside.', role: 'key-line' }] }, 'body'));
});

test('a teach-layout line takes one key-line, and it counts as the slide\'s orange', () => {
  const slide = (lines) => ({ slides: [{ template: 'teach-layout', layout: 'lead-three-cards', headerStyle: 'title', title: 'x',
    lead: 'Food is broken down.', lines: lines.concat(['A plain line.', 'Another plain line.']).slice(0, 3) }] });
  const one = { value: THREE, emphasis: [{ text: 'The lumps stay inside.', role: 'key-line' }] };
  assert.doesNotThrow(() => expandTeachLayouts(slide([one])));
  assert.throws(() => expandTeachLayouts(slide([one, { value: 'A second line.', orange: true }])), /One line per slide is orange/);
  assert.throws(() => expandTeachLayouts(slide([Object.assign({}, one, { orange: true })])), /takes no "key-line"/);
});
