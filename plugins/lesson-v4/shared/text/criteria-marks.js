'use strict';

// Colour inside a success criterion, read the same way on every surface.
//
// A criterion printed all in bold black makes a child read every word with the
// same weight, so the part that tells them where to look is lost in the
// sentence. The teacher's scheme (15 September 2026) gives three kinds of word
// their own colour, in this order of priority when one word could be two:
//
//   ((thousands))  names a part of the picture on the slide, and takes that
//                  part's own colour, so the words and the drawing line up.
//                  Place-value columns today: thousands, hundreds, tens, ones,
//                  tenths... or their short names Th, H, T, O, t.
//   {{interval}}   a taught word, in the deck's vocabulary green.
//   <<first digit that is different>>
//                  the part to look at or decide, in orange.
//
// Everything else stays black. The marks travel inside the criterion's own
// words, so a verbatim copy onto the worksheet or the working wall carries the
// colour with it and the three surfaces cannot drift apart. `**x**` (bold in
// the line's colour) is read here too, because the slide engine already
// honours it in the same strings.

const { SAME_COLOURS, canonicalColumn } = require('../visuals/place-value-chart-svg');

const TAUGHT_GREEN = '#00B050';
const DECIDE_ORANGE = '#E46C0A';

const MARK_RE = /\(\(([\s\S]+?)\)\)|\{\{([\s\S]+?)\}\}|<<([\s\S]+?)>>|\*\*([\s\S]+?)\*\*/g;

// The colour of a picture part named in words, or null when the words name no
// part the engine draws in a colour of its own.
function pictureColour(words) {
  const key = canonicalColumn(String(words).trim());
  return Object.prototype.hasOwnProperty.call(SAME_COLOURS, key) && key !== '.'
    ? SAME_COLOURS[key]
    : null;
}

// [{ text, colour, bold, mark }] in reading order. `colour` is null for text in
// the line's own colour.
function criteriaSegments(text) {
  const str = text == null ? '' : String(text);
  const segments = [];
  let last = 0;
  let match;
  MARK_RE.lastIndex = 0;
  while ((match = MARK_RE.exec(str)) !== null) {
    if (match.index > last) segments.push({ text: str.slice(last, match.index), colour: null, bold: false, mark: null });
    if (match[1] !== undefined) {
      const colour = pictureColour(match[1]);
      // Brackets that name no drawn part are ordinary brackets, "((2 + 3) x 4)"
      // included, so they print exactly as written.
      if (colour) segments.push({ text: match[1], colour, bold: true, mark: 'picture' });
      else segments.push({ text: match[0], colour: null, bold: false, mark: null });
    } else if (match[2] !== undefined) {
      segments.push({ text: match[2], colour: TAUGHT_GREEN, bold: true, mark: 'taught' });
    } else if (match[3] !== undefined) {
      segments.push({ text: match[3], colour: DECIDE_ORANGE, bold: true, mark: 'decide' });
    } else {
      segments.push({ text: match[4], colour: null, bold: true, mark: 'bold' });
    }
    last = MARK_RE.lastIndex;
  }
  if (last < str.length) segments.push({ text: str.slice(last), colour: null, bold: false, mark: null });
  return segments;
}

// The words a child reads, with every mark removed. Used wherever text is
// measured or compared, so a mark never changes a fit or a verbatim check.
function plainCriteria(text) {
  return criteriaSegments(text).map((segment) => segment.text).join('');
}

// Problems a designer can fix, in words: a picture mark naming nothing drawn,
// or a mark left open.
function criteriaMarkProblems(text) {
  const problems = [];
  const leftover = plainCriteria(text);
  const unnamed = leftover.match(/\(\(([^()]+?)\)\)/);
  if (unnamed) {
    problems.push(`((${unnamed[1]})) names no coloured part of a picture the engine draws`);
    return problems;
  }
  for (const opener of ['((', '))', '{{', '}}', '<<', '>>', '**']) {
    if (leftover.includes(opener)) problems.push(`an unclosed or stray "${opener}"`);
  }
  return problems;
}

module.exports = {
  DECIDE_ORANGE,
  TAUGHT_GREEN,
  criteriaMarkProblems,
  criteriaSegments,
  pictureColour,
  plainCriteria,
};
