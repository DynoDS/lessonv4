'use strict';

// The question that arrived before its subject.
//
// On 1 September 2026 the Year 4 balanced-diet deck put "Is Dev right?
// Explain." in the left column of three speech-bubble slides, with the claim it
// asks about in the bubble on the right. Children read left to right, so they
// met the question before the thing it was about. The slide designer could not
// have fixed it: the template hard-coded the statement to the left and offered
// no side at all. `statementSide` is that choice, and the default stays left so
// the other shape - a diagram or shape the character is speaking about - still
// reads first.

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  drawSpeechBubbles1,
  drawSpeechBubbles2
} = require('../src/templates/speech-bubbles');
const { COLOURS } = require('../src/styles');

function fakePptx() {
  return {
    shapes: {
      ROUNDED_RECTANGLE: 'roundRect',
      RECTANGLE: 'rect',
      ISOSCELES_TRIANGLE: 'triangle',
      LINE: 'line'
    }
  };
}

function fakeSlide() {
  return {
    shapes: [],
    texts: [],
    images: [],
    addShape(type, options) { this.shapes.push({ type, options }); },
    addText(value, options) { this.texts.push({ value, options }); },
    addImage(options) { this.images.push(options); }
  };
}

// The bubble is the only white rounded rectangle; the statement is the text run
// carrying its own words. Comparing their x tells us which column each took.
function bubbleX(slide) {
  return slide.shapes.find(
    (s) => s.type === 'roundRect' && s.options.fill && s.options.fill.color === COLOURS.pureWhite
  ).options.x;
}

function statementX(slide, words) {
  const found = slide.texts.find((t) => {
    const value = Array.isArray(t.value) ? t.value.map((r) => r.text || '').join('') : String(t.value || '');
    return value.includes(words);
  });
  assert.ok(found, `no text run carrying ${JSON.stringify(words)}`);
  return found.options.x;
}

function drawSolo(statementSide) {
  const slide = fakeSlide();
  drawSpeechBubbles1(fakePptx(), slide, {
    title: 'Judge the claim',
    headerStyle: 'title',
    statement: { type: 'text', value: 'Is Dev right? Explain.' },
    speakers: [{ name: 'Dev', child: 'mr-sear', speech: "Sophie's lunch is balanced." }],
    ...(statementSide ? { statementSide } : {})
  }, {});
  return slide;
}

test('the statement column stays on the left by default', () => {
  const slide = drawSolo();
  assert.ok(
    statementX(slide, 'Is Dev right?') < bubbleX(slide),
    'the default arrangement moved - a statement that IS the thing being judged reads first'
  );
});

test('statementSide right puts the claim first and the question after it', () => {
  const slide = drawSolo('right');
  assert.ok(
    bubbleX(slide) < statementX(slide, 'Is Dev right?'),
    'the speaker must take the left column so a child reads the claim before the question about it'
  );
});

test('an unknown statementSide falls back to left rather than drawing nothing', () => {
  const slide = drawSolo('middle');
  assert.ok(statementX(slide, 'Is Dev right?') < bubbleX(slide));
});

test('both columns still fill the body and neither overlaps the other', () => {
  for (const side of [undefined, 'right']) {
    const slide = drawSolo(side);
    const bubble = slide.shapes.find(
      (s) => s.type === 'roundRect' && s.options.fill && s.options.fill.color === COLOURS.pureWhite
    ).options;
    const statement = slide.texts.find((t) => {
      const value = Array.isArray(t.value) ? t.value.map((r) => r.text || '').join('') : String(t.value || '');
      return value.includes('Is Dev right?');
    }).options;
    const [first, second] = bubble.x < statement.x ? [bubble, statement] : [statement, bubble];
    assert.ok(
      first.x + first.w <= second.x + 1e-9,
      `columns overlap with statementSide ${side || 'left'}`
    );
    assert.ok(first.x >= 0 && second.x + second.w <= 13.4, 'a column ran off the slide');
  }
});

test('the two-speaker template takes the same side field for its diagram column', () => {
  function drawPair(statementSide) {
    const slide = fakeSlide();
    drawSpeechBubbles2(fakePptx(), slide, {
      title: 'Who is right?',
      headerStyle: 'title',
      // A non-text statement takes the side column rather than the slim band.
      statement: { type: 'table', headers: ['a'], rows: [['1']] },
      speakers: [
        { name: 'Dev', child: 'mr-sear', speech: 'It is four.' },
        { name: 'Aisha', child: 'miss-brooker', speech: 'It is five.' }
      ],
      ...(statementSide ? { statementSide } : {})
    }, {});
    return slide;
  }
  const leftBubble = bubbleX(drawPair());
  const rightBubble = bubbleX(drawPair('right'));
  assert.ok(
    rightBubble < leftBubble,
    'statementSide right must move the speakers into the left column here too'
  );
});
