'use strict';

const { FONT, COLOURS, FIT } = require('../styles');
const { drawHeader } = require('../headers');
const { drawVisual, resolveVocabVisual } = require('../content/vocab');

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
const WORD_FONT_MAX   = 34;
const DEFN_FONT_MAX   = 24;
const FULL_SLATE      = 5;

const WORD_H_RATIO    = 0.40;
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
  const cardH    = (CONTENT_H - totalGap) / words.length;

  // How much taller each card is than it would be on a full slate of five.
  const fullSlateH = (CONTENT_H - CARD_GAP * (FULL_SLATE - 1)) / FULL_SLATE;
  const growth = fullSlateH > 0 ? Math.max(1, cardH / fullSlateH) : 1;
  const fonts = {
    word: Math.min(WORD_FONT_MAX, Math.round(WORD_FONT * growth)),
    defn: Math.min(DEFN_FONT_MAX, Math.round(DEFN_FONT * growth)),
  };

  words.forEach(function (item, i) {
    const cardY = CONTENT_Y + i * (cardH + CARD_GAP);
    drawCard(pptx, slide, item,
      { x: CONTENT_X, y: cardY, w: CONTENT_W, h: cardH }, ctx, fonts);
  });
}

function drawCard(pptx, slide, item, card, ctx, fonts) {
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
  const visual = resolveVocabVisual(item.visual, ctx);
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
