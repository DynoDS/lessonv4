'use strict';

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

// The untitled grid's own message asks for "Your Turn", so the whole check
// must take that title: a grid's calculations are its turn. A grid under the
// starter header never prints a title, so it is not sent back for one (the
// second check, 26 September 2026).
test('a grid titled "Your Turn" carries its turn in its sums, and a starter grid needs no title', () => {
  const script = path.join(__dirname, '..', 'scripts', 'check-slide-design.js');
  const run = (lesson) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'grid-turn-'));
    try {
      const lessonPath = path.join(root, 'lesson.json.tmp.grid');
      fs.writeFileSync(lessonPath, JSON.stringify(lesson, null, 2));
      const result = spawnSync(process.execPath, [script, lessonPath], {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
      });
      return { status: result.status, output: `${result.stdout || ''}${result.stderr || ''}` };
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  };
  for (const [name, lesson] of [
    ['a grid titled "Your Turn"', deck({ title: 'Your Turn' })],
    ['an untitled grid under the starter header', deck({ headerStyle: 'starter' })],
  ]) {
    const result = run(lesson);
    assert.equal(result.status, 0, `${name}: ${result.output}`);
    assert.match(result.output, /SLIDE_DESIGN_CHECK_OK: 1 slides/, name);
  }
  assert.deepEqual(presentationWarnings(deck({ headerStyle: 'starter' })), []);
  const empty = run(deck({ title: 'Your Turn', calculations: [] }));
  assert.equal(empty.status, 1, empty.output);
  assert.match(empty.output, /TURN_SLIDE_WITHOUT_ITS_TURN/, 'a "Your Turn" grid with no sums is still a turn with no task');
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
