'use strict';

// The half-empty speech bubble.
//
// On 30 August 2026 the Year 4 water-cycle deck's slide 7 (DECK-002) drew
// Dev's two-line claim in a bubble sized to the whole speaker column, leaving
// roughly half the bordered bubble as blank white. The focused repair could
// not fix it because the helper exposed no height control, and the run stayed
// BLOCKED. The bubble now hugs its claim: the bottom edge stays put so the
// tail keeps pointing at the figure, the unneeded height is given back at the
// top, and a long claim still gets the full column.

const test = require('node:test');
const assert = require('node:assert/strict');

const { drawSpeechBubbles1 } = require('../src/templates/speech-bubbles');
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

function bubbleOf(slide) {
  return slide.shapes.find(
    (s) => s.type === 'roundRect' && s.options.fill && s.options.fill.color === COLOURS.pureWhite
  ).options;
}

function tailOf(slide) {
  return slide.shapes.find((s) => s.type === 'triangle').options;
}

function draw(speech) {
  const pptx = fakePptx();
  const slide = fakeSlide();
  drawSpeechBubbles1(pptx, slide, {
    title: 'Is Dev right?',
    speakers: [{ speech, name: 'Dev' }]
  }, { slideIndex: 6 });
  return slide;
}

test('a short claim gets a bubble that hugs it, not the whole column', () => {
  const short = draw('Clouds are made of invisible water vapour.');
  const long = draw(
    'Clouds are made of invisible water vapour, and the vapour stays invisible ' +
    'even when it cools, so what we see in the sky is really the gas itself, ' +
    'not droplets, which is why fog never feels wet on your skin and why a ' +
    'kettle makes no cloud above its spout however long it boils.'
  );
  const shortBubble = bubbleOf(short);
  const longBubble = bubbleOf(long);
  assert.ok(
    shortBubble.h < longBubble.h,
    `a two-line claim's bubble (${shortBubble.h}) should be shorter than a ten-line one's (${longBubble.h})`
  );
});

test('hugging keeps the bubble bottom fixed so the tail stays on the figure', () => {
  const short = draw('Clouds are made of invisible water vapour.');
  const bubble = bubbleOf(short);
  const tail = tailOf(short);
  const bubbleBottom = bubble.y + bubble.h;
  // The tail is drawn overlapping the bottom edge by 0.02".
  assert.ok(
    Math.abs(tail.y - (bubbleBottom - 0.02)) < 1e-6,
    `tail (${tail.y}) must sit on the hugged bubble bottom (${bubbleBottom})`
  );
});

test('the speech text is placed inside the hugged bubble', () => {
  const short = draw('Clouds are made of invisible water vapour.');
  const bubble = bubbleOf(short);
  const speechText = short.texts.find(
    (t) => String(t.value).includes('water vapour')
  );
  assert.ok(speechText.options.y >= bubble.y);
  assert.ok(speechText.options.y + speechText.options.h <= bubble.y + bubble.h + 1e-6);
});
