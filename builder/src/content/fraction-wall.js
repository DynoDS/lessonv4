'use strict';

const { FONT, COLOURS, FIT } = require('../styles');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD               = 0.06;
const BORDER_COLOUR     = '666666';
const BORDER_PT         = 1.5;
const LABEL_FONT        = 14;
const LABEL_MIN_FONT    = 7;
const CHAR_WIDTH_PER_PT = 0.0095;
const BAR_MAX_W         = 0.28;
const BAR_H             = 0.012;
const MIN_STACK_H       = 0.20;
const ROW_COLOURS       = ['FFE4CC', 'FFF8CC', 'D6EEFF', 'D5F5E3',
                           'EAD5F5', 'FFD6D6', 'D5F5F5', 'F5F5D5', 'FFE4E4'];
// ─── END CONSTANTS ────────────────────────────────────────────

function drawFractionWall(pptx, slide, zone, data) {
  const fractions = Array.isArray(data.fractions) ? data.fractions : [1, 2, 3, 4];
  if (fractions.length === 0) return;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD;
  const rowH   = innerH / fractions.length;

  fractions.forEach(function (denom, rowIdx) {
    const rowY      = innerY + rowIdx * rowH;
    const fillColor = ROW_COLOURS[rowIdx % ROW_COLOURS.length];
    const cellW     = innerW / denom;
    const halfH     = rowH / 2;

    const useStack = denom > 1 && halfH >= MIN_STACK_H;

    const denomChars  = String(denom).length;
    const labelChars  = useStack ? denomChars : (denom === 1 ? 1 : 2 + denomChars);
    const fontByW     = Math.floor(cellW / (labelChars * CHAR_WIDTH_PER_PT));
    const fontSize    = Math.max(LABEL_MIN_FONT, Math.min(LABEL_FONT, fontByW));

    for (let i = 0; i < denom; i++) {
      const cellX = innerX + i * cellW;

      slide.addShape(pptx.shapes.RECTANGLE, {
        x: cellX, y: rowY, w: cellW, h: rowH,
        fill: { color: fillColor },
        line: { color: BORDER_COLOUR, width: BORDER_PT }
      });

      if (!useStack) {
        const label = denom === 1 ? '1' : '1\u2044' + denom;
        slide.addText(label, {
          x: cellX, y: rowY, w: cellW, h: rowH,
          fontFace: FONT, fontSize: fontSize, bold: true, color: COLOURS.body,
          align: 'center', valign: 'middle', margin: 0,
          objectName: 'NOFIT_frac-label'
        });
      } else {
        const barW = Math.min(cellW * 0.75, BAR_MAX_W);
        const barX = cellX + (cellW - barW) / 2;
        const barY = rowY + halfH - BAR_H / 2;

        slide.addText('1', {
          x: cellX, y: rowY, w: cellW, h: halfH,
          fontFace: FONT, fontSize: fontSize, bold: true, color: COLOURS.body,
          align: 'center', valign: 'middle', margin: 0,
          objectName: 'NOFIT_frac-num'
        });
        slide.addShape(pptx.shapes.RECTANGLE, {
          x: barX, y: barY, w: barW, h: BAR_H,
          fill: { color: COLOURS.body }, line: { color: COLOURS.body, width: 0 }
        });
        slide.addText(String(denom), {
          x: cellX, y: rowY + halfH, w: cellW, h: halfH,
          fontFace: FONT, fontSize: fontSize, bold: true, color: COLOURS.body,
          align: 'center', valign: 'middle', margin: 0,
          objectName: 'NOFIT_frac-den'
        });
      }
    }
  });
}

module.exports = { drawFractionWall };
