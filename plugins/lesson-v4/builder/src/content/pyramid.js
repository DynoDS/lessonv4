'use strict';

const { FONT, COLOURS, FIT } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');

// ─── CONSTANTS ────────────────────────────────────────────────
// A ranking-pyramid scaffold for dialogic lessons: rows of cells stacked
// from a single cell at the top to wider rows beneath, drawn within the
// supplied zone. Cells are drawn empty by default so children rank cards
// onto a paper version; if items are supplied per row they are rendered
// inside the cells.
const PAD              = 0.05;
const ROW_GAP          = 0.10;
const CELL_GAP         = 0.10;
const CELL_FILL        = 'FFFFFF';
const CELL_LINE        = '0070C0';   // title blue
const CELL_LINE_W      = 2;
const ROW_LABEL_W      = 1.10;       // inches reserved for a row label column on the left
const ROW_LABEL_GAP    = 0.08;       // gap between label's right edge and its row's leftmost cell
const ROW_LABEL_FONT   = 14;
const ITEM_FONT_MAX    = 32;   // ceiling; shrink-to-fit pulls it down in small cells
// ─── END CONSTANTS ────────────────────────────────────────────

function drawPyramid(pptx, slide, zone, data) {
  const rows = (Array.isArray(data.rows) && data.rows.length > 0)
    ? data.rows
    : [{ cells: 1, items: [] }, { cells: 2, items: [] }, { cells: 3, items: [] }];

  const hasAnyLabel = rows.some(function (r) { return r && r.label; });
  const labelOffset = hasAnyLabel ? ROW_LABEL_W : 0;

  const innerX = zone.x + PAD + labelOffset;
  const innerY = zone.y + PAD;
  const innerW = Math.max(0.5, zone.w - 2 * PAD - labelOffset);
  const innerH = Math.max(0.5, zone.h - 2 * PAD);

  const maxCells = rows.reduce(function (m, r) {
    var c = (r && r.cells) ? r.cells : 1;
    return c > m ? c : m;
  }, 1);

  const totalGapH = (rows.length - 1) * ROW_GAP;
  const rowH = (innerH - totalGapH) / rows.length;
  const cellW = (innerW - (maxCells - 1) * CELL_GAP) / maxCells;

  rows.forEach(function (row, idx) {
    const cellCount = (row && row.cells) ? row.cells : 1;
    const rowY = innerY + idx * (rowH + ROW_GAP);
    const totalRowW = cellCount * cellW + (cellCount - 1) * CELL_GAP;
    const rowStartX = innerX + (innerW - totalRowW) / 2;

    if (row && row.label) {
      // Label hugs this row's leftmost cell, not the global label column.
      // Right edge of the label box sits ROW_LABEL_GAP to the left of
      // rowStartX; the box stretches back to the zone's left padding.
      // Right-aligned text inside means the visible label sits next to
      // the cell regardless of how indented the row is.
      const labelLeft = zone.x + PAD;
      const labelRight = rowStartX - ROW_LABEL_GAP;
      const labelBoxW = Math.max(0.3, labelRight - labelLeft);
      slide.addText(String(row.label), {
        x: labelLeft, y: rowY,
        w: labelBoxW, h: rowH,
        fontFace: FONT, fontSize: ROW_LABEL_FONT, bold: true,
        color: COLOURS.body,
        align: 'right', valign: 'middle', margin: 0,
        fit: FIT
      });
    }

    for (var i = 0; i < cellCount; i++) {
      const cellX = rowStartX + i * (cellW + CELL_GAP);

      slide.addShape(pptx.shapes.RECTANGLE, {
        x: cellX, y: rowY, w: cellW, h: rowH,
        fill: { color: CELL_FILL },
        line: { color: CELL_LINE, width: CELL_LINE_W }
      });

      const itemText = (row && Array.isArray(row.items)) ? row.items[i] : null;
      if (itemText !== null && itemText !== undefined && String(itemText) !== '') {
        // splitAnswerRuns turns "||28" into a green answer run and "28" into
        // plain black — so a missing brick revealed on the answer slide shows
        // green right inside the pyramid, no separate answer list needed.
        slide.addText(splitAnswerRuns(String(itemText), true), {
          x: cellX + 0.05, y: rowY + 0.05,
          w: cellW - 0.10, h: rowH - 0.10,
          fontFace: FONT, fontSize: ITEM_FONT_MAX, bold: true,
          color: COLOURS.body,
          align: 'center', valign: 'middle', margin: 0,
          fit: FIT
        });
      }
    }
  });
}

module.exports = { drawPyramid };
