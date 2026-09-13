'use strict';

const { FONT, COLOURS, FIT, MIN_FONT_PT } = require('../styles');
const { wrappedLineCount, textBoxWidthIn } = require('../glyph-width');

// ─── CONSTANTS ────────────────────────────────────────────────
// A radial concept map: one central node, 2–6 spoke nodes around it,
// each spoke connected to the centre by a line with an optional
// relationship label sitting on the line.
const PAD              = 0.10;
const CENTRE_FILL      = '0070C0';
const CENTRE_LINE      = '0070C0';
const CENTRE_TEXT_CLR  = 'FFFFFF';
// Fonts were 18/14/13 in boxes sized as fixed shares of the zone, under the
// 18pt floor every helper has taken since 4.2.128 (10 September 2026), so
// "controlled by rulers" could not be drawn and the helper's own example had
// not built since. Every box is now measured from its words, and the spokes
// sit on an ellipse that uses the zone's full width instead of a circle sized
// by its short side.
const CENTRE_FONT      = Math.max(22, MIN_FONT_PT);
const SPOKE_FILL       = 'FFFFFF';
const SPOKE_LINE       = 'E46C0A';   // orange, matches teachRight
const SPOKE_LINE_W     = 2;
const SPOKE_TEXT_CLR   = '000000';
const SPOKE_FONT       = Math.max(20, MIN_FONT_PT);
const LINE_THICK_PT    = 2;
const LINE_COLOUR      = '888888';
const REL_LABEL_MAX_W  = 2.40;
const REL_LABEL_FONT   = MIN_FONT_PT;
const NODE_PAD         = 0.10;   // words to border, each side
const NODE_MAX_W       = 2.80;
const LINE_H_PER_PT    = 1.32 / 72 * 1.04;
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

  // A box as wide as its longest word needs (at least its old share of the
  // zone, at most NODE_MAX_W), and as tall as its lines.
  function boxFor(texts, pt, minW, minH) {
    const words = texts.join(' ').split(/\s+/).filter(Boolean);
    const widest = words.reduce(function (w, word) { return Math.max(w, textBoxWidthIn(word, pt, true)); }, 0);
    const natural = texts.reduce(function (w, t) { return Math.max(w, textBoxWidthIn(t, pt, true)); }, 0);
    const w = Math.max(minW, Math.min(NODE_MAX_W, Math.max(widest, Math.min(natural, NODE_MAX_W * 0.9)) + 2 * NODE_PAD));
    const lines = texts.reduce(function (n, t) { return Math.max(n, wrappedLineCount(t, pt, w - 2 * NODE_PAD, true)); }, 1);
    if (!Number.isFinite(lines)) {
      throw new Error(
        'CONCEPT_MAP_WORD_TOO_WIDE: a word in "' + texts.join('", "') + '" is wider than ' + NODE_MAX_W +
          'in at the ' + pt + 'pt readable size. Use a shorter word; nothing was shrunk further.'
      );
    }
    return { w: w, h: Math.max(minH, lines * pt * LINE_H_PER_PT + 2 * NODE_PAD) };
  }

  const centreBox = boxFor([centre], CENTRE_FONT, minDim * CENTRE_W_RATIO, minDim * CENTRE_H_RATIO);
  const centreW = centreBox.w;
  const centreH = centreBox.h;
  const centreCX = innerX + innerW / 2;
  const centreCY = innerY + innerH / 2;

  const spokeLabels = spokes.map(function (sp) { return sp && sp.label != null ? String(sp.label) : ''; });
  const spokeBox = boxFor(spokeLabels.length ? spokeLabels : [''], SPOKE_FONT, minDim * SPOKE_W_RATIO, minDim * SPOKE_H_RATIO);
  const spokeW = spokeBox.w;
  const spokeH = spokeBox.h;
  // The spokes ride an ellipse that keeps every box inside the zone.
  const radiusX = Math.max(0.5, innerW / 2 - spokeW / 2);
  const radiusY = Math.max(0.5, innerH / 2 - spokeH / 2);
  if (innerH < centreH + 2 * spokeH || innerW < centreW + 2 * spokeW) {
    throw new Error(
      'CONCEPT_MAP_ZONE_TOO_SMALL: the centre and spokes need about ' + (centreW + 2 * spokeW).toFixed(2) + 'in by ' +
        (centreH + 2 * spokeH).toFixed(2) + 'in at the readable size and the zone gives ' + innerW.toFixed(2) + 'in by ' +
        innerH.toFixed(2) + 'in. Give it a larger zone, fewer spokes or shorter labels; nothing was shrunk further.'
    );
  }

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
    const cx = centreCX + radiusX * Math.cos(angle);
    const cy = centreCY + radiusY * Math.sin(angle);
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
      const rel = String(spoke.relationship);
      const REL_LABEL_W = Math.min(REL_LABEL_MAX_W, textBoxWidthIn(rel, REL_LABEL_FONT, true) + 0.12);
      const relLines = wrappedLineCount(rel, REL_LABEL_FONT, REL_LABEL_W - 0.12, true);
      const REL_LABEL_H = (Number.isFinite(relLines) ? relLines : 2) * REL_LABEL_FONT * LINE_H_PER_PT + 0.08;
      // White-filled rectangle behind the label so the connecting line
      // doesn't cross the text — keeps blue text readable on the line.
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: midX - REL_LABEL_W / 2, y: midY - REL_LABEL_H / 2,
        w: REL_LABEL_W, h: REL_LABEL_H,
        fill: { color: REL_LABEL_FILL },
        line: { color: REL_LABEL_FILL, width: 0 }
      });
      slide.addText(rel, {
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
      x: cx - w / 2 + NODE_PAD, y: cy - h / 2 + NODE_PAD,
      w: w - 2 * NODE_PAD, h: h - 2 * NODE_PAD,
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
