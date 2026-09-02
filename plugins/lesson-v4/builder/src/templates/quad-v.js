'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const GAP_Y         = 0.08;
const TOP_RATIO     = 0.10;
const CENTRE_RATIO  = 0.45;
const LOWER_RATIO   = 0.15;
const BOTTOM_RATIO  = 0.30;
// ─── END COORDINATES ──────────────────────────────────────────

function drawQuadV(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);
  const usableH = bz.h - GAP_Y * 3;

  const topH    = usableH * TOP_RATIO;
  const centreH = usableH * CENTRE_RATIO;
  const lowerH  = usableH * LOWER_RATIO;
  const bottomH = usableH * BOTTOM_RATIO;

  let y = bz.y;
  const topZone    = { x: bz.x, y: y, w: bz.w, h: topH,    class: 'B' };
  y += topH + GAP_Y;
  const centreZone = { x: bz.x, y: y, w: bz.w, h: centreH, class: 'A' };
  y += centreH + GAP_Y;
  const lowerZone  = { x: bz.x, y: y, w: bz.w, h: lowerH,  class: 'B' };
  y += lowerH + GAP_Y;
  const bottomZone = { x: bz.x, y: y, w: bz.w, h: bottomH, class: 'B' };

  if (data.top)    drawContent(pptx, slide, topZone,    data.top,    ctx);
  if (data.centre) drawContent(pptx, slide, centreZone, data.centre, ctx);
  if (data.lower)  drawContent(pptx, slide, lowerZone,  data.lower,  ctx);
  if (data.bottom) drawContent(pptx, slide, bottomZone, data.bottom, ctx);
}

module.exports = { drawQuadV };
