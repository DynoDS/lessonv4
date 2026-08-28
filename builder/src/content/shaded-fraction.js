'use strict';

// A single shape divided into equal parts with some of them shaded — the
// "shade one quarter of this shape" diagram. Draws a bar (equal columns), a grid
// (rows × columns), or a circle (equal sectors). The shaded parts are green, the
// rest white, every part the same size, so a child can see that the fraction is
// shaded ÷ total. Set shaded:0 for a blank shape the child shades in themselves.
//
// Spec:
//   parts   total number of equal parts (required)
//   shaded  how many to fill (default 0 = blank)
//   shape   "bar" (default) | "grid" | "circle"
//   rows    grid only — number of rows (cols is derived from parts ÷ rows)
//   label   optional caption under the shape (e.g. "1 quarter")

const { FONT, COLOURS, FIT } = require('../styles');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD          = 0.12;   // zone inner padding (inches)
const LABEL_H      = 0.42;   // caption band (inches), 0 when no label
const LABEL_GAP    = 0.08;
const SHADE_FILL   = 'A9DFBF';   // soft green — matches the deck's answer green family
const BLANK_FILL   = 'FFFFFF';
const PART_LINE    = '333333';   // division lines / outline
const PART_PT      = 2;
const BAR_MAX_H    = 1.7;    // a bar never grows taller than this (inches)
const LABEL_FONT   = 16;
// ─── END CONSTANTS ────────────────────────────────────────────

function drawShadedFraction(pptx, slide, zone, data) {
  const parts  = Math.max(1, parseInt(data.parts, 10) || 1);
  const shaded = Math.min(parts, Math.max(0, parseInt(data.shaded, 10) || 0));
  const shape  = String(data.shape || 'bar').toLowerCase();
  const hasLabel = !!data.label;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD - (hasLabel ? LABEL_H + LABEL_GAP : 0);

  if (shape === 'circle') {
    drawCircle(pptx, slide, innerX, innerY, innerW, innerH, parts, shaded);
  } else if (shape === 'grid') {
    drawGrid(pptx, slide, innerX, innerY, innerW, innerH, parts, shaded, data.rows);
  } else {
    drawBar(pptx, slide, innerX, innerY, innerW, innerH, parts, shaded);
  }

  if (hasLabel) {
    slide.addText(String(data.label), {
      x: innerX, y: innerY + innerH + LABEL_GAP, w: innerW, h: LABEL_H,
      fontFace: FONT, fontSize: LABEL_FONT, bold: true, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }
}

function drawBar(pptx, slide, x, y, w, h, parts, shaded) {
  const barH = Math.min(h, BAR_MAX_H);
  const barY = y + (h - barH) / 2;
  const cellW = w / parts;
  for (let i = 0; i < parts; i++) {
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: x + i * cellW, y: barY, w: cellW, h: barH,
      fill: { color: i < shaded ? SHADE_FILL : BLANK_FILL },
      line: { color: PART_LINE, width: PART_PT }
    });
  }
}

function drawGrid(pptx, slide, x, y, w, h, parts, shaded, rowsHint) {
  // Choose a row/column split that keeps cells close to square in the box.
  let rows = parseInt(rowsHint, 10);
  if (!rows || rows < 1 || parts % rows !== 0) {
    rows = 1;
    for (let r = 1; r <= parts; r++) {
      if (parts % r !== 0) continue;
      const cols = parts / r;
      const cellAr = (w / cols) / (h / r);            // width ÷ height of a cell
      const bestCols = parts / rows;
      const bestAr = (w / bestCols) / (h / rows);
      if (Math.abs(Math.log(cellAr)) < Math.abs(Math.log(bestAr))) rows = r;
    }
  }
  const cols = parts / rows;
  const cellW = w / cols;
  const cellH = h / rows;
  for (let idx = 0; idx < parts; idx++) {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: x + c * cellW, y: y + r * cellH, w: cellW, h: cellH,
      fill: { color: idx < shaded ? SHADE_FILL : BLANK_FILL },
      line: { color: PART_LINE, width: PART_PT }
    });
  }
}

function drawCircle(pptx, slide, x, y, w, h, parts, shaded) {
  const r = Math.min(w, h) / 2;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const sweep = 360 / parts;
  const rad = function (d) { return (d * Math.PI) / 180; };
  for (let i = 0; i < parts; i++) {
    const startDeg = i * sweep - 90;                  // 0 = top, clockwise
    const ex = cx + r * Math.cos(rad(startDeg));
    const ey = cy + r * Math.sin(rad(startDeg));
    slide.addShape(pptx.ShapeType.custGeom, {
      x: cx - r, y: cy - r, w: 2 * r, h: 2 * r,
      points: [
        { x: r, y: r, moveTo: true },
        { x: +(ex - (cx - r)).toFixed(4), y: +(ey - (cy - r)).toFixed(4) },
        { curve: { type: 'arc', wR: r, hR: r, stAng: startDeg, swAng: sweep } },
        { close: true }
      ],
      fill: { color: i < shaded ? SHADE_FILL : BLANK_FILL },
      line: { color: PART_LINE, width: PART_PT }
    });
  }
}

module.exports = { drawShadedFraction };
