'use strict';

const { FONT, COLOURS, FIT, MIN_FONT_PT } = require('../styles');
const {
  baseColourForRole,
  presentationRuns
} = require('../presentation-text');
const { fitGroupId, growFitObjectName } = require('../text-fit');
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

// A stack of question cards, each with an auto blue "(1) (2) (3)" label.
//
// The cards are sized by their QUESTIONS, not by the zone. That sounds obvious and
// it is not what this helper used to do: it divided the zone's height by the number
// of questions and gave each card an equal share, with the text at a fixed size
// inside it. Three short questions on a full body zone therefore came out as three
// boxes a third of the slide tall, each holding one small line and an inch of
// nothing - and the emptiness was not answer space, because children answer in
// their books. It was room doing nothing while the type stayed small enough to
// squint at from the back row.
//
// Two rules now govern the layout, and they pull the same way:
//
//   a card hugs its question   its height comes from how many lines that question
//                              wraps onto, so a one-line question gets a one-line
//                              card however much room the zone has spare;
//   the type takes the room    the font grows until the stack fills the height it
//                              has been given, so a short set comes out large.
//
// The cards share one width - the widest any question needs - so the stack reads as
// a column rather than a ragged edge, and that width comes from the questions
// rather than the zone, so a set of short questions no longer sits inside boxes
// three times wider than the words in them.

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD           = 0.15;   // inset from the zone edge, inches
const CARD_GAP      = 0.15;   // gap between cards, inches
const CARD_PAD_X    = 0.20;   // text inset inside a card, left+right, inches
const CARD_PAD_Y    = 0.16;   // text inset inside a card, top+bottom, inches
const CARD_RADIUS   = 0.08;   // corner radius, inches
const CARD_FILL     = 'F2F2F2';
const CARD_LINE     = '0070C0';
const CARD_LINE_W   = 1.5;
const CARD_FONT_MIN = 14;     // question font floor, points (>= MIN_FONT_PT)
const CARD_FONT_MAX = 40;     // question font ceiling, points. Set to the largest
                              // ceiling anywhere in the deck (the lesson-cover LO),
                              // so a three-question quick check reads from the back
                              // of the room without a question ever coming out
                              // bigger than a title.
const LINE_H_RATIO  = 1.30;   // line height as a multiple of font size
const CHAR_W_EM     = 0.43;   // Comic Sans bold character width estimate, ems,
                              // calibrated for explicit phase breaks: a question
                              // the designer split into lines at the real action
                              // boundaries must measure to the width of its
                              // LONGEST line, not its whole paragraph, or the
                              // card the break was meant to earn never shrinks.
                              // Slightly under the measured ~0.55 on purpose:
                              // the card then hugs the longest line instead of
                              // rounding up to the next line's width, and the
                              // grow-fit pass carries any slack the estimate
                              // leaves.
const PICTURE_CHAR_W_EM = 0.56; // measured fit used only after the bare stack is safe
const LABEL_CHAR_W_EM = 0.48; // parentheses and digits are narrower than body text
const LABEL_GAP_EM  = 0.24;   // small visible gap after "(1)" without a wide label column
const QUESTION_PICTURE_MAX_W = 1.55; // height leads; this only restrains very wide artwork
// ─── END CONSTANTS ────────────────────────────────────────────

function stripLeadingLabel(text) {
  return String(text).replace(/^\(\s*(?:[a-z]|\d+)\s*\)\s*/i, '');
}

// The plain reading length: the colour markers are instructions to the renderer,
// not characters on the board, so counting them would size an answer card wider
// than the question card it sits beneath.
function plainLength(text) {
  return String(text)
    .replace(/\|\|/g, ' ')
    .replace(/\*\*|\[\[|\]\]|\{\{|\}\}|<<|>>/g, '')
    .length;
}

