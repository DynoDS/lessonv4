'use strict';

const { FONT, COLOURS, FIT } = require('../styles');

// A grey box where a picture belongs. Bare, it holds the room of a picture
// still being found (the composition preview draws these before the pictures
// land). Given `describe`, it is a picture the run could not get because the
// picture tool's usage ran out, and it says what goes there so the teacher can
// find it on the slide and add it, or a fresh session can.
function drawMissingImage(slide, zone, describe) {
  slide.addShape('rect', {
    x: zone.x, y: zone.y, w: zone.w, h: zone.h,
    fill: { color: COLOURS.placeholder },
    line: { color: COLOURS.placeholderLine, width: 1 }
  });
  if (typeof describe !== 'string' || !describe.trim()) return;
  const pad = Math.min(0.15, zone.w * 0.06, zone.h * 0.06);
  // A note for the teacher, not slide writing, so the slide's text fitting
  // and size checks leave it alone (the NOFIT_ name): it is sized here, a
  // little smaller in a small box such as a sort card's picture.
  const fontSize = Math.max(10, Math.min(16, Math.floor(Math.min(zone.w * 5, zone.h * 8))));
  slide.addText([
    { text: 'Picture to add', options: { bold: true, breakLine: true } },
    { text: describe.trim() }
  ], {
    x: zone.x + pad, y: zone.y + pad, w: Math.max(zone.w - pad * 2, 0.1), h: Math.max(zone.h - pad * 2, 0.1),
    fontFace: FONT, fontSize: fontSize, color: '404040',
    align: 'center', valign: 'middle', margin: 0, fit: FIT,
    objectName: 'NOFIT_picture-to-add'
  });
}

module.exports = { drawMissingImage };
