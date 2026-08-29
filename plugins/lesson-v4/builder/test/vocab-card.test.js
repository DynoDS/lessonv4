'use strict';

// The Key Vocabulary card, and the two ways it used to read as machine-made.
//
// It pinned its text at 16pt with shrink-only autofit while every other text
// surface grew through the fit pass, so a one-word card sat in a wide cream
// box with small type and dead space either side - Daniel measured the same
// box holding 40pt before the text outgrew it. And it joined word to
// definition with an em dash, which is not part of this teacher's written
// voice anywhere a child reads (references/preferences.md, Written Voice).

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawVocab } = require('../src/content/vocab');

function drawn(zone, data) {
  const shapes = [];
  const texts = [];
  const pptx = new PptxGenJS();
  const slide = {
    addShape: (kind, opts) => shapes.push({ kind, ...opts }),
    addText: (content, opts) => texts.push({ content, ...opts }),
    addImage: () => {},
  };
  drawVocab(pptx, slide, zone, data, null);
  return { shapes, texts };
}

const ZONE = { x: 0.4, y: 1.0, w: 9.2, h: 1.6 };

test('vocab text grows through the fit pass instead of pinning at 16pt', () => {
  const { texts } = drawn(ZONE, {
    words: [{ word: 'biome', definition: 'a large area with a similar climate, landscape, plants and animals' }],
  });
  assert.equal(texts.length, 1);
  const row = texts[0];

  // Written at the ceiling with shrink autofit, and named into the grow-fit
  // pass, exactly the way the question cards and body text already are. A
  // fixed small size here is the bug this test exists to keep out.
  assert.ok(row.fontSize >= 40, `fontSize ${row.fontSize} should be the grow ceiling`);
  assert.match(String(row.objectName), /^GROWFIT__/);
  assert.match(String(row.objectName), /__40__/);
});

test('every row of one card shares one fit group, so the set lands on one size', () => {
  const { texts } = drawn(ZONE, {
    words: [
      { word: 'biome', definition: 'a large area with a similar climate' },
      { word: 'climate', definition: 'the usual weather of a place over many years' },
    ],
  });
  assert.equal(texts.length, 2);
  const groupOf = (name) => String(name).split('__')[1];
  assert.equal(groupOf(texts[0].objectName), groupOf(texts[1].objectName));
});

test('word and definition join with a colon, never an em dash', () => {
  const { texts } = drawn(ZONE, {
    words: [{ word: 'Equator', definition: 'an invisible line around the middle of Earth' }],
  });
  const runs = texts[0].content;
  const joined = runs.map((r) => r.text).join('');
  assert.ok(!joined.includes('—'), 'no em dash reaches a child');
  assert.ok(!joined.includes('–'), 'no en dash either');
  assert.equal(joined, 'Equator: an invisible line around the middle of Earth');
  // The word keeps its vocabulary green; the definition stays body ink.
  assert.equal(runs[0].options.color, '00B050');
});
