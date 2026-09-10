'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawSteps } = require('../src/content/steps');

// Capture what the helper actually asks PowerPoint to draw, so the assertions
// are about placed shapes rather than about the internals of the sizing.
function drawn(zone, data) {
  const shapes = [];
  const texts = [];
  const pptx = new PptxGenJS();
  const slide = {
    addShape: (kind, opts) => shapes.push({ kind, ...opts }),
    addText: (content, opts) => texts.push({ content, ...opts }),
    addImage: () => {},
  };

  drawSteps(pptx, slide, zone, data, { slideIndex: 0 });
  return { shapes, texts };
}

const ZONE = { x: 0, y: 0, w: 10, h: 5, class: 'A', itemCards: true };

test('three short related steps share one narrower card width, centred', () => {
  const { shapes } = drawn(ZONE, {
    steps: ['Read it', 'Say it', 'Write it'],
  });

  const cards = shapes.filter((s) => s.w && s.h && s.rectRadius !== undefined);
  assert.equal(cards.length, 3);

  // Narrower than the zone, because short steps do not need all of it.
  assert.ok(cards[0].w < ZONE.w, 'cards took the whole zone width');

  // Centred in the space available rather than pinned to the left edge. The
  // zone's own padding is not symmetrical, so this measures against the inner
  // area the cards are actually placed in.
  const INNER_LEFT = ZONE.x + 0.05;
  const INNER_RIGHT = ZONE.x + ZONE.w - 0.15;
  const leftGap = cards[0].x - INNER_LEFT;
  const rightGap = INNER_RIGHT - (cards[0].x + cards[0].w);
  assert.ok(Math.abs(leftGap - rightGap) < 0.001, 'the card set is not centred');
  assert.ok(leftGap > 0, 'the card set was pinned to the left edge');
});
test('every related card keeps the same width as its siblings', () => {
  const { shapes } = drawn(ZONE, {
    steps: ['Read it', 'Say it carefully and then check', 'Write'],
  });

  const cards = shapes.filter((s) => s.rectRadius !== undefined);
  const widths = new Set(cards.map((c) => Math.round(c.w * 1000)));
  assert.equal(widths.size, 1, 'related cards drew at different widths');
});

test('a long step is allowed to wrap rather than being shrunk to one line', () => {
  const long = 'Count on in tens from the number you started with and check';
  const { texts } = drawn(ZONE, { steps: [long] });

  const body = texts.find((t) => t.objectName !== 'NOFIT_step-badge');
  // Wrapping is considered at every candidate size, so this keeps a readable
  // size instead of collapsing to the floor to fit on one line.
  assert.ok(body.fontSize > 18, `text shrank to ${body.fontSize}pt`);
});

test('related steps use one uniform size', () => {
  const { texts } = drawn(ZONE, {
    steps: [
      'Read it',
      'Say the answer and explain how you know',
      'Explain your reasoning carefully and use the evidence to justify each step before you check your answer.',
    ],
  });

  const bodies = texts.filter((t) => t.objectName !== 'NOFIT_step-badge');
  const sizes = new Set(bodies.map((body) => body.fontSize));
  assert.equal(sizes.size, 1, 'related steps used different font sizes');
  assert.ok(
    bodies.every((body) => /^GROWFIT__.+__36__MIN18__step-/.test(body.objectName)),
    'a related step was not assigned to the shared grow-fit group'
  );
});

test('a step that cannot fit at the readable minimum returns STEP_TEXT_OVERLOAD', () => {
  // Not printed unreadably small and not trimmed: the words or the room has to
  // change, and both of those are decisions above this renderer.
  assert.throws(
    () =>
      drawn(
        { x: 0, y: 0, w: 2, h: 0.6, class: 'A' },
        { steps: ['x'.repeat(400)] }
      ),
    /STEP_TEXT_OVERLOAD/
  );
});

// ─── A sticky reference line is sized by its content, not by the item count ───
//
// The Compare 4-digit numbers deck refused to build on a panel that carried
// five success-criteria steps plus the lesson's sticky fact. Rows were shared
// out equally, so the one full sentence on the panel got exactly the height of
// a three-word imperative and starved, while every step around it sat in room
// it did not need.

const SC_PANEL = { x: 8.51, y: 0.75, w: 4.6, h: 6.5, class: 'B', itemCards: true };
const FIVE_STEPS = [
  'Match the place values.',
  'Start with the thousands.',
  'Same? Move one place right.',
  'Different? Choose < or >.',
  'All equal? Write =.',
];
const STICKY = '✨ The first different place decides which number is greater.';

