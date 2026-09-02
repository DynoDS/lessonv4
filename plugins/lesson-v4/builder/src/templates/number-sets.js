'use strict';

const { FONT, COLOURS, FIT } = require('../styles');
const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');

// ─── COORDINATES ──────────────────────────────────────────────
const BOX_GAP       = 0.25;
const BOX_FILL      = 'F2F2F2';
const BOX_LINE      = '000000';
const BOX_LINE_W    = 1.5;
const BOX_RADIUS    = 0.10;
const NUMBER_FONT   = 40;
const PROMPT_H      = 0.60;
const PROMPT_GAP    = 0.20;
const PROMPT_FONT   = 22;
// ─── END COORDINATES ──────────────────────────────────────────

function drawNumberSets(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

  const numbers = Array.isArray(data.numbers) ? data.numbers : [];
  if (numbers.length === 0) return;

  const hasPrompt = !!data.prompt;
  const boxesH = hasPrompt ? bz.h - PROMPT_H - PROMPT_GAP : bz.h;

  const n     = numbers.length;
  const boxW  = (bz.w - BOX_GAP * (n - 1)) / n;
  const boxSize = Math.min(boxW, boxesH);
  const rowY = bz.y + (boxesH - boxSize) / 2;

  const totalBoxesW = boxSize * n + BOX_GAP * (n - 1);
  const startX = bz.x + (bz.w - totalBoxesW) / 2;

  for (let i = 0; i < n; i++) {
    const boxX = startX + i * (boxSize + BOX_GAP);
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: boxX, y: rowY, w: boxSize, h: boxSize,
      fill: { color: BOX_FILL },
      line: { color: BOX_LINE, width: BOX_LINE_W },
      rectRadius: BOX_RADIUS
    });
    slide.addText(String(numbers[i]), {
      x: boxX, y: rowY, w: boxSize, h: boxSize,
      fontFace: FONT, fontSize: NUMBER_FONT, bold: true,
      color: COLOURS.body, align: 'center', valign: 'middle',
      margin: 0, fit: FIT
    });
  }

  if (hasPrompt) {
    slide.addText(String(data.prompt), {
      x: bz.x, y: bz.y + boxesH + PROMPT_GAP,
      w: bz.w, h: PROMPT_H,
      fontFace: FONT, fontSize: PROMPT_FONT, italic: true, bold: true,
      color: COLOURS.prompt, align: 'center', valign: 'middle',
      margin: 0, fit: FIT
    });
  }
}

module.exports = { drawNumberSets };
