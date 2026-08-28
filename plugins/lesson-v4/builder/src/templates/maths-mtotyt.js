'use strict';

const { FONT, COLOURS, SIZE_CEILINGS, FIT } = require('../styles');
const { drawHeader } = require('../headers');
const { drawQuestions, drawWorkingSpace } = require('./maths-turn');
const { drawQuestionCards, firstLabel } = require('./maths-your-turn');

// ─── COORDINATES ──────────────────────────────────────────────
const MARGIN_X    = 0.22;
const GAP_X       = 0.20;
const BODY_Y      = 0.70;
const BODY_BOTTOM = 7.25;
const COL_W       = (13.333 - MARGIN_X * 2 - GAP_X * 2) / 3;

const MT_X = MARGIN_X;
const OT_X = MT_X + COL_W + GAP_X;
const YT_X = OT_X + COL_W + GAP_X;

const LABEL_H       = 0.50;
const LABEL_GAP     = 0.10;
const Q_H           = 1.40;
const Q_WORK_GAP    = 0.10;

const LABEL_Y     = BODY_Y;
const Q_Y         = LABEL_Y + LABEL_H + LABEL_GAP;
const WORK_Y      = Q_Y + Q_H + Q_WORK_GAP;
const WORK_H      = BODY_BOTTOM - WORK_Y;
const CARDS_Y     = Q_Y;
const CARDS_H     = BODY_BOTTOM - CARDS_Y;

const LABEL_FONT  = 20;
// ─── END COORDINATES ──────────────────────────────────────────

function drawMathsMtotyt(pptx, slide, data, ctx) {
  drawHeader(slide, {
    headerStyle: 'title',
    title: data.title || '',
    instruction: data.instruction,
    signal: data.signal
  }, ctx);

  drawColumnLabel(slide, MT_X, 'My Turn');
  drawQuestions(slide, asArr(data.myTurn),   { x: MT_X, y: Q_Y, w: COL_W, h: Q_H }, pptx, ctx, {
    // My Turn is the teacher's model: no letters, the teacher names the
    // question out loud.
    questionNumbering: 'none'
  });
  drawWorkingSpace(pptx, slide,              { x: MT_X, y: WORK_Y, w: COL_W, h: WORK_H });

  drawColumnLabel(slide, OT_X, 'Our Turn');
  drawQuestions(slide, asArr(data.ourTurn),  { x: OT_X, y: Q_Y, w: COL_W, h: Q_H }, pptx, ctx, {
    // A Maths Our Turn the class works through together is the teacher-led
    // set: letters are the class's shared reference points. One question
    // earns no letters (a lone "(a)" reads as a fault).
    questionNumbering: asArr(data.ourTurn).length > 1 ? 'teacher-led' : 'none'
  });
  drawWorkingSpace(pptx, slide,              { x: OT_X, y: WORK_Y, w: COL_W, h: WORK_H });

  drawColumnLabel(slide, YT_X, 'Your Turn');
  drawQuestionCards(pptx, slide, asArr(data.yourTurn), { x: YT_X, y: CARDS_Y, w: COL_W, h: CARDS_H }, ctx, firstLabel(data));
}

function drawColumnLabel(slide, x, text) {
  slide.addText(text, {
    x: x, y: LABEL_Y, w: COL_W, h: LABEL_H,
    fontFace: FONT, fontSize: LABEL_FONT, bold: true,
    color: COLOURS.title, align: 'left', valign: 'middle',
    underline: { style: 'sng' }, margin: 0, fit: FIT
  });
}

function asArr(v) { return Array.isArray(v) ? v : []; }

module.exports = { drawMathsMtotyt };
