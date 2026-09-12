'use strict';

// A vocabulary card refuses nothing the deck can draw.
//
// It used to accept fourteen picture types and drop everything else with a
// warning, so a Year 4 vocabulary slide about intervals was hand-built from free
// stacks because the card would not take a number line (12 September 2026).
// Daniel's ruling: the cards should not refuse anything. The card now sizes the
// picture to itself instead of the picture to a fixed 2.2" panel.

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');

const { ZONE_COMPAT } = require('../src/content/index');
const { resolveVocabVisual } = require('../src/content/vocab');
const { drawKeyVocabulary } = require('../src/templates/key-vocabulary');

function slideFor(words) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'W', width: 13.333, height: 7.5 });
  pptx.layout = 'W';
  const slide = pptx.addSlide();
  drawKeyVocabulary(pptx, slide, { words }, { slideIndex: 0, cardLook: true });
  return slide._slideObjects;
}

const panels = (objects) => objects.filter((o) => o.options && o.options.fill && o.options.fill.color === 'F2F2F2');

test('every content type the deck can draw is accepted on a vocabulary card', () => {
  const refused = Object.keys(ZONE_COMPAT).filter((type) => {
    const visual = type === 'text' ? { type, value: 'abc' } : { type };
    return type !== 'image' && resolveVocabVisual(visual) !== visual;
  });
  assert.deepEqual(refused, [], `the vocabulary card refused: ${refused.join(', ')}`);
});

test('the panel is as wide as the picture draws: a clock stays compact, a number line takes its length', () => {
  const objects = slideFor([
    { word: 'quarter past', definition: 'Fifteen minutes after the hour.', visual: { type: 'clock', time: '3:15' } },
    { word: 'interval', definition: 'The space between two neighbouring marks.',
      visual: { type: 'numberline', start: 0, end: 20, interval: 10, labels: 'all', highlight: { from: 0, to: 10 } } }
  ]);
  const [clock, line] = panels(objects);
  assert.ok(clock.options.w < line.options.w, `clock panel ${clock.options.w.toFixed(2)}in, number line ${line.options.w.toFixed(2)}in`);
  assert.ok(line.options.w > 4, 'a number line gets the length it reads along');
});

test('a picture made of words and parts goes under the word at full width', () => {
  const objects = slideFor([
    { word: 'tally', definition: 'A mark for each thing counted.',
      visual: { type: 'table', headers: ['Pet', 'Tally'], rows: [['Dog', 'IIII'], ['Cat', 'II']] } }
  ]);
  const [panel] = panels(objects);
  assert.ok(panel.options.w > 12, `a table panel should span the card, got ${panel.options.w.toFixed(2)}in`);
});

test('two full-width pictures that cannot both be read on one slide stop the build by name, never draw blank', () => {
  const chart = { type: 'bar-chart', title: 'Favourite fruit', categories: ['Apple', 'Pear'], values: [4, 6], y_interval: 2 };
  assert.throws(
    () => slideFor([
      { word: 'bar chart', definition: 'A chart with bars.', visual: chart },
      { word: 'table', definition: 'Rows and columns.', visual: { type: 'table', headers: ['A', 'B'], rows: [['1', '2'], ['3', '4'], ['5', '6']] } },
      { word: 'axis', definition: 'The line a scale is read along.', visual: chart }
    ]),
    /VOCAB_PICTURES_TOO_BIG_FOR_ONE_SLIDE/
  );
});
