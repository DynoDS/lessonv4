'use strict';

const { FONT, COLOURS, FIT, CARD } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');
const { fitGroupId, growFitObjectName } = require('../text-fit');
const { drawImage, imageAspect } = require('./image');
const { textBoxWidthIn } = require('../glyph-width');

const PAD = 0.12;
const CARD_GAP = 0.18;
const CARD_PAD = 0.12;
const ANSWER_GAP = 0.10;
// Reserve the space the field text actually needs. Blank response fields are
// read as prompts, not written on the projected board; they do not earn an
// arbitrary majority of the card at the expense of the evidence being studied.
const ANSWER_FONT_MAX = 28;
// Each field is its own point for a child's eye to land on, so the lines get
// paragraph spacing rather than stacking as one fused block.
const FIELD_PARA_SPACE = 8;
// A lone card in a wide zone hugs the photograph it holds instead of spanning
// the zone with white either side: a card boundary materially wider than the
// picture says the picture is smaller than it is, and the contain fit means the
// extra width can never be used by the image anyway. The floor keeps room for
// the field lines under a tall portrait photo.
const SINGLE_CARD_MIN_RATIO = 0.5;

function normaliseItems(data) {
  return (Array.isArray(data.items) ? data.items : []).map(function (item) {
    return {
      imagePath: item && item.imagePath ? String(item.imagePath) : '',
      fit: item && item.fit === 'cover' ? 'cover' : 'contain',
      essential: !(item && item.essential === false),
      fields: (Array.isArray(item && item.fields) ? item.fields : []).map(function (field) {
        return {
          label: String(field && field.label != null ? field.label : ''),
          value: String(field && field.value != null ? field.value : '')
        };
      })
    };
  });
}

function answerText(fields) {
  return fields.map(function (field) {
    // A label that already ends in punctuation ("Uses electricity?") does not
    // take the joining colon on top - "Uses electricity?:" is the renderer
    // talking over the label's own voice.
    var joiner = /[?!:.]$/.test(field.label) ? ' ||' : ': ||';
    return field.label + joiner + field.value;
  }).join('\n');
}

function fieldHeight(fields, width) {
  if (!fields.length) return 0;
  const lines = fields.reduce(function (total, field) {
    const text = field.label + (field.value.trim() ? ': ' + field.value : '');
    return total + text.split('\n').reduce(function (n, line) {
      return n + Math.max(1, Math.ceil(textBoxWidthIn(line, ANSWER_FONT_MAX, true) / Math.max(0.1, width)));
    }, 0);
  }, 0);
  return lines * ANSWER_FONT_MAX * 1.3 / 72 + fields.length * FIELD_PARA_SPACE / 72;
}

function drawEvidenceCards(pptx, slide, zone, data, ctx) {
  const items = normaliseItems(data);
  if (items.length < 1 || items.length > 4) {
    throw new Error('EVIDENCE_CARDS_CAPACITY: evidence-cards requires 1 to 4 complete cards.');
  }

  const rows = items.length > 2 ? 2 : 1;
  const cols = items.length === 1 ? 1 : 2;
  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD;
  let cardW = (innerW - CARD_GAP * (cols - 1)) / cols;
  const cardH = (innerH - CARD_GAP * (rows - 1)) / rows;
  let cardX0 = innerX;

  // A single card hugs the width its photograph can actually use. The image is
  // contain-fitted, so at the height its share of the card allows it has one
  // possible width; a card wider than that is white flanks, not room. Blank
  // values count as blank whether they are "" or a space, so a prompt card
  // measures as a prompt card.
  if (items.length === 1) {
    const only = items[0];
    const hasAnswer0 = only.fields.length > 0;
    const answerH0 = fieldHeight(only.fields, cardW - 2 * CARD_PAD);
    const imageH0 = cardH - 2 * CARD_PAD - answerH0 - (hasAnswer0 ? ANSWER_GAP : 0);
    const aspect = imageAspect({
      type: 'image',
      imagePath: only.imagePath,
      fit: only.fit,
      essential: only.essential
    }, ctx);
    if (aspect != null && imageH0 > 0) {
      const hugW = Math.min(
        innerW,
        Math.max(aspect * imageH0 + 2 * CARD_PAD, innerW * SINGLE_CARD_MIN_RATIO)
      );
      cardX0 = innerX + (innerW - hugW) / 2;
      cardW = hugW;
    }
  }

  const answerGroup = fitGroupId(zone, 'evidence-card-answers');

  items.forEach(function (item, index) {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = cardX0 + col * (cardW + CARD_GAP);
    const y = innerY + row * (cardH + CARD_GAP);
    const hasAnswer = item.fields.length > 0;
    const answerH = fieldHeight(item.fields, cardW - 2 * CARD_PAD);
    const imageH = cardH - 2 * CARD_PAD - answerH - (hasAnswer ? ANSWER_GAP : 0);
    if (imageH < 0.9) {
      throw new Error('EVIDENCE_CARDS_CAPACITY: field text leaves less than 0.9in for its evidence. Give the card more room or show fewer cards; do not shrink the evidence to fit labels.');
    }

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x, y: y, w: cardW, h: cardH,
      fill: { color: CARD.fill },
      line: { color: COLOURS.title, width: 1.25 },
      rectRadius: CARD.radius,
      shadow: Object.assign({}, CARD.shadow)
    });

    drawImage(pptx, slide, {
      x: x + CARD_PAD,
      y: y + CARD_PAD,
      w: cardW - 2 * CARD_PAD,
      h: imageH,
      class: zone.class,
      noCard: true
    }, {
      type: 'image',
      imagePath: item.imagePath,
      fit: item.fit,
      essential: item.essential
    }, ctx);

    if (!hasAnswer) return;
    slide.addText(splitAnswerRuns(answerText(item.fields), true), {
      x: x + CARD_PAD,
      y: y + cardH - CARD_PAD - answerH,
      w: cardW - 2 * CARD_PAD,
      h: answerH,
      fontFace: FONT,
      fontSize: ANSWER_FONT_MAX,
      bold: true,
      color: COLOURS.body,
      align: 'left',
      valign: 'middle',
      margin: 0,
      breakLine: false,
      paraSpaceAfter: FIELD_PARA_SPACE,
      fit: FIT,
      objectName: growFitObjectName(
        answerGroup,
        ANSWER_FONT_MAX,
        'evidence-answer-' + index
      )
    });
  });
}

module.exports = { drawEvidenceCards };