// Measure the whole stack at a candidate font size: the shared card width (the
// widest question's), each card's own height, and the total with the gaps.
function measureStack(questions, fontPt, maxW, answerBoxes, options) {
  const lineH    = (fontPt * LINE_H_RATIO) / 72;
  // The label column is priced from the widest label the set will print, so a set
  // running past (9) does not have its numbers clipped.
  const labelTextW = ((String(questions.length).length + 2) * LABEL_CHAR_W_EM)
                     * fontPt / 72;
  const labelGapW = LABEL_GAP_EM * fontPt / 72;
  const labelW = labelTextW + labelGapW;
  const answerMetrics = answerBoxes ? answerBoxMetrics(fontPt) : null;
  const answerGutterW = answerMetrics ? answerMetrics.w + ANSWER_BOX_GAP : 0;
  const pictureSlots = questions.map(function (_q, i) {
    return options && Array.isArray(options.pictureSlots)
      ? Math.max(0, Number(options.pictureSlots[i]) || 0)
      : 0;
  });

  const charWEm = options && Number.isFinite(Number(options.charWEm))
    ? Number(options.charWEm)
    : CHAR_W_EM;
  const minimumCardHeights = options && Array.isArray(options.minimumCardHeights)
    ? options.minimumCardHeights
    : [];
  // A question written with explicit phase breaks (\n) measures its WIDTH
  // against the longest written line and its HEIGHT against every written line:
  // the break is the design, so the card hugs the longest line while still
  // carrying the room each shorter phase needs.
  const naturalLines = questions.map(function (q) {
    return String(q.text).split('\n').map(function (line) {
      return (plainLength(line) * fontPt * charWEm) / 72;
    });
  });
  const textWidths = naturalLines.map(function (lines, i) {
    const maxTextW = Math.max(
      0.4,
      maxW - labelW - answerGutterW - 2 * CARD_PAD_X - pictureSlots[i]
    );
    const longestLine = lines.reduce(function (m, w) { return Math.max(m, w); }, 0);
    return Math.min(longestLine, maxTextW);
  });
  const widestRowW = textWidths.reduce(function (m, textW, i) {
    return Math.max(m, textW + pictureSlots[i]);
  }, 0);

  const cards = questions.map(function (q, i) {
    const lines = naturalLines[i].reduce(function (total, lineW) {
      return total + Math.max(1, Math.ceil(lineW / Math.max(textWidths[i], 0.1)));
    }, 0);
    return {
      source: q.source,
      text: q.text,
      answer: q.answer,
      revealed: q.revealed,
      pictureSlotW: pictureSlots[i],
      h: Math.max(
        lines * lineH + 2 * CARD_PAD_Y,
        Number(minimumCardHeights[i]) || 0
      )
    };
  });

  const totalH = cards.reduce(function (s, c) { return s + c.h; }, 0)
               + CARD_GAP * (cards.length - 1);

  return {
    cards: cards,
    w: widestRowW + labelW + answerGutterW + 2 * CARD_PAD_X,
    labelW: labelW,
    labelTextW: labelTextW,
    answerMetrics: answerMetrics,
    totalH: totalH
  };
}

