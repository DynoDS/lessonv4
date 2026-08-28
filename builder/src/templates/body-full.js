'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

function drawBodyFull(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle);
  bz.class = 'A';
  if (data.body) {
    drawContent(pptx, slide, bz, data.body, ctx);
  }
}

module.exports = { drawBodyFull };
