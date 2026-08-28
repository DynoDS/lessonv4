#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');

const requireGlobal = require('../../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');

const { SLIDE_W, SLIDE_H } = require('../../src/layout');
const { COLOURS, FONT } = require('../../src/styles');
const { preRenderClocks, drawClock } = require('../../src/content/clock');
const { drawNumberline } = require('../../src/content/numberline');
const { drawFractionWall } = require('../../src/content/fraction-wall');
const { drawPlaceValueChart } = require('../../src/content/place-value-chart');
const { drawPartWholeModel } = require('../../src/content/part-whole-model');
const { drawPyramid } = require('../../src/content/pyramid');
const { drawTable } = require('../../src/content/table');
const { drawMoney } = require('../../src/content/money');
const { preTrimMoney } = require('../../src/images/trim-money');

const LETTERS = ['(a)', '(b)', '(c)', '(d)', '(e)'];
const SQUARE_SIZES = [4.0, 2.8, 2.0, 1.4, 1.0];   // inches
const WIDE_WIDTHS  = [12.0, 8.0, 5.5, 3.5, 2.0];  // inches
const TALL_HEIGHTS = [1.8, 1.4, 1.0, 0.7, 0.4];   // inches (height test, fixed width)

function addTitle(slide, title) {
  slide.addText(title, {
    x: 0.22, y: 0.1, w: 12.89, h: 0.5,
    fontFace: FONT, fontSize: 22, bold: true,
    color: COLOURS.body, align: 'left', valign: 'middle'
  });
}

function squareLayout(pptx, slide, drawFn, data, ctx) {
  const sizes = SQUARE_SIZES;
  const gap = 0.2;
  const totalW = sizes.reduce((a, b) => a + b, 0) + gap * (sizes.length - 1);
  const startX = (SLIDE_W - totalW) / 2;
  const topY = 1.5;
  let x = startX;
  sizes.forEach((s, i) => {
    drawFn(pptx, slide, { x, y: topY, w: s, h: s }, data, ctx);
    slide.addText(`${LETTERS[i]}  ${s}"`, {
      x, y: topY + s + 0.05, w: s, h: 0.35,
      fontFace: FONT, fontSize: 16, bold: true,
      color: COLOURS.body, align: 'center', valign: 'top'
    });
    x += s + gap;
  });
}

function wideLayout(pptx, slide, drawFn, data, ctx, rowH = 1.0, widthsOverride = null) {
  const widths = widthsOverride || WIDE_WIDTHS;
  const letters = ['(a)', '(b)', '(c)', '(d)', '(e)', '(f)'];
  const gap = 0.18;
  let y = 1.0;
  widths.forEach((w, i) => {
    drawFn(pptx, slide, { x: 0.22, y, w, h: rowH }, data, ctx);
    slide.addText(`${letters[i]}  ${w}"`, {
      x: 0.22 + w + 0.15, y, w: 1.8, h: rowH,
      fontFace: FONT, fontSize: 16, bold: true,
      color: COLOURS.body, align: 'left', valign: 'middle'
    });
    y += rowH + gap;
  });
}

function heightLayout(pptx, slide, drawFn, data, ctx, fixedW = 10.0) {
  const heights = TALL_HEIGHTS;
  const gap = 0.15;
  let y = 0.9;
  heights.forEach((h, i) => {
    drawFn(pptx, slide, { x: 0.22, y, w: fixedW, h }, data, ctx);
    slide.addText(`${LETTERS[i]}  ${h}" tall`, {
      x: 0.22 + fixedW + 0.15, y, w: 2.5, h,
      fontFace: FONT, fontSize: 16, bold: true,
      color: COLOURS.body, align: 'left', valign: 'middle'
    });
    y += h + gap;
  });
}

async function main() {
  const outputDir = path.resolve(__dirname);

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'LAYOUT_WIDE', width: SLIDE_W, height: SLIDE_H });
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = 'Helper Size Test';

  // Pre-render assets (clocks need SVG→PNG, money needs trimmed coin images)
  const mockLesson = {
    slides: [
      { template: 'body-full', body: { type: 'clock', time: '3:15' } },
      { template: 'body-full', body: { type: 'money', items: ['£2', '£1', '50p', '20p', '10p', '5p', '2p', '1p'] } }
    ]
  };
  const clockImages = await preRenderClocks(mockLesson);
  await preTrimMoney(mockLesson);

  const ctx = { slideIndex: 0, clockImages, imageDims: {} };

  function makeSlide(title) {
    const slide = pptx.addSlide();
    slide.background = { color: COLOURS.bg };
    addTitle(slide, title);
    return slide;
  }

  // 1. Clock
  squareLayout(pptx, makeSlide('Clock — which sizes are still readable?'),
    drawClock, { time: '3:15' }, ctx);

  // 2. Numberline
  wideLayout(pptx, makeSlide('Numberline — which widths are still readable?'),
    drawNumberline, { start: 0, end: 10, interval: 1, labels: 'all' }, ctx);

  // 3. Fraction wall
  wideLayout(pptx, makeSlide('Fraction wall — which widths are still readable?'),
    drawFractionWall, { fractions: [1, 2, 3, 4, 6, 8] }, ctx);

  // 4. Place value chart
  wideLayout(pptx, makeSlide('Place value chart — which widths are still readable?'),
    drawPlaceValueChart, {
      columns: ['Th', 'H', 'T', 'O'],
      rows: [['3', '4', '5', '6']]
    }, ctx);

  // 5. Part-whole model
  squareLayout(pptx, makeSlide('Part-whole model — which sizes are still readable?'),
    drawPartWholeModel, { whole: '10', parts: ['6', '4'] }, ctx);

  // 6. Pyramid
  squareLayout(pptx, makeSlide('Pyramid — which sizes are still readable?'),
    drawPyramid, { rows: [{ cells: 1 }, { cells: 2 }, { cells: 3 }] }, ctx);

  // 7. Table
  wideLayout(pptx, makeSlide('Table — which widths are still readable?'),
    drawTable, {
      headers: ['Position', 'Minutes', 'Digital', 'Words'],
      rows: [
        ['12', '00', ':00', "o'clock"],
        ['3',  '15', ':15', 'quarter past'],
        ['6',  '30', ':30', 'half past']
      ]
    }, ctx, 1.4);

  // 8. Money — single coin (a 50p, square)
  squareLayout(pptx, makeSlide('Single coin (50p) — which sizes are still readable?'),
    drawMoney, { items: ['50p'] }, ctx);

  // 9. Money — mixed strip (full coin set, wide). Extra mid-range options between 5.5" and 8".
  wideLayout(pptx, makeSlide('Mixed coin strip — which widths are still readable?'),
    drawMoney, { items: ['£2', '£1', '50p', '20p', '10p', '5p', '2p', '1p'] },
    ctx, 1.0, [10.0, 8.0, 7.0, 6.0, 5.5, 4.5]);

  const outPath = path.join(outputDir, 'Helper Size Test.pptx');
  await pptx.writeFile({ fileName: outPath });
  console.log('Saved:', outPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
