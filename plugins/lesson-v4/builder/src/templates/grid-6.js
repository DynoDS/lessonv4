'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const CELL_GAP = 0.18;
// ─── END COORDINATES ──────────────────────────────────────────

function drawGrid6(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

  const cells = Array.isArray(data.cells) ? data.cells : [];
  if (cells.length === 0) return;

  const cellW = (bz.w - CELL_GAP * 2) / 3;
  const cellH = (bz.h - CELL_GAP) / 2;

  for (let i = 0; i < 6 && i < cells.length; i++) {
    if (!cells[i]) continue;
    const col = i % 3;
    const row = Math.floor(i / 3);
    const zone = {
      x: bz.x + col * (cellW + CELL_GAP),
      y: bz.y + row * (cellH + CELL_GAP),
      w: cellW, h: cellH, class: 'G'
    };
    drawContent(pptx, slide, zone, cells[i], ctx);
  }
}

module.exports = { drawGrid6 };
