'use strict';

// The step fitter no longer refuses a criteria list it has room for.
//
// The long-list investigation (23 September 2026) drew 114 real lists in the
// practice templates' panel. Four were refused there, and every one had room:
// the refusals were three faults in how the fitter measured. The teacher agreed
// to mend all three, on the promise that no list that fits today changes
// (criteria-lists-keep-their-size.test.js holds that half).
//
// 1. A card given exactly its lines' height at the floor was refused by a
//    rounding error of about a millionth of an inch.
// 2. With a sticky line in the list, a pre-check measured every step at the
//    20pt target and as tall as the tallest, not at the 18pt floor.
// 3. A list of one to three steps kept its share of four rows even when a long
//    step needed more and most of the panel stood empty.
//
// Each is tested here with the real list that showed it, drawn in the practice
// panel at today's 4.60in, where all four now fit without the panel widening.

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawScPanel } = require('../src/templates/maths-turn-sc');
const { drawScPanelContent } = require('../src/content/sc-panel');
const { withoutRecording } = require('../src/warnings');

const STAR = '✨';

// The criteria as a practice template draws them, in its 4.60in panel: the step
// sizes, the white cards and the sticky line, if any.
function inPracticePanel(steps) {
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  withoutRecording(() => drawScPanel(pptx, slide, { criteria: { type: 'steps', steps } },
    { slideIndex: 0, imageDims: {}, cardLook: true }));
  return summary(slide);
}

function summary(slide) {
  const objects = slide._slideObjects;
  const named = (pattern) => objects.filter((o) => pattern.test(String((o.options || {}).objectName || '')));
  return {
    panel: objects.find((o) => o.options && o.options.fill && o.options.fill.color === 'D5F5E3').options,
    stepFonts: named(/step-text-\d+$/).map((o) => o.options.fontSize),
    references: named(/step-reference-\d+$/),
    cards: objects.filter((o) => o.options && o.options.fill && o.options.fill.color === 'FFFFFF' && o.options.shadow).map((o) => o.options),
  };
}

test('fault 1: a card given exactly its lines\' height is not refused by rounding (find 1,000 more or less)', () => {
  // The saved design's six steps. The fourth wraps to three lines and takes a
  // taller card of exactly the height those lines need.
  const drawn = inPracticePanel([
    'Show the starting number.',
    'Find the thousands column.',
    'Less? If no 1,000 counter, exchange one 10,000 into ten 1,000s.',
    'More? Add one thousand. Less? Remove one thousand.',
    'Ten 1,000 counters? Exchange them for one 10,000 counter.',
    'Read the new number.',
  ]);
  assert.equal(drawn.panel.w, 4.6);
  assert.equal(drawn.stepFonts.length, 6);
  assert.ok(drawn.stepFonts.every((pt) => pt === 18), `drawn at ${drawn.stepFonts}`);
  const heights = new Set(drawn.cards.map((card) => card.h.toFixed(4)));
  assert.ok(heights.size > 1, 'the long steps were meant to take taller cards');
});

test('fault 2: a sticky line no longer makes the pre-check measure every step at 20pt (round to 10 and 100)', () => {
  const drawn = inPracticePanel([
    'Read the question: 10s or 100s?',
    'Find the 10s or 100s each side.',
    'Draw a number line. Mark your number.',
    'Find halfway. Before it or after it?',
    'Round to the nearer one. Halfway? Round up.',
    `${STAR} Already a multiple? It stays the same.`,
  ]);
  assert.equal(drawn.panel.w, 4.6);
  assert.equal(drawn.stepFonts.length, 5);
  assert.equal(drawn.references.length, 1, 'the sticky line is drawn');
  assert.ok(drawn.stepFonts.every((pt) => pt >= 18), `drawn at ${drawn.stepFonts}`);
});

