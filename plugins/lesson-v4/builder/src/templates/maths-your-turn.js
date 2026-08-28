'use strict';

const { FONT, COLOURS, SIZE_CEILINGS, FIT } = require('../styles');
const { drawHeader } = require('../headers');
const { splitAnswerRuns } = require('../answer-text');

// ─── COORDINATES ──────────────────────────────────────────────
const CARDS_X        = 0.22;
const CARDS_Y        = 0.75;
const CARDS_W        = 12.89;
const CARDS_H        = 6.50;
const CARD_GAP       = 0.15;
const CARD_PAD       = 0.20;
const CARD_RADIUS    = 0.08;
const CARD_FILL      = 'F2F2F2';
const CARD_LINE      = '0070C0';
const CARD_LINE_W    = 1.5;
const CARD_FONT      = 22;
const LABEL_W        = 0.60;
const VIS_LABEL_W    = 0.50;
const VIS_LABEL_H    = 0.40;
const VIS_LABEL_FONT = 18;
// ─── END COORDINATES ──────────────────────────────────────────

function stripLeadingLabel(text) {
  return String(text).replace(/^\(\s*(?:[a-z]|\d+)\s*\)\s*/i, '');
}

function normaliseCircles(text) {
  return text.replace(/○/g, '◯');
}

function isContentObject(q) {
  return q && typeof q === 'object' && typeof q.type === 'string';
}

function drawMathsYourTurn(pptx, slide, data, ctx) {
  const titleOverride = data.title || 'Your Turn';
  drawHeader(slide, {
    headerStyle: 'title',
    title: titleOverride,
    instruction: data.instruction,
    signal: data.signal
  }, ctx);

  const questions = Array.isArray(data.questions) ? data.questions : [];
  drawQuestionCards(pptx, slide, questions, {
    x: CARDS_X, y: CARDS_Y, w: CARDS_W, h: CARDS_H
  }, ctx, firstLabel(data));
}

// Independent practice numbers, and the numbering runs on across the slides
// that follow rather than restarting on each one, so no two questions in a
// lesson wear the same label (Question Labelling in references/preferences.md).
// `startAt` is what carries it: the first independent slide omits it, and each
// later one sets it to the number after the previous slide's last question.
function firstLabel(data) {
  const n = Number(data.startAt);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function drawQuestionCards(pptx, slide, questions, box, ctx, startAt) {
  if (questions.length === 0) return;

  // Callers pass firstLabel(data); this guard is the backstop so a missed or
  // bad argument degrades to numbering from 1, never to "(NaN)" on a child's
  // slide.
  const startN = Number(startAt);
  startAt = Number.isFinite(startN) && startN >= 1 ? Math.floor(startN) : 1;

  // Visual content objects (e.g. clocks) use a grid layout — tall vertical
  // cards give each visual too little height to be readable.
  if (questions.some(isContentObject)) {
    return drawVisualGrid(pptx, slide, questions, box, ctx, startAt);
  }

  const totalGap = CARD_GAP * (questions.length - 1);
  const cardH    = (box.h - totalGap) / questions.length;

  questions.forEach(function (q, i) {
    const cardY = box.y + i * (cardH + CARD_GAP);
    const label = '(' + (startAt + i) + ')';

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: box.x, y: cardY, w: box.w, h: cardH,
      fill: { color: CARD_FILL },
      line: { color: CARD_LINE, width: CARD_LINE_W },
      rectRadius: CARD_RADIUS
    });

    slide.addText(label, {
      x: box.x + CARD_PAD, y: cardY,
      w: LABEL_W, h: cardH,
      fontFace: FONT, fontSize: CARD_FONT, bold: true,
      color: COLOURS.title, align: 'left', valign: 'middle',
      margin: 0, fit: FIT
    });

    const text = normaliseCircles(stripLeadingLabel(String(q)));
    slide.addText(splitAnswerRuns(text, true), {
      x: box.x + CARD_PAD + LABEL_W, y: cardY,
      w: box.w - 2 * CARD_PAD - LABEL_W, h: cardH,
      fontFace: FONT, fontSize: CARD_FONT, bold: true,
      color: COLOURS.body, align: 'left', valign: 'middle',
      margin: 0, fit: FIT
    });
  });
}

// Grid layout for visual content questions (clocks, diagrams, etc.).
// Uses 2 columns for 4+ items so each cell is tall enough to show the visual clearly.
function drawVisualGrid(pptx, slide, questions, box, ctx, startAt) {
  const { drawContent } = require('../content');
  const count = questions.length;
  const cols  = count <= 3 ? count : 2;
  const rows  = Math.ceil(count / cols);
  const cellW = (box.w - CARD_GAP * (cols - 1)) / cols;
  const cellH = (box.h - CARD_GAP * (rows - 1)) / rows;

  questions.forEach(function (q, i) {
    const col   = i % cols;
    const row   = Math.floor(i / cols);
    const cellX = box.x + col * (cellW + CARD_GAP);
    const cellY = box.y + row * (cellH + CARD_GAP);
    const badge = '(' + (startAt + i) + ')';

    slide.addText(badge, {
      x: cellX, y: cellY,
      w: VIS_LABEL_W, h: VIS_LABEL_H,
      fontFace: FONT, fontSize: VIS_LABEL_FONT, bold: true,
      color: COLOURS.title, align: 'left', valign: 'middle',
      margin: 0, objectName: 'NOFIT_yt-badge'
    });

    const zone = { x: cellX, y: cellY, w: cellW, h: cellH, noCard: true }; // inside the question card
    if (isContentObject(q)) {
      drawContent(pptx, slide, zone, q, ctx);
    } else {
      const text = normaliseCircles(stripLeadingLabel(String(q)));
      slide.addText(splitAnswerRuns(text, true), {
        x: cellX + CARD_PAD, y: cellY,
        w: cellW - 2 * CARD_PAD, h: cellH,
        fontFace: FONT, fontSize: CARD_FONT, bold: true,
        color: COLOURS.body, align: 'center', valign: 'middle',
        margin: 0, fit: FIT
      });
    }
  });
}

module.exports = { drawMathsYourTurn, drawQuestionCards, firstLabel };
