'use strict';

// The smaller part of a top-and-bottom slide is the full width of the board.
//
// It carries the same zone class as the smaller side of a left-and-right slide
// ("E-narrow"), because the class was named for the share of the split and not
// for the width. So everything that wants width (a table, a timeline, a
// matching task) was refused there "for a narrow zone" with 12.9in to draw in.
// Four stress-test lessons of twenty reported a table refused in a narrow side
// (7 October 2026); this is the part of that with one right answer.
//
// What stays: a side panel that really is narrow still refuses a table. The
// teacher, shown the Year 4 fronted adverbials slide with its table forced
// into the side panel and with its three headings stacked as cards, chose the
// cards (8 October 2026).

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const CHECK = path.join(__dirname, '..', 'scripts', 'check-slide-design.js');

const NUMERALS = {
  type: 'table',
  headers: ['Numeral', 'Value'],
  rows: [['I', '1'], ['V', '5'], ['X', '10']],
};

function runCheck(slide) {
  const lesson = { lessonName: 'Strip Table', subject: 'Maths', lo: 'Check a table in a strip', slides: [slide] };
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'strip-table-'));
  const lessonPath = path.join(root, 'lesson.json.tmp.strip-table');
  fs.writeFileSync(lessonPath, JSON.stringify(lesson));
  const result = spawnSync(process.execPath, [CHECK, lessonPath], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  fs.rmSync(root, { recursive: true, force: true });
  return `${result.stdout || ''}${result.stderr || ''}`;
}

test('a table is drawn in the full-width smaller part of a top-and-bottom slide', () => {
  const output = runCheck({
    template: 'split-v-60-40',
    title: 'Reference',
    primary: { type: 'text', value: 'Write each number as a Roman numeral.' },
    secondary: NUMERALS,
  });
  if (/AUTOFIT_(DEPENDENCY_MISSING|NOT_PERMITTED)/.test(output)) return;
  assert.doesNotMatch(output, /CONTENT_ZONE_INCOMPATIBLE/, output.slice(-900));
  assert.match(output, /SLIDE_DESIGN_CHECK_OK/, output.slice(-900));
});

test('a table is still refused in a side panel that really is narrow', () => {
  const output = runCheck({
    template: 'split-h-70-30',
    title: 'Reference',
    primary: { type: 'text', value: 'Write each number as a Roman numeral.' },
    secondary: NUMERALS,
  });
  if (/AUTOFIT_(DEPENDENCY_MISSING|NOT_PERMITTED)/.test(output)) return;
  assert.match(output, /CONTENT_ZONE_INCOMPATIBLE/, output.slice(-900));
  assert.match(output, /"table" in zone class E-narrow/, output.slice(-900));
});
