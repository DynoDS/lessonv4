'use strict';

// The measure tool reports every rule the full check applies, including the
// ones that need the whole deck in view (a reveal and its answer slide, where
// a word card sits, criteria from the first working slide, the Teach slide
// rules), so a slide designer can try them before the check runs, at no cost
// to its three repair passes.
//
// With only the one-slide rules on offer, both Year 4 science slide designers
// of 17 October 2026 listed every refusal the check can make and read its code
// before writing a slide, about 9 and 13 minutes of a 25 and 31 minute job.
// Most of what they looked up was a whole-deck rule.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { wholeDeckWarnings } = require('../scripts/check-slide-design');

const MEASURE = path.join(__dirname, '..', 'scripts', 'measure-slides.js');
const CHECK = path.join(__dirname, '..', 'scripts', 'check-slide-design.js');

const CARD = { template: 'key-vocabulary', words: [{ word: 'vibration', definition: 'A quick movement back and forth.' }] };
const USES_WORD = { template: 'body-full', title: 'What makes a sound?', body: { type: 'text', value: 'A sound starts with a vibration.' } };
const OTHER = { template: 'body-full', title: 'Our question', body: { type: 'text', value: 'How do we hear the bell?' } };

function lessonOf(slides) {
  return { lessonName: 'Whole Deck', yearGroup: 'Year 4', subject: 'Science', lo: 'To try every rule before the check', slides };
}

function run(tool, lesson, design) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'measure-deck-rules-test-'));
  try {
    const file = path.join(dir, 'lesson.json');
    fs.writeFileSync(file, JSON.stringify(lesson));
    if (design) fs.writeFileSync(path.join(dir, 'lesson-design.json'), JSON.stringify(design));
    const done = spawnSync(process.execPath, [tool, file], { encoding: 'utf8' });
    return { status: done.status, out: `${done.stdout || ''}\n${done.stderr || ''}` };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function faultsFrom(out, pattern) {
  const found = new Set();
  let slide = 0;
  out.split(/\r?\n/).forEach((line) => {
    const head = /^MEASURE slide (\d+)/.exec(line);
    if (head) slide = Number(head[1]);
    const rule = pattern.exec(line);
    if (rule) found.add(`${slide} ${rule[1]}`);
  });
  return found;
}

test('a word card after the slide that uses its word gets a RULE line that says it reads other slides', () => {
  const result = run(MEASURE, lessonOf([OTHER, USES_WORD, CARD]));
  assert.equal(result.status, 0, result.out);
  assert.match(result.out,
    /MEASURE slide 3(?: "[^"]*")?: OK\n {2}RULE \(the full check refuses this; it reads other slides too\): VOCAB_CARD_AFTER_A_SLIDE_WITH_ITS_WORD: /);
  assert.match(result.out, /MEASURE_RULES: 1 rule problem\(s\) on 1 slide\(s\)/);
});

test('the measure and the full check name the same whole-deck faults on the same slides', () => {
  const slides = [OTHER, USES_WORD, CARD];
  const measured = faultsFrom(run(MEASURE, lessonOf(slides)).out,
    /^ {2}RULE \(the full check refuses this; it reads other slides too\): ([A-Z_]+):/);
  const checkedOut = run(CHECK, lessonOf(slides)).out;
  const checked = new Set([...checkedOut.matchAll(/^ {2}\S slide (\d+) \w+: ([A-Z_]+):/gm)].map((m) => `${m[1]} ${m[2]}`));
  assert.ok(measured.size >= 1, 'the measure reported no whole-deck fault');
  measured.forEach((fault) => assert.ok(checked.has(fault), `${fault} not refused by the full check:\n${checkedOut}`));
});

test('a card in its right place breaks no rule, so the deck is clean', () => {
  const result = run(MEASURE, lessonOf([OTHER, CARD, USES_WORD]));
  assert.equal(result.status, 0, result.out);
  assert.doesNotMatch(result.out, /RULE \(/);
  assert.match(result.out, /MEASURE_RULES: no slide breaks a rule the full check applies\./);
});

test('units of the lesson design with no slide yet are named, because a whole-deck rule may wait on them', () => {
  const design = {
    starter: { sourceUnitId: 'lesson-section/starter/unit-001' },
    teachingSequence: [
      { sourceUnitId: 'lesson-section/teaching-sequence/unit-001', kind: 'do' },
      { sourceUnitId: 'lesson-section/teaching-sequence/unit-002', kind: 'do' },
    ],
  };
  const slides = [Object.assign({ designUnitId: 'lesson-section/starter/unit-001' }, OTHER)];
  const facts = wholeDeckWarnings(lessonOf(slides), path.join(os.tmpdir(), 'no-such-folder', 'lesson.json'));
  assert.deepEqual(facts.missingUnits, [], 'no design beside the file means nothing to name');
  const result = run(MEASURE, lessonOf(slides), design);
  assert.equal(result.status, 0, result.out);
  assert.match(result.out,
    /Not yet on any slide: lesson-section\/teaching-sequence\/unit-001, lesson-section\/teaching-sequence\/unit-002\./);
});
