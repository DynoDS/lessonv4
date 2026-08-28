"use strict";

// One stick-in piece per child, so a single print of the finished file covers
// the whole class: the teacher opens it, prints once, and has enough without
// working out "fits 2 per page, so print 16". A class smaller or larger than
// this can override it with `classSize` on the spec; 32 is the default class.
const CLASS_SIZE = 32;

// A4 physical page size in millimetres. The HTML builder prints it landscape.
const A4 = { widthMm: 210, heightMm: 297, marginMm: 10 };

// Height reserved above each figure for the question handle (see pieceHandle).
const HANDLE_BAND_MM = 7;

// The short handle stamped on every copy of a piece so a cut-out, separated from
// its page, still says which question it is. Prefer the designer's `tag` (the
// board's own handle for that moment — a question letter, "Apply", an Our/Your
// Turn name); fall back to the piece's position as a letter so a multi-piece pack
// is never anonymous even if a tag was omitted. A single-piece pack needs none —
// every copy is the same question, so there is nothing to tell apart.
function indexToLetter(i) {
  return i < 26 ? String.fromCharCode(97 + i) : String(i + 1);
}

// Brackets belong on a QUESTION handle and nowhere else.
//
// A handle that is a question label - a, 2, 1b - is bracketed, because that is
// how a question is written everywhere else a child meets one, and a bare "a"
// stamped on a cut-out reads as part of the picture. A handle that is a NAME -
// "Apply", "Our Turn", "Challenge" - is not a question number, and wrapping it
// in brackets would dress the designer's word up as one.
//
// The caption used to add its own brackets round whatever it was given, so a
// descriptive tag became "(Challenge)" in one place and "Challenge" in another.
// One classifier now decides, and everything downstream prints what it returns.
function formatStickInHandle(value) {
  const raw = String(value == null ? "" : value).trim();
  if (!raw) return raw;

  const wrapped = /^\((.*)\)$/.exec(raw);
  const inner = (wrapped ? wrapped[1] : raw).trim();

  const questionLike =
    /^[a-z]$/i.test(inner) ||
    /^[1-9]\d*$/.test(inner) ||
    /^[1-9]\d*[a-z]$/i.test(inner);

  return questionLike ? `(${inner})` : raw;
}

function pieceHandle(item, index, total) {
  const tag = item.tag != null ? String(item.tag).trim() : "";
  if (tag) return formatStickInHandle(tag);
  return total > 1 ? formatStickInHandle(indexToLetter(index)) : null;
}

module.exports = {
  pieceHandle,
  formatStickInHandle,
  A4,
  CLASS_SIZE,
  HANDLE_BAND_MM,
};
