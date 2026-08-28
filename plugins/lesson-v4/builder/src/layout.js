'use strict';

const SLIDE_W = 13.333;
const SLIDE_H = 7.5;

const MARGIN_X = 0.22;
const MARGIN_TOP = 0.25;
const MARGIN_BOTTOM = 0.25;

const CONTENT_W = SLIDE_W - MARGIN_X * 2;

const HEADER_TITLE_H   = 0.60;
const HEADER_STARTER_H = 2.27;

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
  instructionH: 0.60
};

function bodyZone(headerStyle) {
  if (headerStyle === 'starter') {
    return {
      x: MARGIN_X,
      y: MARGIN_TOP + HEADER_STARTER_H,
      w: CONTENT_W,
      h: SLIDE_H - MARGIN_BOTTOM - (MARGIN_TOP + HEADER_STARTER_H)
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
  HEADER_TITLE_H, HEADER_STARTER_H,
  HEADER_TITLE, HEADER_STARTER,
  bodyZone
};
