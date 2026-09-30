'use strict';

// One check run names every fault in the deck, a refused teach layout included.
//
// A teach layout the check could not expand used to end the run on the spot,
// so the other faults in the deck arrived one check at a time and a slide
// designer spent its repair passes finding them (29 September 2026: four test
// runs out of four reported it). Now each refused layout is named with its
// slide number and the rest of the deck is checked and built beside it.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const CHECK = path.join(__dirname, '..', 'scripts', 'check-slide-design.js');

function deck(withRefusedLayout) {
  return {
    lessonName: 'Every Fault',
    subject: 'Maths',
    lo: 'Report every fault at once',
    slides: [
      {
        template: 'split-v-60-40',
        title: 'A clean slide',
        primary: { type: 'text', value: 'Round 342 to the nearest 100.' },
        secondary: { type: 'text', value: 'Show it on a number line.' },
      },
      withRefusedLayout
        ? {
            template: 'teach-layout',
            layout: 'labelled-picture-lines',
            lead: 'A lead line this layout has nowhere to put.',
          }
        : {
            template: 'split-v-60-40',
            title: 'Another clean slide',
            primary: { type: 'text', value: 'Round 460 to the nearest 100.' },
            secondary: { type: 'text', value: 'Mark halfway first.' },
          },
      {
        template: 'split-v-60-40',
        title: 'A title far too long to fit on one slide heading however it is set '.repeat(4),
        primary: { type: 'text', value: 'Round 849 to the nearest 100.' },
        secondary: { type: 'text', value: 'Choose the nearer hundred.' },
      },
    ],
  };
}

function run(lesson) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'every-fault-'));
  const lessonPath = path.join(root, 'lesson.json');
  fs.writeFileSync(lessonPath, JSON.stringify(lesson, null, 2));
  const result = spawnSync(process.execPath, [CHECK, lessonPath], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    cwd: root,
  });
  const leftovers = fs.readdirSync(root).filter((name) => name.includes('teach-check'));
  fs.rmSync(root, { recursive: true, force: true });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  const faults = output
    .split(/\r?\n/)
    .filter((line) => line.startsWith('BUILD_DIAGNOSTIC: '))
    .map((line) => JSON.parse(line.slice('BUILD_DIAGNOSTIC: '.length)));
  return { status: result.status, output, faults, leftovers };
}

test('a refused teach layout is named by slide and the rest of the deck is still checked', () => {
  const result = run(deck(true));
  if (/AUTOFIT_(DEPENDENCY_MISSING|NOT_PERMITTED)/.test(result.output)) return;
  assert.notEqual(result.status, 0);
  const teach = result.faults.filter((f) => f.signal === 'TEACH_LAYOUT_INVALID');
  assert.equal(teach.length, 1, result.output.slice(-2000));
  assert.equal(teach[0].location.slide, 2);
  // The overlong title on slide 3 arrives in the same run.
  assert.ok(
    result.faults.some((f) => f.location && f.location.slide === 3),
    result.output.slice(-2000)
  );
  assert.match(result.output, /SLIDE_DESIGN_CHECK_FAILED: TEACH_LAYOUT_INVALID/);
  assert.deepEqual(result.leftovers, [], 'the placeholder file was left beside the lesson');
});

test('the same deck without the refused layout reports only its own fault', () => {
  const result = run(deck(false));
  if (/AUTOFIT_(DEPENDENCY_MISSING|NOT_PERMITTED)/.test(result.output)) return;
  assert.notEqual(result.status, 0);
  assert.ok(!result.faults.some((f) => f.signal === 'TEACH_LAYOUT_INVALID'));
  assert.ok(result.faults.some((f) => f.location && f.location.slide === 3));
});
