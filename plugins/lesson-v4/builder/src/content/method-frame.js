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
//   title   optional heading ("Adjusting strategy") — purple, sits above the lines
//   frame   draw the purple "method" panel behind the lines (default true)
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
// A worked example is purple, the same colour as a sticky fact (the teacher's
// rule of 24 September 2026: green is kept for a taught word or an answer).
const PANEL_FILL      = COLOURS.workedBg;// pale purple, light enough that white boxes pop
const PANEL_LINE      = COLOURS.worked;  // the worked-example purple, the "method" identity
const PANEL_LINE_W    = 1.5;    // pt
const PANEL_RADIUS    = 0.08;   // rounded-rect corner radius (inches)

const TITLE_H_FRAC    = 0.22;   // title band as fraction of inner height
const TITLE_H_MAX     = 0.6;    // inches, cap on the title band
const TITLE_GAP       = 0.06;   // inches below the title
const TITLE_FONT      = 24;     // pt ceiling for the title
const TITLE_COLOUR    = COLOURS.worked;  // purple, matches the panel border

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

// The width of a piece of content text, measured with the deck's Comic Sans
// widths plus a little room, so a frame is sized to its real words.
function segTextW(text, font) {
  const { textBoxWidthIn } = require('../glyph-width');
  return textBoxWidthIn(String(text || ' '), font, true) + 0.04;
}

// Estimated width (inches) of one line's content at a given font size (pt).
function lineWidth(segs, font, boxW, segGap) {
  let w = 0;
  segs.forEach((seg, i) => {
    if (i > 0) w += segGap;
    if (seg.box) w += boxW;
    else w += segTextW(seg.text, font);
  });
  return w;
}

// Each step is one line: an optional small step number, the label, then the
// content with its write-in boxes, and the purple panel hugs the lines.
//
// The labels used to sit in a column a third of the frame wide whatever they
// said, so "Two numbers that make 10:" wrapped over four lines and the panel
// ran the full height of its zone with big empty purple areas around two rows
// of boxes (a Year 4 maths My Turn, six slides running, 29 September 2026). The
// label column is now as wide as the longest label at the chosen size, every
// label stays on one line, the size is the largest at which every line fits the
// width, and the panel is only as big as its lines, centred in the zone. A
// step number (`step` on a line, or `numbered: true` for 1, 2, 3...) prints in
// a small green circle like the success criteria's, so step 1 of the frame is
// criterion 1 of the panel beside it.
const STEP_FILL       = '00B050';
const STEP_D_FACTOR   = 1.15;   // step circle diameter as a multiple of font size
const STEP_GAP        = 0.12;   // inches between the step circle and the label

