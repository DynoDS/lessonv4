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

// A one-column portrait sheet does not need the page's whole width. At 174mm
// a writing line and a blank number line ran further than the work on them,
// and the sheet read as mostly empty paper. The teacher looked at the same
// sheets at 174mm, 144mm and 124mm and chose 144mm (4 October 2026), with the
// work kept to the LEFT so the spare is one strip down the right-hand side:
// "aligned left, so I don't have to trim all 4 sides, just 3". Only a sheet
// the engine has marked `narrow` gives the strip up; a sheet with things side
// by side, or a wide table, keeps the full width, because at 144mm each of two
// columns is 69mm and almost nothing fits one.
const NARROW_SPARE_MM = 30;

// A sheet is stuck into an exercise book under the date and the learning
// objective the child has written, and it may not be folded. So a strip 43mm
// deep is left clear for the teacher to trim off: along the FOOT of a portrait
// sheet and down the RIGHT of a landscape one, which goes into the book turned
// the same way (the teacher, 4 October 2026: "all sheets, portrait, should
// always have at least 4.3cm gap from bottom, because children write date and
// LO in book, and sheet has to go in, we're not allowed to fold"; "landscape
// should be 4.3cm of the right missing"; "slips don't need to be any
// different"). Slips are untouched: src/slips.js lays its own page.
//
// `meta.fullPage: true` is for the engine's own fixtures, which are sheets
// approved before this rule and kept as they were printed. It is in no
// designer's instructions and no helper catalogue.
const TRIM_STRIP_MM = 43;

// The strip is measured from the paper's edge, and the sheet's work starts
// EDGE_MM from the top and left where the printable margin used to be
// DEFAULT_MARGIN_MM, so the work area is longer by the difference. When the
// sheet moved up and left (6 October 2026) that 9mm was left to join the strip,
// which made it 52mm where the teacher had asked for 43, and sheets were being
// refused for 3mm and 8mm they would have had. Shown the same sheet both ways,
// he gave it back to the work (9 October 2026), so the strip is the 43mm he
// ruled and no more.
function stripSpareMm(spec) {
  return TRIM_STRIP_MM - DEFAULT_MARGIN_MM - (DEFAULT_MARGIN_MM - EDGE_MM);
}

function footSpareMm(spec) {
  if (spec && spec.fullPage === true) return 0;
  return (spec && spec.orientation) === "landscape" ? 0 : stripSpareMm(spec);
}

function rightSpareMm(spec) {
  if (spec && spec.fullPage === true) return 0;
  return (spec && spec.orientation) === "landscape" ? stripSpareMm(spec) : 0;
}

function narrowSpareMm(spec) {
  return spec && spec.narrow === true && (spec.orientation || "portrait") === "portrait"
    ? NARROW_SPARE_MM
    : 0;
}

// The work starts 6mm from the paper's top and left edges, which is as near as
// a classroom printer reliably prints, so those two sides are never trimmed
// and a sheet is two cuts: the right and the foot. At 15mm each was a sliver
// to trim off as well. The teacher printed a Year 4 pack at 6mm on the school
// printer (6 October 2026): "It's much better, and looks like 2 trims is all
// that is neccessary now." The work area keeps the size every measurement in
// the engine was taken against at the top and left: the whole sheet moves up
// and left, and the 9mm it leaves at the foot of a portrait sheet and the
// right of a landscape one is given to the work (see `stripSpareMm`).
//
// A `fullPage` fixture stays where it was printed.
const EDGE_MM = 6;

function edgeShiftMm(spec) {
  return spec && spec.fullPage === true ? 0 : DEFAULT_MARGIN_MM - EDGE_MM;
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
  EDGE_MM,
  edgeShiftMm,
  TRIM_STRIP_MM,
  footSpareMm,
  rightSpareMm,
  NARROW_SPARE_MM,
  narrowSpareMm,
  mmToPx,
  pageSize,
  printableArea,
};
