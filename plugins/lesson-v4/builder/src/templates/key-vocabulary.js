'use strict';

const { FONT, COLOURS, FIT } = require('../styles');
const { drawHeader } = require('../headers');
const { drawVisual, resolveVocabVisual } = require('../content/vocab');
const { estimateLines } = require('../content/text');
const { getWarnings, restoreWarnings } = require('../warnings');
const PptxGenJS = require('../require-global')('pptxgenjs');

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

// A card takes any picture the deck can draw, so the picture decides its room.
// The panel used to be a fixed 2.2" square and anything that could not live in
// it was refused, which is how a Year 4 vocabulary slide about intervals was
// hand-built from free stacks instead of these cards (12 September 2026).
//
// Two decisions, both made from the picture itself:
//
//   Width. The picture is drawn once into a throwaway slide at the card's real
//   height and the widest panel allowed, and the panel takes the width its ink
//   actually used. A clock stays a square; a number line or a bar model takes
//   the length it reads along. A new helper is sized the same way the day it
//   is added, so nobody has to remember to put it on a list.
//
//   Height. A card carrying a picture takes the slide's spare height, shared
//   with the other picture cards, so a clock on a three-word slide is not a
//   thumbnail. Cards without a picture keep hugging their text.
//
// A picture made of words and parts - a table, a question set, a sort board,
// a chart - is read across its width, so it goes UNDER the word and its
// definition at the card's full width. Beside the text its own labels fell
// under the readable floor. That is the one list here, and a type missing from
// it still draws, beside the text, at the width it uses.
const PANEL_MIN_W = 2.20;
const PANEL_MAX_W = 7.40;
const STACKED_VISUALS = new Set([
  'table', 'bullets', 'steps', 'numbered-questions', 'question-cards', 'chip-bank',
  'sc-panel', 'method-frame', 'diamond-nine', 'pyramid', 'stack', 'row', 'vocab',
  'matching', 'fishbone', 'concept-map', 'sort-board', 'evidence-cards',
  'source-pathway', 'bar-chart', 'line-graph', 'pictogram', 'timeline',
  'continuum-line', 'mult-grid', 'place-value-chart', 'geographical-description-frame'
]);
// The least room a stacked picture gets under its text before the helper's own
// capacity checks take over and say what does not fit.
const LARGE_PICTURE_MIN_H = 2.40;
// Cut back to share a crowded slide, a stacked picture still keeps this much.
const LARGE_PICTURE_FLOOR_H = 1.90;
const VISUAL_W        = PANEL_MIN_W;
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
  const stacked = visuals.map(function (v) { return !!v && STACKED_VISUALS.has(v.type); });
  const heights = words.map(function (item, i) {
    if (stacked[i]) return stackedTextHeight(item, fonts) + LARGE_PICTURE_MIN_H;
    // Measured against the widest panel the picture could take, so a panel that
    // turns out wide never leaves the definition more lines than its card holds.
    return Math.min(shareH, naturalCardHeight(item, visuals[i], fonts, visuals[i] ? PANEL_MAX_W : 0));
  });
  // Two stacked pictures each asking for their minimum can ask for more than
  // the slide has: the second card ran off the bottom. Their picture room is
  // cut back, all of them by the same share, until the stack fits; the words
  // above each picture keep their height.
  const over = heights.reduce(function (a, b) { return a + b; }, 0) - (CONTENT_H - totalGap);
  const stackedIdx = stacked.map(function (st, i) { return st ? i : -1; }).filter(function (i) { return i >= 0; });
  if (over > 0 && stackedIdx.length) {
    const room = stackedIdx.length * LARGE_PICTURE_MIN_H;
    const keep = Math.max(0, (room - over) / room);
    if (keep * LARGE_PICTURE_MIN_H < LARGE_PICTURE_FLOOR_H) {
      throw new Error(
        'VOCAB_PICTURES_TOO_BIG_FOR_ONE_SLIDE: ' +
          stackedIdx.map(function (i) { return '"' + (words[i].word || '?') + '"'; }).join(' and ') +
          ' each carry a picture read across the full card (' +
          stackedIdx.map(function (i) { return visuals[i].type; }).join(', ') +
          '), and together with the other words they leave each picture under ' +
          LARGE_PICTURE_FLOOR_H.toFixed(1) + 'in tall. Give one of these words a smaller picture, or ' +
          'introduce these words in separate vocabulary entries; nothing was shrunk past readable or dropped.'
      );
    }
    stackedIdx.forEach(function (i) { heights[i] -= LARGE_PICTURE_MIN_H * (1 - keep); });
  }
  // Picture cards share whatever height the slide has left.
  const pictureIdx = visuals.map(function (v, i) { return v && v.type !== 'text' ? i : -1; })
    .filter(function (i) { return i >= 0; });
  const spare = CONTENT_H - totalGap - heights.reduce(function (a, b) { return a + b; }, 0);
  if (spare > 0 && pictureIdx.length) {
    pictureIdx.forEach(function (i) { heights[i] += spare / pictureIdx.length; });
  }
  const stackH = heights.reduce(function (a, b) { return a + b; }, 0) + totalGap;

  let cardY = CONTENT_Y + Math.max(0, (CONTENT_H - stackH) / 2);
  words.forEach(function (item, i) {
    const card = { x: CONTENT_X, y: cardY, w: CONTENT_W, h: heights[i] };
    if (stacked[i]) drawStackedCard(pptx, slide, item, card, ctx, fonts, visuals[i]);
    else drawCard(pptx, slide, item, card, ctx, fonts, visuals[i],
      visuals[i] ? panelWidthFor(visuals[i], card.h - 2 * CARD_PAD, ctx) : PANEL_MIN_W);
    cardY += heights[i] + CARD_GAP;
  });
}

