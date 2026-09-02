'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const GAP_X         = 0.20;
const PRIMARY_RATIO = 0.50;
const SECONDARY_RATIO = 0.25;
// ─── END COORDINATES ──────────────────────────────────────────

function drawSideBigH(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

  const usableW   = bz.w - GAP_X * 2;
  const primaryW  = usableW * PRIMARY_RATIO;
  const secondaryW = usableW * SECONDARY_RATIO;
  const side      = data.primarySide || 'left';

  let primaryZone, secondary1Zone, secondary2Zone;
  if (side === 'left') {
    primaryZone    = { x: bz.x,                                              y: bz.y, w: primaryW,   h: bz.h, class: 'C' };
    secondary1Zone = { x: bz.x + primaryW + GAP_X,                           y: bz.y, w: secondaryW, h: bz.h, class: 'G' };
    secondary2Zone = { x: bz.x + primaryW + GAP_X + secondaryW + GAP_X,      y: bz.y, w: secondaryW, h: bz.h, class: 'G' };
  } else {
    secondary1Zone = { x: bz.x,                                              y: bz.y, w: secondaryW, h: bz.h, class: 'G' };
    secondary2Zone = { x: bz.x + secondaryW + GAP_X,                         y: bz.y, w: secondaryW, h: bz.h, class: 'G' };
    primaryZone    = { x: bz.x + 2 * secondaryW + 2 * GAP_X,                 y: bz.y, w: primaryW,   h: bz.h, class: 'C' };
  }

  if (data.primary)    drawContent(pptx, slide, primaryZone,    data.primary,    ctx);
  if (data.secondary1) drawContent(pptx, slide, secondary1Zone, data.secondary1, ctx);
  if (data.secondary2) drawContent(pptx, slide, secondary2Zone, data.secondary2, ctx);
}

module.exports = { drawSideBigH };
