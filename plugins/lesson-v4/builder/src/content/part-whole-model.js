'use strict';

const { FONT, COLOURS, FIT } = require('../styles');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD            = 0.08;
const WHOLE_TO_PART  = 1.5;    // whole circle is this many times larger than one part circle
const H_GAP_FRAC     = 0.22;   // horizontal gap = this fraction of wholeDiam
const V_GAP_FRAC     = 0.15;   // vertical gap between stacked parts (horizontal layout)
const VERT_DROP_FRAC = 0.25;   // vertical gap between whole and parts row (vertical layout)
const BORDER_COLOUR  = '222222';
const BORDER_PT      = 2.5;
const LINE_PT        = 2;
const CIRCLE_FILL    = 'FFFFFF';
const LABEL_MAX_PT   = 28;
const LABEL_MIN_PT   = 10;
// ─── END CONSTANTS ────────────────────────────────────────────

function drawPartWholeModel(pptx, slide, zone, data) {
  const whole       = data.whole != null ? String(data.whole) : '?';
  const parts       = Array.isArray(data.parts) && data.parts.length >= 2
    ? data.parts.map(String)
    : ['?', '?'];
  const orientation = data.orientation === 'vertical' ? 'vertical' : 'horizontal';
  const n           = parts.length;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD;

  if (orientation === 'horizontal') {
    drawHorizontal(pptx, slide, innerX, innerY, innerW, innerH, whole, parts, n);
  } else {
    drawVertical(pptx, slide, innerX, innerY, innerW, innerH, whole, parts, n);
  }
}

// Whole on left, parts stacked on right.
// Circles are sized from the available HEIGHT first, then capped by width.
// The resulting compact diagram is centered in whatever zone width is available —
// this stops lines becoming huge in wide-short (B-class) zones.
function drawHorizontal(pptx, slide, innerX, innerY, innerW, innerH, whole, parts, n) {
  // Height consumed by parts column: n circles + (n-1) gaps
  const hFactor = Math.max(WHOLE_TO_PART, n + (n - 1) * V_GAP_FRAC);
  const pdFromH = innerH / hFactor;

  // Width consumed: wholeDiam + hGap + partDiam
  const wFactor = WHOLE_TO_PART * (1 + H_GAP_FRAC) + 1;
  const pdFromW = innerW / wFactor;

  const partDiam  = Math.min(pdFromH, pdFromW);
  const wholeDiam = partDiam * WHOLE_TO_PART;
  const hGap      = wholeDiam * H_GAP_FRAC;
  const partVGap  = partDiam * V_GAP_FRAC;

  // Diagram dimensions, then centre in the zone
  const diagW     = wholeDiam + hGap + partDiam;
  const diagH     = Math.max(wholeDiam, n * partDiam + (n - 1) * partVGap);
  const startX    = innerX + (innerW - diagW) / 2;
  const startY    = innerY + (innerH - diagH) / 2;

  const wholeR  = wholeDiam / 2;
  const wholeCX = startX + wholeR;
  const wholeCY = startY + diagH / 2;

  const partR       = partDiam / 2;
  const partsCX     = startX + wholeDiam + hGap + partR;
  const partsTotalH = n * partDiam + (n - 1) * partVGap;
  const partsStartY = startY + (diagH - partsTotalH) / 2;

  // Lines first (circles render on top)
  for (let i = 0; i < n; i++) {
    const partCY = partsStartY + i * (partDiam + partVGap) + partR;
    drawCircleConnector(pptx, slide, wholeCX, wholeCY, wholeR, partsCX, partCY, partR);
  }

  drawCircle(pptx, slide, wholeCX, wholeCY, wholeR, whole);
  for (let i = 0; i < n; i++) {
    const partCY = partsStartY + i * (partDiam + partVGap) + partR;
    drawCircle(pptx, slide, partsCX, partCY, partR, parts[i]);
  }
}

