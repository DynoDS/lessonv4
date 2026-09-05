'use strict';

const { FONT, COLOURS, FIT } = require('../styles');
const { drawHeader } = require('../headers');
const { drawVisual, resolveVocabVisual } = require('../content/vocab');
const { estimateLines } = require('../content/text');

// ─── COORDINATES ──────────────────────────────────────────────
const CONTENT_X       = 0.22;
const CONTENT_Y       = 0.70;
const CONTENT_W       = 12.89;
const CONTENT_H       = 6.55;

const CARD_GAP        = 0.15;
const CARD_PAD        = 0.18;
const CARD_RADIUS     = 0.10;
const CARD_FILL       = 'D5F5E3';
const CARD_BORDER     = '00B050';
const CARD_BORDER_W   = 1.5;

const VISUAL_W        = 2.20;
const VISUAL_GAP      = 0.20;
const VISUAL_FILL     = 'F2F2F2';
const VISUAL_BORDER   = '00B050';
const VISUAL_BORDER_W = 1;
const VISUAL_RADIUS   = 0.06;
const VISUAL_PAD      = 0.08;

// The card sizes below are the floor, set by a full slate of five words. Fewer
// words means taller cards, and type that stays at the five-word size then prints
// small with empty green space under every line, which is the "why is this so
// tiny?" a teacher meets at the back of the room. So the type grows with the card
// it sits in, up to a ceiling that keeps a three-word slide looking like a
// vocabulary card rather than a poster. Shrink-to-fit still catches any definition
// that runs long, so growing here costs nothing on a wordy card.
const WORD_FONT       = 26;
const DEFN_FONT       = 18;
const FULL_SLATE      = 5;

// The ceiling depends on how many cards share the slide, because "poster" is
// only the wrong answer while there is something else to sit beside.
//
// Vocabulary is now introduced where each word is needed rather than all at
// once, so a slide holding ONE word is an ordinary lesson slide and not a
// mistake. At the flat 34/24 ceiling it printed the word and its definition at
// four-card size in the top corner of a full-slide green rectangle, with five
// inches of empty green under it: the type was legible and the slide looked
// like a rendering fault (5 September 2026). One word alone on the board IS
// the poster, so it may take poster type; two share, and take a little less;
// three or more keep exactly the ceiling they have today.
const FONT_CEILINGS = {
  1: { word: 44, defn: 30 },
  2: { word: 38, defn: 27 },
  default: { word: 34, defn: 24 },
};

const WORD_H_RATIO    = 0.40;
// Line height as a fraction of font size, matching `content/text.js`.
const LINE_RATIO      = 1.32 / 72;
// A word sits on one line and wants a little air under it before the
// definition starts.
const WORD_LINE_SLACK = 1.15;
// A card carrying a picture cannot shrink past what the picture needs: the
// panel is the card minus its padding, and the drawing inside that has its own
// inset again, so this is the height at which a vocabulary picture still
// clears the 1.6" readable floor rather than the card hugging the text and
// leaving the picture too small to read.
const MIN_CARD_H_WITH_VISUAL = 2.40;
// ─── END COORDINATES ──────────────────────────────────────────

function drawKeyVocabulary(pptx, slide, data, ctx) {
  drawHeader(slide, {
    headerStyle: 'title',
    title: data.title || 'Key Vocabulary',
    instruction: data.instruction,
    signal: data.signal
  }, ctx);

  const words = Array.isArray(data.words) ? data.words : [];
  if (words.length === 0) return;

  const totalGap = CARD_GAP * (words.length - 1);
  // What each card would get if the cards split the band equally. This is the
  // CEILING on a card's height, not its height: a card never grows past its
  // equal share, so a full slate looks exactly as it always has.
  const shareH = (CONTENT_H - totalGap) / words.length;

  // How much taller each card is than it would be on a full slate of five.
  const fullSlateH = (CONTENT_H - CARD_GAP * (FULL_SLATE - 1)) / FULL_SLATE;
  const growth = fullSlateH > 0 ? Math.max(1, shareH / fullSlateH) : 1;
  const ceilings = FONT_CEILINGS[words.length] || FONT_CEILINGS.default;
  const fonts = {
    word: Math.min(ceilings.word, Math.round(WORD_FONT * growth)),
    defn: Math.min(ceilings.defn, Math.round(DEFN_FONT * growth)),
  };

  // A card is as tall as what it holds, and the stack sits in the middle of
  // the band. Stretching every card to fill the band is right when the cards
  // are nearly full and wrong when they are not: it is what put one word in a
  // six-inch green rectangle. Three or more cards are already over their equal
  // share, so they are clipped back to it and nothing about them moves.
  const visuals = words.map(function (item) { return resolveVocabVisual(item.visual, ctx); });
  const heights = words.map(function (item, i) {
    return Math.min(shareH, naturalCardHeight(item, visuals[i], fonts));
  });
  const stackH = heights.reduce(function (a, b) { return a + b; }, 0) + totalGap;

  let cardY = CONTENT_Y + Math.max(0, (CONTENT_H - stackH) / 2);
  words.forEach(function (item, i) {
    drawCard(pptx, slide, item,
      { x: CONTENT_X, y: cardY, w: CONTENT_W, h: heights[i] }, ctx, fonts, visuals[i]);
    cardY += heights[i] + CARD_GAP;
  });
}

