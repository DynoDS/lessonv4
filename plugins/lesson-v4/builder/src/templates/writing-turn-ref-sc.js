'use strict';

const { FONT, FIT } = require('../styles');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');
const { drawQuestions } = require('./maths-turn');
const { drawScPanel } = require('./maths-turn-sc');

// ─── COORDINATES ──────────────────────────────────────────────
// Layout: question strip + large reference panel + SC panel.
// No working-out space — the teacher models off-slide (flipchart /
// visualiser), so the freed room expands the reference panel.
//
// Used whenever the lesson-designer signals `Modelling format:
// off-slide (flipchart/visualiser)` — sentence- and paragraph-level
// writing (where presentation, letter formation and handwriting are
// part of what is being taught and look poor on an interactive
// whiteboard), and equally a maths calculation, column method,
// partition or conversion the teacher builds up a line at a time on
// the flipchart rather than annotating on the slide. Despite the
// filename, this is the general off-slide template, not a
// writing-only one; see `references/modelling-formats.md`.
//
// REF zone height = 5.20 (= maths-turn-ref-sc's REF 2.40 + WORK 2.70
// + the gap between them, absorbed into one panel). Q strip and SC
// panel are identical to maths-turn-ref-sc.

const Q_X             = 0.22;
const Q_Y             = 0.75;
const Q_W             = 7.99;
const Q_H             = 1.20;

const REF_X           = 0.22;
const REF_Y           = 2.05;
const REF_W           = 7.99;
const REF_H           = 5.20;
const REF_PAD         = 0.10;
const REF_LABEL_H     = 0.36;
const REF_BG          = 'EAF2F8';
const REF_LINE        = '5DADE2';
const REF_LINE_W      = 1.0;
const REF_RADIUS      = 0.06;
const REF_LABEL_FONT  = 16;
const REF_LABEL_COLOR = '21618C';
// ─── END COORDINATES ──────────────────────────────────────────

function drawWritingTurnRefSc(pptx, slide, data, ctx) {
  const titleOverride = data.title || 'My Turn';
  drawHeader(slide, {
    headerStyle: 'title',
    title: titleOverride,
    instruction: data.instruction,
    signal: data.signal
  }, ctx);

  const questions = Array.isArray(data.questions) ? data.questions : [];
  drawQuestions(slide, questions, { x: Q_X, y: Q_Y, w: Q_W, h: Q_H }, pptx, ctx, {
    questionNumbering: data.questionNumbering
  });

  drawReferencePanel(pptx, slide, data, ctx);

  drawScPanel(pptx, slide, data, ctx);
}

function drawReferencePanel(pptx, slide, data, ctx) {
  const hasLabel = !!data.referenceLabel;

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: REF_X, y: REF_Y, w: REF_W, h: REF_H,
    fill: { color: REF_BG },
    line: { color: REF_LINE, width: REF_LINE_W },
    rectRadius: REF_RADIUS
  });

  if (hasLabel) {
    slide.addText(data.referenceLabel, {
      x: REF_X + REF_PAD, y: REF_Y + REF_PAD,
      w: REF_W - 2 * REF_PAD, h: REF_LABEL_H,
      fontFace: FONT, fontSize: REF_LABEL_FONT, bold: true,
      color: REF_LABEL_COLOR, align: 'left', valign: 'middle',
      margin: 0, fit: FIT
    });
  }

  if (data.reference) {
    const labelOffset = hasLabel ? REF_LABEL_H : 0;
    const contentZone = {
      x: REF_X + REF_PAD,
      y: REF_Y + REF_PAD + labelOffset,
      w: REF_W - 2 * REF_PAD,
      h: REF_H - 2 * REF_PAD - labelOffset,
      class: 'B',
      noCard: true // the reference panel is this zone's surface
    };
    drawContent(pptx, slide, contentZone, data.reference, ctx);
  }
}

module.exports = { drawWritingTurnRefSc };
