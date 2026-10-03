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
const LABEL_LINE_FACTOR = 1.2;  // a wrapped label's line height as a multiple of font size
const WRAP_MIN_GAIN   = 3;      // pt a two-line label must gain over one line to be used

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

// The working a line shows before its answer (`3 + 1 + 2 =` ahead of a box)
// and the answer itself (the box, or `6` once filled in). On an answer slide
// the answer carries the deck's reveal marker (`1 + 1 + 4 = ||6`, `||yes`),
// so it prints in answer green like every other answer on the board; the
// marker also says where the working ends. Without a box or a marker, a
// line's text up to its last `=` is working and the rest is the answer, so a
// filled frame keeps its answers in the same column as a blank one's boxes.
function splitLead(segs) {
  const only = segs.length === 1 && !segs[0].box ? String(segs[0].text) : null;
  const marker = only ? only.indexOf('||') : -1;
  if (marker !== -1) {
    const work = only.slice(0, marker).trim();
    return {
      lead: work ? [{ text: work }] : [],
      tail: [{ text: only.slice(marker + 2).trim(), answer: true }]
    };
  }
  let cut = segs.findIndex((seg) => seg.box);
  if (cut === -1) {
    const text = only;
    const eq = text ? text.lastIndexOf('=') : -1;
    if (eq > 0 && text.slice(eq + 1).trim()) {
      return {
        lead: [{ text: text.slice(0, eq + 1).trim() }],
        tail: [{ text: text.slice(eq + 1).trim() }]
      };
    }
    cut = 0;
  }
  return { lead: segs.slice(0, cut), tail: segs.slice(cut) };
}

// A label that fits within `cap` stays whole. One that does not is split at
// the space that makes its two lines most even, so a question never ends with
// one word left alone on the second line (`Is 51 divisible by` / `6?`). A label
// no two-line split brings within the cap comes back as three lines, which
// fails the size. Infinity leaves every label whole.
function wrapLabel(label, font, cap, textBoxWidthIn) {
  const width = (text) => textBoxWidthIn(text, font, true);
  if (!Number.isFinite(cap) || width(label) <= cap) return [label];
  const words = label.split(/\s+/);
  let best = null;
  for (let i = 1; i < words.length; i += 1) {
    const lines = [words.slice(0, i).join(' '), words.slice(i).join(' ')];
    const widest = Math.max(width(lines[0]), width(lines[1]));
    if (widest <= cap && (!best || widest < best.widest)) best = { lines, widest };
  }
  return best ? best.lines : [label, '', ''];
}

