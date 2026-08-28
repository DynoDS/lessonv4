'use strict';

const { FONT, COLOURS, FIT } = require('../styles');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD              = 0.15;
const NATURAL_SLOT_H   = 2.00;
const LINE_H           = 0.04;
const TICK_H           = 0.28;
const TALL_TICK_H      = 0.44;
const TICK_W           = 0.04;
const LABEL_GAP        = 0.08;
const LABEL_H          = 0.40;
const LABEL_W          = 0.55;
// Board-readable ceiling for the axis numbers a child reads off. The scale is
// the point of the task, so the numerals must read from the back of the room;
// 14pt rendered too small in practice. `fit: FIT` (shrink) keeps this a ceiling,
// so a crowded or many-line stack still shrinks the numbers to fit their box.
const FONT_SIZE        = 24;
const ARROW_STEM_W     = 0.03;
const ARROW_STEM_H     = 0.26;
const ARROW_HEAD_W     = 0.14;
const ARROW_HEAD_H     = 0.14;
const ARROW_COLOUR     = 'CC0000';
const ARROW_LABEL_W    = 0.44;
const ARROW_LABEL_H    = 0.40;
const ARROW_RAISE      = 0.55;
const ARROW_LABEL_RAISE = 0.34;
const DOT_R            = 0.09;
const ANSWER_W         = 0.64;
const ANSWER_H         = 0.40;
const ANSWER_LABEL_GAP = 0.06;
// ─── END CONSTANTS ────────────────────────────────────────────

function drawNumberline(pptx, slide, zone, data) {
  const lines = Array.isArray(data.lines)
    ? data.lines
    : [{
        start:     data.start    != null ? data.start    : 0,
        end:       data.end      != null ? data.end      : 10,
        interval:  data.interval != null ? data.interval : 1,
        labels:    data.labels,
        wholeTick: data.wholeTick,
        arrow:     data.arrow,
        answer:    data.answer
      }];

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD;

  const naturalH = NATURAL_SLOT_H * lines.length;
  const scale    = Math.min(1.0, innerH / naturalH);
  const slotH    = NATURAL_SLOT_H * scale;
  const usedH    = slotH * lines.length;
  const blockY   = innerY + (innerH - usedH) / 2;

  const tickH           = TICK_H           * scale;
  const tallTickH       = TALL_TICK_H       * scale;
  const labelGap        = LABEL_GAP         * scale;
  const labelH          = LABEL_H           * scale;
  const arrowStemH      = ARROW_STEM_H      * scale;
  const arrowHeadH      = ARROW_HEAD_H      * scale;
  const arrowRaise      = ARROW_RAISE       * scale;
  const arrowLabelRaise = ARROW_LABEL_RAISE * scale;
  const arrowLabelH     = ARROW_LABEL_H     * scale;
  const dotR            = DOT_R             * scale;
  const answerH         = ANSWER_H          * scale;
  const answerLabelGap  = ANSWER_LABEL_GAP  * scale;

  lines.forEach(function (spec, lineIdx) {
    const start    = spec.start    != null ? spec.start    : 0;
    const end      = spec.end      != null ? spec.end      : 10;
    const interval = spec.interval != null ? spec.interval : 1;

    const slotY = blockY + lineIdx * slotH;
    const lineY = slotY + slotH * 0.45;

    const numTicks = Math.round((end - start) / interval);
    const spacing  = innerW / numTicks;

    const ticks = [];
    for (let i = 0; i <= numTicks; i++) {
      const tickX = innerX + i * spacing;
      const value = Math.round((start + i * interval) * 1e9) / 1e9;
      ticks.push({ x: tickX, index: i, value });
    }

    function getX(val) {
      return innerX + ((val - start) / (end - start)) * innerW;
    }

    slide.addShape(pptx.shapes.RECTANGLE, {
      x: innerX, y: lineY - LINE_H / 2, w: innerW, h: LINE_H,
      fill: { color: COLOURS.body }, line: { color: COLOURS.body, width: 0 }
    });

    ticks.forEach(function (tick) {
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: tick.x - TICK_W / 2, y: lineY - tickH / 2, w: TICK_W, h: tickH,
        fill: { color: COLOURS.body }, line: { color: COLOURS.body, width: 0 }
      });
    });

    if (spec.wholeTick != null) {
      const wholeVals = Array.isArray(spec.wholeTick) ? spec.wholeTick : [spec.wholeTick];
      wholeVals.forEach(function (val) {
        const tx = getX(val);
        slide.addShape(pptx.shapes.RECTANGLE, {
          x: tx - TICK_W / 2, y: lineY - tallTickH / 2, w: TICK_W, h: tallTickH,
          fill: { color: COLOURS.body }, line: { color: COLOURS.body, width: 0 }
        });
      });
    }

    const belowY = lineY + tickH / 2 + labelGap;
    let labelValues = spec.labels;
    if (!labelValues || labelValues === 'ends') {
      labelValues = [start, end];
    } else if (labelValues === 'all') {
      labelValues = ticks.map(function (t) { return t.value; });
    }

    labelValues.forEach(function (val) {
      const lx = getX(val);
      slide.addText(String(val), {
        x: lx - LABEL_W / 2, y: belowY, w: LABEL_W, h: labelH,
        fontFace: FONT, fontSize: FONT_SIZE, bold: true, color: COLOURS.body,
        align: 'center', valign: 'top', margin: 0, fit: FIT
      });
    });

    if (spec.arrow) {
      const ax       = getX(spec.arrow.at);
      const arLabel  = spec.arrow.label || '?';
      const stemTopY = lineY - arrowRaise;

      slide.addShape(pptx.shapes.RECTANGLE, {
        x: ax - ARROW_STEM_W / 2, y: stemTopY, w: ARROW_STEM_W, h: arrowStemH,
        fill: { color: ARROW_COLOUR }, line: { color: ARROW_COLOUR, width: 0 }
      });
      slide.addShape(pptx.shapes.ISOSCELES_TRIANGLE, {
        x: ax - ARROW_HEAD_W / 2, y: stemTopY + arrowStemH - 0.01,
        w: ARROW_HEAD_W, h: arrowHeadH,
        fill: { color: ARROW_COLOUR }, line: { color: ARROW_COLOUR, width: 0 },
        rotate: 180
      });
      slide.addText(arLabel, {
        x: ax - ARROW_LABEL_W / 2, y: stemTopY - arrowLabelRaise,
        w: ARROW_LABEL_W, h: arrowLabelH,
        fontFace: FONT, fontSize: FONT_SIZE, bold: true, color: ARROW_COLOUR,
        align: 'center', valign: 'middle', margin: 0, fit: FIT
      });
    }

    if (spec.answer) {
      const dotX    = getX(spec.answer.at);
      const ansText = spec.answer.text != null ? String(spec.answer.text) : String(spec.answer.at);

      slide.addShape(pptx.shapes.OVAL, {
        x: dotX - dotR, y: lineY - dotR, w: dotR * 2, h: dotR * 2,
        fill: { color: COLOURS.green }, line: { color: COLOURS.green, width: 0 }
      });
      slide.addText(ansText, {
        x: dotX - ANSWER_W / 2, y: lineY - dotR - answerLabelGap - answerH,
        w: ANSWER_W, h: answerH,
        fontFace: FONT, fontSize: FONT_SIZE, bold: true, color: COLOURS.green,
        align: 'center', valign: 'middle', margin: 0, fit: FIT
      });
    }
  });
}

module.exports = { drawNumberline };
