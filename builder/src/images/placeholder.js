'use strict';

const { COLOURS } = require('../styles');

function drawMissingImage(slide, zone) {
  slide.addShape('rect', {
    x: zone.x, y: zone.y, w: zone.w, h: zone.h,
    fill: { color: COLOURS.placeholder },
    line: { color: COLOURS.placeholderLine, width: 1 }
  });
}

module.exports = { drawMissingImage };
