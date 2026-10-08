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

// The panel takes the width its picture's ink used, and the picture was then
// drawn again into that narrower panel, where some drawings come out smaller
// than they were measured: an example phrase needs more box than its own words
// to keep its size. "a tall tree" was measured at 38pt and printed at about
// 22pt beside a 36pt definition on a Year 2 card (stress test, 7 October 2026).
test('a short picture prints in its panel at the size the panel was measured for', () => {
  const inkWidth = (visual) => {
    const objects = slideFor([{ word: 'word', definition: 'What the word means.', visual }]);
    const [panel] = panels(objects);
    const inside = objects.filter((o) => o !== panel && o.options && typeof o.options.w === 'number' &&
      o.options.x >= panel.options.x - 0.01 && o.options.x + o.options.w <= panel.options.x + panel.options.w + 0.01);
    return Math.max(...inside.map((o) => o.options.w));
  };
  const phrase = inkWidth({ type: 'annotated-text', lines: ['a tall tree'],
    marks: [{ find: 'tall', style: 'highlight', colour: 'orange' }] });
  assert.ok(phrase > 2.9, `the example phrase should keep its measured 3.0in, drew ${phrase.toFixed(2)}in`);
  const tiles = inkWidth({ type: 'place-value-mini', mode: 'placeholder', number: '305' });
  assert.ok(tiles > 2.6, `the digit tiles should keep their measured 2.65in, drew ${tiles.toFixed(2)}in`);
});

// The type on a card with a picture was sized as if the picture took the widest
// panel there is, whatever it really drew at. Two Year 6 science cards, one with
// a small photograph, printed their definitions at 23pt in half-empty cards
// where the same two cards without the photograph printed them at 34pt (stress
// test, 7 October 2026). The type is sized against the panel the picture takes.
test('a small picture does not cost the cards their type size', () => {
  const words = (visual) => [
    { word: 'blood vessels', definition: 'Blood vessels are the tubes that carry blood all around your body.' },
    { word: 'arteries and veins', visual,
      definition: 'Arteries are blood vessels that carry blood away from your heart. Veins are blood vessels that carry it back.' }
  ];
  const defnSize = (objects) => objects.find((o) => o.text && o.text[0] && /^Arteries/.test(o.text[0].text)).options.fontSize;
  const small = defnSize(slideFor(words({ type: 'clock', time: '3:15' })));
  assert.ok(small >= 30, `beside a compact picture the definition should stay near its 34pt, printed at ${small}pt`);
  // A picture that really is wide still takes its room from the type.
  const wideObjects = slideFor(words({ type: 'numberline', start: 0, end: 20, interval: 10, labels: 'all' }));
  const [panel] = panels(wideObjects);
  const defn = wideObjects.find((o) => o.text && o.text[0] && /^Arteries/.test(o.text[0].text));
  assert.ok(defn.options.x + defn.options.w <= panel.options.x, 'the definition stops before a wide picture panel');
});

test('three picture cards keep readable type: the picture minimum does not send the words to the floor', () => {
  const objects = slideFor(['flower', 'stem', 'leaves'].map((word) => (
    { word, definition: `The ${word} is one part of a plant.`, visual: { type: 'triangle', kind: 'scalene' } })));
  const word = objects.find((o) => o.text && o.text[0] && o.text[0].text === 'flower');
  assert.ok(word.options.fontSize >= 30, `the word printed at ${word.options.fontSize}pt on a card with room for more`);
});
