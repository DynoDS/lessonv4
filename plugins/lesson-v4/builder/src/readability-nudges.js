'use strict';

// Two things the teacher asked for on slide after slide when he judged a
// hundred of them (4 October 2026), whichever run had made the slide: a gap
// between the ideas in a card, and colour on a card whose every sentence was
// black. Both were already in the guidance and neither was checked, so a deck
// could follow them on one slide and miss them on the next. These are nudges,
// not refusals: each names the card and says when leaving it alone is right.

const INLINE_COLOUR = /\|\||\[\[|\{\{|<<|✨/;
const SKIPPED_TEMPLATES = new Set(['key-vocabulary', 'strong-and-weak']);
const SKIPPED_KEYS = new Set(['speakerNotes', 'notes', 'speakers', 'extract', 'criteria', 'words']);

function plain(text) {
  return String(text).replace(/\|\||\*\*|\[\[|\]\]|\{\{|\}\}|<<|>>|✨/g, '');
}

function sentenceCount(text) {
  const found = plain(text).match(/[.!?]["'”’)\]]*(?=\s|$)/g);
  return found ? found.length : 0;
}

function wordCount(text) {
  return plain(text).split(/\s+/).filter(Boolean).length;
}

function words(node) {
  if (typeof node === 'string') return node;
  if (!node || typeof node !== 'object') return '';
  const value = node.value != null ? node.value : node.text;
  return typeof value === 'string' ? value : '';
}

function coloured(node, text) {
  if (INLINE_COLOUR.test(text)) return true;
  if (!node || typeof node !== 'object') return false;
  if (node.color || node.orange === true || node.asksInBlue) return true;
  if (node.colorRole && node.colorRole !== 'default') return true;
  return Array.isArray(node.emphasis) && node.emphasis.length > 0;
}

function isModel(node, text) {
  return /\|\|/.test(text) || !!(node && typeof node === 'object' && node.colorRole === 'worked-purple');
}

function cardsIn(slide) {
  const cards = [];
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    if (node.type === 'text') cards.push(node);
    Object.keys(node).forEach((key) => { if (!SKIPPED_KEYS.has(key)) walk(node[key]); });
  };
  walk(slide);
  if (slide.template === 'teach-layout' && Array.isArray(slide.lines)) slide.lines.forEach((line) => cards.push(line));
  return cards;
}

function opening(text) {
  const flat = plain(text).replace(/\s+/g, ' ').trim();
  return flat.length > 48 ? `${flat.slice(0, 48)}...` : flat;
}

function readabilityWarnings(slide, n, warnings) {
  if (!slide || typeof slide !== 'object' || SKIPPED_TEMPLATES.has(slide.template)) return;
  for (const card of cardsIn(slide)) {
    const text = words(card);
    if (!text.trim()) continue;
    const sentences = sentenceCount(text);
    const model = isModel(card, text);
    if (sentences >= 3 && !/\n[ \t]*\n/.test(text) && (!/\n/.test(text) || model)) {
      warnings.push(`slide ${n}: the card beginning "${opening(text)}" runs ${sentences} sentences with no gap between its ideas. ` +
        'Put a blank line (\\n\\n) between separate ideas, in an explanation and in a model answer alike; the words do not change. ' +
        'A poem\'s lines, or a short run read as one list, keep their single line breaks.');
    }
    if ((sentences >= 3 || wordCount(text) >= 30) && !coloured(card, text) && !model) {
      warnings.push(`slide ${n}: the card beginning "${opening(text)}" is all black (${sentences} sentence${sentences === 1 ? '' : 's'}, ${wordCount(text)} words). ` +
        'Put its key line in orange, the one you would say louder: an emphasis entry with role "key-line" on that sentence, or "orange": true where the whole teach-layout line is that sentence. ' +
        'A case or quotation the task runs on is supplied orange as a whole (<< >>). ' +
        'Leave the card black only where its lines are equals with no line that carries the rest: a poem, a list, the steps of a sequence.');
    }
  }
}

module.exports = { readabilityWarnings, sentenceCount, wordCount };
