'use strict';

// A unit's picture stays in front of the class while its slides are about it.
//
// In the 20-lesson test of 7 October 2026, 14 slides in 7 decks were words only
// in a unit whose pictures had all arrived, and a Year 3 RE deck named Rama and
// Sita on two slides of words after their painting was lost. The teacher (12
// October 2026): that slide "needs pictures"; a slide that only
// says what to do is fine; small drawings do not count; and one picture over
// and over "would also get boring". The check prints notes, never refusals.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { pictureLookAgainLines } = require('../scripts/check-slide-design');

const UNIT = 'lesson-section/teaching-sequence/unit-001';

function words(title, unit = UNIT, extra = {}) {
  return { title, designUnitId: unit, primary: { type: 'text', value: 'Rama was a prince.' }, ...extra };
}

function pictured(title, file, unit = UNIT) {
  return { title, designUnitId: unit, primary: { type: 'image', imagePath: `C:/work/wikimedia/${file}` } };
}

function notes(slides, photoRefs = ['photo-001']) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'picture-look-again-'));
  fs.writeFileSync(path.join(root, 'lesson-design.json'), JSON.stringify({
    starter: null,
    teachingSequence: [{ sourceUnitId: UNIT, label: 'Rama and Sita', kind: 'teach', photoRefs }],
    ending: { included: false },
  }));
  const file = path.join(root, 'lesson.json.tmp.test');
  fs.writeFileSync(file, JSON.stringify({ slides }));
  try {
    return pictureLookAgainLines(file);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('a slide of words in a unit that has a picture is named', () => {
  const lines = notes([words('Rama and Sita'), words('Rama and Sita'), pictured('Rama and Sita', 'rama.jpg')]);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /^SLIDE_DESIGN_LOOK_AGAIN: "Rama and Sita" has 1 picture and slides 1, 2 of it show words only/);
});

test('a small drawing or a speaker face does not count as the picture', () => {
  const decorated = words('Rama and Sita', UNIT, {
    decorations: [{ kind: 'educational-svg', concept: 'crown', type: 'image', imagePath: 'C:/svg/crown.svg' }],
  });
  const face = {
    title: 'Rama and Sita',
    designUnitId: UNIT,
    primary: { type: 'image', imagePath: 'C:/plugin/builder/assets/children/girl-1.png' },
  };
  assert.match(notes([decorated, face])[0], /slides 1, 2 of it show words only/);
});

test('an answer slide, a drawn figure and a unit with no picture are left alone', () => {
  assert.deepEqual(notes([
    pictured('Rama and Sita', 'rama.jpg'),
    words('Rama and Sita - check'),
    { title: 'Rama and Sita', designUnitId: UNIT, primary: { type: 'sort-board', groups: [] } },
  ]), []);
  assert.deepEqual(notes([words('Rama and Sita')], []), []);
});

test('one picture on more than three slides in a row is asked about, and three is not', () => {
  const same = (count) => Array.from({ length: count }, () => pictured('Rama and Sita', 'rama.jpg'));
  assert.deepEqual(notes(same(3)), []);
  const lines = notes(same(4));
  assert.equal(lines.length, 1);
  assert.match(lines[0], /slides 1 to 4 all show the one picture rama\.jpg/);
  assert.deepEqual(notes([...same(2), pictured('Rama and Sita', 'ravana.jpg'), ...same(2)]), []);
});
