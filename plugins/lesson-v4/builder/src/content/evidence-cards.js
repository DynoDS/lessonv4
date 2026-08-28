'use strict';

const { FONT, COLOURS, FIT, CARD } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');
const { fitGroupId, growFitObjectName } = require('../text-fit');
const { drawImage } = require('./image');

const PAD = 0.12;
const CARD_GAP = 0.18;
const CARD_PAD = 0.12;
const ANSWER_GAP = 0.10;
const ANSWER_RATIO = 0.38;
const ANSWER_FONT_MAX = 36;

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
    return field.label + ': ||' + field.value;
  }).join('\n');
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
  const cardW = (innerW - CARD_GAP * (cols - 1)) / cols;
  const cardH = (innerH - CARD_GAP * (rows - 1)) / rows;
  const answerGroup = fitGroupId(zone, 'evidence-card-answers');

  items.forEach(function (item, index) {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = innerX + col * (cardW + CARD_GAP);
    const y = innerY + row * (cardH + CARD_GAP);
    const hasAnswer = item.fields.length > 0;
    const answerH = hasAnswer ? cardH * ANSWER_RATIO : 0;
    const imageH = cardH - 2 * CARD_PAD - answerH - (hasAnswer ? ANSWER_GAP : 0);

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
