'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const GAP_Y           = 0.15;
const PRIMARY_RATIO   = 0.50;
const SECONDARY_RATIO = 0.25;
// ─── END COORDINATES ──────────────────────────────────────────

function drawSideBigV(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle);

  const usableH    = bz.h - GAP_Y * 2;
  const primaryH   = usableH * PRIMARY_RATIO;
  const secondaryH = usableH * SECONDARY_RATIO;
  const side       = data.primarySide || 'top';

  let primaryZone, secondary1Zone, secondary2Zone;
  if (side === 'top') {
    primaryZone    = { x: bz.x, y: bz.y,                                                w: bz.w, h: primaryH,   class: 'A' };
    secondary1Zone = { x: bz.x, y: bz.y + primaryH + GAP_Y,                             w: bz.w, h: secondaryH, class: 'B' };
    secondary2Zone = { x: bz.x, y: bz.y + primaryH + GAP_Y + secondaryH + GAP_Y,        w: bz.w, h: secondaryH, class: 'B' };
  } else {
    secondary1Zone = { x: bz.x, y: bz.y,                                                w: bz.w, h: secondaryH, class: 'B' };
    secondary2Zone = { x: bz.x, y: bz.y + secondaryH + GAP_Y,                           w: bz.w, h: secondaryH, class: 'B' };
    primaryZone    = { x: bz.x, y: bz.y + 2 * secondaryH + 2 * GAP_Y,                   w: bz.w, h: primaryH,   class: 'A' };
  }

  if (data.primary)    drawContent(pptx, slide, primaryZone,    data.primary,    ctx);
  if (data.secondary1) drawContent(pptx, slide, secondary1Zone, data.secondary1, ctx);
  if (data.secondary2) drawContent(pptx, slide, secondary2Zone, data.secondary2, ctx);
}

module.exports = { drawSideBigV };
