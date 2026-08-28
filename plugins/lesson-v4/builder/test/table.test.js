'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const requireGlobal = require('../src/require-global');
const PptxGenJS = requireGlobal('pptxgenjs');
const { drawTable, requiredZoneHeight, ROW_MIN_H } = require('../src/content/table');
const { preflightLayouts } = require('../src/layout-preflight');

function drawn(zone, data) {
  const shapes = [];
  const texts = [];
  const pptx = new PptxGenJS();
  const slide = {
    addShape: (kind, opts) => shapes.push({ kind, ...opts }),
    addText: (content, opts) => texts.push({ content, ...opts }),
    addImage: () => {},
  };

  drawTable(pptx, slide, zone, data);
  return { shapes, texts };
}

// The zone that produced the reported fault: a bottom band 1.119in tall
// carrying a two-row table whose first column held "(1)" and "(2)".
const SHORT_BAND = { x: 0.34, y: 6.011, w: 8.645, h: 1.119, class: 'C' };

const NUMBERED = {
  headers: ['', 'Appliance', 'Power source'],
  rows: [
    ['(1)', 'Toaster', 'Mains'],
    ['(2)', 'Torch', 'Battery'],
  ],
};

test('a table refuses a zone whose rows cannot hold one readable line', () => {
  assert.throws(
    () => drawn(SHORT_BAND, NUMBERED),
    (err) => {
      assert.match(err.message, /^TABLE_ZONE_TOO_SHORT:/);
      // The remedy is named in the units the zone is written in, because the
      // words are "(1)" and cutting them cannot repair the geometry.
      assert.match(err.message, /1\.14in tall/);
      return true;
    }
  );
});

test('the refusal names the height the row count actually needs', () => {
  assert.equal(requiredZoneHeight(2).toFixed(2), '1.14');
  assert.equal(requiredZoneHeight(4).toFixed(2), '1.54');
  assert.ok(ROW_MIN_H > 0);
});

test('a table with the height its rows need still draws', () => {
  const zone = { ...SHORT_BAND, h: requiredZoneHeight(2) };
  const { shapes, texts } = drawn(zone, NUMBERED);

  // Header cells plus body cells, all present.
  assert.equal(shapes.length, 3 + 6);
  assert.equal(texts.length, 3 + 6);
  for (const cell of shapes.slice(3)) {
    assert.ok(cell.h >= ROW_MIN_H - 1e-9, 'a body row came out under the floor');
  }
});

test('a taller zone with more rows than it can hold is refused too', () => {
  // Generalisation: the fault is rows against height, not one lesson's band.
  const zone = { x: 0.5, y: 1, w: 9, h: 2.0, class: 'B' };
  const rows = Array.from({ length: 8 }, (_, i) => [String(i + 1), 'a', 'b']);
  assert.throws(
    () => drawn(zone, { headers: ['#', 'x', 'y'], rows }),
    (err) => {
      assert.match(err.message, /^TABLE_ZONE_TOO_SHORT:/);
      assert.match(err.message, /2\.34in tall/);
      return true;
    }
  );
});

test('the refusal reaches the preflight by name, before anything is written', () => {
  const lesson = {
    slides: [
      {
        template: 'title',
        title: 'Electrical appliances',
      },
    ],
  };

  // Drive the preflight with a stub renderer that draws only the table, so the
  // assertion is about how a named helper refusal travels, not about templates.
  const result = preflightLayouts({
    PptxGenJS,
    lesson,
    contextForSlide: () => ({ slideIndex: 0 }),
    drawSlide: (pptx, slide) => drawTable(pptx, slide, SHORT_BAND, NUMBERED),
  });

  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].signal, 'TABLE_ZONE_TOO_SHORT');
  assert.equal(result.errors[0].slide, 1);
  assert.match(result.errors[0].message, /1\.14in tall/);
});
