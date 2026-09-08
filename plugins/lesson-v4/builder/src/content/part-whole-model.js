'use strict';

const { FONT, COLOURS, FIT } = require('../styles');
const { textWidthIn } = require('../glyph-width');

// How big is the number inside a part-whole circle?
//
// It was whatever survived. The circle was sized from the ZONE alone, the label
// size was then guessed from the diameter with a taper of 3/charCount, and the
// result was clamped up to a 10pt "minimum" that was never checked against the
// circle it had to fit inside. So the minimum did not mean "small but legible",
// it meant "overflow quietly": a Year 4 slide put "3,000" in a 0.39in circle at
// the 10pt floor, where the text is WIDER than the whole circle, and PowerPoint
// wrapped it to "3,00 / 0" - a four-digit number broken across two lines inside
// a circle, on the slide teaching four-digit numbers.
//
// The zone was the real culprit: 7.75in of width and 1.27in of height. In a
// vertical model the height is what the circles are cut from, so nearly eight
// inches of width sat unused while the circles were starved. Nothing checked
// that, because nothing measured the label.
//
// So: the label is measured, the font is the largest that genuinely fits inside
// the circle, and a zone that cannot give its circles a readable label is
// refused by name with the height it needs - the same contract place-value-chart
// and table already keep, so the slide-design check catches it while the spec is
// still repairable rather than a class meeting a wrapped number.

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
// Board-readable floor, matched to the number line's. Below this a circle is
// not a small diagram, it is an unreadable one, and the honest answer is that
// the slide has not given the model enough room.
const LABEL_MIN_PT   = 14;
// A circle is not a box. One line of text across a circle has the inscribed
// square to live in, not the diameter, or it touches the border and wraps.
const USABLE_FRAC    = 0.72;
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

  // What this model's own numbers need, before the zone gets a say. The whole
  // circle is 1.5x a part, so a long whole label is cheaper in part-diameters
  // than a long part label.
  const partNeed = Math.max(
    diamNeededFor(whole) / WHOLE_TO_PART,
    ...parts.map(diamNeededFor)
  );
  const heightFactor = orientation === 'horizontal'
    ? Math.max(WHOLE_TO_PART, n + (n - 1) * V_GAP_FRAC)
    : WHOLE_TO_PART * (1 + VERT_DROP_FRAC) + 1;
  const widthFactor = orientation === 'horizontal'
    ? WHOLE_TO_PART * (1 + H_GAP_FRAC) + 1
    : n + (n - 1) * H_GAP_FRAC;

  const gotPart = Math.min(innerH / heightFactor, innerW / widthFactor);
  if (gotPart < partNeed) {
    const needH = partNeed * heightFactor + 2 * PAD;
    const needW = partNeed * widthFactor + 2 * PAD;
    const longest = [whole].concat(parts).sort(function (a, b) { return b.length - a.length; })[0];
    throw new Error(
      'PART_WHOLE_MODEL_DOES_NOT_FIT: a ' + orientation + ' model labelled "' + longest +
      '" needs a zone of at least ' + needW.toFixed(2) + 'in x ' + needH.toFixed(2) +
      'in to print its numbers at ' + LABEL_MIN_PT + 'pt, and was given ' +
      zone.w.toFixed(2) + 'in x ' + zone.h.toFixed(2) + 'in. Give the model a larger share ' +
      'of its stack, or drop it from this slide - do not let it print a number too small ' +
      'to read.'
    );
  }

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
  const d  = r * 2;
  const tw = d * USABLE_FRAC;
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - r, y: cy - r, w: d, h: d,
    fill: { color: CIRCLE_FILL },
    line: { color: BORDER_COLOUR, width: BORDER_PT }
  });
  // The text box is the circle's inscribed width, so a label that fits is drawn
  // clear of the border instead of touching it and wrapping.
  slide.addText(label, {
    x: cx - tw / 2, y: cy - tw / 2, w: tw, h: tw,
    fontFace: FONT, fontSize: labelSize(d, label),
    bold: true, color: COLOURS.body,
    align: 'center', valign: 'middle', margin: 0,
    fit: FIT, objectName: 'NOFIT_pwm-label'
  });
}

// The largest size this label genuinely fits at inside this circle. Measured,
// not tapered by character count: "3,000" and "1111" are five and four
// characters but nothing like the same width, and a comma is not a digit.
function labelSize(diamInches, label) {
  const usable = diamInches * USABLE_FRAC;
  const oneEm  = textWidthIn(String(label), 1, true);
  if (oneEm <= 0) return LABEL_MAX_PT;
  return Math.min(LABEL_MAX_PT, Math.floor(usable / oneEm));
}

// The diameter this label needs before it can be drawn at the floor size.
function diamNeededFor(label) {
  return textWidthIn(String(label), LABEL_MIN_PT, true) / USABLE_FRAC;
}

module.exports = { drawPartWholeModel };
