'use strict';

// Shared containment math for figures that centre a fixed-aspect picture in a
// zone (circuit diagrams, labelled diagrams, the symbol bank). The picture is
// fitted into the frame with its aspect preserved - never stretched - and the
// card-ready rect comes back as the fitted picture plus its breathing margin,
// so the card look hugs what will actually be drawn instead of spanning the
// whole zone with dead space around a centred image.

const PAD = 0.10;

function measureContainedAspect(zone, aspect, pad = PAD) {
  const innerW = Math.max(0, zone.w - 2 * pad);
  const innerH = Math.max(0, zone.h - 2 * pad);
  let w = innerW;
  let h = w / aspect;
  if (h > innerH) {
    h = innerH;
    w = h * aspect;
  }
  return {
    x: zone.x + pad + (innerW - w) / 2,
    y: zone.y + pad + (innerH - h) / 2,
    w: w + 2 * pad,
    h: h + 2 * pad,
    clamp: true
  };
}

module.exports = { measureContainedAspect };
