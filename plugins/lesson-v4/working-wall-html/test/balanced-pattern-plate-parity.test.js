'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const shared = require('../../shared/visuals/balanced-pattern-plate-svg');
const slide = require('../../builder/src/content/balanced-pattern-plate');
const wall = require('../src/svg-renderer');
const { VISUAL_KEY_FNS } = require('../src/visuals');

const SPEC = {
  type: 'balanced-pattern-plate',
  mode: 'teaching',
  caption: 'Balance the pattern across a day or over a week',
};

test('slide and wall adapters use the exact shared geometry and cache key', () => {
  assert.equal(slide.balancedPatternPlateKey, shared.cacheKey);
  assert.equal(wall.balancedPatternPlateKey, shared.cacheKey);
  assert.equal(wall.balancedPatternPlateTightSvg, shared.tightSvg);
  assert.equal(VISUAL_KEY_FNS['balanced-pattern-plate'], shared.cacheKey);
  assert.equal(wall.balancedPatternPlateTightSvg(SPEC).svg, shared.tightSvg(SPEC).svg);
});

test('working-wall pre-render keeps the shared aspect and measured teaching labels', async () => {
  const rendered = await wall.preRenderSvgs({ cards: [{ visual: SPEC }] });
  const entry = rendered[shared.cacheKey(SPEC)];
  const built = shared.tightSvg(SPEC);
  assert.ok(entry && entry.png.length > 0);
  assert.equal(entry.aspect, built.aspect);
  assert.match(built.svg, /Fruit and vegetables/);
  assert.match(built.svg, /Starchy[\s\S]*carbohydrates/);
  assert.match(built.svg, /across a day or over a week/);
});
