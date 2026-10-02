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

test('a badge the slide names is kept, and a deck with no design beside it carries none', () => {
  const kept = { slides: [{ title: 'Sort', designUnitId: 'u2', doSign: 'quick' }] };
  applyDoSigns(kept, folderWith(DESIGN));
  assert.strictEqual(kept.slides[0].doSign, 'quick');
  const bare = { slides: [{ title: 'Sort', designUnitId: 'u2' }] };
  applyDoSigns(bare, fs.mkdtempSync(path.join(os.tmpdir(), 'do-signs-none-')));
  assert.strictEqual(bare.slides[0].doSign, undefined);
});

test('both badge drawings are in the deck\'s signs', () => {
  assert.ok(signalWidth('lightning', 0.5) > 0);
  assert.ok(signalWidth('sheet', 0.5) > 0);
});
