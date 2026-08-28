'use strict';

const { warn } = require('../warnings');
const { FONT, COLOURS } = require('../styles');

// Shared "could not be drawn" marker for the pre-rendered figure helpers (bar
// model, Venn, clock, angle, triangle, tally chart, ...). When a figure's image
// is missing at draw time — because the image tool ('sharp') is unavailable, or
// that figure's own render threw — the slide must still build, but with a
// VISIBLE, LABELLED marker rather than a near-invisible faint box, and it must
// announce itself in the build's warning summary.
//
// Why this matters: the teacher trusts the closing "No warnings" line. A silent
// blank box is the worst failure there is — the deck looks finished and the slide
// is empty, and nobody finds out until it is on the board in front of the class.
// This keeps the graceful degrade (the build never crashes) while making the gap
// impossible to miss, both on the slide and in the summary the slide-builder
// reports back. The genuinely-optional photo path stays silent by design; this is
// only for figures the lesson asked for and the engine could not draw.
function drawFigureFallback(pptx, slide, rect, ctx, label) {
  const name = label || 'figure';
  if (ctx) {
    warn(ctx.slideIndex, `${name} could not be drawn (image tool unavailable or its render failed) — a "could not be drawn" marker is shown in its place`);
  }
  if (!rect || rect.w <= 0.05 || rect.h <= 0.05) return;

  slide.addShape(pptx.shapes.RECTANGLE, {
    x: rect.x, y: rect.y, w: rect.w, h: rect.h,
    fill: { color: COLOURS.placeholder },
    line: { color: COLOURS.orange, width: 1.5, dashType: 'dash' }
  });
  slide.addText(`${name}\ncould not be drawn`, {
    x: rect.x, y: rect.y, w: rect.w, h: rect.h,
    fontFace: FONT, fontSize: 11, color: COLOURS.orange,
    align: 'center', valign: 'middle', margin: 2, fit: 'shrink'
  });
}

module.exports = { drawFigureFallback };
