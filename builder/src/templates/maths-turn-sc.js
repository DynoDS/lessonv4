'use strict';

const { drawHeader } = require('../headers');
const { drawContent } = require('../content');
const { drawQuestions, drawWorkingSpace, measureQuestionsHeight } = require('./maths-turn');
const { drawSuccessCriteriaPanel } = require('../success-criteria-panel');

// ─── COORDINATES ──────────────────────────────────────────────
const Q_X            = 0.22;
const Q_Y            = 0.75;
const Q_W            = 7.99;
const Q_H            = 1.65;

const WORK_X         = 0.22;
const WORK_Y         = 2.55;
const WORK_W         = 7.99;
const WORK_H         = 4.70;

const SC_X           = 8.51;
const SC_Y           = 0.75;
const SC_W           = 4.60;
const SC_H           = 6.50;

const VISUAL_GAP     = 0.18;   // gap between visual and working space
const Q_VISUAL_GAP   = 0.15;   // gap between the (now content-sized) question box and the visual below it
// ─── END COORDINATES ──────────────────────────────────────────

function drawMathsTurnSc(pptx, slide, data, ctx) {
  const titleOverride = data.title || 'My Turn';
  drawHeader(slide, {
    headerStyle: 'title',
    title: titleOverride,
    instruction: data.instruction,
    signal: data.signal
  }, ctx);

  const questions = Array.isArray(data.questions) ? data.questions : [];

  // Shrink the question box to the height its text needs, then start the visual /
  // working zone right below it so a one-line task hands its spare room to the
  // diagram (no centred dead space), while a longer task still gets its lines.
  const Q_BOTTOM  = WORK_Y + WORK_H;
  // Measure with the same numbering the draw will use: a lettered teacher-led
  // set reserves label room on every row, so measuring it unlettered would
  // under-estimate the height the text actually needs.
  const naturalQH = measureQuestionsHeight(questions, Q_W, null, {
    questionNumbering: data.questionNumbering
  });
  const qH        = Math.min(naturalQH, Q_H + 0.85);   // cap so a very long task can't swallow the visual
  drawQuestions(slide, questions, { x: Q_X, y: Q_Y, w: Q_W, h: qH }, pptx, ctx, {
    questionNumbering: data.questionNumbering
  });

  const visualY = questions.length ? (Q_Y + qH + Q_VISUAL_GAP) : Q_Y;
  const visualH = Q_BOTTOM - visualY;
  const noWork  = data.workingSpace === false;

  if (data.questionVisual) {
    const visW = noWork ? WORK_W : (WORK_W - VISUAL_GAP) / 2;
    drawContent(pptx, slide, {
      x: WORK_X, y: visualY, w: visW, h: visualH, class: 'C'
    }, data.questionVisual, ctx);
    if (!noWork) {
      drawWorkingSpace(pptx, slide, {
        x: WORK_X + visW + VISUAL_GAP, y: visualY, w: WORK_W - visW - VISUAL_GAP, h: visualH
      });
    }
  } else if (!noWork) {
    drawWorkingSpace(pptx, slide, { x: WORK_X, y: visualY, w: WORK_W, h: visualH });
  }

  drawScPanel(pptx, slide, data, ctx);
}

// The panel geometry (surface, label, compact white cards, flipchart signal)
// is the shared success-criteria panel: one identity for the template route
// and the sc-panel content type alike.
function drawScPanel(pptx, slide, data, ctx) {
  drawSuccessCriteriaPanel(
    pptx,
    slide,
    { x: SC_X, y: SC_Y, w: SC_W, h: SC_H },
    data,
    ctx
  );
}

module.exports = { drawMathsTurnSc, drawScPanel };
