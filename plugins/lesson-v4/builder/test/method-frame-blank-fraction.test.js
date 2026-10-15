'use strict';

// A fraction with a part to write is drawn top and bottom in a method frame.
// On 12 October 2026 a Year 5 deck showed "3/4 =" stacked, then a box, then
// "/8" typed beside it, on five slides: the line was cut at the blank before
// anything looked for a fraction. The teacher, 13 October 2026: the box sits
// on the bar; a whole fraction to write is a box over a box in Years 1 to 4
// and one tall box in Years 5 and 6.

const assert = require('node:assert/strict');
const test = require('node:test');

const { drawMethodFrame, setYearGroup } = require('../src/content/method-frame');
const { tokenizeWriteInContent } = require('../src/answer-box');

const ZONE = { x: 0, y: 0, w: 6, h: 3, class: 'A' };

function capture(data) {
  const shapes = [];
  const texts = [];
  const slide = {
    addShape: (kind, options) => shapes.push({ kind, ...options }),
    addText: (content, options) => texts.push({ content: String(content), ...options }),
    addImage: () => {}
  };
  const font = drawMethodFrame({ shapes: { RECTANGLE: 'rect', ROUNDED_RECTANGLE: 'rrect', OVAL: 'oval', LINE: 'line' } }, slide, ZONE, data);
  return { shapes, texts, font, boxes: shapes.filter((s) => s.kind === 'rect'), bars: shapes.filter((s) => s.kind === 'line') };
}

test('a blank and its slash are one fraction, either way up, and a whole one too', () => {
  assert.deepEqual(tokenizeWriteInContent('3/4 = ___/8'), [{ text: '3/4 = ' }, { frac: { top: null, bottom: '8' } }]);
  assert.deepEqual(tokenizeWriteInContent('3/___ = 6/8'), [{ frac: { top: '3', bottom: null } }, { text: ' = 6/8' }]);
  assert.deepEqual(tokenizeWriteInContent('___/___'), [{ frac: { top: null, bottom: null } }]);
  assert.deepEqual(tokenizeWriteInContent('□/10'), [{ frac: { top: null, bottom: '10' } }]);
});

test('whole numbers, typed fractions and dates are left as they were', () => {
  assert.deepEqual(tokenizeWriteInContent('3 + ___ = 9'), [{ text: '3 + ' }, { box: true }, { text: ' = 9' }]);
  assert.deepEqual(tokenizeWriteInContent('3/4 ___ 5/8'), [{ text: '3/4 ' }, { box: true }, { text: ' 5/8' }]);
  assert.deepEqual(tokenizeWriteInContent('___ on 9/10/2026'), [{ box: true }, { text: ' on 9/10/2026' }]);
});

test('a missing numerator is a box, a bar under it, and the denominator under the bar', () => {
  const { boxes, bars, texts } = capture({ lines: [{ label: 'In eighths:', content: '3/4 = ___/8' }] });
  assert.equal(boxes.length, 1);
  assert.equal(bars.length, 1);
  const eight = texts.find((t) => t.content === '8');
  assert.ok(eight, 'the 8 is printed on its own');
  assert.ok(!texts.some((t) => t.content.includes('/8')), 'no "/8" is typed on the line');
  assert.ok(boxes[0].y + boxes[0].h <= bars[0].y + 1e-6, 'the box is above the bar');
  assert.ok(eight.y + eight.h / 2 > bars[0].y, 'the 8 is below it');
  assert.ok(Math.abs((eight.x + eight.w / 2) - (boxes[0].x + boxes[0].w / 2)) < 1e-6, 'and centred under the box');
});

test('a whole fraction to write: two boxes and a bar for Year 3, one tall box for Year 5', () => {
  const data = { lines: [{ content: '2/3 = ___/___' }] };
  setYearGroup('Year 3');
  const young = capture(data);
  assert.equal(young.boxes.length, 2);
  assert.equal(young.bars.length, 1);
  setYearGroup('Year 5');
  const old = capture(data);
  assert.equal(old.boxes.length, 1);
  assert.equal(old.bars.length, 0);
  assert.ok(old.boxes[0].h > old.boxes[0].w, 'tall enough to write a fraction in');
  setYearGroup(undefined);
  assert.equal(capture(data).boxes.length, 2, 'no year group takes the two boxes');
  assert.equal(capture({ ...data, fractionBlank: 'tall' }).boxes.length, 1, 'a frame that says so keeps its own');
});

test('a line with a fraction to finish is given the height it needs', () => {
  const plain = capture({ lines: [{ content: '3 + ___ = 9' }, { content: '4 + ___ = 9' }] });
  const frac = capture({ lines: [{ content: '3/4 = ___/8' }, { content: '1/2 = ___/8' }] });
  const span = (c) => Math.max(...c.shapes.filter((s) => s.kind === 'rrect').map((s) => s.h / c.font));
  assert.ok(span(frac) > span(plain), 'the panel is taller for its size');
});