function drawNumberedQuestions(pptx, slide, zone, data, ctx) {
  const answerBoxes = data.answerBoxes === true;
  const entries = (Array.isArray(data.questions) ? data.questions : [])
    .map(function (q) {
      return { source: q, text: stripLeadingLabel(itemText(q)) };
    })
    .filter(function (entry) { return entry.text !== ''; });
  const pictures = resolvePictureSet(entries.map(function (entry) { return entry.source; }), ctx);
  const questions = entries.map(function (entry, i) {
    const parsed = answerBoxes
      ? splitAnswerBoxText(entry.text)
      : { text: entry.text, answer: '', revealed: false };
    parsed.source = entry.source;
    parsed.picture = pictures[i];
    return parsed;
  });
  if (questions.length === 0) return;

  // Numbering runs on across the independent slides that follow rather than
  // restarting on each one (Question Labelling in references/preferences.md).
  // `startAt` carries it; omitted means start at 1.
  const startN  = Number(data.startAt);
  const startAt = Number.isFinite(startN) && startN >= 1 ? Math.floor(startN) : 1;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = Math.max(0.8, zone.w - 2 * PAD);
  const innerH = Math.max(0.4, zone.h - 2 * PAD);
  const questionTextGroup = fitGroupId(zone, 'numbered-question-text');

  const fontFloor = Math.max(CARD_FONT_MIN, MIN_FONT_PT);

  // Grow the type until the stack fills the height it has. Bigger type makes each
  // card taller, and makes a long question wrap onto more lines, so the largest
  // font whose stack still fits is the one that uses the zone.
  let fontPt = CARD_FONT_MAX;
  let stack;
  for (;;) {
    stack = measureStack(questions, fontPt, innerW, answerBoxes);
    if (stack.totalH <= innerH || fontPt <= fontFloor) break;
    fontPt -= 1;
  }

  // Even at the floor font a long set can overflow: shrink the cards in proportion
  // rather than letting the last one spill out of the zone.
  let cards = stack.cards;
  let scaledForOverflow = false;
  if (stack.totalH > innerH) {
    scaledForOverflow = true;
    const room  = Math.max(0.3 * cards.length, innerH - CARD_GAP * (cards.length - 1));
    const scale = room / cards.reduce(function (s, c) { return s + c.h; }, 0);
    cards = cards.map(function (c) {
      return {
        source: c.source,
        text: c.text,
        answer: c.answer,
        revealed: c.revealed,
        h: c.h * scale
      };
    });
  }

  // Pictures shorten the text column and can add a line. The set keeps every
  // requested picture at the largest font at which the complete pictured set
  // still fits - the bare stack's font when the pictures fit there, one point
  // smaller for each point the honest picture estimate needs. Dropping to the
  // lowest-cost subset of pictures is the last resort, spent only when no
  // font down to the floor can carry the complete set.
  if (!scaledForOverflow && questions.some(function (q) { return !!q.picture; })) {
    const baseStack = stack;
    const pictureMeasureOptions = function (slots) {
      return {
        pictureSlots: slots,
        charWEm: PICTURE_CHAR_W_EM,
        minimumCardHeights: baseStack.cards.map(function (card) { return card.h; })
      };
    };
    const proposedSlots = questions.map(function (q, i) {
      if (!q.picture) return 0;
      const pictureH = Math.max(0.28, cards[i].h - 2 * CARD_PAD_Y);
      return pictureMetrics(q.picture, pictureH, ctx, QUESTION_PICTURE_MAX_W).w + PICTURE_GAP;
    });
    let acceptedSlots = proposedSlots.slice();
    let picturedStack = measureStack(
      questions,
      fontPt,
      innerW,
      answerBoxes,
      pictureMeasureOptions(acceptedSlots)
    );

    if (picturedStack.totalH > innerH) {
      // The bare-stack font was chosen on the optimistic width estimate, and
      // the honest picture estimate adds lines the bare stack never priced.
      // Before spending pictures, give the set the largest SMALLER font at
      // which the complete pictured set still fits.
      let trialFont = fontPt - 1;
      let stepped = null;
      while (trialFont >= fontFloor) {
        const trialStack = measureStack(
          questions,
          trialFont,
          innerW,
          answerBoxes,
          { pictureSlots: acceptedSlots, charWEm: PICTURE_CHAR_W_EM }
        );
        if (trialStack.totalH <= innerH) {
          stepped = { font: trialFont, stack: trialStack };
          break;
        }
        trialFont -= 1;
      }
      if (stepped) {
        fontPt = stepped.font;
        stack = stepped.stack;
        picturedStack = stepped.stack;
      } else {
        acceptedSlots = proposedSlots.map(function () { return 0; });
        const candidates = proposedSlots
          .map(function (slotW, i) {
            if (!slotW) return null;
            const one = acceptedSlots.slice();
            one[i] = slotW;
            const oneStack = measureStack(
              questions,
              fontPt,
              innerW,
              answerBoxes,
              pictureMeasureOptions(one)
            );
            return { i: i, cost: oneStack.totalH - baseStack.totalH };
          })
          .filter(Boolean)
          .sort(function (a, b) { return a.cost - b.cost || a.i - b.i; });

        candidates.forEach(function (candidate) {
          const trial = acceptedSlots.slice();
          trial[candidate.i] = proposedSlots[candidate.i];
          const trialStack = measureStack(
            questions,
            fontPt,
            innerW,
            answerBoxes,
            pictureMeasureOptions(trial)
          );
          if (trialStack.totalH <= innerH) acceptedSlots = trial;
        });
        picturedStack = measureStack(
          questions,
          fontPt,
          innerW,
          answerBoxes,
          pictureMeasureOptions(acceptedSlots)
        );
      }
    }

    if (acceptedSlots.some(function (slotW) { return slotW > 0; })) {
      stack = picturedStack;
      cards = picturedStack.cards.map(function (card, i) {
        return Object.assign({}, card, {
          picture: acceptedSlots[i] ? questions[i].picture : null
        });
      });
    }
  }

  const blockH = cards.reduce(function (s, c) { return s + c.h; }, 0)
               + CARD_GAP * (cards.length - 1);
  let cardY = innerY + Math.max(0, (innerH - blockH) / 2);

  cards.forEach(function (c, i) {
    const label = '(' + (startAt + i) + ')';

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: innerX, y: cardY, w: stack.w, h: c.h,
      fill: { color: CARD_FILL },
      line: { color: CARD_LINE, width: CARD_LINE_W },
      rectRadius: CARD_RADIUS
    });

    slide.addText(label, {
      x: innerX + CARD_PAD_X, y: cardY,
      w: stack.labelTextW, h: c.h,
      fontFace: FONT, fontSize: fontPt, bold: true,
      color: COLOURS.title, align: 'right', valign: 'middle',
      margin: 0, fit: FIT
    });

    const answerGutterW = stack.answerMetrics
      ? stack.answerMetrics.w + ANSWER_BOX_GAP
      : 0;
    const ownPictureSlotW = c.picture ? c.pictureSlotW : 0;
    const pictureOnRight = !!c.picture && !answerBoxes;
    if (ownPictureSlotW && c.picture) {
      const metrics = pictureMetrics(
        c.picture,
        Math.max(0.28, c.h - 2 * CARD_PAD_Y),
        ctx,
        ownPictureSlotW - PICTURE_GAP
      );
      drawContentPicture(slide, c.picture, {
        x: pictureOnRight
          ? innerX + stack.w - CARD_PAD_X - (ownPictureSlotW - PICTURE_GAP)
            + ((ownPictureSlotW - PICTURE_GAP) - metrics.w) / 2
          : innerX + CARD_PAD_X + stack.labelW
            + ((ownPictureSlotW - PICTURE_GAP) - metrics.w) / 2,
        y: cardY + (c.h - metrics.h) / 2,
        w: metrics.w,
        h: metrics.h
      }, { objectName: 'question-context-' + (startAt + i) });
    }

    const source = c.source || {};
    const baseColor = baseColourForRole(COLOURS.body, source.colorRole);

    slide.addText(presentationRuns(c.text, true, baseColor, source), {
      x: innerX + CARD_PAD_X + stack.labelW
        + (pictureOnRight ? 0 : ownPictureSlotW), y: cardY,
      w: stack.w - 2 * CARD_PAD_X - stack.labelW - answerGutterW - ownPictureSlotW, h: c.h,
      fontFace: FONT, fontSize: fontPt, bold: true,
      color: baseColor, align: 'left', valign: 'middle',
      margin: 0, fit: FIT,
      objectName: growFitObjectName(
        questionTextGroup,
        CARD_FONT_MAX,
        'question-text-' + (startAt + i)
      )
    });

    if (stack.answerMetrics) {
      const boxH = Math.max(0.28, Math.min(stack.answerMetrics.h, c.h - 0.08));
      const boxW = Math.min(stack.answerMetrics.w, boxH);
      drawAnswerBox(pptx, slide, {
        x: innerX + stack.w - ANSWER_BOX_EDGE_INSET - boxW,
        y: cardY + (c.h - boxH) / 2,
        w: boxW,
        h: boxH
      }, c.answer, c.revealed, { fontSize: stack.answerMetrics.fontSize });
    }

    cardY += c.h + CARD_GAP;
  });
}

// The bare geometry a question stack needs at a fixed font and column width:
// the shared card width (the longest written line's), each card's height, and
// the total. Exposed so designers can price an explicit phase break — the
// width a broken question earns must come from its longest line, never from
// the paragraph it came from.
function measureQuestionStack(questions, fontPt, maxW) {
  const normalized = (Array.isArray(questions) ? questions : [])
    .map(function (q) {
      return { source: q, text: stripLeadingLabel(itemText(q)) };
    })
    .filter(function (entry) { return entry.text !== ''; });
  const stack = measureStack(normalized, fontPt, maxW, false);
  return {
    cards: stack.cards.map(function (c) {
      return { h: c.h, w: stack.w };
    }),
    w: stack.w
  };
}

module.exports = { drawNumberedQuestions, measureQuestionStack };
