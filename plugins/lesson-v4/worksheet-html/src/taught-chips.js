"use strict";

// A word-bank chip that is one of the lesson's taught words is green, without
// anyone having to remember to say so.
//
// On the board a taught word in a bank is written `{{stem}}` and prints green
// (the teacher, 24 September 2026). The sheet follows the board (9 October
// 2026), and the lesson design already lists the taught words, so the build
// marks a chip that IS one of them itself. A designer may still write the
// braces, for a taught word spelled differently from the design's term; a chip
// that is only a choice ("at bedtime") matches nothing and stays black.
//
// Matching is deliberately plain: the whole chip against the whole term,
// ignoring capitals, and allowing a final "s" either way ("diva lamps" for
// "diva lamp"). A chip that merely contains a taught word is a phrase to choose
// from, not the word.

const key = (text) => String(text == null ? "" : text).trim().toLowerCase().replace(/\s+/g, " ");
const forms = (text) => {
  const k = key(text);
  return k ? [k, k.endsWith("s") ? k.slice(0, -1) : `${k}s`] : [];
};

function taughtTerms(design) {
  const terms = new Set();
  const list = design && Array.isArray(design.vocabulary) ? design.vocabulary : [];
  for (const entry of list) for (const form of forms(entry && entry.term)) terms.add(form);
  return terms;
}

const marked = (word) => /^\{\{[\s\S]+\}\}$/.test(String(word).trim());

// Returns the worksheet spec with each taught chip written `{{word}}`, and how
// many were marked. The spec passed in is not changed.
function withTaughtChips(worksheet, design) {
  const terms = taughtTerms(design);
  if (!terms.size) return { spec: worksheet, marked: 0 };
  let count = 0;
  const mark = (chip) => {
    const word = chip && typeof chip === "object" ? chip.word : chip;
    if (typeof word !== "string" || marked(word) || !terms.has(key(word))) return chip;
    count++;
    const braced = `{{${word.trim()}}}`;
    return chip && typeof chip === "object" ? { ...chip, word: braced } : braced;
  };
  const copy = (node) => {
    if (Array.isArray(node)) return node.map(copy);
    if (!node || typeof node !== "object") return node;
    const out = {};
    for (const [k, value] of Object.entries(node)) out[k] = copy(value);
    if (node.helper === "chip-bank" && Array.isArray(node.chips)) out.chips = node.chips.map(mark);
    return out;
  };
  const spec = copy(worksheet);
  return count ? { spec, marked: count } : { spec: worksheet, marked: 0 };
}

module.exports = { withTaughtChips };
