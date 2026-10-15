'use strict';

// Two criteria panels one above the other are drawn as one green box with one
// heading (src/content/sc-panel.js). From a Year 4 science lesson of
// 11 October 2026: three steps and a four-row table of label meanings, each in
// its own panel down one side of a task slide. The teacher chose one shared
// box over two, and never the two squashed side by side.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const JSZip = require('jszip');

const { joinStackedCriteriaPanels } = require('../src/content/sc-panel');

const ROOT = path.resolve(__dirname, '..');

const STEPS = { type: 'steps', steps: [
  'Start with the {{producer}}.',
  'Find <<the animal that eats each food>> and put it next.',
  'Draw each arrow from <<the food to the animal that eats it>>.'
] };
const TABLE = { type: 'table', columns: ['Label', 'What it does'], rows: [
  ['producer', 'makes its own food'],
  ['consumer', 'eats plants or animals'],
  ['predator', 'hunts and eats an animal'],
  ['prey', 'is hunted and eaten by an animal']
] };
const TASK = { type: 'stack', items: [
  { type: 'text', value: 'Use all four living things and the food information on the board to draw your food chain.\n\nNames or simple pictures are fine.', signal: 'pencil' },
  { type: 'text', value: 'Label the producer, consumers, predators and prey.\n\nRead each arrow as ‘is eaten by’.', signal: 'pencil' },
  { type: 'text', value: 'Choose one arrow and explain what it tells us.', signal: 'pencil', colorRole: 'task-blue' }
] };

function panel(content, extra) {
  return Object.assign({ type: 'sc-panel', content }, extra);
}

function lesson(secondary) {
  return { slides: [{ template: 'split-h-50-50', title: 'Create your food chain',
    speakerNotes: 'Say to children: draw your chain.', primary: TASK, secondary }] };
}

test('two panels one above the other become one panel holding both sets, each with its share', () => {
  const out = joinStackedCriteriaPanels(lesson({ type: 'stack', items: [
    panel(STEPS, { criteriaRef: 'sc-001', weight: 1 }), panel(TABLE, { criteriaRef: 'sc-002', weight: 1.4 })
  ] }));
  const joined = out.slides[0].secondary;
  assert.equal(joined.type, 'sc-panel');
  assert.equal(joined.content.type, 'stack');
  assert.deepEqual(joined.content.items.map((s) => [s.type, s.weight]), [['steps', 1], ['table', 1.4]]);
});

test('panels beside other content join only where they touch, and the stack keeps its other items', () => {
  const out = joinStackedCriteriaPanels(lesson({ type: 'stack', items: [
    { type: 'text', value: 'A chain.' }, panel(STEPS), panel(TABLE), panel(STEPS)
  ] }));
  const items = out.slides[0].secondary.items;
  assert.deepEqual(items.map((i) => i.type), ['text', 'sc-panel']);
  assert.equal(items[1].content.items.length, 3);
  assert.equal(items[1].weight, 3);
});

test('panels side by side, a flipchart panel and a panel with its own heading are left as written', () => {
  const row = { type: 'row', items: [panel(STEPS), panel(TABLE)] };
  assert.deepEqual(joinStackedCriteriaPanels(lesson(row)).slides[0].secondary, row);
  for (const extra of [{ flipchart: true, criteriaRef: 'sc-001' }, { label: 'Check your chain' }]) {
    const stack = { type: 'stack', items: [panel(STEPS, extra), panel(TABLE)] };
    assert.deepEqual(joinStackedCriteriaPanels(lesson(stack)).slides[0].secondary, stack);
  }
  const one = { type: 'stack', items: [panel(STEPS)] };
  assert.deepEqual(joinStackedCriteriaPanels(lesson(one)).slides[0].secondary, one);
});

async function slideXml(dir) {
  const deck = path.join(dir, fs.readdirSync(dir).find((n) => n.endsWith('.pptx')));
  const zip = await JSZip.loadAsync(fs.readFileSync(deck));
  return zip.file('ppt/slides/slide1.xml').async('string');
}

// White rounded cards on the right half of the slide: the step cards.
function whiteCardsOnTheRight(xml) {
  return xml.split('<p:sp>').slice(1).filter((block) => {
    const x = Number((block.match(/<a:off x="(\d+)"/) || [])[1]) / 914400;
    return x > 6.7 && /prst="roundRect"/.test(block) && /<a:solidFill><a:srgbClr val="FFFFFF"/.test(block);
  }).length;
}

test('the food chain slide as the designer wrote it builds, with one heading, every row and the step cards', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-panel-join-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const specPath = path.join(dir, 'lesson.json');
  const spec = Object.assign({ lessonName: 'Food chains', yearGroup: 'Year 4', subject: 'Science', lo: 'To create food chains' },
    lesson({ type: 'stack', items: [panel(STEPS, { criteriaRef: 'sc-001', weight: 1 }), panel(TABLE, { criteriaRef: 'sc-002', weight: 1.4 })] }));
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const result = spawnSync(process.execPath, [path.join(ROOT, 'build.js'), specPath, dir], { encoding: 'utf8' });
  assert.equal(result.status, 0, (result.stdout || '') + (result.stderr || ''));
  const xml = await slideXml(dir);
  assert.equal((xml.match(/Success Criteria/g) || []).length, 1, 'one heading');
  for (const word of ['makes its own food', 'is hunted and eaten by an animal', 'What it does']) assert.ok(xml.includes(word), word);
  assert.ok(whiteCardsOnTheRight(xml) >= 3, 'each step keeps its white card');
});