// Whole on top, parts spread side by side below.
function drawVertical(pptx, slide, innerX, innerY, innerW, innerH, whole, parts, n) {
  // Height: wholeDiam + dropGap + partDiam
  const hFactor = WHOLE_TO_PART * (1 + VERT_DROP_FRAC) + 1;
  const pdFromH = innerH / hFactor;

  // Width: n parts side by side with gaps between them
  const wFactor = n + (n - 1) * H_GAP_FRAC;
  const pdFromW = innerW / wFactor;

  const partDiam  = Math.min(pdFromH, pdFromW);
  const wholeDiam = partDiam * WHOLE_TO_PART;
  const dropGap   = wholeDiam * VERT_DROP_FRAC;
  const partHGap  = partDiam * H_GAP_FRAC;

  const diagW  = n * partDiam + (n - 1) * partHGap;
  const diagH  = wholeDiam + dropGap + partDiam;
  const startX = innerX + (innerW - diagW) / 2;
  const startY = innerY + (innerH - diagH) / 2;

  const wholeR  = wholeDiam / 2;
  const wholeCX = innerX + innerW / 2;
  const wholeCY = startY + wholeR;

  const partR   = partDiam / 2;
  const partsCY = startY + wholeDiam + dropGap + partR;

  for (let i = 0; i < n; i++) {
    const partCX = startX + i * (partDiam + partHGap) + partR;
    drawCircleConnector(pptx, slide, wholeCX, wholeCY, wholeR, partCX, partsCY, partR);
  }

  drawCircle(pptx, slide, wholeCX, wholeCY, wholeR, whole);
  for (let i = 0; i < n; i++) {
    const partCX = startX + i * (partDiam + partHGap) + partR;
    drawCircle(pptx, slide, partCX, partsCY, partR, parts[i]);
  }
}

// Compute where the line between two circle centres crosses each circle's edge,
// then draw only that segment — so each line has its own separate touch point on
// the whole circle rather than all converging at a single anchor.
function drawCircleConnector(pptx, slide, cx1, cy1, r1, cx2, cy2, r2) {
  const dx  = cx2 - cx1;
  const dy  = cy2 - cy1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.001) return;
  const ux = dx / len;
  const uy = dy / len;
  // Start: edge of whole circle in the direction of the part circle
  const x1 = cx1 + ux * r1;
  const y1 = cy1 + uy * r1;
  // End: edge of part circle in the direction back toward the whole circle
  const x2 = cx2 - ux * r2;
  const y2 = cy2 - uy * r2;
  drawConnector(pptx, slide, x1, y1, x2, y2);
}

// Draw a straight line from (x1,y1) to (x2,y2).
// pptxgenjs LINE default goes top-left→bottom-right; flipH mirrors to top-right→bottom-left;
// flipV mirrors to bottom-left→top-right.
function drawConnector(pptx, slide, x1, y1, x2, y2) {
  const dx    = x2 - x1;
  const dy    = y2 - y1;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx < 0.001 && absDy < 0.001) return;

  if (absDx < 0.001) {
    // Vertical line — use tiny width to avoid zero-dimension rejection
    slide.addShape(pptx.shapes.LINE, {
      x: x1, y: Math.min(y1, y2), w: 0.001, h: absDy,
      line: { color: BORDER_COLOUR, width: LINE_PT }
    });
  } else if (absDy < 0.001) {
    // Horizontal line
    slide.addShape(pptx.shapes.LINE, {
      x: Math.min(x1, x2), y: y1, w: absDx, h: 0.001,
      line: { color: BORDER_COLOUR, width: LINE_PT }
    });
  } else if (dx > 0 && dy > 0) {
    // Down-right → TL→BR (default)
    slide.addShape(pptx.shapes.LINE, {
      x: x1, y: y1, w: dx, h: dy,
      line: { color: BORDER_COLOUR, width: LINE_PT }
    });
  } else if (dx > 0 && dy < 0) {
    // Up-right → BL→TR → flipV
    slide.addShape(pptx.shapes.LINE, {
      x: x1, y: y2, w: dx, h: absDy, flipV: true,
      line: { color: BORDER_COLOUR, width: LINE_PT }
    });
  } else if (dx < 0 && dy > 0) {
    // Down-left → TR→BL → flipH
    slide.addShape(pptx.shapes.LINE, {
      x: x2, y: y1, w: absDx, h: dy, flipH: true,
      line: { color: BORDER_COLOUR, width: LINE_PT }
    });
  } else {
    // Up-left → BR→TL → default on reflected box
    slide.addShape(pptx.shapes.LINE, {
      x: x2, y: y2, w: absDx, h: absDy,
      line: { color: BORDER_COLOUR, width: LINE_PT }
    });
  }
}

function drawCircle(pptx, slide, cx, cy, r, label) {
  const d = r * 2;
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - r, y: cy - r, w: d, h: d,
    fill: { color: CIRCLE_FILL },
    line: { color: BORDER_COLOUR, width: BORDER_PT }
  });
  slide.addText(label, {
    x: cx - r, y: cy - r, w: d, h: d,
    fontFace: FONT, fontSize: labelSize(d, label.length),
    bold: true, color: COLOURS.body,
    align: 'center', valign: 'middle', margin: 0,
    fit: FIT, objectName: 'NOFIT_pwm-label'
  });
}

function labelSize(diamInches, charCount) {
  const raw    = diamInches * 0.38 * 72;
  const scaled = charCount > 3 ? raw * (3 / charCount) : raw;
  return Math.max(LABEL_MIN_PT, Math.min(LABEL_MAX_PT, Math.round(scaled)));
}

module.exports = { drawPartWholeModel };
