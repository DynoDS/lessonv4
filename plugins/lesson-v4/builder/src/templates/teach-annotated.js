'use strict';

const { FONT, COLOURS, FIT } = require('../styles');
const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const CENTRE_W_RATIO   = 0.50;
const CENTRE_H_RATIO   = 0.60;

const CALLOUT_W        = 2.80;
const CALLOUT_H        = 1.00;
const CALLOUT_MARGIN   = 0.15;
const CALLOUT_PAD      = 0.10;
const CALLOUT_RADIUS   = 0.08;
const CALLOUT_BORDER_W = 2.0;
const CALLOUT_FONT     = 16;

const CALLOUT_COLOURS = [
  { fill: 'D6EEFF', border: '0070C0', text: '0070C0' },
  { fill: 'FFE0C2', border: 'E46C0A', text: 'E46C0A' },
  { fill: 'D5F5E3', border: '00B050', text: '00B050' },
  { fill: 'EAD5F5', border: '7030A0', text: '7030A0' }
];
// ─── END COORDINATES ──────────────────────────────────────────

function drawTeachAnnotated(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

  const centreW = bz.w * CENTRE_W_RATIO;
  const centreH = bz.h * CENTRE_H_RATIO;
  const centreX = bz.x + (bz.w - centreW) / 2;
  const centreY = bz.y + (bz.h - centreH) / 2;
  const centreZone = {
    x: centreX, y: centreY, w: centreW, h: centreH, class: 'C'
  };

  if (data.centralContent) {
    drawContent(pptx, slide, centreZone, data.centralContent, ctx);
  }

  const annotations = Array.isArray(data.annotations) ? data.annotations : [];
  const positions = [
    { x: bz.x + CALLOUT_MARGIN,                    y: bz.y + CALLOUT_MARGIN },
    { x: bz.x + bz.w - CALLOUT_W - CALLOUT_MARGIN, y: bz.y + CALLOUT_MARGIN },
    { x: bz.x + CALLOUT_MARGIN,                    y: bz.y + bz.h - CALLOUT_H - CALLOUT_MARGIN },
    { x: bz.x + bz.w - CALLOUT_W - CALLOUT_MARGIN, y: bz.y + bz.h - CALLOUT_H - CALLOUT_MARGIN }
  ];

  annotations.forEach(function (text, i) {
    if (i >= 4 || !text) return;
    const pos = positions[i];
    const style = CALLOUT_COLOURS[i];
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: pos.x, y: pos.y, w: CALLOUT_W, h: CALLOUT_H,
      fill: { color: style.fill },
      line: { color: style.border, width: CALLOUT_BORDER_W },
      rectRadius: CALLOUT_RADIUS
    });
    slide.addText(text, {
      x: pos.x + CALLOUT_PAD, y: pos.y + CALLOUT_PAD,
      w: CALLOUT_W - 2 * CALLOUT_PAD, h: CALLOUT_H - 2 * CALLOUT_PAD,
      fontFace: FONT, fontSize: CALLOUT_FONT, bold: true,
      color: style.text, align: 'center', valign: 'middle',
      margin: 0, fit: FIT
    });
  });
}

module.exports = { drawTeachAnnotated };
