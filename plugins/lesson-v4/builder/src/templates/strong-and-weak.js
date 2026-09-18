'use strict';

const { FONT, FIT, CARD, COLOURS } = require('../styles');
const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent, measureContentExtent } = require('../content');

// The launch's good instance beside the weak one.
//
// This is the one board where the class is TOLD which of two things is the
// better one, so it is the one board that marks them. A concept-attainment
// contrast is the opposite move and keeps its own templates: `compare-words`
// and `compare-pictures` set a wrong idea beside the truth in matching blue and
// orange cards and leave the deciding to the child, and `triangle-nonexample`
// deliberately draws its non-example unmarked for the same reason. Marking one
// of those would answer the question the slide is asking.
//
// Before this template existed the pair was written into one prose string, and
// three Year 4 decks each invented their own arrangement of two plain white
// boxes with `Strong:` and `Weak:` typed inside the sentences - in two of them
// the weak instance landed on a different side, and on the science deck of
// 18 September 2026 the two boxes shared the slide with thirty-four words of
// recap above and forty-six words of prose below explaining a contrast the
// boxes were already showing.

// ─── COORDINATES ──────────────────────────────────────────────
const GAP_Y          = 0.12;
const CARD_GAP       = 0.30;
const CARD_PAD       = 0.18;
const HEADING_H      = 0.62;
const HEADING_FONT   = 24;
const MARK_H         = 0.44;
const MARK_GAP       = 0.14;
const ESTABLISHED_H  = 0.70;
const DIFFERENCE_H   = 0.82;
const DIFFERENCE_FONT = 24;
// ─── END COORDINATES ──────────────────────────────────────────

const SIZE_GROUP = 'strong-and-weak';

// A plain tick and a plain cross, drawn as two strokes each inside a square box
// of side `h`, positioned as fractions of it.
//
// Drawn rather than typed: an emoji is at the mercy of whatever font the opening
// machine substitutes, and of the colours that font chose - the plain heavy tick
// and the ticked box both arrive purple in Segoe UI Emoji, which is already the
// deck's sticky-knowledge colour, and the boxed tick brings a green background
// the card does not want. Drawn rather than taken from `assets/signals`, because
// the drawn tick in that set already means "mark your work".
const MARK_STROKE = 6;
const TICK_STROKES = [
  { x1: 0.10, y1: 0.52, x2: 0.40, y2: 0.82 },
  { x1: 0.40, y1: 0.82, x2: 0.92, y2: 0.16 }
];
const CROSS_STROKES = [
  { x1: 0.14, y1: 0.14, x2: 0.86, y2: 0.86 },
  { x1: 0.14, y1: 0.86, x2: 0.86, y2: 0.14 }
];

function drawMark(pptx, slide, strokes, box, colour) {
  strokes.forEach((stroke) => {
    const x1 = box.x + stroke.x1 * box.h;
    const y1 = box.y + stroke.y1 * box.h;
    const x2 = box.x + stroke.x2 * box.h;
    const y2 = box.y + stroke.y2 * box.h;
    const opts = {
      x: Math.min(x1, x2),
      w: Math.max(0.01, Math.abs(x2 - x1)),
      line: { color: colour, width: MARK_STROKE }
    };
    if (y2 >= y1) { opts.y = y1; opts.h = Math.max(0.01, y2 - y1); }
    else { opts.y = y2; opts.h = Math.max(0.01, y1 - y2); opts.flipV = true; }
    slide.addShape(pptx.shapes.LINE, opts);
  });
}

// The weak instance is red all the way through, and the builder does it rather
// than the designer, so a launch cannot ship with one side tinted and the other
// not. Emphasis marks come off with it: vocabulary green inside a red card
// would be the taught word looking like the one thing on the slide that is
// right about a card the class has just been told is the weak one.
function tintWeak(node) {
  if (Array.isArray(node)) return node.map(tintWeak);
  if (!node || typeof node !== 'object') return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === 'emphasis') continue;
    out[key] = tintWeak(value);
  }
  if (out.type === 'text' || out.type === 'bullets' || out.type === 'steps') {
    out.color = COLOURS.problem;
  }
  return out;
}

// Both instances settle on one text size, so the shorter weak one is not left
// shouting beside the strong one it is supposed to lose to.
function withSizeGroup(node) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return node;
  if (node.type !== 'text' || node.sizeGroup) return node;
  return Object.assign({}, node, { sizeGroup: SIZE_GROUP });
}

