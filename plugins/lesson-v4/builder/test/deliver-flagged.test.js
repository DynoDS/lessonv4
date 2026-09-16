'use strict';

// A deck with a fault in it is handed over with that slide named, not withheld.
//
// Daniel, 16 September 2026, after a Year 4 rounding run lost its deck, its
// working wall and its stick-in sheets over faults on a handful of slides:
// "flag the slides and deliver it". A teacher fixes one slide in a minute; a
// withheld deck costs the lesson. The lesson run builds with
// `--deliver-flagged`, so every slide that still carries a fault after the
// repair round is written as best it can be and named on `SLIDES_FLAGGED:`.
//
// Two things stay as they were. A build without the switch still refuses, so
// the slide designer's own check keeps sending faults back for repair and a
// hand rebuild never replaces a teacher's working deck with a faulty one. And
// a deck PowerPoint would call broken is never written, switch or not, because
// a file nobody can open is not a deck with a flag on it.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const BUILD = path.join(__dirname, '..', 'build.js');

function lesson() {
  return {
    lessonName: 'Flagged Delivery',
    subject: 'Maths',
    lo: 'Deliver a deck with its faults named',
    slides: [
      {
        template: 'split-v-60-40',
        title: 'A clean slide',
        primary: { type: 'text', value: 'Round 342 to the nearest 100.' },
        secondary: { type: 'text', value: 'Show it on a number line.' },
      },
      // Cannot be laid out: four criteria squeezed into the bottom of a split.
      {
        template: 'split-v-60-40',
        title: 'Is this rounding right?',
        primarySide: 'top',
        primary: { type: 'text', value: 'Amira says 3,448 rounds to 3,500.' },
        secondary: {
          type: 'sc-panel',
          content: {
            type: 'steps',
            steps: [
              "If it's already a multiple of 100, keep it unchanged.",
              'Write the 100s either side of your number at the ends of a number line.',
              'Mark halfway and place your number.',
              'Choose the nearer hundred; at halfway, choose the greater hundred.',
            ],
          },
        },
        speakerNotes: 'Say to children: is Amira right?',
      },
      // Lays out, but a heading strip too shallow for one readable line.
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
              ],
              weight: 2.8,
            },
          ],
        },
        questions: ['46', '849'],
      },
    ],
  };
}

function build(extraArgs) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'deliver-flagged-'));
  const lessonPath = path.join(root, 'lesson.json');
  const outDir = path.join(root, 'out');
  fs.writeFileSync(lessonPath, JSON.stringify(lesson(), null, 2));
  const result = spawnSync(process.execPath, [BUILD, lessonPath, outDir, ...extraArgs], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  const deck = path.join(outDir, 'Flagged Delivery.pptx');
  return {
    root,
    status: result.status,
    output: `${result.stdout || ''}${result.stderr || ''}`,
    deckWritten: fs.existsSync(deck),
  };
}

function flagged(output) {
  const line = output.split(/\r?\n/).find((l) => l.startsWith('SLIDES_FLAGGED: '));
  return line ? JSON.parse(line.slice('SLIDES_FLAGGED: '.length)) : null;
}

test('without the switch a faulty deck is still refused', () => {
  const run = build([]);
  try {
    assert.notEqual(run.status, 0);
    assert.equal(run.deckWritten, false);
    assert.equal(flagged(run.output), null);
  } finally {
    fs.rmSync(run.root, { recursive: true, force: true });
  }
});

test('with the switch the deck is written and every faulty slide is named', () => {
  const run = build(['--deliver-flagged']);
  try {
    if (/AUTOFIT_(DEPENDENCY_MISSING|NOT_PERMITTED)/.test(run.output)) return;
    assert.equal(run.status, 0, run.output.slice(-2000));
    assert.equal(run.deckWritten, true);
    assert.match(run.output, /^Wrote: /m);

    const flags = flagged(run.output);
    assert.ok(flags, 'no SLIDES_FLAGGED line');
    assert.deepEqual(flags.slides, [2, 3]);
    const signals = flags.faults.map((f) => `${f.slide}:${f.signal}`);
    assert.ok(signals.includes('2:STEP_TEXT_OVERLOAD'), signals.join(', '));
    assert.ok(signals.includes('3:TEXT_OVERLOAD'), signals.join(', '));
  } finally {
    fs.rmSync(run.root, { recursive: true, force: true });
  }
});