// The height this card's own contents ask for, measured the way the card
// actually divides itself: the word gets WORD_H_RATIO of the text area and the
// definition the rest, so whichever of the two is tighter sets the height.
function naturalCardHeight(item, visual, fonts, visualW) {
  const panelW = visualW || VISUAL_W;
  const textW = visual
    ? CONTENT_W - 2 * CARD_PAD - panelW - VISUAL_GAP
    : CONTENT_W - 2 * CARD_PAD;
  const wordNeeds = fonts.word * LINE_RATIO * WORD_LINE_SLACK;
  const defnNeeds =
    estimateLines(item.definition || '', fonts.defn, textW) * fonts.defn * LINE_RATIO;
  const textH = Math.max(wordNeeds / WORD_H_RATIO, defnNeeds / (1 - WORD_H_RATIO));
  const height = 2 * CARD_PAD + textH;
  return visual ? Math.max(height, MIN_CARD_H_WITH_VISUAL) : height;
}

// How wide a panel this picture uses at this height. The picture is drawn into
// a throwaway slide at the widest panel allowed and the panel keeps the width
// its ink covered. Warnings the dry draw raises are set aside: the real draw
// raises them again. A picture that cannot be drawn this way keeps the widest
// panel and the real draw reports what went wrong.
function panelWidthFor(visual, panelH, ctx) {
  if (visual.type === 'text') return PANEL_MIN_W;
  const innerH = panelH - 2 * VISUAL_PAD;
  const innerW = PANEL_MAX_W - 2 * VISUAL_PAD;
  const saved = getWarnings();
  const quiet = console.warn;
  console.warn = function () {};
  try {
    const probe = new PptxGenJS();
    probe.defineLayout({ name: 'PROBE', width: 20, height: 20 });
    probe.layout = 'PROBE';
    const slide = probe.addSlide();
    drawVisual(probe, slide, { x: 1, y: 1, w: innerW, h: innerH }, visual,
      Object.assign({}, ctx, { cardLook: false }));
    let minX = Infinity;
    let maxX = -Infinity;
    (slide._slideObjects || []).forEach(function (o) {
      const opt = o.options || {};
      if (typeof opt.x !== 'number' || typeof opt.w !== 'number') return;
      minX = Math.min(minX, opt.x);
      maxX = Math.max(maxX, opt.x + opt.w);
    });
    if (!Number.isFinite(minX)) return PANEL_MAX_W;
    const used = Math.min(innerW, maxX - minX) + 2 * VISUAL_PAD;
    return Math.max(PANEL_MIN_W, Math.min(PANEL_MAX_W, used + 0.1));
  } catch (err) {
    return PANEL_MAX_W;
  } finally {
    console.warn = quiet;
    restoreWarnings(saved);
  }
}

// The word and definition across the top of a card, at the card's full width.
function stackedTextHeight(item, fonts) {
  const textW = CONTENT_W - 2 * CARD_PAD;
  const wordH = fonts.word * LINE_RATIO * WORD_LINE_SLACK;
  const defnH = estimateLines(item.definition || '', fonts.defn, textW) * fonts.defn * LINE_RATIO;
  return 2 * CARD_PAD + wordH + defnH + VISUAL_GAP;
}

function drawStackedCard(pptx, slide, item, card, ctx, fonts, visual) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: card.x, y: card.y, w: card.w, h: card.h,
    fill: { color: CARD_FILL },
    line: { color: CARD_BORDER, width: CARD_BORDER_W },
    rectRadius: CARD_RADIUS
  });
  const textX = card.x + CARD_PAD;
  const textW = card.w - 2 * CARD_PAD;
  const wordH = fonts.word * LINE_RATIO * WORD_LINE_SLACK;
  const defnH = stackedTextHeight(item, fonts) - 2 * CARD_PAD - wordH - VISUAL_GAP;
  slide.addText(item.word || '', {
    x: textX, y: card.y + CARD_PAD, w: textW, h: wordH,
    fontFace: FONT, fontSize: fonts.word, bold: true,
    color: COLOURS.green, align: 'left', valign: 'middle', margin: 0, fit: FIT
  });
  slide.addText(item.definition || '', {
    x: textX, y: card.y + CARD_PAD + wordH, w: textW, h: defnH,
    fontFace: FONT, fontSize: fonts.defn, bold: true,
    color: COLOURS.body, align: 'left', valign: 'top', margin: 0, fit: FIT
  });
  const panelY = card.y + CARD_PAD + wordH + defnH + VISUAL_GAP;
  drawVisualPanel(pptx, slide, visual, {
    x: textX, y: panelY, w: textW, h: card.y + card.h - CARD_PAD - panelY
  }, ctx);
}

function drawCard(pptx, slide, item, card, ctx, fonts, resolvedVisual, visualW) {
  const panelW = visualW || VISUAL_W;
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
    ? card.w - 2 * CARD_PAD - panelW - VISUAL_GAP
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
      x: card.x + card.w - CARD_PAD - panelW,
      y: card.y + CARD_PAD,
      w: panelW,
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
