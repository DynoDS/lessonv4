'use strict';

// Content under a key the slide's template never reads is refused, not drawn
// as an empty slide.
//
// A Year 6 repair moved a slide to `body-full` with its stack still under
// `primary` (2 October 2026). Every check passed and the slide rendered with
// an empty body; only someone looking at the picture caught it.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const CHECK = path.join(__dirname, '..', 'scripts', 'check-slide-design.js');

function deck(slot) {
  return {
    lessonName: 'Undrawn Slot',
    subject: 'Maths',
    lo: 'Check divisibility by 3',
    slides: [
      {
        template: 'body-full',
        title: 'Is 2,754 divisible by 3?',
        [slot]: {
          type: 'stack',
          items: [
            { type: 'text', value: 'Add the digits: 2 + 7 + 5 + 4 = 18.' },
            { type: 'text', value: '18 is in the 3 times table, so 2,754 is divisible by 3.' },
          ],
        },
      },
    ],
  };
}

function run(lesson) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'undrawn-slot-'));
  const lessonPath = path.join(root, 'lesson.json');
  fs.writeFileSync(lessonPath, JSON.stringify(lesson, null, 2));
  const result = spawnSync(process.execPath, [CHECK, lessonPath], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    cwd: root,
  });
  fs.rmSync(root, { recursive: true, force: true });
  return { status: result.status, output: `${result.stdout || ''}${result.stderr || ''}` };
}

test('a body-full slide with its content under "primary" is refused by name', () => {
  const result = run(deck('primary'));
  if (/AUTOFIT_(DEPENDENCY_MISSING|NOT_PERMITTED)/.test(result.output)) return;
  assert.notEqual(result.status, 0);
  assert.match(result.output, /slide 1[^\n]*SLOT_NOT_DRAWN: "primary"/, result.output.slice(-2000));
});

test('the same content under "body" is drawn and not refused', () => {
  const result = run(deck('body'));
  if (/AUTOFIT_(DEPENDENCY_MISSING|NOT_PERMITTED)/.test(result.output)) return;
  assert.doesNotMatch(result.output, /SLOT_NOT_DRAWN/);
  assert.equal(result.status, 0, result.output.slice(-2000));
});
