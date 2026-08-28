'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const CENTRE_W_RATIO = 0.52;
const CENTRE_H_RATIO = 0.60;
const CALLOUT_W      = 3.00;
const CALLOUT_H      = 1.40;
const CALLOUT_MARGIN = 0.15;
// ─── END COORDINATES ──────────────────────────────────────────

function drawCentralCallouts4(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle);

  const centreW = bz.w * CENTRE_W_RATIO;
  const centreH = bz.h * CENTRE_H_RATIO;
  const centreX = bz.x + (bz.w - centreW) / 2;
  const centreY = bz.y + (bz.h - centreH) / 2;
  const centreZone = {
    x: centreX, y: centreY, w: centreW, h: centreH, class: 'E-wide'
  };
  if (data.centre) drawContent(pptx, slide, centreZone, data.centre, ctx);

  const callouts = Array.isArray(data.callouts) ? data.callouts : [];
  const positions = [
    { x: bz.x + CALLOUT_MARGIN,                    y: bz.y + CALLOUT_MARGIN },
    { x: bz.x + bz.w - CALLOUT_W - CALLOUT_MARGIN, y: bz.y + CALLOUT_MARGIN },
    { x: bz.x + CALLOUT_MARGIN,                    y: bz.y + bz.h - CALLOUT_H - CALLOUT_MARGIN },
    { x: bz.x + bz.w - CALLOUT_W - CALLOUT_MARGIN, y: bz.y + bz.h - CALLOUT_H - CALLOUT_MARGIN }
  ];

  callouts.forEach(function (co, i) {
    if (i >= 4 || !co) return;
    const pos = positions[i];
    const zone = { x: pos.x, y: pos.y, w: CALLOUT_W, h: CALLOUT_H, class: 'G' };
    drawContent(pptx, slide, zone, co, ctx);
  });
}

module.exports = { drawCentralCallouts4 };
