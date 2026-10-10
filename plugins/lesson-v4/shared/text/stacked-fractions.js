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

const PART = '(?:\\d{1,3}|\\?|[\\u25A1\\u25A2\\u2610\\u25FB\\u25AB])';
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
`;

function stackFractionsInText(text) {
  return text.replace(FRACTION, (all, before, top, bottom) =>
    `${before}<span class="sfr"><span class="sfr-n">${top}</span><span class="sfr-bar"></span><span class="sfr-d">${bottom}</span></span>`);
}

function stackFractionsInHtml(html) {
  const source = String(html == null ? '' : html);
  if (!source.includes('/')) return source;
  let skip = 0;
  return source
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
const STACKED = /<span class="sfr"><span class="sfr-n">([^<]*)<\/span><span class="sfr-bar"><\/span><span class="sfr-d">([^<]*)<\/span><\/span>/g;
function unstackFractionsInHtml(html) {
  return String(html == null ? '' : html).replace(STACKED, '$1/$2');
}

module.exports = { stackFractionsInHtml, stackFractionsInText, unstackFractionsInHtml, STACKED_FRACTION_CSS, STACKED_FRACTION_IN_LINE_CSS, FRACTION };