// Each step is one line: an optional small step number, the label, then the
// content with its write-in boxes, and the purple panel hugs the lines.
//
// The labels used to sit in a column a third of the frame wide whatever they
// said, so "Two numbers that make 10:" wrapped over four lines and the panel
// ran the full height of its zone with big empty purple areas around two rows
// of boxes (a Year 4 maths My Turn, six slides running, 29 September 2026). The
// label column is now as wide as the longest label at the chosen size, a label
// takes a second line only when that prints the frame clearly bigger, and the
// panel is only as big as its lines, centred in the zone. A
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
  const tokenized = lines.map((l, i) => {
    const segs = tokenizeWriteInContent(l && l.content);
    return {
      label: String((l && l.label) || ''),
      step: l && Number.isFinite(l.step) ? l.step : i + 1,
      segs,
      ...splitLead(segs)
    };
  });

  // `cap` is the widest a label may run before it wraps onto a second line;
  // Infinity keeps every label on one line. A label that would need a third
  // line makes the size fail rather than grow a tall narrow column.
  const measure = (font, cap) => {
    const boxW = (BOX_W_FACTOR * font) / 72;
    const boxH = (BOX_H_FACTOR * font) / 72;
    const segGap = (SEG_GAP_FACTOR * font) / 72;
    const stepD = numbered ? (STEP_D_FACTOR * font) / 72 : 0;
    const stepW = numbered ? stepD + STEP_GAP : 0;
    const labelGap = hasLabels ? LABEL_GAP + segGap : 0;
    const lineH = (LABEL_LINE_FACTOR * font) / 72;
    const padH = boxH * 2 * ROW_GAP_FRAC;
    // Each line's working runs straight on from its own label, and only the
    // answer column lines up: the boxes start where the widest label-plus-
    // working ends. A short label's working fills the room beside it instead
    // of taking a column of its own past the longest label.
    let fits = true;
    const rows = tokenized.map((t) => {
      const labelLines = hasLabels && t.label.trim() ? wrapLabel(t.label.trim(), font, cap, textBoxWidthIn) : [];
      const labelW = labelLines.reduce((m, l) => Math.max(m, textBoxWidthIn(l, font, true)), 0);
      const leadW = t.lead.length ? lineWidth(t.lead, font, boxW, segGap) + segGap : 0;
      // When a line's working, not its label, makes it the long one
      // (`Add the digits: 5 + 4 + 6 + 3 =`), the working drops onto a second
      // line under its label, so a long sum no longer holds the frame small.
      const stacked = Number.isFinite(cap) && labelLines.length === 1 && leadW > 0 &&
        labelW + labelGap + leadW > cap && leadW <= cap;
      const lineCount = labelLines.length + (stacked ? 1 : 0);
      if (lineCount > 2) fits = false;
      const extent = stacked
        ? Math.max(labelW + labelGap, leadW)
        : labelW + (labelW ? labelGap : 0) + leadW;
      const rowH = Math.max(boxH, lineCount * lineH) + padH;
      return { labelLines, labelW, leadW, rowH, stacked, extent };
    });
    const answerX = rows.reduce((m, r) => Math.max(m, r.extent), 0);
    const tailW = tokenized.reduce((m, t) => Math.max(m, lineWidth(t.tail, font, boxW, segGap)), 0);
    return {
      font, boxW, boxH, segGap, stepD, stepW, labelGap, rows, answerX, tailW, fits,
      w: stepW + answerX + tailW,
      h: rows.reduce((s, r) => s + r.rowH, 0)
    };
  };
  const fitsZone = (trial) => trial.fits && trial.w <= maxInnerW && trial.h <= maxInnerH;

  // The largest size at which every line fits the width and the rows fit the
  // height, never below the floor, first with every label on one line.
  // Frames side by side in a row share one size, the smallest any of them
  // needs (row.js sets the ceiling), so two answers never sit at two sizes.
  const fontMax = Math.max(TEXT_FONT_MIN, Math.min(TEXT_FONT_MAX, zone.methodFrameFontMax || TEXT_FONT_MAX));
  let m = measure(TEXT_FONT_MIN, Infinity);
  for (let font = fontMax; font >= TEXT_FONT_MIN; font -= 1) {
    const trial = measure(font, Infinity);
    if (fitsZone(trial)) { m = trial; break; }
  }
  // Then the long labels may wrap onto a second line, kept only when that
  // reads at least 3pt bigger (the teacher's choice, 2 October 2026, after
  // seeing both: "B is way better"). One line for every label was the rule
  // because a label column a third of the frame wide once wrapped `Two numbers
  // that make 10:` over four lines and left the panel mostly empty purple (29
  // September 2026); two lines at most, split evenly, and the panel still
  // hugging its lines keeps that from coming back.
  if (hasLabels) {
    for (let font = fontMax; font >= m.font + WRAP_MIN_GAIN; font -= 1) {
      const widest = measure(font, Infinity).answerX;
      let found = null;
      for (let f = 0.95; f >= 0.45 && !found; f -= 0.05) {
        const trial = measure(font, widest * f);
        if (fitsZone(trial)) found = trial;
      }
      if (found) { m = found; break; }
    }
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

  let rowY = innerY;
  tokenized.forEach((t, i) => {
    const row = m.rows[i];
    const rowH = row.rowH;
    const midY = rowY + rowH / 2;

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

    // A stacked line is its label over its working, the pair centred in the
    // row; otherwise the label fills the row's height.
    const lineH = (LABEL_LINE_FACTOR * font) / 72;
    const labelY = row.stacked ? midY - lineH : rowY;
    const labelH = row.stacked ? lineH : rowH;
    if (row.labelLines.length) {
      // The break is chosen here and written in, so PowerPoint never wraps it
      // somewhere else.
      slide.addText(row.labelLines.join('\n'), {
        x: labelX, y: labelY, w: row.labelW, h: labelH,
        fontFace: FONT, fontSize: font, bold: true,
        color: LABEL_COLOUR, align: 'left', valign: 'middle', margin: 0, fit: FIT, wrap: false
      });
    }

    let cx = row.stacked ? labelX : labelX + row.labelW + (row.labelW ? m.labelGap : 0);
    [...t.lead, ...t.tail].forEach((seg, j) => {
      if (j === t.lead.length) cx = labelX + m.answerX;
      // On a stacked line the answer sits on the working's line, beside it.
      const segY = row.stacked ? midY : rowY;
      const segH = row.stacked ? lineH : rowH;
      const boxMid = row.stacked ? midY + lineH / 2 : midY;
      if (seg.box) {
        slide.addShape(pptx.shapes.RECTANGLE, {
          x: cx, y: boxMid - m.boxH / 2, w: m.boxW, h: m.boxH,
          fill: { color: BOX_FILL },
          line: { color: BOX_LINE, width: BOX_LINE_W }
        });
        cx += m.boxW + m.segGap;
      } else {
        const w = segTextW(seg.text, font);
        slide.addText(seg.text, {
          x: cx, y: segY, w, h: segH,
          fontFace: FONT, fontSize: font, bold: true,
          color: seg.answer ? COLOURS.green : COLOURS.body, align: 'left', valign: 'middle', margin: 0, fit: FIT
        });
        cx += w + m.segGap;
      }
    });
    rowY += rowH;
  });
  return m.font;
}

// The size a frame would print at in this zone, found without drawing it, so
// a row of frames can share the smallest.
function methodFrameFont(zone, data) {
  const noop = () => {};
  return drawMethodFrame({ shapes: {} }, { addShape: noop, addText: noop, addImage: noop }, zone, data);
}

module.exports = { drawMethodFrame, methodFrameFont };