test('fault 2: the saved partition list with its sticky line draws (partition 4-digit numbers)', () => {
  const drawn = inPracticePanel([
    "Read each digit's column.",
    'Write the thousands, hundreds, tens and ones.',
    "Write each part's value.",
    'Check the parts make the whole.',
    `${STAR} Zero keeps an empty column's place in a number.`,
  ]);
  assert.equal(drawn.panel.w, 4.6);
  assert.equal(drawn.references.length, 1);
  assert.ok(drawn.stepFonts.every((pt) => pt >= 18), `drawn at ${drawn.stepFonts}`);
});

test('fault 3: a short list takes the height its long step needs, and no more (the RE single step)', () => {
  const drawn = inPracticePanel([
    'I can name a religious symbol and explain its meaning within that tradition.',
  ]);
  assert.equal(drawn.panel.w, 4.6);
  assert.deepEqual(drawn.stepFonts, [18]);
  // Its share of four rows is about 1.34in; it needs a little more, and takes
  // only that, so the step is not blown up to fill the whole panel.
  const [card] = drawn.cards;
  assert.ok(card.h > 1.3 && card.h < 1.6, `card ${card.h.toFixed(3)}in tall`);
});

test('fault 1 in the half side: the eight-step list draws in the half-width split', () => {
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  withoutRecording(() => drawScPanelContent(pptx, slide, { x: 6.767, y: 0.75, w: 6.347, h: 6.5, class: 'C' }, {
    content: {
      type: 'steps',
      steps: [
        'Write the 3-digit number on top and the 1-digit number under the ones.',
        'Multiply the ones first.',
        'If the answer is 10 or more, write the ones and carry the tens under the next column.',
        'Multiply the tens.',
        'Add any tens you carried, then write the answer in the tens column.',
        'If that is 10 or more, carry the hundreds the same way.',
        'Multiply the hundreds and add anything you carried.',
        'Check your answer with an estimate.',
      ],
    },
  }, { slideIndex: 0, imageDims: {}, cardLook: true }));
  const drawn = summary(slide);
  assert.equal(drawn.stepFonts.length, 8);
  assert.ok(drawn.stepFonts.every((pt) => pt >= 18), `drawn at ${drawn.stepFonts}`);
});

test('a list that genuinely needs more room than the panel has is still refused, not shrunk', () => {
  const long = 'Write each digit in its own column, lined up under the digit above it.';
  assert.throws(
    () => inPracticePanel(Array.from({ length: 9 }, () => long)),
    /STEP_TEXT_OVERLOAD: criterion \d+ does not fit its card at the 18pt readable minimum/
  );
});

test('fault 3 in a shallow band: a short list is measured again at the height it is given until it settles', () => {
  // The gap between cards and the number badge grow with the row, so a list
  // given what it needed at its small share needed a little more at the new
  // height: `Round to the nearer ten.` was refused about 0.01in short in the
  // bottom 40% band, with the band mostly empty.
  const { drawSlide } = require('../src/templates');
  const lists = [
    ['Round to the nearer ten.'],
    ['I can explain why people use symbols.'],
    ['If they are the same, compare the hundreds.', 'Put < or > between the numbers, with the open side facing the greater number.'],
  ];
  // The bottom 40% band holds all three; the 30% band has room for one line,
  // not two, so it is given the one-step lists.
  for (const [template, sets] of [['split-v-60-40', lists], ['split-v-70-30', lists.slice(0, 2)]]) {
    for (const steps of sets) {
      const pptx = new PptxGenJS();
      const slide = pptx.addSlide();
      withoutRecording(() => drawSlide(pptx, slide, {
        template, title: 'Your Turn', primarySide: 'top',
        primary: { type: 'text', value: 'Round 346 to the nearest ten.' },
        secondary: { type: 'sc-panel', content: { type: 'steps', steps } },
      }, { slideIndex: 0, imageDims: {}, cardLook: true }));
      const drawn = summary(slide);
      assert.equal(drawn.stepFonts.length, steps.length, `${template}: ${steps[0]}`);
      assert.ok(drawn.stepFonts.every((pt) => pt >= 18), `${template}: drawn at ${drawn.stepFonts}`);
    }
  }
});
