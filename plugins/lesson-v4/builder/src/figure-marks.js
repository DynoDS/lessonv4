'use strict';

// A taught word's braces never print from a figure on the board (the colours
// release's third check, 25 September 2026). A figure's words are drawn into
// its picture by a shared drawing, which prints `{{enamel}}` as written, and
// the board's own check for leftover marks reads only slide text, never a
// picture. So the braces come off every figure in the lesson once, before it
// is pre-rendered or drawn, and a picture and the key it is filed under
// agree. A figure is anything the parity manifest lists for the board, but
// the callout and the word bank, which are board text and draw their marks.
//
// A caption the board sets under a picture as text, through `answer-text.js`,
// keeps its mark and prints the word green, as it always did: the `label` of
// the figures whose helpers read it that way.

const { PRIMITIVES } = require('../../shared/visual-parity');
const { withoutTaughtMarks } = require('../../shared/text/criteria-marks');
const { FIGURES: CAPTIONED } = require('./content/shared-figure');

const BOARD_TEXT = new Set(['callout', 'chip-bank']);

const FIGURE_TYPES = new Set(
  PRIMITIVES.flatMap((p) => [].concat(p.slides || [])).filter((type) => type && !BOARD_TEXT.has(type))
);

// The helpers that set a figure's `label` under it through answer-text.
const MARKED_CAPTION_TYPES = new Set([
  'angle', 'carroll', 'geoboard', 'line-pair', 'rainforest-layers', 'reflection-grid',
  'translation-shape', 'triangle', 'venn',
  ...Object.keys(CAPTIONED).filter((type) => CAPTIONED[type] && CAPTIONED[type].caption)
]);

function withoutFigureMarks(node) {
  if (Array.isArray(node)) return node.map(withoutFigureMarks);
  if (!node || typeof node !== 'object' || Object.getPrototypeOf(node) !== Object.prototype) return node;
  if (typeof node.type === 'string' && FIGURE_TYPES.has(node.type)) {
    const plain = withoutTaughtMarks(node);
    if (plain !== node && MARKED_CAPTION_TYPES.has(node.type) && node.label !== undefined) {
      return Object.assign({}, plain, { label: node.label });
    }
    return plain;
  }
  let changed = false;
  const out = {};
  for (const [key, inner] of Object.entries(node)) {
    out[key] = withoutFigureMarks(inner);
    if (out[key] !== inner) changed = true;
  }
  return changed ? out : node;
}

module.exports = { withoutFigureMarks, FIGURE_TYPES, MARKED_CAPTION_TYPES };
