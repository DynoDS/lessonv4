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
