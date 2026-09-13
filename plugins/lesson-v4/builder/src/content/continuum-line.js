'use strict';

const { FONT, COLOURS, FIT, MIN_FONT_PT } = require('../styles');
const { wrappedLineCount } = require('../glyph-width');

// ─── CONSTANTS ────────────────────────────────────────────────
// A horizontal continuum line for committing to a position on a
// gradient — agree↔disagree, most↔least, never↔always. End labels at
// each end of the line; optional middle label; optional evenly-spaced
// tick marks; optional sub-prompt above the line.
const PAD              = 0.12;
const LINE_THICK       = 0.06;
const LINE_COLOUR      = '000000';
const END_CAP_W        = 0.06;
const END_CAP_H        = 0.30;
const TICK_W           = 0.04;
const TICK_H           = 0.18;
const TICK_COLOUR      = '000000';
// The labels were fixed boxes at 16pt and 14pt (end labels 1.80in wide), under
// the 18pt floor every helper has taken since 4.2.128 (10 September 2026), so
// "Strongly disagree" could not be drawn and the helper's own example had not
// built since. Each end label now takes up to this share of the line's width,
// and every label box is as tall as its wrapped lines.
const ANCHOR_LABEL_SHARE = 0.45;
const ANCHOR_FONT      = Math.max(22, MIN_FONT_PT);
const ANCHOR_GAP       = 0.08;
const MIDDLE_LABEL_SHARE = 0.40;
const MIDDLE_FONT      = Math.max(18, MIN_FONT_PT);
const QUESTION_FONT    = Math.max(22, MIN_FONT_PT);
const QUESTION_GAP     = 0.10;
const LINE_H_PER_PT    = 1.32 / 72 * 1.04;
function labelHeight(text, pt, width) {
  const lines = wrappedLineCount(text, pt, width, true);
  if (!Number.isFinite(lines)) {
    throw new Error(
      `CONTINUUM_LABEL_TOO_WIDE: a word in "${text}" is wider than the ${width.toFixed(2)}in its label ` +
        `can take at the ${pt}pt readable size. Give the line a wider zone or use a shorter word; ` +
        `nothing was shrunk further.`
    );
  }
  return Math.max(1, lines) * pt * LINE_H_PER_PT + 0.04;
}
// ─── END CONSTANTS ────────────────────────────────────────────

function drawContinuumLine(pptx, slide, zone, data) {
  const left     = data.left     != null ? String(data.left)     : 'Disagree';
  const right    = data.right    != null ? String(data.right)    : 'Agree';
  const middle   = data.middle   != null ? String(data.middle)   : null;
  const marks    = (typeof data.marks === 'number' && data.marks > 0) ? Math.min(data.marks, 11) : 0;
  const question = data.question != null ? String(data.question) : null;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = Math.max(1.0, zone.w - 2 * PAD);
  const innerH = Math.max(0.5, zone.h - 2 * PAD);

  // Vertical layout — question at top (optional), then line, then anchor labels
  const anchorW = innerW * ANCHOR_LABEL_SHARE;
  const middleW = innerW * MIDDLE_LABEL_SHARE;
  const ANCHOR_LABEL_H = Math.max(labelHeight(left, ANCHOR_FONT, anchorW), labelHeight(right, ANCHOR_FONT, anchorW));
  const MIDDLE_LABEL_H = middle ? labelHeight(middle, MIDDLE_FONT, middleW) : 0;
  const QUESTION_H = question ? labelHeight(question, QUESTION_FONT, innerW) : 0;
  let cursorY = innerY;
  if (question) {
    slide.addText(question, {
      x: innerX, y: cursorY, w: innerW, h: QUESTION_H,
      fontFace: FONT, fontSize: QUESTION_FONT, bold: true,
      color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0,
      fit: FIT
    });
    cursorY += QUESTION_H + QUESTION_GAP;
  }

  // Reserve room for the anchor labels below the line
  const labelBlockH = ANCHOR_LABEL_H + ANCHOR_GAP + (middle ? MIDDLE_LABEL_H : 0);
  const availableH  = innerH - (cursorY - innerY);
  const lineY       = cursorY + Math.max(0, (availableH - labelBlockH) / 2);

  // The line itself — leave a small inset for end caps
  const lineStartX = innerX + END_CAP_W / 2;
  const lineEndX   = innerX + innerW - END_CAP_W / 2;
  const lineW      = lineEndX - lineStartX;

  slide.addShape(pptx.shapes.RECTANGLE, {
    x: lineStartX, y: lineY - LINE_THICK / 2, w: lineW, h: LINE_THICK,
    fill: { color: LINE_COLOUR }, line: { color: LINE_COLOUR, width: 0 }
  });

  // End caps — short vertical strokes at each end
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: innerX, y: lineY - END_CAP_H / 2, w: END_CAP_W, h: END_CAP_H,
    fill: { color: LINE_COLOUR }, line: { color: LINE_COLOUR, width: 0 }
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: innerX + innerW - END_CAP_W, y: lineY - END_CAP_H / 2, w: END_CAP_W, h: END_CAP_H,
    fill: { color: LINE_COLOUR }, line: { color: LINE_COLOUR, width: 0 }
  });

  // Evenly-spaced ticks between the ends (excluding the ends themselves)
  if (marks > 0) {
    const tickSpacing = lineW / (marks + 1);
    for (let i = 1; i <= marks; i++) {
      const tickX = lineStartX + i * tickSpacing;
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: tickX - TICK_W / 2, y: lineY - TICK_H / 2, w: TICK_W, h: TICK_H,
        fill: { color: TICK_COLOUR }, line: { color: TICK_COLOUR, width: 0 }
      });
    }
  }

  // Anchor labels below the line, flush to the zone edges so they never
  // overflow the slide. Left label is left-aligned at the zone's left edge
  // (so its first character sits under the line's left end); right label
  // is right-aligned at the zone's right edge.
  const labelY = lineY + END_CAP_H / 2 + ANCHOR_GAP;
  slide.addText(left, {
    x: innerX, y: labelY,
    w: anchorW, h: ANCHOR_LABEL_H,
    fontFace: FONT, fontSize: ANCHOR_FONT, bold: true,
    color: COLOURS.body,
    align: 'left', valign: 'top', margin: 0,
    fit: FIT
  });
  slide.addText(right, {
    x: innerX + innerW - anchorW, y: labelY,
    w: anchorW, h: ANCHOR_LABEL_H,
    fontFace: FONT, fontSize: ANCHOR_FONT, bold: true,
    color: COLOURS.body,
    align: 'right', valign: 'top', margin: 0,
    fit: FIT
  });

  // Optional middle label, below the anchors so it doesn't collide
  if (middle) {
    slide.addText(middle, {
      x: innerX + (innerW - middleW) / 2,
      y: labelY + ANCHOR_LABEL_H + ANCHOR_GAP,
      w: middleW, h: MIDDLE_LABEL_H,
      fontFace: FONT, fontSize: MIDDLE_FONT, italic: true,
      color: COLOURS.dim,
      align: 'center', valign: 'top', margin: 0,
      fit: FIT
    });
  }
}

module.exports = { drawContinuumLine };
