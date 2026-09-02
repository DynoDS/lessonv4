'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const BANNER_H   = 0.80;
const BANNER_GAP = 0.15;
const CELL_GAP   = 0.18;
// ─── END COORDINATES ──────────────────────────────────────────

function drawBannerGrid6(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

  const bannerZone = { x: bz.x, y: bz.y, w: bz.w, h: BANNER_H, class: 'B' };
  if (data.banner) drawContent(pptx, slide, bannerZone, data.banner, ctx);

  const gridY = bz.y + BANNER_H + BANNER_GAP;
  const gridH = bz.h - BANNER_H - BANNER_GAP;
  const cells = Array.isArray(data.cells) ? data.cells : [];

  const cellW = (bz.w - CELL_GAP * 2) / 3;
  const cellH = (gridH - CELL_GAP) / 2;

  for (let i = 0; i < 6 && i < cells.length; i++) {
    if (!cells[i]) continue;
    const col = i % 3;
    const row = Math.floor(i / 3);
    const zone = {
      x: bz.x + col * (cellW + CELL_GAP),
      y: gridY + row * (cellH + CELL_GAP),
      w: cellW, h: cellH, class: 'G'
    };
    drawContent(pptx, slide, zone, cells[i], ctx);
  }
}

module.exports = { drawBannerGrid6 };
