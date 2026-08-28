'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const GAP_Y = 0.15;
// ─── END COORDINATES ──────────────────────────────────────────

function drawThirdsV(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle);

  const rowH = (bz.h - GAP_Y * 2) / 3;
  const topZone    = { x: bz.x, y: bz.y,                            w: bz.w, h: rowH, class: 'B' };
  const middleZone = { x: bz.x, y: bz.y + rowH + GAP_Y,             w: bz.w, h: rowH, class: 'B' };
  const bottomZone = { x: bz.x, y: bz.y + 2 * rowH + 2 * GAP_Y,     w: bz.w, h: rowH, class: 'B' };

  if (data.top)    drawContent(pptx, slide, topZone,    data.top,    ctx);
  if (data.middle) drawContent(pptx, slide, middleZone, data.middle, ctx);
  if (data.bottom) drawContent(pptx, slide, bottomZone, data.bottom, ctx);
}

module.exports = { drawThirdsV };
