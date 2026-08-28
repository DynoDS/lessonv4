'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');

const {
  stackLayout,
  drawStack
} = require('../src/content/stack');
const { drawRow } = require('../src/content/row');

const ZONE = {
  x: 1,
  y: 1,
  w: 4,
  h: 6,
  class: 'C'
};

test('ordinary stack keeps the old full-height top-aligned geometry', () => {
  const result = stackLayout(ZONE, {
    type: 'stack',
    items: [
      { type: 'text', value: 'One' },
      { type: 'text', value: 'Two' }
    ]
  });

  assert.equal(result.length, 2);
  assert.equal(result[0].zone.y, 1);
  assert.ok(
    Math.abs(
      result[result.length - 1].zone.y +
      result[result.length - 1].zone.h -
      7
    ) < 0.001
  );
});

test('centered compact stack uses one shared visual centre', () => {
  const result = stackLayout(ZONE, {
    type: 'stack',
    heightRatio: 0.5,
    verticalAlign: 'center',
    items: [
      { type: 'text', value: 'Open switch' },
      { type: 'text', value: 'Closed switch' }
    ]
  });

  const top = result[0].zone.y;
  const last = result[result.length - 1].zone;
  const bottom = last.y + last.h;

  assert.ok(top > ZONE.y);
  assert.ok(bottom < ZONE.y + ZONE.h);
  assert.ok(
    Math.abs(
      (top + bottom) / 2 -
      (ZONE.y + ZONE.h / 2)
    ) < 0.001
  );
});

test('bottom alignment spends all spare space above the group', () => {
  const result = stackLayout(ZONE, {
    type: 'stack',
    heightRatio: 0.5,
    verticalAlign: 'bottom',
    items: [
      { type: 'text', value: 'One' },
      { type: 'text', value: 'Two' }
    ]
  });

  const last = result[result.length - 1].zone;
  assert.ok(
    Math.abs(
      last.y + last.h -
      (ZONE.y + ZONE.h)
    ) < 0.001
  );
});

test('invalid stack alignment fields fail loudly', () => {
  assert.throws(
    () =>
      stackLayout(ZONE, {
        type: 'stack',
        heightRatio: 0.2,
        items: [{ type: 'text', value: 'Too small' }]
      }),
    /STACK_HEIGHT_RATIO_INVALID/
  );

  assert.throws(
    () =>
      stackLayout(ZONE, {
        type: 'stack',
        verticalAlign: 'middle-ish',
        items: [{ type: 'text', value: 'Bad align' }]
      }),
    /STACK_VERTICAL_ALIGN_INVALID/
  );
});

test('groupAccent draws one restrained group discriminator without changing child cards', () => {
  const shapes = [];
  const texts = [];
  const pptx = new PptxGenJS();
  const slide = {
    addShape: (kind, options) => shapes.push({ kind, ...options }),
    addText: (content, options) => texts.push({ content, ...options })
  };

  drawStack(
    pptx,
    slide,
    ZONE,
    {
      type: 'stack',
      groupAccent: 'purple',
      items: [
        { type: 'text', value: 'Flow one' },
        { type: 'text', value: 'Flow two' }
      ]
    },
    {
      slideIndex: 0,
      cardLook: true,
      imageDims: {}
    }
  );

  const accent = shapes.find(
    (shape) =>
      shape.fill &&
      shape.fill.color === '7030A0' &&
      shape.h < 0.1
  );

  assert.ok(accent);
  assert.ok(texts.length >= 2);
});

test('row groupAccent draws after the child content', () => {
  const events = [];
  const pptx = new PptxGenJS();
  const slide = {
    addShape: (kind, options) =>
      events.push({
        type: 'shape',
        fill: options.fill && options.fill.color,
        h: options.h
      }),
    addText: (content) =>
      events.push({
        type: 'text',
        content
      })
  };

  drawRow(
    pptx,
    slide,
    {
      x: 0,
      y: 0,
      w: 8,
      h: 2,
      class: 'A'
    },
    {
      type: 'row',
      groupAccent: 'blue',
      items: [
        { type: 'text', value: 'Open path' },
        { type: 'text', value: 'Lamp off' }
      ]
    },
    {
      slideIndex: 0,
      cardLook: false,
      imageDims: {}
    }
  );

  const last = events[events.length - 1];
  assert.equal(last.type, 'shape');
  assert.equal(last.fill, '0070C0');
  assert.ok(last.h < 0.1);
});
