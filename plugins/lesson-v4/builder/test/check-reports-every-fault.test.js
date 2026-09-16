'use strict';

// One check run reports every fault it can find, not the first layer of them.
//
// The slide design check used to stop at the first stage that found anything:
// wording and colour rules, then the layout dry run, then the real build and
// its text fit. A designer who fixed what it named ran it again and met the
// next stage's faults for the first time. On the Year 4 "round to the nearest
// 100" run (16 September 2026) three repair passes went on slides 18 and 22,
// the dry run then passed, the real build ran for the first time and refused
// eleven other slides at once, and there were no passes left: the whole deck
// was withheld. Every stage costs about two seconds together, so there is no
// saving worth hiding a fault for.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { runSlideDesignCheck } = require('../scripts/check-slide-design');

const CRITERIA = [
  "If it's already a {{multiple of 100}}, <<keep it unchanged>>.",
  'Write the 100s either side of your number at the ends of a number line.',
  'Mark {{halfway}} and place your number.',
  'Choose the <<nearer hundred>>; at halfway, choose the <<greater hundred>>.',
];

function lessonWithFaultsAtEveryStage() {
  return {
    lessonName: 'Every Fault At Once',
    subject: 'Maths',
    lo: 'Report every fault',
    slides: [
      // A wording fault the static rules find: a lesson-stage name the class
      // should never see as a title.
      {
        template: 'split-v-60-40',
        title: 'Do 2',
        primary: { type: 'text', value: 'Round 342 to the nearest 100.' },
        secondary: { type: 'text', value: 'Show it on a number line.' },
      },
      // A layout fault the dry run finds: four criteria squeezed into the
      // bottom of a split, where the cards cannot hold them.
      {
        template: 'split-v-60-40',
        title: 'Is this rounding right?',
        primarySide: 'top',
        primary: { type: 'text', value: 'Amira says 3,448 rounds to 3,500.' },
        secondary: { type: 'sc-panel', content: { type: 'steps', steps: CRITERIA } },
      },
      // A fault only the real text fit finds: a heading strip too shallow to
      // hold one line of readable text.
      {
        template: 'maths-your-turn-sc',
        title: 'Your Turn',
        criteria: { type: 'steps', steps: ['Mark halfway.', 'Choose the nearer hundred.'] },
        questionVisual: {
          type: 'stack',
          items: [
            { type: 'text', value: 'Round to the nearest 100:', weight: 0.38 },
            {
              type: 'numberline',
              lines: [
                { start: 0, end: 100, interval: 50, labels: [], lineLabel: '(1)' },
                { start: 0, end: 100, interval: 50, labels: [], lineLabel: '(2)' },
                { start: 0, end: 100, interval: 50, labels: [], lineLabel: '(3)' },
              ],
              weight: 2.8,
            },
          ],
        },
        questions: ['46', '849', '2,750'],
      },
    ],
  };
}

test('one check reports wording, layout and text-fit faults together', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'check-every-fault-'));
  try {
    const lessonPath = path.join(root, 'lesson.json.tmp.every-fault');
    fs.writeFileSync(lessonPath, JSON.stringify(lessonWithFaultsAtEveryStage(), null, 2));

    const result = runSlideDesignCheck(lessonPath);
    const output = `${result.stdout}${result.stderr}`;
    const signals = output
      .split(/\r?\n/)
      .filter((line) => line.startsWith('BUILD_DIAGNOSTIC: '))
      .map((line) => JSON.parse(line.slice('BUILD_DIAGNOSTIC: '.length)))
      .map((d) => `${d.location.slide}:${d.signal}`);

    assert.equal(result.ok, false);
    assert.ok(signals.includes('1:INTERNAL_STAGE_TITLE'), `no wording fault in:\n${signals.join('\n')}`);
    assert.ok(signals.includes('2:STEP_TEXT_OVERLOAD'), `no layout fault in:\n${signals.join('\n')}`);

    // The text fit needs a font to measure with; without one it says so, and
    // that is a fact about the machine, not about whether this check ran.
    if (!/AUTOFIT_(DEPENDENCY_MISSING|NOT_PERMITTED)/.test(output)) {
      assert.ok(signals.includes('3:TEXT_OVERLOAD'), `no text-fit fault in:\n${signals.join('\n')}`);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
