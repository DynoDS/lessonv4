'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const SIDEBAR_RATIO = 0.30;
const BANNER_H      = 0.70;
const GAP_X         = 0.20;
const GAP_Y         = 0.15;
// ─── END COORDINATES ──────────────────────────────────────────

function drawBodySidebar(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

  const sidebarW = (bz.w - GAP_X) * SIDEBAR_RATIO;
  const leftW    = bz.w - GAP_X - sidebarW;

  const bannerZone = { x: bz.x, y: bz.y,                          w: leftW, h: BANNER_H,               class: 'B'      };
  const bodyZ      = { x: bz.x, y: bz.y + BANNER_H + GAP_Y,       w: leftW, h: bz.h - BANNER_H - GAP_Y, class: 'E-wide' };
  const sidebarZone = { x: bz.x + leftW + GAP_X, y: bz.y,         w: sidebarW, h: bz.h,                class: 'E-narrow' };

  if (data.banner)  drawContent(pptx, slide, bannerZone,  data.banner,  ctx);
  if (data.body)    drawContent(pptx, slide, bodyZ,       data.body,    ctx);
  if (data.sidebar) drawContent(pptx, slide, sidebarZone, data.sidebar, ctx);
}

module.exports = { drawBodySidebar };
