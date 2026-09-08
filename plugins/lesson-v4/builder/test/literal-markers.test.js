'use strict';

// An inline marker that reached the board as text.
//
// A repair added `||` to the four answers on a Starter answers slide. That was
// the right instinct: `||` is how an answer is revealed in green. But the sort
// board is one of the fifty-odd helpers that do not route their strings through
// `answer-text.js`, so it printed `||Table lamp` at the class. The build wrote
// the deck and said "No warnings", a human caught it at visual review, and
// undoing it cost a second full rebuild of the whole deck.
//
// The check runs on the written package rather than the spec, which is what
// makes it general: a marker a helper consumed is gone from the XML, a marker
// nobody read is still sitting in an `<a:t>`. So no register of which helper
// parses what has to be kept up to date, and a helper added next year is
// covered on the day it lands.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { markersIn } = require('../src/verify-markers');
const { splitAnswerRuns } = require('../src/answer-text');

const BUILD = path.join(__dirname, '..', 'build.js');

function build(lesson) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'literal-markers-test-'));
  const jsonPath = path.join(dir, 'lesson.json');
  fs.writeFileSync(jsonPath, JSON.stringify(lesson));
  const run = spawnSync(process.execPath, [BUILD, jsonPath, dir], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return { ...run, output: `${run.stdout}${run.stderr}`, dir };
}

function lesson(slides) {
  return { lessonName: 'Markers', subject: 'Science', lo: 'x', slides };
}

const SORT_BOARD = (items) => ({
  template: 'body-full',
  title: 'Starter answers',
  body: {
    type: 'sort-board',
    groups: [
      { heading: 'Uses electricity', items },
      { heading: 'Does not use electricity', items: ['Wooden spoon'] },
    ],
  },
});

test('a marker a helper cannot read blocks the deck', () => {
  const result = build(lesson([SORT_BOARD(['||Table lamp', '||Battery torch'])]));

  assert.notEqual(result.status, 0, 'a marker showing as text must not publish');
  assert.match(result.output, /SLIDE_MARKER_LITERAL/);
  assert.match(result.output, /\|\|Table lamp/);
  // Named as a composition fault, so it routes to the slide designer that
  // authored the string rather than to whoever maintains the engine.
  assert.match(result.output, /"faultClass":"composition"/);
  assert.match(result.output, /No PowerPoint was written/);
});

test('a marker split over a line break is caught, not waved through', () => {
  // The hole this check used to have. A line break starts a new <a:p>, so a
  // span opening on one line and closing on the next reaches the XML as two
  // runs holding one unpaired half each. Unpaired is deliberately literal, so
  // run-by-run both halves looked innocent and the build said "No warnings"
  // over a slide about to show [[ and ]] to a class.
  const result = build(
    lesson([
      SORT_BOARD(['[[Which rule helps?\nName it and explain why.]]']),
    ])
  );

  assert.notEqual(result.status, 0, 'a split marker must not publish');
  assert.match(result.output, /SLIDE_MARKER_LITERAL/);
  assert.match(result.output, /split over a line break/);
  assert.match(result.output, /"faultClass":"composition"/);
  assert.match(result.output, /No PowerPoint was written/);
});

test('a span crossing a paragraph break colours as one span', () => {
  // The fix that removes the reason to author the split in the first place.
  // `table` reads markers, and the span now survives the line break instead of
  // printing its own brackets.
  const runs = splitAnswerRuns(
    '[[Which rule helps?\nName it and explain why.]]',
    false,
    '000000'
  );

  assert.deepEqual(
    runs.map((run) => [run.text, run.options.color]),
    [
      ['Which rule helps?', '0070C0'],
      ['\n', '000000'],
      ['Name it and explain why.', '0070C0'],
    ]
  );
});

test('the reveal marker stays per line', () => {
  // `||` must not start spanning lines with the others: a field list reveals an
  // answer after every field and each new line starts back in the base colour.
  const runs = splitAnswerRuns('Object: ||Hairdryer\nPower: ||Mains', false, '000000');

  assert.deepEqual(
    runs.map((run) => [run.text, run.options.color]),
    [
      ['Object: ', '000000'],
      ['Hairdryer', '00B050'],
      ['\n', '000000'],
      ['Power: ', '000000'],
      ['Mains', '00B050'],
    ]
  );
});

test('the same marker inside a helper that reads it publishes clean', () => {
  // The discrimination case. `table` routes through `answer-text.js`, so the
  // bars are consumed into a green run and never reach the XML as text. A check
  // that flagged this would ban the reveal marker outright.
  const result = build(
    lesson([
      {
        template: 'body-full',
        title: 'Answers',
        body: {
          type: 'table',
          headers: ['Question', 'Answer'],
          rows: [
            ['25 x 4 =', '||100'],
            ['The [[deciding]] word', '<<367>> + ___'],
          ],
        },
      },
    ])
  );

  assert.equal(result.status, 0, result.output);
  assert.doesNotMatch(result.output, /SLIDE_MARKER_LITERAL/);
});

test('parallel-line notation is not a reveal marker', () => {
  // "AB || CD" is real primary maths. The reveal marker is always written hard
  // against its answer, so the space after the bars is what separates them, and
  // it has to keep doing that or the check costs the engine a legitimate string.
  const result = build(
    lesson([
      {
        template: 'body-full',
        title: 'Parallel lines',
        body: { type: 'text', text: 'Side AB || CD in this shape.' },
      },
    ])
  );

  assert.equal(result.status, 0, result.output);
  assert.doesNotMatch(result.output, /SLIDE_MARKER_LITERAL/);
});

test('every marker form is recognised, and an unpaired one is left alone', () => {
  assert.deepEqual(markersIn('||Table lamp'), ['||']);
  assert.deepEqual(markersIn('Slide **RIGHT** now'), ['**bold**']);
  assert.deepEqual(markersIn('Is the [[answer]] missing?'), ['[[focus blue]]']);
  assert.deepEqual(markersIn('(a) {{250}} 235'), ['{{answer green}}']);
  assert.deepEqual(markersIn('<<367>> + ___'), ['<<supplied orange>>']);

  // `answer-text.js` deliberately leaves an unpaired marker as literal text so
  // a stray token never corrupts a run. That is documented behaviour, not a
  // fault, so it must not be reported as one.
  assert.deepEqual(markersIn('2 ** 3 is not a power here'), []);
  assert.deepEqual(markersIn('The [[ bracket stands alone'), []);
  assert.deepEqual(markersIn('AB || CD'), []);

  // A plain classroom string carries nothing.
  assert.deepEqual(markersIn('Name the object.'), []);
});

test('a leading reveal marker colours every paragraph of the answer', () => {
  // One reveal at the top of a two-paragraph model answer is one answer; the
  // per-line rule above is for a field list, where every line has its own.
  const runs = splitAnswerRuns(
    '||Sophie could have pitta for energy.\n\nPepper strips add vitamins.',
    true,
    '000000'
  );
  assert.equal(
    runs.map((run) => run.text).join(''),
    'Sophie could have pitta for energy.\n\nPepper strips add vitamins.'
  );
  assert.ok(runs.every((run) => run.options.color === '00B050'));
  // A single-line answer keeps rendering exactly as before.
  assert.deepEqual(
    splitAnswerRuns('||100', true, '000000'),
    [{ text: '100', options: { color: '00B050', bold: true } }]
  );
});
