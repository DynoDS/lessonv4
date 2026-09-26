"""Release 7A (4.2.293), step 8's tests, and the one export they need.

`presentationWarnings` (the slide check's stage-title rule) is exported so a
test can read it directly: a bare `Practise` is flagged in every subject
(decision 21), a bare `Apply` only outside maths (settled item 1), a title that
names the move after the word passes, and the message carries the maths note.
The slide check sends an untitled `grid-calc` back (`GRID_WITHOUT_TITLE`, naming
the fix), the final build draws it with no title line and never `Independent
Tasks`, and writes the deck, with `--deliver-flagged` and without (the first
check's repair 5)."""
from _patch import CHECK, replace_once, write, ROOT

replace_once(CHECK, '''module.exports = {
  BLOCKING_CAPACITY_SIGNALS,''', '''module.exports = {
  BLOCKING_CAPACITY_SIGNALS,
  presentationWarnings,''')

replace_once("builder/test/slide-design-check.test.js", '''test('a whole-blue block that tells and then asks blocks, and the scratch build still runs', () => {''', '''test('a bare Practise is a slot name in every subject, and a bare Apply only outside maths', () => {
  // The teacher's "yes" of 24 September 2026 (release 7A): `Practise` names
  // the slot, not the move, so a slide titled only that is flagged wherever it
  // is; in maths `Apply` is one of the plain words he wants, so it passes there.
  const { presentationWarnings } = require('../scripts/check-slide-design');
  const flagged = (subject) =>
    presentationWarnings({
      subject,
      slides: [
        { title: 'Practise' },
        { title: 'Apply' },
        { title: 'Your Turn' },
        { title: 'Practise rounding to the nearest 100' },
        { title: 'practise' },
      ],
    }).map((warning) => `${warning.slide}:${warning.signal}`);
  assert.deepEqual(flagged('Maths'), ['1:INTERNAL_STAGE_TITLE', '5:INTERNAL_STAGE_TITLE']);
  assert.deepEqual(flagged('History'), ['1:INTERNAL_STAGE_TITLE', '2:INTERNAL_STAGE_TITLE', '5:INTERNAL_STAGE_TITLE']);
  const [warning] = presentationWarnings({ subject: 'Maths', slides: [{ title: 'Practise' }] });
  assert.match(
    warning.message,
    /In maths the plain words My Turn, Our Turn, Your Turn, Answers and Apply are the titles; Practise is not one of them/
  );
});

test('a whole-blue block that tells and then asks blocks, and the scratch build still runs', () => {''')

write("builder/test/grid-calc-title.test.js", """'use strict';

// An untitled arithmetic grid printed "Independent Tasks", a structural label
// the teacher keeps off the board (`preferences.md` -> Slide Headings; release
// 7A, his "yes" to settled item 1). The default is gone. The slide check sends
// an untitled grid back to be titled, naming the fix; the final build draws it
// with no title line, because a cosmetic title must never cost the deck.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { validateLesson } = require('../src/validate');
const { drawGridCalc } = require('../src/templates/grid-calc');
const { presentationWarnings } = require('../scripts/check-slide-design');

const BUILD = path.join(__dirname, '..', 'build.js');

function deck(slide) {
  return {
    lessonName: 'Untitled Grid',
    subject: 'Maths',
    slides: [Object.assign({
      template: 'grid-calc',
      calculations: ['23 + 45 =', '31 + 27 ='],
    }, slide)],
  };
}

function drawn(data) {
  const texts = [];
  const slide = {
    addText: (content) => texts.push(typeof content === 'string' ? content : JSON.stringify(content)),
    addShape: () => {},
    addImage: () => {},
  };
  drawGridCalc(new PptxGenJS(), slide, data, { slideIndex: 0, cardLook: true });
  return texts;
}

test('the slide check sends an untitled grid back, naming the fix', () => {
  for (const slide of [{}, { title: '' }, { title: '   ' }]) {
    const warnings = presentationWarnings(deck(slide));
    assert.deepEqual(warnings.map((w) => `${w.slide}:${w.signal}`), ['1:GRID_WITHOUT_TITLE'], JSON.stringify(slide));
    assert.match(warnings[0].message, /a grid-calc slide has no "title"/);
    assert.match(warnings[0].message, /no longer prints "Independent Tasks"/);
    assert.match(warnings[0].message, /usually "Your Turn"/);
  }
  assert.deepEqual(presentationWarnings(deck({ title: 'Your Turn' })), []);
});

test('the build does not refuse an untitled grid, and draws no title for it', () => {
  assert.deepEqual(validateLesson(deck({}), '.').errors.filter((e) => /grid-calc|title/i.test(e)), []);
  const untitled = drawn({ calculations: ['23 + 45 ='] });
  assert.ok(untitled.every((t) => !t.includes('Independent Tasks')), untitled.join(' | '));
  const titled = drawn({ title: 'Your Turn', calculations: ['23 + 45 ='] });
  assert.ok(titled.some((t) => t.includes('Your Turn')), 'the title is drawn');
  assert.ok(titled.every((t) => !t.includes('Independent Tasks')), 'no default title is drawn');
});

test('the final build writes the deck for an untitled grid, flagged delivery or not', () => {
  for (const extra of [['--deliver-flagged'], []]) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'untitled-grid-'));
    try {
      const lessonPath = path.join(root, 'lesson.json');
      const outDir = path.join(root, 'out');
      fs.writeFileSync(lessonPath, JSON.stringify(deck({}), null, 2));
      const result = spawnSync(process.execPath, [BUILD, lessonPath, outDir, ...extra], {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
      });
      const output = `${result.stdout || ''}${result.stderr || ''}`;
      assert.equal(result.status, 0, output);
      assert.ok(fs.existsSync(path.join(outDir, 'Untitled Grid.pptx')), output);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});
""")
print("title tests written")
