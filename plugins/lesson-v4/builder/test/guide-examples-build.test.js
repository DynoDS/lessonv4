'use strict';

// Every example in the designer's catalogue builds.
//
// templates.md is the only place the slide designer learns what a picture is
// and what its fields look like, and it copies the examples. Nothing ever built
// them. When the readable floor rose to 18pt (4.2.128, 10 September 2026),
// fishbone, continuum-line and concept-map were left with boxes sized for small
// type, and the timeline and row examples carried labels no slide could hold.
// None of them could be drawn on any slide, and it went unnoticed until a
// vocabulary-card review built every example by hand (13 September 2026).
//
// So the examples are the fixture: one full-body slide per content type, built
// by the real build script, fit pass and all. An example that needs a photo
// file is skipped, because what that checks is the photo, not the picture.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { ZONE_COMPAT } = require('../src/content/index');

const ROOT = path.join(__dirname, '..');
const TEMPLATES_MD = fs.readFileSync(path.join(ROOT, '..', 'references', 'templates.md'), 'utf8');

function examples() {
  const found = {};
  const heading = /^###\s+`([a-z0-9-]+)`\s*$/gm;
  const marks = [];
  let m;
  while ((m = heading.exec(TEMPLATES_MD))) marks.push({ type: m[1], at: m.index });
  marks.forEach((mark, i) => {
    const section = TEMPLATES_MD.slice(mark.at, i + 1 < marks.length ? marks[i + 1].at : undefined);
    const blocks = section.match(/```json\s*\n([\s\S]*?)```/g) || [];
    for (const block of blocks) {
      try {
        const spec = JSON.parse(block.replace(/```json\s*\n/, '').replace(/```$/, ''));
        if (spec && spec.type === mark.type) { found[mark.type] = spec; break; }
      } catch { /* prose-annotated example: not buildable as written */ }
    }
  });
  return found;
}

test('every picture example in templates.md builds on a slide', { timeout: 600000 }, () => {
  const all = examples();
  const types = Object.keys(all).filter((t) => ZONE_COMPAT[t] && !JSON.stringify(all[t]).includes('imagePath'));
  assert.ok(types.length > 40, `only ${types.length} buildable examples were found in templates.md`);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guide-examples-'));
  const lesson = {
    lessonName: 'Guide examples', yearGroup: 'Year 4', subject: 'Maths', lo: 'Guide examples',
    // A criteria panel may fill a slide only on the criteria slide itself.
    slides: types.map((t) => (t === 'sc-panel'
      ? { template: 'success-criteria', headerStyle: 'title', title: t, criteria: all[t] }
      : { template: 'body-full', headerStyle: 'title', title: t, body: all[t] }))
  };
  const lessonPath = path.join(dir, 'lesson.json');
  fs.writeFileSync(lessonPath, JSON.stringify(lesson));
  const run = spawnSync(process.execPath, [path.join(ROOT, 'build.js'), lessonPath, dir, '--skip-optional-decorations'],
    { encoding: 'utf8' });
  const out = `${run.stdout || ''}${run.stderr || ''}`;
  const faults = out.split('\n').filter((line) => /✗|BUILD_DIAGNOSTIC/.test(line));
  const named = faults.map((line) => {
    const slide = /slide"?:?\s*(\d+)/.exec(line);
    return slide ? `${types[Number(slide[1]) - 1]}: ${line.trim().slice(0, 200)}` : line.trim().slice(0, 200);
  });
  assert.equal(run.status, 0, `these catalogue examples cannot be built:\n${named.join('\n')}`);
});
