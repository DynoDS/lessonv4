'use strict';

const {
  CATEGORY_COLOUR_KEYS,
  categoryColourFor
} = require('../category-colours');

const ACCENT_H = 0.055;

function drawGroupAccent(
  pptx,
  slide,
  zone,
  value
) {
  if (value == null || value === '') return;

  const colour = categoryColourFor(value);
  if (!colour) {
    throw new Error(
      `GROUP_ACCENT_INVALID: groupAccent must be one of ` +
      `${CATEGORY_COLOUR_KEYS.join(', ')}; found ${JSON.stringify(value)}.`
    );
  }

  slide.addShape(
    pptx.shapes.RECTANGLE,
    {
      x: zone.x,
      y: zone.y,
      w: zone.w,
      h: ACCENT_H,
      fill: { color: colour },
      line: { type: 'none' }
    }
  );
}

module.exports = {
  ACCENT_H,
  drawGroupAccent
};
