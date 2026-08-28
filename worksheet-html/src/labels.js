"use strict";

// One place that decides what a QUESTION LABEL looks like on paper.
//
// The engine used to build brackets in three places: the generic numbered
// wrapper in compose.js, and the two question lists in text.js. Three places
// agreeing today is three places to disagree tomorrow, and the answer key was
// separately matching on integers - so a sheet printing (1a) and a key holding
// question 1 could both be "right" while a teacher marked the wrong thing.
//
// So a label is canonicalised (the bare token, no brackets) for MATCHING, and
// formatted (bracketed) for PRINTING. A key entry written 1a, (1a) or "1a "
// therefore matches the same printed (1a), and nothing else in the engine has
// to know how a bracket is drawn.
//
// This is only for question labels. A descriptive caption, a heading or a
// helper's own wording never comes through here: bracketing "Shape A" would
// turn a designer's words into something that looks like a question number.

function canonicalQuestionLabel(value) {
  const raw = String(value == null ? "" : value).trim();
  if (!raw) {
    throw new Error("QUESTION_LABEL_INVALID: question label is empty.");
  }

  const wrapped = /^\((.*)\)$/.exec(raw);
  return (wrapped ? wrapped[1] : raw).trim();
}

function formatQuestionLabel(value) {
  return `(${canonicalQuestionLabel(value)})`;
}

module.exports = {
  canonicalQuestionLabel,
  formatQuestionLabel,
};
