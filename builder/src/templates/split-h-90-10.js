'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const GAP_X         = 0.15;
const PRIMARY_RATIO = 0.90;
// ─── END COORDINATES ──────────────────────────────────────────

function drawSplitH9010(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle);

  const primaryW   = (bz.w - GAP_X) * PRIMARY_RATIO;
  const secondaryW = bz.w - GAP_X - primaryW;
  const side       = data.primarySide || 'left';

  let primaryZone, secondaryZone;
  if (side === 'left') {
    primaryZone   = { x: bz.x,                        y: bz.y, w: primaryW,   h: bz.h, class: 'A' };
    secondaryZone = { x: bz.x + primaryW + GAP_X,     y: bz.y, w: secondaryW, h: bz.h, class: 'F' };
  } else {
    secondaryZone = { x: bz.x,                        y: bz.y, w: secondaryW, h: bz.h, class: 'F' };
    primaryZone   = { x: bz.x + secondaryW + GAP_X,   y: bz.y, w: primaryW,   h: bz.h, class: 'A' };
  }

  if (data.primary)   drawContent(pptx, slide, primaryZone,   data.primary,   ctx);
  if (data.secondary) drawContent(pptx, slide, secondaryZone, data.secondary, ctx);
}

module.exports = { drawSplitH9010 };
