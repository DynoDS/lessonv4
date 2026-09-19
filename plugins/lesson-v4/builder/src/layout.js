'use strict';

const SLIDE_W = 13.333;
const SLIDE_H = 7.5;

const MARGIN_X = 0.22;
const MARGIN_TOP = 0.25;
const MARGIN_BOTTOM = 0.25;

const CONTENT_W = SLIDE_W - MARGIN_X * 2;

const HEADER_TITLE_H   = 0.60;
const HEADER_STARTER_H = 2.27;
// The extra header row a starter prompt claims. "Starter" is the heading on the
// opening slide of every lesson and is never replaced; a question or prompt the
// designer wants there reads underneath it, on a line of its own.
const STARTER_PROMPT_H = 0.62;

const HEADER_TITLE = {
  titleX:       0.07,
  titleY:       0.00,
  titleW:       8.00,
  titleH:       0.54,
  instructionX: 8.20,
  instructionY: 0.00,
  instructionW: 5.06,
  instructionH: 0.54
};

const HEADER_STARTER = {
  dateX:    MARGIN_X,
  dateY:    0.25,
  dateW:    CONTENT_W,
  dateH:    0.60,
  loX:      MARGIN_X,
  loY:      1.00,
  loW:      CONTENT_W,
  loH:      0.60,
  headingX: MARGIN_X,
  headingY: 1.84,
  headingW: 4.00,
  headingH: 0.60,
  instructionX: 4.42,
  instructionY: 1.84,
  instructionW: 8.69,
  instructionH: 0.60,
  promptX: MARGIN_X,
  promptY: 2.50,
  promptW: CONTENT_W,
  promptH: 0.55
};

// The starter's own prompt: the question or line the designer wants under the
// "Starter" heading, or nothing.
//
// The heading slot is a label slot - four inches wide, at heading size - and a
// deck that put a question in it got "What do you remember about PSHE?" shrunk
// to two lines of small print no class could read, with the word "Starter" gone
// from the lesson's opening slide altogether (flagged by Daniel, 2 September
// 2026: "Starter heading must ALWAYS be there"). So the label stays put and the
// question takes a full-width line of its own beneath it.
// The starter's own prompt line, and the one thing it must not print.
//
// A starter slide already says what it is: "Starter", underlined, in the header.
// The line under it is for something the designer deliberately puts there, a
// retrieval question or a prompt, and `heading` is how they say so.
//
// It used to fall back to `title`, so any starter slide carrying a title printed
// that title as if it were a prompt. On Round to 10, 100 or 1,000 that put
// "Rounding to 1,000" at 28pt directly above "Round to the nearest 1,000:" at
// 48pt, saying the same thing twice, and it also cost the body a whole prompt
// row of height because `starterHeaderHeight` reserves one whenever a prompt
// exists. The teacher deleted it by hand and said it is a standing annoyance:
// "It keeps doing little titles for the starter. And I don't know why, because I
// don't want them in any lesson. Just the starter heading that's underlined is
// enough." (19 September 2026.)
//
// So a title never becomes a prompt. A real prompt still prints, and a starter
// with neither gets its header row of height back for the content.
function starterPrompt(data) {
  if (!data || typeof data !== 'object') return '';
  const value = String(data.heading || '').trim();
  if (!value || /^starter$/i.test(value)) return '';
  return value;
}

function starterHeaderHeight(data) {
  return HEADER_STARTER_H + (starterPrompt(data) ? STARTER_PROMPT_H : 0);
}

function bodyZone(headerStyle, data) {
  if (headerStyle === 'starter') {
    const headerH = starterHeaderHeight(data);
    return {
      x: MARGIN_X,
      y: MARGIN_TOP + headerH,
      w: CONTENT_W,
      h: SLIDE_H - MARGIN_BOTTOM - (MARGIN_TOP + headerH)
    };
  }
  return {
    x: MARGIN_X,
    y: HEADER_TITLE_H,
    w: CONTENT_W,
    h: SLIDE_H - MARGIN_BOTTOM - HEADER_TITLE_H
  };
}

module.exports = {
  SLIDE_W, SLIDE_H,
  MARGIN_X, MARGIN_TOP, MARGIN_BOTTOM, CONTENT_W,
  HEADER_TITLE_H, HEADER_STARTER_H, STARTER_PROMPT_H,
  HEADER_TITLE, HEADER_STARTER,
  starterPrompt, starterHeaderHeight,
  bodyZone
};
