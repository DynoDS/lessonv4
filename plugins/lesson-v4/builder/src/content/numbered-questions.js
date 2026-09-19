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
const { textBoxWidthIn } = require('../glyph-width');

// A stack of question cards with purple labels, independent of body colour.
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
//   the type takes the room    the font grows until the set fills the room it has
//                              been given, so a short set comes out large.
//
// The cards share one width - the widest any question needs - so the set reads as
// a block rather than a ragged edge, and that width comes from the questions
// rather than the zone, so a set of short questions no longer sits inside boxes
// three times wider than the words in them.
//
// "The room" means both axes, and for a long time it only meant the height. A set
// of three short questions in the wide, shallow zone under a task instruction was
// sized by dividing that zone's HEIGHT three ways, so "6,032", "6,302", "6,320"
// came out at 16pt in a narrow column with two thirds of the zone's width sitting
// empty beside them. Where the questions are short enough to keep one line each in
// a narrower column, they are laid out in full rows instead, and the font is then
// bounded by the room the zone actually has rather than by its height alone.

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
// A set that is nothing but answers is read from the back of the room for a few
// seconds and then gone, so it takes a higher ceiling than a question a child
// works from: a three-answer reveal at 40pt left most of the slide empty while
// the teacher read the answers out (the teacher, 19 September 2026, "the only
// thing on these answer slides are answers, they can be bigger right?").
const ANSWER_FONT_MAX = 48;
const LINE_H_RATIO  = 1.30;   // line height as a multiple of font size
const LABEL_FONT_PT = 24;     // the question number's own size, points. The number
                              // is a marker a child matches against their book, not
                              // part of the question, so it is set once and left
                              // alone rather than growing with the words beside it:
                              // a two-question check on a whole zone used to print
                              // "(1)" at 40pt, as big as the number being rounded.
                              // Held at 24 it also costs the card far less width,
                              // which is room the question and its answer get back.
                              // It never exceeds the question's own font, because a
                              // number bigger than the question it labels reads as
                              // the point of the card.
const LABEL_GAP_EM  = 0.24;   // small visible gap after "(1)" without a wide label column
const QUESTION_PICTURE_MAX_W = 1.55; // height leads; this only restrains very wide artwork
const MIN_COLUMN_W  = 1.2;    // narrowest column a card may be laid out in, inches.
                              // A one-character question technically fits a
                              // sliver; a row of slivers is not a question set.
// ─── END CONSTANTS ────────────────────────────────────────────

function stripLeadingLabel(text) {
  return String(text).replace(/^\(\s*(?:[a-z]|\d+)\s*\)\s*/i, '');
}

