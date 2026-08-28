'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

function drawTeachSteps(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle);
  bz.class = 'A';

  const steps = Array.isArray(data.steps) ? data.steps : [];
  if (steps.length === 0) return;

  drawContent(pptx, slide, bz, { type: 'steps', steps: steps }, ctx);
}

module.exports = { drawTeachSteps };
