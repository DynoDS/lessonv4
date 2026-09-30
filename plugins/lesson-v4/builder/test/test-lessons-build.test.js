'use strict';

// Every practice deck in test-lessons/ still builds.
//
// These decks are the only place about twenty slide layouts are drawn at all,
// and nothing built them: by 29 September 2026 four of the folder decks and
// eight of the loose sample files no longer built and no check noticed. Each
// folder holding a lesson.json, and each loose .json sample beside them, is
// built exactly as a run builds a deck, into a temporary folder, and must
// write its PowerPoint.
//
// One deck is refused on purpose. practice-panel-widens.test.js uses
// eq-fractions as its example of a criteria stack too small for a fraction
// wall or a long step, so that deck must be refused for exactly those two
// reasons and no other. helper-sizes/ holds a script someone runs to look at
// helpers by eye, not a lesson, so it has no lesson.json and is not built here.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');

const BUILDER = path.join(__dirname, '..');
const LESSONS = path.join(BUILDER, 'test-lessons');
const REFUSED_ON_PURPOSE = {
  'eq-fractions': ['FRACTION_WALL_ZONE_TOO_SHALLOW', 'STEP_TEXT_OVERLOAD'],
};

// A deck is named by its folder (holding lesson.json) or its loose file's name.
const decks = fs.readdirSync(LESSONS, { withFileTypes: true })
  .flatMap((entry) => {
    if (entry.isDirectory() && fs.existsSync(path.join(LESSONS, entry.name, 'lesson.json'))) {
      return [{ name: entry.name, spec: path.join(LESSONS, entry.name, 'lesson.json') }];
    }
    if (entry.isFile() && entry.name.endsWith('.json')) {
      return [{ name: entry.name, spec: path.join(LESSONS, entry.name) }];
    }
    return [];
  });

function build(deck) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'test-lesson-'));
  return new Promise((resolve) => {
    execFile(process.execPath, [path.join(BUILDER, 'build.js'), deck.spec, out],
      { cwd: BUILDER, maxBuffer: 16 * 1024 * 1024 },
      (error, stdout, stderr) => {
        const written = fs.readdirSync(out).filter((name) => name.endsWith('.pptx'));
        fs.rmSync(out, { recursive: true, force: true });
        resolve({ code: error ? error.code : 0, output: `${stdout}\n${stderr}`, written });
      });
  });
}

test('the practice decks are found', () => {
  assert.ok(decks.length >= 30, `only ${decks.length} practice decks found in test-lessons/`);
  const names = decks.map((deck) => deck.name);
  for (const deck of Object.keys(REFUSED_ON_PURPOSE)) assert.ok(names.includes(deck), `${deck} is missing`);
});

test('every practice deck builds', { concurrency: true }, async (t) => {
  await Promise.all(decks.map((deck) => t.test(deck.name, async () => {
    const { code, output, written } = await build(deck);
    const expected = REFUSED_ON_PURPOSE[deck.name];
    if (!expected) {
      assert.equal(code, 0, `${deck.name} did not build:\n${output.slice(-1500)}`);
      assert.equal(written.length, 1, `${deck.name} built but wrote no PowerPoint`);
      return;
    }
    assert.notEqual(code, 0, `${deck.name} built, but practice-panel-widens.test.js needs it refused`);
    const faults = [...output.matchAll(/✗ slide \d+: ([A-Z_]+)/g)].map((match) => match[1]);
    assert.ok(faults.length > 0, `${deck.name} failed without naming a layout fault:\n${output.slice(-1500)}`);
    assert.deepEqual([...new Set(faults)].sort(), [...expected].sort(), `${deck.name} was refused for a new reason`);
  })));
});
