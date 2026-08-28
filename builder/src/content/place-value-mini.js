'use strict';

// Compact, card-sized place-value pictures for `key-vocabulary`.
//
// A full place-value chart is a teaching representation and is deliberately
// too dense for the 2.2-inch panel on a vocabulary card. These four small
// modes communicate one vocabulary idea at a glance instead:
//   digit-value  6 → 600
//   column       Th | H | T | O with one column highlighted
//   exchange     ten T counters → one H counter
//   placeholder  4 | 0 | 5 | 0 with zero cells highlighted

const { FONT, COLOURS, FIT } = require('../styles');

const BLUE = COLOURS.prompt;
const GREEN = COLOURS.green;
const BODY = COLOURS.body;
const WHITE = 'FFFFFF';
const PALE_BLUE = 'DDEBF7';
const PALE_GREEN = 'E2F0D9';
const PALE_YELLOW = 'FFF2CC';
const GRID = '7F8C8D';

function addText(slide, text, box, opts) {
  slide.addText(String(text), {
    x: box.x, y: box.y, w: box.w, h: box.h,
    fontFace: FONT,
    fontSize: opts.fontSize || 16,
    bold: opts.bold !== false,
    color: opts.color || BODY,
    align: opts.align || 'center',
    valign: opts.valign || 'middle',
    margin: 0,
    fit: FIT
  });
}

function drawArrow(pptx, slide, x1, y, x2) {
  slide.addShape(pptx.shapes.LINE, {
    x: x1, y, w: Math.max(0.08, x2 - x1), h: 0,
    line: { color: BLUE, width: 2, endArrowType: 'triangle' }
  });
}

function drawDigitValue(pptx, slide, zone, data) {
  const digit = data.digit != null ? data.digit : 6;
  const value = data.value != null ? data.value : 600;
  const gap = Math.min(0.34, zone.w * 0.18);
  const sideW = (zone.w - gap) / 2;
  const font = Math.max(16, Math.min(27, Math.floor(zone.h * 24)));

  addText(slide, digit, { x: zone.x, y: zone.y, w: sideW, h: zone.h }, {
    fontSize: font, color: GREEN
  });
  drawArrow(pptx, slide, zone.x + sideW + 0.02, zone.y + zone.h / 2,
    zone.x + sideW + gap - 0.02);
  addText(slide, value, {
    x: zone.x + sideW + gap, y: zone.y, w: sideW, h: zone.h
  }, { fontSize: font, color: BLUE });
}

function normaliseColumn(value) {
  const raw = String(value || 'H').trim().toLowerCase();
  if (raw === 'th' || raw.startsWith('thousand')) return 'Th';
  if (raw === 'h' || raw.startsWith('hundred')) return 'H';
  if (raw === 't' || raw.startsWith('ten')) return 'T';
  return 'O';
}

function drawColumn(pptx, slide, zone, data) {
  const labels = ['Th', 'H', 'T', 'O'];
  const selected = normaliseColumn(data.column);
  const cellW = zone.w / labels.length;
  const y = zone.y + zone.h * 0.16;
  const h = zone.h * 0.68;
  const font = Math.max(11, Math.min(18, Math.floor(cellW * 18)));

  labels.forEach(function (label, i) {
    const active = label === selected;
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: zone.x + i * cellW, y, w: cellW, h,
      fill: { color: active ? PALE_GREEN : WHITE },
      line: { color: active ? GREEN : GRID, width: active ? 2 : 1 }
    });
    addText(slide, label, { x: zone.x + i * cellW, y, w: cellW, h }, {
      fontSize: font, color: active ? GREEN : BODY
    });
  });
}

function drawCounter(pptx, slide, x, y, d, fill, label, fontSize) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x, y, w: d, h: d,
    fill: { color: fill },
    line: { color: GRID, width: 0.7 }
  });
  if (label) {
    addText(slide, label, { x, y, w: d, h: d }, {
      fontSize, color: BODY
    });
  }
}

function drawExchange(pptx, slide, zone) {
  const leftW = zone.w * 0.43;
  const arrowW = zone.w * 0.18;
  const rightX = zone.x + leftW + arrowW;
  const smallD = Math.min(leftW / 5.5, zone.h / 3.4);
  const gridW = smallD * 5;
  const gridH = smallD * 2;
  const gridX = zone.x + (leftW - gridW) / 2;
  const gridY = zone.y + (zone.h - gridH) / 2;

  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      drawCounter(pptx, slide, gridX + col * smallD, gridY + row * smallD,
        smallD * 0.82, PALE_YELLOW, '', 8);
    }
  }

  drawArrow(pptx, slide, zone.x + leftW + 0.02, zone.y + zone.h / 2,
    zone.x + leftW + arrowW - 0.02);

  const bigD = Math.min(zone.w - (rightX - zone.x), zone.h * 0.72);
  drawCounter(pptx, slide, rightX + (zone.x + zone.w - rightX - bigD) / 2,
    zone.y + (zone.h - bigD) / 2, bigD, PALE_GREEN, 'H',
    Math.max(13, Math.floor(bigD * 18)));
}

function drawPlaceholder(pptx, slide, zone, data) {
  const digits = String(data.number != null ? data.number : '4050')
    .replace(/\s+/g, '').split('').slice(0, 5);
  if (digits.length === 0) digits.push('0');
  const gap = Math.min(0.035, zone.w * 0.015);
  const cellW = (zone.w - gap * (digits.length - 1)) / digits.length;
  const y = zone.y + zone.h * 0.15;
  const h = zone.h * 0.70;
  const font = Math.max(12, Math.min(22, Math.floor(cellW * 21)));

  digits.forEach(function (digit, i) {
    const zero = digit === '0';
    const x = zone.x + i * (cellW + gap);
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: cellW, h,
      fill: { color: zero ? PALE_BLUE : WHITE },
      line: { color: zero ? BLUE : GRID, width: zero ? 2 : 1 },
      rectRadius: 0.03
    });
    addText(slide, digit, { x, y, w: cellW, h }, {
      fontSize: font, color: zero ? BLUE : BODY
    });
  });
}

function drawPlaceValueMini(pptx, slide, zone, data) {
  const mode = String(data.mode || 'digit-value').toLowerCase();
  if (mode === 'column') return drawColumn(pptx, slide, zone, data);
  if (mode === 'exchange') return drawExchange(pptx, slide, zone);
  if (mode === 'placeholder') return drawPlaceholder(pptx, slide, zone, data);
  return drawDigitValue(pptx, slide, zone, data);
}

module.exports = { drawPlaceValueMini };
