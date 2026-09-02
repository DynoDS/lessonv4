'use strict';

const { FONT, FIT, CARD, COLOURS } = require('../styles');
const { categoryColourFor } = require('../category-colours');
const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');

// ─── COORDINATES ──────────────────────────────────────────────
const CARD_GAP        = 0.30;
const CARD_PAD        = 0.18;
const HEADING_H       = 0.60;
const HEADING_FONT    = 24;

const LEFT_CATEGORY  = 'blue';
const RIGHT_CATEGORY = 'orange';
// ─── END COORDINATES ──────────────────────────────────────────

function drawTeachCompare(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

  const cardW = (bz.w - CARD_GAP) / 2;
  const leftX = bz.x;
  const rightX = bz.x + cardW + CARD_GAP;

  // When the two sides are taught vocabulary rather than opposing categories
  // (complete / incomplete, translucent / opaque), the headings are vocabulary
  // headwords and take the deck's vocabulary green instead of the template's
  // category palette — blue-versus-orange over two vocabulary words reads as
  // two competing categories when the words are equals.
  const vocabHeadings =
    String(data.headingRole || '').toLowerCase() === 'vocabulary';
  const headingColor = vocabHeadings ? COLOURS.green : null;

  drawCard(pptx, slide, {
    x: leftX, y: bz.y, w: cardW, h: bz.h
  }, data.leftHeading, data.leftContent, {
    categoryColor: LEFT_CATEGORY, headingColor: headingColor
  }, ctx);

  drawCard(pptx, slide, {
    x: rightX, y: bz.y, w: cardW, h: bz.h
  }, data.rightHeading, data.rightContent, {
    categoryColor: RIGHT_CATEGORY, headingColor: headingColor
  }, ctx);
}

function drawCard(pptx, slide, card, heading, content, style, ctx) {
  const categoryLine = categoryColourFor(content && content.categoryColor)
    || categoryColourFor(style.categoryColor);
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: card.x, y: card.y, w: card.w, h: card.h,
    fill: { color: CARD.fill },
    line: { color: categoryLine, width: CARD.categoryLineW },
    rectRadius: CARD.radius,
    shadow: Object.assign({}, CARD.shadow)
  });

  if (heading) {
    slide.addText(heading, {
      x: card.x + CARD_PAD, y: card.y + CARD_PAD,
      w: card.w - 2 * CARD_PAD, h: HEADING_H,
      fontFace: FONT, fontSize: HEADING_FONT, bold: true,
      color: style.headingColor || categoryLine, align: 'center', valign: 'middle',
      underline: { style: 'sng' }, margin: 0, fit: FIT
    });
  }

  if (content) {
    const contentZone = {
      x: card.x + CARD_PAD,
      y: card.y + CARD_PAD + HEADING_H + 0.05,
      w: card.w - 2 * CARD_PAD,
      h: card.h - 2 * CARD_PAD - HEADING_H - 0.05,
      class: 'C',
      noCard: true // the compare card is this zone's surface
    };
    drawContent(pptx, slide, contentZone, content, ctx);
  }
}

module.exports = { drawTeachCompare, drawCard };
