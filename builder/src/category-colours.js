'use strict';

const { COLOURS } = require('./styles');

// Category colour is a border language, not a free-form paint picker. Keeping
// the keys small and named lets the designer repeat one category consistently
// while keeping green reserved for answers and vocabulary.
const CATEGORY_COLOURS = Object.freeze({
  blue: COLOURS.title,
  orange: COLOURS.orange,
  purple: COLOURS.lo
});

const CATEGORY_COLOUR_KEYS = Object.freeze(Object.keys(CATEGORY_COLOURS));

// These helpers already draw their own surface, or in the case of steps draw
// their own per-item cards. A categoryColor on the object would be silently
// ignored by the shared outer-card seam, so validation rejects it. If the whole
// block is genuinely one category, wrap it in a row or stack and put
// categoryColor on that container instead.
const CATEGORY_COLOUR_BLOCKED_TYPES = Object.freeze([
  'blank-surface',
  'callout',
  'chip-bank',
  'method-frame',
  'money',
  'numbered-questions',
  'question-cards',
  'sc-panel',
  'steps',
  'vocab'
]);

function categoryColourFor(value) {
  if (typeof value !== 'string') return null;
  return CATEGORY_COLOURS[value.trim().toLowerCase()] || null;
}

module.exports = {
  CATEGORY_COLOURS,
  CATEGORY_COLOUR_KEYS,
  CATEGORY_COLOUR_BLOCKED_TYPES,
  categoryColourFor
};
