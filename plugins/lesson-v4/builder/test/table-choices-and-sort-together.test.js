'use strict';

// The Do board's material, drawn as the teacher sketched it on 5 November 2026:
// a comparison table whose last column is answered by circling `same` or
// `different`, with the row done with the class shown ringed and every other
// row printing both choices; and a sort whose card placed with the class shows
// its letter in its place.

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');

const { drawTable, columnWidths } = require('../src/content/table');
const { drawSortBoard } = require('../src/content/sort-board');

function collect() {
  const shapes = [];
  const texts = [];
  return {
    shapes,
    texts,
    slide: {
      addShape: (kind, options) => shapes.push({ kind, ...options }),
      addText: (content, options) => texts.push({ content, ...options }),
    },
  };
}

const ZONE = { x: 0.5, y: 1, w: 12, h: 4 };
const CHOICES = ['same', 'different'];

function plain(content) {
  return Array.isArray(content) ? content.map((run) => run.text).join('') : String(content);
}

test('a choice cell prints every choice, and only the row done together is ringed', () => {
  const pptx = new PptxGenJS();
  const { slide, shapes, texts } = collect();
  drawTable(pptx, slide, ZONE, {
    headers: ['What they need', 'The Tikuna', 'Same or different?'],
    rows: [
      ['water', 'From the river.', { choices: CHOICES, circled: 'different' }],
      ['food', 'Lots of fish from the river.', { choices: CHOICES, circled: null }],
    ],
  }, {});
  const words = texts.map((t) => plain(t.content));
  assert.equal(words.filter((w) => w === 'same').length, 2, 'both rows print `same`');
  assert.equal(words.filter((w) => w === 'different').length, 2, 'both rows print `different`');
  const rings = shapes.filter((s) => /-ring$/.test(s.objectName || ''));
  assert.equal(rings.length, 1, 'one ring, on the row done together');
  assert.equal(rings[0].line.color, '7030A0', 'the together row is a worked example, in purple');
});

test('an answer slide rings the circled choice in green', () => {
  const pptx = new PptxGenJS();
  const { slide, shapes } = collect();
  drawTable(pptx, slide, ZONE, {
    headers: ['What they need', 'Same or different?'],
    rows: [['food', { choices: CHOICES, circled: '||different' }]],
  }, {});
  const rings = shapes.filter((s) => /-ring$/.test(s.objectName || ''));
  assert.equal(rings.length, 1);
  assert.equal(rings[0].line.color, '00B050');
});

test('a choice column is sized to its longest choice, not to the choices joined', () => {
  const desc = 'A small stream runs by their village, deep in the forest.';
  const choiceRows = [[desc, { choices: CHOICES }]];
  const wordRows = [[desc, 'different']];
  assert.deepEqual(columnWidths(['Clue', 'Same?'], choiceRows, 8, 0.8),
    columnWidths(['Clue', 'Same?'], wordRows, 8, 0.8));
});

test('the card sorted with the class prints its letter in its place, in purple', () => {
  const pptx = new PptxGenJS();
  const { slide, texts } = collect();
  drawSortBoard(pptx, slide, { x: 0.5, y: 1, w: 12, h: 5 }, {
    bank: [{ label: 'A', text: 'Sweep the rotting rubbish out of the yard.' },
           { label: 'B', text: 'Boil the water before drinking it.' }],
    groups: [{ label: 'They would try it', together: 'A' }, { label: 'They would not try it' }],
  }, {});
  const together = texts.filter((t) => /^sort-together-/.test(t.objectName || ''));
  assert.equal(together.length, 1);
  assert.equal(plain(together[0].content), 'A');
  assert.equal(together[0].color, '7030A0');
});
