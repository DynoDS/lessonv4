'use strict';

// A measuring jug with a vertical graduated scale — the "read the level" /
// "mark 250ml on the jug" capacity diagram. 0 sits at the bottom and the scale
// climbs to `max` at the top, with numbered major ticks, smaller ticks between,
// and (when a value is given) a coloured liquid fill up to a level line. Leave
// `value` off for a blank jug the child marks; set it on the answer slide to
// reveal the level, so the one helper renders both question and answer.
//
// Spec:
//   max          the value at the top of the scale (default 400)
//   majorEvery   spacing of numbered ticks (default max ÷ 4)
//   minorEvery   spacing of small ticks between them (default majorEvery ÷ 2)
//   value        the liquid level to draw; omit for an empty jug
//   unit         unit shown at the top of the scale, e.g. "ml" (optional)
//   fillColor    hex for the liquid (default pale blue)
//   levelColor   hex for the level line + value tag (default blue; green reveals
//                a marked answer on the answer slide)
//   label        optional caption under the jug

const { FONT, COLOURS, FIT } = require('../styles');
const { polygon, rule } = require('./_geom');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD          = 0.12;   // zone inner padding (inches)
const LABEL_H      = 0.38;
const LABEL_GAP    = 0.08;
const LEFT_GUTTER  = 0.46;   // space left of the jug for the scale numbers
const SPOUT_H      = 0.18;   // head room above the body for the pour spout
const BODY_RATIO   = 0.72;   // body width as a fraction of body height (keeps it jug-shaped)
const BODY_FILL    = 'FFFFFF';
const BODY_LINE    = '333333';
const BODY_PT      = 3;
const TICK_COLOUR  = '333333';
const MAJOR_LEN    = 0.20;   // major tick length into the jug (inches)
const MINOR_LEN    = 0.10;
const MAJOR_PT     = 0.020;
const MINOR_PT     = 0.012;
const NUM_FONT     = 12;
const LEVEL_FILL   = 'CCE2F5';   // default liquid colour
const LEVEL_LINE   = '0070C0';   // default level-line colour
const LEVEL_PT     = 0.026;
const TAG_FONT     = 13;
const UNIT_FONT    = 12;
const LABEL_FONT   = 15;
// ─── END CONSTANTS ────────────────────────────────────────────

function drawMeasuringJug(pptx, slide, zone, data) {
  const max = Number.isFinite(data.max) && data.max > 0 ? data.max : 400;
  const majorEvery = Number.isFinite(data.majorEvery) && data.majorEvery > 0 ? data.majorEvery : max / 4;
  let minorEvery = Number.isFinite(data.minorEvery) && data.minorEvery > 0 ? data.minorEvery : majorEvery / 2;
  if (!(majorEvery / minorEvery >= 2)) minorEvery = 0;
  const hasValue = Number.isFinite(data.value);
  const hasLabel = !!data.label;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD - (hasLabel ? LABEL_H + LABEL_GAP : 0);

  const bodyTop    = innerY + SPOUT_H;
  const bodyBottom = innerY + innerH;
  const bodyH = bodyBottom - bodyTop;
  const bodyW = Math.min(innerW - LEFT_GUTTER - 0.08, bodyH * BODY_RATIO);
  const blockW = LEFT_GUTTER + bodyW;
  const startX = innerX + (innerW - blockW) / 2;
  const bodyLeft = startX + LEFT_GUTTER;
  const bodyRight = bodyLeft + bodyW;

  // Scale runs inside the body with a little head space and base inset.
  const scaleTop = bodyTop + 0.12;
  const scaleBottom = bodyBottom - 0.07;
  const scaleH = scaleBottom - scaleTop;
  const yFor = function (v) { return scaleBottom - (v / max) * scaleH; };

  // Liquid fill + level line (only when a value is given).
  if (hasValue) {
    const ly = yFor(data.value);
    const inset = 0.05;
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: bodyLeft + inset, y: ly, w: bodyW - 2 * inset, h: scaleBottom - ly,
      fill: { color: data.fillColor || LEVEL_FILL }, line: { type: 'none' }
    });
    rule(pptx, slide, bodyLeft, ly, bodyRight, ly, data.levelColor || LEVEL_LINE, LEVEL_PT);
    slide.addText(String(data.value) + (data.unit ? String(data.unit) : ''), {
      x: bodyLeft, y: ly - (TAG_FONT / 72) - 0.06, w: bodyW, h: TAG_FONT / 72 + 0.05,
      fontFace: FONT, fontSize: TAG_FONT, bold: true, color: data.levelColor || LEVEL_LINE,
      align: 'center', valign: 'bottom', margin: 0, objectName: 'NOFIT_jug-tag'
    });
  }

  // Jug body.
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: bodyLeft, y: bodyTop, w: bodyW, h: bodyH,
    fill: hasValue ? { type: 'none' } : { color: BODY_FILL },
    line: { color: BODY_LINE, width: BODY_PT }
  });

  // Pour spout, top-right.
  polygon(pptx, slide, [
    { x: bodyRight - 0.10, y: bodyTop },
    { x: bodyRight + 0.16, y: bodyTop - 0.10 },
    { x: bodyRight,        y: bodyTop + 0.06 }
  ], { fill: BODY_FILL, lineColor: BODY_LINE, width: 2 });

  // Minor ticks.
  if (minorEvery) {
    for (let v = 0; v <= max + 1e-6; v += minorEvery) {
      if (Math.abs(v % majorEvery) < 1e-6) continue;
      rule(pptx, slide, bodyLeft, yFor(v), bodyLeft + MINOR_LEN, yFor(v), TICK_COLOUR, MINOR_PT);
    }
  }

  // Major ticks + numbers in the gutter.
  for (let v = 0; v <= max + 1e-6; v += majorEvery) {
    const ty = yFor(v);
    rule(pptx, slide, bodyLeft, ty, bodyLeft + MAJOR_LEN, ty, TICK_COLOUR, MAJOR_PT);
    slide.addText(String(Math.round(v)), {
      x: startX - 0.04, y: ty - (NUM_FONT / 72) / 2 - 0.03, w: LEFT_GUTTER, h: NUM_FONT / 72 + 0.06,
      fontFace: FONT, fontSize: NUM_FONT, bold: true, color: COLOURS.body,
      align: 'right', valign: 'middle', margin: 0, objectName: 'NOFIT_jug-num'
    });
  }

  // Unit, above the top of the scale.
  if (data.unit) {
    slide.addText(String(data.unit), {
      x: startX - 0.04, y: scaleTop - (UNIT_FONT / 72) - 0.16, w: LEFT_GUTTER, h: UNIT_FONT / 72 + 0.06,
      fontFace: FONT, fontSize: UNIT_FONT, bold: true, italic: true, color: COLOURS.body,
      align: 'right', valign: 'middle', margin: 0, objectName: 'NOFIT_jug-unit'
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

module.exports = { drawMeasuringJug };
