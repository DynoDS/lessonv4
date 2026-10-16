'use strict';

// A method only some questions need is a list of its own (teacher-voice.md ->
// Success criteria). From Year 4 column subtraction, 16 October 2026: the
// exchange was packed under step 3 of one list at 18pt. The teacher chose two
// boxes stacked down one side, each headed by what it is for ("How to
// subtract", "How to exchange"), with matching numbers, and the empty strip
// beside the title used when the two need it.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const JSZip = require('jszip');

const { joinStackedCriteriaPanels } = require('../src/content/sc-panel');

const ROOT = path.resolve(__dirname, '..');
const EMU = 914400;

const SUBTRACT = { type: 'steps', heading: 'How to subtract', steps: [
  'Line up the digits.',
  'Write the symbol.',
  'Start with the ((ones)). Then tens, then hundreds, then thousands.\nNot enough to take away? {{Exchange}}.\nNothing to take away? Write the top digit.'
] };
const EXCHANGE = { type: 'steps', heading: 'How to exchange', steps: [
  'Cross out the digit <<to the left>>.',
  'Write 1 less above it.',
  "Write a 1 in front of the digit that wasn't enough.",
  'Use the new digits.'
] };
const SUM = { type: 'stack', items: [
  { type: 'text', value: '6,284 - 851 =', colorRole: 'task-blue' },
  { type: 'place-value-chart', columns: ['Th', 'H', 'T', 'O'],
    calculation: { operator: '-', numbers: ['6284', '851'], answer: ['​', '​', '​', '​'] }, weight: 4 }
] };

function panel(content, extra) {
  return Object.assign({ type: 'sc-panel', content }, extra);
}

function slide(secondary, extra) {
  return Object.assign({ template: 'split-h-50-50', title: 'My Turn',
    speakerNotes: 'Say to children: watch me.', primary: SUM, secondary }, extra);
}

function build(t, slides) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'criteria-lists-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const specPath = path.join(dir, 'lesson.json');
  fs.writeFileSync(specPath, JSON.stringify({ lessonName: 'Column subtraction', yearGroup: 'Year 4',
    subject: 'Maths', lo: 'To subtract using columns', slides }));
  const result = spawnSync(process.execPath, [path.join(ROOT, 'build.js'), specPath, dir], { encoding: 'utf8' });
  assert.equal(result.status, 0, (result.stdout || '') + (result.stderr || ''));
  return dir;
}

async function slideXml(dir, n) {
  const deck = path.join(dir, fs.readdirSync(dir).find((name) => name.endsWith('.pptx')));
  const zip = await JSZip.loadAsync(fs.readFileSync(deck));
  return zip.file(`ppt/slides/slide${n}.xml`).async('string');
}

function shapes(xml) {
  return xml.split('<p:sp>').slice(1).map((block) => {
    const at = block.match(/<a:off x="(\d+)" y="(\d+)"\/>\s*<a:ext cx="(\d+)" cy="(\d+)"/) || [];
    return { block, x: at[1] / EMU, y: at[2] / EMU, w: at[3] / EMU, h: at[4] / EMU,
      text: (block.match(/<a:t>([^<]*)<\/a:t>/g) || []).map((t) => t.replace(/<\/?a:t>/g, '')).join('').replace(/\u00a0/g, ' ') };
  });
}

// The green boxes: rounded, filled with the criteria green-tint.
function greenBoxes(xml) {
  return shapes(xml).filter((s) => /prst="roundRect"/.test(s.block) && s.x > 6.5 &&
    !/<a:solidFill><a:srgbClr val="FFFFFF"/.test(s.block));
}

function badges(xml) {
  return shapes(xml).filter((s) => /prst="ellipse"/.test(s.block) && s.x > 6.5);
}

test('a list with its own heading keeps its own box', () => {
  const stack = { type: 'stack', items: [panel(SUBTRACT, { criteriaRef: 'sc-001' }), panel(EXCHANGE, { criteriaRef: 'sc-002' })] };
  const out = joinStackedCriteriaPanels({ slides: [slide(stack)] });
  assert.deepEqual(out.slides[0].secondary, stack);
});

