'use strict';

// A question slide and its answer slide that are composed differently are
// told which field differs.
//
// Three column addition decks running (4, 5 and 6 October 2026) gave the
// starter a `headerStyle` and its answer slide a different one, or none. The
// refusal said the two "need the same template, content slot and static slide
// composition" and left the designer to find the field: one read the checker's
// code to do it, on a repair pass it could not spare.
//
// Which differences are allowed is not changed here. Only the naming is.

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const { runSlideDesignCheck, parseBuildDiagnostics } = require('../scripts/check-slide-design.js');

function starterPair(answerSlide) {
  const question = {
    template: 'body-full',
    title: 'Starter',
    headerStyle: 'starter',
    body: {
      type: 'numbered-questions',
      questions: ['246 + 137 =', '3,425 + 125 ='],
      revealPair: { id: 'starter', state: 'question' },
    },
  };
  const answer = {
    template: 'body-full',
    title: 'Answers',
    headerStyle: 'starter',
    body: {
      type: 'numbered-questions',
      questions: ['246 + 137 = ||383', '3,425 + 125 = ||3,550'],
      revealPair: { id: 'starter', state: 'answer' },
    },
    ...answerSlide,
  };
  return { lessonName: 'Pair', subject: 'Maths', lo: 'Check a pair', slides: [question, answer] };
}

function pairRefusals(lesson) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pair-difference-'));
  const file = path.join(dir, 'lesson.json');
  fs.writeFileSync(file, JSON.stringify(lesson));
  try {
    const result = runSlideDesignCheck(file, { helperVerdictPath: false });
    return parseBuildDiagnostics(result.stdout).filter((item) => item.signal === 'REVEAL_PAIR_LAYOUT');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('a pair composed alike is not refused', () => {
  assert.deepEqual(pairRefusals(starterPair({})), []);
});

// A starter's answer slide is given the starter header by the check itself
// (starter-answer-takes-the-header.test.js), so the header styles that still
// differ here are on a pair whose question slide is not a starter.
test('an answer slide with another header style is told it is the header style', () => {
  const lesson = starterPair({});
  lesson.slides[0].headerStyle = 'title';
  const refusals = pairRefusals(lesson);
  assert.ok(refusals.length, 'the pair is still refused, as it was');
  for (const refusal of refusals) {
    assert.match(refusal.message, /needs the same template, content slot and static slide composition/);
    assert.match(refusal.message, /They differ in: headerStyle \("title" on the question slide, "starter" on the answer slide\)/);
  }
});

test('a field the question slide left out is named as missing', () => {
  const lesson = starterPair({});
  delete lesson.slides[0].headerStyle;
  const [refusal] = pairRefusals(lesson);
  assert.ok(refusal);
  assert.match(refusal.message, /headerStyle \(nothing on the question slide, "starter" on the answer slide\)/);
});

test('a difference inside the body is named by where it is', () => {
  const lesson = starterPair({});
  lesson.slides[1].body.answerBoxes = true;
  const [refusal] = pairRefusals(lesson);
  assert.ok(refusal);
  assert.match(refusal.message, /body\.answerBoxes \(nothing on the question slide, true on the answer slide\)/);
});
