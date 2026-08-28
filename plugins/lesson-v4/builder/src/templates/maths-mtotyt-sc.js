'use strict';

const { FONT, COLOURS, SIZE_CEILINGS, FIT } = require('../styles');
const { drawHeader } = require('../headers');
const { drawQuestions, drawWorkingSpace } = require('./maths-turn');
const { drawQuestionCards, firstLabel } = require('./maths-your-turn');
const { drawScPanel } = require('./maths-turn-sc');

// ─── COORDINATES ──────────────────────────────────────────────
const MARGIN_X    = 0.22;
const GAP_X       = 0.20;
const BODY_Y      = 0.70;
const BODY_BOTTOM = 7.25;

const SC_LEFT_EDGE   = 8.51;
const LEFT_AREA_W    = SC_LEFT_EDGE - MARGIN_X - GAP_X;
const HALF_COL_W     = (LEFT_AREA_W - GAP_X) / 2;

const MT_X = MARGIN_X;
const OT_X = MT_X + HALF_COL_W + GAP_X;
const YT_X = MARGIN_X;
const YT_W = LEFT_AREA_W;

const MID_Y = (BODY_Y + BODY_BOTTOM) / 2;
const TOP_H = MID_Y - BODY_Y - 0.05;
const BOT_Y = MID_Y + 0.05;
const BOT_H = BODY_BOTTOM - BOT_Y;

const LABEL_H     = 0.45;
const LABEL_GAP   = 0.08;
const Q_H         = 1.25;
const Q_WORK_GAP  = 0.08;

const MT_LABEL_Y = BODY_Y;
const MT_Q_Y     = MT_LABEL_Y + LABEL_H + LABEL_GAP;
const MT_WORK_Y  = MT_Q_Y + Q_H + Q_WORK_GAP;
const MT_WORK_H  = (BODY_Y + TOP_H) - MT_WORK_Y;

const YT_LABEL_Y = BOT_Y;
const YT_CARDS_Y = YT_LABEL_Y + LABEL_H + LABEL_GAP;
const YT_CARDS_H = BODY_BOTTOM - YT_CARDS_Y;

const LABEL_FONT = 18;
// ─── END COORDINATES ──────────────────────────────────────────

function drawMathsMtotytSc(pptx, slide, data, ctx) {
  drawHeader(slide, {
    headerStyle: 'title',
    title: data.title || '',
    instruction: data.instruction,
    signal: data.signal
  }, ctx);

  drawColumnLabel(slide, MT_X, MT_LABEL_Y, HALF_COL_W, 'My Turn');
  drawQuestions(slide, asArr(data.myTurn),  { x: MT_X, y: MT_Q_Y, w: HALF_COL_W, h: Q_H }, pptx, ctx, {
    // My Turn is the teacher's model: no letters, the teacher names the
    // question out loud.
    questionNumbering: 'none'
  });
  drawWorkingSpace(pptx, slide,             { x: MT_X, y: MT_WORK_Y, w: HALF_COL_W, h: MT_WORK_H });

  drawColumnLabel(slide, OT_X, MT_LABEL_Y, HALF_COL_W, 'Our Turn');
  drawQuestions(slide, asArr(data.ourTurn), { x: OT_X, y: MT_Q_Y, w: HALF_COL_W, h: Q_H }, pptx, ctx, {
    // A Maths Our Turn the class works through together is the teacher-led
    // set: letters are the class's shared reference points. One question
    // earns no letters (a lone "(a)" reads as a fault).
    questionNumbering: asArr(data.ourTurn).length > 1 ? 'teacher-led' : 'none'
  });
  drawWorkingSpace(pptx, slide,             { x: OT_X, y: MT_WORK_Y, w: HALF_COL_W, h: MT_WORK_H });

  drawColumnLabel(slide, YT_X, YT_LABEL_Y, YT_W, 'Your Turn');
  drawQuestionCards(pptx, slide, asArr(data.yourTurn), { x: YT_X, y: YT_CARDS_Y, w: YT_W, h: YT_CARDS_H }, ctx, firstLabel(data));

  drawScPanel(pptx, slide, data, ctx);
}

function drawColumnLabel(slide, x, y, w, text) {
  slide.addText(text, {
    x: x, y: y, w: w, h: LABEL_H,
    fontFace: FONT, fontSize: LABEL_FONT, bold: true,
    color: COLOURS.title, align: 'left', valign: 'middle',
    underline: { style: 'sng' }, margin: 0, fit: FIT
  });
}

function asArr(v) { return Array.isArray(v) ? v : []; }

module.exports = { drawMathsMtotytSc };
