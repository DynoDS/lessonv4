'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const GAP_Y         = 0.10;
const TOP_RATIO     = 0.22;
const BOTTOM_RATIO  = 0.25;
// ─── END COORDINATES ──────────────────────────────────────────

function drawCentreBigV(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

  const topH    = bz.h * TOP_RATIO;
  const bottomH = bz.h * BOTTOM_RATIO;
  const centreH = bz.h - topH - bottomH - GAP_Y * 2;

  const topZone = {
    x: bz.x, y: bz.y,
    w: bz.w, h: topH, class: 'B'
  };
  const centreZone = {
    x: bz.x, y: bz.y + topH + GAP_Y,
    w: bz.w, h: centreH, class: 'A'
  };
  const bottomZone = {
    x: bz.x, y: bz.y + topH + GAP_Y + centreH + GAP_Y,
    w: bz.w, h: bottomH, class: 'B'
  };

  if (data.top)    drawContent(pptx, slide, topZone,    data.top,    ctx);
  if (data.centre) drawContent(pptx, slide, centreZone, data.centre, ctx);
  if (data.bottom) drawContent(pptx, slide, bottomZone, data.bottom, ctx);
}

module.exports = { drawCentreBigV };
