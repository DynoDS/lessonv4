'use strict';

// A fraction is written top and bottom, wherever it appears.
//
// Until 9 October 2026 a stacked fraction existed only inside a drawing or a
// sum. Every sentence is typed text, so "2/5 and 4/10 are the same amount"
// printed with slashes, on the same page as a fraction wall of stacked
// fractions: two ways of writing the thing a Year 4 class was being taught to
// read (stress test, 7 October 2026). Nobody chose the slash. There was no way
// to stack a fraction inside words. The teacher's ruling, from the real sheet:
// "fractions should always be top and bottom".
//
// So worksheets and slips, the answer sheet and the printed activities pass
// their finished words through here, and a fraction typed with a slash is set
// as a numerator over a denominator with a bar between, at the size of the
// words around it. Nobody has to ask for it and no helper has to know.
//
// The working wall passes its words through here too, with the smaller
// in-line size below. Slide text is stacked by the slide fitter
// (builder/scripts/fit_text_postprocess.py), and a label drawn inside a
// picture by shared/visuals/stacked-fraction-labels.js. Teacher notes keep the
// typed form.
//
//   stackFractionsInHtml(html) -> html     only the words between tags; never a
//                                          tag's own attributes, and never
//                                          inside a drawing, a style or a script
//   STACKED_FRACTION_CSS                   the three rules that draw it
//   FRACTION                               the pattern, for a surface that
//                                          draws fractions its own way (slides)
//
// What counts as a fraction: one to three digits, a slash, one to three
// digits, with no digit, slash, point or comma touching either end. That
// leaves a date written 9/10/2026 and a long number alone. Either part may be
// a question mark or an empty box, for a fraction with a part to find
// ("1/2 = ?/10").
//
// A part the child writes is a box on the bar. A blank typed as underscores or
// as an empty-box character, or one a sheet has already drawn as a write-in
// line or a digit box, used to fall outside all of this: "2/3 = ___/6" printed
// a blank and then "/6" typed on the line, the one fraction on the page not
// written top and bottom (stress test, 12 October 2026). The teacher's choice
// from the real sheet (13 October 2026): a box big enough to write in sits
// where the missing part goes, and "fractions ANYWHERE should always be top
// bottom".

const PART = '(?:\\d{1,3}|\\?|_{2,}|[\\u25A1\\u25A2\\u2610\\u25FB\\u25AB])';
const TO_WRITE = /^(?:_{2,}|[\u25A1\u25A2\u2610\u25FB\u25AB])$/;
const WRITE_IN_BOX = '<span class="sfr-box"></span>';
// A blank a sheet has already drawn, standing where a fraction's part goes.
const DRAWN_BLANK = '<span class="(?:h-blank|h-digit-box)"[^>]*></span>';
const DRAWN_BLANK_FRACTION = new RegExp(
  `(${DRAWN_BLANK})/(${DRAWN_BLANK}|\\d{1,3})(?![\\d/]|[.,]\\d)|(?<![\\d/.,])(\\d{1,3})/(${DRAWN_BLANK})`,
  'g'
);
const FRACTION = new RegExp(`(^|[^\\d/.,])(${PART})/(${PART})(?![\\d/]|[.,]\\d)`, 'g');

// The small margin above and below is the gap between two fractions that fall
// one under the other on neighbouring lines, so a denominator never sits on
// the numerator beneath it.
const STACKED_FRACTION_CSS = `
  .sfr {
    display: inline-flex; flex-direction: column; align-items: center;
    vertical-align: middle; line-height: 1.05; margin: 0.1em 0.12em;
    text-indent: 0; white-space: nowrap;
  }
  .sfr-n, .sfr-d { padding: 0 0.2em; }
  .sfr-bar { align-self: stretch; height: 0.07em; background: currentColor; }
  /* The part a child writes: the one box a sheet gives a number, in step with
     NUMBER_BOX_MM in worksheet-html/src/tokens.js (a test holds the two
     together). */
  .sfr-box {
    display: block; box-sizing: border-box; width: 12mm; height: 12mm;
    margin: 0.15em 0; border: 0.09em solid currentColor; background: #FFFFFF;
  }
`;

// The same fraction for a surface whose boxes are sized before the page is
// drawn: the working wall plans every line of words at a fixed height, and a
// fraction at the size of its words is nearly two lines tall, so a strip
// planned for one line ran off the foot of its sheet. Here the digits are small
// enough that the pair stands inside one planned line, and nothing the wall
// sized has to change.
const STACKED_FRACTION_IN_LINE_CSS = `${STACKED_FRACTION_CSS}
  /* Lifted a hair: a digit's own box reaches a little under its line, and in a
     title strip sized to its words that was a pixel past the strip. */
  .sfr { font-size: 0.56em; line-height: 1; margin: 0 0.2em; position: relative; top: -0.1em; }
  /* A part to write is small enough here that the pair still stands inside
     the one planned line. */
  .sfr-box { width: 1.7em; height: 1em; margin: 0.05em 0; }
`;

function stackedHtml(top, bottom) {
  const part = (value) => (TO_WRITE.test(value) ? WRITE_IN_BOX : value);
  return `<span class="sfr"><span class="sfr-n">${part(top)}</span><span class="sfr-bar"></span><span class="sfr-d">${part(bottom)}</span></span>`;
}

function stackFractionsInText(text) {
  return text.replace(FRACTION, (all, before, top, bottom) => `${before}${stackedHtml(top, bottom)}`);
}

function stackFractionsInHtml(html) {
  const source = String(html == null ? '' : html);
  if (!source.includes('/')) return source;
  let skip = 0;
  return source
    .replace(DRAWN_BLANK_FRACTION, (all, blankTop, lower, top, blankBottom) =>
      (blankTop !== undefined
        ? stackedHtml('__', /^\d/.test(lower) ? lower : '__')
        : stackedHtml(top, '__')))
    .split(/(<[^>]+>)/)
    .map((piece, i) => {
      if (i % 2) {
        if (/^<(svg|style|script|title)\b/i.test(piece) && !/\/>$/.test(piece)) skip += 1;
        else if (/^<\/(svg|style|script|title)\b/i.test(piece)) skip = Math.max(0, skip - 1);
        return piece;
      }
      if (skip || !piece.includes('/')) return piece;
      return stackFractionsInText(piece);
    })
    .join('');
}

// The typed form back again, for a check that looks for a spec's words among
// the printed ones: a stacked fraction prints its two numbers and no slash.
// A part to write comes back as a typed blank.
const STACKED = /<span class="sfr"><span class="sfr-n">(<span class="sfr-box"><\/span>|[^<]*)<\/span><span class="sfr-bar"><\/span><span class="sfr-d">(<span class="sfr-box"><\/span>|[^<]*)<\/span><\/span>/g;
function unstackFractionsInHtml(html) {
  const typed = (part) => (part === WRITE_IN_BOX ? '___' : part);
  return String(html == null ? '' : html).replace(STACKED, (all, top, bottom) => `${typed(top)}/${typed(bottom)}`);
}

module.exports = { stackFractionsInHtml, stackFractionsInText, unstackFractionsInHtml, STACKED_FRACTION_CSS, STACKED_FRACTION_IN_LINE_CSS, FRACTION };
