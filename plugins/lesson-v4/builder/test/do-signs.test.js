'use strict';

// Each Do beat's badge comes from the lesson design beside lesson.json
// (Daniel, 1 October 2026): a sheet where the beat has a printed activity, a
// lightning bolt on any task kept on the board, none on answer slides.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { applyDoSigns } = require('../src/do-signs');
const { signalWidth } = require('../src/signals');

function folderWith(design) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'do-signs-'));
  fs.writeFileSync(path.join(dir, 'lesson-design.json'), JSON.stringify(design));
  return dir;
}

const PRINTED = { printed: { form: 'source', per: 'pair', what: 'Her words.' }, boardOnlyBecause: null, realThings: null };
const BOARD = { printed: null, boardOnlyBecause: 'A one-minute check on the board.', realThings: null };

const DESIGN = {
  teachingSequence: [
    { sourceUnitId: 'u2', kind: 'do', minutes: 5, levels: PRINTED },
    { sourceUnitId: 'u6', kind: 'do', minutes: 2, levels: BOARD },
    { sourceUnitId: 'u7', kind: 'do', minutes: 5, levels: BOARD },
    { sourceUnitId: 'u8', kind: 'teach', minutes: 4 },
  ],
};

test('a printed beat shows the sheet, every board task the lightning bolt, a Teach nothing', () => {
  const lesson = { slides: [
    { title: 'In Sarah\'s own words', designUnitId: 'u2' },
    { title: 'In Sarah\'s own words - Answers', designUnitId: 'u2' },
    { title: 'Sort the children', designUnitId: 'u6' },
    { title: 'A longer board task', designUnitId: 'u7' },
    { title: 'Teach', designUnitId: 'u8' },
  ] };
  applyDoSigns(lesson, folderWith(DESIGN));
  assert.deepStrictEqual(lesson.slides.map((s) => s.doSign), ['sheet', undefined, 'quick', 'quick', undefined]);
});

// 8 October 2026: the bolt is for the task children do on their own, and the
// lesson's worksheet earns the sheet only on the task it is.
test('an Our Turn carries no badge, and the task that is the worksheet shows the sheet', () => {
  const design = {
    teachingSequence: [
      { sourceUnitId: 'u1', kind: 'our-turn', minutes: 4, levels: BOARD },
      { sourceUnitId: 'u2', kind: 'your-turn', minutes: 8, levels: BOARD },
      { sourceUnitId: 'u3', kind: 'your-turn', minutes: 10, levels: BOARD },
    ],
    ending: { included: true, beat: { sourceUnitId: 'u4', kind: 'apply', minutes: 5 } },
    worksheet: { use: 'required-task-resource', taskUnitId: 'u3' },
  };
  const slides = () => ({ slides: [
    { title: 'Our Turn', designUnitId: 'u1' },
    { title: 'Your Turn', designUnitId: 'u2' },
    { title: 'Your Turn - Plan your argument', designUnitId: 'u3' },
    { title: 'Your Turn - Plan your argument - check', designUnitId: 'u3' },
    { title: 'Apply', designUnitId: 'u4' },
  ] });
  const lesson = slides();
  applyDoSigns(lesson, folderWith(design));
  assert.deepStrictEqual(lesson.slides.map((s) => s.doSign), [undefined, 'quick', 'sheet', undefined, undefined]);

  // A worksheet of fresh practice names no task, so the Your Turn it could
  // stand in for keeps its own questions and its bolt.
  const fresh = slides();
  applyDoSigns(fresh, folderWith(Object.assign({}, design, { worksheet: { use: 'separate-fresh-worksheet', taskUnitId: null } })));
  assert.deepStrictEqual(fresh.slides.map((s) => s.doSign), [undefined, 'quick', 'quick', undefined, undefined]);

  // The final task printed as the sheet has no `levels` of its own.
  const ending = slides();
  applyDoSigns(ending, folderWith(Object.assign({}, design, { worksheet: { use: 'separate-fresh-worksheet', taskUnitId: 'u4' } })));
  assert.strictEqual(ending.slides[4].doSign, 'sheet');
});

// Eleven layouts built their own header and left the badge out of it, so a
// Your Turn on a maths layout showed no bolt while the same task on a free
// layout did (the long multiplication deck of the 7 October 2026 test).
test('every layout that draws a header hands the badge on to it', () => {
  const dir = path.join(__dirname, '..', 'src', 'templates');
  const dropped = fs.readdirSync(dir).filter((file) => {
    const source = fs.readFileSync(path.join(dir, file), 'utf8');
    const own = source.match(/drawHeader\(slide, \{[\s\S]*?\}, ctx\)/g) || [];
    return own.some((call) => !/doSign: data\.doSign/.test(call));
  });
  assert.deepStrictEqual(dropped, []);
});

