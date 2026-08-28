'use strict';

const { FONT, COLOURS, SIZE_CEILINGS, FIT } = require('../styles');
const { MARGIN_X, CONTENT_W } = require('../layout');

// ─── COORDINATES ──────────────────────────────────────────────
const DATE_X = MARGIN_X;
const DATE_Y = 0.25;
const DATE_W = CONTENT_W;
const DATE_H = 0.60;

const LO_X = MARGIN_X;
const LO_Y = 1.00;
const LO_W = CONTENT_W;
const LO_H = 0.60;

const INSTR_X = MARGIN_X;
const INSTR_Y = 2.40;
const INSTR_W = CONTENT_W;
const INSTR_H = 0.55;
// ─── END COORDINATES ──────────────────────────────────────────

function drawLessonCover(pptx, slide, data, ctx) {
  const dateText = 'Date';

  slide.addText(dateText, {
    x: DATE_X, y: DATE_Y, w: DATE_W, h: DATE_H,
    fontFace: FONT, fontSize: SIZE_CEILINGS.lo, bold: true,
    color: COLOURS.body, align: 'left', valign: 'middle',
    underline: { style: 'sng' }, margin: 0, fit: FIT
  });

  if (data.lo) {
    slide.addText('LO: ' + data.lo, {
      x: LO_X, y: LO_Y, w: LO_W, h: LO_H,
      fontFace: FONT, fontSize: SIZE_CEILINGS.lo, bold: true,
      color: COLOURS.lo, align: 'left', valign: 'middle',
      underline: { style: 'sng' }, margin: 0, fit: FIT
    });
  }

  if (data.instruction) {
    slide.addText(data.instruction, {
      x: INSTR_X, y: INSTR_Y, w: INSTR_W, h: INSTR_H,
      fontFace: FONT, fontSize: SIZE_CEILINGS.instruction, italic: true,
      color: COLOURS.body, align: 'left', valign: 'middle',
      margin: 0, fit: FIT
    });
  }
}

module.exports = { drawLessonCover };
