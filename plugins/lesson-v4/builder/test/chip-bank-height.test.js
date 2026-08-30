'use strict';

// A word bank that will not fit its band must say so, not draw itself off the
// slide.
//
// The run this came from: a Year 4 starter stacked an instruction, a labelled
// diagram and a "Word bank" chip bank at weights 0.55 / 3.15 / 0.8. That left
// the bank a 0.81in band, of which the title took 0.5in, so five pills at the
// readable floor drew from 0.07in of room and carried on 0.35in past the
// bottom of the slide. Nothing errored, the deterministic slide check passed,
// and the visual reviewer recorded the word bank as "visible, correct and
// unobscured". Only the printed page disagreed.

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');

const { drawChipBank } = require('../src/content/chip-bank');

function collect() {
  const shapes = [];
  const texts = [];
  return {
    shapes,
    texts,
    slide: {
      addShape: (kind, options) => shapes.push({ kind, ...options }),
      addText: (content, options) => texts.push({ content, ...options })
    }
  };
}

const CHIPS = ['cell', 'wire', 'lamp', 'switch', 'buzzer'];

test('a bank with no room for one readable pill is refused by name', () => {
  const pptx = new PptxGenJS();
  const { slide } = collect();

  assert.throws(
    () =>
      drawChipBank(pptx, slide, { x: 0.22, y: 6.44, w: 12.89, h: 0.81, class: 'A' }, {
        type: 'chip-bank',
        title: 'Word bank',
        variant: 'yellow',
        maxRows: 1,
        chips: CHIPS
      }),
    /CHIP_BANK_HEIGHT_CAPACITY/
  );
});

test('the refusal names the shortfall and the height that would clear it', () => {
  const pptx = new PptxGenJS();
  const { slide } = collect();

  let message = '';
  try {
    drawChipBank(pptx, slide, { x: 0.22, y: 6.44, w: 12.89, h: 0.81, class: 'A' }, {
      type: 'chip-bank',
      title: 'Word bank',
      maxRows: 1,
      chips: CHIPS
    });
  } catch (err) {
    message = err.message;
  }

  // A designer repairing this needs the lever, not just the fact.
  assert.match(message, /0\.35in short/);
  assert.match(message, /"Word bank" title band/);
  assert.match(message, /at least 1\.16in/);
});

test('the same bank in the band the refusal asks for draws inside its zone', () => {
  const pptx = new PptxGenJS();
  const { shapes, slide } = collect();

  const zone = { x: 0.22, y: 6.09, w: 12.89, h: 1.16, class: 'A' };
  drawChipBank(pptx, slide, zone, {
    type: 'chip-bank',
    title: 'Word bank',
    variant: 'yellow',
    maxRows: 1,
    chips: CHIPS
  });

  const pills = shapes.filter((s) => s.rectRadius !== undefined);
  assert.equal(pills.length, CHIPS.length);
  for (const pill of pills) {
    assert.ok(
      pill.y + pill.h <= zone.y + zone.h + 0.005,
      `pill bottom ${pill.y + pill.h} escaped zone bottom ${zone.y + zone.h}`
    );
  }
});

test('an untitled bank with room to spare is untouched', () => {
  const pptx = new PptxGenJS();
  const { shapes, slide } = collect();

  const zone = { x: 1, y: 1, w: 8, h: 2.4, class: 'C' };
  drawChipBank(pptx, slide, zone, {
    type: 'chip-bank',
    chips: ['add', 'subtract', 'multiply']
  });

  const pills = shapes.filter((s) => s.rectRadius !== undefined);
  assert.equal(pills.length, 3);
  for (const pill of pills) {
    assert.ok(pill.y >= zone.y);
    assert.ok(pill.y + pill.h <= zone.y + zone.h + 0.005);
  }
});

test('a row-count refusal still reports as a row-count refusal', () => {
  const pptx = new PptxGenJS();
  const { slide } = collect();

  assert.throws(
    () =>
      drawChipBank(pptx, slide, { x: 1, y: 1, w: 2.2, h: 3, class: 'C' }, {
        type: 'chip-bank',
        maxRows: 1,
        chips: ['photosynthesis', 'transpiration', 'pollination', 'germination']
      }),
    /CHIP_BANK_ROW_CAPACITY/
  );
});
