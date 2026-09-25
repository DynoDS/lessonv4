'use strict';

// A criteria list the lesson designer marked too long for every panel
// (`tooLongForPanels: true` in lesson-design.json) is known to the build by
// its words, and drawn smaller rather than not at all: at the largest size
// that fits, down to 16pt, in the practice panel at its widest or the
// half-width side, on a finished slide flagged for the teacher. His ruling of
// 24 September 2026, who does not want a blank page ("it should still try to
// fix it try to repair it"); 16pt is "really close to that limit" of what his
// class read. Every other list keeps the 18pt floor.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawSlide } = require('../src/templates');
const {
  listKey,
  markedCriteriaLists,
  showsMarkedList,
  markedListRoom,
  markedListHeldAt18,
  criteriaBelowFloorFindings,
  clearCriteriaBelowFloor,
  MARKED_LIST_FONT_MIN,
  MARKED_TOO_LONG_MESSAGE,
} = require('../src/marked-criteria');
const { getWarnings, clearWarnings } = require('../src/warnings');

const STEPS = [
  'Write the 3-digit number on top and the 1-digit number under the ones column.',
  'Multiply the ones first, and say the multiplication out loud as you do it.',
  'If the answer is 10 or more, carry the tens under the next column to the left.',
];

// In his style, too long for every panel at 18pt: the practice panel at its
// widest holds it at 17pt.
const SMALLER = [
  'Round each number to the nearest hundred before you add, and write them down.',
  'Add the rounded numbers in your head and write the estimate beside the question.',
  'Work out the exact answer with the column method, lining up every column.',
  'Compare the exact answer with your estimate and say whether they are close.',
  'If they are not close, check each column again, starting with the ones.',
  'Write a sentence that says how your estimate helped you check the answer.',
  'Circle the answer you trust most and explain to a partner why you trust it.',
];
// Only the half-width side, 0.15in taller than the widest practice panel,
// holds this one, at 16pt.
const HALF_SIDE_ONLY = [
  'Write the 3-digit number on top and the 1-digit number under the ones column.',
  'Multiply the ones first, and say the multiplication out loud as you do it.',
  'If the answer is 10 or more, carry the tens under the next column to the left.',
  'Multiply the tens, then add any tens you carried before you write anything.',
  'If that is 10 or more, carry the hundreds under the hundreds column the same way.',
  'Multiply the hundreds and add anything you carried, then write the answer.',
  'Read the whole answer back, from the hundreds to the ones, saying each value.',
  'Check your answer with an estimate, rounding to the nearest hundred first.',
];
// No panel holds this one even at 16pt.
const BEYOND = Array.from({ length: 9 }, () =>
  'Write each digit in its own column, lined up under the digit above it, and say its value.');
// Only the half-width side holds this one at 18pt.
const HALF_AT_18 = [
  'Find the two multiples of ten that the number sits between on the number line.',
  'Mark the number on the line, and mark the halfway point between those two tens.',
  'Look at the ones digit to decide which side of the halfway point the number is on.',
  'If the ones digit is 5 or more, round up to the next multiple of ten above it.',
  'If the ones digit is 4 or less, round down to the multiple of ten just below it.',
  'Write the rounded number and check it is the multiple of ten that is nearer.',
];
// This one fits the widest practice panel at 18pt.
const WIDEST_AT_18 = [
  'Start with a fronted adverbial to say when or where.',
  'Use an expanded noun phrase to describe the setting.',
  'Choose a powerful verb to show how the character moves.',
  'Add a feeling the character has and show it with an action.',
  'Use a comma after your fronted adverbial.',
  'Check every sentence starts with a capital letter and ends with a full stop.',
  'Read it back to check it makes sense.',
];

function lessonBesideDesign(design) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'marked-criteria-'));
  if (design) fs.writeFileSync(path.join(root, 'lesson-design.json'), JSON.stringify(design));
  return { root, lesson: path.join(root, 'lesson.json.tmp.attempt-1') };
}

function designWith(entries) {
  return { successCriteria: entries.map(([steps, extra], i) => Object.assign(
    { id: `sc-00${i + 1}`, type: 'steps', drawLive: false, content: { steps } }, extra)) };
}

const practice = (steps) => ({ template: 'maths-turn-sc', title: 'My Turn', questions: ['Work out 4,352 + 1,386.'],
  workingSpace: true, criteria: { type: 'steps', steps } });
