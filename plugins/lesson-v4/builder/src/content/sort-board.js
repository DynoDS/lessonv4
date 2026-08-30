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

function drawSortBoard(pptx, slide, zone, data) {
  const groups = normaliseGroups(data);
  if (groups.length < 2 || groups.length > 6) {
    throw new Error('SORT_BOARD_GROUP_COUNT: sort-board requires 2 to 6 groups.');
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
