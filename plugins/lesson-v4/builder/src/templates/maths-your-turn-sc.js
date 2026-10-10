'use strict';

const { drawHeader } = require('../headers');
const { drawContent } = require('../content');
const { drawQuestionCards, firstLabel } = require('./maths-your-turn');
const { drawScPanel, scPanelWidth, panelWidening } = require('./maths-turn-sc');
const { pairedEntries } = require('../content/reveal-pair');

// ─── COORDINATES ──────────────────────────────────────────────
const CARDS_X = 0.22;
const CARDS_Y = 0.75;
const CARDS_W = 7.99;
const CARDS_H = 6.50;
const VISUAL_GAP = 0.15;        // gap between the practice visual and the cards beneath it
const VISUAL_RATIO = 0.56;      // share of the left area the visual takes when cards sit below
// ─── END COORDINATES ──────────────────────────────────────────

function drawMathsYourTurnSc(pptx, slide, data, ctx) {
  // The cards give up what the success-criteria panel takes (maths-turn-sc).
  const panelW = scPanelWidth(data, ctx);
  const cardsW = CARDS_W - panelWidening(panelW);

  const titleOverride = data.title || 'Your Turn';
  drawHeader(slide, {
    headerStyle: 'title',
    title: titleOverride,
    instruction: data.instruction,
    signal: data.signal,
    doSign: data.doSign
  }, ctx);

  const questions = Array.isArray(data.questions) ? data.questions : [];
  const pair = data.revealPair ? pairedEntries(data, ctx) : null;

  // When the practice is placing shapes onto a Venn or Carroll, the diagram (and the
  // shapes to place) belong on the Your Turn itself, so a child reads them while they
  // work rather than meeting the labels only as words inside the success criteria.
  // The visual takes the upper part of the left area; any text question cards sit
  // beneath it. With no visual, the cards keep the whole area as before.
  if (data.questionVisual) {
    const visualH = questions.length ? (CARDS_H - VISUAL_GAP) * VISUAL_RATIO : CARDS_H;
    drawContent(pptx, slide, {
      x: CARDS_X, y: CARDS_Y, w: cardsW, h: visualH, class: 'C'
    }, data.questionVisual, ctx);
    if (questions.length) {
      drawQuestionCards(pptx, slide, questions, {
        x: CARDS_X, y: CARDS_Y + visualH + VISUAL_GAP, w: cardsW, h: CARDS_H - visualH - VISUAL_GAP
      }, ctx, firstLabel(data), pair);
    }
  } else {
    drawQuestionCards(pptx, slide, questions, {
      x: CARDS_X, y: CARDS_Y, w: cardsW, h: CARDS_H
    }, ctx, firstLabel(data), pair);
  }

  drawScPanel(pptx, slide, data, ctx, panelW);
}

module.exports = { drawMathsYourTurnSc };
