'use strict';

// A slide designer can ask whether a slide fits before it spends a repair pass.
//
// The full slide check judges a finished deck and each run of it is one of
// three repair passes, so a designer learned whether a new arrangement held
// its content only by spending a pass on it. On three Codex lessons (10 and 11
// October 2026) the same slides came back pass after pass with a different
// size complaint each time, and all three designers ran out. measure-slides.js
// answers the size question alone, on a part-written deck, and is not a pass.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { readBuild } = require('../scripts/measure-slides');

const TOOL = path.join(__dirname, '..', 'scripts', 'measure-slides.js');

const CRITERIA = [
  "If it's already a {{multiple of 100}}, <<keep it unchanged>>.",
  'Write the 100s either side of your number at the ends of a number line.',
  'Mark {{halfway}} and place your number.',
  'Choose the <<nearer hundred>>; at halfway, choose the <<greater hundred>>.',
];

function measure(lesson) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'measure-slides-test-'));
  try {
    const file = path.join(dir, 'part.json');
    fs.writeFileSync(file, JSON.stringify(lesson));
    const done = spawnSync(process.execPath, [TOOL, file], { encoding: 'utf8' });
    return {
      status: done.status,
      out: `${done.stdout || ''}\n${done.stderr || ''}`,
      keptPreview: fs.existsSync(path.join(dir, 'measure-preview', 'measured-slides.pptx')),
      left: fs.readdirSync(dir).sort(),
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('a part-written deck is measured slide by slide: one fits, one does not', () => {
  const result = measure({
    lessonName: 'Two Slides Of A Longer Deck',
    subject: 'Maths',
    lo: 'Measure before checking',
    slides: [
      {
        template: 'body-full',
        title: 'Round 342',
        body: { type: 'text', value: 'Round 342 to the nearest 100.' },
      },
      // Four criteria in the shallow bottom of a split: the cards cannot hold them.
      {
        template: 'split-v-60-40',
        title: 'Is this rounding right?',
        primarySide: 'top',
        primary: { type: 'text', value: 'Amira says 3,448 rounds to 3,500.' },
        secondary: { type: 'sc-panel', content: { type: 'steps', steps: CRITERIA } },
      },
    ],
  });
  assert.equal(result.status, 0, result.out);
  assert.match(result.out, /MEASURE slide 1 "Round 342": OK/);
  assert.match(result.out, /MEASURE slide 2 "Is this rounding right\?": DOES NOT FIT/);
  assert.match(result.out, /MEASURE_RESULT: 1 of 2 slide\(s\) do not fit yet/);
  // The drawn slides are kept to look at; nothing else is left beside the file.
  assert.equal(result.keptPreview, true);
  assert.deepEqual(result.left, ['measure-preview', 'part.json']);
});

test('what the full check would only remark on is a note, never a refusal', () => {
  const { refused, notes } = readBuild([
    'BUILD_DIAGNOSTIC: {"signal":"TEXT_OVERLOAD","faultClass":"content","location":{"slide":2},"message":"too long"}',
    'BUILD_DIAGNOSTIC: {"signal":"SUCCESS_CRITERIA_CAPACITY","faultClass":"composition","location":{"slide":3},"message":"six steps"}',
    'BUILD_DIAGNOSTIC: {"signal":"DRAWN_A_HAIR_UNDER_SIZE","faultClass":"note","location":{"slide":4},"message":"close enough"}',
    'SLIDE_TEXT_BELOW_TARGET:',
    '  slide 5 at 18pt: "Write the ones digit of the total below."',
  ].join('\n'));
  assert.deepEqual([...refused.keys()], [2]);
  assert.deepEqual([...notes.keys()].sort(), [3, 5]);
  assert.equal(notes.has(4), false);
});
