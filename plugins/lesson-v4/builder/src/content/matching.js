'use strict';

const { FONT, COLOURS, FIT } = require('../styles');

// ─── CONSTANTS ────────────────────────────────────────────────
// A "draw a line to match" layout: a column of boxes on the left, a column on
// the right, and straight connector lines between matched pairs. On the
// question slide one example pair is usually joined and the rest left blank for
// the child to draw; on the answer slide every pair is joined in green. The two
// columns can hold different counts (e.g. six numbers on the left, six answer
// boxes on the right where two match nothing) — each column is distributed
// evenly down the zone independently.
const PAD          = 0.10;
const BOX_W_RATIO  = 0.26;   // each column of boxes ~quarter of the zone width
const BOX_H_RATIO  = 0.66;   // box height as a fraction of its vertical slot
const BOX_FILL     = 'FFFFFF';
const BOX_LINE     = '000000';
const BOX_LINE_W   = 1.5;
const BOX_RADIUS   = 0.06;
const LINE_W       = 2.25;
const FONT_RATIO   = 0.46;
const FONT_MAX     = 28;
const FONT_MIN     = 12;
// ─── END CONSTANTS ────────────────────────────────────────────

function columnGeometry(items, x, boxW, zone) {
  const n = Math.max(1, items.length);
  const slotH = (zone.h - 2 * PAD) / n;
  const boxH = Math.min(slotH * BOX_H_RATIO, slotH - 0.06);
  return items.map(function (_, i) {
    const slotY = zone.y + PAD + i * slotH;
    return { x: x, y: slotY + (slotH - boxH) / 2, w: boxW, h: boxH };
  });
}

function drawMatching(pptx, slide, zone, data) {
  const left = Array.isArray(data.left) ? data.left : [];
  const right = Array.isArray(data.right) ? data.right : [];
  const connections = Array.isArray(data.connections) ? data.connections : [];
  const isAnswer = data.answer === true;
  if (left.length === 0 || right.length === 0) return;

  const boxW = (zone.w - 2 * PAD) * BOX_W_RATIO;
  const leftX = zone.x + PAD;
  const rightX = zone.x + zone.w - PAD - boxW;

  const leftBoxes = columnGeometry(left, leftX, boxW, zone);
  const rightBoxes = columnGeometry(right, rightX, boxW, zone);

  function drawBox(box, text) {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: box.x, y: box.y, w: box.w, h: box.h,
      fill: { color: BOX_FILL },
      line: { color: BOX_LINE, width: BOX_LINE_W },
      rectRadius: BOX_RADIUS
    });
    const fontSize = Math.max(FONT_MIN, Math.min(FONT_MAX, Math.round(box.h * 72 * FONT_RATIO)));
    slide.addText(String(text == null ? '' : text), {
      x: box.x, y: box.y, w: box.w, h: box.h,
      fontFace: FONT, fontSize: fontSize, bold: true,
      color: COLOURS.body, align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }

  // Connector lines are drawn first so the boxes sit cleanly on top of the ends.
  connections.forEach(function (pair) {
    if (!Array.isArray(pair) || pair.length < 2) return;
    const lb = leftBoxes[pair[0]];
    const rb = rightBoxes[pair[1]];
    if (!lb || !rb) return;
    const sx = lb.x + lb.w;
    const sy = lb.y + lb.h / 2;
    const ex = rb.x;
    const ey = rb.y + rb.h / 2;
    const opts = {
      x: sx, w: Math.max(0.01, ex - sx),
      line: { color: isAnswer ? COLOURS.green : COLOURS.body, width: LINE_W }
    };
    if (ey >= sy) { opts.y = sy; opts.h = Math.max(0.01, ey - sy); }
    else { opts.y = ey; opts.h = Math.max(0.01, sy - ey); opts.flipV = true; }
    slide.addShape(pptx.shapes.LINE, opts);
  });

  leftBoxes.forEach(function (box, i) { drawBox(box, left[i]); });
  rightBoxes.forEach(function (box, i) { drawBox(box, right[i]); });
}

module.exports = { drawMatching };
