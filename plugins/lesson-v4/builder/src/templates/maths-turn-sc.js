'use strict';

const { drawHeader } = require('../headers');
const { drawContent } = require('../content');
const { drawQuestions, drawWorkingSpace, measureQuestionsHeight, largestQuestionFont } = require('./maths-turn');
const { measureCompositionExtent } = require('../content');
const { drawSuccessCriteriaPanel } = require('../success-criteria-panel');
const { withoutRecording } = require('../warnings');
const requireGlobal = require('../require-global');

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
// The widths the panel may take, narrowest first. It keeps 4.60 unless the
// whole list needs more to read at 18pt; 6.35 is 41% of the slide, inside the
// teacher's half-slide limit. Its right edge stays where it is, and the
// question and working side give up what the panel takes.
const SC_WIDTHS      = [SC_W, 5.50, 6.35];

const VISUAL_GAP     = 0.18;   // gap between visual and working space
const Q_VISUAL_GAP   = 0.15;
const VISUAL_SPARE_FLOOR   = 0.25;  // below this the spare is not worth moving
const VISUAL_BREATHING_ROOM = 0.35; // never take the diagram's last inch: a
                                    // figure pressed against the task above it
                                    // reads as one crowded block   // gap between the (now content-sized) question box and the visual below it
const STACKED_PICTURE_SHARE = 0.5;  // the most of the height a picture above the working space takes
// ─── END COORDINATES ──────────────────────────────────────────

function drawMathsTurnSc(pptx, slide, data, ctx) {
  // The panel's width comes first: the question and working side take what it
  // leaves, and a list no width holds is refused before anything is drawn.
  const panelW = scPanelWidth(data, ctx);
  const qW     = Q_W - panelWidening(panelW);
  const workW  = WORK_W - panelWidening(panelW);

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
  const qOptions  = { questionNumbering: data.questionNumbering };
  const naturalQH = measureQuestionsHeight(questions, qW, null, qOptions);
  const qCap      = Q_H + 0.85;   // cap so a very long task can't swallow the visual
  const baseQH    = Math.min(naturalQH, qCap);
  const noWork    = data.workingSpace === false;

  // Room the visual will not use belongs to the task, not to the background.
  //
  // Handing the question's spare height down to the visual was already right,
  // and half the story: every visual has a size past which it stops growing, so
  // when the diagram is smaller than the room below it the difference used to
  // settle on the board as a band of nothing, with the task above it printed at
  // its ordinary size whether or not the slide had inches going begging. Ask the
  // visual what it actually wants, and spend what it does not want on the one
  // thing on the slide that is read from the back of the room.
  //
  // A composition that cannot be measured says so, and then nothing moves: the
  // question keeps the height its own text needs, exactly as before.
  const baseVisualY = questions.length ? (Q_Y + baseQH + Q_VISUAL_GAP) : Q_Y;
  const baseVisualH = Q_BOTTOM - baseVisualY;

  // A picture beside the working space gets half of what the panel leaves.
  // When the panel has widened and the picture cannot be drawn in that half (a
  // number line is refused in a column much under today's 3.9in), it goes above
  // the working space instead, across the whole side, as the reference does on
  // `maths-turn-ref-sc`. At today's width nothing moves. A photograph always
  // draws, so it stays beside and gets smaller, and below its readable floor
  // the build reports it as it would at 4.60in: above, it would get at most
  // half the height, which does not rescue it.
  const besideW  = (workW - VISUAL_GAP) / 2;
  const stacked  = !noWork && !!data.questionVisual && panelW > SC_W &&
    !drawsIn(data.questionVisual, { x: WORK_X, y: baseVisualY, w: besideW, h: baseVisualH, class: 'C' }, ctx);
  const visWidth = noWork || stacked ? workW : besideW;

  let qH = baseQH;
  let questionFont;

  if (questions.length && data.questionVisual && baseVisualH > 0 && !stacked) {
    const wanted = measureCompositionExtent(
      { x: WORK_X, y: baseVisualY, w: visWidth, h: baseVisualH, class: 'C' },
      data.questionVisual,
      ctx
    );
    if (wanted) {
      const spare = baseVisualH - wanted.h;
      if (spare > VISUAL_SPARE_FLOOR) {
        qH = Math.min(qCap, baseQH + spare - VISUAL_BREATHING_ROOM);
        questionFont = largestQuestionFont(questions, qW, qH, qOptions);
        // Take only the height the larger type genuinely needs. Growing the box
        // past the text would just move the band of nothing inside the card.
        qH = Math.min(qH, measureQuestionsHeight(questions, qW, questionFont, qOptions));
      }
    }
  }

  drawQuestions(slide, questions, { x: Q_X, y: Q_Y, w: qW, h: qH }, pptx, ctx, {
    questionNumbering: data.questionNumbering,
    questionFont: questionFont
  });

  const visualY = questions.length ? (Q_Y + qH + Q_VISUAL_GAP) : Q_Y;
  const visualH = Q_BOTTOM - visualY;

  if (data.questionVisual && stacked) {
    // The picture takes the height it measures, at most half, and the working
    // space the rest; a picture that cannot say takes the half.
    const pictureMax = visualH * STACKED_PICTURE_SHARE;
    const wanted = measureCompositionExtent(
      { x: WORK_X, y: visualY, w: workW, h: pictureMax, class: 'C' },
      data.questionVisual,
      ctx
    );
    const pictureH = wanted ? Math.min(wanted.h, pictureMax) : pictureMax;
    drawContent(pptx, slide, {
      x: WORK_X, y: visualY, w: workW, h: pictureH, class: 'C'
    }, data.questionVisual, ctx);
    drawWorkingSpace(pptx, slide, {
      x: WORK_X, y: visualY + pictureH + VISUAL_GAP, w: workW, h: visualH - pictureH - VISUAL_GAP
    });
  } else if (data.questionVisual) {
    const visW = visWidth;
    drawContent(pptx, slide, {
      x: WORK_X, y: visualY, w: visW, h: visualH, class: 'C'
    }, data.questionVisual, ctx);
    if (!noWork) {
      drawWorkingSpace(pptx, slide, {
        x: WORK_X + visW + VISUAL_GAP, y: visualY, w: workW - visW - VISUAL_GAP, h: visualH
      });
    }
  } else if (!noWork) {
    drawWorkingSpace(pptx, slide, { x: WORK_X, y: visualY, w: workW, h: visualH });
  }

  drawScPanel(pptx, slide, data, ctx, panelW);
}

