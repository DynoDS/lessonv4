'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');
const { drawCard } = require('./teach-compare');

// ─── COORDINATES ──────────────────────────────────────────────
const TOP_RATIO    = 0.60;
const ROW_GAP      = 0.15;
const CARD_GAP_X   = 0.30;

const LEFT_CATEGORY  = 'blue';
const RIGHT_CATEGORY = 'orange';
// ─── END COORDINATES ──────────────────────────────────────────

function drawTeachCompareWithRow(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

  const topH = bz.h * TOP_RATIO;
  const bottomH = bz.h - topH - ROW_GAP;
  const cardW = (bz.w - CARD_GAP_X) / 2;
  const leftX = bz.x;
  const rightX = bz.x + cardW + CARD_GAP_X;

  drawCard(pptx, slide, {
    x: leftX, y: bz.y, w: cardW, h: topH
  }, data.leftHeading, data.leftContent, {
    categoryColor: LEFT_CATEGORY
  }, ctx);

  drawCard(pptx, slide, {
    x: rightX, y: bz.y, w: cardW, h: topH
  }, data.rightHeading, data.rightContent, {
    categoryColor: RIGHT_CATEGORY
  }, ctx);

  if (data.supports) {
    const rowZone = {
      x: bz.x, y: bz.y + topH + ROW_GAP,
      w: bz.w, h: bottomH, class: 'B'
    };
    drawContent(pptx, slide, rowZone, data.supports, ctx);
  }
}

module.exports = { drawTeachCompareWithRow };
