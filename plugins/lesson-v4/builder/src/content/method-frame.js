'use strict';

// A METHOD FRAME for a taught mental strategy: an ordered list of labelled
// lines, each line a short method label ("First, add:", "Then, adjust:") and a
// line of content in which blanks become write-in boxes. The teacher models
// filling it in live on the board; the same frame is the question the child
// completes on the worksheet. The number and position of blanks is the caller's
// choice, so the same frame can be given fully worked, with one blank, or all
// blank, and a lesson can fade it across a set.
//
// Spec:
//   title   optional heading ("Adjusting strategy") — green, sits above the lines
//   frame   draw the green "method" panel behind the lines (default true)
//   lines   [{ label, content }]
//             label    short method language (blue). Optional.
//             content  a string; a run of 2+ underscores ("___") or a "□"
//                      becomes a bordered write-in box, everything else is text.
//
// This is a laid-out text helper (like steps / vocab), not a rasterised figure,
// so it has no shared SVG module and no pre-render: it draws straight into the
// zone. The matching worksheet renderer (method-frame-question) draws the same
// labelled lines with the same boxes so the child meets one picture on board and
// paper. A FILLED method (no blanks) on the working wall is the existing
// `workedExample` card, not this — a wall card is a reference, never a fill-in.

const { FONT, COLOURS, FIT } = require('../styles');
const { tokenizeWriteInContent } = require('../answer-box');

// ─── CONSTANTS ────────────────────────────────────────────────
const PANEL_PAD       = 0.14;   // inches, inside the frame panel
const BARE_PAD        = 0.06;   // inches, when no frame panel is drawn
const PANEL_FILL      = 'E8F6EE';// pale green — lighter than the SC panel so white boxes pop
const PANEL_LINE      = '00B050';// house green — the "method" identity
const PANEL_LINE_W    = 1.5;    // pt
const PANEL_RADIUS    = 0.08;   // rounded-rect corner radius (inches)

const TITLE_H_FRAC    = 0.22;   // title band as fraction of inner height
const TITLE_H_MAX     = 0.6;    // inches, cap on the title band
const TITLE_GAP       = 0.06;   // inches below the title
const TITLE_FONT      = 24;     // pt ceiling for the title
const TITLE_COLOUR    = '00B050';// green, matches the panel border

const LABEL_FRACTION  = 0.34;   // label column as fraction of inner width
const LABEL_GAP       = 0.08;   // inches between label column and content
const LABEL_COLOUR    = '0070C0';// house blue — method language reads as the discipline's own words

const ROW_GAP_FRAC    = 0.16;   // vertical breathing room per row, as a fraction of row height

const TEXT_FONT_MAX   = 32;     // pt ceiling for content + labels
const TEXT_FONT_MIN   = 12;     // pt floor
const CHAR_W_FACTOR   = 0.66;   // estimated glyph width as a fraction of font size (pt) — biased generous so segments never collide
const SEG_GAP_FACTOR  = 0.10;   // gap between segments as a fraction of font size (pt)
const BOX_W_FACTOR    = 1.55;   // write-in box width as a multiple of font size (pt) — room for 2–3 digits
const BOX_H_FACTOR    = 1.45;   // write-in box height as a multiple of font size (pt)
const BOX_FILL        = 'FFFFFF';
const BOX_LINE        = '444444';
const BOX_LINE_W      = 1.25;   // pt
// ─── END CONSTANTS ────────────────────────────────────────────

// Estimated width (inches) of one line's content at a given font size (pt).
function lineWidth(segs, font, boxW, segGap) {
  let w = 0;
  segs.forEach((seg, i) => {
    if (i > 0) w += segGap;
    if (seg.box) w += boxW;
    else w += Math.max(1, seg.text.length) * (CHAR_W_FACTOR * font) / 72;
  });
  return w;
}

