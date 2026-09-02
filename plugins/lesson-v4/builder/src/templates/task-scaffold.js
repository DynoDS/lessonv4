'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const TASK_RATIO      = 0.65;
const GAP_Y           = 0.18;
const SCAFFOLD_GAP_X  = 0.20;
// ─── END COORDINATES ──────────────────────────────────────────

function drawTaskScaffold(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

  const taskH     = bz.h * TASK_RATIO;
  const scaffoldH = bz.h - taskH - GAP_Y;
  const scaffoldW = (bz.w - SCAFFOLD_GAP_X) / 2;

  const taskZone = { x: bz.x, y: bz.y, w: bz.w, h: taskH, class: 'A' };
  if (data.task) drawContent(pptx, slide, taskZone, data.task, ctx);

  const scaffoldY = bz.y + taskH + GAP_Y;
  const scaffoldLeftZone  = { x: bz.x,                              y: scaffoldY, w: scaffoldW, h: scaffoldH, class: 'G' };
  const scaffoldRightZone = { x: bz.x + scaffoldW + SCAFFOLD_GAP_X, y: scaffoldY, w: scaffoldW, h: scaffoldH, class: 'G' };

  if (data.scaffoldLeft)  drawContent(pptx, slide, scaffoldLeftZone,  data.scaffoldLeft,  ctx);
  if (data.scaffoldRight) drawContent(pptx, slide, scaffoldRightZone, data.scaffoldRight, ctx);
}

module.exports = { drawTaskScaffold };