const halfSide = (steps) => ({ template: 'split-h-50-50', title: 'Our Turn', primary: { type: 'text', value: 'Work out 4,352 + 1,386.' },
  secondary: { type: 'sc-panel', content: { type: 'steps', steps } } });

// Draw one slide as the build draws it, with the lists the design marks.
function draw(slideData, marked) {
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  drawSlide(pptx, slide, slideData, { slideIndex: 0, cardLook: true, imageDims: {},
    markedCriteria: new Set(marked.map(listKey)) });
  const boxes = slide._slideObjects.map((o) => o.options || {});
  const lines = boxes.filter((o) => /step-text-\d+$/.test(String(o.objectName || '')));
  return {
    panel: boxes.find((o) => o.fill && o.fill.color === 'D5F5E3'),
    fonts: lines.map((o) => o.fontSize),
    names: lines.map((o) => o.objectName),
    work: boxes.find((o) => o.fill && o.fill.color === 'F2F2F2'),
    boxes,
  };
}

function refusal(slideData, marked) {
  try {
    draw(slideData, marked);
  } catch (err) {
    return err.message;
  }
  return '';
}

test('a slide showing a marked list word for word is known, whatever template carries it', () => {
  const { root, lesson } = lessonBesideDesign(designWith([[STEPS, { tooLongForPanels: true }]]));
  try {
    const marked = markedCriteriaLists(lesson);
    assert.equal(marked.size, 1);
    // The practice templates' `criteria`, a free layout's `sc-panel`, and
    // steps written as objects, with a line break and a sticky line added.
    assert.ok(showsMarkedList({ template: 'maths-turn-sc', criteria: { type: 'steps', steps: STEPS } }, marked));
    assert.ok(showsMarkedList({ template: 'split-h-50-50', secondary: { type: 'sc-panel', content: { type: 'steps',
      steps: [`✨ Ten ones make one ten.`, ...STEPS.map((text, i) => ({ text: i === 0 ? text.replace(' and the', '\nand the') : text }))] } } }, marked));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('nothing else is: an unmarked list, part of a marked list, other words, or no design at all', () => {
  const { root, lesson } = lessonBesideDesign(designWith([[STEPS, { tooLongForPanels: true }], [STEPS.slice(0, 2).concat('Check it.')]]));
  try {
    const marked = markedCriteriaLists(lesson);
    assert.equal(marked.size, 1, 'only the marked list counts');
    assert.ok(!showsMarkedList({ template: 'maths-turn-sc', criteria: { type: 'steps', steps: STEPS.slice(0, 2) } }, marked));
    assert.ok(!showsMarkedList({ template: 'maths-turn-sc', criteria: { type: 'steps', steps: STEPS.slice(0, 2).concat('Check it.') } }, marked));
    assert.ok(!showsMarkedList({ template: 'maths-turn-sc', criteria: { type: 'steps', steps: STEPS.map((s) => s.replace('ones', 'units')) } }, marked));
    assert.ok(!showsMarkedList({ template: 'maths-turn-sc', questions: ['Q'] }, marked));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
  const bare = lessonBesideDesign(null);
  try {
    assert.equal(markedCriteriaLists(bare.lesson).size, 0, 'no design beside the lesson marks nothing');
  } finally {
    fs.rmSync(bare.root, { recursive: true, force: true });
  }
  const falseMark = lessonBesideDesign(designWith([[STEPS, { tooLongForPanels: false }]]));
  try {
    assert.equal(markedCriteriaLists(falseMark.lesson).size, 0, 'a mark left false marks nothing');
  } finally {
    fs.rmSync(falseMark.root, { recursive: true, force: true });
  }
});

test('a marked list is drawn smaller in the practice panel at its widest, on a finished slide, and found once', () => {
  clearCriteriaBelowFloor();
  clearWarnings();
  const drawn = draw(practice(SMALLER), [SMALLER]);
  assert.equal(drawn.panel.w, 6.35, 'the panel widens as far as it goes before the list is drawn smaller');
  assert.deepEqual([...new Set(drawn.fonts)], [17], 'the largest size that fits: 17pt, not 16pt');
  assert.ok(drawn.work, 'the working space is drawn: a finished slide, not a page to check');
  assert.ok(drawn.names.every((name) => /__MIN17__marked-step-text-\d+$/.test(name)), drawn.names.join(' '));
  // The slide is named for the teacher once, however many tries chose the
  // width and the size, and the warning that says "within the 18pt floor"
  // is not given, because it is not.
  const findings = criteriaBelowFloorFindings();
  assert.equal(findings.length, 1);
  assert.equal(findings[0].signal, 'CRITERIA_BELOW_READABLE_FLOOR');
  assert.equal(findings[0].slide, 1);
  assert.match(findings[0].message, /^the success criteria that begin "Round each number to the nearest\.\.\." are laid out at 17pt, under the 18pt floor/);
  assert.match(findings[0].message, /Check this slide before teaching\. Nothing was cut\.$/);
  assert.equal(getWarnings().filter((w) => /success criteria set at/.test(w)).length, 0);
  clearCriteriaBelowFloor();
});

test('the 18pt floor stands for every other list: the same words unmarked are refused', () => {
  const message = refusal(practice(SMALLER), []);
  assert.match(message, /^STEP_TEXT_OVERLOAD: criterion \d+ does not fit its card at the 18pt readable minimum/);
  assert.match(message, /The practice panel is already as wide as it goes\./);
  // And a list that fits keeps its size, marked or not, with nothing found.
  clearCriteriaBelowFloor();
  const marked = draw(practice(STEPS), [STEPS]);
  const plain = draw(practice(STEPS), []);
  assert.deepEqual(marked.boxes, plain.boxes);
  assert.equal(criteriaBelowFloorFindings().length, 0);
});

test('it widens before it goes smaller: a marked list the widest panel holds at 18pt is drawn at 18pt or more', () => {
  clearCriteriaBelowFloor();
  const marked = draw(practice(WIDEST_AT_18), [WIDEST_AT_18]);
  const plain = draw(practice(WIDEST_AT_18), []);
  assert.equal(plain.panel.w, 6.35);
  assert.deepEqual(marked.boxes, plain.boxes, 'nothing changes for a list that fits at 18pt');
  assert.ok(marked.fonts.every((pt) => pt >= 18));
  assert.equal(criteriaBelowFloorFindings().length, 0);
});

test('the half-width split draws a marked list smaller too, and holds one the practice panel cannot', () => {
  clearCriteriaBelowFloor();
  const drawn = draw(halfSide(HALF_SIDE_ONLY), [HALF_SIDE_ONLY]);
  assert.deepEqual([...new Set(drawn.fonts)], [MARKED_LIST_FONT_MIN]);
  assert.equal(criteriaBelowFloorFindings().length, 1);
  clearCriteriaBelowFloor();
  // On a practice template it is refused at 16pt, by the widest card, and the
  // refusal names the half-width split: a move the slide designer can make.
  const message = refusal(practice(HALF_SIDE_ONLY), [HALF_SIDE_ONLY]);
  assert.match(message, /does not fit its card at the 16pt a list marked too long may be drawn at\./);
  assert.match(message, /The card holds about \d+ characters at 16pt/);
  assert.match(message, /the half-width split \(`split-h-50-50`\)/);
});

test('a marked list still refused is the slide designer\'s to move while a named shape holds it, and only otherwise the design\'s', () => {
  const ctx = (marked) => ({ slideIndex: 0, cardLook: true, imageDims: {}, markedCriteria: new Set(marked.map(listKey)) });
  assert.equal(markedListRoom(practice(HALF_SIDE_ONLY), ctx([HALF_SIDE_ONLY])), 'the half-width split');
  assert.equal(markedListRoom(practice(SMALLER), ctx([SMALLER])), 'the practice panel');
  assert.equal(markedListRoom(practice(BEYOND), ctx([BEYOND])), null);
  // Unmarked, the same list has no room at 18pt, so the answer is the mark's.
  assert.equal(markedListRoom(practice(HALF_SIDE_ONLY), ctx([])), null);
});

test('a stale mark changes nothing: a marked list a named shape holds at 18pt draws, or is refused, as unmarked', () => {
  // The fifth check: a mark left behind after the list was tightened drew the
  // list at 17pt in panels that refuse it unmarked, and flagged those slides as
  // "too long for every criteria panel", which was untrue.
  const ctx = (marked) => ({ slideIndex: 0, cardLook: true, imageDims: {}, markedCriteria: new Set(marked.map(listKey)) });
  assert.ok(markedListHeldAt18(WIDEST_AT_18, ctx([WIDEST_AT_18])));
  assert.ok(markedListHeldAt18(HALF_AT_18, ctx([HALF_AT_18])));
  assert.ok(!markedListHeldAt18(SMALLER, ctx([SMALLER])));
  clearCriteriaBelowFloor();
  // In a 30% column, which holds none of them: refused at 18pt, its roomier
  // shape named, exactly as the same list unmarked.
  const column = (steps) => ({ template: 'split-h-70-30', title: 'Our Turn',
    primary: { type: 'text', value: 'Work out 4,352 + 1,386.' }, secondary: { type: 'sc-panel', content: { type: 'steps', steps } } });
  for (const steps of [WIDEST_AT_18, HALF_AT_18]) {
    const unmarked = refusal(column(steps), []);
    assert.match(unmarked, /at the 18pt readable minimum/);
    assert.equal(refusal(column(steps), [steps]), unmarked);
  }
  // On a practice template, the list only the half side holds is refused at
  // the widest, at 18pt, naming the half-width split, as unmarked.
  const unmarked = refusal(practice(HALF_AT_18), []);
  assert.match(unmarked, /at the 18pt readable minimum\. .*the half-width split \(`split-h-50-50`\)/);
  assert.equal(refusal(practice(HALF_AT_18), [HALF_AT_18]), unmarked);
  assert.equal(criteriaBelowFloorFindings().length, 0, 'no slide is flagged as too long for every panel');
});

test('only the marked list goes under 18pt: a sticky line beside it keeps 18pt and its own size group', () => {
  // His ruling: "The 18 point floor stands for everything else."
  clearCriteriaBelowFloor();
  const sticky = '✨ Five or more rounds up.';
  const drawn = draw(practice([sticky, ...SMALLER]), [SMALLER]);
  assert.ok(drawn.fonts.every((pt) => pt < 18), drawn.fonts.join(','));
  const line = drawn.boxes.find((o) => /step-reference-\d+$/.test(String(o.objectName || '')));
  assert.ok(line.fontSize >= 18, `the sticky line at ${line.fontSize}pt`);
  assert.match(line.objectName, /^GROWFIT__step-reference-[\d-]+__36__step-reference-\d+$/, 'its own group, and no lower floor');
  assert.equal(criteriaBelowFloorFindings().length, 1);
  clearCriteriaBelowFloor();
  // A sticky line too long for its card at 18pt beside the marked list is
  // refused as it is beside any list, and the marked list itself has room at
  // 16pt, so the refusal stays the slide designer's to repair.
  const long = '✨ A number is rounded to the nearest ten by looking at its ones digit: five or more rounds up ' +
    'to the next ten, four or less rounds down to the ten below it, and the tens digit tells you which tens it sits between.';
  const message = refusal(practice([long, ...SMALLER]), [SMALLER]);
  assert.match(message, /^STEP_TEXT_OVERLOAD: the sticky-knowledge reference line does not fit its card at the 18pt readable minimum\./);
  const ctx = { slideIndex: 0, cardLook: true, imageDims: {}, markedCriteria: new Set([listKey(SMALLER)]) };
  assert.equal(markedListRoom(practice([long, ...SMALLER]), ctx), 'the practice panel');
  // A two-line sticky line fits beside the steps only if it shares their
  // lower floor. It keeps 18pt, so beside the marked list it is refused.
  const medium = '✨ An estimate tells you roughly how big the answer.';
  assert.match(refusal(practice([medium, ...SMALLER]), [SMALLER]),
    /^STEP_TEXT_OVERLOAD: the sticky-knowledge reference line does not fit its card at the 18pt readable minimum\./);
  // A marked list whose own steps fit at 18pt is not drawn smaller to make
  // room for a sticky line beside it: the mark is stale, and the sticky line
  // is refused exactly as beside the list unmarked.
  const unmarked = refusal(practice([medium, ...WIDEST_AT_18]), []);
  assert.match(unmarked, /the sticky-knowledge reference line does not fit its card at the 18pt readable minimum/);
  assert.equal(refusal(practice([medium, ...WIDEST_AT_18]), [WIDEST_AT_18]), unmarked);
  assert.equal(criteriaBelowFloorFindings().length, 0);
});

test('the message for the rarest case tells the slide designer to leave the slide, and asks for nothing else', () => {
  assert.match(MARKED_TOO_LONG_MESSAGE, /^This success-criteria list is marked too long in the design \(`tooLongForPanels`\), and no criteria panel holds it as this slide carries it, even at 16pt, the least a marked list is drawn at/);
  assert.match(MARKED_TOO_LONG_MESSAGE, /Leave the slide flagged: no repair pass will find room for it/);
  for (const word of ['shorten', 'fewer', 'drop', 'remove', 'more room', String.fromCharCode(0x2014), String.fromCharCode(0x2013)]) {
    assert.ok(!MARKED_TOO_LONG_MESSAGE.includes(word), word);
  }
});
