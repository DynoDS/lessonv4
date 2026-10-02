'use strict';

const { FONT, COLOURS, FIT } = require('../styles');
const fs = require('fs');
const { fitGroupId, growFitObjectName } = require('../text-fit');
const { resolveForEmbed } = require('../images/resolve');
const { drawMissingImage } = require('../images/placeholder');
const { recordMissingPicture } = require('./image');

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
const BANK_GROUP_ROOM = 0.5;
const BANK_HEADING_PT = 24;
const BANK_CARD_MIN_H = 0.55;
const BANK_CARD_FONT_MAX = 36;
const BANK_LABEL_FONT_MAX = 24;
// A pictured card prints its words at a size the class reads (28pt, giving way
// to 20pt) and gives the picture everything else, never less than half the
// card where it can, and never less than a picture the back row can make out.
const BANK_PICTURE_WORDS_PT = 28;
const BANK_PICTURE_HALF = 0.5;
const BANK_PICTURE_MIN_H = 0.9;
// The smallest picture as drawn, not the space it was given: a wide picture
// in a narrow card draws far shorter than its band, and ten pictures under an
// inch tall could not be told apart (1 October 2026).
const BANK_PICTURE_MIN_AREA = 1.2;
const BANK_PICTURE_GAP = 0.06;
const GROUP_LINES = [COLOURS.title, COLOURS.orange, COLOURS.sticky, COLOURS.green, '8E44AD', '16A085'];
const GROUP_FILLS = ['EAF2FB', 'FDEFE3', 'F1E6F8', 'E6F6EC', 'F3E5F5', 'E0F2F1'];

function normaliseBank(data) {
  return (Array.isArray(data.bank) ? data.bank : []).map(function (card) {
    if (card && typeof card === 'object') {
      return {
        label: card.label == null ? '' : String(card.label),
        text: String(card.text == null ? '' : card.text),
        imagePath: typeof card.imagePath === 'string' ? card.imagePath.trim() : ''
      };
    }
    return { label: '', text: String(card == null ? '' : card), imagePath: '' };
  }).filter(function (card) { return card.text || card.label || card.imagePath; });
}

// A card that shows a picture shows the real one, or the board says so. A sort
// whose pictures quietly dropped out would leave children sorting words the
// lesson meant them to see, or sorting blank cards.
function resolveBankPictures(bank, ctx) {
  const pictured = bank.filter(function (card) { return card.imagePath; }).length;
  if (pictured && pictured < bank.length) {
    throw new Error(
      `SORT_BOARD_BANK_PICTURE_MIXED: ${pictured} of ${bank.length} cards to sort carry a picture. ` +
      'Every card in a pictured sort carries its picture, so no card stands out from the rest; ' +
      'give each card its picture, or none.'
    );
  }
  bank.forEach(function (card, index) {
    const imagePath = card.imagePath;
    if (!imagePath) return;
    // A picture alone is hard to read from a seat: a painting of the shepherds
    // can pass for the wise men. Every picture card names what it shows, as
    // the printed card does (the teacher, 1 October 2026).
    if (!card.text.trim()) {
      throw new Error(
        `SORT_BOARD_BANK_PICTURE_UNTITLED: card ${index + 1}${card.label ? ` ("${card.label}")` : ''} is a picture with no words. ` +
        'Give it a short title naming what the picture shows (`The angels visit the shepherds`), so the class can tell the pictures apart.'
      );
    }
    const resolved = resolveForEmbed(imagePath, ctx);
    if (!resolved || !fs.existsSync(resolved)) {
      // A picture still being found holds its card's place as a grey square,
      // the way every required picture does, and is recorded as missing: the
      // composition preview runs before the pictures land and lays the sort
      // out, and the final build refuses a deck still without it.
      const slideNumber = ctx && Number.isInteger(ctx.slideIndex) ? ctx.slideIndex + 1 : undefined;
      recordMissingPicture(slideNumber, imagePath);
      card.image = { resolvedPath: null, aspect: 1, alt: card.text || card.label };
      return;
    }
    const dims = ctx && ctx.imageDims ? ctx.imageDims[imagePath] : null;
    card.image = {
      resolvedPath: resolved,
      aspect: dims && dims.w > 0 && dims.h > 0 ? dims.w / dims.h : 4 / 3,
      alt: card.text || card.label
    };
  });
  return pictured > 0;
}

// Where a words-only card's parts go: its label at the top, its words below.
function cardParts(card, h) {
  const inner = h - 2 * PANEL_PAD;
  const labelH = card.label ? Math.min(0.45, inner * 0.3) : 0;
  return { labelH: labelH, pictureH: 0, textH: inner - labelH };
}

