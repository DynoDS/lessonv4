'use strict';

const { FONT, COLOURS, FIT } = require('../styles');

// ─── CONSTANTS ────────────────────────────────────────────────
// A diamond-nine ranking scaffold for foundation lessons (PSHE, RE,
// history significance). Five rows of cells in 1-2-3-2-1 formation;
// cells empty by default so children can copy and rank into books, or
// pre-filled if items are supplied as a model/exemplar.
const PAD              = 0.08;
const ROW_GAP          = 0.10;
const CELL_GAP         = 0.10;
const CELL_FILL        = 'FFFFFF';
const CELL_LINE        = '0070C0';   // title blue, matches pyramid
const CELL_LINE_W      = 2;
const ROW_COUNTS       = [1, 2, 3, 2, 1];
const MAX_ROW_CELLS    = 3;
const TOP_LABEL_H      = 0.30;
const BOTTOM_LABEL_H   = 0.30;
const LABEL_GAP        = 0.06;
const LABEL_FONT       = 14;
const ITEM_FONT_MAX    = 22;
const DEFAULT_TOP      = 'Most important';
const DEFAULT_BOTTOM   = 'Least important';
// ─── END CONSTANTS ────────────────────────────────────────────

function drawDiamondNine(pptx, slide, zone, data) {
  const items       = Array.isArray(data.items) ? data.items.slice(0, 9) : [];
  const topLabel    = data.topLabel    != null ? String(data.topLabel)    : DEFAULT_TOP;
  const bottomLabel = data.bottomLabel != null ? String(data.bottomLabel) : DEFAULT_BOTTOM;
  const showLabels  = data.showLabels !== false;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = Math.max(0.5, zone.w - 2 * PAD);
  const innerH = Math.max(0.5, zone.h - 2 * PAD);

  const topLabelH    = showLabels ? TOP_LABEL_H    : 0;
  const bottomLabelH = showLabels ? BOTTOM_LABEL_H : 0;
  const labelGapTop    = showLabels ? LABEL_GAP : 0;
  const labelGapBottom = showLabels ? LABEL_GAP : 0;

  // Top label
  if (showLabels) {
    slide.addText(topLabel, {
      x: innerX, y: innerY,
      w: innerW, h: topLabelH,
      fontFace: FONT, fontSize: LABEL_FONT, bold: true,
      color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0,
      fit: FIT
    });
  }

  const gridY = innerY + topLabelH + labelGapTop;
  const gridH = innerH - topLabelH - bottomLabelH - labelGapTop - labelGapBottom;

  const totalGapH = (ROW_COUNTS.length - 1) * ROW_GAP;
  const rowH = (gridH - totalGapH) / ROW_COUNTS.length;
  const cellW = (innerW - (MAX_ROW_CELLS - 1) * CELL_GAP) / MAX_ROW_CELLS;

  let itemIdx = 0;
  ROW_COUNTS.forEach(function (cellCount, rowIdx) {
    const rowY = gridY + rowIdx * (rowH + ROW_GAP);
    const totalRowW = cellCount * cellW + (cellCount - 1) * CELL_GAP;
    const rowStartX = innerX + (innerW - totalRowW) / 2;

    for (let i = 0; i < cellCount; i++) {
      const cellX = rowStartX + i * (cellW + CELL_GAP);

      slide.addShape(pptx.shapes.RECTANGLE, {
        x: cellX, y: rowY, w: cellW, h: rowH,
        fill: { color: CELL_FILL },
        line: { color: CELL_LINE, width: CELL_LINE_W }
      });

      const itemText = items[itemIdx];
      if (itemText) {
        slide.addText(String(itemText), {
          x: cellX + 0.05, y: rowY + 0.05,
          w: cellW - 0.10, h: rowH - 0.10,
          fontFace: FONT, fontSize: ITEM_FONT_MAX, bold: true,
          color: COLOURS.body,
          align: 'center', valign: 'middle', margin: 0,
          fit: FIT
        });
      }
      itemIdx++;
    }
  });

  // Bottom label
  if (showLabels) {
    slide.addText(bottomLabel, {
      x: innerX, y: innerY + innerH - bottomLabelH,
      w: innerW, h: bottomLabelH,
      fontFace: FONT, fontSize: LABEL_FONT, bold: true,
      color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0,
      fit: FIT
    });
  }
}

module.exports = { drawDiamondNine };
