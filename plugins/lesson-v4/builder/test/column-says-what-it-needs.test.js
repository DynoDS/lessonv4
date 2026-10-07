'use strict';

// A column that holds a drawn figure says what the whole of it needs.
//
// Year 4 Maths Lesson 24 (6 October 2026) stood a counter pair over a column
// calculation and its explanation. No split of that column's height held all
// three, and the check never said so: it named the counters, then the
// calculation, then the explanation, one per check, for eight checks and a
// repair launch. The stack could already say "no weights will fit them" for a
// column of words. It said nothing once a figure was in the column, because it
// could not measure one.
//
// What this file pins:
//   - that column is told, at its first refusal, that no weights fit;
//   - a column that weights CAN mend is given weights, and those weights work;
//   - the counter pair's refusal names height when height is what holds it;
//   - a slide that fits says nothing, so finished decks read as they did.

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const { runSlideDesignCheck, parseBuildDiagnostics } = require('../scripts/check-slide-design.js');

const COUNTER_PAIR = {
  type: 'place-value-chart',
  columns: ['Hundreds', 'Tens', 'Ones'],
  pair: {
    from: ['', '', ''],
    to: ['', '', ''],
    title: '',
    operation: '10 tens = 1 hundred',
    counters: { from: { H: 3, T: 13, O: 6 }, to: { H: 4, T: 3, O: 6 } },
    exchanges: [{ from: 'T', to: 'H', count: 10, label: '10 tens = 1 hundred' }],
  },
};

const COLUMN_SUM = {
  type: 'place-value-chart',
  columns: ['Hundreds', 'Tens', 'Ones'],
  calculation: { operator: '+', numbers: ['264', '172'], answer: '436', carry: { H: '1' } },
};

const EXPLANATION =
  '264 + 172 = 436\n\n6 tens + 7 tens = 13 tens.\n\n13 tens = 1 hundred and 3 tens.\n\n' +
  '2 hundreds + 1 hundred + 1 exchanged hundred = 4 hundreds.\n\nThe counters show 4 hundreds, 3 tens and 6 ones.';

function deck(body) {
  return {
    lessonName: 'Column Needs',
    subject: 'Maths',
    lo: 'Check what a column needs',
    slides: [{ template: 'body-full', title: 'The model', body }],
  };
}

// The Lesson 24 slide, with the two weights it was given on each attempt.
function pairOverSumAndWords(pairWeight, rowWeight) {
  return deck({
    type: 'stack',
    items: [
      { ...COUNTER_PAIR, weight: pairWeight },
      {
        type: 'row',
        weight: rowWeight,
        items: [{ ...COLUMN_SUM, weight: 1 }, { type: 'text', value: EXPLANATION, weight: 1 }],
      },
    ],
  });
}

function labelOverSum(labelWeight, sumWeight) {
  return deck({
    type: 'stack',
    items: [
      { type: 'text', value: 'Use column addition to find 264 + 172.', weight: labelWeight },
      { ...COLUMN_SUM, weight: sumWeight },
    ],
  });
}

function check(lesson) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'column-needs-'));
  const file = path.join(dir, 'lesson.json');
  fs.writeFileSync(file, JSON.stringify(lesson));
  try {
    const result = runSlideDesignCheck(file, { helperVerdictPath: false });
    const said = parseBuildDiagnostics(result.stdout);
    return {
      result,
      said,
      column: said.filter((item) => item.signal === 'COLUMN_NEEDS'),
      refusals: said.filter((item) => item.faultClass !== 'note' && item.signal !== 'COLUMN_NEEDS'),
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('a column no weights can hold is told so at its first refusal', () => {
  const { result, column, refusals } = check(pairOverSumAndWords(3, 3));
  assert.equal(result.ok, false);
  assert.ok(refusals.length, 'the slide is still refused, as it was');
  assert.equal(column.length, 1, 'one line for the slide');
  assert.equal(column[0].location.slide, 1);
  assert.match(column[0].message, /No weights fit this column/);
  assert.match(column[0].message, /move one item to the other side or split the beat/);
  assert.match(column[0].message, /item 1, place-value-chart, needs \d+\.\d\din and has \d+\.\d\din/);
  assert.match(column[0].message, /item 2, row of place-value-chart beside text "264 \+ 172 = 436/);
});

test('whichever way the height is split, the same thing is said', () => {
  // The three splits the run tried. Each used to name a different item.
  for (const [pair, row] of [[3, 3], [5, 2], [4.5, 2.4]]) {
    const { column } = check(pairOverSumAndWords(pair, row));
    assert.equal(column.length, 1, `weights ${pair} and ${row}`);
    assert.match(column[0].message, /No weights fit this column/, `weights ${pair} and ${row}`);
  }
});

test('a column that weights can mend is given the weights, and they work', () => {
  const short = check(labelOverSum(0.2, 6));
  assert.equal(short.result.ok, false, 'the label is refused in the strip its weight gave it');
  assert.equal(short.column.length, 1);
  const found = /Weights that fit, in the same order: ([\d.]+), ([\d.]+) \(they are 0\.2, 6 now\)/.exec(
    short.column[0].message
  );
  assert.ok(found, `the line names weights: ${short.column[0].message}`);

  const mended = check(labelOverSum(Number(found[1]), Number(found[2])));
  assert.equal(mended.result.ok, true, mended.result.stderr);
  assert.equal(mended.column.length, 0, 'a column that fits says nothing');
});

test('the account only reports: the refusal beside it is the one there always was', () => {
  const { result, refusals } = check(labelOverSum(0.2, 6));
  assert.equal(result.reason, 'SCRATCH_BUILD_FAILED');
  assert.deepEqual(refusals.map((item) => item.signal), ['TEXT_OVERLOAD']);
});

// Asked of the drawing itself. On a slide a pair is never drawn under 18pt
// digits (6 October 2026), so a zone much too small for it is refused for its
// size first; the counters refusal is met in a zone that holds the pair and
// still leaves 13 counters in a column too small to count.
const { describeLayout } = require('../../shared/visuals/place-value-chart-svg');
const { profileFor } = require('../../shared/visuals/surface-profiles');

function pairRefusal(widthIn, heightIn) {
  try {
    describeLayout(COUNTER_PAIR, profileFor('slides', { widthPt: widthIn * 72, heightPt: heightIn * 72 }));
  } catch (error) {
    return error.message;
  }
  return '';
}

test('a counter pair held down by height is told height, not width', () => {
  const message = pairRefusal(12.25, 3.2);
  assert.match(message, /^PLACE_VALUE_COUNTERS_TOO_SMALL/);
  assert.match(message, /Height is the lever here, not width/);
  assert.doesNotMatch(message, /more WIDTH/);
});

test('a counter pair held down by width is still told width', () => {
  const message = pairRefusal(6.8, 3.1);
  assert.match(message, /^PLACE_VALUE_COUNTERS_TOO_SMALL/);
  assert.match(message, /more WIDTH/);
  assert.match(message, /A taller zone will not move it/);
});
