'use strict';

// A question pairs with its answer wherever the builder hands the block on as
// a copy.
//
// The pair used to find the half being drawn by asking whether it was the very
// object in the lesson. Two routes never hand that object on: a numbered row
// draws a copy of each item with its (1), (2), (3) added, and every slide
// reaches its template through the wrapper that watches which slots are read.
// So a numbered row of questions, and the pair templates.md describes on a
// whole Your Turn slide, were refused whatever they held, and with no "They
// differ in" because nothing differed. Five of twenty lessons met it (7 October
// 2026) and their designers typed the numbers in by hand.
//
// These go through the real slide check, because the tests that call a helper
// directly never meet the wrapper.

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const { runSlideDesignCheck, parseBuildDiagnostics } = require('../scripts/check-slide-design.js');

function refusals(slides) {
  const lesson = { lessonName: 'Pair', subject: 'Maths', lo: 'Check a pair', slides };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pair-copied-block-'));
  const file = path.join(dir, 'lesson.json');
  fs.writeFileSync(file, JSON.stringify(lesson));
  try {
    const result = runSlideDesignCheck(file, { helperVerdictPath: false });
    return parseBuildDiagnostics(result.stdout).filter((item) => /^REVEAL_PAIR/.test(item.signal));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function numberedRow(state, values) {
  return {
    template: 'body-full',
    title: state === 'question' ? 'Starter' : 'Answers',
    headerStyle: 'starter',
    body: {
      type: 'row',
      questionNumbering: 'independent',
      equaliseTextCards: true,
      items: values.map((text, index) => ({
        type: 'text', text, align: 'center', revealPair: { id: `starter-${index + 1}`, state },
      })),
    },
  };
}

function yourTurn(template, state, questions) {
  return {
    template,
    title: state === 'question' ? 'Your Turn' : 'Answers',
    questions,
    revealPair: { id: 'your-turn', state },
    ...(template === 'maths-your-turn-sc'
      ? { criteria: { type: 'steps', steps: ['Line up the columns.', 'Add the ones first.'] } }
      : {}),
  };
}

test('a numbered row of questions pairs with its numbered answers', () => {
  assert.deepEqual(refusals([
    numberedRow('question', ['owl', 'fluffy', 'soft']),
    numberedRow('answer', ['owl: ||noun', 'fluffy: ||adjective', 'soft: ||adjective']),
  ]), []);
});

for (const template of ['maths-your-turn', 'maths-your-turn-sc']) {
  test(`a pair set on a whole ${template} slide is accepted`, () => {
    assert.deepEqual(refusals([
      yourTurn(template, 'question', ['246 + 137 =', '325 + 125 =']),
      yourTurn(template, 'answer', ['246 + 137 = ||383', '325 + 125 = ||450']),
    ]), []);
  });
}

test('a numbered row composed differently is still refused, and told where', () => {
  const answer = numberedRow('answer', ['owl: ||noun', 'fluffy: ||adjective', 'soft: ||adjective']);
  delete answer.body.equaliseTextCards;
  const found = refusals([numberedRow('question', ['owl', 'fluffy', 'soft']), answer]);
  assert.ok(found.length, 'the pair is refused');
  for (const refusal of found) {
    assert.match(refusal.message, /They differ in: body\.equaliseTextCards/);
  }
});