function drawMethodFrame(pptx, slide, zone, data) {
  const { textBoxWidthIn } = require('../glyph-width');
  const lines = Array.isArray(data.lines) ? data.lines : [];
  if (lines.length === 0) return;

  const drawFrame = data.frame !== false;
  const pad = drawFrame ? PANEL_PAD : BARE_PAD;
  const maxInnerW = zone.w - 2 * pad;
  let maxInnerH = zone.h - 2 * pad;
  const titleH = data.title ? Math.min(TITLE_H_MAX, maxInnerH * TITLE_H_FRAC) : 0;
  if (data.title) maxInnerH -= titleH + TITLE_GAP;

  const hasLabels = lines.some((l) => l && String(l.label || '').trim().length > 0);
  const numbered = data.numbered === true || lines.some((l) => l && Number.isFinite(l.step));
  const tokenized = lines.map((l, i) => ({
    label: String((l && l.label) || ''),
    step: l && Number.isFinite(l.step) ? l.step : i + 1,
    segs: tokenizeWriteInContent(l && l.content)
  }));

  const measure = (font) => {
    const boxW = (BOX_W_FACTOR * font) / 72;
    const boxH = (BOX_H_FACTOR * font) / 72;
    const segGap = (SEG_GAP_FACTOR * font) / 72;
    const stepD = numbered ? (STEP_D_FACTOR * font) / 72 : 0;
    const stepW = numbered ? stepD + STEP_GAP : 0;
    const labelW = hasLabels
      ? tokenized.reduce((m, t) => Math.max(m, t.label.trim() ? textBoxWidthIn(t.label, font, true) : 0), 0)
      : 0;
    const labelGap = hasLabels ? LABEL_GAP + segGap : 0;
    const contentW = tokenized.reduce((m, t) => Math.max(m, lineWidth(t.segs, font, boxW, segGap)), 0);
    const rowH = boxH * (1 + 2 * ROW_GAP_FRAC);
    return {
      font, boxW, boxH, segGap, stepD, stepW, labelW, labelGap, contentW, rowH,
      w: stepW + labelW + labelGap + contentW,
      h: rowH * tokenized.length
    };
  };

  // The largest size at which every line fits the width and the rows fit the
  // height, never below the floor.
  let m = measure(TEXT_FONT_MIN);
  for (let font = TEXT_FONT_MAX; font >= TEXT_FONT_MIN; font -= 1) {
    const trial = measure(font);
    if (trial.w <= maxInnerW && trial.h <= maxInnerH) { m = trial; break; }
  }

  const innerW = Math.min(maxInnerW, m.w);
  const titleW = data.title ? Math.min(maxInnerW, Math.max(innerW, textBoxWidthIn(String(data.title), TITLE_FONT, true))) : 0;
  const panelInnerW = Math.max(innerW, titleW);
  const panelW = panelInnerW + 2 * pad;
  const panelH = (data.title ? titleH + TITLE_GAP : 0) + m.h + 2 * pad;
  const panelX = zone.x + Math.max(0, (zone.w - panelW) / 2);
  const panelY = zone.y + Math.max(0, (zone.h - panelH) / 2);

  if (drawFrame) {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: panelX, y: panelY, w: panelW, h: panelH,
      fill: { color: PANEL_FILL },
      line: { color: PANEL_LINE, width: PANEL_LINE_W },
      rectRadius: PANEL_RADIUS
    });
  }

  let innerY = panelY + pad;
  const innerX = panelX + pad + (panelInnerW - innerW) / 2;
  if (data.title) {
    slide.addText(String(data.title), {
      x: panelX + pad, y: innerY, w: panelInnerW, h: titleH,
      fontFace: FONT, fontSize: TITLE_FONT, bold: true,
      color: TITLE_COLOUR, align: 'left', valign: 'middle', margin: 0, fit: FIT
    });
    innerY += titleH + TITLE_GAP;
  }

  const font = m.font;
  const labelX = innerX + m.stepW;
  const contentX = labelX + m.labelW + m.labelGap;

  tokenized.forEach((t, i) => {
    const rowY = innerY + i * m.rowH;
    const midY = rowY + m.rowH / 2;

    if (numbered) {
      slide.addShape(pptx.shapes.OVAL, {
        x: innerX, y: midY - m.stepD / 2, w: m.stepD, h: m.stepD,
        fill: { color: STEP_FILL }, line: { type: 'none' }
      });
      slide.addText(String(t.step), {
        x: innerX, y: midY - m.stepD / 2, w: m.stepD, h: m.stepD,
        fontFace: FONT, fontSize: Math.max(10, Math.round(font * 0.62)), bold: true,
        color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0
      });
    }

    if (hasLabels && t.label.trim()) {
      slide.addText(t.label, {
        x: labelX, y: rowY, w: m.labelW, h: m.rowH,
        fontFace: FONT, fontSize: font, bold: true,
        color: LABEL_COLOUR, align: 'left', valign: 'middle', margin: 0, fit: FIT, wrap: false
      });
    }

    let cx = contentX;
    t.segs.forEach((seg) => {
      if (seg.box) {
        slide.addShape(pptx.shapes.RECTANGLE, {
          x: cx, y: midY - m.boxH / 2, w: m.boxW, h: m.boxH,
          fill: { color: BOX_FILL },
          line: { color: BOX_LINE, width: BOX_LINE_W }
        });
        cx += m.boxW + m.segGap;
      } else {
        const w = segTextW(seg.text, font);
        slide.addText(seg.text, {
          x: cx, y: rowY, w, h: m.rowH,
          fontFace: FONT, fontSize: font, bold: true,
          color: COLOURS.body, align: 'left', valign: 'middle', margin: 0, fit: FIT
        });
        cx += w + m.segGap;
      }
    });
  });
}

module.exports = { drawMethodFrame };
