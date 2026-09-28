'use strict';

const { FONT, COLOURS, FIT } = require('../styles');
const { fitGroupId, growFitObjectName } = require('../text-fit');

const PAD = 0.12;
const PANEL_GAP = 0.16;
const PANEL_PAD = 0.12;
const HEADER_H = 0.72;
const ITEM_GAP = 0.12;
const PANEL_RADIUS = 0.08;
const PANEL_LINE_W = 1.5;
const HEADER_FONT_MAX = 40;
const ITEM_FONT_MAX = 54;
const MIN_ITEM_H = 0.42;
const PANEL_FILLS = [
  COLOURS.stickyBg,
  'FFF2CC',
  COLOURS.vocabBg,
  'FCE4EC',
  'E8EAF6',
  'E0F2F1'
];

function normaliseGroups(data) {
  return (Array.isArray(data.groups) ? data.groups : []).map(function (group) {
    return {
      label: String(group && group.label != null ? group.label : ''),
      items: (Array.isArray(group && group.items) ? group.items : [])
        .map(function (item) { return String(item == null ? '' : item); })
        .filter(Boolean)
    };
  });
}

// ─── the sort children do: cards to sort above, places to put them below ────
//
// A sort a class does from the board used to be assembled from rows of plain
// white text cards with two more white cards along the bottom for the groups,
// so the instruction, the cards and the groups ran together as one mass of
// white boxes: "Things you'd try if you blamed the bad air" looked exactly like
// "Burn tar in the street to clean the air." (a Year 4 history deck, 28
// September 2026). The teacher wants the cards and the places they go to read
// as different things, with a clear gap between them and the instruction set
// apart from both.
//
// So `bank` draws the unsorted task: the instruction, when given, on its own
// line in task blue; the cards as white cards with a shadow, one text size for
// all of them; a clear band of space; then each group as a tinted panel with a
// dashed coloured border and its heading at the top, the rest of the panel left
// empty as the place the cards go. A bank card is a string, or `{ label, text }`
// for a card with a name above its words.

const BANK_INSTRUCTION_H = 0.52;
const BANK_INSTRUCTION_GAP = 0.18;
const BANK_GAP = 0.36;
const BANK_CARD_GAP = 0.14;
const BANK_GROUP_SHARE = 0.27;
const BANK_GROUP_MIN_H = 1.05;
const BANK_CARD_MIN_H = 0.55;
const BANK_CARD_FONT_MAX = 36;
const BANK_LABEL_FONT_MAX = 24;
const GROUP_LINES = [COLOURS.title, COLOURS.orange, COLOURS.sticky, COLOURS.green, '8E44AD', '16A085'];
const GROUP_FILLS = ['EAF2FB', 'FDEFE3', 'F1E6F8', 'E6F6EC', 'F3E5F5', 'E0F2F1'];

function normaliseBank(data) {
  return (Array.isArray(data.bank) ? data.bank : []).map(function (card) {
    if (card && typeof card === 'object') {
      return { label: card.label == null ? '' : String(card.label), text: String(card.text == null ? '' : card.text) };
    }
    return { label: '', text: String(card == null ? '' : card) };
  }).filter(function (card) { return card.text || card.label; });
}

function cardTextFits(card, w, h, pt) {
  const { wrappedLineCount } = require('../glyph-width');
  const textW = w - 2 * PANEL_PAD - 0.05;
  let textH = h - 2 * PANEL_PAD - 0.03;
  if (card.label) textH -= Math.min(0.45, (h - 2 * PANEL_PAD) * 0.3);
  const plain = card.text.replace(/\{\{|\}\}|\[\[|\]\]|<<|>>|\*\*|\|\|/g, '');
  let ems = 0;
  for (const para of plain.split('\n')) {
    const n = para.trim() ? wrappedLineCount(para, pt, textW, true) : 1;
    if (!Number.isFinite(n)) return false;
    ems += (1.2 + 1.26 * (n - 1)) * 1.02;
  }
  return ems * pt / 72 <= textH;
}

function bestArrangement(bank, innerW, bankH) {
  let best = null;
  const most = Math.min(4, bank.length);
  for (let cols = 1; cols <= most; cols += 1) {
    const rows = Math.ceil(bank.length / cols);
    const cardW = (innerW - BANK_CARD_GAP * (cols - 1)) / cols;
    const cardH = (bankH - BANK_CARD_GAP * (rows - 1)) / rows;
    let pt = 0;
    for (let size = BANK_CARD_FONT_MAX; size >= 18; size -= 1) {
      if (bank.every(function (card) { return cardTextFits(card, cardW, cardH, size); })) { pt = size; break; }
    }
    if (!best || pt > best.pt || (pt === best.pt && cols > best.cols)) {
      best = { cols: cols, rows: rows, cardW: cardW, cardH: cardH, pt: pt };
    }
  }
  return best;
}

