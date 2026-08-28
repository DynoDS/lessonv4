'use strict';

// A shared squared grid with one or more labelled rectangular patches drawn on
// it — the "each square = 1m², find the area of each patch" layout. Children
// count squares (or multiply side lengths) for each named region. Cells are
// always square so a counted square genuinely equals a unit of area.
//
// Rectangles are positioned in grid squares from the TOP-LEFT of the grid
// (x across, y down), which is how a child reads a printed grid. Patches are
// drawn filled first, then the gridlines overlay them so every unit square stays
// visible to count, then each patch's bold outline and label go on top.
//
// Spec:
//   cols, rows   the grid size in unit squares (default 10 × 6)
//   unitLabel    caption under the grid, e.g. "Each square = 1m²" (optional)
//   rects        [{ x, y, w, h, label, color }]
//                  x, y    top-left corner of the patch in grid squares
//                  w, h    width and height in squares
//                  label   text shown in the patch (e.g. "A")
//                  color   optional hex fill; otherwise cycles a pale palette

const { FONT, COLOURS, FIT } = require('../styles');
const { rule } = require('./_geom');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD          = 0.12;   // zone inner padding (inches)
const LABEL_H      = 0.38;   // caption band height (inches)
const LABEL_GAP    = 0.08;
const GRID_COLOUR  = COLOURS.gridLine;   // squared-paper lines, visible on the peach slide bg
const GRID_PT      = 0.008;
const FRAME_COLOUR = '333333';   // bold outer frame
const FRAME_PT     = 0.022;
const RECT_LINE    = 'C00000';   // bold patch outline (red so patches pop)
const RECT_PT      = 2.5;
const PATCH_FILLS  = ['FBE2C7', 'CCE2F5', 'D5F5E3', 'EAD5F5', 'FFF2CC', 'FAD4D4'];
const PATCH_FONT   = 20;
const LABEL_FONT   = 15;
// ─── END CONSTANTS ────────────────────────────────────────────

function drawAreaGrid(pptx, slide, zone, data) {
  const cols = Number.isFinite(data.cols) && data.cols > 0 ? data.cols : 10;
  const rows = Number.isFinite(data.rows) && data.rows > 0 ? data.rows : 6;
  const rects = Array.isArray(data.rects) ? data.rects : [];
  const hasLabel = !!data.unitLabel;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD - (hasLabel ? LABEL_H + LABEL_GAP : 0);

  const cell = Math.min(innerW / cols, innerH / rows);
  const gridW = cell * cols;
  const gridH = cell * rows;
  const ox = innerX + (innerW - gridW) / 2;
  const oy = innerY + (innerH - gridH) / 2;

  const px = function (gx) { return ox + gx * cell; };
  const py = function (gy) { return oy + gy * cell; };   // y down from the top

  // Patch fills (under the gridlines so each unit square stays countable).
  rects.forEach(function (r, i) {
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: px(r.x), y: py(r.y), w: r.w * cell, h: r.h * cell,
      fill: { color: r.color || PATCH_FILLS[i % PATCH_FILLS.length] },
      line: { type: 'none' }
    });
  });

  // Squared-paper gridlines.
  for (let i = 0; i <= cols; i++) rule(pptx, slide, px(i), oy, px(i), oy + gridH, GRID_COLOUR, GRID_PT);
  for (let j = 0; j <= rows; j++) rule(pptx, slide, ox, py(j), ox + gridW, py(j), GRID_COLOUR, GRID_PT);

  // Bold outer frame.
  rule(pptx, slide, ox, oy, ox + gridW, oy, FRAME_COLOUR, FRAME_PT);
  rule(pptx, slide, ox, oy + gridH, ox + gridW, oy + gridH, FRAME_COLOUR, FRAME_PT);
  rule(pptx, slide, ox, oy, ox, oy + gridH, FRAME_COLOUR, FRAME_PT);
  rule(pptx, slide, ox + gridW, oy, ox + gridW, oy + gridH, FRAME_COLOUR, FRAME_PT);

  // Patch outlines + labels on top.
  rects.forEach(function (r) {
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: px(r.x), y: py(r.y), w: r.w * cell, h: r.h * cell,
      fill: { type: 'none' }, line: { color: RECT_LINE, width: RECT_PT }
    });
    if (r.label != null && r.label !== '') {
      slide.addText(String(r.label), {
        x: px(r.x), y: py(r.y), w: r.w * cell, h: r.h * cell,
        fontFace: FONT, fontSize: PATCH_FONT, bold: true, color: COLOURS.body,
        align: 'center', valign: 'middle', margin: 0, objectName: 'NOFIT_ag-label'
      });
    }
  });

  if (hasLabel) {
    slide.addText(String(data.unitLabel), {
      x: innerX, y: innerY + innerH + LABEL_GAP, w: innerW, h: LABEL_H,
      fontFace: FONT, fontSize: LABEL_FONT, bold: true, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }
}

module.exports = { drawAreaGrid };