// The practice panel's width, one choice for every `*-sc` template: the
// narrowest of SC_WIDTHS at which the whole list fits at 18pt or more. A list
// that fits 4.60 keeps it, so a lesson that draws today draws the same (the
// teacher chose 18pt, not 20pt, as the trigger on 23 September 2026 for exactly
// that).
//
// Each width is tried by drawing the panel onto a slide nobody sees, with the
// same code that draws it for real, so the choice and the drawing cannot
// disagree. Only the list not fitting (`STEP_TEXT_OVERLOAD`, the step fitter's
// refusal) moves it to the next width: he agreed a box that widens when a list
// needs it, so anything else the panel refuses, a fraction wall too shallow in
// a criteria stack say, is raised at the width it happened. Either way the
// refusal is raised before anything else is drawn: the slide is refused for
// what is in its panel, not for whatever was squeezed beside it, and a list no
// width holds is refused by the numbers of the widest card it had.
function scPanelWidth(data, ctx) {
  const PptxGenJS = requireGlobal('pptxgenjs');
  const dry = new PptxGenJS();
  for (const w of SC_WIDTHS) {
    try {
      withoutRecording(() => drawSuccessCriteriaPanel(dry, dry.addSlide(), scPanelZone(w), data, ctx));
      return w;
    } catch (err) {
      const listDoesNotFit = /^STEP_TEXT_OVERLOAD:/.test(String(err && err.message));
      if (!listDoesNotFit || w === SC_WIDTHS[SC_WIDTHS.length - 1]) throw err;
    }
  }
  return SC_W;
}

// How much wider than 4.60 the panel is: what the question, reference, cards
// and working space beside it give up.
function panelWidening(panelW) {
  return panelW - SC_W;
}

function scPanelZone(panelW) {
  return {
    x: SC_X - panelWidening(panelW), y: SC_Y, w: panelW, h: SC_H,
    // A list marked too long goes under 18pt only at the widest (see
    // success-criteria-panel.js): below it, the next width comes first.
    practicePanel: true,
    widestPracticePanel: panelW === SC_WIDTHS[SC_WIDTHS.length - 1]
  };
}

// Whether content can be drawn in a zone at all, found by drawing it onto a
// slide nobody sees.
function drawsIn(content, zone, ctx) {
  const PptxGenJS = requireGlobal('pptxgenjs');
  const dry = new PptxGenJS();
  try {
    withoutRecording(() => drawContent(dry, dry.addSlide(), zone, content, ctx));
    return true;
  } catch (err) {
    return false;
  }
}

// The panel geometry (surface, label, compact white cards, flipchart signal)
// is the shared success-criteria panel: one identity for the template route
// and the sc-panel content type alike. With no width it keeps today's 4.60,
// which the retired `maths-mtotyt-sc` relies on.
function drawScPanel(pptx, slide, data, ctx, panelW = SC_W) {
  drawSuccessCriteriaPanel(pptx, slide, scPanelZone(panelW), data, ctx);
}

module.exports = { drawMathsTurnSc, drawScPanel, scPanelWidth, panelWidening };
