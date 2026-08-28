'use strict';

const { FONT, COLOURS, FIT, MIN_FONT_PT, CARD } = require('../styles');
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

// A question set drawn as CARDS rather than as a stacked list.
//
// The same five questions can be a numbered list in one box or five separate
// cards laid across the zone. The list is the right shape when the questions are
// long enough to need reading line by line; the cards are the right shape when
// the questions are short and the moment is a presentation one - a starter the
// class works through together, a recap, a set of quick recall questions. Five
// short sums rendered as a numbered text list is a paragraph of furniture: it
// fills a fraction of the room it is given, and the rest of the zone goes unused.
//
// So the cards deliberately do three things a list cannot:
//   - each question gets its OWN card, sized to hug that question, so the set
//     reads as five things rather than one block of five lines;
//   - the cards stay plain white because an ordinary question list is not a set
//     of categories; the blue number badge carries the question identity;
//   - each card sits at a degree or two of tilt, alternating, so the set looks
//     placed on the board rather than printed into a grid.
//
// The cards FLOW: they pack across the zone and wrap, the type grows until the
// block fills the height it is given, and the block is centred. No single card is
// stretched to fill the zone - a card is as big as its question needs, and it is
// the SET that fills the space.
//
// Long worded problems stay in `numbered-questions`. A card sized to hug three
// lines of a word problem is just a list item with a border round it, and five of
// them wrap into a wall of boxes.

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD             = 0.12;   // inset from the zone edge, inches
const CARD_GAP_X      = 0.20;   // visible horizontal gap between cards, inches
const CARD_GAP_Y      = 0.18;   // visible vertical gap between card rows, inches.
                                // Both gaps have the tilt overshoot ADDED to them
                                // at layout time (see tiltAllowance), so these two
                                // numbers are the gap a viewer actually sees
                                // rather than a gap partly eaten by a tilted corner.
const CARD_PAD_X      = 0.18;   // text inset inside a card, left+right, inches
const CARD_PAD_Y      = 0.16;   // text inset inside a card, top+bottom, inches
const CARD_RADIUS     = 0.10;   // corner radius, inches
const CARD_FONT_MIN   = 14;     // question font floor, points (>= MIN_FONT_PT)
const CARD_FONT_MAX   = 72;     // question font ceiling, points. Deliberately far
                                // above ordinary body size: the type is the ONLY
                                // thing that makes the set fill its zone, since a
                                // card is never stretched past what its question
                                // needs. Five short sums on a full body zone at
                                // list size is the fault this helper exists to fix,
                                // so the search below starts here and steps DOWN
                                // only as far as the block needs to fit.
const LINE_H_RATIO    = 1.30;   // line height as a multiple of font size
const CHAR_W_EM       = 0.55;   // Comic Sans bold character width estimate, ems
const NO_WRAP_CHARS   = 14;     // a question this short is a bare calculation or
                                // a couple of words, and splitting one across two
                                // lines ("6 ×" / "7") reads as a broken card, not
                                // as wrapping. When one of these would wrap, the
                                // type is too big for the zone and the search below
                                // steps it down. A longer question is a sentence
                                // with real places to break, so it may wrap freely.
const CARD_MAX_ASPECT = 4.5;    // the widest a card may get before its question
                                // wraps, as a multiple of the card's own height.
                                // A card stops looking like a card once it is a
                                // long low bar, so this is what makes a longer
                                // question take a second line instead. Expressed
                                // against the card's height rather than as a share
                                // of the zone deliberately: a share would cap a
                                // card in a third-width column at half that column,
                                // forcing two slivers per row and tiny type, when
                                // one full-width card per row is what that column
                                // wants. Here a narrow zone simply lets its cards
                                // run the full width.
const BADGE_INSET     = 0.10;   // the number badge's inset from the card's
                                // top-left corner, inches
