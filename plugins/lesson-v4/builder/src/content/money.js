'use strict';

const fs = require('fs');
const path = require('path');

const { FONT, COLOURS } = require('../styles');
const { warn } = require('../warnings');
const { trimmedPathFor, fileNameFor, ASSET_DIR } = require('../images/trim-money');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD                = 0.05;   // zone inner padding (inches)
const GAP                = 0.12;   // gap between items in a row (inches)
const SPLIT_GAP          = 0.40;   // gap inserted by the "|" sentinel — produces a visible break between coin groups (inches)
const ROW_GAP            = 0.16;   // gap between wrapped rows (inches)
const MAX_BASE_H         = 1.60;   // cap for the tallest item (inches)
const SHRINK_STEP        = 0.92;   // scale factor applied when layout overflows
const MIN_SCALE          = 0.0005; // safety floor for the shrink loop
const PLACEHOLDER_CAP_PT = 10;
// ─── END CONSTANTS ────────────────────────────────────────────

// Real-world dimensions in millimetres. Coins use diameter for w and h
// (50p uses the inscribed-circle diameter). Notes use the printed banknote size.
const SIZES_MM = {
  '1p':       { w: 20.3,  h: 20.3 },
  '2p':       { w: 25.9,  h: 25.9 },
  '5p':       { w: 18.0,  h: 18.0 },
  '5p_back':  { w: 18.0,  h: 18.0 },
  '10p':      { w: 24.5,  h: 24.5 },
  '20p':      { w: 21.4,  h: 21.4 },
  '20p_back': { w: 21.4,  h: 21.4 },
  '50p':      { w: 27.3,  h: 27.3 },
  '50p_back': { w: 27.3,  h: 27.3 },
  '£1':       { w: 23.43, h: 23.43 },
  '£1_back':  { w: 23.43, h: 23.43 },
  '£2':       { w: 28.4,  h: 28.4 },
  '£2_back':  { w: 28.4,  h: 28.4 },
  '£5':       { w: 125,   h: 65 },
  '£10':      { w: 132,   h: 69 },
  '£20':      { w: 139,   h: 73 },
  '£50':      { w: 156,   h: 85 }
};

function drawMoney(pptx, slide, zone, data, ctx) {
  const rawItems = Array.isArray(data.items) ? data.items : [];
  if (rawItems.length === 0) return;

  const items = rawItems.map(function (raw) {
    const key = String(raw);
    if (key === '|') {
      return { spacer: true };
    }
    const size = SIZES_MM[key];
    if (!size) {
      warn(ctx.slideIndex, `money item "${key}" is unknown — rendering placeholder`);
      return { key: key, w_mm: 22, h_mm: 22, assetPath: null, missing: true };
    }
    const trimmed = trimmedPathFor(key);
    const assetPath = trimmed || path.join(ASSET_DIR, fileNameFor(key));
    if (!fs.existsSync(assetPath)) {
      warn(ctx.slideIndex, `money asset file missing for "${key}" — rendering placeholder`);
      return { key: key, w_mm: size.w, h_mm: size.h, assetPath: null, missing: true };
    }
    return { key: key, w_mm: size.w, h_mm: size.h, assetPath: assetPath, missing: false };
  });

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = Math.max(0, zone.w - 2 * PAD);
  const innerH = Math.max(0, zone.h - 2 * PAD);
  if (innerW <= 0 || innerH <= 0) return;

  const maxH_mm = items.reduce(function (m, it) {
    return it.spacer ? m : Math.max(m, it.h_mm);
  }, 0);
  // Cap the tallest item at MAX_BASE_H only when there are multiple coins to
  // keep — single-coin renders (e.g. "what coin is this?") need to fill the
  // zone so children can identify the coin from the back of the room.
  const realItemCount = items.filter(function (it) { return !it.spacer; }).length;
  const heightCap = realItemCount > 1 ? MAX_BASE_H : innerH;
  const targetTallest_in = Math.min(heightCap, innerH);
  let scale = maxH_mm > 0 ? targetTallest_in / maxH_mm : 0.01;

  let layout = packRows(items, innerW, innerH, scale);
  while (!layout.fits && scale > MIN_SCALE) {
    scale *= SHRINK_STEP;
    layout = packRows(items, innerW, innerH, scale);
  }

  const totalH = layout.rows.reduce(function (h, r) { return h + r.h; }, 0)
               + ROW_GAP * Math.max(0, layout.rows.length - 1);
  let cursorY = innerY + Math.max(0, (innerH - totalH) / 2);

  layout.rows.forEach(function (row) {
    const rowBottom = cursorY + row.h;
    let cursorX = innerX;
    row.entries.forEach(function (entry) {
      if (entry.item.spacer) {
        cursorX += entry.w + GAP;
        return;
      }

      const x = cursorX;
      const y = rowBottom - entry.h;   // bottom-align so coins and notes share a baseline

      if (entry.item.assetPath) {
        slide.addImage({
          path: entry.item.assetPath,
          x: x, y: y, w: entry.w, h: entry.h
        });
      } else {
        slide.addShape(pptx.shapes.RECTANGLE, {
          x: x, y: y, w: entry.w, h: entry.h,
          fill: { color: COLOURS.placeholder },
          line: { color: COLOURS.placeholderLine, width: 1 }
        });
        slide.addText(entry.item.key, {
          x: x, y: y, w: entry.w, h: entry.h,
          fontFace: FONT, fontSize: PLACEHOLDER_CAP_PT,
          color: COLOURS.body, italic: true,
          align: 'center', valign: 'middle', margin: 0,
          objectName: 'NOFIT_money-ph'
        });
      }

      cursorX += entry.w + GAP;
    });
    cursorY = rowBottom + ROW_GAP;
  });
}

function packRows(items, innerW, innerH, scale) {
  const rows = [];
  let current = { entries: [], w: 0, h: 0 };

  items.forEach(function (item) {
    const w = item.spacer ? SPLIT_GAP : item.w_mm * scale;
    const h = item.spacer ? 0          : item.h_mm * scale;
    const projectedW = current.entries.length === 0 ? w : (current.w + GAP + w);

    if (projectedW > innerW && current.entries.length > 0) {
      rows.push(current);
      current = { entries: [], w: 0, h: 0 };
    }

    if (current.entries.length === 0) {
      current.w = w;
    } else {
      current.w += GAP + w;
    }
    current.h = Math.max(current.h, h);
    current.entries.push({ item: item, w: w, h: h });
  });

  if (current.entries.length > 0) rows.push(current);

  const anyTooWide = rows.some(function (r) {
    return r.entries.some(function (e) { return e.w > innerW + 0.001; });
  });

  const totalH = rows.reduce(function (h, r) { return h + r.h; }, 0)
               + ROW_GAP * Math.max(0, rows.length - 1);

  return { rows: rows, fits: !anyTooWide && totalH <= innerH + 0.001 };
}

module.exports = { drawMoney };
