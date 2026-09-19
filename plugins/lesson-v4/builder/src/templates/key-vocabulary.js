'use strict';

const { FONT, COLOURS, FIT, MIN_FONT_PT } = require('../styles');
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
  'continuum-line', 'mult-grid', 'place-value-chart', 'geographical-description-frame',
  'base-ten-blocks'
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
// The type grows until the card fills the share of the band it has, and stops
// there. It used to be read off a table keyed by how many cards were on the
// slide (1: 44/30, 2: 38/27, default: 34/24). The table's instinct was right -
// a lone word IS the poster and five words are not - but a table cannot see
// how long the definitions are, and it capped a two-card slide at 38/27 in a
// card with room to spare. The share does the same job honestly: five cards get
// a fifth of the band each and come out small, one card gets the band and comes
// out large, and nobody picks a number.
//
// WORD_FONT_MAX is the poster size: the biggest a vocabulary word ever prints,
// however much room it has. It is a real limit, not a safety rail. Without it a
// lone card grows until it fills the band, which is the six-inch green rectangle
// holding one word that was fixed on 5 September 2026. 44 is the size the old
// table already gave a lone card, and the size the teacher chose by hand for a
// two-card slide, so one number now serves both and the share decides the rest.
const WORD_FONT_MAX   = 44;
const WORD_FONT_MIN   = 20;
// The definition's size as a share of the word's. The old table held this at
// 26/18, about 0.69, at every row. The definition is the sentence a child
// actually reads and the word above it is one token, so the gap between them
// was wider than the job warrants: on a two-card slide the word reached 44 while
// its definition sat at 30 with the card nowhere near full. The teacher set 44
// and 36 by hand, which is 0.82, and that is the proportion used here. The
// definition never exceeds its word, because a meaning printed larger than the
// term it defines reads as the wrong way round.
const DEFN_OF_WORD    = 0.82;
// The proportion the word is FITTED at, which is the one the old table used at
// every row. Keeping the first pass modest is what stops a bigger definition
// costing the word its size on a crowded slate.
const DEFN_OF_WORD_TIGHT = 18 / 26;

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
  const fontsFor = function (wordPt, share) {
    return { word: wordPt, defn: Math.min(wordPt, Math.max(MIN_FONT_PT, Math.round(wordPt * share))) };
  };

  const visuals0 = words.map(function (item) { return resolveVocabVisual(item.visual, ctx); });
  const stacked0 = visuals0.map(function (v) { return !!v && STACKED_VISUALS.has(v.type); });
  // Grow the type until the tallest card reaches its share of the band, then
  // stop. A stacked-picture card is measured the way the heights below measure
  // it, so the size that fits is the size that will actually be drawn.
  const allFit = function (candidate) {
    return words.every(function (item, i) {
      const need = stacked0[i]
        ? stackedTextHeight(item, candidate) + LARGE_PICTURE_MIN_H
        : naturalCardHeight(item, visuals0[i], candidate, visuals0[i] ? PANEL_MAX_W : 0);
      return need <= shareH;
    });
  };

  // The word first, then the definition into what is left.
  //
  // Sizing the pair together by one proportion makes them fight: raising the
  // definition's share to what the teacher chose (0.82) took the word on a
  // four-card slide from 34pt down to 28, because a taller definition leaves
  // less room for everything. So the word is fitted first at the old, modest
  // proportion, which decides how big the term can be on a slide of this many
  // cards, and the definition is then grown on its own into whatever height is
  // still going, up to DEFN_OF_WORD. A crowded slate keeps the word size it
  // always had and a roomy one reaches 44 and 36, which is what he set by hand.
  let fonts = fontsFor(WORD_FONT_MIN, DEFN_OF_WORD_TIGHT);
  for (let pt = WORD_FONT_MAX; pt >= WORD_FONT_MIN; pt -= 1) {
    const candidate = fontsFor(pt, DEFN_OF_WORD_TIGHT);
    if (allFit(candidate)) { fonts = candidate; break; }
  }
  for (let share = DEFN_OF_WORD; share > DEFN_OF_WORD_TIGHT; share -= 0.02) {
    const candidate = fontsFor(fonts.word, share);
    if (candidate.defn > fonts.defn && allFit(candidate)) { fonts = candidate; break; }
  }

  // A card is as tall as what it holds, and the stack sits in the middle of
  // the band. Stretching every card to fill the band is right when the cards
  // are nearly full and wrong when they are not: it is what put one word in a
  // six-inch green rectangle. Three or more cards are already over their equal
  // share, so they are clipped back to it and nothing about them moves.
  const visuals = visuals0;
  const stacked = stacked0;
  const heights = words.map(function (item, i) {
    if (stacked[i]) return stackedTextHeight(item, fonts) + LARGE_PICTURE_MIN_H;
    // Measured against the widest panel the picture could take, so a panel that
    // turns out wide never leaves the definition more lines than its card holds.
    // Beside a full-width picture a compact card gives up its picture minimum
    // and hugs its words; the full-width picture needs the height more.
    const compact = stacked.some(Boolean) && (!visuals[i] || visuals[i].type === 'text');
    return Math.min(shareH, naturalCardHeight(item, compact ? null : visuals[i], fonts, visuals[i] ? PANEL_MAX_W : 0));
  });
  // Every card in a set is the height of the tallest, capped at its share.
  //
  // Sizing each card to its own words leaves the set ragged and the band short:
  // one long definition sets the type for everybody, so the shorter cards come
  // out under-filled and the stack has an inch of band left over. Matching them
  // gives the set one edge, which is what makes it read as a set, and spends the
  // leftover on the cards instead of leaving it under them. The share is still
  // the ceiling, so a full slate fills the band and no further, and a lone card
  // is the tallest of one, so it keeps hugging its own words and never stretches
  // into the six-inch green rectangle this template was fixed for.
  //
  // Stacked-picture cards are left out: their heights are already negotiated
  // against the picture minimum below, and matching them would undo it.
  if (!stacked.some(Boolean)) {
    const tallest = Math.min(shareH, Math.max.apply(null, heights));
    for (let i = 0; i < heights.length; i += 1) heights[i] = tallest;
  }

  // A slate that nearly fills the band takes the last fraction rather than
  // leaving it. Growing the type stops at the largest whole point that fits, so
  // a full slate lands a few hundredths under its share and the stack would
  // centre itself, drifting the top card down the page for no reason anybody
  // asked for. Absorbing a gap this small keeps a full slate exactly where it
  // has always been. The gap is only closed when it is smaller than the space
  // between two cards: a bigger one means the cards genuinely do not fill the
  // band, and stretching them then is what put one word in a six-inch green
  // rectangle (5 September 2026).
  const slack = (CONTENT_H - totalGap) - heights.reduce(function (a, b) { return a + b; }, 0);
  if (slack > 0 && slack < CARD_GAP && !stacked.some(Boolean)) {
    const share = slack / heights.length;
    for (let i = 0; i < heights.length; i += 1) heights[i] += share;
  }

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
// actually divides itself: the word's own line, then the definition's lines.
function naturalCardHeight(item, visual, fonts, visualW) {
  const panelW = visualW || VISUAL_W;
  const textW = visual
    ? CONTENT_W - 2 * CARD_PAD - panelW - VISUAL_GAP
    : CONTENT_W - 2 * CARD_PAD;
  const wordNeeds = fonts.word * LINE_RATIO * WORD_LINE_SLACK;
  const defnNeeds =
    estimateLines(item.definition || '', fonts.defn, textW) * fonts.defn * LINE_RATIO;
  // The card is its two parts stacked, and nothing else.
  //
  // It used to be `max(wordNeeds / 0.40, defnNeeds / 0.60)`: the word was given
  // two fifths of the card whether it needed them or not, so one short word set
  // the whole card's height and the type could never grow past about 40pt
  // without the maths saying it overflowed. On a two-card slide that left the
  // word at 38pt and the definition at 27pt in a 2.36in card with nothing else
  // on the board, and the teacher raised them to 44 and 36 by hand: "there's
  // nothing else on screen apart from the vocabulary. I might as well make them
  // bigger to fill their size and the cards and the squares that they're in so
  // that they're more readable on the board." (19 September 2026.)
  const textH = wordNeeds + defnNeeds;
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

  // The word takes the one line it needs and the definition takes the rest, the
  // same division `naturalCardHeight` measured the card by. A fixed share here
  // would hand the word height it cannot use and clip the definition.
  const wordH = Math.min(textH, wordFont * LINE_RATIO * WORD_LINE_SLACK);
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

  // The grey panel is the picture's card, so the picture draws bare inside it:
  // the deck's white card look added a second inset and took a quarter of an
  // inch of height off every picture.
  const inner = {
    x: panel.x + VISUAL_PAD, y: panel.y + VISUAL_PAD,
    w: panel.w - 2 * VISUAL_PAD, h: panel.h - 2 * VISUAL_PAD,
    noCard: true
  };

  drawVisual(pptx, slide, inner, visual, ctx);
}

module.exports = { drawKeyVocabulary };
