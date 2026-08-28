'use strict';

// An analogue dial scale — the round kitchen/weighing scale a child reads a value
// off. 0 sits at the top and a full revolution clockwise is `max`, with numbered
// major ticks, minor ticks between, and a needle pointing to `value`. Used for
// "the scales show ___, how much more to reach ___?" measurement questions.
//
// Spec:
//   max         the value at a full revolution (default 1000)
//   value       where the needle points (default 0)
//   unit        unit shown under the dial, e.g. "g" or "ml" (optional)
//   majorEvery  spacing of numbered ticks (default max ÷ 10)
//   minorEvery  spacing of small ticks (default majorEvery ÷ 5 when whole)
//   label       optional caption under the dial

const { FONT, COLOURS, FIT } = require('../styles');
const { polyline } = require('./_geom');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD          = 0.12;   // zone inner padding (inches)
const LABEL_H      = 0.42;
const LABEL_GAP    = 0.08;
const FACE_FILL    = 'FFFFFF';
const FACE_LINE    = '333333';
const FACE_PT      = 3;
const MAJOR_LEN    = 0.16;   // major tick length, fraction of radius
const MINOR_LEN    = 0.09;   // minor tick length, fraction of radius
const TICK_COLOUR  = '333333';
const MAJOR_PT     = 2;
const MINOR_PT     = 1;
const NUM_FRAC     = 0.74;   // number ring radius, fraction of face radius
const NUM_FONT     = 12;
const NEEDLE_FRAC  = 0.66;   // needle length, fraction of radius (sits inside the number ring)
const NEEDLE_COLOUR= 'C00000';   // red needle
const NEEDLE_PT    = 3.5;
const HUB_R        = 0.05;   // centre hub radius (inches)
const LABEL_FONT   = 16;
// ─── END CONSTANTS ────────────────────────────────────────────

function drawDialScale(pptx, slide, zone, data) {
  const max   = Number.isFinite(data.max) && data.max > 0 ? data.max : 1000;
  const value = Number.isFinite(data.value) ? data.value : 0;
  const majorEvery = Number.isFinite(data.majorEvery) && data.majorEvery > 0 ? data.majorEvery : max / 10;
  let minorEvery = Number.isFinite(data.minorEvery) && data.minorEvery > 0 ? data.minorEvery : majorEvery / 5;
  if (!(majorEvery / minorEvery >= 2)) minorEvery = 0;   // skip minors if they wouldn't sit between majors
  const hasLabel = !!data.label;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD - (hasLabel ? LABEL_H + LABEL_GAP : 0);

  const r  = Math.min(innerW, innerH) / 2;
  const cx = innerX + innerW / 2;
  const cy = innerY + innerH / 2;
  const rad = function (d) { return (d * Math.PI) / 180; };
  const angleFor = function (v) { return (v / max) * 360 - 90; };   // 0 at top, clockwise

  // Face.
  slide.addShape(pptx.ShapeType.ellipse, {
    x: cx - r, y: cy - r, w: 2 * r, h: 2 * r,
    fill: { color: FACE_FILL }, line: { color: FACE_LINE, width: FACE_PT }
  });

  // Minor ticks.
  if (minorEvery) {
    for (let v = 0; v < max; v += minorEvery) {
      if (Math.abs(v % majorEvery) < 1e-6) continue;
      tick(pptx, slide, cx, cy, r, angleFor(v), MINOR_LEN, MINOR_PT, rad);
    }
  }

  // Major ticks + numbers (skip the tick at `max`, which coincides with 0 at top).
  for (let v = 0; v < max; v += majorEvery) {
    const a = angleFor(v);
    tick(pptx, slide, cx, cy, r, a, MAJOR_LEN, MAJOR_PT, rad);
    const nx = cx + r * NUM_FRAC * Math.cos(rad(a));
    const ny = cy + r * NUM_FRAC * Math.sin(rad(a));
    const boxW = 0.6, boxH = NUM_FONT / 72 + 0.08;
    slide.addText(String(Math.round(v)), {
      x: nx - boxW / 2, y: ny - boxH / 2, w: boxW, h: boxH,
      fontFace: FONT, fontSize: NUM_FONT, bold: true, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0, objectName: 'NOFIT_dial-num'
    });
  }

  // Needle + hub.
  const na = angleFor(value);
  polyline(pptx, slide, [
    { x: cx, y: cy },
    { x: cx + r * NEEDLE_FRAC * Math.cos(rad(na)), y: cy + r * NEEDLE_FRAC * Math.sin(rad(na)) }
  ], { lineColor: NEEDLE_COLOUR, width: NEEDLE_PT });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: cx - HUB_R, y: cy - HUB_R, w: 2 * HUB_R, h: 2 * HUB_R,
    fill: { color: NEEDLE_COLOUR }, line: { type: 'none' }
  });

  // Unit, just below centre.
  if (data.unit) {
    slide.addText(String(data.unit), {
      x: cx - 0.6, y: cy + r * 0.34, w: 1.2, h: 0.32,
      fontFace: FONT, fontSize: NUM_FONT, bold: true, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0, objectName: 'NOFIT_dial-unit'
    });
  }

  if (hasLabel) {
    slide.addText(String(data.label), {
      x: innerX, y: innerY + innerH + LABEL_GAP, w: innerW, h: LABEL_H,
      fontFace: FONT, fontSize: LABEL_FONT, bold: true, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }
}

function tick(pptx, slide, cx, cy, r, angleDeg, lenFrac, widthPt, rad) {
  const outerX = cx + r * Math.cos(rad(angleDeg));
  const outerY = cy + r * Math.sin(rad(angleDeg));
  const innerR = r * (1 - lenFrac);
  const innerXp = cx + innerR * Math.cos(rad(angleDeg));
  const innerYp = cy + innerR * Math.sin(rad(angleDeg));
  polyline(pptx, slide, [{ x: innerXp, y: innerYp }, { x: outerX, y: outerY }],
    { lineColor: TICK_COLOUR, width: widthPt });
}

module.exports = { drawDialScale };
