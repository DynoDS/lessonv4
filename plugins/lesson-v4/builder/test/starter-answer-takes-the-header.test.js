'use strict';

// The answers to a starter carry the starter header, and the check settles it.
//
// The teacher's ruling (6 October 2026): the answer slide of a starter repeats
// the date, the learning objective and "Starter", exactly as the question slide
// does. Three column addition decks running gave the answer slide another
// header style or none, were refused for it, and spent their first repair pass
// on a fix that is the same every time.
//
// What this file pins:
//   - the candidate file is rewritten, so what is promoted says what is built;
//   - only the header style moves, and only for a starter's own answers;
//   - any other difference between the two slides is still refused;
//   - a pair that already matches, and a settled deck, are left byte for byte.

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const { runSlideDesignCheck, parseBuildDiagnostics } = require('../scripts/check-slide-design.js');

function pair(questionHeader, answerHeader) {
  const question = {
    template: 'body-full',
    title: 'Starter',
    body: {
      type: 'numbered-questions',
      questions: ['246 + 137 =', '3,425 + 125 ='],
      revealPair: { id: 'starter', state: 'question' },
    },
  };
  const answer = {
    template: 'body-full',
    title: 'Answers',
    body: {
      type: 'numbered-questions',
      questions: ['246 + 137 = ||383', '3,425 + 125 = ||3,550'],
      revealPair: { id: 'starter', state: 'answer' },
    },
  };
  if (questionHeader) question.headerStyle = questionHeader;
  if (answerHeader) answer.headerStyle = answerHeader;
  return { lessonName: 'Starter Pair', subject: 'Maths', lo: 'Check a starter pair', slides: [question, answer] };
}

function check(lesson, options = {}, written) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'starter-header-'));
  const file = path.join(dir, 'lesson.json.tmp.test');
  const before = written || `${JSON.stringify(lesson, null, 2)}\n`;
  fs.writeFileSync(file, before);
  try {
    const result = runSlideDesignCheck(file, { helperVerdictPath: false, ...options });
    const after = fs.readFileSync(file, 'utf8');
    return {
      result,
      before,
      after,
      refusals: parseBuildDiagnostics(result.stdout).filter((item) => item.faultClass !== 'note'),
      said: result.stdout.split('\n').filter((line) => line.startsWith('STARTER_HEADER_SETTLED: ')),
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('an answer slide with another header style takes the starter header, in the file', () => {
  const lesson = pair('starter', 'title');
  const { result, after, refusals, said } = check(lesson);
  assert.deepEqual(refusals, [], 'the pair costs no refusal');
  assert.equal(result.ok, true, result.stderr);

  const expected = pair('starter', 'starter');
  assert.deepEqual(JSON.parse(after), expected, 'only the answer slide header style changed');
  assert.equal(after, `${JSON.stringify(expected, null, 2)}\n`, 'the file keeps its indent and its last line');

  assert.equal(said.length, 1, 'said once');
  assert.match(said[0], /slide 2 holds the answers to the starter on slide 1/);
  assert.match(said[0], /now carries "headerStyle": "starter"/);
  assert.match(said[0], /it had "title"/);
});

test('an answer slide with no header style takes it too', () => {
  const { result, after, said } = check(pair('starter', null));
  assert.equal(result.ok, true, result.stderr);
  assert.equal(JSON.parse(after).slides[1].headerStyle, 'starter');
  assert.match(said[0], /it had none/);
});

test('an answer slide that dropped or changed the starter objective takes it back', () => {
  for (const answerLo of [undefined, 'Another objective']) {
    const lesson = pair('starter', 'starter');
    lesson.slides[0].lo = 'To use column addition (no exchange)';
    if (answerLo) lesson.slides[1].lo = answerLo;
    const { result, after, refusals, said } = check(lesson);
    assert.deepEqual(refusals, []);
    assert.equal(result.ok, true, result.stderr);
    assert.equal(JSON.parse(after).slides[1].lo, 'To use column addition (no exchange)');
    assert.equal(said.length, 1);
    assert.match(said[0], /now carries "lo": "To use column addition \(no exchange\)"/);
  }
});

test('an objective only the answer slide carries is taken off it', () => {
  const lesson = pair('starter', 'starter');
  lesson.slides[1].lo = 'An objective the starter does not show';
  const { result, after } = check(lesson);
  assert.equal(result.ok, true, result.stderr);
  assert.equal('lo' in JSON.parse(after).slides[1], false);
});

test('a file written on one line with Windows endings is written back the same way', () => {
  const lesson = pair('starter', 'title');
  const { after } = check(lesson, {}, `${JSON.stringify(lesson)}\r\n`);
  assert.equal(after, `${JSON.stringify(pair('starter', 'starter'))}\r\n`);
});

test('another difference between the two slides is still refused, and named', () => {
  const lesson = pair('starter', 'title');
  lesson.slides[1].body.answerBoxes = true;
  const { result, after, refusals } = check(lesson);
  assert.equal(result.ok, false);
  assert.equal(JSON.parse(after).slides[1].headerStyle, 'starter', 'the header is settled all the same');
  const layout = refusals.filter((item) => item.signal === 'REVEAL_PAIR_LAYOUT');
  assert.ok(layout.length, 'the pair is refused for what still differs');
  for (const refusal of layout) {
    assert.match(refusal.message, /They differ in: body\.answerBoxes/);
    assert.doesNotMatch(refusal.message, /headerStyle/);
  }
});

test('a pair that already matches is left byte for byte, and nothing is said', () => {
  for (const lesson of [pair('starter', 'starter'), pair(null, null)]) {
    const { result, before, after, said } = check(lesson);
    assert.equal(result.ok, true, result.stderr);
    assert.equal(after, before);
    assert.deepEqual(said, []);
  }
});

test('only a starter passes its header on: any other pair is refused as before', () => {
  const { result, before, after, refusals, said } = check(pair(null, 'starter'));
  assert.equal(result.ok, false);
  assert.equal(after, before, 'the file is not touched');
  assert.deepEqual(said, []);
  const layout = refusals.find((item) => item.signal === 'REVEAL_PAIR_LAYOUT');
  assert.match(layout.message, /They differ in: headerStyle \(nothing on the question slide, "starter" on the answer slide\)/);
});

test('a settled deck is never rewritten', () => {
  const { result, before, after, said } = check(pair('starter', 'title'), { settled: true });
  assert.equal(after, before);
  assert.deepEqual(said, []);
  assert.equal(result.ok, false, 'it is refused, as a settled deck with this fault always was');
});