test('a wrapping sticky reference fits beside five steps that each need one line', () => {
  const { shapes } = drawn(SC_PANEL, {
    heading: '✓ Success Criteria',
    steps: FIVE_STEPS.concat([STICKY]),
  });

  const cards = shapes.filter((s) => s.rectRadius !== undefined);
  assert.equal(cards.length, 6, 'the panel did not draw a card per item');

  // The reference carries a whole sentence, so it takes more height than the
  // one-line steps rather than refusing the build.
  const stepCards = cards.slice(0, 5);
  const referenceCard = cards[5];
  assert.ok(
    referenceCard.h > stepCards[0].h,
    'the sticky reference was still held to a short step\'s height'
  );

  // The steps stay a set: same height as each other, and still tall enough to
  // read comfortably rather than being squeezed to buy the sentence its room.
  const stepHeights = new Set(stepCards.map((c) => c.h.toFixed(4)));
  assert.equal(stepHeights.size, 1, 'the numbered steps drew at differing heights');
  assert.ok(stepCards[0].h > 0.5, 'the numbered steps were squeezed too far');
});

test('the numbered steps keep their own size when a sentence shares the panel', () => {
  const { texts } = drawn(SC_PANEL, {
    heading: '✓ Success Criteria',
    steps: FIVE_STEPS.concat([STICKY]),
  });

  // The panel heading is not one of the steps, so it is not part of this.
  const stepSizes = new Set(
    texts.filter((t) => /step-text-\d+$/.test(t.objectName || '')).map((t) => t.fontSize)
  );
  const referenceSize = texts.find((t) => /step-reference-\d+$/.test(t.objectName || ''));

  // One size across the numbered steps, and not dragged down to whatever the
  // long sentence can manage: the reference is marked out as a different kind
  // of thing, so it takes its own fit.
  assert.equal(stepSizes.size, 1, 'the numbered steps used different font sizes');
  assert.ok(
    [...stepSizes][0] > referenceSize.fontSize,
    'the numbered steps were pulled down to the sentence\'s size'
  );
});

test('equal rows stay equal when every item fits its equal share', () => {
  // The panels that already fit must not move, so a deck built before this
  // change rebuilds identically.
  const { shapes } = drawn(SC_PANEL, {
    heading: '✓ Success Criteria',
    steps: FIVE_STEPS,
  });

  const cards = shapes.filter((s) => s.rectRadius !== undefined);
  const heights = new Set(cards.map((c) => c.h.toFixed(4)));
  assert.equal(heights.size, 1, 'equal rows were redistributed when they already fitted');
});

test('an impossible panel still refuses, and names the reference rather than a step number', () => {
  // The steps are numbered 1..N and the reference wears a star, so reporting
  // "step 6" on a five-step panel sends the reader hunting for a step that is
  // not on the slide.
  assert.throws(
    () =>
      drawn(
        { x: 0, y: 0, w: 3, h: 1.2, class: 'A', itemCards: true },
        { steps: ['Short one.', '✨ ' + 'a very long sticky sentence '.repeat(12)] }
      ),
    /STEP_TEXT_OVERLOAD: the sticky-knowledge reference line/
  );
});

// A refusal has to name a repair the reader is allowed to make. The slide
// designer may not reword success criteria, so a criteria panel that refuses
// must point at the room, not at the words.
const TIGHT_PANEL = { x: 8.5, y: 0.75, w: 3.0, h: 2.0, class: 'B', itemCards: true };
const TOO_LONG = [
  'Match every single place value carefully',
  'Start with the thousands column',
  'Same? Move one place right',
];

function refusal(zone) {
  try {
    drawn(zone, { steps: TOO_LONG });
  } catch (err) {
    return err.message;
  }

  return null;
}

test('a refusal says how much the card actually holds', () => {
  const message = refusal(TIGHT_PANEL);

  assert.ok(message, 'the panel was expected to refuse');

  // The budget is what turns a retry into arithmetic: without it the next
  // attempt is a guess, and a guess three words shorter is as likely to be
  // refused again as it is to pass.
  assert.match(message, /holds about \d+ characters at \d+pt/);
  assert.match(message, /this one is 40\./);
});

test('a criteria panel refuses by naming the room, never the wording', () => {
  const message = refusal(Object.assign({}, TIGHT_PANEL, { sourceAuthoredText: true }));

  assert.ok(message, 'the criteria panel was expected to refuse');
  assert.match(message, /criterion 1/);
  assert.match(message, /not yours to shorten or merge/);
  assert.match(message, /slide-success-criteria\.md/);

  // The plain-steps wording tells the reader to shorten the step. Reaching a
  // criteria panel it would set the engine against the reference that forbids
  // exactly that, and the cheap-looking repair is the one that breaks the
  // lesson.
  assert.doesNotMatch(message, /Shorten the step/);
});

test('a step list that is nobody else\'s wording may still be shortened', () => {
  const message = refusal(TIGHT_PANEL);

  assert.match(message, /Shorten the step to that/);
  assert.doesNotMatch(message, /not yours to shorten/);
});
