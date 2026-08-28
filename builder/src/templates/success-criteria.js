'use strict';

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

function drawSuccessCriteria(pptx, slide, data, ctx) {
  const headerStyle = data.headerStyle || 'title';
  drawHeader(slide, {
    headerStyle: headerStyle,
    title: data.title || 'Success Criteria',
    instruction: data.instruction,
    signal: data.signal,
    lo: data.lo,
    heading: data.heading
  }, ctx);

  const bz = bodyZone(headerStyle);
  bz.class = 'A';
  if (data.criteria) {
    drawContent(pptx, slide, bz, data.criteria, ctx);
  }
}

module.exports = { drawSuccessCriteria };
