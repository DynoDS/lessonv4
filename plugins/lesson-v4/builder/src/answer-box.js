'use strict';

const { FONT, COLOURS, FIT } = require('./styles');

const ANSWER_BOX_GAP = 0.16;
const ANSWER_BOX_EDGE_INSET = 0.06;
const ANSWER_BOX_MIN_H = 0.54;
const ANSWER_BOX_MAX_H = 1.08;
// A near-square cue reads as a real place to put one short response instead of
// a thin label. Task and reveal slides keep exactly the same geometry.
const ANSWER_BOX_W_RATIO = 1.0;
const ANSWER_BOX_LINE_W = 1.25;
const ANSWER_BOX_RADIUS = 0.14;
const ANSWER_BOX_SHADOW = {
  type: 'outer', blur: 5, offset: 1, angle: 90,
  color: '000000', opacity: 0.14
};
const ANSWER_BOX_FONT_MIN = 12;
const ANSWER_BOX_FONT_MAX = 28;

// Keep the method-frame blank syntax and the row-end answer cue on one parser.
// A run of underscores or a square is an empty write-in box. Other text stays
// untouched so the method-frame renderer preserves its existing layout.
function tokenizeWriteInContent(content) {
  return String(content == null ? '' : content)
    .split(/(_{2,}|□)/)
    .filter((part) => part !== '')
    .map((part) => (/^(_{2,}|□)$/.test(part) ? { box: true } : { text: part }));
}

// With answerBoxes enabled, the normal || reveal marker supplies the value for
// the row-end box instead of printing the answer inline. The prompt is the same
// on task and answer slides, which keeps the box in the same place.
function splitAnswerBoxText(value) {
  const raw = String(value == null ? '' : value);
  const marker = raw.indexOf('||');
  if (marker === -1) {
    return { text: raw, answer: '', revealed: false };
  }
  return {
    text: raw.slice(0, marker).replace(/\s+$/, ''),
    answer: raw.slice(marker + 2).trim(),
    revealed: true
  };
}

function answerBoxMetrics(fontPt, availableH) {
  const wantedH = Math.max(
    ANSWER_BOX_MIN_H,
    Math.min(ANSWER_BOX_MAX_H, (Number(fontPt) || 18) * 2.25 / 72)
  );
  const h = Number.isFinite(availableH)
    ? Math.max(0.28, Math.min(wantedH, availableH - 0.08))
    : wantedH;
  return {
    w: h * ANSWER_BOX_W_RATIO,
    h,
    fontSize: Math.max(
      ANSWER_BOX_FONT_MIN,
      Math.min(ANSWER_BOX_FONT_MAX, Math.round((Number(fontPt) || 18) * 0.82))
    )
  };
}

function fittedAnswerFontSize(answer, boxW, preferred) {
  const value = String(answer == null ? '' : answer);
  const wanted = Math.max(
    ANSWER_BOX_FONT_MIN,
    Math.min(ANSWER_BOX_FONT_MAX, Number(preferred) || ANSWER_BOX_FONT_MAX)
  );
  if (!value) return wanted;
  const usableW = Math.max(0.2, Number(boxW) - 0.10);
  const estimated = Math.floor((usableW * 72) / (value.length * 0.60));
  return Math.max(ANSWER_BOX_FONT_MIN, Math.min(wanted, estimated));
}

function drawAnswerBox(pptx, slide, box, answer, revealed, options) {
  const opts = options || {};
  const showAnswer = revealed === true && String(answer || '') !== '';
  const rotate = opts.rotate == null ? 0 : opts.rotate;
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: box.x, y: box.y, w: box.w, h: box.h,
    fill: { color: COLOURS.pureWhite },
    line: { color: COLOURS.green, width: ANSWER_BOX_LINE_W },
    rectRadius: ANSWER_BOX_RADIUS,
    shadow: Object.assign({}, ANSWER_BOX_SHADOW),
    rotate,
    objectName: showAnswer ? 'answer-box-revealed' : 'answer-box-empty'
  });
  if (!showAnswer) return;

  const fontSize = fittedAnswerFontSize(
    answer,
    box.w,
    opts.fontSize || ANSWER_BOX_FONT_MAX
  );

  slide.addText(String(answer), {
    x: box.x, y: box.y, w: box.w, h: box.h,
    fontFace: FONT,
    fontSize: fontSize,
    bold: true,
    color: COLOURS.green,
    align: 'center',
    valign: 'middle',
    margin: 0,
    fit: FIT,
    rotate,
    objectName: 'answer-box-value'
  });
}

module.exports = {
  ANSWER_BOX_GAP,
  ANSWER_BOX_EDGE_INSET,
  tokenizeWriteInContent,
  splitAnswerBoxText,
  answerBoxMetrics,
  fittedAnswerFontSize,
  drawAnswerBox
};
