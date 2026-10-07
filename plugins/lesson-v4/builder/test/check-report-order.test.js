'use strict';

// One report: refusals first, each note once, and the helper check inside it.
//
// Year 4 Maths Lesson 24's first check (6 October 2026) printed 237 lines. The
// refusals sat among the notes, Codex cut the read in the middle, and three
// refusals went with the cut. The helper delivery check was a second command:
// that run reached it after its last repair pass, and the run before never
// reached it at all.
//
// What this file pins:
//   - every refusal is printed before any note, in the line it always had;
//   - a note about several slides is printed once and still names them all;
//   - what a column needs is a diagnostic only beside a refusal on its slide;
//   - a promised helper that is not bound fails the design check itself.

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const {
  orderReport,
  parseBuildDiagnostics,
  runSlideDesignCheck,
} = require('../scripts/check-slide-design.js');

function diagnostic(signal, faultClass, location, message) {
  return `BUILD_DIAGNOSTIC: ${JSON.stringify({ signal, artifact: 'slides', faultClass, location, message })}`;
}

const NOTE = '7 criteria on one panel: check the panel reads at the back of the room.';
const REFUSAL = diagnostic('TEXT_OVERLOAD', 'content', { slide: 9, box: 'Text 2' }, 'The box is 0.21in tall.');

test('refusals are printed before every note, unchanged', () => {
  const stdout = [
    '[check] slide 5 ("Answers") looks like an answer slide.',
    diagnostic('SUCCESS_CRITERIA_CAPACITY', 'note', { slide: 4, path: 'successCriteria' }, NOTE),
    diagnostic('SUCCESS_CRITERIA_CAPACITY', 'note', { slide: 5, path: 'successCriteria' }, NOTE),
    REFUSAL,
    'PARTIAL_PREVIEW: somewhere.pptx',
  ].join('\n');
  const lines = orderReport(stdout, '').stdout.split('\n');
  assert.equal(lines[0], REFUSAL, 'the refusal leads, in the line it was printed in');
  assert.ok(lines.includes('PARTIAL_PREVIEW: somewhere.pptx'), 'a marker line is kept as it was');
});

test('a note about several slides is printed once and names every slide', () => {
  const stdout = [4, 5, 10]
    .map((slide) => diagnostic('SUCCESS_CRITERIA_CAPACITY', 'note', { slide, path: 'successCriteria' }, NOTE))
    .concat(diagnostic('SUCCESS_CRITERIA_CAPACITY', 'note', { slide: 6, path: 'successCriteria' }, 'A different note.'))
    .join('\n');
  const notes = parseBuildDiagnostics(orderReport(stdout, '').stdout);
  assert.equal(notes.length, 2, 'one line for each thing said');
  assert.deepEqual(notes[0].location, { slide: 4, slides: [4, 5, 10], path: 'successCriteria' });
  assert.deepEqual(notes[1].location, { slide: 6, path: 'successCriteria' });
});

test('the same warning on several slides is one line, and none is lost', () => {
  const stderr = [
    '[warn] slide 4: success criteria set at 18pt.',
    '[warn] slide 5: success criteria set at 18pt.',
    '  slide 4 at 18pt: "Start with ones."',
    '[warn] slide 7: a picture is small.',
    '  slide 6 at 18pt: "Start with ones."',
    '[warn] slide 9: success criteria set at 18pt.',
    'SLIDE_TEXT_BELOW_TARGET: 3 box(es) on slide(s) 4, 6 fitted under 20pt.',
  ].join('\n');
  assert.deepEqual(orderReport('', stderr).stderr.split('\n'), [
    '[warn] slides 4, 5, 9: success criteria set at 18pt.',
    '  slides 4, 6 at 18pt: "Start with ones."',
    '[warn] slide 7: a picture is small.',
    'SLIDE_TEXT_BELOW_TARGET: 3 box(es) on slide(s) 4, 6 fitted under 20pt.',
  ]);
});

