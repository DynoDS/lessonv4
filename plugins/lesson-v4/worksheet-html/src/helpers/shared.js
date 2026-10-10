"use strict";

// Small things every helper file needs. Kept apart from index.js so that a
// helper file can use them without importing the registry that imports it.

const { WRITING_LINE_MM, WRITING_LINE_GROWN_RATIO, TYPE } = require("../tokens");
const { textWidthEm } = require("../../../shared/text/comic-glyph-width");

const BODY_PT = 12; // must track TYPE.body in tokens.js
const PT_MM = 0.3528;
const LINE_MM = BODY_PT * PT_MM * 1.35; // a line of body text, with leading
const NOTE_LINE_MM = TYPE.note * PT_MM * 1.35; // a line at the smallest size

// A word bank has one heading, and it is this one.
//
// A bank has a title and a line of instruction above its words. A designer put
// "Word bank" in the first and "Words you can use:" in the second, and a slip
// printed two headings for one thing, one under the other (stress test, 7
// October 2026, on all twelve slips of a Year 5 lesson). Nothing was wrong with
// either field: both were filled with a name for the bank. The teacher's choice
// of wording, from the real slips (10 October 2026): "words you could use".
//
// So a bank titled as a word bank prints this heading, whatever name it was
// given, and a line above the words that only names the bank again is not
// printed. A line that tells the child what to do ("Choose a word from the
// bank.") is an instruction and still prints.
const BANK_HEADING = "Words you could use:";
const BANK_NAME = /^\s*(?:word\s*bank|(?:some\s+|helpful\s+)?words?\s+(?:you\s+|that\s+you\s+)?(?:can|could|may|might)\s+use|helpful\s+words|useful\s+words|use\s+these\s+words)\s*[:.]?\s*$/i;

// A word or phrase a child must find in a sentence is typed **like this** and
// prints bold.
//
// Only the written-method frame could do it, so a sheet asking a child to move
// "by the pond" to the front had no way to show which words were meant and
// underlined them with the marked-text drawing instead (stress test, 7 October
// 2026; the teacher asked for it, 10 October 2026). Every piece's finished
// words pass through here, so the marks work in any text a sheet prints and no
// helper has to know. Only the words between tags are read, and a pair of marks
// must open and close inside one run of words.
const BOLD_MARKED = /\*\*([^*<>]+?)\*\*/g;

function boldMarkedInHtml(html) {
  const source = String(html ?? "");
  if (!source.includes("**")) return source;
  let skip = 0;
  return source
    .split(/(<[^>]+>)/)
    .map((piece, i) => {
      if (i % 2) {
        if (/^<(svg|style|script)\b/i.test(piece) && !/\/>$/.test(piece)) skip += 1;
        else if (/^<\/(svg|style|script)\b/i.test(piece)) skip = Math.max(0, skip - 1);
        return piece;
      }
      return skip ? piece : piece.replace(BOLD_MARKED, "<strong>$1</strong>");
    })
    .join("");
}

function namesTheBank(text) {
  return typeof text === "string" && BANK_NAME.test(text);
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// A run of underscores in child-facing prompt text is a blank the child
// writes INTO - a sentence stem's gaps are its answer space. Printed as the
// designer's literal "___" it is a few millimetres wide: an answer space no
// pencil fits, on a page that looks finished. So every run of two or more
// underscores prints as one uniform write-in blank wide enough for a real
// written word, and every blank in a stem comes out the same width, so a
// blank's length never leaks which word it wants.
//
// BLANK_CHARS is what the measurement counts for each blank, and the printed
// width is derived from the same number, so the estimate and the page agree.
const BLANK_CHARS = 12;
const BLANK_MM = 25; // the printed width of one blank; tracks BLANK_CHARS at body size
const BLANK_RUN = /_{2,}/g;
const DIGIT_BOX = /[\u25A1\u25A2\u2610\u25FB\u25AB]/g;

function blankWidth(value) {
  if (value == null) return BLANK_MM;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 10 || value > 100) {
    throw new Error("blankWidthMm must be a number from 10 to 100 millimetres");
  }
  return value;
}

