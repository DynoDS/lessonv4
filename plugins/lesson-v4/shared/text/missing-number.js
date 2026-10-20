'use strict';

// A question mark that stands for a missing number prints in question blue,
// on every surface.
//
// The teacher (19 October 2026, a Year 4 Your Turn of "3,000 − ? = 1,200"): the
// ? should be blue, "because it makes it clear that that's the missing thing
// they need to work out". Any ? that stands for a number, on the slides, the
// worksheets and inside a bar model; a ? that ends a sentence ("Who is
// correct?") stays as it is. Left to the designer, a mark like this is the kind
// of thing skipped on the thirtieth box, so every engine finds it here instead.
//
// A ? stands for a number when it is a word on its own (nothing but a space,
// a bracket or the edge of the text either side of it) and the word beside it,
// on at least one side, is a sign of the sum: + − - × ÷ = < > or another
// number. "5,200 − ? = 1,900", "? + 2,650 = 6,000" and "100 − 65 = ?" all
// qualify; "Who is correct?" does not, because its ? is joined to a word; and a
// ? standing alone as a whole label (a bar model's box, a table cell) is the
// missing number by itself.

const SIGN = /^[+−\-×÷=<>≤≥]$|^[£$]?\d[\d,.]*[p%]?$/;

// Every ? in `text` that stands for a missing number, as character indices.
function missingNumberMarks(text) {
  const str = String(text == null ? '' : text);
  if (str.indexOf('?') === -1) return [];
  if (str.trim() === '?') return [str.indexOf('?')];
  const out = [];
  const re = /\?/g;
  let match;
  while ((match = re.exec(str)) !== null) {
    const at = match.index;
    const before = str.slice(0, at);
    const after = str.slice(at + 1);
    // A word on its own: only a space, a bracket or the edge either side.
    if (before !== '' && !/[\s(\[]$/.test(before)) continue;
    if (after !== '' && !/^[\s)\].,;:]/.test(after)) continue;
    const prev = (before.match(/(\S+)\s*$/) || [])[1];
    const next = (after.replace(/^[)\].,;:]+/, '').match(/^\s*(\S+)/) || [])[1];
    const clean = (w) => (w || '').replace(/^[(\[]+|[)\].,;:]+$/g, '');
    if (SIGN.test(clean(prev)) || SIGN.test(clean(next))) out.push(at);
  }
  return out;
}

// The text split into pieces, each marked whether it is a missing-number ?.
function missingNumberPieces(text) {
  const str = String(text == null ? '' : text);
  const marks = missingNumberMarks(str);
  if (!marks.length) return [{ text: str, missing: false }];
  const pieces = [];
  let cursor = 0;
  marks.forEach((at) => {
    if (at > cursor) pieces.push({ text: str.slice(cursor, at), missing: false });
    pieces.push({ text: '?', missing: true });
    cursor = at + 1;
  });
  if (cursor < str.length) pieces.push({ text: str.slice(cursor), missing: false });
  return pieces;
}

module.exports = { missingNumberMarks, missingNumberPieces };