// Does any block anywhere in this deck continue a numbering run? Numbering
// carries on across the independent slides that follow (preferences.md,
// Question Labelling), and `startAt` is how a later slide says so. A deck
// where no block starts past (1) has no runs to keep whole, which is what
// makes it safe to leave a lone question unnumbered.
function deckContinuesNumbering(ctx) {
  const slides = ctx && ctx.lesson && ctx.lesson.slides;
  if (!Array.isArray(slides)) return false;
  let found = false;
  const walk = function (node) {
    if (found || node == null || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (Number(node.startAt) >= 2) { found = true; return; }
    Object.keys(node).forEach(function (key) { walk(node[key]); });
  };
  walk(slides);
  return found;
}

// The words as the board shows them: the colour markers are instructions to the
// renderer, not characters on the board, so measuring them would size a card
// wider than the question printed inside it.
function plainText(text) {
  return String(text)
    .replace(/\|\|/g, ' ')
    .replace(/\*\*|\[\[|\]\]|\{\{|\}\}|<<|>>/g, '');
}

// The width the BOX around one written line needs at a given size, measured
// against the real advance widths of the font the deck names and the inset the
// fit pass reserves (see ../glyph-width.js). Every card in here is drawn bold.
function lineWidth(text, fontPt) {
  return textBoxWidthIn(plainText(text), fontPt, true);
}

// Measure the whole stack at a candidate font size: the shared card width (the
// widest question's), each card's own height, and the total with the gaps.
function measureStack(questions, fontPt, maxW, answerBoxes, options) {
  const lineH    = (fontPt * LINE_H_RATIO) / 72;
  // A set that prints no numbers (one lone question - see the draw function)
  // spends no width on the label column either, so the question gets the room
  // the number would have taken.
  const noLabel = !!(options && options.noLabel);
  // The label column is priced from the widest label the set will print, so a set
  // running past (9) does not have its numbers clipped. `widestLabel` is the real
  // last label, because a set that starts at (8) prints "(10)" while its own
  // length says one digit.
  const widestLabel =
    (options && options.widestLabel) || '(' + questions.length + ')';
  const labelFontPt = Math.min(LABEL_FONT_PT, fontPt);
  const labelTextW = noLabel ? 0 : textBoxWidthIn(widestLabel, labelFontPt, true);
  const labelGapW = noLabel ? 0 : LABEL_GAP_EM * labelFontPt / 72;
  const labelW = labelTextW + labelGapW;
  const answerMetrics = answerBoxes ? answerBoxMetrics(fontPt) : null;
  const answerGutterW = answerMetrics ? answerMetrics.w + ANSWER_BOX_GAP : 0;
  const pictureSlots = questions.map(function (_q, i) {
    return options && Array.isArray(options.pictureSlots)
      ? Math.max(0, Number(options.pictureSlots[i]) || 0)
      : 0;
  });

  const minimumCardHeights = options && Array.isArray(options.minimumCardHeights)
    ? options.minimumCardHeights
    : [];
  // A question written with explicit phase breaks (\n) measures its WIDTH
  // against the longest written line and its HEIGHT against every written line:
  // the break is the design, so the card hugs the longest line while still
  // carrying the room each shorter phase needs.
  const naturalLines = questions.map(function (q) {
    return String(q.text).split('\n').map(function (line) {
      return lineWidth(line, fontPt);
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
      lines: lines,
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
    labelFontPt: labelFontPt,
    answerMetrics: answerMetrics,
    totalH: totalH
  };
}

// The height one card needs when its question stays on a single line.
function oneLineCardHeight(fontPt) {
  return (fontPt * LINE_H_RATIO) / 72 + 2 * CARD_PAD_Y;
}

// Column counts that leave no ragged tail: either the columns divide the set
// exactly, or the whole set goes on one row. A grid with a half-empty last row
// reads as a stack that ran out rather than a deliberate block, so it is not
// offered even when it would fit a point or two larger.
function fullRowColumnCounts(count) {
  const options = [];
  for (let columns = 2; columns <= count; columns += 1) {
    if (columns === count || count % columns === 0) options.push(columns);
  }
  return options;
}

// The largest-type arrangement of the same cards in full rows, or null when
// going wide wins nothing.
//
// Only a set whose questions each keep ONE line in the narrower column is
// offered a grid: a question forced to wrap there is harder to read however
// large the type, and a question the designer broke into phases with `\n` is
// already multi-line by choice. Pictures and answer boxes keep the single
// column, whose measurement they are built around.
function widerArrangement(questions, options) {
  const { measure, innerW, innerH, ceilingPt, currentPt } = options;
  if (questions.length < 2 || currentPt >= ceilingPt) return null;

  let best = null;
  fullRowColumnCounts(questions.length).forEach(function (columns) {
    const columnW = (innerW - CARD_GAP * (columns - 1)) / columns;
    if (columnW < MIN_COLUMN_W) return;
    const rows = Math.ceil(questions.length / columns);
    for (let fontPt = ceilingPt; fontPt > currentPt; fontPt -= 1) {
      if (best && fontPt <= best.fontPt) break;
      const cardH = oneLineCardHeight(fontPt);
      if (rows * cardH + CARD_GAP * (rows - 1) > innerH) continue;
      const stack = measure(questions, fontPt, columnW, false);
      const wraps = stack.cards.some(function (card) {
        return card.h > cardH + 0.001;
      });
      if (wraps || stack.w > columnW + 0.001) continue;
      best = { columns: columns, fontPt: fontPt, stack: stack };
      break;
    }
  });
  return best;
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

  // A question number exists so a child can tell questions apart and match
  // answers back. A block holding exactly one question has nothing to tell
  // apart, so the lone "(1)" beside a one-question starter was furniture
  // (preferences.md, Question Labelling). It is suppressed only when nothing
  // in the deck continues a numbering run (`startAt` of 2 or more anywhere):
  // where numbering carries on across slides, the first question keeps its
  // "(1)" so the run the later slides continue stays whole.
  const soleQuestion =
    questions.length === 1 && startAt === 1 && !deckContinuesNumbering(ctx);
  const widestLabel = '(' + (startAt + questions.length - 1) + ')';
  const measureHere = function (qs, font, w, ab, opts) {
    return measureStack(
      qs, font, w, ab,
      Object.assign({}, opts, { noLabel: soleQuestion, widestLabel: widestLabel })
    );
  };

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = Math.max(0.8, zone.w - 2 * PAD);
  const innerH = Math.max(0.4, zone.h - 2 * PAD);
  const questionTextGroup = fitGroupId(zone, 'numbered-question-text');

  const fontFloor = Math.max(CARD_FONT_MIN, MIN_FONT_PT);
  // Every item revealed means this set is the reveal, not the task.
  const allRevealed = questions.length > 0 && questions.every(function (q) {
    return /\|\||\{\{/.test(String(q.text || ''));
  });
  const ceilingPt = allRevealed ? ANSWER_FONT_MAX : CARD_FONT_MAX;

  // Grow the type until the stack fills the height it has. Bigger type makes each
  // card taller, and makes a long question wrap onto more lines, so the largest
  // font whose stack still fits is the one that uses the zone.
  let fontPt = ceilingPt;
  let stack;
  for (;;) {
    stack = measureHere(questions, fontPt, innerW, answerBoxes);
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
        lines: c.lines,
        h: c.h * scale
      };
    });
  }

  // Pictures shorten the text column and can add a line. The set keeps every
  // requested picture at the largest font at which the complete pictured set
  // still fits - the bare stack's font when the pictures fit there, one point
  // smaller for each point the pictures need. Dropping to the lowest-cost subset
  // of pictures is the last resort, spent only when no font down to the floor
  // can carry the complete set.
  if (!scaledForOverflow && questions.some(function (q) { return !!q.picture; })) {
    const baseStack = stack;
    const pictureMeasureOptions = function (slots) {
      return {
        pictureSlots: slots,
        minimumCardHeights: baseStack.cards.map(function (card) { return card.h; })
      };
    };
    const proposedSlots = questions.map(function (q, i) {
      if (!q.picture) return 0;
      const pictureH = Math.max(0.28, cards[i].h - 2 * CARD_PAD_Y);
      return pictureMetrics(q.picture, pictureH, ctx, QUESTION_PICTURE_MAX_W).w + PICTURE_GAP;
    });
    let acceptedSlots = proposedSlots.slice();
    let picturedStack = measureHere(
      questions,
      fontPt,
      innerW,
      answerBoxes,
      pictureMeasureOptions(acceptedSlots)
    );

    if (picturedStack.totalH > innerH) {
      // The bare stack was measured without the picture columns, and taking that
      // width away can add a line the bare stack never priced. Before spending
      // pictures, give the set the largest SMALLER font at which the complete
      // pictured set still fits.
      let trialFont = fontPt - 1;
      let stepped = null;
      while (trialFont >= fontFloor) {
        const trialStack = measureHere(
          questions,
          trialFont,
          innerW,
          answerBoxes,
          { pictureSlots: acceptedSlots }
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
            const oneStack = measureHere(
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
          const trialStack = measureHere(
            questions,
            fontPt,
            innerW,
            answerBoxes,
            pictureMeasureOptions(trial)
          );
          if (trialStack.totalH <= innerH) acceptedSlots = trial;
        });
        picturedStack = measureHere(
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

  // The set has now taken all the height it can. Before drawing, see whether the
  // same cards laid out in full rows would take type the zone's WIDTH has been
  // holding for it all along - the case a wide, shallow zone under a task
  // instruction creates every time it carries a short question set.
  let columns = 1;
  const wider = (answerBoxes || questions.some(function (q) { return !!q.picture; }))
    ? null
    : widerArrangement(questions, {
        measure: measureHere,
        innerW: innerW,
        innerH: innerH,
        ceilingPt: ceilingPt,
        currentPt: fontPt
      });
  if (wider) {
    columns = wider.columns;
    fontPt = wider.fontPt;
    stack = wider.stack;
    cards = wider.stack.cards;
  }

  // One alignment for the whole set. Each card used to choose its own (centred
  // on one line, left once it wrapped), so a two-question starter printed
  // `What is a source?` centred above a wrapped second question hard left, and
  // the teacher saw two questions that did not belong together (14 September
  // 2026). Centring is still the default; a set in which any question wraps is
  // left-aligned throughout, for the reason the per-card rule gave.
  const setAlign = cards.some(function (c) { return (c.lines || 1) > 1; }) ? 'left' : 'center';

  const rowCount = Math.ceil(cards.length / columns);
  const rowHeights = [];
  for (let row = 0; row < rowCount; row += 1) {
    rowHeights.push(
      cards
        .slice(row * columns, row * columns + columns)
        .reduce(function (m, c) { return Math.max(m, c.h); }, 0)
    );
  }
  const blockH = rowHeights.reduce(function (s, h) { return s + h; }, 0)
               + CARD_GAP * (rowCount - 1);
  const blockW = columns * stack.w + CARD_GAP * (columns - 1);
  // A single column keeps its long-standing left edge; a grid is centred, so a
  // row of cards sits under the middle of the task rather than off to one side.
  const blockX = columns > 1
    ? innerX + Math.max(0, (innerW - blockW) / 2)
    : innerX;
  const rowTops = [];
  let runningY = innerY + Math.max(0, (innerH - blockH) / 2);
  rowHeights.forEach(function (h) {
    rowTops.push(runningY);
    runningY += h + CARD_GAP;
  });

  cards.forEach(function (c, i) {
    const label = '(' + (startAt + i) + ')';
    const cardX = blockX + (i % columns) * (stack.w + CARD_GAP);
    const cardY = rowTops[Math.floor(i / columns)];

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: cardX, y: cardY, w: stack.w, h: c.h,
      fill: { color: CARD_FILL },
      line: { color: CARD_LINE, width: CARD_LINE_W },
      rectRadius: CARD_RADIUS
    });

    // A lone question prints no number: there is nothing to tell it apart
    // from. The measurement above already gave its width to the words.
    //
    // The number stays OUT of the question's grow-fit group on purpose. Its box
    // is drawn to exactly one label, so it can never grow, and a member that
    // cannot grow caps a group that settles on its smallest member - which would
    // spend a readable question to make the number beside it match. Honest width
    // measurement is what keeps the two together: the 16pt "(4)" against a 12pt
    // question came from a question box narrower than its own words, not from
    // the number being sized apart.
    if (!soleQuestion) {
      slide.addText(label, {
        x: cardX + CARD_PAD_X, y: cardY,
        w: stack.labelTextW, h: c.h,
        fontFace: FONT, fontSize: stack.labelFontPt, bold: true,
        color: COLOURS.questionLabel, align: 'left', valign: 'middle',
        margin: 0, fit: FIT
      });
    }

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
          ? cardX + stack.w - CARD_PAD_X - (ownPictureSlotW - PICTURE_GAP)
            + ((ownPictureSlotW - PICTURE_GAP) - metrics.w) / 2
          : cardX + CARD_PAD_X + stack.labelW
            + ((ownPictureSlotW - PICTURE_GAP) - metrics.w) / 2,
        y: cardY + (c.h - metrics.h) / 2,
        w: metrics.w,
        h: metrics.h
      }, { objectName: 'question-context-' + (startAt + i) });
    }

    const source = c.source || {};
    const baseColor = baseColourForRole(COLOURS.body, source.colorRole);

    slide.addText(presentationRuns(c.text, true, baseColor, source), {
      x: cardX + CARD_PAD_X + stack.labelW
        + (pictureOnRight ? 0 : ownPictureSlotW), y: cardY,
      w: stack.w - 2 * CARD_PAD_X - stack.labelW - answerGutterW - ownPictureSlotW, h: c.h,
      fontFace: FONT, fontSize: fontPt, bold: true,
      // Centred in its own box. The cards share one width, the widest question's,
      // so every shorter question in the set has slack; left-aligned it pooled on
      // the right and a check slide read as a column of cards that did not fill.
      // The limit is a question that wraps: it has already spent the width, so
      // there is no slack to share, and centring only leaves the last few words
      // stranded mid-card ("2,649 rounds to 2,650 to the nearest" / "10.").
      // When one card wraps the whole set goes left (setAlign, above).
      color: baseColor,
      align: setAlign,
      valign: 'middle',
      margin: 0, fit: FIT,
      // The floor travels in the name, or the global fit pass does not know it
      // exists: a question with no MIN in its name is shrunk to the deck-wide
      // 10pt floor while the criteria table beside it, which carries MIN20,
      // stops at 20. That is how a Year 4 history practice question reached
      // the class at 11pt next to a 23pt reference (8 September 2026). With
      // the floor named, a question that cannot fit at it is reported as an
      // overload for the designer to recompose, never quietly shrunk past it.
      objectName: growFitObjectName(
        questionTextGroup,
        // An answers set is measured at the size it was laid out at, so the
        // grow pass may not take it past that: a card sized for one line and
        // text grown a rung larger wraps out of its own box.
        allRevealed ? fontPt : ceilingPt,
        'question-text-' + (startAt + i),
        Math.max(CARD_FONT_MIN, MIN_FONT_PT)
      )
    });

    if (stack.answerMetrics) {
      const boxH = Math.max(0.28, Math.min(stack.answerMetrics.h, c.h - 0.08));
      const boxW = Math.min(stack.answerMetrics.w, boxH);
      drawAnswerBox(pptx, slide, {
        x: cardX + stack.w - ANSWER_BOX_EDGE_INSET - boxW,
        y: cardY + (c.h - boxH) / 2,
        w: boxW,
        h: boxH
      }, c.answer, c.revealed, { fontSize: stack.answerMetrics.fontSize });
    }
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
