'use strict';

// A squared grid showing one marker translated from a start position to an end
// position, with a dashed arrow between them, for "how far has the shape moved?"
// translation work. The start marker is orange (the given position the child
// reads from) and the end marker blue; the arrow makes the slide-and-no-turn of
// a translation visible. Numbered across and up so children can read the move in
// squares.
//
// Spec:
//   max        grid runs 0..max on both axes (default 10)
//   xMax/yMax  override either range (default max)
//   from       { x, y }   start position (grid coords)
//   to         { x, y }   end position (grid coords)
//   fromLabel  letter on the start marker (default "A")
//   toLabel    letter on the end marker (default "B")
//   showArrow  draw the dashed A→B arrow (default true). Set false to show the
//              two markers only, so children work out the direction of the move
//              themselves (independent practice) rather than reading it off the
//              arrow. Everything else — grid, numbers, both markers, layout,
//              centring — is identical whether the arrow is drawn or not.

const { FONT, COLOURS, FIT } = require('../styles');
const { rule, arrow } = require('./_geom');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD            = 0.10;   // zone inner padding (inches)
const LEFT_GUTTER    = 0.34;   // space for up-axis numbers
const BOTTOM_GUTTER  = 0.34;   // space for across-axis numbers
const GRID_COLOUR    = COLOURS.gridLine;   // squared-paper lines, visible on the peach slide bg
const GRID_PT        = 0.008;
const AXIS_COLOUR    = '333333';
const AXIS_PT        = 0.022;
const NUM_FONT       = 11;
const MARKER_FRAC    = 0.78;   // marker side as a fraction of one cell
const FROM_FILL      = 'FBE2C7';   // pale orange body (the supplied start)
const FROM_LINE      = 'E46C0A';   // orange outline
const TO_FILL        = 'CCE2F5';   // pale blue body (the end position)
const TO_LINE        = '0070C0';   // blue outline
const MARKER_PT      = 2.5;
const MARKER_FONT    = 15;
const ARROW_COLOUR   = '555555';
const ARROW_PT       = 2.25;
// ─── END CONSTANTS ────────────────────────────────────────────

function drawTranslationGrid(pptx, slide, zone, data) {
  const max  = Number.isFinite(data.max) ? data.max : 10;
  const xMax = Number.isFinite(data.xMax) ? data.xMax : max;
  const yMax = Number.isFinite(data.yMax) ? data.yMax : max;
  const from = data.from || { x: 0, y: 0 };
  const to   = data.to   || { x: xMax, y: yMax };

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD;

  const cell = Math.min((innerW - LEFT_GUTTER) / xMax, (innerH - BOTTOM_GUTTER) / yMax);
  const gridW = cell * xMax;
  const gridH = cell * yMax;
  const ox = innerX + LEFT_GUTTER + (innerW - LEFT_GUTTER - gridW) / 2;
  const top = innerY + (innerH - BOTTOM_GUTTER - gridH) / 2;
  const oyBottom = top + gridH;

  const px = function (gx) { return ox + gx * cell; };
  const py = function (gy) { return oyBottom - gy * cell; };

  for (let i = 0; i <= xMax; i++) rule(pptx, slide, px(i), top, px(i), oyBottom, GRID_COLOUR, GRID_PT);
  for (let j = 0; j <= yMax; j++) rule(pptx, slide, ox, py(j), ox + gridW, py(j), GRID_COLOUR, GRID_PT);
  rule(pptx, slide, ox, oyBottom, ox + gridW, oyBottom, AXIS_COLOUR, AXIS_PT);
  rule(pptx, slide, ox, top, ox, oyBottom, AXIS_COLOUR, AXIS_PT);

  for (let i = 0; i <= xMax; i++) {
    slide.addText(String(i), {
      x: px(i) - cell / 2, y: oyBottom + 0.02, w: cell, h: BOTTOM_GUTTER - 0.04,
      fontFace: FONT, fontSize: NUM_FONT, bold: true, color: COLOURS.body,
      align: 'center', valign: 'top', margin: 0, objectName: 'NOFIT_tg-xnum'
    });
  }
  for (let j = 0; j <= yMax; j++) {
    slide.addText(String(j), {
      x: ox - LEFT_GUTTER, y: py(j) - cell / 2, w: LEFT_GUTTER - 0.06, h: cell,
      fontFace: FONT, fontSize: NUM_FONT, bold: true, color: COLOURS.body,
      align: 'right', valign: 'middle', margin: 0, objectName: 'NOFIT_tg-ynum'
    });
  }

  // Dashed translation arrow under the markers, centre to centre. Skipped when
  // showArrow is false so the two points stand alone; nothing else changes, so
  // the markers still sit in the same cells and the grid does not reflow.
  if (data.showArrow !== false) {
    arrow(pptx, slide, px(from.x), py(from.y), px(to.x), py(to.y),
      { color: ARROW_COLOUR, width: ARROW_PT, dash: 'dash' });
  }

  drawMarker(pptx, slide, px(from.x), py(from.y), cell, FROM_FILL, FROM_LINE,
    data.fromLabel == null ? 'A' : String(data.fromLabel));
  drawMarker(pptx, slide, px(to.x), py(to.y), cell, TO_FILL, TO_LINE,
    data.toLabel == null ? 'B' : String(data.toLabel));
}

function drawMarker(pptx, slide, cx, cy, cell, fill, lineColour, label) {
  const side = cell * MARKER_FRAC;
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - side / 2, y: cy - side / 2, w: side, h: side,
    fill: { color: fill }, line: { color: lineColour, width: MARKER_PT }
  });
  if (label) {
    slide.addText(label, {
      x: cx - side / 2, y: cy - side / 2, w: side, h: side,
      fontFace: FONT, fontSize: MARKER_FONT, bold: true, color: lineColour,
      align: 'center', valign: 'middle', margin: 0, objectName: 'NOFIT_tg-marker'
    });
  }
}

module.exports = { drawTranslationGrid };