const BADGE_GAP       = 0.10;   // gap between the badge and the question text
const BADGE_D_MAX     = 0.52;   // largest badge diameter, inches
const BADGE_D_RATIO   = 1.35;   // badge diameter as a multiple of the font's
                                // height, so the circle grows with the type
const BADGE_FONT_RATIO = 0.52;  // the digit inside the badge, as a share of the
                                // badge diameter

// The per-card tilt, in degrees, cycled by card index. Signed here for
// readability; normalised to a positive angle at the point of use. Kept to two
// degrees: enough that the set reads as placed by hand, small enough that
// nobody reads it as a rendering fault.
const TILTS = [-2, 1.5, -1, 2, -1.5, 1];
const MAX_TILT = 2;             // the largest angle in TILTS, degrees — the gap
                                // and edge allowances are computed from it

// ─── END CONSTANTS ────────────────────────────────────────────

// A designer occasionally types the number into the question ("(1) What is..."),
// and the card draws its own badge, so the label would appear twice.
function stripLeadingLabel(text) {
  return String(text).replace(/^\(\s*(?:[a-z]|\d+)\s*\)\s*/i, '');
}

// The plain reading length of a question: the colour markers are instructions to
// the renderer, not characters on the board, so they must not count towards the
// card's width or the answer card comes out wider than the question card beside it.
function plainLength(text) {
  return String(text)
    .replace(/\|\|/g, ' ')
    .replace(/\*\*|\[\[|\]\]|\{\{|\}\}|<<|>>/g, '')
    .length;
}

function rotateAbout(px, py, cx, cy, deg) {
  const r = (deg * Math.PI) / 180;
  const dx = px - cx;
  const dy = py - cy;
  return {
    x: cx + dx * Math.cos(r) - dy * Math.sin(r),
    y: cy + dx * Math.sin(r) + dy * Math.cos(r)
  };
}

// PowerPoint rotates a shape about its own centre, so every piece of a tilted
// card (the card, its badge, its digit, its text) is placed by rotating that
// piece's centre about the CARD's centre and then given the same tilt itself.
// Placing the pieces unrotated and tilting each one on the spot would fan them
// apart, which is the usual way a tilted card comes out looking broken.
function placeTilted(card, w, h, cx, cy) {
  const p = rotateAbout(cx, cy, card.cx, card.cy, card.tilt);
  return { x: p.x - w / 2, y: p.y - h / 2, w: w, h: h };
}

// Measure one card at a candidate font size: how wide it wants to be, how many
// lines its question wraps onto, and therefore how tall it is.
function measureCard(question, fontPt, capW, gutterW) {
  const text       = question.text;
  const lineH      = (fontPt * LINE_H_RATIO) / 72;
  const naturalW   = (plainLength(text) * fontPt * CHAR_W_EM) / 72;
  const maxTextW   = Math.max(0.4, capW - gutterW - 2 * CARD_PAD_X);
  const textW      = Math.min(naturalW, maxTextW);
  const lines      = Math.max(1, Math.ceil(naturalW / Math.max(textW, 0.1)));
  return {
    source: question.source,
    text:  text,
    answer: question.answer,
    revealed: question.revealed,
    textW: textW,
    lines: lines,
    w:     textW + gutterW + 2 * CARD_PAD_X,
    h:     lines * lineH + 2 * CARD_PAD_Y
  };
}

// Greedily pack cards into rows no wider than maxW, keeping the designer's order.
function packRows(cards, maxW, gapX) {
  const rows = [];
  let row = [];
  let rowW = 0;
  cards.forEach(function (c) {
    const add = row.length === 0 ? c.w : c.w + gapX;
    if (row.length > 0 && rowW + add > maxW) {
      rows.push(row);
      row = [c];
      rowW = c.w;
    } else {
      row.push(c);
      rowW += add;
    }
  });
  if (row.length > 0) rows.push(row);
  return rows;
}

