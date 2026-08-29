'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { GROUPS, tightSvg } = require('../../shared/visuals/balanced-pattern-plate-svg');

test('the plate keeps the intended broad proportions', () => {
  const shares = Object.fromEntries(GROUPS.map(group => [group.key, group.share]));
  const total = GROUPS.reduce((sum, group) => sum + group.share, 0);
  assert.ok(Math.abs(total - 1) < 1e-9);
  assert.ok(shares['fruit-vegetables'] > shares.protein);
  assert.ok(shares['starchy-carbohydrates'] > shares['dairy-alternatives']);
  assert.ok(shares['oils-spreads'] < shares['dairy-alternatives']);
});

test('teaching mode includes neutral labels, varied examples, water and the over-time caption', () => {
  const { svg } = tightSvg({ mode: 'teaching' });
  for (const text of [
    'Fruit and vegetables', 'Starchy carbohydrates', 'Protein foods',
    'Oils and spreads', 'Water',
    'across a day or over time',
    'apple', 'rice', 'beans', 'milk'
  ]) assert.match(svg, new RegExp(text));
  assert.match(svg, /Dairy or[\s\S]*alternatives/);
  assert.match(svg, /Foods high in fat,[\s\S]*salt or sugar/);
  assert.doesNotMatch(svg, /calorie|weight[- ]?loss|bad food/i);
});

test('practice mode preserves all five sectors and replaces only ungiven groups with decision spaces', () => {
  const teaching = tightSvg({ mode: 'teaching' }).svg;
  const practice = tightSvg({
    mode: 'practice',
    givenGroups: ['fruit-vegetables', 'starchy-carbohydrates']
  }).svg;
  const sectorCount = svg => (svg.match(/<path d="M 360\.00 370\.00 L/g) || []).length;
  assert.equal(sectorCount(teaching), 5);
  assert.equal(sectorCount(practice), 5);
  assert.match(practice, /stroke-dasharray="14 10"/);
  assert.match(practice, /Fruit and vegetables/);
  assert.doesNotMatch(practice, />Protein foods</);
});