test('two headed lists draw as two boxes under their own headings, with numbers one size', async (t) => {
  const dir = build(t, [slide({ type: 'stack', items: [
    panel(SUBTRACT, { criteriaRef: 'sc-001' }), panel(EXCHANGE, { criteriaRef: 'sc-002' })
  ] })]);
  const xml = await slideXml(dir, 1);
  assert.ok(!shapes(xml).some((s) => s.text.includes('Success Criteria')), 'no "Success Criteria" heading beside two named lists');
  for (const heading of ['How to subtract', 'How to exchange']) {
    assert.equal(shapes(xml).filter((s) => s.text.includes(heading)).length, 1, heading);
  }
  assert.equal(greenBoxes(xml).length, 2, 'two boxes');
  const sizes = new Set(badges(xml).map((b) => b.w.toFixed(3)));
  assert.equal(badges(xml).length, 7, 'every step numbered');
  assert.equal(sizes.size, 1, `one number size, got ${[...sizes].join(', ')}`);
  const cards = shapes(xml).filter((s) => s.x > 6.5 && /prst="roundRect"/.test(s.block) &&
    /<a:solidFill><a:srgbClr val="FFFFFF"/.test(s.block));
  const lowestCard = Math.min(...cards.map((c) => c.h));
  assert.ok(badges(xml)[0].w <= lowestCard + 0.005,
    `a number is no taller than its card (${badges(xml)[0].w.toFixed(2)}in in a ${lowestCard.toFixed(2)}in card)`);
  const sizeOf = (words) => {
    const found = shapes(xml).find((s) => s.text === words);
    assert.ok(found, words);
    return Number((found.block.match(/sz="(\d+)"/) || [])[1]);
  };
  const stepSizes = ['Line up the digits.', 'Write the symbol.', 'Write 1 less above it.', 'Use the new digits.'].map(sizeOf);
  assert.equal(new Set(stepSizes).size, 1, `one text size across both boxes, got ${stepSizes.join(', ')}`);
});

test('criteria that need the room rise beside the title; criteria that fit, or a header with a task line, stay put', async (t) => {
  const two = { type: 'stack', items: [panel(SUBTRACT, { criteriaRef: 'sc-001' }), panel(EXCHANGE, { criteriaRef: 'sc-002' })] };
  const dir = build(t, [
    slide(two),
    slide(panel({ type: 'steps', steps: SUBTRACT.steps }, { criteriaRef: 'sc-001' })),
  ]);
  const boxes = greenBoxes(await slideXml(dir, 1));
  const risen = Math.min(...boxes.map((b) => b.y));
  const foot = 7.5 - Math.max(...boxes.map((b) => b.y + b.h));
  const kept = Math.min(...greenBoxes(await slideXml(dir, 2)).map((b) => b.y));
  assert.ok(risen < 0.5, `two lists rise into the title row (top ${risen.toFixed(2)}in)`);
  assert.ok(Math.abs(risen - foot) < 0.03, `and sit centred on the slide (${risen.toFixed(2)}in above, ${foot.toFixed(2)}in below)`);
  assert.ok(kept >= 0.55, `one list that fits keeps its place (top ${kept.toFixed(2)}in)`);
});

test('a header with a task line keeps its strip, so two lists that cannot fit are refused, not drawn over it', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'criteria-lists-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const specPath = path.join(dir, 'lesson.json');
  const two = { type: 'stack', items: [panel(SUBTRACT, { criteriaRef: 'sc-001' }), panel(EXCHANGE, { criteriaRef: 'sc-002' })] };
  fs.writeFileSync(specPath, JSON.stringify({ lessonName: 'Column subtraction', yearGroup: 'Year 4', subject: 'Maths',
    lo: 'To subtract using columns', slides: [slide(two, { instruction: 'Watch the exchange.' })] }));
  const result = spawnSync(process.execPath, [path.join(ROOT, 'build.js'), specPath, dir], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match((result.stdout || '') + (result.stderr || ''), /STEP_TEXT_OVERLOAD/);
});