// The height this card's own contents ask for, measured the way the card
// actually divides itself: the word gets WORD_H_RATIO of the text area and the
// definition the rest, so whichever of the two is tighter sets the height.
function naturalCardHeight(item, visual, fonts) {
  const textW = visual
    ? CONTENT_W - 2 * CARD_PAD - VISUAL_W - VISUAL_GAP
    : CONTENT_W - 2 * CARD_PAD;
  const wordNeeds = fonts.word * LINE_RATIO * WORD_LINE_SLACK;
  const defnNeeds =
    estimateLines(item.definition || '', fonts.defn, textW) * fonts.defn * LINE_RATIO;
  const textH = Math.max(wordNeeds / WORD_H_RATIO, defnNeeds / (1 - WORD_H_RATIO));
  const height = 2 * CARD_PAD + textH;
  return visual ? Math.max(height, MIN_CARD_H_WITH_VISUAL) : height;
}

function drawCard(pptx, slide, item, card, ctx, fonts, resolvedVisual) {
  const wordFont = (fonts && fonts.word) || WORD_FONT;
  const defnFont = (fonts && fonts.defn) || DEFN_FONT;
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: card.x, y: card.y, w: card.w, h: card.h,
    fill: { color: CARD_FILL },
    line: { color: CARD_BORDER, width: CARD_BORDER_W },
    rectRadius: CARD_RADIUS
  });

  // Only reserve and frame the visual panel when the visual will actually draw.
  // An unrenderable visual (a clock or other unsupported type) resolves to null,
  // so the card behaves as if it had no picture: text takes the full width and no
  // empty framed panel is left behind.
  const visual = resolvedVisual !== undefined
    ? resolvedVisual
    : resolveVocabVisual(item.visual, ctx);
  const hasVisual = !!visual;
  const textW = hasVisual
    ? card.w - 2 * CARD_PAD - VISUAL_W - VISUAL_GAP
    : card.w - 2 * CARD_PAD;
  const textX = card.x + CARD_PAD;
  const textY = card.y + CARD_PAD;
  const textH = card.h - 2 * CARD_PAD;

  const wordH = textH * WORD_H_RATIO;
  const defnH = textH - wordH;

  slide.addText(item.word || '', {
    x: textX, y: textY, w: textW, h: wordH,
    fontFace: FONT, fontSize: wordFont, bold: true,
    color: COLOURS.green, align: 'left', valign: 'middle',
    margin: 0, fit: FIT
  });

  slide.addText(item.definition || '', {
    x: textX, y: textY + wordH, w: textW, h: defnH,
    fontFace: FONT, fontSize: defnFont, bold: true,
    color: COLOURS.body, align: 'left', valign: 'top',
    margin: 0, fit: FIT
  });

  if (hasVisual) {
    drawVisualPanel(pptx, slide, visual, {
      x: card.x + card.w - CARD_PAD - VISUAL_W,
      y: card.y + CARD_PAD,
      w: VISUAL_W,
      h: card.h - 2 * CARD_PAD
    }, ctx);
  }
}

function drawVisualPanel(pptx, slide, visual, panel, ctx) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: panel.x, y: panel.y, w: panel.w, h: panel.h,
    fill: { color: VISUAL_FILL },
    line: { color: VISUAL_BORDER, width: VISUAL_BORDER_W },
    rectRadius: VISUAL_RADIUS
  });

  const inner = {
    x: panel.x + VISUAL_PAD, y: panel.y + VISUAL_PAD,
    w: panel.w - 2 * VISUAL_PAD, h: panel.h - 2 * VISUAL_PAD
  };

  drawVisual(pptx, slide, inner, visual, ctx);
}

module.exports = { drawKeyVocabulary };
