'use strict';

const { FONT, FIT } = require('../styles');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');
const { drawQuestions, drawWorkingSpace } = require('./maths-turn');
const { drawScPanel } = require('./maths-turn-sc');

// ─── COORDINATES ──────────────────────────────────────────────
// Body region is the same width as `maths-turn-sc` (Q + WORK on the
// left, full-height SC on the right). The new piece is a reference
// panel sitting between the question strip and the working space.
const Q_X             = 0.22;
const Q_Y             = 0.75;
const Q_W             = 7.99;
const Q_H             = 1.20;

const REF_X           = 0.22;
const REF_Y           = 2.05;
const REF_W           = 7.99;
const REF_H           = 2.40;
const REF_PAD         = 0.10;
const REF_LABEL_H     = 0.36;
const REF_BG          = 'EAF2F8';   // pale blue — visually marks "given info"
const REF_LINE        = '5DADE2';   // mid-blue border, lighter than SC's green
const REF_LINE_W      = 1.0;
const REF_RADIUS      = 0.06;
const REF_LABEL_FONT  = 16;
const REF_LABEL_COLOR = '21618C';

const WORK_X          = 0.22;
const WORK_Y          = 4.55;
const WORK_W          = 7.99;
const WORK_H          = 2.70;
const VISUAL_GAP      = 0.18;
const REF_H_EXPANDED  = WORK_Y + WORK_H - REF_Y; // fills space when working area is hidden
// SC zone is identical to `maths-turn-sc` and is delegated to that
// module's drawScPanel — keeps the two templates aligned automatically.
// ─── END COORDINATES ──────────────────────────────────────────

function drawMathsTurnRefSc(pptx, slide, data, ctx) {
  const titleOverride = data.title || 'My Turn';
  drawHeader(slide, {
    headerStyle: 'title',
    title: titleOverride,
    instruction: data.instruction,
    signal: data.signal
  }, ctx);

  const questions = Array.isArray(data.questions) ? data.questions : [];
  drawQuestions(slide, questions, { x: Q_X, y: Q_Y, w: Q_W, h: Q_H }, pptx, ctx, {
    questionNumbering: data.questionNumbering
  });

  // Hiding the ruled working space does not hide a question visual. Previously
  // the reference panel expanded over the whole lower body first, so a
  // questionVisual in that legitimate configuration was silently dropped.
  const refH = data.hideWorkingSpace && !data.questionVisual ? REF_H_EXPANDED : REF_H;
  drawReferencePanel(pptx, slide, data, ctx, refH);

  if (data.hideWorkingSpace && data.questionVisual) {
    drawContent(
      pptx,
      slide,
      { x: WORK_X, y: WORK_Y, w: WORK_W, h: WORK_H, class: 'A' },
      data.questionVisual,
      ctx
    );
  } else if (!data.hideWorkingSpace) {
    if (data.questionVisual) {
      const visW = (WORK_W - VISUAL_GAP) / 2;
      drawContent(pptx, slide, { x: WORK_X, y: WORK_Y, w: visW, h: WORK_H, class: 'C' }, data.questionVisual, ctx);
      drawWorkingSpace(pptx, slide, { x: WORK_X + visW + VISUAL_GAP, y: WORK_Y, w: WORK_W - visW - VISUAL_GAP, h: WORK_H });
    } else {
      drawWorkingSpace(pptx, slide, { x: WORK_X, y: WORK_Y, w: WORK_W, h: WORK_H });
    }
  }

  drawScPanel(pptx, slide, data, ctx);
}

function drawReferencePanel(pptx, slide, data, ctx, refH = REF_H) {
  const hasLabel = !!data.referenceLabel;

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: REF_X, y: REF_Y, w: REF_W, h: refH,
    fill: { color: REF_BG },
    line: { color: REF_LINE, width: REF_LINE_W },
    rectRadius: REF_RADIUS
  });

  if (hasLabel) {
    slide.addText(data.referenceLabel, {
      x: REF_X + REF_PAD, y: REF_Y + REF_PAD,
      w: REF_W - 2 * REF_PAD, h: REF_LABEL_H,
      fontFace: FONT, fontSize: REF_LABEL_FONT, bold: true,
      color: REF_LABEL_COLOR, align: 'left', valign: 'middle',
      margin: 0, fit: FIT
    });
  }

  if (data.reference) {
    const labelOffset = hasLabel ? REF_LABEL_H : 0;
    const contentZone = {
      x: REF_X + REF_PAD,
      y: REF_Y + REF_PAD + labelOffset,
      w: REF_W - 2 * REF_PAD,
      h: refH - 2 * REF_PAD - labelOffset,
      class: 'B',
      noCard: true // the reference panel is this zone's surface
    };
    drawContent(pptx, slide, contentZone, data.reference, ctx);
  }
}

module.exports = { drawMathsTurnRefSc, drawReferencePanel };