// How tall a card's words stand at one size in one width.
function wordsHeight(card, w, pt) {
  const { wrappedLineCount } = require('../glyph-width');
  if (!card.text) return 0;
  const textW = w - 2 * PANEL_PAD - 0.05;
  const plain = card.text.replace(/\{\{|\}\}|\[\[|\]\]|<<|>>|\*\*|\|\|/g, '');
  let ems = 0;
  for (const para of plain.split('\n')) {
    const n = para.trim() ? wrappedLineCount(para, pt, textW, true) : 1;
    if (!Number.isFinite(n)) return Infinity;
    ems += (1.2 + 1.26 * (n - 1)) * 1.02;
  }
  return ems * pt / 72;
}

function cardTextFits(card, w, h, pt) {
  if (!card.text) return true;
  return wordsHeight(card, w, pt) <= cardParts(card, h).textH - 0.03;
}

// A pictured card's words: its letter, then its title, on one line where they
// fit. The letter leads the title rather than taking a line of its own, so the
// picture keeps that room.
function titleWords(card) {
  return (card.label ? card.label + '  ' : '') + card.text;
}

// Every card in a pictured sort shares one layout, so the pictures line up and
// the titles share one size: the picture, then the letter and title under it.
// The title takes the height it needs at the largest size that still leaves
// the picture half the card; failing that, at the largest size that leaves a
// picture the class can make out. `pt` is 0 when even 20pt leaves too little.
function picturedLayout(bank, w, h) {
  const rest = h - 2 * PANEL_PAD;
  const base = { labelH: 0, pictureW: w - 2 * PANEL_PAD };
  const at = function (pt) {
    const textH = Math.max.apply(null, bank.map(function (card) {
      return wordsHeight({ text: titleWords(card) }, w, pt);
    })) + 0.03;
    return Object.assign({}, base, { pt: pt, pictureH: rest - textH - BANK_PICTURE_GAP, textH: textH });
  };
  for (const floor of [Math.max(BANK_PICTURE_MIN_H, rest * BANK_PICTURE_HALF), BANK_PICTURE_MIN_H]) {
    for (let pt = BANK_PICTURE_WORDS_PT; pt >= 20; pt -= 1) {
      const layout = at(pt);
      if (layout.pictureH >= floor && smallestPictureArea(bank, layout) >= BANK_PICTURE_MIN_AREA) return layout;
    }
  }
  return Object.assign(at(20), { pt: 0 });
}

// How much of the board the smallest picture covers when each is fitted whole.
function smallestPictureArea(bank, layout) {
  if (layout.pictureW <= 0 || layout.pictureH <= 0) return 0;
  return Math.min.apply(null, bank.map(function (card) {
    const drawW = Math.min(layout.pictureW, layout.pictureH * card.image.aspect);
    return drawW * drawW / card.image.aspect;
  }));
}

