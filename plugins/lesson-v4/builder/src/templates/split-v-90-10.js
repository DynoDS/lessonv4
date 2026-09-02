'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const GAP_Y         = 0.15;
const PRIMARY_RATIO = 0.90;
// ─── END COORDINATES ──────────────────────────────────────────

function drawSplitV9010(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

  const primaryH   = (bz.h - GAP_Y) * PRIMARY_RATIO;
  const secondaryH = bz.h - GAP_Y - primaryH;
  const side       = data.primarySide || 'top';

  let primaryZone, secondaryZone;
  if (side === 'top') {
    primaryZone   = { x: bz.x, y: bz.y,                        w: bz.w, h: primaryH,   class: 'A' };
    secondaryZone = { x: bz.x, y: bz.y + primaryH + GAP_Y,     w: bz.w, h: secondaryH, class: 'F' };
  } else {
    secondaryZone = { x: bz.x, y: bz.y,                        w: bz.w, h: secondaryH, class: 'F' };
    primaryZone   = { x: bz.x, y: bz.y + secondaryH + GAP_Y,   w: bz.w, h: primaryH,   class: 'A' };
  }

  if (data.primary)   drawContent(pptx, slide, primaryZone,   data.primary,   ctx);
  if (data.secondary) drawContent(pptx, slide, secondaryZone, data.secondary, ctx);
}

module.exports = { drawSplitV9010 };
