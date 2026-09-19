'use strict';
// A pair settles against what a container actually draws, not against its zone.
//
// `measureContentExtent` declines a stack or a row on purpose: a fill text
// beside a stack is meant to keep the whole zone precisely because its partner
// cannot be measured. That reason is about the fill text, and the pass was using
// the same refusal to decide where the OTHER side sits, so a photograph beside a
// short stack centred on the empty zone rather than on the cards and sat visibly
// low (the estimate slide, 19 September 2026).
const test = require('node:test');
const assert = require('node:assert/strict');
const { alignSplitHPair } = require('../src/split-pair');

const ctx = { cardLook: true };
const zones = () => ({
  primary: { x: 0.22, y: 0.6, w: 7.6, h: 6.5, class: 'C' },
  secondary: { x: 8.0, y: 0.6, w: 5.1, h: 6.5, class: 'D' }
});
const shortStack = { type: 'stack', items: [{ type: 'text', value: 'One.' }, { type: 'text', value: 'Two.' }] };
const shortText = { type: 'text', value: 'Short.' };
const fillText = { type: 'text', value: 'Short.', heightMode: 'fill' };

test('a short partner centres on the cards, not on the empty zone', () => {
  const z = zones();
  alignSplitHPair(z.primary, shortStack, z.secondary, shortText, ctx);
  // Centred on two short cards, so high up the zone. Centred on the zone it
  // would sit near the middle of the slide with the cards far above it.
  assert.ok(z.secondary.y < 2.0, `partner landed at ${z.secondary.y}`);
  assert.ok(z.secondary.y > 0.6, 'it still moves down from the top');
});

test('a fill text beside a container still keeps the whole zone', () => {
  // The behaviour the narrow measure exists to protect. Spanning is decided by
  // the narrow answer, so nothing a container reports can shrink a fill text.
  const z = zones();
  alignSplitHPair(z.primary, shortStack, z.secondary, fillText, ctx);
  assert.equal(z.secondary.h, 6.5);
});

test('a container is never itself moved', () => {
  // Shifting a stack's zone would change how it lays its own items out, so the
  // broad measure is read for the partner's sake only.
  const z = zones();
  alignSplitHPair(z.primary, shortStack, z.secondary, shortText, ctx);
  assert.equal(z.primary.y, 0.6);
  assert.equal(z.primary.h, 6.5);
});

test('two unmeasurable sides leave the pair exactly as it was', () => {
  const z = zones();
  const panel = { type: 'sc-panel', content: [] };
  alignSplitHPair(z.primary, panel, z.secondary, panel, ctx);
  assert.equal(z.primary.y, 0.6);
  assert.equal(z.secondary.y, 0.6);
});
