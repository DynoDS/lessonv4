'use strict';

// A criteria box takes the width its words need, and the work beside it the
// rest (the teacher, 16 October 2026, of a Year 3 RE slide: the narrower box
// "looks way better and there's more space for everything else", because its
// lines fill their cards with hardly any dead space).

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawSlide } = require('../src/templates');
const { withoutRecording } = require('../src/warnings');

function drawn(slideData) {
  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  withoutRecording(() => drawSlide(pptx, slide, slideData, {
    slideIndex: 0, cardLook: true, lesson: { subject: 're' }, imageDims: {},
  }));
  const objects = slide._slideObjects;
  const panel = objects.find((o) => o.options && o.options.fill && o.options.fill.color === 'D5F5E3');
  const fonts = objects
    .filter((o) => o._type === 'text' && /step-(text|reference)/.test(String((o.options || {}).objectName || '')))
    .map((o) => o.options.fontSize);
  const work = objects.find((o) => o._type === 'text' && o.text && JSON.stringify(o.text).includes('WORK'));
  return { w: panel.options.w, x: panel.options.x, font: Math.min(...fonts), workW: work ? work.options.w : null };
}

const split = (steps, extra = {}) => Object.assign({
  template: 'split-h-60-40', primarySide: 'left', title: 'Why is Diwali called the festival of light?',
  primary: { type: 'text', value: 'WORK' },
  secondary: { type: 'sc-panel', content: { type: 'steps', steps } },
}, extra);

const DIWALI = [
  'Say what Hindus light at {{Diwali}}.',
  'Tell <<the part of the story>> where people lit lamps.',
  'Say what the light shows about good and {{evil}}.',
];
const ADVERBIALS = [
  'Write the {{adverbial}} first, with a capital letter.',
  'Put a comma <<after the whole>> {{adverbial}}.',
  "Write the rest of the sentence. Start with a small letter, unless it's a name.",
  'Cover everything up to the comma. <<Is the rest a whole sentence?>>',
];

test('a box whose lines leave white at their ends narrows, and the work takes the room', () => {
  const now = drawn(split(DIWALI));
  assert.ok(now.w < 5.0, `the Diwali box stayed ${now.w.toFixed(2)}in`);
  assert.ok(now.font >= 20, `its steps came out at ${now.font}pt`);
  // The box keeps its outer edge; the work side widens by what it gave up.
  assert.ok(Math.abs(now.x + now.w - (13.333 - 0.22 - 0)) < 0.3, 'the box moved off the slide edge');
  assert.ok(now.workW > 7.5, `the work side is only ${now.workW}in`);
});

test('a box whose lines already fill their cards keeps its width', () => {
  const now = drawn(split(ADVERBIALS));
  assert.ok(now.w > 5.0, `the adverbials box narrowed to ${now.w.toFixed(2)}in`);
});

test('a box holding a table as well as steps is left as wide as it was given', () => {
  const now = drawn(split(DIWALI, {
    template: 'split-h-50-50',
    secondary: { type: 'sc-panel', content: { type: 'stack', items: [
      { type: 'steps', steps: DIWALI },
      { type: 'table', headers: ['Word', 'What it means'], rows: [['diva', 'a small clay lamp'], ['evil', 'very bad']] },
    ] } },
  }));
  assert.ok(now.w > 6.2, `the box with a table narrowed to ${now.w.toFixed(2)}in`);
});

test('a live-drawing cue keeps the room it needs beside the heading', () => {
  const now = drawn(split(DIWALI, { secondary: { type: 'sc-panel', flipchart: true, content: { type: 'steps', steps: DIWALI } } }));
  assert.ok(now.w >= 4.4, `a box with the easel narrowed to ${now.w.toFixed(2)}in`);
});
