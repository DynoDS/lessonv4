'use strict';

const { FONT, COLOURS, FIT, MIN_FONT_PT } = require('../styles');
const { wrappedLineCount } = require('../glyph-width');

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
// The boxes were a fixed 1.80in x 0.70in (effect) and 1.75in x 0.60in (cause),
// sized for small type. Once every helper took the 18pt readable floor
// (4.2.128, 10 September 2026) they held about twelve characters, so a real
// cause ("Caesar wanted military glory") could not be drawn and the helper's
// own example had not built since. Each box is now measured from its words:
// as wide as the ribs leave room for, as tall as its lines.
const EFFECT_BOX_W     = 2.40;
const EFFECT_BOX_MIN_H = 0.70;
const EFFECT_FILL      = '0070C0';
const EFFECT_FONT      = 20;
const EFFECT_TEXT_CLR  = 'FFFFFF';
const RIB_THICK        = 0.04;
const RIB_COLOUR       = '000000';
const RIB_ANGLE_DEG    = 35;
const CAUSE_BOX_MIN_W  = 1.75;
const CAUSE_BOX_MAX_W  = 3.00;
const CAUSE_BOX_MIN_H  = 0.60;
const BOX_TEXT_PAD     = 0.08;   // inset of the words inside a box, each side
const LINE_H_PER_PT    = 1.32 / 72 * 1.04;   // renderer line pitch, with the fit pass's safety
const RIB_GAP          = 0.15;   // clear air between neighbouring boxes on one side
const CAUSE_FILL       = 'FFFFFF';
const CAUSE_LINE       = 'E46C0A';   // orange, matches teachRight
const CAUSE_LINE_W     = 2;
const CAUSE_FONT       = Math.max(18, MIN_FONT_PT);
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

  const boxH = function (text, width, pt) {
    const lines = wrappedLineCount(text, pt, width - 2 * BOX_TEXT_PAD, true);
    return lines * pt * LINE_H_PER_PT + 2 * BOX_TEXT_PAD;
  };

  const effectW = Math.min(EFFECT_BOX_W, innerW * 0.3);
  const effectH = Math.max(EFFECT_BOX_MIN_H, boxH(effect, effectW, Math.max(EFFECT_FONT, MIN_FONT_PT)));
  const n = causes.length;
  const perSide = Math.max(1, Math.ceil(n / 2));

  // The cause boxes on one side share the spine's length between them, so the
  // width a box may take is what the spine leaves for each. The spine's length
  // depends on the reserve those boxes need on the left, so settle it twice.
  let causeW = CAUSE_BOX_MIN_W;
  let causeH = CAUSE_BOX_MIN_H;
  let ribLen = 0;
  let leftReserve = 0;
  for (let pass = 0; pass < 3; pass++) {
    causeH = Math.max(CAUSE_BOX_MIN_H, ...causes.map(function (c) { return boxH(String(c), causeW, CAUSE_FONT); }));
    const verticalReach = innerH / 2 - causeH / 2 - RIB_END_PAD;
    ribLen = Math.max(0.4, Math.min(verticalReach / sin, 3.5));
    leftReserve = ribLen * cos + causeW / 2 + 0.10;
    const spineRoom = innerW - leftReserve - effectW - ARROW_HEAD_W - 0.55;
    const pitch = perSide > 1 ? (spineRoom / Math.max(1, n - 1)) * 2 : spineRoom;
    causeW = Math.max(CAUSE_BOX_MIN_W, Math.min(CAUSE_BOX_MAX_W, pitch - RIB_GAP));
  }
  causeH = Math.max(CAUSE_BOX_MIN_H, ...causes.map(function (c) { return boxH(String(c), causeW, CAUSE_FONT); }));

  const unreadable = [effect].concat(causes.map(String)).filter(function (t, i) {
    return !Number.isFinite(boxH(t, i === 0 ? effectW : causeW, i === 0 ? Math.max(EFFECT_FONT, MIN_FONT_PT) : CAUSE_FONT));
  });
  if (unreadable.length || innerH / 2 < causeH + RIB_END_PAD || effectH > innerH) {
    throw new Error(
      'FISHBONE_ZONE_TOO_SMALL: the fishbone needs ' + (2 * causeH + 2 * RIB_END_PAD).toFixed(2) +
        'in of height for cause boxes ' + causeW.toFixed(2) + 'in wide at the ' + CAUSE_FONT +
        'pt readable minimum, and the zone gives ' + innerH.toFixed(2) + 'in' +
        (unreadable.length ? '; a word in "' + unreadable[0] + '" is wider than its box' : '') +
        '. Give it a larger zone, fewer causes, or shorter cause wording; nothing was shrunk further.'
    );
  }

  // Effect box on the right
  const effectX = innerX + innerW - effectW;
  const effectY = spineY - effectH / 2;

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
    x: effectX, y: effectY, w: effectW, h: effectH,
    fill: { color: EFFECT_FILL }, line: { color: EFFECT_FILL, width: 0 }
  });
  slide.addText(effect, {
    x: effectX + BOX_TEXT_PAD, y: effectY + BOX_TEXT_PAD,
    w: effectW - 2 * BOX_TEXT_PAD, h: effectH - 2 * BOX_TEXT_PAD,
    fontFace: FONT, fontSize: EFFECT_FONT, bold: true,
    color: EFFECT_TEXT_CLR,
    align: 'center', valign: 'middle', margin: 0,
    fit: FIT
  });

  // Ribs: alternate top/bottom along the spine.
  // Distribute attachment points evenly between just-inside the spine start
  // and just-before the arrow head.
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
    const boxX = endX - causeW / 2;
    const boxY = endY - causeH / 2;
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: boxX, y: boxY, w: causeW, h: causeH,
      fill: { color: CAUSE_FILL },
      line: { color: CAUSE_LINE, width: CAUSE_LINE_W }
    });
    slide.addText(String(causes[i]), {
      x: boxX + BOX_TEXT_PAD, y: boxY + BOX_TEXT_PAD,
      w: causeW - 2 * BOX_TEXT_PAD, h: causeH - 2 * BOX_TEXT_PAD,
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
