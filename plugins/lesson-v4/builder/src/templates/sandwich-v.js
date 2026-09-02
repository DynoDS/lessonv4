'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const STRIP_H = 0.55;
const GAP_Y   = 0.12;
// ─── END COORDINATES ──────────────────────────────────────────

function drawSandwichV(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

  const middleH = bz.h - (STRIP_H * 2) - (GAP_Y * 2);

  const topZone    = { x: bz.x, y: bz.y,                            w: bz.w, h: STRIP_H, class: 'F' };
  const middleZone = { x: bz.x, y: bz.y + STRIP_H + GAP_Y,          w: bz.w, h: middleH, class: 'A' };
  const bottomZone = { x: bz.x, y: bz.y + bz.h - STRIP_H,           w: bz.w, h: STRIP_H, class: 'F' };

  if (data.top)    drawContent(pptx, slide, topZone,    data.top,    ctx);
  if (data.middle) drawContent(pptx, slide, middleZone, data.middle, ctx);
  if (data.bottom) drawContent(pptx, slide, bottomZone, data.bottom, ctx);
}

module.exports = { drawSandwichV };
