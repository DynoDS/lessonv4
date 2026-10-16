'use strict';

// Six sums down half a slide stopped at about 23pt with a strip of the column
// empty beside them, on every Year 4 column subtraction deck of a week (stress
// test, 15 October 2026). The cards kept a fixed 0.16in above and below their
// words, so under small type the padding and gaps took more of the column than
// the sums did. The inset now never takes more than a quarter of the type's own
// size, and a set whose type is large keeps its full padding.

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawNumberedQuestions } = require('../src/content/numbered-questions');

function draw(zone, data) {
  const texts = [];
  const shapes = [];
  const pptx = new PptxGenJS();
  const slide = {
    addShape: (_kind, opts) => shapes.push(opts),
    addText: (content, opts) => texts.push({ content, ...opts }),
    addImage: () => {},
  };
  drawNumberedQuestions(pptx, slide, zone, data, { slideIndex: 0, lesson: {} });
  return { texts, shapes };
}

const questionBoxes = (texts) =>
  texts.filter((t) => /__question-text-/.test(t.objectName || ''));

// The primary side of a half-and-half Your Turn, as lesson 28 slide 18 drew it.
const HALF_SLIDE = { x: 0.22, y: 0.9, w: 6.35, h: 5.17 };
const SIX_SUMS = [
  '4,768 − 526 =', '7,596 − 3,254 =', '5,309 − 207 =',
  '8,479 − 52 =', '3,847 − 1,826 =', '6,955 − 641 =',
];

test('six sums in half a slide are set larger than fixed padding allowed', () => {
  const { texts, shapes } = draw(HALF_SLIDE, { questions: SIX_SUMS, startAt: 4 });
  const boxes = questionBoxes(texts);
  assert.equal(boxes.length, 6);
  // 20pt was the measured size with a fixed 0.16in inset.
  assert.ok(boxes[0].fontSize >= 25, `sums at ${boxes[0].fontSize}pt`);
  const bottom = Math.max(...shapes.map((s) => s.y + s.h));
  assert.ok(bottom <= HALF_SLIDE.y + HALF_SLIDE.h + 0.001, 'the set stays in its zone');
  // Still a card around each line: words never touch the card's edge.
  shapes.forEach((card, i) => {
    assert.ok(card.h > boxes[i].fontSize * 1.3 / 72, 'card taller than its line');
  });
});

test('a short set with large type keeps its full card padding', () => {
  const { texts, shapes } = draw(HALF_SLIDE, { questions: SIX_SUMS.slice(0, 2) });
  const boxes = questionBoxes(texts);
  assert.ok(boxes[0].fontSize >= 46, `two sums at ${boxes[0].fontSize}pt`);
  const lineH = (boxes[0].fontSize * 1.30) / 72;
  // Whatever lines a card wraps to, what is left over is the full 0.16in twice.
  shapes.forEach((card) => {
    const lines = Math.round((card.h - 0.32) / lineH);
    assert.ok(Math.abs(card.h - (lines * lineH + 0.32)) < 0.001, `card ${card.h}in`);
  });
});
