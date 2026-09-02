'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const SIDE_RATIO = 0.25;
const GAP_X      = 0.20;
const GAP_Y      = 0.15;
// ─── END COORDINATES ──────────────────────────────────────────

function drawFlankedSplit(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

  const usableW = bz.w - GAP_X * 2;
  const sideW   = usableW * SIDE_RATIO;
  const middleW = usableW - sideW * 2;
  const halfH   = (bz.h - GAP_Y) / 2;

  const leftZone    = { x: bz.x,                             y: bz.y, w: sideW,   h: bz.h,  class: 'E-narrow' };
  const middleX     = bz.x + sideW + GAP_X;
  const middleTopZone    = { x: middleX, y: bz.y,                          w: middleW, h: halfH, class: 'G' };
  const middleBottomZone = { x: middleX, y: bz.y + halfH + GAP_Y,          w: middleW, h: halfH, class: 'G' };
  const rightZone   = { x: middleX + middleW + GAP_X,        y: bz.y, w: sideW,   h: bz.h,  class: 'E-narrow' };

  if (data.left)         drawContent(pptx, slide, leftZone,         data.left,         ctx);
  if (data.middleTop)    drawContent(pptx, slide, middleTopZone,    data.middleTop,    ctx);
  if (data.middleBottom) drawContent(pptx, slide, middleBottomZone, data.middleBottom, ctx);
  if (data.right)        drawContent(pptx, slide, rightZone,        data.right,        ctx);
}

module.exports = { drawFlankedSplit };