function normaliseBlanks(text, widthMm) {
  const chars = Math.ceil(BLANK_CHARS * blankWidth(widthMm) / BLANK_MM);
  return String(text ?? "").replace(BLANK_RUN, "_".repeat(chars));
}

// Escape first, then swap the runs: the replacement carries markup that must
// not itself be escaped.
const DIGIT_BOX_HTML = '<span class="h-digit-box"></span>';

// The question, in the question's colour.
//
// On a slide the thing a child is asked is blue and what they are told is
// black. On a sheet a block of print ran scene, question and instruction
// together in one black paragraph (the teacher, 4 October 2026, on a PSHE slip
// of four situations: "slides have colour hierarchy, we need that here"). So
// where a prompt holds both, the sentence that asks is drawn in question blue
// and the scene around it stays black. A prompt that is ONLY a question stays
// black: colour is for telling two things apart, and a page of all-blue
// questions tells nothing apart.
//
// "Holds both" is judged over the whole QUESTION, not over one block of print.
// The same question and the same instruction printed blue on one level, where
// the designer wrote them as one block, and black on the next, where the
// instruction sat in a block of its own directly underneath (a Year 3 RE slip,
// the stress test of 7 October 2026). The teacher's rule is unchanged (9
// October 2026: blue only when there is an instruction for it to stand out
// from); what changed is where the instruction is looked for. The composing
// code knows which blocks make one question, so it says so here
// (`colouringLoneAsks`) while it draws a question line whose instruction is
// its neighbour.
const SENTENCE = /[^\n]*?[.!?](?:&quot;|&#39;|["'\u201d\u2019)])*(?=\s|$)|[^\n]+$|\n/gm;
const ASKS = /\?(?:&quot;|&#39;|["'\u201d\u2019)])*\s*$/;

let loneAsksColoured = 0;

function colouringLoneAsks(run) {
  loneAsksColoured += 1;
  try {
    return run();
  } finally {
    loneAsksColoured -= 1;
  }
}

// Whether a prompt holds a sentence that tells (anything that is not a
// question), and whether it holds one that asks.
function sentenceKinds(text) {
  const pieces = String(text ?? "").match(SENTENCE) || [];
  const words = pieces.filter((piece) => piece.trim());
  const asks = words.filter((piece) => ASKS.test(piece)).length;
  return { asks: asks > 0, tells: words.length > asks };
}

function colourAsks(escaped) {
  const pieces = String(escaped).match(SENTENCE);
  if (!pieces) return escaped;
  const words = pieces.filter((piece) => piece.trim());
  const asks = words.filter((piece) => ASKS.test(piece));
  if (!asks.length || (asks.length === words.length && !loneAsksColoured)) return escaped;
  return pieces
    .map((piece) => (ASKS.test(piece) && piece.trim() ? piece.replace(/^(\s*)([\s\S]*?)(\s*)$/, '$1<span class="h-ask">$2</span>$3') : piece))
    .join("");
}

// Escaped text with its empty-box characters drawn, for a helper that prints
// its words without the write-in blanks promptHtml adds.
function escWithDigitBoxes(text) {
  return colourAsks(esc(text ?? "")).replace(DIGIT_BOX, DIGIT_BOX_HTML);
}

function promptHtml(text, widthMm) {
  const width = blankWidth(widthMm);
  const style = widthMm == null ? "" : ` style="width:${width}mm"`;
  return colourAsks(esc(text ?? ""))
    .replace(BLANK_RUN, `<span class="h-blank"${style}></span>`)
    // A missing digit is typed upstream as an empty-box character ("2\u25A14 is
    // divisible by 6"), which the font draws smaller than a full stop is tall:
    // a Year 6 sheet asked what the missing digit could be and showed no
    // visible place for one (Daniel, 4 October 2026: "it says 2 box 4, but the
    // box is so small"). Drawn as a box a child's digit fits in.
    .replace(DIGIT_BOX, DIGIT_BOX_HTML)
    .replace(/\r\n|\r|\n/g, "<br>");
}

// Roughly how many characters of Comic Sans fit on a line at body size.
//
// A helper that over-estimates leaves a gap; one that under-estimates
// overflows the page, and a gap is the cheaper mistake. So this keeps a
// margin. But the margin used to be 0.52, which is what the lowercase
// alphabet measures with no spaces in it: a worst case that never occurs in a
// sentence. Measured in Chrome, real primary-school prose comes out between
// 0.464 and 0.489, so 0.52 bought roughly a whole extra line per paragraph,
// and that line became a hole in the page.
//
// 0.50 keeps a margin over the widest real sentence measured while costing
// nothing. `npm run check-render` is what proves it is still safe.
const CHAR_WIDTH_FACTOR = 0.5;

// How many lines the browser will set this text on.
//
// This used to divide the character count by an average letter width, which is
// wrong both ways for real sentences: "Tell us when:" is narrow letters and
// "How many W's?" is wide ones, and a browser breaks at a space, never in the
// middle of a word. On the sheets of twenty real lessons the count priced a
// one-line question as two (21mm for 11mm), a word bank at 44mm for 26mm, and
// 43 of 83 zones more than 3mm taller than they print, so sheets that fitted
// were refused and their content cut (the stress test of 7 October 2026). The
// slides already measure with the real Comic Sans advance of every letter, so
// this lays the words out with the same table, a word at a time, the way the
// browser does.
const EM_MM = BODY_PT * PT_MM;
const SPACE_MM = textWidthEm(" ", false) * EM_MM;
const BLANK_TOKEN = "\u0000";

// A sentence's first word is not left alone at the end of a line.
//
// Words run to the edge and drop, so "...in every sentence. Fix / his
// mistakes." printed with "Fix" cut off from the sentence it opens (the
// teacher, 9 October 2026: "fix is part of that sentence, but it's on its
// own"). The first two words of a sentence that follows another are tied with
// a no-break space, so the pair drops together. Only a short pair is tied: a
// long one in a narrow card would run out of its box, and a stray word is the
// cheaper fault. The other end, one word alone on a LAST line, is the
// browser's own `text-wrap: pretty` on the sheet (render.js, slips.js).
const NBSP = " ";
const TIED_PAIR_CHARS = 14;
const SENTENCE_START = /([.!?](?:&quot;|&#39;|["'”’)])*) +([^\s<>_\u0000]+) (?=([^\s<>_\u0000]+))/g;
const ENDS_SENTENCE = /[.!?](?:&quot;|&#39;|["'”’)])*\s*$/;
const OPENING_PAIR = /^(\s+)([^\s<>_\u0000]+) (?=([^\s<>_\u0000]+))/;

function shortPair(a, b) {
  return a.length + b.length <= TIED_PAIR_CHARS;
}

function tieSentenceStarts(text) {
  return String(text ?? "").replace(SENTENCE_START, (all, end, first, second) =>
    shortPair(first, second) ? `${end} ${first}${NBSP}` : all
  );
}

// The same tie on drawn HTML: only the words between tags, never a tag's own
// attributes, a drawing's labels or a table cell (a cell is as narrow as text
// gets). A sentence that ends inside one tag and is followed by the next
// ("<span>...story?</span> Explain why.") is still followed.
function tieHtmlText(html) {
  let skip = 0;
  let cell = 0;
  let afterSentence = false;
  return String(html ?? "")
    .split(/(<[^>]+>)/)
    .map((piece, i) => {
      if (i % 2) {
        if (/^<(svg|style|script)\b/i.test(piece) && !/\/>$/.test(piece)) skip += 1;
        else if (/^<\/(svg|style|script)\b/i.test(piece)) skip = Math.max(0, skip - 1);
        else if (/^<t[dh]\b/i.test(piece)) cell += 1;
        else if (/^<\/t[dh]\b/i.test(piece)) cell = Math.max(0, cell - 1);
        else if (/^<\/?(br|p|div|li)\b/i.test(piece)) afterSentence = false;
        return piece;
      }
      if (skip || cell || !piece.trim()) return piece;
      let tied = tieSentenceStarts(piece);
      if (afterSentence) {
        tied = tied.replace(OPENING_PAIR, (all, gap, first, second) =>
          shortPair(first, second) ? `${gap}${first}${NBSP}` : all
        );
      }
      afterSentence = ENDS_SENTENCE.test(piece);
      return tied;
    })
    .join("");
}

function wordMm(word, blankMm) {
  word = word.replace(/ /g, " ");
  if (!word.includes(BLANK_TOKEN)) return textWidthEm(word, false) * EM_MM;
  const pieces = word.split(BLANK_TOKEN);
  return (pieces.length - 1) * blankMm + textWidthEm(pieces.join(""), false) * EM_MM;
}

function linesFor(text, widthMm, blankWidthMm) {
  // A blank counts at the width it will PRINT at, not the two or three
  // underscores the designer typed.
  const blankMm = blankWidth(blankWidthMm);
  const room = Math.max(8 * EM_MM * CHAR_WIDTH_FACTOR, widthMm);
  let lines = 0;
  // Tied words are set as one, as the page sets them (tieSentenceStarts).
  // The marks round a bold word are not printed, so they take no room.
  for (const line of tieSentenceStarts(String(text ?? "").replace(/\*\*/g, "").replace(BLANK_RUN, BLANK_TOKEN)).split(/\r\n|\r|\n/)) {
    lines += 1;
    let used = 0;
    for (const word of line.split(/[ \t\f\v]+/).filter(Boolean)) {
      const mm = wordMm(word, blankMm);
      if (used === 0) {
        // A word longer than the line is broken across as many as it needs.
        lines += Math.max(0, Math.ceil(mm / room) - 1);
        used = mm > room ? mm % room : mm;
      } else if (used + SPACE_MM + mm > room) {
        lines += Math.max(1, Math.ceil(mm / room));
        used = mm > room ? mm % room : mm;
      } else {
        used += SPACE_MM + mm;
      }
    }
  }
  return lines;
}

// A drawn visual's natural height follows from the width it is given and its
// own aspect. Capped, because one picture should not swallow a whole page.
function heightFromAspect(aspect, widthMm, capMm) {
  return Math.min(widthMm / aspect, capMm);
}

// The width at which a drawing's smallest label finally prints big enough to
// read.
//
// A drawn helper is an SVG scaled to fill whatever width its zone gives it, so
// its labels shrink with it. A helper can pass every other check, fit its zone,
// print without a pixel clipped, and still be useless because the numbers along
// its axis came out too small to read. A number line once stated a minimum of
// 70mm, at which its labels printed at three and a half point, and nothing
// objected: it fitted, it did not clip, the page looked finished.
//
// The floor is the design system's own smallest size. A label may be smaller
// than body text, but nothing on a worksheet is meant to be smaller than a
// note, so that is the honest limit rather than an invented one.
//
// Returns 0 for a drawing with no text, which has nothing to be illegible.
function legibleWidthMm(svg) {
  const viewBox = /viewBox="([^"]+)"/.exec(svg);
  if (!viewBox) return 0;

  let smallest = Infinity;
  const fonts = /font-size="([\d.]+)"/g;
  let match;
  while ((match = fonts.exec(svg)) !== null) {
    smallest = Math.min(smallest, Number(match[1]));
  }
  if (!Number.isFinite(smallest) || smallest <= 0) return 0;

  const unitsWide = Number(viewBox[1].trim().split(/\s+/)[2]);
  if (!unitsWide) return 0;

  // The SVG fills the zone's width, so a font of N units prints at N times
  // that scale. Solve for the width that puts the smallest font on the floor.
  return ((TYPE.note * PT_MM) / smallest) * unitsWide;
}

module.exports = {
  BANK_HEADING,
  boldMarkedInHtml,
  namesTheBank,
  colouringLoneAsks,
  sentenceKinds,
  escWithDigitBoxes,
  BODY_PT,
  PT_MM,
  LINE_MM,
  NOTE_LINE_MM,
  WRITING_LINE_MM,
  WRITING_LINE_GROWN_RATIO,
  BLANK_CHARS,
  BLANK_MM,
  esc,
  promptHtml,
  normaliseBlanks,
  linesFor,
  tieSentenceStarts,
  tieHtmlText,
  heightFromAspect,
  legibleWidthMm,
};
