'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const GAP_X      = 0.20;
const SIDE_RATIO = 0.25;
// ─── END COORDINATES ──────────────────────────────────────────

function drawCentreBigH(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

  const usableW = bz.w - GAP_X * 2;
  const sideW   = usableW * SIDE_RATIO;
  const centreW = usableW - sideW * 2;

  const leftZone   = { x: bz.x,                                y: bz.y, w: sideW,   h: bz.h, class: 'G'      };
  const centreZone = { x: bz.x + sideW + GAP_X,                y: bz.y, w: centreW, h: bz.h, class: 'E-wide' };
  const rightZone  = { x: bz.x + sideW + GAP_X + centreW + GAP_X, y: bz.y, w: sideW, h: bz.h, class: 'G'    };

  if (data.left)   drawContent(pptx, slide, leftZone,   data.left,   ctx);
  if (data.centre) drawContent(pptx, slide, centreZone, data.centre, ctx);
  if (data.right)  drawContent(pptx, slide, rightZone,  data.right,  ctx);
}

module.exports = { drawCentreBigH };
