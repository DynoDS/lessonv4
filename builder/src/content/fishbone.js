'use strict';

const { FONT, COLOURS, FIT } = require('../styles');

// ─── CONSTANTS ────────────────────────────────────────────────
// A fishbone (Ishikawa) cause-and-effect scaffold. Horizontal spine
// arrow pointing right; ribs angling out from the spine alternately
// top/bottom; effect label sits inside a box at the arrow head; cause
// labels sit at the end of each rib in their own boxes.
const PAD              = 0.10;
const SPINE_THICK      = 0.06;
const SPINE_COLOUR     = '000000';
const ARROW_HEAD_W     = 0.40;
const ARROW_HEAD_H     = 0.50;
const EFFECT_BOX_W     = 1.80;
const EFFECT_BOX_H     = 0.70;
const EFFECT_FILL      = '0070C0';
const EFFECT_FONT      = 20;
const EFFECT_TEXT_CLR  = 'FFFFFF';
const RIB_THICK        = 0.04;
const RIB_COLOUR       = '000000';
const RIB_ANGLE_DEG    = 35;
const CAUSE_BOX_W      = 1.75;
const CAUSE_BOX_H      = 0.60;
const CAUSE_FILL       = 'FFFFFF';
const CAUSE_LINE       = 'E46C0A';   // orange, matches teachRight
const CAUSE_LINE_W     = 2;
const CAUSE_FONT       = 18;
const SPINE_LEFT_INSET = 0.20;
const RIB_END_PAD      = 0.10;
// ─── END CONSTANTS ────────────────────────────────────────────

function drawFishbone(pptx, slide, zone, data) {
  const effect = data.effect != null ? String(data.effect) : '';
  const causes = Array.isArray(data.causes) ? data.causes.slice(0, 6) : [];

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = Math.max(1.0, zone.w - 2 * PAD);
  const innerH = Math.max(0.5, zone.h - 2 * PAD);

  const spineY = innerY + innerH / 2;

  const angleRad = (RIB_ANGLE_DEG * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  // Rib length is limited by vertical room (cause box must stay above/below
  // the spine without overflowing the zone) and capped to keep proportions sane.
  const verticalReach = Math.max(0.3, innerH / 2 - CAUSE_BOX_H / 2 - RIB_END_PAD);
  const ribLenByH     = verticalReach / sin;
  const ribLen        = Math.max(0.4, Math.min(ribLenByH, 3.5));
  const horizontalReach = ribLen * cos;

  // Reserve room on the LEFT for the rib reach + half a cause box.
  // Ribs angle backward-up and backward-down from each attachment point;
  // cause boxes sit at the rib ends, so without this reserve they overflow
  // the zone on the left.
  const leftReserve = horizontalReach + CAUSE_BOX_W / 2 + 0.10;

  // Effect box on the right
  const effectX = innerX + innerW - EFFECT_BOX_W;
  const effectY = spineY - EFFECT_BOX_H / 2;

  // Spine starts after the left-reserve so ribs always fit inside the zone.
  const spineStartX = innerX + leftReserve;
  const spineEndX   = effectX - 0.05;
  const spineW      = Math.max(0.5, spineEndX - spineStartX - ARROW_HEAD_W);

  // Spine line
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: spineStartX, y: spineY - SPINE_THICK / 2, w: spineW, h: SPINE_THICK,
    fill: { color: SPINE_COLOUR }, line: { color: SPINE_COLOUR, width: 0 }
  });

  // Arrow head pointing right at the end of the spine
  slide.addShape(pptx.shapes.RIGHT_TRIANGLE, {
    x: spineStartX + spineW, y: spineY - ARROW_HEAD_H / 2,
    w: ARROW_HEAD_W, h: ARROW_HEAD_H,
    fill: { color: SPINE_COLOUR }, line: { color: SPINE_COLOUR, width: 0 },
    rotate: 90
  });

  // Effect box
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: effectX, y: effectY, w: EFFECT_BOX_W, h: EFFECT_BOX_H,
    fill: { color: EFFECT_FILL }, line: { color: EFFECT_FILL, width: 0 }
  });
  slide.addText(effect, {
    x: effectX + 0.05, y: effectY + 0.05,
    w: EFFECT_BOX_W - 0.10, h: EFFECT_BOX_H - 0.10,
    fontFace: FONT, fontSize: EFFECT_FONT, bold: true,
    color: EFFECT_TEXT_CLR,
    align: 'center', valign: 'middle', margin: 0,
    fit: FIT
  });

  // Ribs: alternate top/bottom along the spine.
  // Distribute attachment points evenly between just-inside the spine start
  // and just-before the arrow head.
  const n = causes.length;
  if (n === 0) return;

  const ribAreaStart = spineStartX + 0.20;
  const ribAreaEnd   = spineStartX + spineW - 0.30;
  const ribAreaW     = Math.max(0.1, ribAreaEnd - ribAreaStart);
  const step         = n > 1 ? ribAreaW / (n - 1) : 0;

  for (let i = 0; i < n; i++) {
    const isTop  = (i % 2) === 0;
    const attachX = n > 1 ? ribAreaStart + i * step : (ribAreaStart + ribAreaEnd) / 2;
    const dirX    = -cos;
    const dirY    = isTop ? -sin : sin;

    const endX = attachX + ribLen * dirX;
    const endY = spineY   + ribLen * dirY;

    drawRib(pptx, slide, attachX, spineY, endX, endY);

    // Cause box centred on (endX, endY)
    const boxX = endX - CAUSE_BOX_W / 2;
    const boxY = endY - CAUSE_BOX_H / 2;
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: boxX, y: boxY, w: CAUSE_BOX_W, h: CAUSE_BOX_H,
      fill: { color: CAUSE_FILL },
      line: { color: CAUSE_LINE, width: CAUSE_LINE_W }
    });
    slide.addText(String(causes[i]), {
      x: boxX + 0.04, y: boxY + 0.04,
      w: CAUSE_BOX_W - 0.08, h: CAUSE_BOX_H - 0.08,
      fontFace: FONT, fontSize: CAUSE_FONT, bold: true,
      color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0,
      fit: FIT
    });
  }
}

// Draw a thin rib line from spine attachment point to cause-box anchor point.
// pptxgenjs LINE default goes top-left→bottom-right; flips mirror it.
function drawRib(pptx, slide, x1, y1, x2, y2) {
  const dx    = x2 - x1;
  const dy    = y2 - y1;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (absDx < 0.001 && absDy < 0.001) return;

  if (dx > 0 && dy > 0) {
    slide.addShape(pptx.shapes.LINE, {
      x: x1, y: y1, w: dx, h: dy,
      line: { color: RIB_COLOUR, width: RIB_THICK * 72 }
    });
  } else if (dx > 0 && dy < 0) {
    slide.addShape(pptx.shapes.LINE, {
      x: x1, y: y2, w: dx, h: absDy, flipV: true,
      line: { color: RIB_COLOUR, width: RIB_THICK * 72 }
    });
  } else if (dx < 0 && dy > 0) {
    slide.addShape(pptx.shapes.LINE, {
      x: x2, y: y1, w: absDx, h: dy, flipH: true,
      line: { color: RIB_COLOUR, width: RIB_THICK * 72 }
    });
  } else {
    slide.addShape(pptx.shapes.LINE, {
      x: x2, y: y2, w: absDx, h: absDy,
      line: { color: RIB_COLOUR, width: RIB_THICK * 72 }
    });
  }
}

module.exports = { drawFishbone };
