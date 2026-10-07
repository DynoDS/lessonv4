'use strict';

// A preview deck is rendered to pictures and the pictures are measured for
// clear space. On 6 October 2026 a decorator measured an older render, named
// the current lesson.json beside it, and the "deck has changed" check passed
// over pages drawn before the deck moved: nothing on disk said which lesson a
// preview had been built from. The preview check now keeps that lesson file
// beside the deck, and measure-slide-room.py stamps from it.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { runSlideDesignCheck } = require('../scripts/check-slide-design');

const MEASURE = path.join(__dirname, '..', '..', 'scripts', 'measure-slide-room.py');
const PYTHON = process.env.LESSON_V4_PYTHON || 'python';

function lesson(title) {
  return {
    lessonName: 'Scratch Check',
    subject: 'Maths',
    lo: 'Check a slide',
    slides: [{ template: 'title', title }],
  };
}

function previewOf(root, spec) {
  const fakeBuilder = path.join(root, 'fake-builder.js');
  fs.writeFileSync(
    fakeBuilder,
    `'use strict';\n` +
      `const fs = require('node:fs');\n` +
      `const path = require('node:path');\n` +
      `const outputDir = process.argv[3];\n` +
      `const outputPath = path.join(outputDir, 'Scratch Check.pptx');\n` +
      `fs.mkdirSync(outputDir, { recursive: true });\n` +
      `fs.writeFileSync(outputPath, 'scratch');\n` +
      `console.log('Wrote: ' + outputPath);\n` +
      `console.log('No warnings.');\n`
  );
  const lessonPath = path.join(root, 'lesson.json.tmp.test-attempt');
  fs.writeFileSync(lessonPath, JSON.stringify(spec, null, 2));
  const result = runSlideDesignCheck(lessonPath, {
    buildPath: fakeBuilder,
    retainPreview: true,
  });
  assert.equal(result.ok, true);
  return { result, lessonPath };
}

function measure(root, previewDeck, namedLesson) {
  const page = path.join(root, 'page-01.png');
  const drawn = spawnSync(PYTHON, [
    '-c',
    'import sys; from PIL import Image; Image.new("RGB", (1467, 825), (255, 255, 255)).save(sys.argv[1])',
    page,
  ]);
  if (drawn.error || drawn.status !== 0) return null;
  const manifest = path.join(root, 'render-manifest.json');
  fs.writeFileSync(
    manifest,
    JSON.stringify({
      version: 1,
      source: previewDeck,
      pages: [{ number: 1, path: page, sha256: 'x' }],
    })
  );
  const output = path.join(root, `room-${path.basename(namedLesson)}.json`);
  const run = spawnSync(
    PYTHON,
    [MEASURE, '--render-manifest', manifest, '--lesson', namedLesson, '--output', output],
    { encoding: 'utf8' }
  );
  assert.equal(run.status, 0, run.stderr);
  return {
    stdout: run.stdout,
    stamp: JSON.parse(fs.readFileSync(output, 'utf8')).compositionSha256,
  };
}

test('a preview keeps the lesson file its deck was built from', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'preview-lesson-test-'));
  let previewDir = null;
  try {
    const { result, lessonPath } = previewOf(root, lesson('Check this slide'));
    previewDir = result.previewDir;
    const kept = path.join(previewDir, 'lesson-source.json');
    assert.ok(fs.existsSync(kept), 'the lesson file is kept beside the preview deck');
    assert.equal(fs.readFileSync(kept, 'utf8'), fs.readFileSync(lessonPath, 'utf8'));
  } finally {
    if (previewDir) fs.rmSync(previewDir, { recursive: true, force: true });
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('pages from a preview are stamped with the lesson that preview was built from', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'preview-lesson-test-'));
  let previewDir = null;
  try {
    const { result, lessonPath } = previewOf(root, lesson('Check this slide'));
    previewDir = result.previewDir;

    const honest = measure(root, result.previewOutputPath, lessonPath);
    if (!honest) {
      t.skip('no Python with Pillow on this machine');
      return;
    }
    assert.ok(honest.stamp, 'the measurement is stamped');
    assert.ok(!honest.stdout.includes('SLIDE_ROOM_PAGES_ARE_OLDER'));

    // The deck has since moved on; the same pages are measured again and the
    // newer lesson is named beside them.
    const moved = path.join(root, 'lesson.json');
    fs.writeFileSync(moved, JSON.stringify(lesson('A different slide'), null, 2));
    const claimed = measure(root, result.previewOutputPath, moved);
    assert.equal(claimed.stamp, honest.stamp, 'still stamped with what was drawn');
    assert.ok(claimed.stdout.includes('SLIDE_ROOM_PAGES_ARE_OLDER'));
  } finally {
    if (previewDir) fs.rmSync(previewDir, { recursive: true, force: true });
    fs.rmSync(root, { recursive: true, force: true });
  }
});
