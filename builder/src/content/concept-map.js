'use strict';

const { FONT, COLOURS, FIT } = require('../styles');

// ─── CONSTANTS ────────────────────────────────────────────────
// A radial concept map: one central node, 2–6 spoke nodes around it,
// each spoke connected to the centre by a line with an optional
// relationship label sitting on the line.
const PAD              = 0.10;
const CENTRE_FILL      = '0070C0';
const CENTRE_LINE      = '0070C0';
const CENTRE_TEXT_CLR  = 'FFFFFF';
const CENTRE_FONT      = 18;
const SPOKE_FILL       = 'FFFFFF';
const SPOKE_LINE       = 'E46C0A';   // orange, matches teachRight
const SPOKE_LINE_W     = 2;
const SPOKE_TEXT_CLR   = '000000';
const SPOKE_FONT       = 14;
const LINE_THICK_PT    = 2;
const LINE_COLOUR      = '888888';
const REL_LABEL_W      = 1.55;
const REL_LABEL_H      = 0.38;
const REL_LABEL_FONT   = 13;
const REL_LABEL_CLR    = '0070C0';
const REL_LABEL_FILL   = 'FFFFFF';
const CENTRE_W_RATIO   = 0.28;       // centre node width as fraction of min(innerW, innerH)
const CENTRE_H_RATIO   = 0.20;
const SPOKE_W_RATIO    = 0.26;
const SPOKE_H_RATIO    = 0.16;
const RADIUS_RATIO     = 0.38;       // distance from centre to spoke centre as fraction of min(innerW, innerH)
// ─── END CONSTANTS ────────────────────────────────────────────

function drawConceptMap(pptx, slide, zone, data) {
  const centre = data.centre != null ? String(data.centre) : '';
  const spokes = Array.isArray(data.spokes) ? data.spokes.slice(0, 6) : [];

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = Math.max(1.0, zone.w - 2 * PAD);
  const innerH = Math.max(1.0, zone.h - 2 * PAD);

  const minDim = Math.min(innerW, innerH);

  const centreW = minDim * CENTRE_W_RATIO;
  const centreH = minDim * CENTRE_H_RATIO;
  const centreCX = innerX + innerW / 2;
  const centreCY = innerY + innerH / 2;

  const spokeW = minDim * SPOKE_W_RATIO;
  const spokeH = minDim * SPOKE_H_RATIO;
  const radius = minDim * RADIUS_RATIO;

  const n = spokes.length;
  if (n === 0) {
    drawNode(pptx, slide, centreCX, centreCY, centreW, centreH,
             CENTRE_FILL, CENTRE_LINE, CENTRE_TEXT_CLR, CENTRE_FONT, centre);
    return;
  }

  // Compute spoke positions on a circle. Start at top (-90°) and go clockwise.
  const positions = [];
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const cx = centreCX + radius * Math.cos(angle);
    const cy = centreCY + radius * Math.sin(angle);
    positions.push({ cx, cy, angle });
  }

  // Draw connecting lines first so the nodes render on top
  positions.forEach(function (p) {
    drawSpokeLine(pptx, slide, centreCX, centreCY, p.cx, p.cy);
  });

  // Centre node on top of the lines
  drawNode(pptx, slide, centreCX, centreCY, centreW, centreH,
           CENTRE_FILL, CENTRE_LINE, CENTRE_TEXT_CLR, CENTRE_FONT, centre);

  // Spoke nodes + relationship labels
  positions.forEach(function (p, i) {
    const spoke = spokes[i] || {};
    const label = spoke.label != null ? String(spoke.label) : '';
    drawNode(pptx, slide, p.cx, p.cy, spokeW, spokeH,
             SPOKE_FILL, SPOKE_LINE, SPOKE_TEXT_CLR, SPOKE_FONT, label);

    if (spoke.relationship) {
      const midX = (centreCX + p.cx) / 2;
      const midY = (centreCY + p.cy) / 2;
      // White-filled rectangle behind the label so the connecting line
      // doesn't cross the text — keeps blue text readable on the line.
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: midX - REL_LABEL_W / 2, y: midY - REL_LABEL_H / 2,
        w: REL_LABEL_W, h: REL_LABEL_H,
        fill: { color: REL_LABEL_FILL },
        line: { color: REL_LABEL_FILL, width: 0 }
      });
      slide.addText(String(spoke.relationship), {
        x: midX - REL_LABEL_W / 2, y: midY - REL_LABEL_H / 2,
        w: REL_LABEL_W, h: REL_LABEL_H,
        fontFace: FONT, fontSize: REL_LABEL_FONT, bold: true, italic: true,
        color: REL_LABEL_CLR,
        align: 'center', valign: 'middle', margin: 0,
        fit: FIT
      });
    }
  });
}

function drawNode(pptx, slide, cx, cy, w, h, fill, lineColour, textColour, font, label) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cx - w / 2, y: cy - h / 2, w: w, h: h,
    fill: { color: fill },
    line: { color: lineColour, width: SPOKE_LINE_W },
    rectRadius: 0.08
  });
  if (label) {
    slide.addText(label, {
      x: cx - w / 2 + 0.04, y: cy - h / 2 + 0.04,
      w: w - 0.08, h: h - 0.08,
      fontFace: FONT, fontSize: font, bold: true,
      color: textColour,
      align: 'center', valign: 'middle', margin: 0,
      fit: FIT
    });
  }
}

// Straight line from (x1,y1) to (x2,y2). pptxgenjs LINE defaults to
// top-left→bottom-right; flipH/flipV mirror it for the other quadrants.
function drawSpokeLine(pptx, slide, x1, y1, x2, y2) {
  const dx    = x2 - x1;
  const dy    = y2 - y1;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (absDx < 0.001 && absDy < 0.001) return;

  if (absDx < 0.001) {
    slide.addShape(pptx.shapes.LINE, {
      x: x1, y: Math.min(y1, y2), w: 0.001, h: absDy,
      line: { color: LINE_COLOUR, width: LINE_THICK_PT }
    });
  } else if (absDy < 0.001) {
    slide.addShape(pptx.shapes.LINE, {
      x: Math.min(x1, x2), y: y1, w: absDx, h: 0.001,
      line: { color: LINE_COLOUR, width: LINE_THICK_PT }
    });
  } else if (dx > 0 && dy > 0) {
    slide.addShape(pptx.shapes.LINE, {
      x: x1, y: y1, w: dx, h: dy,
      line: { color: LINE_COLOUR, width: LINE_THICK_PT }
    });
  } else if (dx > 0 && dy < 0) {
    slide.addShape(pptx.shapes.LINE, {
      x: x1, y: y2, w: dx, h: absDy, flipV: true,
      line: { color: LINE_COLOUR, width: LINE_THICK_PT }
    });
  } else if (dx < 0 && dy > 0) {
    slide.addShape(pptx.shapes.LINE, {
      x: x2, y: y1, w: absDx, h: dy, flipH: true,
      line: { color: LINE_COLOUR, width: LINE_THICK_PT }
    });
  } else {
    slide.addShape(pptx.shapes.LINE, {
      x: x2, y: y2, w: absDx, h: absDy,
      line: { color: LINE_COLOUR, width: LINE_THICK_PT }
    });
  }
}

module.exports = { drawConceptMap };
