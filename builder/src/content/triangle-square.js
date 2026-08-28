'use strict';

const { FONT, COLOURS, FIT } = require('../styles');

// ─── CONSTANTS ────────────────────────────────────────────────
// The "two triangles add up to the square" part-whole puzzle, drawn in the
// notation children meet on their paper: two upward-pointing triangles stacked
// on the left, each holding a number low in its body, with a line from each
// running right to an arrowhead that points into a square holding the whole.
// Exactly one shape is normally left blank — the unknown the child finds (or
// the value the teacher writes in live during modelling).
const PAD            = 0.08;
const VGAP_FRAC      = 0.40;   // vertical gap between the two triangles, as a fraction of triangle side
const HGAP_FRAC      = 0.70;   // horizontal gap between triangle column and square, as a fraction of triangle side
const SQUARE_FRAC    = 0.92;   // square side as a fraction of the triangle side
const BORDER_COLOUR  = '222222';
const BORDER_PT      = 2.5;
const LINE_PT        = 2;
const SHAPE_FILL     = 'FFFFFF';
const LABEL_MAX_PT   = 30;
const LABEL_MIN_PT   = 12;
// ─── END CONSTANTS ────────────────────────────────────────────

function drawTriangleSquare(pptx, slide, zone, data) {
  const triangles = Array.isArray(data.triangles) && data.triangles.length >= 2
    ? [String(data.triangles[0] == null ? '' : data.triangles[0]),
       String(data.triangles[1] == null ? '' : data.triangles[1])]
    : ['', ''];
  const square = data.square != null ? String(data.square) : '';

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD;

  // Triangle side S sized from whichever of height/width binds first.
  // Column height = 2 triangles + one vertical gap = (2 + VGAP_FRAC) * S.
  // Diagram width  = triangle + gap + square     = (1 + HGAP_FRAC + SQUARE_FRAC) * S.
  const sFromH = innerH / (2 + VGAP_FRAC);
  const sFromW = innerW / (1 + HGAP_FRAC + SQUARE_FRAC);
  const S = Math.min(sFromH, sFromW);

  const vGap       = S * VGAP_FRAC;
  const hGap       = S * HGAP_FRAC;
  const squareSide = S * SQUARE_FRAC;

  const diagW = S + hGap + squareSide;
  const diagH = 2 * S + vGap;
  const startX = innerX + (innerW - diagW) / 2;
  const startY = innerY + (innerH - diagH) / 2;

  // Upper and lower triangles, stacked on the left.
  const tri1X = startX;
  const tri1Y = startY;
  const tri2X = startX;
  const tri2Y = startY + S + vGap;

  // Square, centred vertically against the diagram, on the right.
  const squareX  = startX + S + hGap;
  const squareCY = startY + diagH / 2;
  const squareY  = squareCY - squareSide / 2;

  // Connector lines first, so the shapes render on top of their ends.
  // Each line starts just inside the triangle's right edge (at the number's
  // height) and points with an arrowhead into the square's left edge.
  const tri1AnchorX = tri1X + S * 0.78;
  const tri1AnchorY = tri1Y + S * 0.62;
  const tri2AnchorX = tri2X + S * 0.78;
  const tri2AnchorY = tri2Y + S * 0.62;
  const squareLeftX = squareX;
  const squareLeftY = squareCY;

  drawArrow(pptx, slide, tri1AnchorX, tri1AnchorY, squareLeftX, squareLeftY);
  drawArrow(pptx, slide, tri2AnchorX, tri2AnchorY, squareLeftX, squareLeftY);

  drawTriangle(pptx, slide, tri1X, tri1Y, S, triangles[0]);
  drawTriangle(pptx, slide, tri2X, tri2Y, S, triangles[1]);
  drawSquare(pptx, slide, squareX, squareY, squareSide, square);
}

function drawTriangle(pptx, slide, x, y, side, label) {
  slide.addShape(pptx.shapes.ISOSCELES_TRIANGLE, {
    x: x, y: y, w: side, h: side,
    fill: { color: SHAPE_FILL },
    line: { color: BORDER_COLOUR, width: BORDER_PT }
  });
  if (label !== '') {
    // The number sits low in the triangle body, where the shape is widest.
    // The text box is kept narrower than the full base and centred, so a long
    // (e.g. four-digit) number stays inside the sloping sides rather than
    // spilling over them — the triangle is only ~0.6× its base width at this
    // height. Font is sized from the box width, with FIT as a final backstop.
    const boxW = side * 0.60;
    const boxH = side * 0.34;
    slide.addText(label, {
      x: x + (side - boxW) / 2, y: y + side * 0.56, w: boxW, h: boxH,
      fontFace: FONT, fontSize: labelSize(boxW, label.length),
      bold: true, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0,
      fit: FIT, objectName: 'NOFIT_tri-label'
    });
  }
}

function drawSquare(pptx, slide, x, y, side, label) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: x, y: y, w: side, h: side,
    fill: { color: SHAPE_FILL },
    line: { color: BORDER_COLOUR, width: BORDER_PT }
  });
  if (label !== '') {
    slide.addText(label, {
      x: x, y: y, w: side, h: side,
      fontFace: FONT, fontSize: labelSize(side, label.length),
      bold: true, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0,
      fit: FIT, objectName: 'NOFIT_sq-label'
    });
  }
}

// Straight line from (x1,y1) to (x2,y2) with an arrowhead at the (x2,y2) end.
// pptxgenjs LINE default runs top-left→bottom-right; flipV/flipH mirror it so
// the geometry is correct for up-right and down-left directions.
function drawArrow(pptx, slide, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (absDx < 0.001 && absDy < 0.001) return;

  const line = {
    color: BORDER_COLOUR, width: LINE_PT,
    endArrowType: 'triangle'
  };

  if (absDx < 0.001) {
    slide.addShape(pptx.shapes.LINE, {
      x: x1, y: Math.min(y1, y2), w: 0.001, h: absDy,
      flipV: dy < 0, line
    });
  } else if (absDy < 0.001) {
    slide.addShape(pptx.shapes.LINE, {
      x: Math.min(x1, x2), y: y1, w: absDx, h: 0.001,
      flipH: dx < 0, line
    });
  } else if (dx > 0 && dy > 0) {
    slide.addShape(pptx.shapes.LINE, { x: x1, y: y1, w: dx, h: dy, line });
  } else if (dx > 0 && dy < 0) {
    slide.addShape(pptx.shapes.LINE, { x: x1, y: y2, w: dx, h: absDy, flipV: true, line });
  } else if (dx < 0 && dy > 0) {
    slide.addShape(pptx.shapes.LINE, { x: x2, y: y1, w: absDx, h: dy, flipH: true, line });
  } else {
    slide.addShape(pptx.shapes.LINE, { x: x2, y: y2, w: absDx, h: absDy, line });
  }
}

function labelSize(sideInches, charCount) {
  const raw    = sideInches * 0.34 * 72;
  const scaled = charCount > 3 ? raw * (3 / charCount) : raw;
  return Math.max(LABEL_MIN_PT, Math.min(LABEL_MAX_PT, Math.round(scaled)));
}

module.exports = { drawTriangleSquare };
