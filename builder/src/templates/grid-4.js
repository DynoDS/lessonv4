'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const CELL_GAP = 0.18;
const DIVIDER_COLOUR = 'D9D9D9';   // light grey gridlines between the four cells
const DIVIDER_W      = 1;          // line weight (pt)
// ─── END COORDINATES ──────────────────────────────────────────

function drawGrid4(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle);

  const cells = Array.isArray(data.cells) ? data.cells : [];
  if (cells.length === 0) return;

  const cellW = (bz.w - CELL_GAP) / 2;
  const cellH = (bz.h - CELL_GAP) / 2;

  // A faint cross down the centre gaps so the four questions read as the cells of
  // a table rather than four prompts floating in whitespace — a question with no
  // diagram then sits in its own clear cell instead of looking like a stray gap.
  const midX = bz.x + cellW + CELL_GAP / 2;
  const midY = bz.y + cellH + CELL_GAP / 2;
  slide.addShape(pptx.shapes.LINE, {
    x: midX, y: bz.y, w: 0, h: bz.h,
    line: { color: DIVIDER_COLOUR, width: DIVIDER_W }
  });
  slide.addShape(pptx.shapes.LINE, {
    x: bz.x, y: midY, w: bz.w, h: 0,
    line: { color: DIVIDER_COLOUR, width: DIVIDER_W }
  });

  const positions = [
    { x: bz.x,                       y: bz.y },
    { x: bz.x + cellW + CELL_GAP,    y: bz.y },
    { x: bz.x,                       y: bz.y + cellH + CELL_GAP },
    { x: bz.x + cellW + CELL_GAP,    y: bz.y + cellH + CELL_GAP }
  ];

  cells.forEach(function (cellData, i) {
    if (i >= 4 || !cellData) return;
    const zone = {
      x: positions[i].x, y: positions[i].y,
      w: cellW, h: cellH, class: 'G'
    };
    drawContent(pptx, slide, zone, cellData, ctx);
  });
}

module.exports = { drawGrid4 };
