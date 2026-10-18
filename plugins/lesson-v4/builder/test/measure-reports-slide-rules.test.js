'use strict';

// The measure tool also reports the full check's rules that judge one slide by
// itself, so a designer meets them while writing instead of spending a repair
// pass, or reading the check's code, to find them.
//
// A Year 4 slide designer read check-slide-design.js and the builder for about
// a quarter of an hour before its first check, to learn what the check would
// refuse (17 October 2026). Every rule it looked up was written in its
// guidance; it read the code because the free measure tool answered sizes only
// and every run of the check after the first costs one of three passes.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { slideBySlideWarnings } = require('../scripts/check-slide-design');

const MEASURE = path.join(__dirname, '..', 'scripts', 'measure-slides.js');
const CHECK = path.join(__dirname, '..', 'scripts', 'check-slide-design.js');

const LINE = 'Ten ones make one ten.';
const PRACTISE = { template: 'body-full', title: 'Practise', body: { type: 'text', value: 'Round 342 to the nearest 100.' } };
const EMPTY_TURN = { template: 'body-full', title: 'My Turn', body: { type: 'text', value: 'A hundred is ten tens.' } };
const TWICE = {
  template: 'split-h-50-50',
  title: 'Ten ones',
  primary: { type: 'text', value: LINE },
  secondary: { type: 'text', value: LINE },
};
// A card whose word the slide after it does not show. The full check refuses
// it, and so the measure reports it too, on a line that says it reads other
// slides (whole-deck-rules test); here it only must not count as a one-slide rule.
const EARLY_CARD = { template: 'key-vocabulary', words: [{ word: 'exchange', definition: 'Swap one ten for ten ones.' }] };
const CLEAN = { template: 'body-full', title: 'Round 342', body: { type: 'text', value: 'Round 342 to the nearest 100.' } };

function lessonOf(slides) {
  return { lessonName: 'Part Of A Deck', subject: 'Maths', lo: 'Measure before checking', slides };
}

function run(tool, lesson) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'measure-rules-test-'));
  try {
    const file = path.join(dir, 'part.json');
    fs.writeFileSync(file, JSON.stringify(lesson));
    const done = spawnSync(process.execPath, [tool, file], { encoding: 'utf8' });
    return { status: done.status, out: `${done.stdout || ''}\n${done.stderr || ''}` };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('a slide that breaks a one-slide rule gets a RULE line, and its size is still judged on its own', () => {
  const result = run(MEASURE, lessonOf([PRACTISE, EMPTY_TURN, TWICE, EARLY_CARD, CLEAN]));
  assert.equal(result.status, 0, result.out);
  assert.match(result.out, /MEASURE slide 1 "Practise": OK\n {2}RULE \(the full check refuses this\): INTERNAL_STAGE_TITLE: /);
  assert.match(result.out, /MEASURE slide 2 "My Turn": OK\n {2}RULE \(the full check refuses this\): TURN_SLIDE_WITHOUT_ITS_TURN: /);
  assert.match(result.out, /MEASURE slide 3 "Ten ones": OK\n {2}RULE \(the full check refuses this\): SAME_LINE_TWICE_ON_ONE_SLIDE: /);
  // The early card is reported as a rule that reads other slides, not as one of these.
  assert.doesNotMatch(result.out, /RULE \(the full check refuses this\): VOCAB_CARD_/);
  assert.match(result.out, /RULE \(the full check refuses this; it reads other slides too\): VOCAB_CARD_/);
});

test('the measure and the full check name the same one-slide faults on the same slides', () => {
  const slides = [PRACTISE, EMPTY_TURN, TWICE, EARLY_CARD, CLEAN];
  const measured = run(MEASURE, lessonOf(slides)).out;
  const checked = run(CHECK, lessonOf(slides)).out;
  const fromMeasure = new Set();
  let slide = 0;
  measured.split(/\r?\n/).forEach((line) => {
    const head = /^MEASURE slide (\d+)/.exec(line);
    if (head) slide = Number(head[1]);
    const rule = /^ {2}RULE \(the full check refuses this\): ([A-Z_]+):/.exec(line);
    if (rule) fromMeasure.add(`${slide} ${rule[1]}`);
  });
  const fromCheck = new Set(
    [...checked.matchAll(/^ {2}x slide (\d+) \w+: ([A-Z_]+):/gm)].map((m) => `${m[1]} ${m[2]}`)
  );
  assert.ok(fromMeasure.size === 3, measured);
  fromMeasure.forEach((fault) => assert.ok(fromCheck.has(fault), `${fault} not refused by the full check:\n${checked}`));
  // The full check also refuses the early card, a rule that reads other slides.
  assert.ok([...fromCheck].some((fault) => fault.includes('VOCAB_CARD_')), checked);
});

test('slides that break no one-slide rule say so in one line', () => {
  const result = run(MEASURE, lessonOf([CLEAN]));
  assert.equal(result.status, 0, result.out);
  assert.doesNotMatch(result.out, /RULE \(/);
  assert.match(result.out, /MEASURE_RULES: no slide breaks a rule the full check applies\./);
});

test('every rule in the list reads one slide alone: a slide gets the same verdict in a deck as by itself', () => {
  const slides = [PRACTISE, CLEAN, EMPTY_TURN, TWICE, EARLY_CARD, CLEAN];
  const inDeck = slideBySlideWarnings(lessonOf(slides), null)
    .map((warning) => `${warning.slide} ${warning.signal}`)
    .sort();
  const alone = slides
    .flatMap((slideData, index) => slideBySlideWarnings(lessonOf([slideData]), null)
      .map((warning) => `${index + 1} ${warning.signal}`))
    .sort();
  assert.deepEqual(inDeck, alone);
  assert.equal(inDeck.length, 3);
});
