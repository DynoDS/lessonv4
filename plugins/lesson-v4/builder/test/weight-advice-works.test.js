'use strict';

// Advice a refusal gives has to work when it is taken.
//
// The worksheet engine holds the same contract in `settle-fit.test.js`'s
// neighbours: every roomier arrangement it offers actually renders. This is the
// slide engine's version of it.
//
// Year 4 Maths Lesson 16 (Roman numerals to L, 22 September 2026) spent all
// three Slide Designer repair passes on six reference tables. The refusal told
// it the truth - "give the table a zone at least 1.50in tall" - in a unit the
// designer does not write. A slide spec sets weights, not inches, and the
// arithmetic from one to the other needs the stack's total height, which the
// refusal never carried. So each pass was a guess at a weight, and the
// measurement moved a hundredth of an inch at a time.
//
// The stack knows both numbers, so it now says the weight. What this file
// pins is that the weight it says is one that works.

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const CHECK = path.join(__dirname, '..', 'scripts', 'check-slide-design.js');

// A reference table sharing a stack with a short line of text: the text is
// holding height it does not use, which is exactly when a weight can move.
function lessonWithTableWeight(weight) {
  return {
    lessonName: 'Weight Advice',
    subject: 'Maths',
    lo: 'Check weight advice',
    slides: [
      {
        template: 'split-v-60-40',
        primarySide: 'top',
        title: 'Reference',
        primary: {
          type: 'stack',
          items: [
            { type: 'text', value: 'Use the table to help you.', weight: 2.2 },
            {
              type: 'table',
              weight,
              headers: ['Numeral', 'Value'],
              rows: [['I', '1'], ['V', '5'], ['X', '10']],
            },
          ],
        },
        secondary: {
          type: 'stack',
          items: [{ type: 'text', value: 'Write each number.' }],
        },
      },
    ],
  };
}

function runCheck(lesson) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'weight-advice-'));
  const lessonPath = path.join(root, 'lesson.json.tmp.weight-advice');
  fs.writeFileSync(lessonPath, JSON.stringify(lesson));
  const result = spawnSync(process.execPath, [CHECK, lessonPath], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  fs.rmSync(root, { recursive: true, force: true });
  return `${result.stdout || ''}${result.stderr || ''}`;
}

test('the weight a short zone asks for is a weight that clears it', () => {
  const refused = runCheck(lessonWithTableWeight(1));

  if (/AUTOFIT_(DEPENDENCY_MISSING|NOT_PERMITTED)/.test(refused)) return;

  assert.match(
    refused,
    /TABLE_ZONE_TOO_SHORT/,
    `this table really is too short and the check has to say so:\n${refused.slice(-900)}`
  );

  const advised = /weight of ([\d.]+) on this item/.exec(refused);
  assert.ok(
    advised,
    `a short zone inside a weighted stack must say the weight that would hold it:\n${refused.slice(-900)}`
  );

  const taken = runCheck(lessonWithTableWeight(Number(advised[1])));
  assert.doesNotMatch(
    taken,
    /TABLE_ZONE_TOO_SHORT/,
    `the advised weight of ${advised[1]} did not clear the refusal that offered it:\n` +
      taken.slice(-900)
  );
});

test('no weight is offered when no weight would reach it', () => {
  // A single item in a stack owns the whole share already, so its weight
  // divides nothing and advising one would be advising a number that changes
  // nothing. The refusal stands on its own.
  const alone = {
    lessonName: 'Weight Advice',
    subject: 'Maths',
    lo: 'Check weight advice',
    slides: [
      {
        template: 'split-v-60-40',
        primarySide: 'top',
        title: 'Reference',
        primary: {
          type: 'stack',
          items: [
            {
              type: 'table',
              headers: ['Numeral', 'Value'],
              rows: Array.from({ length: 12 }, (_, i) => [`R${i}`, String(i)]),
            },
          ],
        },
        secondary: {
          type: 'stack',
          items: [{ type: 'text', value: 'Write each number.' }],
        },
      },
    ],
  };

  const output = runCheck(alone);
  if (/AUTOFIT_(DEPENDENCY_MISSING|NOT_PERMITTED)/.test(output)) return;

  assert.match(output, /TABLE_ZONE_TOO_SHORT/);
  assert.doesNotMatch(
    output,
    /weight of [\d.]+ on this item/,
    'a weight was advised for an item whose weight cannot change its share'
  );
});
