'use strict';

const { COLOURS } = require('./styles');
const { pictureColour } = require('../../shared/text/criteria-marks');

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
//           A string that OPENS with the marker and carries no other is one
//           answer from top to bottom, every paragraph green.
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
//           missing-number equation — e.g. "<<367>> + ___ = <<478>>". In a
//           success criterion the same orange marks the part to look at or
//           decide (shared/text/criteria-marks.js)
//   ((x))   bold, in the colour of the picture part the words name, so a
//           criterion's "((thousands))" matches the thousands column
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
  const label = /^(\([A-Za-z]|\(\d+[A-Za-z]?)\)(\s+|$)/.exec(str);
  if (label) {
    const rest = splitAnswerRuns(str.slice(label[0].length), bold, baseColor);
    return [{ text: label[0], options: { color: COLOURS.questionLabel, bold: true } }]
      .concat(Array.isArray(rest) ? rest : rest ? [{ text: rest, options: { color: baseColor || COLOURS.body, bold: !!bold } }] : []);
  }
  // A block that opens with the reveal marker and carries no other one is a
  // single answer, however many paragraphs it runs to. The per-line rule
  // further down is for a field list ("Object: ||Hairdryer\nPower: ||Mains"),
  // where every line has its own reveal; a two-paragraph model answer on a
  // check slide has one reveal at the top, and colouring only its first
  // paragraph left the second sitting black beside it (Year 4 PSHE, slides 18
  // and 20, 8 September 2026). So a leading marker sets green as the base for
  // the whole block, and the inline markers still keep their own colours.
  if (str.startsWith('||') && str.indexOf('||', 2) === -1) {
    const body = str.slice(2).replace(/^\s+/, '');
    const inner = splitAnswerRuns(body, bold, COLOURS.green);
    if (Array.isArray(inner)) return inner;
    const lines = String(inner).split('\n');
    const green = [];
    lines.forEach(function (line, index) {
      if (line !== '') green.push({ text: line, options: { color: COLOURS.green, bold: !!bold } });
      if (index < lines.length - 1) {
        green.push({ text: '\n', options: { color: COLOURS.green, bold: !!bold } });
      }
    });
    return green;
  }

  const hasInline =
    str.indexOf('**') !== -1 ||
    str.indexOf('[[') !== -1 ||
    str.indexOf('{{') !== -1 ||
    str.indexOf('<<') !== -1 ||
    str.indexOf('((') !== -1;
  const hasReveal = str.indexOf('||') !== -1;
  if (!hasInline && !hasReveal) return str;

  const base = { color: baseColor || COLOURS.body, bold: !!bold };
  const runs = [];

  const push = function (value, options) {
    if (value !== '') runs.push({ text: value, options: options });
  };

  // A marked span is scanned across the whole string, not line by line, so a
  // question that runs over a paragraph break can still be coloured as one
  // question. Splitting into lines first and hunting markers inside each line
  // left the opening `[[` on one line and the closing `]]` on another, so
  // neither matched and both printed at the class as characters. Each newline
  // inside a span is still emitted as its own base-colour run, so the break
  // survives and only the words take the colour.
  const pushSpan = function (value, colour, bold) {
    const parts = value.split('\n');
    parts.forEach(function (part, index) {
      push(part, { color: colour, bold: bold });
      if (index < parts.length - 1) {
        push('\n', { color: base.color, bold: base.bold });
      }
    });
  };

  // The reveal marker stays per line: a field list such as
  // "Object: ||Hairdryer\nPower source: ||Mains electricity" reveals an
  // answer after every field, and each new line starts back in the base
  // colour so the labels stay black while every answer lifts green.
  const pushPlain = function (value) {
    const lines = value.split('\n');
    lines.forEach(function (line, lineIndex) {
      const revealIndex = line.indexOf('||');
      if (revealIndex === -1) {
        push(line, { color: base.color, bold: base.bold });
      } else {
        const head = line.slice(0, revealIndex);
        const tail = line.slice(revealIndex + 2);
        push(head, { color: base.color, bold: base.bold });
        if (tail !== '') {
          const needsSpace =
            head !== '' &&
            !/\s$/.test(head) &&
            !/^\s/.test(tail);
          push(needsSpace ? ' ' + tail : tail, {
            color: COLOURS.green,
            bold: base.bold
          });
        }
      }
      if (lineIndex < lines.length - 1) {
        push('\n', { color: base.color, bold: base.bold });
      }
    });
  };

  const re =
    /\*\*([\s\S]+?)\*\*|\[\[([\s\S]+?)\]\]|\{\{([\s\S]+?)\}\}|<<([\s\S]+?)>>|\(\(([\s\S]+?)\)\)/g;
  let last = 0;
  let match;
  while ((match = re.exec(str)) !== null) {
    pushPlain(str.slice(last, match.index));
    if (match[1] !== undefined) {
      pushSpan(match[1], base.color, true);
    } else if (match[2] !== undefined) {
      pushSpan(match[2], FOCUS_BLUE, true);
    } else if (match[3] !== undefined) {
      pushSpan(match[3], COLOURS.green, true);
    } else if (match[4] !== undefined) {
      pushSpan(match[4], SUPPLIED_ORANGE, true);
    } else if (match[5] !== undefined) {
      // ((thousands)): a part of the picture, in that part's own colour. Words
      // naming nothing drawn are ordinary brackets and print as written.
      const colour = pictureColour(match[5]);
      if (colour) pushSpan(match[5], colour.replace('#', ''), true);
      else pushPlain(match[0]);
    }
    last = re.lastIndex;
  }
  pushPlain(str.slice(last));

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
