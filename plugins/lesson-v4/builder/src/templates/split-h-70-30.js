'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const GAP_X         = 0.20;
const PRIMARY_RATIO = 0.70;
// ─── END COORDINATES ──────────────────────────────────────────

function drawSplitH7030(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle);

  const primaryW   = (bz.w - GAP_X) * PRIMARY_RATIO;
  const secondaryW = bz.w - GAP_X - primaryW;
  const side       = data.primarySide || 'left';

  let primaryZone, secondaryZone;
  if (side === 'left') {
    primaryZone   = { x: bz.x,                            y: bz.y, w: primaryW,   h: bz.h, class: 'E-wide'   };
    secondaryZone = { x: bz.x + primaryW + GAP_X,         y: bz.y, w: secondaryW, h: bz.h, class: 'E-narrow' };
  } else {
    secondaryZone = { x: bz.x,                            y: bz.y, w: secondaryW, h: bz.h, class: 'E-narrow' };
    primaryZone   = { x: bz.x + secondaryW + GAP_X,       y: bz.y, w: primaryW,   h: bz.h, class: 'E-wide'   };
  }

  if (data.primary)   drawContent(pptx, slide, primaryZone,   data.primary,   ctx);
  if (data.secondary) drawContent(pptx, slide, secondaryZone, data.secondary, ctx);
}

module.exports = { drawSplitH7030 };
