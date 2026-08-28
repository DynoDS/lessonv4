'use strict';

const { FONT, COLOURS, SIZE_CEILINGS, FIT, CARD } = require('../styles');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');
const {
  baseColourForRole,
  presentationRuns
} = require('../presentation-text');
const {
  ANSWER_BOX_GAP,
  ANSWER_BOX_EDGE_INSET,
  splitAnswerBoxText,
  answerBoxMetrics,
  drawAnswerBox
} = require('../answer-box');
const {
  PICTURE_GAP,
  itemText,
  resolvePictureSet,
  pictureMetrics,
  drawContentPicture
} = require('../content-picture');

// ─── COORDINATES ──────────────────────────────────────────────
const Q_X              = 0.22;
const Q_Y              = 0.75;
const Q_W              = 12.89;
const Q_H              = 1.65;
const Q_PAD            = 0.10;
const LABEL_W          = 0.55;
const LABEL_GAP        = 0.10;

const WORK_X           = 0.22;
const WORK_Y           = 2.55;
const WORK_W           = 12.89;
const WORK_H           = 4.70;
const WORK_FILL        = 'F2F2F2';
const WORK_LINE        = '000000';
const WORK_LINE_W      = 1.5;
const VISUAL_GAP       = 0.18;

const QUESTION_FONT    = 28;
// ─── END COORDINATES ──────────────────────────────────────────

// Strip a leading "(a)", "(1)" etc. that an author may have typed,
// so the template's own label isn't duplicated.
function stripLeadingLabel(text) {
  return String(text).replace(/^\(\s*(?:[a-z]|\d+)\s*\)\s*/i, '');
}

// Estimate the height the question text actually needs, so the question box can
// shrink to its content instead of floating one line in a tall fixed box. A short
// task then frees vertical room the visual below can grow into; a long task still
// gets the lines it needs. The estimate wraps each question by an average glyph
// width (Comic Sans bold runs wide) and sums the lines — deliberately a touch
// generous so text never clips, since autofit only ever shrinks from here.
function measureQuestionsHeight(questions, boxW, fontSize, options) {
  if (!questions || questions.length === 0) return 0;
  const answerBoxes = options && options.answerBoxes === true;
  const fs = fontSize || QUESTION_FONT;
  // Lettered only for a teacher-led set of two or more: the labels are the
  // teacher's reference points ("we're on (b)"), and a single teacher-led
  // question loses its normal numbering rather than printing a lone "(a)".
  // Independent sets never letter here - their numbering is the child's own.
  const labelThem = options && options.questionNumbering === 'teacher-led'
    && questions.length > 1;
  const glyphW = fs * 0.52 / 72;          // inches per character
  const lineH  = fs / 72 * 1.28;          // inches per line
  const answerMetrics = answerBoxes ? answerBoxMetrics(fs) : null;
  const answerGutterW = answerMetrics ? answerMetrics.w + ANSWER_BOX_GAP : 0;
  const sharedPictureSlotW = options && Number(options.pictureSlotW) > 0
    ? Number(options.pictureSlotW)
    : 0;
  let total = 0;
  questions.forEach(function (q, i) {
    const pictureSlotW = options && Array.isArray(options.pictureSlots)
      ? Math.max(0, Number(options.pictureSlots[i]) || 0)
      : sharedPictureSlotW;
    const raw = stripLeadingLabel(itemText(q));
    const text = answerBoxes
      ? splitAnswerBoxText(raw).text
      : raw.replace(/\s*\|\|.*$/, '');
    const availW = boxW - 2 * Q_PAD - (labelThem ? (LABEL_W + LABEL_GAP) : 0)
      - answerGutterW - pictureSlotW;
    const lines  = Math.max(1, Math.ceil((text.length * glyphW) / Math.max(0.5, availW)));
    total += Math.max(lines * lineH, answerMetrics ? answerMetrics.h : 0);
  });
  return total + 2 * Q_PAD;
}

