'use strict';

// A "number network" — circles joined by lines where every directly-connected
// pair of circles must add up to a fixed target. The child reads the given
// circles and works out the blank ones. Used for "each line adds to 100, find
// the missing numbers" reasoning questions.
//
// Nodes are placed on an abstract integer layout grid (1 unit ≈ comfortable
// circle spacing); the helper scales that layout to fill the zone with square
// aspect, so the author thinks in rows/columns, not inches. Lines are drawn
// behind the circles so the circles always sit cleanly on top.
//
// Spec:
//   target   the sum every connected pair must reach — shown as a caption
//   nodes    [{ x, y, value, color }]
//              x, y    layout position in grid units (x across, y DOWN — so
//                      y:0 is the top row, matching "top / middle / bottom")
//              value   the number in the circle; null/omitted = a blank circle
//                      the child fills (a faint "?" is shown)
//              color   optional hex to tint the number (the answer reveal uses
//                      green on the answer slide); defaults to black
//   edges    [[i, j], …] index pairs into nodes, each drawn as a joining line

const { FONT, COLOURS, FIT } = require('../styles');
const { polyline, dot } = require('./_geom');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD          = 0.12;   // zone inner padding (inches)
const LABEL_H      = 0.42;   // caption band height (inches)
const LABEL_GAP    = 0.08;
const R_LAYOUT     = 0.5;    // circle radius in layout units (half a grid step)
const CIRCLE_FILL  = 'FFFFFF';
const CIRCLE_LINE  = '333333';
const CIRCLE_PT    = 2.5;
const EDGE_COLOUR  = '8497B0';   // muted blue-grey joining lines
const EDGE_PT      = 2.25;
const NUM_FONT     = 22;      // circle-number ceiling
const BLANK_COLOUR = 'AAAAAA';   // faint "?" in a circle to be filled
const LABEL_FONT   = 16;
// ─── END CONSTANTS ────────────────────────────────────────────

function drawNumberNetwork(pptx, slide, zone, data) {
  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  const edges = Array.isArray(data.edges) ? data.edges : [];
  if (nodes.length === 0) return;

  const hasLabel = data.target != null || !!data.label;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD - (hasLabel ? LABEL_H + LABEL_GAP : 0);

  // Layout bounds; pad each side by one radius so circles never clip the zone.
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(function (n) {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  });
  const contentW = (maxX - minX) + 2 * R_LAYOUT;
  const contentH = (maxY - minY) + 2 * R_LAYOUT;
  const s = Math.min(innerW / contentW, innerH / contentH);
  const drawnW = contentW * s;
  const drawnH = contentH * s;
  const ox = innerX + (innerW - drawnW) / 2;
  const oy = innerY + (innerH - drawnH) / 2;
  const R  = R_LAYOUT * s;

  const px = function (nx) { return ox + (nx - minX + R_LAYOUT) * s; };
  const py = function (ny) { return oy + (ny - minY + R_LAYOUT) * s; };

  // Joining lines first, behind the circles.
  edges.forEach(function (e) {
    const a = nodes[e[0]];
    const b = nodes[e[1]];
    if (!a || !b) return;
    polyline(pptx, slide, [{ x: px(a.x), y: py(a.y) }, { x: px(b.x), y: py(b.y) }],
      { lineColor: EDGE_COLOUR, width: EDGE_PT });
  });

  // Circles and their numbers.
  const fontSize = Math.max(10, Math.min(NUM_FONT, Math.round(R * 72 * 0.95)));
  nodes.forEach(function (n) {
    const cx = px(n.x);
    const cy = py(n.y);
    slide.addShape(pptx.ShapeType.ellipse, {
      x: cx - R, y: cy - R, w: 2 * R, h: 2 * R,
      fill: { color: CIRCLE_FILL }, line: { color: CIRCLE_LINE, width: CIRCLE_PT }
    });
    const blank = n.value == null || n.value === '';
    const txt = blank ? '?' : String(n.value);
    slide.addText(txt, {
      x: cx - R, y: cy - R, w: 2 * R, h: 2 * R,
      fontFace: FONT, fontSize: fontSize, bold: true,
      color: blank ? BLANK_COLOUR : (n.color || COLOURS.body),
      align: 'center', valign: 'middle', margin: 0, objectName: 'NOFIT_nn-num'
    });
  });

  // Caption: the target every line must reach.
  if (hasLabel) {
    const caption = data.label != null
      ? String(data.label)
      : 'Each connected pair adds up to ' + data.target;
    slide.addText(caption, {
      x: innerX, y: innerY + innerH + LABEL_GAP, w: innerW, h: LABEL_H,
      fontFace: FONT, fontSize: LABEL_FONT, bold: true, color: COLOURS.prompt,
      align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }
}

module.exports = { drawNumberNetwork };