test('a badge the slide names is kept, and a deck with no design beside it carries none', () => {
  const kept = { slides: [{ title: 'Sort', designUnitId: 'u2', doSign: 'quick' }] };
  applyDoSigns(kept, folderWith(DESIGN));
  assert.strictEqual(kept.slides[0].doSign, 'quick');
  const bare = { slides: [{ title: 'Sort', designUnitId: 'u2' }] };
  applyDoSigns(bare, fs.mkdtempSync(path.join(os.tmpdir(), 'do-signs-none-')));
  assert.strictEqual(bare.slides[0].doSign, undefined);
});

// 20 October 2026: the final task of a sound lesson ran over four slides (the
// dog scene, the good and weak examples, the partner talk, the writing) and the
// book sat on all four. The badge belongs on the slide where children work.
test('a task told over several slides carries its badge only where children work', () => {
  const design = {
    teachingSequence: [
      { sourceUnitId: 'u1', kind: 'do', minutes: 2, levels: BOARD },
      { sourceUnitId: 'u5', kind: 'practise', minutes: 9, levels: PRINTED },
    ],
    worksheet: { use: 'required-task-resource', taskUnitId: 'u5' },
  };
  const task = (signal) => ({ type: 'text', value: 'Do it.', signal });
  const lesson = { slides: [
    { title: 'Is Yusuf right?', designUnitId: 'u1', statement: { type: 'stack', items: [task('talk')] } },
    { title: 'How does Mateo hear the dog?', designUnitId: 'u5', secondary: { type: 'text', value: 'The scene.' } },
    { title: 'How does Mateo hear the dog?', designUnitId: 'u5', strong: { type: 'text', value: 'A good one.' } },
    { title: 'How does Mateo hear the dog?', designUnitId: 'u5', primary: { type: 'stack', items: [task('talk')] } },
    { title: 'How does Mateo hear the dog?', designUnitId: 'u5', primary: { type: 'stack', items: [task('pencil')] } },
    { title: 'How does Mateo hear the dog? - check', designUnitId: 'u5' },
  ] };
  applyDoSigns(lesson, folderWith(design));
  assert.deepStrictEqual(lesson.slides.map((s) => s.doSign), ['quick', undefined, undefined, undefined, 'sheet', undefined]);
});

test('both badge drawings are in the deck\'s signs', () => {
  assert.ok(signalWidth('lightning', 0.5) > 0);
  assert.ok(signalWidth('sheet', 0.5) > 0);
});

// The designer chooses scope; delivery and timing are independent axes.
test('explicit quick/deeper choices override printing, minutes and slide badges without a sequence quota', () => {
  const design = { teachingSequence: [
    { sourceUnitId: 'q1', kind: 'do', minutes: 4, levels: PRINTED, doMode: 'quick' },
    { sourceUnitId: 'q2', kind: 'do', minutes: 1, levels: BOARD, doMode: 'quick' },
    { sourceUnitId: 'd1', kind: 'do', minutes: 2, levels: BOARD, doMode: 'deeper' },
    { sourceUnitId: 'd2', kind: 'do', minutes: 7, levels: PRINTED, doMode: 'deeper' },
  ] };
  const lesson = { slides: design.teachingSequence.map((u) => ({
    title: u.sourceUnitId, designUnitId: u.sourceUnitId,
    doSign: u.doMode === 'quick' ? 'sheet' : 'quick'
  })) };
  applyDoSigns(lesson, folderWith(design));
  assert.deepStrictEqual(lesson.slides.map(s => s.doSign), ['quick', 'quick', 'sheet', 'sheet']);
});

test('explicit mode clears stale badges from setup and answers, and never badges Our Turn', () => {
  const design = { teachingSequence: [
    { sourceUnitId: 'd1', kind: 'do', levels: BOARD, doMode: 'deeper' },
    { sourceUnitId: 'o1', kind: 'our-turn', levels: BOARD },
  ] };
  const lesson = { slides: [
    { title: 'Meet the case', designUnitId: 'd1', doSign: 'quick' },
    { title: 'Work on the case', designUnitId: 'd1', doSign: 'quick', instruction: { signal: 'pencil' } },
    { title: 'Case - Answers', designUnitId: 'd1', doSign: 'sheet' },
    { title: 'Revealed', designUnitId: 'd1', doSign: 'sheet', content: { revealPair: { state: 'answer' } } },
    { title: 'Our Turn', designUnitId: 'o1', doSign: 'quick' },
  ] };
  applyDoSigns(lesson, folderWith(design));
  assert.deepStrictEqual(lesson.slides.map(s => s.doSign), [undefined, 'sheet', undefined, undefined, undefined]);
});

test('new multi-slide tasks require a marked working slide instead of badging setup', () => {
  const design = { teachingSequence: [{ sourceUnitId: 'd1', kind: 'do', doMode: 'deeper' }] };
  assert.throws(() => applyDoSigns({ slides: [
    { title: 'Setup', designUnitId: 'd1' }, { title: 'Task', designUnitId: 'd1' },
  ] }, folderWith(design)), /no task signal/);
});