// A tilted card reaches beyond its own box: turning a card of width w and height
// h through θ lifts its top corner by about (w·sinθ + h·(1−cosθ))/2. Gaps and the
// zone's edges have to carry that, or a tilted corner clips its neighbour or the
// zone edge — and the bigger the type grows, the wider the card and the further
// it reaches, so the allowance is computed from the cards actually laid out
// rather than guessed at once in a constant.
function tiltAllowance(w, h) {
  const r = (MAX_TILT * Math.PI) / 180;
  return (w * Math.sin(r) + h * (1 - Math.cos(r))) / 2;
}

function drawQuestionCards(pptx, slide, zone, data, ctx) {
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

  const zoneX = zone.x + PAD;
  const zoneY = zone.y + PAD;
  const zoneW = Math.max(0.8, zone.w - 2 * PAD);
  const zoneH = Math.max(0.4, zone.h - 2 * PAD);

  const fontFloor = Math.max(CARD_FONT_MIN, MIN_FONT_PT);

  // Grow the type until the block of cards fills the height it has been given,
  // then stop. Bigger type makes each card wider, which makes the set wrap into
  // more rows, which makes the block taller — so the largest font whose block
  // still fits is the one that uses the zone. This search is the whole reason a
  // starter's five sums come out big enough to read from the carpet instead of
  // sitting at list size in a strip across the middle of an empty slide.
  let fontPt = CARD_FONT_MAX;
  let cards, rows, rowHs, badgeD, blockH, gapX, gapY, innerX, innerY, innerW, innerH, answerMetrics;
  for (;;) {
    badgeD = Math.min(BADGE_D_MAX, (fontPt * BADGE_D_RATIO) / 72);
    // The tilt allowance depends on the card size, and the card size depends on
    // the width left after the allowance — so measure once against the bare zone
    // to get a card size, then settle the allowance and lay out inside it.
    // A one-line card's height is fixed by the font, so the aspect cap resolves to
    // a width without having to know the layout yet.
    const oneLineH = (fontPt * LINE_H_RATIO) / 72 + 2 * CARD_PAD_Y;
    answerMetrics = answerBoxes ? answerBoxMetrics(fontPt, oneLineH) : null;
    const answerGutterW = answerMetrics ? answerMetrics.w + ANSWER_BOX_GAP : 0;
    const gutterW = badgeD + BADGE_GAP + answerGutterW;
    const aspectW  = CARD_MAX_ASPECT * oneLineH;
    const capSeed = Math.min(zoneW, aspectW);
    const seed    = questions.map(function (q) { return measureCard(q, fontPt, capSeed, gutterW); });
    const seedW   = seed.reduce(function (m, c) { return Math.max(m, c.w); }, 0);
    const seedH   = seed.reduce(function (m, c) { return Math.max(m, c.h); }, 0);
    const allowY  = tiltAllowance(seedW, seedH);
    const allowX  = tiltAllowance(seedH, seedW);

    innerX = zoneX + allowX;
    innerY = zoneY + allowY;
    innerW = Math.max(0.6, zoneW - 2 * allowX);
    innerH = Math.max(0.3, zoneH - 2 * allowY);
    gapX   = CARD_GAP_X + 2 * allowX;
    gapY   = CARD_GAP_Y + 2 * allowY;

    const capW = Math.min(innerW, aspectW);
    cards  = questions.map(function (q) { return measureCard(q, fontPt, capW, gutterW); });
    rows   = packRows(cards, innerW, gapX);
    // A row's cards level up to the tallest in THAT row, not to the tallest in the
    // whole set. Levelling a row keeps it tidy; levelling the whole set would make
    // a one-line card as tall as the one two-line card somewhere else in the set,
    // which is the "stretched card" the helper is supposed to avoid.
    rowHs  = rows.map(function (r) { return r.reduce(function (m, c) { return Math.max(m, c.h); }, 0); });
    blockH = rowHs.reduce(function (s, h) { return s + h; }, 0) + (rows.length - 1) * gapY;
    const splitShort = cards.some(function (c) {
      return c.lines > 1 && plainLength(c.text) <= NO_WRAP_CHARS;
    });
    if ((blockH <= innerH && !splitShort) || fontPt <= fontFloor) break;
    fontPt -= 1;
  }
  // Even at the floor font a long set can still overflow: shrink the cards
  // rather than letting the last row spill out of the zone.
  let scaledForOverflow = false;
  if (blockH > innerH && rows.length > 0) {
    scaledForOverflow = true;
    const room  = Math.max(0.32 * rows.length, innerH - (rows.length - 1) * gapY);
    const scale = room / rowHs.reduce(function (s, h) { return s + h; }, 0);
    rowHs  = rowHs.map(function (h) { return h * scale; });
    blockH = rowHs.reduce(function (s, h) { return s + h; }, 0) + (rows.length - 1) * gapY;
  }

  // Optional pictures may make cards wider, but they never buy that space by
  // reducing the question font or making a question wrap onto an extra line.
  // Try the requested pictures once at the already chosen font. If a pictured
  // card no longer fits, keep the original bare version of that layout.
  let pictureSlotW = 0;
  if (!scaledForOverflow && questions.length > 0 && questions.some(function (q) { return !!q.picture; })) {
    const pictureH = Math.max(0.28, Math.min.apply(null, rowHs) - 2 * CARD_PAD_Y);
    const pictureWidths = questions.map(function (q) {
      return q.picture ? pictureMetrics(q.picture, pictureH, ctx).w : 0;
    });
    const proposedSlotW = pictureWidths.reduce(function (m, w) { return Math.max(m, w); }, 0) + PICTURE_GAP;
    const picturedCards = cards.map(function (c, i) {
      return Object.assign({}, c, {
        w: c.w + (questions[i].picture ? proposedSlotW : 0),
        picture: questions[i].picture
      });
    });
    const picturedRows = packRows(picturedCards, innerW, gapX);
    const picturedRowHs = picturedRows.map(function (r) {
      return r.reduce(function (m, c) { return Math.max(m, c.h); }, 0);
    });
    const picturedBlockH = picturedRowHs.reduce(function (s, h) { return s + h; }, 0)
      + (picturedRows.length - 1) * gapY;
    const cardsFitWidth = picturedCards.every(function (c) { return c.w <= innerW; });
    if (cardsFitWidth && picturedBlockH <= innerH) {
      cards = picturedCards;
      rows = picturedRows;
      rowHs = picturedRowHs;
      blockH = picturedBlockH;
      pictureSlotW = proposedSlotW;
    }
  }
  const shortestRow = rowHs.reduce(function (m, h) { return Math.min(m, h); }, Infinity);
  if (badgeD > shortestRow - 2 * BADGE_INSET) {
    badgeD = Math.max(0.22, shortestRow - 2 * BADGE_INSET);
  }

  const badgeFont = Math.max(MIN_FONT_PT, Math.round(badgeD * 72 * BADGE_FONT_RATIO));
  let rowY = innerY + Math.max(0, (innerH - blockH) / 2);
  let n = 0;

  rows.forEach(function (rowCards, r) {
    const cardH = rowHs[r];
    const rowW = rowCards.reduce(function (s, c) { return s + c.w; }, 0)
               + (rowCards.length - 1) * gapX;
    let cardX = innerX + Math.max(0, (innerW - rowW) / 2); // centre each row

    rowCards.forEach(function (c) {
      const rawTilt = TILTS[n % TILTS.length];
      const tilt    = rawTilt < 0 ? rawTilt + 360 : rawTilt;
      const card    = { cx: cardX + c.w / 2, cy: rowY + cardH / 2, tilt: rawTilt };

      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, Object.assign(
        placeTilted(card, c.w, cardH, card.cx, card.cy),
        {
          fill: { color: CARD.fill },
          line: { type: 'none' },
          rectRadius: CARD_RADIUS,
          shadow: Object.assign({}, CARD.shadow),
          rotate: tilt
        }
      ));

      // The number badge, pinned inside the card's top-left corner.
      const badgeCx = cardX + BADGE_INSET + badgeD / 2;
      const badgeCy = rowY + BADGE_INSET + badgeD / 2;
      slide.addShape(pptx.ShapeType.ellipse, Object.assign(
        placeTilted(card, badgeD, badgeD, badgeCx, badgeCy),
        { fill: { color: COLOURS.title }, line: { type: 'none' }, rotate: tilt }
      ));
      slide.addText(String(n + 1), Object.assign(
        placeTilted(card, badgeD, badgeD, badgeCx, badgeCy),
        {
          fontFace: FONT, fontSize: badgeFont, bold: true,
          color: COLOURS.pureWhite, align: 'center', valign: 'middle',
          margin: 0, fit: FIT, rotate: tilt
        }
      ));

      // The question itself, in the column to the right of the badge. Kept
      // vertically centred on the card so a one-line question sits on the card's
      // middle line rather than clinging to the top under the badge.
      const answerGutterW = answerMetrics ? answerMetrics.w + ANSWER_BOX_GAP : 0;
      const ownPictureSlotW = c.picture ? pictureSlotW : 0;
      const textW  = c.w - (BADGE_INSET + badgeD + BADGE_GAP) - CARD_PAD_X
        - answerGutterW - ownPictureSlotW;
      const textCx = cardX + BADGE_INSET + badgeD + BADGE_GAP + ownPictureSlotW + textW / 2;
      const textCy = rowY + cardH / 2;

      if (ownPictureSlotW && c.picture) {
        const metrics = pictureMetrics(
          c.picture,
          Math.max(0.28, cardH - 2 * CARD_PAD_Y),
          ctx,
          ownPictureSlotW - PICTURE_GAP
        );
        const slotX = cardX + BADGE_INSET + badgeD + BADGE_GAP;
        const pictureCx = slotX + (ownPictureSlotW - PICTURE_GAP) / 2;
        const pictureCy = rowY + cardH / 2;
        drawContentPicture(
          slide,
          c.picture,
          placeTilted(card, metrics.w, metrics.h, pictureCx, pictureCy),
          { rotate: tilt, objectName: 'question-context-' + (n + 1) }
        );
      }

      const source = c.source || {};
      const baseColor = baseColourForRole(COLOURS.body, source.colorRole);

      slide.addText(presentationRuns(c.text, true, baseColor, source), Object.assign(
        placeTilted(card, textW, cardH - 2 * CARD_PAD_Y, textCx, textCy),
        {
          fontFace: FONT, fontSize: fontPt, bold: true,
          // Centred rather than left-aligned: the card is measured from an
          // estimate of the text's width, so there is always a little slack, and
          // centring splits it either side instead of pooling it all on the right
          // where it reads as a card that didn't fill.
          color: baseColor, align: 'center', valign: 'middle',
          margin: 0, fit: FIT, rotate: tilt
        }
      ));

      if (answerMetrics) {
        const boxH = Math.max(0.28, Math.min(answerMetrics.h, cardH - 0.08));
        const boxW = Math.min(answerMetrics.w, boxH);
        const boxCx = cardX + c.w - ANSWER_BOX_EDGE_INSET - boxW / 2;
        const boxCy = rowY + cardH / 2;
        drawAnswerBox(
          pptx,
          slide,
          placeTilted(card, boxW, boxH, boxCx, boxCy),
          c.answer,
          c.revealed,
          { fontSize: answerMetrics.fontSize, rotate: tilt }
        );
      }

      cardX += c.w + gapX;
      n += 1;
    });
    rowY += cardH + gapY;
  });
}

module.exports = { drawQuestionCards };
