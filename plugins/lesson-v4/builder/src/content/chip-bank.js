'use strict';

const { FONT, COLOURS, FIT, MIN_FONT_PT } = require('../styles');
const { fitGroupId, growFitObjectName } = require('../text-fit');

// ─── CONSTANTS ────────────────────────────────────────────────
// A bank of short labels, each drawn as its own rounded pill (chip), wrapping
// across the zone and centred. Reads instantly as "here is the set to pick
// from" — a word bank, a property-label set, an option set, sorting
// categories — where a single middot-separated string reads as fake bullets
// on one flat line. General across subjects: the chips carry whatever short
// strings the designer supplies.
//
// Layout fills the zone: chips wrap into as many rows as needed, the rows are
// stacked at a uniform pill height and centred as a block, and the pill height
// grows with the space available (clamped) so the bank is read from across the
// room. Each pill is a ROUNDED_RECTANGLE (shape) with the label as a separate
// centred addText inset by hand — never text-on-shape — so the autofit pass
// measures the text frame with margin: 0.
const PAD            = 0.12;   // inset from the zone edge, inches
const TITLE_GAP      = 0.10;   // gap below the title before the chips, inches
const CHIP_GAP_X     = 0.12;   // horizontal gap between chips, inches
const CHIP_GAP_Y     = 0.12;   // vertical gap between chip rows, inches
const CHIP_PAD_X     = 0.16;   // text inset inside a chip, left+right, inches
const CHIP_RADIUS    = 0.06;   // pill corner radius, inches
const CHIP_BORDER_W  = 1.25;   // pill outline width, points
const CHIP_H_MIN     = 0.42;   // smallest pill height, inches
const CHIP_H_MAX     = 1.50;   // largest pill height, inches
const CHIP_FONT_MIN  = 14;     // chip label font floor, points (>= MIN_FONT_PT)
const CHIP_FONT_MAX  = 54;     // chip label font ceiling, points
const FONT_RATIO     = 0.52;   // font as fraction of pill height, points
const CHAR_W_EM      = 0.62;   // Comic Sans bold char width estimate, ems
const TITLE_FONT     = 20;     // title font ceiling, points
const TITLE_H        = 0.40;   // reserved title band height, inches

// Named house variants. Each is a pale fill + a readable text colour from the
// COLOURS palette, so a bank reads as part of the set. `blue` is the neutral
// default (a property-label set); `yellow` is the warm word-bank look matching
// the White Rose word banks; `green` reuses the scaffold/vocab identity for a
// "support" bank. Default with no variant given is `blue`.
const VARIANTS = {
  blue:   { fill: COLOURS.stickyBg, line: COLOURS.title,  text: COLOURS.title },
  yellow: { fill: 'FFF2CC',         line: COLOURS.orange, text: COLOURS.body  },
  green:  { fill: COLOURS.vocabBg,  line: COLOURS.green,  text: COLOURS.body  }
};
const DEFAULT_VARIANT = 'blue';
// ─── END CONSTANTS ────────────────────────────────────────────

// Estimate the rendered width of a chip at a given font size: text width by the
// character-width estimate, plus the two-sided inner padding.
function chipWidth(label, fontPt) {
  const textW = (String(label).length * fontPt * CHAR_W_EM) / 72;
  return textW + 2 * CHIP_PAD_X;
}

// Greedily pack chips into rows no wider than maxW. Returns an array of rows,
// each row an array of { label, w }.
function packRows(chips, fontPt, maxW) {
  const rows = [];
  let row = [];
  let rowW = 0;
  chips.forEach(function (label) {
    const w = Math.min(chipWidth(label, fontPt), maxW); // a single over-long chip caps at the zone width
    const add = row.length === 0 ? w : w + CHIP_GAP_X;
    if (row.length > 0 && rowW + add > maxW) {
      rows.push(row);
      row = [{ label: label, w: w }];
      rowW = w;
    } else {
      row.push({ label: label, w: w });
      rowW += add;
    }
  });
  if (row.length > 0) rows.push(row);
  return rows;
}