function drawVerdictCard(pptx, slide, card, opts, ctx) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: card.x, y: card.y, w: card.w, h: card.h,
    fill: { color: CARD.fill },
    line: { color: opts.seam, width: CARD.categoryLineW },
    rectRadius: CARD.radius,
    shadow: Object.assign({}, CARD.shadow)
  });

  const markW = MARK_H;
  const headingX = card.x + CARD_PAD + markW + MARK_GAP;
  drawMark(pptx, slide, opts.strokes, {
    x: card.x + CARD_PAD,
    y: card.y + CARD_PAD + (HEADING_H - MARK_H) / 2,
    h: MARK_H
  }, opts.markColour);

  if (opts.heading) {
    slide.addText(opts.heading, {
      x: headingX, y: card.y + CARD_PAD,
      w: card.x + card.w - CARD_PAD - headingX,
      h: HEADING_H,
      fontFace: FONT, fontSize: HEADING_FONT, bold: true,
      color: opts.headingColour, align: 'left', valign: 'middle',
      margin: 0, fit: FIT
    });
  }

  if (opts.content) {
    drawContent(pptx, slide, {
      x: card.x + CARD_PAD,
      y: card.y + CARD_PAD + HEADING_H + 0.06,
      w: card.w - 2 * CARD_PAD,
      h: card.h - 2 * CARD_PAD - HEADING_H - 0.06,
      class: 'C',
      noCard: true, // the verdict card is this zone's surface
      valignTop: true // both instances start under their heading, so a child
                      // reads the pair line against line
    }, opts.content, ctx);
  }
}

function drawStrongAndWeak(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

  const hasEstablished = Boolean(data.established);
  const hasDifference = Boolean(data.difference);
  const topH = hasEstablished ? ESTABLISHED_H : 0;
  const bottomH = hasDifference ? DIFFERENCE_H : 0;
  const cardsY = bz.y + (hasEstablished ? topH + GAP_Y : 0);
  const cardsH = bz.h
    - (hasEstablished ? topH + GAP_Y : 0)
    - (hasDifference ? bottomH + GAP_Y : 0);

  if (hasEstablished) {
    slide.addText(String(data.established), {
      x: bz.x, y: bz.y, w: bz.w, h: topH,
      fontFace: FONT, fontSize: DIFFERENCE_FONT,
      color: COLOURS.body, align: 'center', valign: 'middle',
      margin: 0, fit: FIT
    });
  }

  const cardW = (bz.w - CARD_GAP) / 2;
  const strongContent = withSizeGroup(data.strong);
  const weakContent = withSizeGroup(tintWeak(data.weak));

  // Two one-line instances in two full-height cards is most of the board left
  // white. Measure what each side actually needs and let the pair hug it, both
  // cards at the taller of the two so they stay a matched pair, and never above
  // the room the body has.
  const innerW = cardW - 2 * CARD_PAD;
  const probeZone = { x: bz.x + CARD_PAD, y: cardsY, w: innerW, h: cardsH, class: 'C', noCard: true };
  const needed = [strongContent, weakContent].map(
    (content) => measureContentExtent(probeZone, content, ctx)
  );
  const cardsDrawnH = needed.every((n) => n && n.h > 0)
    ? Math.min(cardsH, Math.max(...needed.map((n) => n.h)) + 2 * CARD_PAD + HEADING_H + 0.06)
    : cardsH;

  // A pair that does not fill its band sits centred in it rather than pinned to
  // the top with the rest of the slide empty underneath.
  const cardsTop = cardsY + Math.max(0, (cardsH - cardsDrawnH) / 2);

  drawVerdictCard(pptx, slide, {
    x: bz.x, y: cardsTop, w: cardW, h: cardsDrawnH
  }, {
    heading: data.strongHeading,
    content: strongContent,
    // The card's edge is green and its words stay black, so the taught words
    // inside it keep their own green without the card competing with them.
    seam: COLOURS.green,
    headingColour: COLOURS.body,
    markColour: COLOURS.green,
    strokes: TICK_STROKES
  }, ctx);

  drawVerdictCard(pptx, slide, {
    x: bz.x + cardW + CARD_GAP, y: cardsTop, w: cardW, h: cardsDrawnH
  }, {
    heading: data.weakHeading,
    content: weakContent,
    seam: COLOURS.problem,
    headingColour: COLOURS.problem,
    markColour: COLOURS.problem,
    strokes: CROSS_STROKES
  }, ctx);

  if (hasDifference) {
    slide.addText(String(data.difference), {
      x: bz.x, y: bz.y + bz.h - bottomH, w: bz.w, h: bottomH,
      fontFace: FONT, fontSize: DIFFERENCE_FONT, bold: true,
      color: COLOURS.body, align: 'center', valign: 'middle',
      margin: 0, fit: FIT
    });
  }
}

module.exports = { drawStrongAndWeak };
