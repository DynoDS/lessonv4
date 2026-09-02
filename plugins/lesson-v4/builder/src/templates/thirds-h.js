'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const GAP_X = 0.20;
// ─── END COORDINATES ──────────────────────────────────────────

function drawThirdsH(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

  const colW = (bz.w - GAP_X * 2) / 3;
  const leftZone   = { x: bz.x,                              y: bz.y, w: colW, h: bz.h, class: 'D' };
  const middleZone = { x: bz.x + colW + GAP_X,               y: bz.y, w: colW, h: bz.h, class: 'D' };
  const rightZone  = { x: bz.x + 2 * colW + 2 * GAP_X,       y: bz.y, w: colW, h: bz.h, class: 'D' };

  if (data.left)   drawContent(pptx, slide, leftZone,   data.left,   ctx);
  if (data.middle) drawContent(pptx, slide, middleZone, data.middle, ctx);
  if (data.right)  drawContent(pptx, slide, rightZone,  data.right,  ctx);
}

module.exports = { drawThirdsH };