function drawChipBank(pptx, slide, zone, data) {
  const chips = (Array.isArray(data.chips) ? data.chips : [])
    .map(function (c) { return String(c == null ? '' : c); })
    .filter(function (c) { return c !== ''; });
  if (chips.length === 0) return;

  const variant = VARIANTS[data.variant] || VARIANTS[DEFAULT_VARIANT];
  const title = (data.title != null && String(data.title) !== '') ? String(data.title) : null;
  const chipTextGroup = fitGroupId(zone, 'chip-labels');

  const innerX = zone.x + PAD;
  const innerW = Math.max(0.5, zone.w - 2 * PAD);
  let innerY = zone.y + PAD;
  let innerH = Math.max(0.3, zone.h - 2 * PAD);

  // Title sits in its own reserved band above the chips, in the variant colour,
  // so the bank announces itself ("Word bank") without crowding the chips.
  if (title) {
    slide.addText(title, {
      x: innerX, y: innerY, w: innerW, h: TITLE_H,
      fontFace: FONT, fontSize: TITLE_FONT, bold: true,
      color: variant.line, align: 'left', valign: 'middle', margin: 0, fit: FIT
    });
    innerY += TITLE_H + TITLE_GAP;
    innerH -= TITLE_H + TITLE_GAP;
  }

  // Pick the largest font that lays the chips out within the available height:
  // pack rows, compute the stacked block height at the candidate pill height,
  // and step the font down until the block fits (or we hit the floor). This is
  // what lets a short bank grow big and a long wrapping bank stay legible.
  // `maxRows` (optional) also caps the row count: the whole bank shares one
  // font, so a bank that must stay on one line steps its shared size down
  // until every chip fits that line — or fails loudly at the readable floor,
  // because silently wrapping after promising one row would strand the last
  // chip exactly where the designer said it must not sit.
  const maxRows = Number.isInteger(data.maxRows) && data.maxRows > 0
    ? data.maxRows
    : null;
  const fontFloor = Math.max(CHIP_FONT_MIN, MIN_FONT_PT);
  let fontPt = CHIP_FONT_MAX;
  let rows, chipH, blockH;
  for (;;) {
    rows = packRows(chips, fontPt, innerW);
    chipH = Math.max(CHIP_H_MIN, Math.min(CHIP_H_MAX, (fontPt / FONT_RATIO) / 72));
    blockH = rows.length * chipH + (rows.length - 1) * CHIP_GAP_Y;
    const rowCountFits = maxRows === null || rows.length <= maxRows;
    if ((rowCountFits && blockH <= innerH) || fontPt <= fontFloor) break;
    fontPt -= 1;
  }
  if (maxRows !== null && rows.length > maxRows) {
    throw new Error(
      `CHIP_BANK_ROW_CAPACITY: ${chips.length} chips do not fit within ` +
      `${maxRows} row(s) at the readable font floor.`
    );
  }
  // If even the floor font overflows the height, clamp the pill height so the
  // block still fits — chips shrink rather than spilling out of the zone.
  if (blockH > innerH && rows.length > 0) {
    chipH = Math.max(CHIP_H_MIN, (innerH - (rows.length - 1) * CHIP_GAP_Y) / rows.length);
    blockH = rows.length * chipH + (rows.length - 1) * CHIP_GAP_Y;
  }
  // The clamp above has a floor, so a band too short for one readable pill
  // cannot be made to fit by shrinking. What used to happen then was that the
  // pills drew from the top of the band at their floor height and simply
  // carried on past it: on a starter slide whose stack left the bank 0.07in,
  // a whole word bank was drawn hanging off the bottom edge of the slide with
  // nothing said, and every check downstream passed because the spec was
  // sound. A bank drawn where nobody can read it is not a smaller bank, so it
  // is refused by name here and the shortfall is stated, the way an
  // undersized picture cell already is: the lever is the stack weight that set
  // this band's height, or the title the band is also carrying.
  if (blockH > innerH + 0.005) {
    const shortfall = (blockH - innerH).toFixed(2);
    throw new Error(
      `CHIP_BANK_HEIGHT_CAPACITY: ${chips.length} chips need ` +
      `${blockH.toFixed(2)}in of height at the readable font floor but the zone ` +
      `leaves ${Math.max(0, innerH).toFixed(2)}in` +
      (title ? ` once the "${title}" title band is taken out` : '') +
      `, so the bank is ${shortfall}in short and would draw outside its zone. ` +
      `Raise this block's share of the stack (or drop the title) to give the bank ` +
      `at least ${(blockH + 2 * PAD + (title ? TITLE_H + TITLE_GAP : 0)).toFixed(2)}in.`
    );
  }

  // Centre the whole block vertically in the available height.
  let rowY = innerY + Math.max(0, (innerH - blockH) / 2);
  const chipFont = Math.max(Math.max(CHIP_FONT_MIN, MIN_FONT_PT),
                            Math.min(CHIP_FONT_MAX, Math.round(chipH * 72 * FONT_RATIO)));

  rows.forEach(function (rowChips) {
    const rowW = rowChips.reduce(function (s, c) { return s + c.w; }, 0)
               + (rowChips.length - 1) * CHIP_GAP_X;
    let chipX = innerX + Math.max(0, (innerW - rowW) / 2); // centre each row horizontally
    rowChips.forEach(function (c) {
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: chipX, y: rowY, w: c.w, h: chipH,
        fill: { color: variant.fill },
        line: { color: variant.line, width: CHIP_BORDER_W },
        rectRadius: CHIP_RADIUS
      });
      slide.addText(c.label, {
        x: chipX, y: rowY, w: c.w, h: chipH,
        fontFace: FONT, fontSize: chipFont, bold: true,
        color: variant.text, align: 'center', valign: 'middle', margin: 0, fit: FIT,
        objectName: growFitObjectName(chipTextGroup, CHIP_FONT_MAX, 'chip-' + c.label)
      });
      chipX += c.w + CHIP_GAP_X;
    });
    rowY += chipH + CHIP_GAP_Y;
  });
}

module.exports = { drawChipBank };
