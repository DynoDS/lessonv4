'use strict';

// A slide that does not fit is tried in the arrangements next to its own, and
// the ones that hold it are named under it.
//
// A Year 4 lesson's two criteria lists ("How to subtract", "How to exchange")
// were stacked beside a column sum and could not be held at 18pt. The designer
// spent most of an hour trying about a hundred arrangements by hand before
// finding one list either side of the sum, which the teacher passed
// (17 October 2026). The engine knew the sizes all along, so the measure now
// tries the nearby arrangements itself and names what holds. It only names
// them: the designer still chooses (12 October 2026).

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { nearbyArrangements } = require('../scripts/measure-slides');

const TOOL = path.join(__dirname, '..', 'scripts', 'measure-slides.js');

const SUBTRACT = {
  type: 'sc-panel', flipchart: true,
  content: { type: 'steps', heading: 'How to subtract', steps: [
    'Line up the digits.',
    'Write the symbol.',
    'Start with the ((ones)). Then ((tens)), then ((hundreds)), then ((thousands)).',
    'In each column, take the bottom digit away from the top digit.\nCrossed out? Use the <<new digit>> above it.\nTop digit smaller? {{Exchange}}.',
  ] },
};
const EXCHANGE = {
  type: 'sc-panel', flipchart: true,
  content: { type: 'steps', heading: 'How to exchange', steps: [
    "Find the nearest column to the left that <<isn't 0>>.",
    'Take 1 from that column. Cross out its digit and write 1 less above it.',
    "Make 10 more in the next column to the right: write a 1 in front of its digit.\nNot the column you're working on yet? Do steps 2 and 3 again.",
  ] },
};
const SUM = {
  type: 'stack',
  items: [
    { type: 'text', value: 'Use column subtraction.\n5,302 - 147 =', align: 'center', weight: 0.7 },
    { type: 'place-value-chart', columns: ['Th', 'H', 'T', 'O'],
      calculation: { operator: '-', numbers: ['5302', '147'] }, weight: 3 },
  ],
};
const STACKED = {
  template: 'split-h-50-50',
  primarySide: 'left',
  title: 'My Turn',
  primary: SUM,
  secondary: { type: 'stack', items: [SUBTRACT, EXCHANGE] },
};

function measure(lesson) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'measure-arrangements-test-'));
  try {
    const file = path.join(dir, 'part.json');
    fs.writeFileSync(file, JSON.stringify(lesson));
    const done = spawnSync(process.execPath, [TOOL, file], { encoding: 'utf8' });
    return { status: done.status, out: `${done.stdout || ''}\n${done.stderr || ''}`, left: fs.readdirSync(dir).sort() };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('two criteria lists stacked beside a sum: the refusal and the measure both name one either side', () => {
  const result = measure({ lessonName: 'Column subtraction across zeros', subject: 'Maths', yearGroup: 'Year 4', lo: 'Column subtraction across zeros', slides: [STACKED] });
  assert.equal(result.status, 0, result.out);
  assert.match(result.out, /MEASURE slide 1 "My Turn": DOES NOT FIT/);
  assert.match(result.out, /two headed lists that do not fit stacked, put one either side of the work: `thirds-h`/);
  assert.match(result.out, /FITS AS \(measured, not chosen for you\): \d+ of the \d+ nearby arrangements/);
  assert.match(result.out, /- `thirds-h`, one criteria list either side of the work/);
  // Trying the arrangements leaves nothing behind but the one kept preview.
  assert.deepEqual(result.left, ['measure-preview', 'part.json']);
});

test('the either-side arrangement takes the two lists out to the thirds and keeps the work in the middle', () => {
  const options = nearbyArrangements(STACKED);
  const third = options.find((o) => o.slide.template === 'thirds-h');
  assert.ok(third, options.map((o) => o.description).join('\n'));
  assert.equal(third.slide.left.content.heading, 'How to subtract');
  assert.equal(third.slide.middle, SUM);
  assert.equal(third.slide.right.content.heading, 'How to exchange');
  assert.equal('primary' in third.slide, false);
  assert.equal('secondary' in third.slide, false);
  // The slide's own words travel unchanged.
  assert.equal(third.slide.title, 'My Turn');
});

test('other widths keep each side where it was; a swap gives the other side the larger share', () => {
  const options = nearbyArrangements(Object.assign({}, STACKED, { template: 'split-h-60-40' }));
  assert.equal(options.some((o) => o.slide.template === 'split-h-60-40' && o.slide.primary === SUM), false,
    'the slide as written is not offered back');
  const swapped = options.find((o) => o.slide.template === 'split-h-70-30' && o.slide.primarySide === 'right');
  assert.ok(swapped);
  assert.equal(swapped.slide.primary, STACKED.secondary);
  assert.equal(swapped.slide.secondary, SUM);
});

test('a slide that is not a split, or a split without two sides, is not re-arranged', () => {
  assert.deepEqual(nearbyArrangements({ template: 'body-full', body: SUM }), []);
  assert.deepEqual(nearbyArrangements({ template: 'thirds-h', left: SUBTRACT, middle: SUM, right: EXCHANGE }), []);
  assert.deepEqual(nearbyArrangements({ template: 'split-h-50-50', primary: SUM }), []);
  // One list beside the work has no second list to take to the other side.
  const one = nearbyArrangements(Object.assign({}, STACKED, { secondary: EXCHANGE }));
  assert.equal(one.some((o) => o.slide.template === 'thirds-h'), false);
});
