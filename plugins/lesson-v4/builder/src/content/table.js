'use strict';

const { FONT, COLOURS, FIT } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');
const { fitGroupId, growFitObjectName } = require('../text-fit');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD              = 0.12;
const HEADER_H         = 0.50;
const HEADER_FONT      = 16;
const HEADER_FONT_MAX  = 40;
const CELL_FONT        = 14;
const CELL_FONT_MAX    = 54;
const HEADER_FILL      = '3A3A3A';
const HEADER_TEXT      = 'FFFFFF';
const ROW_FILLS        = ['FFE0C2', 'FFF8C2', 'D6EEFF', 'D5F5E3', 'E8D5F5'];
const CELL_BORDER      = 'CCCCCC';
const FIRST_COL_BOLD   = true;
const CELL_ALIGN       = 'center';
// One line of cell text at the build's 10pt readable floor, measured through
// the same font metrics the fitting pass uses. A row shorter than this cannot
// show its own content at any size a child can read.
const ROW_MIN_H        = 0.20;
// ─── END CONSTANTS ────────────────────────────────────────────

// A table divides whatever height it is handed. Handed too little, it used to
// divide it anyway and hand every cell a slot no line of text could sit in;
// the fault then surfaced at the very end of the build as TEXT_OVERLOAD on a
// generated box name, reading as "the words are too heavy" when the words were
// "(1)" and the room was the whole problem. Cutting text cannot repair that, so
// the refusal happens here, in the units the zone is written in.
function requiredZoneHeight(rowCount) {
  return 2 * PAD + HEADER_H + rowCount * ROW_MIN_H;
}

function drawTable(pptx, slide, zone, data) {
  const headers = Array.isArray(data.headers) ? data.headers : [];
  const rows    = Array.isArray(data.rows)    ? data.rows    : [];
  if (headers.length === 0 || rows.length === 0) return;

  const cols   = headers.length;
  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD;
  const colW   = innerW / cols;
  const bodyH  = innerH - HEADER_H;
  const rowH   = bodyH / rows.length;

  if (rowH < ROW_MIN_H) {
    const needed = requiredZoneHeight(rows.length);
    throw new Error(
      `TABLE_ZONE_TOO_SHORT: ${rows.length} row(s) plus the header leave ` +
        `${rowH.toFixed(2)}in per row in a ${zone.h.toFixed(2)}in zone, below the ` +
        `${ROW_MIN_H.toFixed(2)}in one line of cell text needs at the readable ` +
        `floor. Give the table a zone at least ${needed.toFixed(2)}in tall, or ` +
        `carry fewer rows; nothing was shrunk further or cut.`
    );
  }
  const headerGroup = fitGroupId(zone, 'table-headers');
  const columnGroups = headers.map(function (_header, c) {
    return fitGroupId(zone, 'table-column-' + c);
  });

  headers.forEach(function (h, c) {
    const cx = innerX + c * colW;
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: cx, y: innerY, w: colW, h: HEADER_H,
      fill: { color: HEADER_FILL },
      line: { color: HEADER_FILL, width: 1 }
    });
    slide.addText(h || '', {
      x: cx, y: innerY, w: colW, h: HEADER_H,
      fontFace: FONT, fontSize: HEADER_FONT, bold: true, color: HEADER_TEXT,
      align: 'center', valign: 'middle', margin: 0, fit: FIT,
      objectName: growFitObjectName(headerGroup, HEADER_FONT_MAX, 'table-header-' + c)
    });
  });

  rows.forEach(function (row, r) {
    const rowFill = ROW_FILLS[r % ROW_FILLS.length];
    row.forEach(function (cell, c) {
      const cx = innerX + c * colW;
      const cy = innerY + HEADER_H + r * rowH;
      const isFirstCol = c === 0;
      const cellBold   = isFirstCol ? true : !FIRST_COL_BOLD;
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: cx, y: cy, w: colW, h: rowH,
        fill: { color: rowFill },
        line: { color: CELL_BORDER, width: 1 }
      });
      slide.addText(splitAnswerRuns(cell || '', cellBold), {
        x: cx, y: cy, w: colW, h: rowH,
        fontFace: FONT, fontSize: CELL_FONT, bold: cellBold, color: COLOURS.body,
        align: CELL_ALIGN, valign: 'middle', margin: 0, fit: FIT,
        objectName: growFitObjectName(columnGroups[c], CELL_FONT_MAX, 'table-cell-' + r + '-' + c)
      });
    });
  });
}

module.exports = { drawTable, requiredZoneHeight, ROW_MIN_H };
