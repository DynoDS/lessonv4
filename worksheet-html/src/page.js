"use strict";

// Paper, and nothing else.
//
// Every measurement in the shape and token layers is in millimetres, because
// that is the unit the thing is actually printed in and the unit Daniel can
// check with a ruler. Pixels appear only at the moment CSS needs them.

// CSS defines its physical units against a 96dpi reference, so this conversion
// is exact and fixed, not a property of anyone's monitor. Making a monitor show
// true physical size is a separate problem, handled by src/calibrate.js.
const PX_PER_MM = 96 / 25.4;

const A4_SHORT_MM = 210;
const A4_LONG_MM = 297;

// 15mm all round. Wide enough to survive a classroom printer's unprintable
// edge, tight enough not to spend a strip of every sheet on nothing.
const DEFAULT_MARGIN_MM = 15;

function mmToPx(mm) {
  return mm * PX_PER_MM;
}

function pageSize(orientation = "portrait") {
  if (orientation !== "portrait" && orientation !== "landscape") {
    throw new Error(`unknown orientation "${orientation}"`);
  }
  return orientation === "portrait"
    ? { widthMm: A4_SHORT_MM, heightMm: A4_LONG_MM }
    : { widthMm: A4_LONG_MM, heightMm: A4_SHORT_MM };
}

function printableArea(orientation = "portrait", marginMm = DEFAULT_MARGIN_MM) {
  const { widthMm, heightMm } = pageSize(orientation);
  const width = widthMm - marginMm * 2;
  const height = heightMm - marginMm * 2;

  if (width <= 0 || height <= 0) {
    throw new Error(
      `a margin of ${marginMm}mm leaves no printable area on ${orientation} A4`
    );
  }
  return { widthMm: width, heightMm: height };
}

module.exports = {
  PX_PER_MM,
  DEFAULT_MARGIN_MM,
  mmToPx,
  pageSize,
  printableArea,
};
