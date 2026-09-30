'use strict';

// Three decisions from the teacher on 29 September 2026, all from one slide: a
// labelling slide whose six-row "what it looks like" criteria table was refused.
//
// - Table columns take the width their words need. Equal columns gave the
//   one-word "Part" column as much room as the descriptions, which then wrapped
//   and would not fit.
// - A table cell can be a picture, so one column can hold words in some rows and
//   a picture in others.
// - The half-slide criteria limit protects work children do on the board. A
//   slide whose task is done on paper, marked `workOnPaper`, may give the
//   criteria the room they need.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { columnWidths } = require('../src/content/table');
const { runSlideDesignCheck } = require('../scripts/check-slide-design');

const PART_ROWS = [
  ['mouth', 'where the food goes in'],
  ['oesophagus', 'a long, thin tube from the mouth down to the stomach'],
  ['small intestine', 'a thin tube, coiled up in the middle'],
  ['large intestine', 'a wider tube that goes round the outside of the small intestine'],
];

test('a column of short names is narrower than the column of descriptions', () => {
  const [names, descriptions] = columnWidths(['Part', 'What it looks like'], PART_ROWS, 8, 0.6);
  assert.ok(names < descriptions / 2, `names ${names.toFixed(2)}in, descriptions ${descriptions.toFixed(2)}in`);
  assert.ok(Math.abs(names + descriptions - 8) < 1e-9, 'the columns fill the table');
});

test('columns can still be set by hand or kept equal', () => {
  assert.deepEqual(columnWidths(['A', 'B'], PART_ROWS, 8, 0.6, 'equal'), [4, 4]);
  assert.deepEqual(columnWidths(['A', 'B'], PART_ROWS, 8, 0.6, [1, 3]), [2, 6]);
});

test('a picture cell asks for room of its own', () => {
  const rows = [['stomach', { type: 'image', imagePath: 'x.png' }], ['mouth', 'in']];
  const [, pictures] = columnWidths(['Part', 'Looks like'], rows, 8, 0.8);
  assert.ok(pictures >= 0.8 * 1.3 - 1e-9, `picture column ${pictures.toFixed(2)}in`);
});

function criteriaSlide(workOnPaper) {
  const slide = {
    template: 'split-h-75-25',
    title: 'Label the whole journey',
    primarySide: 'right',
    secondary: { type: 'text', value: 'Write the name of each part on its line.' },
    primary: {
      type: 'stack',
      heightRatio: 1.0,
      items: [{ type: 'sc-panel', content: { type: 'table', headers: ['Part', 'What it looks like'], rows: PART_ROWS } }],
    },
  };
  if (workOnPaper) slide.workOnPaper = true;
  return { lessonName: 'Paper Work', subject: 'Science', lo: 'Name the parts', slides: [slide] };
}

function check(lesson) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'paper-work-'));
  try {
    const lessonPath = path.join(root, 'lesson.json');
    fs.writeFileSync(lessonPath, JSON.stringify(lesson, null, 2));
    const result = runSlideDesignCheck(lessonPath);
    return { result, output: `${result.stdout || ''}${result.stderr || ''}` };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('a criteria panel over half the slide is still refused beside work on the board', () => {
  const { result, output } = check(criteriaSlide(false));
  assert.equal(result.ok, false);
  assert.match(output, /SC_PANEL_TOO_LARGE/);
});

test('the same panel is allowed when the work is on paper', () => {
  const { output } = check(criteriaSlide(true));
  assert.doesNotMatch(output, /SC_PANEL_TOO_LARGE/);
});
