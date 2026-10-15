'use strict';

// A set of lettered choices (`A: Ask a teaching assistant now.`, `B: ...`,
// `C: ...`) prints each letter in house blue. Set as plain black sentences the
// cards read as three more facts about the case ("A, B, C do not look like
// options, they look like information", the teacher, 11 October 2026, of a
// Year 4 PSHE slide); the blue letter is the thing a child writes down, and it
// costs the sentence no room. The words stay exactly as the design wrote them.
//
// A set is a run of text cards in one stack or row, every one of them opening
// with its letter, in order from A. One lettered line among ordinary ones is
// left alone: `A: 24 cm` in a list of measurements is a label, not a choice.

const CHOICE_OPENING = /^([A-H])([:.)])\s+\S/;

function choiceOpening(value) {
  const found = CHOICE_OPENING.exec(String(value == null ? '' : value));
  return found ? found[1] + found[2] : null;
}

function isChoiceSet(items) {
  if (!Array.isArray(items) || items.length < 2) return false;
  return items.every((item, index) =>
    item && typeof item === 'object' && item.type === 'text' && typeof item.value === 'string' &&
    choiceOpening(item.value) && item.value.charCodeAt(0) === 65 + index);
}

function markChoiceLetters(lesson) {
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== 'object') return;
    if (isChoiceSet(node.items)) node.items.forEach((item) => { item.choiceLetter = true; });
    Object.keys(node).forEach((key) => {
      if (key === 'speakerNotes' || key === 'notes' || key === 'decorations') return;
      visit(node[key]);
    });
  };
  visit(lesson && lesson.slides);
  return lesson;
}

module.exports = { choiceOpening, isChoiceSet, markChoiceLetters };
