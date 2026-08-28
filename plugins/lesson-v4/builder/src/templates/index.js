'use strict';

const { warn } = require('../warnings');
const { drawDecorationLayer } = require("../decorations");
const { drawLessonCover } = require('./lesson-cover');
const { drawBodyFull } = require('./body-full');
const { drawMathsTurn } = require('./maths-turn');
const { drawMathsTurnSc } = require('./maths-turn-sc');
const { drawMathsTurnRefSc } = require('./maths-turn-ref-sc');
const { drawWritingTurnRefSc } = require('./writing-turn-ref-sc');
const { drawMathsYourTurn } = require('./maths-your-turn');
const { drawMathsYourTurnSc } = require('./maths-your-turn-sc');
const { drawMathsMtotyt } = require('./maths-mtotyt');
const { drawMathsMtotytSc } = require('./maths-mtotyt-sc');
const { drawKeyVocabulary } = require('./key-vocabulary');
const { drawSuccessCriteria } = require('./success-criteria');
const { drawGrid4 } = require('./grid-4');
const { drawCentreBigV } = require('./centre-big-v');
const { drawSplitH7030 } = require('./split-h-70-30');
const { drawSplitH6040 } = require('./split-h-60-40');
const { drawSplitH5050 } = require('./split-h-50-50');
const { drawSplitH7525 } = require('./split-h-75-25');
const { drawSplitH8020 } = require('./split-h-80-20');
const { drawSplitH9010 } = require('./split-h-90-10');
const { drawSplitV5050 } = require('./split-v-50-50');
const { drawSplitV6040 } = require('./split-v-60-40');
const { drawSplitV7030 } = require('./split-v-70-30');
const { drawSplitV7525 } = require('./split-v-75-25');
const { drawSplitV8020 } = require('./split-v-80-20');
const { drawSplitV9010 } = require('./split-v-90-10');
const { drawTeachCompare } = require('./teach-compare');
const { drawTeachCompareWithRow } = require('./teach-compare-with-row');
const { drawTeachSteps } = require('./teach-steps');
const { drawTeachSequence } = require('./teach-sequence');
const { drawTeachAnnotated } = require('./teach-annotated');
const { drawThirdsH } = require('./thirds-h');
const { drawThirdsV } = require('./thirds-v');
const { drawCentreBigH } = require('./centre-big-h');
const { drawSideBigH } = require('./side-big-h');
const { drawSideBigV } = require('./side-big-v');
const { drawSandwichV } = require('./sandwich-v');
const { drawQuadV } = require('./quad-v');
const { drawGrid6 } = require('./grid-6');
const { drawBannerGrid6 } = require('./banner-grid-6');
const { drawCentralCallouts4 } = require('./central-callouts-4');
const { drawTaskScaffold } = require('./task-scaffold');
const { drawBodySidebar } = require('./body-sidebar');
const { drawFlankedSplit } = require('./flanked-split');
const { drawCardsAndBars } = require('./cards-and-bars');
const { drawGridCalc } = require('./grid-calc');
const { drawNumberSets } = require('./number-sets');
const { drawSpeechBubbles1, drawSpeechBubbles2, drawSpeechBubbles3 } = require('./speech-bubbles');
const { drawStarterQuestionTall } = require('./starter-question-tall');

const TEMPLATES = {
  'lesson-cover':       drawLessonCover,
  'body-full':          drawBodyFull,
  'maths-turn':         drawMathsTurn,
  'maths-turn-sc':      drawMathsTurnSc,
  'maths-turn-ref-sc':  drawMathsTurnRefSc,
  'writing-turn-ref-sc':drawWritingTurnRefSc,
  'maths-your-turn':    drawMathsYourTurn,
  'maths-your-turn-sc': drawMathsYourTurnSc,
  'maths-mtotyt':       drawMathsMtotyt,
  'maths-mtotyt-sc':    drawMathsMtotytSc,
  'key-vocabulary':     drawKeyVocabulary,
  'success-criteria':   drawSuccessCriteria,
  'grid-4':                drawGrid4,
  'centre-big-v':          drawCentreBigV,
  'split-h-50-50':         drawSplitH5050,
  'split-h-60-40':         drawSplitH6040,
  'split-h-70-30':         drawSplitH7030,
  'split-h-75-25':         drawSplitH7525,
  'split-h-80-20':         drawSplitH8020,
  'split-h-90-10':         drawSplitH9010,
  'split-v-50-50':         drawSplitV5050,
  'split-v-60-40':         drawSplitV6040,
  'split-v-70-30':         drawSplitV7030,
  'split-v-75-25':         drawSplitV7525,
  'split-v-80-20':         drawSplitV8020,
  'split-v-90-10':         drawSplitV9010,
  'teach-compare':         drawTeachCompare,
  'teach-compare-with-row':drawTeachCompareWithRow,
  'teach-steps':           drawTeachSteps,
  'teach-sequence':        drawTeachSequence,
  'teach-annotated':       drawTeachAnnotated,
  'thirds-h':              drawThirdsH,
  'thirds-v':              drawThirdsV,
  'centre-big-h':          drawCentreBigH,
  'side-big-h':            drawSideBigH,
  'side-big-v':            drawSideBigV,
  'sandwich-v':            drawSandwichV,
  'quad-v':                drawQuadV,
  'grid-6':                drawGrid6,
  'banner-grid-6':         drawBannerGrid6,
  'central-callouts-4':    drawCentralCallouts4,
  'task-scaffold':         drawTaskScaffold,
  'body-sidebar':          drawBodySidebar,
  'flanked-split':         drawFlankedSplit,
  'cards-and-bars':        drawCardsAndBars,
  'grid-calc':             drawGridCalc,
  'number-sets':           drawNumberSets,
  'speech-bubbles-1':      drawSpeechBubbles1,
  'speech-bubbles-2':      drawSpeechBubbles2,
  'speech-bubbles-3':      drawSpeechBubbles3,
  'starter-question-tall': drawStarterQuestionTall
};

function drawSlide(pptx, slide, data, ctx) {
  const name = data.template;
  const fn = TEMPLATES[name];
  if (!fn) {
    warn(ctx.slideIndex, `unknown template "${name}" — rendering placeholder slide`);
    drawUnknownTemplate(slide, name);
    return;
  }
  if (ctx && ctx.decorationPlan) {
    drawDecorationLayer(slide, ctx.decorationPlan, "low", ctx.slideIndex);
  }

  fn(pptx, slide, data, ctx);

  if (ctx && ctx.decorationPlan) {
    drawDecorationLayer(slide, ctx.decorationPlan, "high", ctx.slideIndex);
  }
}

function drawUnknownTemplate(slide, name) {
  slide.addText(`Unknown template: ${name}`, {
    x: 0.5, y: 3.0, w: 12.333, h: 1.5,
    fontFace: 'Comic Sans MS', fontSize: 24, bold: true,
    color: 'CC0000', align: 'center', valign: 'middle',
    margin: 0, fit: 'shrink'
  });
}

module.exports = { drawSlide, TEMPLATES };
