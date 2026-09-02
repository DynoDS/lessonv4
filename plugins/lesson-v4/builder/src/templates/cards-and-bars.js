'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const CARDS_RATIO = 0.70;
const GAP_X       = 0.20;
const GAP_Y       = 0.15;
// ─── END COORDINATES ──────────────────────────────────────────

function drawCardsAndBars(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

  const cards = Array.isArray(data.cards) ? data.cards : [];
  const bars  = Array.isArray(data.bars)  ? data.bars  : [];

  const cardsH = bz.h * CARDS_RATIO;
  const barsH  = bz.h - cardsH - GAP_Y;
  const colW   = (bz.w - GAP_X * 2) / 3;

  for (let i = 0; i < 3; i++) {
    const colX = bz.x + i * (colW + GAP_X);
    if (cards[i]) {
      const cardZone = { x: colX, y: bz.y, w: colW, h: cardsH, class: 'C' };
      drawContent(pptx, slide, cardZone, cards[i], ctx);
    }
    if (bars[i]) {
      const barZone = { x: colX, y: bz.y + cardsH + GAP_Y, w: colW, h: barsH, class: 'F' };
      drawContent(pptx, slide, barZone, bars[i], ctx);
    }
  }
}

module.exports = { drawCardsAndBars };
