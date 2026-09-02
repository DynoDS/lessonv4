'use strict';

const { FONT, COLOURS, FIT } = require('../styles');
const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');

// ─── COORDINATES ──────────────────────────────────────────────
const COLS         = 4;
const ROWS         = 3;
const GAP          = 0.15;
const CELL_FILL    = 'F2F2F2';
const CELL_LINE    = '000000';
const CELL_LINE_W  = 1.2;
const CELL_RADIUS  = 0.06;
const LABEL_PAD    = 0.08;
const LABEL_H      = 0.40;
const CALC_FONT    = 22;
// ─── END COORDINATES ──────────────────────────────────────────

function drawGridCalc(pptx, slide, data, ctx) {
  drawHeader(slide, {
    headerStyle: data.headerStyle || 'title',
    title: data.title || 'Independent Tasks',
    instruction: data.instruction,
    signal: data.signal
  }, ctx);
  const bz = bodyZone(data.headerStyle, data);

  const calculations = Array.isArray(data.calculations) ? data.calculations : [];

  // Independent practice numbers, and the numbering runs on across the slides
  // that follow rather than restarting on each one (Question Labelling in
  // references/preferences.md). `startAt` carries it; omitted means start at 1.
  const startN = Number(data.startAt);
  const startAt = Number.isFinite(startN) && startN >= 1 ? Math.floor(startN) : 1;

  const cellW = (bz.w - GAP * (COLS - 1)) / COLS;
  const cellH = (bz.h - GAP * (ROWS - 1)) / ROWS;

  for (let i = 0; i < COLS * ROWS; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const cellX = bz.x + col * (cellW + GAP);
    const cellY = bz.y + row * (cellH + GAP);

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: cellX, y: cellY, w: cellW, h: cellH,
      fill: { color: CELL_FILL },
      line: { color: CELL_LINE, width: CELL_LINE_W },
      rectRadius: CELL_RADIUS
    });

    if (calculations[i]) {
      const label = '(' + (startAt + i) + ')  ' + calculations[i];
      slide.addText(label, {
        x: cellX + LABEL_PAD, y: cellY + LABEL_PAD,
        w: cellW - 2 * LABEL_PAD, h: cellH - 2 * LABEL_PAD,
        fontFace: FONT, fontSize: CALC_FONT, bold: true,
        color: COLOURS.body, align: 'left', valign: 'top',
        margin: 0, fit: FIT
      });
    }
  }
}

module.exports = { drawGridCalc };