test('what a column needs is a diagnostic beside a refusal, and a plain line without one', () => {
  const stdout = [
    'COLUMN_NEEDS: slide 9: this column has 3.00in of height. No weights fit this column.',
    'COLUMN_NEEDS: slide 9: this column has 3.00in of height. No weights fit this column.',
    'COLUMN_NEEDS: slide 2: this column has 4.00in of height. Weights that fit: 1, 2.',
    REFUSAL,
  ].join('\n');
  const lines = orderReport(stdout, '').stdout.split('\n');
  assert.equal(lines[0], REFUSAL);
  const said = parseBuildDiagnostics(lines.join('\n')).filter((item) => item.signal === 'COLUMN_NEEDS');
  assert.equal(said.length, 1, 'said once, on the refused slide only');
  assert.deepEqual(said[0].location, { slide: 9 });
  assert.equal(said[0].faultClass, 'composition');
  assert.equal(lines[1].startsWith('BUILD_DIAGNOSTIC: '), true, 'it sits with the refusals');
  assert.ok(lines.includes('COLUMN_NEEDS: slide 2: this column has 4.00in of height. Weights that fit: 1, 2.'));
});

// ─── the helper delivery check ─────────────────────────────────────

const CHART = { type: 'place-value-chart', columns: ['Hundreds', 'Tens', 'Ones'], rows: [{ cells: ['2', '6', '4'] }] };

function runWithVerdict(body) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'helper-with-design-'));
  const file = path.join(dir, 'lesson.json.tmp.test');
  fs.writeFileSync(file, JSON.stringify({
    lessonName: 'Helper Delivery',
    subject: 'Maths',
    lo: 'Check the helper is delivered',
    slides: [{
      template: 'body-full',
      title: 'Place value',
      representationRefs: [{ ref: 'rep-001', configuration: 'chart' }],
      body,
    }],
  }));
  fs.writeFileSync(path.join(dir, 'helper-check.json'), JSON.stringify({
    decisions: [{
      representationId: 'rep-001',
      configuration: 'chart',
      requiredSurface: 'slides',
      decision: 'covered',
      helperKey: 'place-value-chart',
      featureChecks: [{ feature: 'Three labelled columns.', visualReview: 'Look at the bound helper.' }],
    }],
  }));
  try {
    return runSlideDesignCheck(file);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('a promised helper that is not on the slide fails the design check itself', () => {
  const result = runWithVerdict({ type: 'text', value: 'What is the value of each digit in 264?' });
  if (/Helper delivery was not checked here/.test(result.stderr)) return; // no Python on this machine
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'HELPER_DELIVERY_FAILED');
  const first = parseBuildDiagnostics(result.stdout)[0];
  assert.equal(first.signal, 'HELPER_DELIVERY_FAILED', 'it leads the report with the other refusals');
  assert.match(first.message, /rep-001\/chart \(place-value-chart\)/);
  assert.equal(result.previewDir, undefined, 'a candidate that fails it is not offered for promotion');
});

test('a delivered helper is reported in the same report', () => {
  const result = runWithVerdict(CHART);
  if (/Helper delivery was not checked here/.test(result.stderr)) return; // no Python on this machine
  assert.equal(result.ok, true, result.stderr);
  assert.match(result.stdout, /^HELPER_DELIVERY_OK 1$/m);
});

test('a settled deck is not asked: its composition is closed', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'helper-settled-'));
  const file = path.join(dir, 'lesson.json');
  fs.writeFileSync(file, JSON.stringify({
    lessonName: 'Settled', subject: 'Maths', lo: 'Check a settled deck',
    slides: [{ template: 'body-full', title: 'Place value', body: { type: 'text', value: 'What is the value of 6 in 264?' } }],
  }));
  fs.writeFileSync(path.join(dir, 'helper-check.json'), 'not even JSON');
  try {
    const result = runSlideDesignCheck(file, { settled: true });
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /HELPER_DELIVERY/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