function drawMethodFrame(pptx, slide, zone, data) {
  const lines = Array.isArray(data.lines) ? data.lines : [];
  if (lines.length === 0) return;

  const drawFrame = data.frame !== false;

  if (drawFrame) {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: zone.x, y: zone.y, w: zone.w, h: zone.h,
      fill: { color: PANEL_FILL },
      line: { color: PANEL_LINE, width: PANEL_LINE_W },
      rectRadius: PANEL_RADIUS
    });
  }

  const pad = drawFrame ? PANEL_PAD : BARE_PAD;
  const innerX = zone.x + pad;
  let   innerY = zone.y + pad;
  const innerW = zone.w - 2 * pad;
  let   innerH = zone.h - 2 * pad;

  // Optional title sits above the lines and takes only the room it needs.
  if (data.title) {
    const titleH = Math.min(TITLE_H_MAX, innerH * TITLE_H_FRAC);
    slide.addText(String(data.title), {
      x: innerX, y: innerY, w: innerW, h: titleH,
      fontFace: FONT, fontSize: TITLE_FONT, bold: true,
      color: TITLE_COLOUR, align: 'left', valign: 'middle', margin: 0, fit: FIT
    });
    innerY += titleH + TITLE_GAP;
    innerH -= titleH + TITLE_GAP;
  }

  const hasLabels = lines.some((l) => l && String(l.label || '').trim().length > 0);
  const labelW = hasLabels ? innerW * LABEL_FRACTION : 0;
  const contentX = innerX + (hasLabels ? labelW + LABEL_GAP : 0);
  const contentW = innerW - (hasLabels ? labelW + LABEL_GAP : 0);

  const tokenized = lines.map((l) => ({
    label: String((l && l.label) || ''),
    segs: tokenizeWriteInContent(l && l.content)
  }));

  const rowH = innerH / lines.length;

  // Font sizing — fill the zone. Start from the largest font the row height can
  // hold (the box must fit the row), then shrink only if the widest line would
  // overflow the content width, so a thin frame and a wide frame each grow to
  // the space they are given rather than floating small in it.
  const rowCapFont = Math.floor((rowH * (1 - 2 * ROW_GAP_FRAC)) * 72 / BOX_H_FACTOR);
  let font = Math.max(TEXT_FONT_MIN, Math.min(TEXT_FONT_MAX, rowCapFont));
  while (font > TEXT_FONT_MIN) {
    const boxW = (BOX_W_FACTOR * font) / 72;
    const segGap = (SEG_GAP_FACTOR * font) / 72;
    const widest = tokenized.reduce((m, t) => Math.max(m, lineWidth(t.segs, font, boxW, segGap)), 0);
    if (widest <= contentW) break;
    font -= 1;
  }

  const boxW = (BOX_W_FACTOR * font) / 72;
  const boxH = (BOX_H_FACTOR * font) / 72;
  const segGap = (SEG_GAP_FACTOR * font) / 72;

  tokenized.forEach((t, i) => {
    const rowY = innerY + i * rowH;
    const midY = rowY + rowH / 2;

    if (hasLabels && t.label.trim()) {
      slide.addText(t.label, {
        x: innerX, y: rowY, w: labelW, h: rowH,
        fontFace: FONT, fontSize: font, bold: true,
        color: LABEL_COLOUR, align: 'left', valign: 'middle', margin: 0, fit: FIT
      });
    }

    let cx = contentX;
    t.segs.forEach((seg) => {
      if (seg.box) {
        slide.addShape(pptx.shapes.RECTANGLE, {
          x: cx, y: midY - boxH / 2, w: boxW, h: boxH,
          fill: { color: BOX_FILL },
          line: { color: BOX_LINE, width: BOX_LINE_W }
        });
        cx += boxW + segGap;
      } else {
        const w = Math.max(1, seg.text.length) * (CHAR_W_FACTOR * font) / 72;
        slide.addText(seg.text, {
          x: cx, y: rowY, w, h: rowH,
          fontFace: FONT, fontSize: font, bold: true,
          color: COLOURS.body, align: 'left', valign: 'middle', margin: 0, fit: FIT
        });
        cx += w + segGap;
      }
    });
  });
}

module.exports = { drawMethodFrame };
