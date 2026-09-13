'use strict';

// The Comic Sans tables and the width in ems live in shared/text/comic-glyph-width.js,
// so the shared drawings measure words exactly as the slides do. This file keeps
// the slide-inch and PowerPoint text-frame arithmetic built on top of them.
const { textWidthEm, UNKNOWN_EM, RENDER_SAFETY } = require('../../shared/text/comic-glyph-width');

// The width of one line of text in slide inches at a given point size.
//
// Rounded up to a whole point, because that is what the renderer the fit pass
// measures with does. The proportional safety above covers a long line, where
// the rounding is a rounding error; it cannot cover a short one, where a single
// glyph carries the whole of it. That is why a box drawn to hold one letter -
// a point named on a number line, a line labelled A - could come back as
// overflowing while a whole sentence beside it fitted comfortably.
function textWidthIn(text, fontPt, bold) {
  const raw = (textWidthEm(text, bold) * Number(fontPt || 0)) / 72;

  return Math.ceil(raw * 72) / 72;
}

// PowerPoint reserves a small inset inside every text frame, and the fit pass
// (scripts/fit_text_postprocess.py, PAD_W) subtracts the same allowance before
// deciding what fits. So the last authority on a box's font size measures the
// box as this much narrower than it is drawn - and a box drawn to exactly its
// own text width is a hair short in the only measurement that counts. A helper
// sizing a box FOR its own words asks for this width, not the bare text width.
const BOX_INSET_IN = 0.05;

function textBoxWidthIn(text, fontPt, bold) {
  return textWidthIn(text, fontPt, bold) + BOX_INSET_IN;
}

// How many lines `text` takes at `fontPt` in a box `availW` wide, wrapping at
// spaces only, measured with the same glyph widths as the boxes. A word wider
// than the box is Infinity: a helper that meets it has to widen the box or
// refuse, never let PowerPoint split the word.
function wrappedLineCount(text, fontPt, availW, bold) {
  const words = String(text == null ? '' : text).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  let lines = 1;
  let current = '';
  for (const word of words) {
    if (textBoxWidthIn(word, fontPt, bold) > availW + 1e-6) return Infinity;
    const candidate = current ? current + ' ' + word : word;
    if (textBoxWidthIn(candidate, fontPt, bold) <= availW + 1e-6) {
      current = candidate;
    } else {
      lines += 1;
      current = word;
    }
  }
  return lines;
}

module.exports = {
  wrappedLineCount,
  textWidthEm,
  textWidthIn,
  textBoxWidthIn,
  UNKNOWN_EM,
  RENDER_SAFETY,
  BOX_INSET_IN
};
