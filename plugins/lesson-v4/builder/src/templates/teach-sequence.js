'use strict';

const { FONT, COLOURS, FIT } = require('../styles');
const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');

// ─── COORDINATES ──────────────────────────────────────────────
const STAGE_GAP_X    = 0.30;
const STAGE_PAD      = 0.15;
const STAGE_RADIUS   = 0.10;
const STAGE_FILL     = 'F2F2F2';
const STAGE_BORDER   = '0070C0';
const STAGE_BORDER_W = 2.0;
const STAGE_FONT     = 22;

const ARROW_W        = 0.30;
const ARROW_H        = 0.40;
const ARROW_COLOUR   = '0070C0';
// ─── END COORDINATES ──────────────────────────────────────────

function drawTeachSequence(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

  const stages = Array.isArray(data.stages) ? data.stages : [];
  if (stages.length === 0) return;

  const n = stages.length;
  const arrowsTotal = (n - 1) * (ARROW_W + STAGE_GAP_X * 2);
  const stageW = (bz.w - arrowsTotal) / n;
  const stageH = Math.min(bz.h, stageW * 0.6);
  const stageY = bz.y + (bz.h - stageH) / 2;

  let cursorX = bz.x;
  stages.forEach(function (text, i) {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: cursorX, y: stageY, w: stageW, h: stageH,
      fill: { color: STAGE_FILL },
      line: { color: STAGE_BORDER, width: STAGE_BORDER_W },
      rectRadius: STAGE_RADIUS
    });
    slide.addText(text, {
      x: cursorX + STAGE_PAD, y: stageY + STAGE_PAD,
      w: stageW - 2 * STAGE_PAD, h: stageH - 2 * STAGE_PAD,
      fontFace: FONT, fontSize: STAGE_FONT, bold: true,
      color: COLOURS.body, align: 'center', valign: 'middle',
      margin: 0, fit: FIT
    });
    cursorX += stageW;

    if (i < n - 1) {
      const arrowY = stageY + (stageH - ARROW_H) / 2;
      slide.addShape(pptx.shapes.RIGHT_TRIANGLE, {
        x: cursorX + STAGE_GAP_X, y: arrowY,
        w: ARROW_W, h: ARROW_H,
        fill: { color: ARROW_COLOUR },
        line: { color: ARROW_COLOUR, width: 0 },
        rotate: 90
      });
      cursorX += STAGE_GAP_X + ARROW_W + STAGE_GAP_X;
    }
  });
}

module.exports = { drawTeachSequence };