function drawSortTask(pptx, slide, zone, data, groups) {
  const { splitAnswerRuns } = require('../answer-text');
  const bank = normaliseBank(data);
  const innerX = zone.x + PAD;
  const innerW = zone.w - 2 * PAD;
  let y = zone.y + PAD;
  let h = zone.h - 2 * PAD;

  if (data.instruction) {
    // One line at 28pt when it fits, otherwise two lines at 24pt.
    const { textBoxWidthIn } = require('../glyph-width');
    const words = String(data.instruction).replace(/\[\[|\]\]|\{\{|\}\}|<<|>>|\*\*/g, '');
    const oneLine = textBoxWidthIn(words, 28, true) <= innerW;
    const instructionH = oneLine ? BANK_INSTRUCTION_H : BANK_INSTRUCTION_H * 1.75;
    slide.addText(splitAnswerRuns(String(data.instruction), true, COLOURS.title), {
      x: innerX, y: y, w: innerW, h: instructionH,
      fontFace: FONT, fontSize: oneLine ? 28 : 24, bold: true, color: COLOURS.title,
      align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
    y += instructionH + BANK_INSTRUCTION_GAP;
    h -= instructionH + BANK_INSTRUCTION_GAP;
  }

  const groupRows = groups.length > 3 ? 2 : 1;
  // The groups keep about a quarter of the height, enough to read as a place
  // to put things; when the cards cannot print at 20pt in what is left, the
  // groups give back all but their least, because the cards are what the
  // class reads.
  let groupsH = Math.max(BANK_GROUP_MIN_H * groupRows, h * BANK_GROUP_SHARE);
  let bankH = h - BANK_GAP - groupsH;
  // The arrangement is the one that lets the cards print largest.
  let arrangement = bestArrangement(bank, innerW, bankH);
  if (arrangement.pt < 20 && groupsH > BANK_GROUP_MIN_H * groupRows) {
    groupsH = BANK_GROUP_MIN_H * groupRows;
    bankH = h - BANK_GAP - groupsH;
    arrangement = bestArrangement(bank, innerW, bankH);
  }
  const { cols, rows, cardW, cardH } = arrangement;
  if (cardH < BANK_CARD_MIN_H) {
    throw new Error(
      `SORT_BOARD_BANK_CAPACITY: ${bank.length} cards to sort in ${rows} row(s) leave each card ` +
      `${cardH.toFixed(2)}in tall, below the ${BANK_CARD_MIN_H.toFixed(2)}in one line needs. ` +
      'Give the sort a taller zone, or split it by complete groups across two slides; nothing was shrunk or cut.'
    );
  }
  const cardGroup = fitGroupId(zone, 'sort-bank-cards');
  const labelGroup = fitGroupId(zone, 'sort-bank-labels');

  bank.forEach(function (card, index) {
    const row = Math.floor(index / cols);
    const col = index % cols;
    // A last row with fewer cards is centred under the rows above it.
    const inRow = row === rows - 1 ? bank.length - row * cols : cols;
    const rowOffset = (cols - inRow) * (cardW + BANK_CARD_GAP) / 2;
    const x = innerX + rowOffset + col * (cardW + BANK_CARD_GAP);
    const cy = y + row * (cardH + BANK_CARD_GAP);
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x, y: cy, w: cardW, h: cardH,
      fill: { color: COLOURS.pureWhite },
      line: { type: 'none' },
      rectRadius: PANEL_RADIUS,
      shadow: { type: 'outer', blur: 10, offset: 1, angle: 90, color: '000000', opacity: 0.18 }
    });
    let textY = cy + PANEL_PAD;
    let textH = cardH - 2 * PANEL_PAD;
    if (card.label) {
      const labelH = Math.min(0.45, textH * 0.3);
      slide.addText(card.label, {
        x: x + PANEL_PAD, y: textY, w: cardW - 2 * PANEL_PAD, h: labelH,
        fontFace: FONT, fontSize: BANK_LABEL_FONT_MAX, bold: true, color: COLOURS.body,
        align: 'center', valign: 'middle', margin: 0, fit: FIT,
        objectName: growFitObjectName(labelGroup, BANK_LABEL_FONT_MAX, 'sort-bank-label-' + index)
      });
      textY += labelH;
      textH -= labelH;
    }
    slide.addText(splitAnswerRuns(card.text, true, COLOURS.body), {
      x: x + PANEL_PAD, y: textY, w: cardW - 2 * PANEL_PAD, h: textH,
      fontFace: FONT, fontSize: BANK_CARD_FONT_MAX, bold: true, color: COLOURS.body,
      align: card.label ? 'left' : 'center', valign: card.label ? 'top' : 'middle', margin: 0, fit: FIT,
      objectName: growFitObjectName(cardGroup, BANK_CARD_FONT_MAX, 'sort-bank-card-' + index)
    });
  });

  const groupsY = y + bankH + BANK_GAP;
  const gCols = Math.ceil(groups.length / groupRows);
  const panelW = (innerW - PANEL_GAP * (gCols - 1)) / gCols;
  const panelH = (groupsH - PANEL_GAP * (groupRows - 1)) / groupRows;
  const headerGroup = fitGroupId(zone, 'sort-board-headings');
  groups.forEach(function (group, index) {
    const row = Math.floor(index / gCols);
    const col = index % gCols;
    const x = innerX + col * (panelW + PANEL_GAP);
    const gy = groupsY + row * (panelH + PANEL_GAP);
    const line = GROUP_LINES[index % GROUP_LINES.length];
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x, y: gy, w: panelW, h: panelH,
      fill: { color: GROUP_FILLS[index % GROUP_FILLS.length] },
      line: { color: line, width: 2.25, dashType: 'dash' },
      rectRadius: PANEL_RADIUS
    });
    slide.addText(splitAnswerRuns(group.label, true, line), {
      x: x + PANEL_PAD, y: gy + PANEL_PAD * 0.5, w: panelW - 2 * PANEL_PAD,
      h: Math.min(HEADER_H, panelH * 0.45),
      fontFace: FONT, fontSize: 28, bold: true, color: line,
      align: 'center', valign: 'top', margin: 0, fit: FIT,
      objectName: growFitObjectName(headerGroup, 28, 'sort-heading-' + index)
    });
  });
}

