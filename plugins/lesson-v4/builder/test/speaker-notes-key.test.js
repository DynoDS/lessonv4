'use strict';

// A whole lesson's teaching script went missing twice, five days apart: the
// slide spec wrote every script under `notes`, the builder reads
// `speakerNotes`, and the deck built cleanly with silent slides. Nothing
// failed, so nobody looked until the teacher opened the deck to teach from it
// (Y4 maths rounding, 12 September 2026). The guidance half lives in
// slide-designer.md; this is the half that cannot be forgotten.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');

function build(t, slide) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speaker-notes-key-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const spec = {
    lessonName: 'Notes key', yearGroup: 'Year 4', subject: 'Maths',
    lo: 'Round to the nearest 100.',
    slides: [Object.assign({ template: 'body-full', headerStyle: 'title', title: 'Round 362' }, slide)],
  };
  const specPath = path.join(dir, 'lesson.json');
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const result = spawnSync(process.execPath, [path.join(ROOT, 'build.js'), specPath, dir], { encoding: 'utf8' });
  return { ...result, log: (result.stdout || '') + (result.stderr || '') };
}

const script = 'Say to children: which hundreds is 362 between?';

test('a script written under `notes` stops the build and names the key to use', (t) => {
  const result = build(t, { body: { type: 'text', text: 'Round 362 to the nearest 100.' }, notes: script });
  assert.notEqual(result.status, 0, result.log);
  assert.match(result.log, /slide 1/);
  assert.match(result.log, /`speakerNotes`/);
  // The repair is a rename, and saying so stops a rewrite of good teaching.
  assert.match(result.log, /the text itself is fine/);
});

test('the same script under `speakerNotes` builds', (t) => {
  const result = build(t, { body: { type: 'text', text: 'Round 362 to the nearest 100.' }, speakerNotes: script });
  assert.equal(result.status, 0, result.log);
  assert.match(result.stdout, /^Wrote:/m);
});

test('an empty stray `notes` is not worth stopping a build for', (t) => {
  // Discrimination case: no script was written, so none went missing.
  const result = build(t, { body: { type: 'text', text: 'Round 362 to the nearest 100.' }, notes: '   ' });
  assert.equal(result.status, 0, result.log);
});