function bestArrangement(bank, innerW, bankH, pictured) {
  let best = null;
  const most = Math.min(pictured ? 6 : 4, bank.length);
  for (let cols = 1; cols <= most; cols += 1) {
    const rows = Math.ceil(bank.length / cols);
    const cardW = (innerW - BANK_CARD_GAP * (cols - 1)) / cols;
    const cardH = (bankH - BANK_CARD_GAP * (rows - 1)) / rows;
    if (pictured) {
      // A pictured sort is read through its pictures: among the arrangements
      // whose words still print at 20pt, the one with the largest smallest
      // picture wins.
      const layout = picturedLayout(bank, cardW, cardH);
      const picture = layout.pt ? smallestPictureArea(bank, layout) : 0;
      const better = !best || (layout.pt > 0) > (best.pt > 0) ||
        ((layout.pt > 0) === (best.pt > 0) && (picture > best.picture + 1e-6 ||
          (Math.abs(picture - best.picture) <= 1e-6 && layout.pt > best.pt)));
      if (better) best = { cols: cols, rows: rows, cardW: cardW, cardH: cardH, pt: layout.pt, picture: picture, layout: layout };
      continue;
    }
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

function drawSortTask(pptx, slide, zone, data, groups, ctx) {
  const { splitAnswerRuns } = require('../answer-text');
  const bank = normaliseBank(data);
  const pictured = resolveBankPictures(bank, ctx);
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

  // On the board nothing is put in a place: the class says or the teacher
  // writes the card's letter. So a place is its heading and room for a letter,
  // no more, and the places take one row or two, whichever is shorter; every
  // inch they do not need goes to the cards. Empty places a quarter of the
  // slide deep were dead space the teacher pointed at (1 October 2026).
  const placesIn = function (rowsOfPlaces) {
    const across = Math.ceil(groups.length / rowsOfPlaces);
    const width = (innerW - PANEL_GAP * (across - 1)) / across;
    const heading = Math.max.apply(null, groups.map(function (group) {
      return wordsHeight({ text: group.label }, width, BANK_HEADING_PT);
    })) + PANEL_PAD * 0.5;
    const panel = heading + BANK_GROUP_ROOM;
    return { rows: rowsOfPlaces, cols: across, panelW: width, headingNeed: heading,
      height: rowsOfPlaces * panel + PANEL_GAP * (rowsOfPlaces - 1) };
  };
  const oneRow = placesIn(1);
  const places = groups.length > 3 && Number.isFinite(oneRow.height)
    ? [oneRow, placesIn(2)].sort(function (a, b) { return a.height - b.height; })[0]
    : (Number.isFinite(oneRow.height) ? oneRow : placesIn(2));
  const groupRows = places.rows;
  const gCols = places.cols;
  const panelW = places.panelW;
  const headingNeed = places.headingNeed;
  const groupsH = places.height;
  const bankH = h - BANK_GAP - groupsH;
  // The arrangement is the one that lets the cards print largest; a pictured
  // sort's is the one with the largest pictures whose words still read.
  const arrangement = bestArrangement(bank, innerW, bankH, pictured);
  const { cols, rows, cardW, cardH } = arrangement;
  if (pictured && !arrangement.pt) {
    throw new Error(
      `SORT_BOARD_BANK_PICTURE_CAPACITY: ${bank.length} pictured cards leave the smallest picture ` +
      `${smallestPictureArea(bank, arrangement.layout).toFixed(2)} square inches once its title prints at 20pt, below the ` +
      `${BANK_PICTURE_MIN_AREA.toFixed(2)} (about 1.3in by 0.9in) a class can make out from their seats. Use fewer cards, give the sort a taller zone, ` +
      'shorten the words under the pictures, or split it by complete groups across two slides; nothing was shrunk or cut.'
    );
  }
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
    const parts = pictured ? arrangement.layout : cardParts(card, cardH);
    let textY = cy + PANEL_PAD;
    if (card.image) {
      // The whole picture, centred in its band, never stretched or cropped.
      const drawW = Math.min(parts.pictureW, parts.pictureH * card.image.aspect);
      const drawH = drawW / card.image.aspect;
      if (!card.image.resolvedPath) {
        drawMissingImage(slide, { x: x + (cardW - drawW) / 2, y: textY + (parts.pictureH - drawH) / 2, w: drawW, h: drawH });
      } else slide.addImage({
        path: card.image.resolvedPath,
        x: x + (cardW - drawW) / 2,
        y: textY + (parts.pictureH - drawH) / 2,
        w: drawW, h: drawH,
        altText: card.image.alt,
        objectName: 'sort-bank-picture-' + index
      });
      textY += parts.pictureH + BANK_PICTURE_GAP;
      // The letter leads the title in house blue, so it reads as the name
      // children say and the title as what the picture shows.
      const title = splitAnswerRuns(card.text, true, COLOURS.body);
      const runs = (card.label ? [{ text: card.label + '  ', options: { color: COLOURS.title, bold: true } }] : [])
        .concat(typeof title === 'string' ? [{ text: title, options: { color: COLOURS.body, bold: true } }] : title);
      slide.addText(runs, {
        x: x + PANEL_PAD, y: textY, w: cardW - 2 * PANEL_PAD, h: parts.textH,
        fontFace: FONT, fontSize: BANK_CARD_FONT_MAX, bold: true, color: COLOURS.body,
        align: 'center', valign: 'middle', margin: 0, fit: FIT,
        objectName: growFitObjectName(cardGroup, BANK_CARD_FONT_MAX, 'sort-bank-card-' + index)
      });
      return;
    }
    if (card.label) {
      slide.addText(card.label, {
        x: x + PANEL_PAD, y: textY, w: cardW - 2 * PANEL_PAD, h: parts.labelH,
        fontFace: FONT, fontSize: BANK_LABEL_FONT_MAX, bold: true, color: COLOURS.body,
        align: 'center', valign: 'middle', margin: 0, fit: FIT,
        objectName: growFitObjectName(labelGroup, BANK_LABEL_FONT_MAX, 'sort-bank-label-' + index)
      });
      textY += parts.labelH;
    }
    slide.addText(splitAnswerRuns(card.text, true, COLOURS.body), {
      x: x + PANEL_PAD, y: textY, w: cardW - 2 * PANEL_PAD, h: parts.textH,
      fontFace: FONT, fontSize: BANK_CARD_FONT_MAX, bold: true, color: COLOURS.body,
      align: card.label ? 'left' : 'center', valign: card.label ? 'top' : 'middle', margin: 0, fit: FIT,
      objectName: growFitObjectName(cardGroup, BANK_CARD_FONT_MAX, 'sort-bank-card-' + index)
    });
  });

  const groupsY = y + bankH + BANK_GAP;
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
      h: headingNeed,
      fontFace: FONT, fontSize: 28, bold: true, color: line,
      align: 'center', valign: 'top', margin: 0, fit: FIT,
      objectName: growFitObjectName(headerGroup, 28, 'sort-heading-' + index)
    });
  });
}

function drawSortBoard(pptx, slide, zone, data, ctx) {
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
    return drawSortTask(pptx, slide, zone, data, groups, ctx);
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