function drawMathsTurn(pptx, slide, data, ctx) {
  const titleOverride = data.title || 'My Turn';
  drawHeader(slide, {
    headerStyle: 'title',
    title: titleOverride,
    instruction: data.instruction,
    signal: data.signal
  }, ctx);

  const questions = Array.isArray(data.questions) ? data.questions : [];
  drawQuestions(
    slide,
    questions,
    { x: Q_X, y: Q_Y, w: Q_W, h: Q_H },
    pptx,
    ctx,
    {
      answerBoxes: data.answerBoxes,
      questionNumbering: data.questionNumbering
    }
  );

  if (data.questionVisual) {
    const visW = (WORK_W - VISUAL_GAP) / 2;
    drawContent(pptx, slide, { x: WORK_X, y: WORK_Y, w: visW, h: WORK_H, class: 'C' }, data.questionVisual, ctx);
    drawWorkingSpace(pptx, slide, { x: WORK_X + visW + VISUAL_GAP, y: WORK_Y, w: WORK_W - visW - VISUAL_GAP, h: WORK_H });
  } else {
    drawWorkingSpace(pptx, slide, { x: WORK_X, y: WORK_Y, w: WORK_W, h: WORK_H });
  }
}

// pptx and ctx are optional trailing arguments: with the card look on, the
// question line gets its own white card hugging the measured text height, so
// the task reads as an object like every other block. Callers without them
// draw exactly as before.
function drawQuestions(slide, questions, box, pptx, ctx, options) {
  if (questions.length === 0) return;
  const answerBoxes = options && options.answerBoxes === true;
  const entries = questions.map(function (q) {
    return { source: q, text: stripLeadingLabel(itemText(q)) };
  });
  const resolvedPictures = resolvePictureSet(
    entries.map(function (entry) { return entry.source; }),
    ctx
  );
  const baseMeasure = measureQuestionsHeight(entries.map(function (entry) {
    return entry.text;
  }), box.w, null, {
    answerBoxes: answerBoxes,
    questionNumbering: options && options.questionNumbering
  });
  let pictureSlotW = 0;
  let chosenMeasure = baseMeasure;
  if (resolvedPictures.length > 0 && resolvedPictures.some(Boolean)) {
    const estimatedRowH = Math.max(0.36, Math.min(box.h, Math.max(0.55, baseMeasure)) / entries.length);
    const proposedSlotW = resolvedPictures.reduce(function (m, picture) {
      return picture
        ? Math.max(m, pictureMetrics(picture, estimatedRowH - 0.08, ctx).w)
        : m;
    }, 0) + PICTURE_GAP;
    const withPictures = measureQuestionsHeight(
      entries.map(function (entry) { return entry.text; }),
      box.w,
      null,
      {
        answerBoxes: answerBoxes,
        questionNumbering: options && options.questionNumbering,
        pictureSlots: resolvedPictures.map(function (picture) {
          return picture ? proposedSlotW : 0;
        })
      }
    );
    if (withPictures <= box.h + 0.02) {
      pictureSlotW = proposedSlotW;
      chosenMeasure = withPictures;
    }
  }
  if (pptx && ctx && ctx.cardLook) {
    const hugH = Math.min(
      box.h,
      Math.max(0.55, chosenMeasure)
    );
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: box.x, y: box.y, w: box.w, h: hugH,
      fill: { color: CARD.fill },
      line: CARD.lineW ? { color: CARD.line, width: CARD.lineW } : { type: 'none' },
      rectRadius: CARD.radius,
      shadow: Object.assign({}, CARD.shadow)
    });
    box = { x: box.x, y: box.y, w: box.w, h: hugH };
  }
  const rowH = box.h / questions.length;
  // Lettered only for a teacher-led set of two or more - see
  // measureQuestionsHeight above for why a single teacher-led question
  // keeps its normal independent wording.
  const labelThem = options && options.questionNumbering === 'teacher-led'
    && questions.length > 1;
  const answerMetrics = answerBoxes ? answerBoxMetrics(QUESTION_FONT, rowH) : null;
  const answerGutterW = answerMetrics ? answerMetrics.w + ANSWER_BOX_GAP : 0;

  entries.forEach(function (entry, i) {
    const raw = entry.text;
    const parsed = answerBoxes
      ? splitAnswerBoxText(raw)
      : { text: raw, answer: '', revealed: false };
    const rowY = box.y + i * rowH;
    const picture = pictureSlotW ? resolvedPictures[i] : null;
    const ownPictureSlotW = picture ? pictureSlotW : 0;

    if (labelThem) {
      const label = '(' + String.fromCharCode(97 + i) + ')';
      slide.addText(label, {
        x: box.x + Q_PAD, y: rowY,
        w: LABEL_W, h: rowH,
        fontFace: FONT, fontSize: QUESTION_FONT, bold: true,
        color: COLOURS.title, align: 'left', valign: 'middle',
        margin: 0, fit: FIT
      });
      if (picture) {
        const metrics = pictureMetrics(picture, rowH - 0.08, ctx, ownPictureSlotW - PICTURE_GAP);
        drawContentPicture(slide, picture, {
          x: box.x + Q_PAD + LABEL_W + LABEL_GAP
            + ((ownPictureSlotW - PICTURE_GAP) - metrics.w) / 2,
          y: rowY + (rowH - metrics.h) / 2,
          w: metrics.w,
          h: metrics.h
        }, { objectName: 'question-context-' + (i + 1) });
      }
      const labelledSource = entry.source || {};
      const labelledColor = baseColourForRole(COLOURS.body, labelledSource.colorRole);
      slide.addText(presentationRuns(parsed.text, true, labelledColor, labelledSource), {
        x: box.x + Q_PAD + LABEL_W + LABEL_GAP + ownPictureSlotW, y: rowY,
        w: box.w - 2 * Q_PAD - LABEL_W - LABEL_GAP - answerGutterW - ownPictureSlotW, h: rowH,
        fontFace: FONT, fontSize: QUESTION_FONT, bold: true,
        color: labelledColor, align: 'left', valign: 'middle',
        margin: 0, fit: FIT
      });
    } else {
      if (picture) {
        const metrics = pictureMetrics(picture, rowH - 0.08, ctx, ownPictureSlotW - PICTURE_GAP);
        drawContentPicture(slide, picture, {
          x: box.x + Q_PAD + ((ownPictureSlotW - PICTURE_GAP) - metrics.w) / 2,
          y: rowY + (rowH - metrics.h) / 2,
          w: metrics.w,
          h: metrics.h
        }, { objectName: 'question-context-1' });
      }
      const plainSource = entry.source || {};
      const plainColor = baseColourForRole(COLOURS.body, plainSource.colorRole);
      slide.addText(presentationRuns(parsed.text, true, plainColor, plainSource), {
        x: box.x + Q_PAD + ownPictureSlotW, y: rowY,
        w: box.w - 2 * Q_PAD - answerGutterW - ownPictureSlotW, h: rowH,
        fontFace: FONT, fontSize: QUESTION_FONT, bold: true,
        color: plainColor, align: 'left', valign: 'middle',
        margin: 0, fit: FIT
      });
    }

    if (answerMetrics) {
      drawAnswerBox(pptx, slide, {
        x: box.x + box.w - ANSWER_BOX_EDGE_INSET - answerMetrics.w,
        y: rowY + (rowH - answerMetrics.h) / 2,
        w: answerMetrics.w,
        h: answerMetrics.h
      }, parsed.answer, parsed.revealed, { fontSize: answerMetrics.fontSize });
    }
  });
}

function drawWorkingSpace(pptx, slide, box) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: box.x, y: box.y, w: box.w, h: box.h,
    fill: { color: WORK_FILL },
    line: { color: WORK_LINE, width: WORK_LINE_W }
  });
}

module.exports = { drawMathsTurn, drawQuestions, drawWorkingSpace, measureQuestionsHeight };
