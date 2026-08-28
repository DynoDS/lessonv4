'use strict';

const { COLOURS } = require('./styles');

// Inline text formatting for rendered strings — questions, table cells, steps,
// option lists, and grid/pyramid reveals all pass through here. Returns the
// plain string unchanged when the text carries no markers, so any content
// without markers renders exactly as it always has; returns an array of
// pptxgenjs text runs when a marker is present.
//
// Markers (non-nesting, authored in lesson.json by the slide-designer):
//   ||x     everything after the || on that line is the answer, in green
//           (the long-standing reveal marker — e.g. "25 × 4 = ||100"). The
//           marker works per line: "A: ||1\nB: ||2" reveals an answer after
//           every field, and each new line starts back in the base colour.
//           When text sits hard against both sides of the ||, the builder
//           inserts the separating space itself, so "in?||South America"
//           renders as "in? South America" — a question and its revealed
//           answer are two things, and a welded join reads as a typo.
//   **x**   bold, in the base colour
//           (a word to stress without recolouring — e.g. a direction: "Slide **RIGHT**")
//   [[x]]   bold + focus blue — the one word a reader must decide on
//           (a branch/reference table's deciding word — e.g. "Is the [[answer]] missing?")
//   {{x}}   bold + answer green — an item lifted in green where it sits: a
//           correct option in a "circle all that appear" reveal (e.g.
//           "(a) {{250}} 235 {{125}} 400 215"), or a key vocabulary term
//           highlighted in running text on a Teach slide, since green is the
//           deck's vocabulary colour — e.g. "across is the {{x-axis}}"
//   <<x>>   bold + supplied orange — information the question gives the child to
//           work from: a given value, a word-bank item, or the known part of a
//           missing-number equation — e.g. "<<367>> + ___ = <<478>>"
//
// `bold` sets the weight for unmarked text; callers pass true for question and
// answer text. `baseColor` sets the colour of the unmarked text and of **bold**
// spans, and defaults to the body colour — so existing callers that pass only
// (text, bold) render exactly as before. A caller drawing a whole coloured line
// (a blue question, a green prompt) passes that colour here so the unmarked words
// keep it instead of dropping to black; the role markers [[ ]], {{ }}, << >> and
// the || answer tail keep their own fixed colours regardless, since their colour
// is the meaning. An unpaired marker (no closing token) is left as literal text,
// so a stray "**" never corrupts the run.
//
// Empty runs are omitted: when the whole string is an answer ("||100"), the
// black prefix would be "", and an empty text run makes pptxgenjs emit an empty
// <a:t/> that PowerPoint rejects as a corrupt file. Dropping it means a cell or
// brick that is wholly an answer (a grid/pyramid reveal) renders as a single
// clean green run.
const FOCUS_BLUE = COLOURS.title; // 0070C0 — the same blue the deck uses for the focus/question
const SUPPLIED_ORANGE = COLOURS.orange; // E46C0A — supplied/given material the child works from

function splitAnswerRuns(text, bold, baseColor) {
  const str = String(text);
  const hasInline =
    str.indexOf('**') !== -1 ||
    str.indexOf('[[') !== -1 ||
    str.indexOf('{{') !== -1 ||
    str.indexOf('<<') !== -1;
  const hasReveal = str.indexOf('||') !== -1;
  if (!hasInline && !hasReveal) return str;

  const base = { color: baseColor || COLOURS.body, bold: !!bold };
  const runs = [];

  const pushPlain = function (value) {
    if (value !== '') {
      runs.push({
        text: value,
        options: { color: base.color, bold: base.bold }
      });
    }
  };

  const pushInline = function (value) {
    const re =
      /\*\*([\s\S]+?)\*\*|\[\[([\s\S]+?)\]\]|\{\{([\s\S]+?)\}\}|<<([\s\S]+?)>>/g;
    let last = 0;
    let match;
    while ((match = re.exec(value)) !== null) {
      pushPlain(value.slice(last, match.index));
      if (match[1] !== undefined) {
        runs.push({
          text: match[1],
          options: { color: base.color, bold: true }
        });
      } else if (match[2] !== undefined) {
        runs.push({
          text: match[2],
          options: { color: FOCUS_BLUE, bold: true }
        });
      } else if (match[3] !== undefined) {
        runs.push({
          text: match[3],
          options: { color: COLOURS.green, bold: true }
        });
      } else if (match[4] !== undefined) {
        runs.push({
          text: match[4],
          options: { color: SUPPLIED_ORANGE, bold: true }
        });
      }
      last = re.lastIndex;
    }
    pushPlain(value.slice(last));
  };

  // The reveal marker is per line: a field list such as
  // "Object: ||Hairdryer\nPower source: ||Mains electricity" reveals an
  // answer after every field, and each new line starts back in the base
  // colour so the labels stay black while every answer lifts green.
  const lines = str.split('\n');
  lines.forEach(function (line, lineIndex) {
    const revealIndex = line.indexOf('||');
    if (revealIndex === -1) {
      pushInline(line);
    } else {
      const head = line.slice(0, revealIndex);
      const tail = line.slice(revealIndex + 2);
      pushInline(head);
      if (tail !== '') {
        const needsSpace =
          head !== '' &&
          !/\s$/.test(head) &&
          !/^\s/.test(tail);
        runs.push({
          text: needsSpace ? ' ' + tail : tail,
          options: { color: COLOURS.green, bold: base.bold }
        });
      }
    }
    if (lineIndex < lines.length - 1) {
      runs.push({
        text: '\n',
        options: { color: base.color, bold: base.bold }
      });
    }
  });

  if (runs.length === 0) return '';
  if (
    runs.length === 1 &&
    runs[0].options.color === base.color &&
    runs[0].options.bold === base.bold
  ) {
    return runs[0].text;
  }
  return runs;
}

module.exports = { splitAnswerRuns };