function drawSortBoard(pptx, slide, zone, data) {
  const groups = normaliseGroups(data);
  if (groups.length < 2 || groups.length > 6) {
    throw new Error('SORT_BOARD_GROUP_COUNT: sort-board requires 2 to 6 groups.');
  }
  if (Array.isArray(data.bank)) {
    if (groups.some(function (group) { return group.items.length; })) {
      throw new Error(
        'SORT_BOARD_BANK_WITH_ANSWERS: a sort-board with a `bank` is the sort children do, so ' +
        'its groups are empty places to put the cards; the finished sort is a sort-board ' +
        'without a `bank`, its items in their groups.'
      );
    }
    return drawSortTask(pptx, slide, zone, data, groups);
  }

  const rows = groups.length > 3 ? 2 : 1;
  const cols = Math.ceil(groups.length / rows);
  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const innerH = zone.h - 2 * PAD;
  const panelW = (innerW - PANEL_GAP * (cols - 1)) / cols;
  const panelH = (innerH - PANEL_GAP * (rows - 1)) / rows;
  const headerGroup = fitGroupId(zone, 'sort-board-headings');
  const itemGroup = fitGroupId(zone, 'sort-board-items');

  groups.forEach(function (group, index) {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = innerX + col * (panelW + PANEL_GAP);
    const y = innerY + row * (panelH + PANEL_GAP);
    const fill = PANEL_FILLS[index % PANEL_FILLS.length];

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x, y: y, w: panelW, h: panelH,
      fill: { color: fill },
      line: { color: COLOURS.title, width: PANEL_LINE_W },
      rectRadius: PANEL_RADIUS
    });
    slide.addText(group.label, {
      x: x + PANEL_PAD,
      y: y + PANEL_PAD,
      w: panelW - 2 * PANEL_PAD,
      h: HEADER_H,
      fontFace: FONT,
      fontSize: HEADER_FONT_MAX,
      bold: true,
      color: COLOURS.title,
      align: 'center',
      valign: 'middle',
      margin: 0,
      fit: FIT,
      objectName: growFitObjectName(headerGroup, HEADER_FONT_MAX, 'sort-heading-' + index)
    });

    if (group.items.length === 0) return;
    const itemsY = y + PANEL_PAD + HEADER_H + ITEM_GAP;
    const itemsH = panelH - 2 * PANEL_PAD - HEADER_H - ITEM_GAP;
    const itemH = (itemsH - ITEM_GAP * (group.items.length - 1)) / group.items.length;
    if (itemH < MIN_ITEM_H) {
      throw new Error('SORT_BOARD_ITEM_CAPACITY: give the sort-board more room or split the answer.');
    }

    group.items.forEach(function (item, itemIndex) {
      const itemY = itemsY + itemIndex * (itemH + ITEM_GAP);
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: x + PANEL_PAD,
        y: itemY,
        w: panelW - 2 * PANEL_PAD,
        h: itemH,
        fill: { color: COLOURS.pureWhite },
        line: { color: COLOURS.green, width: 1.25 },
        rectRadius: PANEL_RADIUS
      });
      // The placed items ARE the revealed answers - a sort-board only ever
      // renders a completed sort - so the item words take answer green, not
      // just the box outline. No reveal marker is needed (or allowed) here.
      slide.addText(item, {
        x: x + PANEL_PAD,
        y: itemY,
        w: panelW - 2 * PANEL_PAD,
        h: itemH,
        fontFace: FONT,
        fontSize: ITEM_FONT_MAX,
        bold: true,
        color: COLOURS.green,
        align: 'center',
        valign: 'middle',
        margin: 0,
        fit: FIT,
        objectName: growFitObjectName(
          itemGroup,
          ITEM_FONT_MAX,
          'sort-item-' + index + '-' + itemIndex
        )
      });
    });
  });
}

module.exports = { drawSortBoard };
