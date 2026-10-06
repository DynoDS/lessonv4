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
//   [[x]]   bold + focus blue: the part of a line that asks, a question
//           (e.g. "Is the [[answer]] missing?"); a table's deciding word is not a
//           question and takes no blue
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

// A taught word is green wherever a child reads it, so the word in a question
// looks like the word on its vocabulary card (teacher-slide-visual-profile ->
// Semantic colour). The rule was written down and four decks in a row printed
// every taught word black outside the word bank (a Year 4 RE deck, 5 October
// 2026: `Christingle` and `symbol`, twelve times), because marking each one by
// hand is the kind of job a designer filling thirty boxes skips. So the builder
// does it: build.js names the words each slide's class has met a card for, and
// every piece of text that passes through here prints them green.
//
// Only words still in their line's own colour change, and only where that
// colour is black, question blue or purple: a word inside a marked span, an
// answer, an orange line or a red weak example keeps the colour that already
// says what it is.
let taughtWords = null;

function escapeRegExp(word) {
  return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function wordForms(word) {
  const escaped = escapeRegExp(word);
  if (/[^aeiou]y$/i.test(word)) return `${escaped.slice(0, -1)}(?:y|ies)`;
  return `${escaped}(?:s|es)?`;
}

function setTaughtWords(terms) {
  const parts = [];
  (Array.isArray(terms) ? terms : []).forEach(function (term) {
    // A paired card (`greater than / less than`, `continuity and change`) is
    // two words, each green by itself.
    String(term || '').split(/\s*\/\s*|\s+and\s+/).forEach(function (part) {
      const words = part.trim().split(/\s+/).filter(Boolean);
      if (!words.length || !/[A-Za-z]/.test(part)) return;
      const last = words.pop();
      parts.push(words.map(escapeRegExp)
        .concat(wordForms(last)).join('[ \\u00A0-]+'));
    });
  });
  parts.sort(function (a, b) { return b.length - a.length; });
  taughtWords = parts.length
    ? new RegExp('(?<![A-Za-z0-9])(?:' + parts.join('|') + ')(?![A-Za-z0-9])', 'gi')
    : null;
}

const TAUGHT_WORD_GROUNDS = [COLOURS.body, COLOURS.title, COLOURS.sticky, COLOURS.worked];

function sameColour(a, b) {
  return String(a || '').replace('#', '').toUpperCase() === String(b || '').replace('#', '').toUpperCase();
}

function taughtWordsInGreen(runs, baseColor, bold) {
  if (!taughtWords) return runs;
  const base = baseColor || COLOURS.body;
  if (!TAUGHT_WORD_GROUNDS.some(function (ground) { return sameColour(ground, base); })) return runs;
  let list = runs;
  if (typeof runs === 'string') {
    taughtWords.lastIndex = 0;
    if (!taughtWords.test(runs)) return runs;
    // A newline is its own run, as the marker route below emits it.
    const plain = { color: base, bold: !!bold };
    list = [];
    runs.split('\n').forEach(function (line, index, lines) {
      if (line !== '') list.push({ text: line, options: plain });
      if (index < lines.length - 1) list.push({ text: '\n', options: plain });
    });
  } else if (!Array.isArray(runs)) {
    return runs;
  }
  const out = [];
  list.forEach(function (run) {
    const options = (run && run.options) || {};
    if (!run || typeof run.text !== 'string' || !sameColour(options.color || base, base)) {
      out.push(run);
      return;
    }
    const pieces = [];
    let cursor = 0;
    taughtWords.lastIndex = 0;
    let match;
    while ((match = taughtWords.exec(run.text)) !== null) {
      if (match.index > cursor) pieces.push({ text: run.text.slice(cursor, match.index), green: false });
      pieces.push({ text: match[0], green: true });
      cursor = match.index + match[0].length;
    }
    if (!pieces.length) {
      out.push(run);
      return;
    }
    if (cursor < run.text.length) pieces.push({ text: run.text.slice(cursor), green: false });
    pieces.forEach(function (piece, index) {
      // A paragraph break belongs to the end of the run, so only the last
      // piece keeps it.
      const own = Object.assign({}, options);
      if (index < pieces.length - 1) delete own.breakLine;
      if (piece.green) Object.assign(own, { color: COLOURS.green, bold: true });
      out.push({ text: piece.text, options: own });
    });
  });
  return out;
}

function splitAnswerRuns(text, bold, baseColor) {
  return taughtWordsInGreen(splitMarkedRuns(text, bold, baseColor), baseColor, bold);
}

function splitMarkedRuns(text, bold, baseColor) {
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

module.exports = { splitAnswerRuns, setTaughtWords, taughtWordsInGreen };
