'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const frame = require('../../shared/visuals/geographical-description-frame-svg');
const slideFrame = require('../src/content/geographical-description-frame');
const { VISUALS } = require('../../stick-in-sheets-html/src/visual-registry');

test('task form keeps all three response spaces blank with the required geography prompts', () => {
  const { svg, layout } = frame.tightSvg({
    answers: { biome: 'Tropical rainforest', location: 'South America', features: 'Hot and wet' },
  });
  assert.match(svg, />Biome</);
  assert.match(svg, />Location</);
  assert.match(svg, />Features from evidence</);
  assert.match(svg, /What does biome mean\? Give one example\./);
  assert.match(svg, /Name the continent and more than one country\./);
  assert.match(svg, /Describe two features\. Link each one to map or photograph evidence\./);
  assert.doesNotMatch(svg, /Tropical rainforest|South America|Hot and wet/);
  assert.equal(layout.panels.length, 3);
});

test('answer content is opt-in and uses the answer colour', () => {
  const { svg } = frame.tightSvg({
    mode: 'answer',
    answers: { biome: 'A large region with a shared climate and living things.' },
  });
  assert.match(svg, /A large region with a shared climate/);
  assert.match(svg, /#00B050/);
});

test('long custom prompts and uneven response spaces remain inside separate panels', () => {
  const spec = {
    prompts: {
      biome: 'Explain carefully what geographers mean by biome and include one accurately named example.',
      location: 'Identify the continent, then name more than one country shown by the evidence on the map.',
      features: 'Describe two different features and connect each claim directly to something visible in a map or photograph.',
    },
    responseLines: { biome: 1, location: 3, features: 5 },
    responseHeights: { location: 180 },
  };
  const layout = frame.describeLayout(spec);
  for (const panel of layout.panels) {
    assert.ok(panel.x >= 0 && panel.y >= 0);
    assert.ok(panel.x + panel.w <= layout.w);
    assert.ok(panel.y + panel.h <= layout.h);
    assert.ok(panel.prompt.x + panel.prompt.w <= panel.x + panel.w);
    assert.ok(panel.response.y + panel.response.h <= panel.y + panel.h);
  }
  for (let i = 1; i < layout.panels.length; i++) {
    assert.ok(layout.panels[i - 1].y + layout.panels[i - 1].h < layout.panels[i].y);
  }
  assert.equal(layout.panels[1].response.h, 180);
});

test('nested per-section fields are accepted and cache keys change with content', () => {
  const a = { biome: { heading: 'Biome', prompt: 'Define it.', responseLines: 3 } };
  const b = { biome: { heading: 'Biome', prompt: 'Define it precisely.', responseLines: 3 } };
  assert.equal(frame.normalise(a).sections[0].responseLines, 3);
  assert.notEqual(frame.cacheKey(a), frame.cacheKey(b));
});

test('slide pre-render discovers the helper and prepares a true-aspect image', async () => {
  const spec = { type: 'geographical-description-frame', responseLines: { features: 4 } };
  const images = await slideFrame.preRenderGeographicalDescriptionFrames({ slides: [{ content: spec }] });
  const entry = images[frame.cacheKey(spec)];
  assert.ok(entry && Buffer.isBuffer(entry.png));
  assert.equal(entry.aspect, frame.tightSvg(spec).aspect);
});

test('stick-in registry forces the blank task form even when answer content is copied in', () => {
  const def = VISUALS['geographical-description-frame'];
  assert.ok(def);
  const spec = def.specFn({ mode: 'answer', showAnswers: true, answers: { biome: 'DO NOT PRINT' } });
  const { svg } = def.tightSvg(spec);
  assert.doesNotMatch(svg, /DO NOT PRINT/);
  assert.match(svg, />Biome</);
  assert.equal(def.defaultWidthMm, 145);
});
