'use strict';

// THE circuit symbol bank, as a picture every surface can place: the board, the
// worksheet, the working wall and the stick-in pack.
//
// Its drawing stays where it was, beside the circuit in circuit-diagram-svg.js,
// so a lamp in the key and a lamp in the loop a child copies it from are drawn
// by the same lines and cannot disagree. This file only names that drawing as
// a picture of its own, in the shape every surface's placer asks for
// (tightSvg, cacheKey). Until 13 September 2026 only the board could show the
// bank, and it called the drawing by a name no other surface looked for, so a
// sheet or a wall card that needed the symbol key had nothing to draw it with.
//
//   tightSvg(spec) -> { svg, aspect, w, h }   one cell per symbol, name beneath
//   cacheKey(spec) -> string
//
// Spec: { items: [{ symbol, label }] }, 2 to 6 entries; `symbol` is one of
// cell, lamp, wire, switch-open, switch-closed. See references/templates.md.

const { symbolBankSvg, symbolBankCacheKey, normaliseSymbolBank } = require('./circuit-diagram-svg');

module.exports = {
  tightSvg: symbolBankSvg,
  cacheKey: symbolBankCacheKey,
  normalise: normaliseSymbolBank,
};
