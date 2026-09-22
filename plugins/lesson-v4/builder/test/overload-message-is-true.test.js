'use strict';

// A refusal's own numbers must justify the refusal.
//
// `criteria-card-fit.test.js` beside this one holds the same contract for the
// other half of the problem: a card the layout passes is a card the final check
// passes. This file holds the half that reaches the designer as words.
//
// Year 4 Maths Lesson 17 (Roman numerals to C, 22 September 2026) spent all
// three of the Slide Designer's repair passes on four slides and gave up. The
// refusal it was working from said:
//
//   criterion 1 does not fit its card at the 18pt readable minimum. The card
//   holds about 95 characters at 18pt (1 line of about 95); this one is 40
//   characters, which wrap to 1 line.
//
// Forty characters into a card that holds ninety-five, one line into one line:
// by its own arithmetic the criterion fits, and it was refused anyway. The
// refusal was right - the card was 0.23in tall where one line at 18pt needs
// 0.35in, so it held no lines at all - but the sentence rounded "no lines" up
// to one and described a card that did not exist. Shortening the wording was
// the only lever the message pointed at, and no amount of it could ever work.
//
// So: whenever a step is refused, the numbers in the refusal have to show why.
// Either the text is longer than the budget, or it wraps to more lines than the
// card has, or the message says plainly that the card cannot hold one line.

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const CHECK = path.join(__dirname, '..', 'scripts', 'check-slide-design.js');

// The real shape from that lesson: half a slide, shared between a question and
// a four-criteria panel, which leaves each card well under one line of 18pt.
function tooShortForOneLine() {
  return {
    template: 'split-v-50-50',
    primarySide: 'top',
    title: 'My Turn - writing',
    primary: {
      type: 'stack',
      heightRatio: 1,
      items: [
        {
          type: 'text',
          value: 'Write each number in Roman numerals.\n68\n98',
          align: 'center',
          weight: 0.55,
        },
        {
          type: 'sc-panel',
          criteria: {
            type: 'steps',
            steps: [
              'Partition the number into tens and ones.',
              'Write the tens using <<the reference table>>.',
              'If there are ones, write them after the tens, using <<IV for 4 and IX for 9>>.',
              'Read your Roman numeral to check it.',
            ],
          },
          weight: 3,
        },
      ],
    },
    secondary: {
      type: 'stack',
      items: [{ type: 'text', value: 'I = 1   V = 5   X = 10   L = 50   C = 100' }],
    },
  };
}

function runCheck(slides) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'overload-message-'));
  const lessonPath = path.join(root, 'lesson.json.tmp.overload-message');
  fs.writeFileSync(
    lessonPath,
    JSON.stringify({
      lessonName: 'Overload Message',
      subject: 'Maths',
      lo: 'Check refusal messages',
      slides,
    })
  );
  const result = spawnSync(process.execPath, [CHECK, lessonPath], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  fs.rmSync(root, { recursive: true, force: true });
  return `${result.stdout || ''}${result.stderr || ''}`;
}

test('a step refused for overload is refused by numbers the message shows', () => {
  const output = runCheck([tooShortForOneLine()]);

  // A machine that cannot measure says nothing about the cards either way.
  if (/AUTOFIT_(DEPENDENCY_MISSING|NOT_PERMITTED)/.test(output)) return;

  const overloads = output
    .split(/\r?\n/)
    .filter((line) => line.startsWith('BUILD_DIAGNOSTIC: '))
    .map((line) => JSON.parse(line.slice('BUILD_DIAGNOSTIC: '.length)))
    .filter((d) => d.signal === 'STEP_TEXT_OVERLOAD');

  assert.ok(
    overloads.length,
    `this panel really does not fit and the check has to say so:\n${output.slice(-1200)}`
  );

  for (const diagnostic of overloads) {
    const message = diagnostic.message;

    // A message that never quotes a budget cannot contradict itself.
    const budget = /holds about (\d+) characters/.exec(message);
    if (!budget) continue;

    const lines = /\((\d+) lines? of about \d+\)/.exec(message);
    const actual = /this one is (\d+) characters/.exec(message);
    const wraps = /wrap to (\d+) lines?/.exec(message);

    // Either the message states the card cannot hold a line, or its numbers
    // have to show the overflow they are refusing.
    if (/cannot hold|too short for one line|no room for one line/i.test(message)) continue;

    assert.ok(
      actual && lines && wraps,
      `a refusal quoting a budget must quote what overran it:\n${message}`
    );

    const overran =
      Number(actual[1]) > Number(budget[1]) || Number(wraps[1]) > Number(lines[1]);

    assert.ok(
      overran,
      'the refusal says the step fits and refuses it anyway ' +
        `(${actual[1]} characters into ${budget[1]}, ` +
        `${wraps[1]} line(s) into ${lines[1]}):\n${message}`
    );
  }
});
