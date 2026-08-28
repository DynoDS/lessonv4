'use strict';

const { FONT, COLOURS, FIT } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');

// ─── CONSTANTS ────────────────────────────────────────────────
// A multiplication-facts grid (the SATs "missing numbers in this
// multiplication grid" shape): an operator corner box, column headers along
// the top, row headers down the left, and product cells in the body. Drawn as
// large square cells so the numbers read from the back of the room. Any cell
// passed as "" is an empty box (a gap for the teacher or child to fill); any
// cell passed with the "||" marker (e.g. "||21") reveals its value in green,
// so the answer slide fills the previously-empty cells green right inside the
// grid — no separate answer list needed.
const PAD            = 0.08;
const HEADER_FILL    = 'D9D9D9';   // grey corner + headers, like the printed paper
const BODY_FILL      = 'FFFFFF';
const CELL_LINE      = '000000';
const CELL_LINE_W    = 1.5;
const FONT_RATIO     = 0.46;       // number height as a fraction of cell size
const FONT_MAX       = 40;
const FONT_MIN       = 14;
// ─── END CONSTANTS ────────────────────────────────────────────

function drawMultGrid(pptx, slide, zone, data) {
  const corner = (data.corner != null) ? String(data.corner) : '×';
  const colHeaders = Array.isArray(data.colHeaders) ? data.colHeaders : [];
  const rowHeaders = Array.isArray(data.rowHeaders) ? data.rowHeaders : [];
  const cells = Array.isArray(data.cells) ? data.cells : [];

  const cols = colHeaders.length + 1;
  const rows = rowHeaders.length + 1;
  if (cols < 2 || rows < 2) return;

  // Square cells sized to fit the zone, then centre the whole grid block.
  const availW = zone.w - 2 * PAD;
  const availH = zone.h - 2 * PAD;
  const cell = Math.max(0.3, Math.min(availW / cols, availH / rows));
  const gridW = cell * cols;
  const gridH = cell * rows;
  const startX = zone.x + (zone.w - gridW) / 2;
  const startY = zone.y + (zone.h - gridH) / 2;

  const fontSize = Math.max(FONT_MIN, Math.min(FONT_MAX, Math.round(cell * 72 * FONT_RATIO)));

  // value at grid position (r, c): r/c are 0-based including the header band.
  function valueAt(r, c) {
    if (r === 0 && c === 0) return corner;
    if (r === 0) return colHeaders[c - 1];
    if (c === 0) return rowHeaders[r - 1];
    const bodyRow = cells[r - 1];
    return (Array.isArray(bodyRow) && bodyRow[c - 1] != null) ? bodyRow[c - 1] : '';
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = startX + c * cell;
      const cy = startY + r * cell;
      const isHeader = (r === 0 || c === 0);

      slide.addShape(pptx.shapes.RECTANGLE, {
        x: cx, y: cy, w: cell, h: cell,
        fill: { color: isHeader ? HEADER_FILL : BODY_FILL },
        line: { color: CELL_LINE, width: CELL_LINE_W }
      });

      const raw = valueAt(r, c);
      if (raw != null && String(raw) !== '') {
        slide.addText(splitAnswerRuns(String(raw), true), {
          x: cx + 0.03, y: cy + 0.03,
          w: cell - 0.06, h: cell - 0.06,
          fontFace: FONT, fontSize: fontSize, bold: true,
          color: COLOURS.body,
          align: 'center', valign: 'middle', margin: 0,
          fit: FIT
        });
      }
    }
  }
}

module.exports = { drawMultGrid };
