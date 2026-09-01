'use strict';

// SHARED real-map drawing for the surfaces that render through SVG.
//
// The base is always the real map image shipped in builder/assets/maps/,
// embedded as a data URI so a printed sheet needs no file lookup at render
// time. Everything drawn on top is an annotation from map-annotations.js: a dot
// on a place, a dashed outline round a region, a line along a river.
//
//   tightSvg(spec) -> { svg, aspect, w, h }
//   cacheKey(spec) -> string
//
// There is deliberately no way to draw the land itself here. A coastline or a
// border comes from the asset or it does not appear: a map a child reads to
// find out where somewhere IS has to be right about where it is.

const fs = require('fs');

const shared = require('./map-annotations');

const FONT = 'Comic Sans MS, Comic Sans, Chalkboard SE, sans-serif';
const LABEL_INK = '#1A1A1A';
const HALO = '#FFFFFF';

const LABEL_FONT_FRACTION = 0.032;   // label height as a share of the map's long side
const LABEL_FONT_MIN = 11;           // readable floor (SVG units at asset scale)
const LABEL_PAD = 0.42;              // pill padding, in multiples of the font size
const CHAR_WIDTH = 0.56;             // mean glyph advance for this face, in font sizes
const DOT_FRACTION = 0.018;          // point-annotation dot radius, share of the long side
const MARK_WIDTH_FRACTION = 0.006;   // annotation stroke width, share of the long side
const HALO_MULTIPLE = 2.4;           // white halo, in multiples of the stroke width

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function f(n) { return Number(n).toFixed(2); }

function dataUri(entry, assetPath) {
  const ext = entry.file.slice(entry.file.lastIndexOf('.')).toLowerCase();
  const mime = MIME[ext];
  if (!mime) throw new Error('MAP_ASSET_UNSUPPORTED: ' + entry.file + ' is not a PNG or JPEG.');
  return 'data:' + mime + ';base64,' + fs.readFileSync(assetPath).toString('base64');
}

function resolve(spec) {
  const d = spec || {};
  const key = shared.normaliseMapKey(d.map);
  const entry = shared.mapEntry(key);
  if (!entry) {
    throw new Error(
      'MAP_UNKNOWN: ' + JSON.stringify(String(d.map || '')) +
        ' is not a shipped map. Available: ' + Object.keys(shared.MAPS).join(', ') + '.'
    );
  }
  // Country shading is a pixel fill of the real asset and is drawn by the slide
  // engine only. On paper, name the country with a point annotation instead of
  // shading it, so the sheet says what it means without a second render route.
  if (d.selectedCountry) {
    throw new Error(
      'MAP_OVERLAY_UNSUPPORTED: selectedCountry shading is drawn on the board only. ' +
        'On paper, name the country with a point annotation on the real map.'
    );
  }
  shared.checkOverlaySupport(d);
  return {
    key,
    entry,
    basin: shared.normaliseOverlayName(d.basin),
    basinLabel: d.labels && typeof d.labels === 'object' ? String(d.labels.basin || '') : '',
    annotations: shared.resolveAnnotations(Object.assign({}, d, { map: key }))
  };
}

function cacheKey(spec) {
  const s = resolve(spec);
  return ['real-map', s.key, s.basin, s.basinLabel, JSON.stringify(s.annotations)].join(':');
}

function labelSizer(w, h, fontSize) {
  const pad = fontSize * LABEL_PAD;
  return function (text) {
    return {
      w: (String(text).length * fontSize * CHAR_WIDTH + pad * 2) / w,
      h: (fontSize * 1.6) / h
    };
  };
}

function drawLeader(placed, w, h, fontSize) {
  if (!placed.leader) return '';
  return '<line x1="' + f(placed.leader[0][0] * w) + '" y1="' + f(placed.leader[0][1] * h) +
    '" x2="' + f(placed.leader[1][0] * w) + '" y2="' + f(placed.leader[1][1] * h) +
    '" stroke="#' + placed.colour + '" stroke-width="' + f(fontSize * 0.09) + '"/>';
}

function drawLabel(placed, w, h, fontSize) {
  const box = placed.box;
  const x = box.x * w;
  const y = box.y * h;
  const pillW = box.w * w;
  const pillH = box.h * h;
  return (
    '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(pillW) + '" height="' + f(pillH) +
      '" rx="' + f(pillH * 0.28) + '" fill="' + HALO + '" fill-opacity="0.94" stroke="#' + placed.colour +
      '" stroke-width="' + f(fontSize * 0.09) + '"/>' +
    '<text x="' + f(x + pillW / 2) + '" y="' + f(y + pillH * 0.7) + '" font-family="' + FONT +
      '" font-size="' + f(fontSize) + '" font-weight="bold" fill="' + LABEL_INK +
      '" text-anchor="middle">' + esc(placed.text) + '</text>'
  );
}

function polyPoints(points, w, h) {
  return points.map(function (p) { return f(p[0] * w) + ',' + f(p[1] * h); }).join(' ');
}

function tightSvg(spec) {
  const s = resolve(spec);
  const w = s.entry.w;
  const h = s.entry.h;
  const long = Math.max(w, h);
  const fontSize = Math.max(LABEL_FONT_MIN, long * LABEL_FONT_FRACTION);
  const stroke = Math.max(1.2, long * MARK_WIDTH_FRACTION);
  const dot = Math.max(2.5, long * DOT_FRACTION);

  const assetPath = shared.assetPathFor(s.key);
  const heads = s.annotations.map(function (mark, index) {
    if (!mark.arrow) return '';
    const head = '<marker id="head-' + index + '" markerWidth="5" markerHeight="5" refX="4.2" refY="2.5" orient="auto" markerUnits="strokeWidth">' +
      '<path d="M0 0 L5 2.5 L0 5 Z" fill="#' + mark.colour + '"/></marker>';
    if (mark.arrow !== 'both') return head;
    return head + '<marker id="tail-' + index + '" markerWidth="5" markerHeight="5" refX="4.2" refY="2.5" orient="auto-start-reverse" markerUnits="strokeWidth">' +
      '<path d="M0 0 L5 2.5 L0 5 Z" fill="#' + mark.colour + '"/></marker>';
  }).join('');
  const hatches = s.annotations.map(function (mark, index) {
    if (!mark.shaded) return '';
    const size = Math.max(10, long * 0.03);
    return '<pattern id="hatch-' + index + '" width="' + f(size) + '" height="' + f(size) + '" patternUnits="userSpaceOnUse">' +
      '<rect width="' + f(size) + '" height="' + f(size) + '" fill="#' + mark.colour + '" fill-opacity="0.16"/>' +
      '<path d="M' + f(-size * 0.3) + ' ' + f(size) + ' L' + f(size) + ' ' + f(-size * 0.3) +
      ' M' + f(size * 0.25) + ' ' + f(size * 1.3) + ' L' + f(size * 1.3) + ' ' + f(size * 0.25) +
      '" stroke="#' + mark.colour + '" stroke-width="' + f(size * 0.28) + '" stroke-opacity="0.85"/></pattern>';
  }).join('');
  const parts = [
    (hatches || heads) ? '<defs>' + hatches + heads + '</defs>' : '',
    '<image x="0" y="0" width="' + w + '" height="' + h + '" href="' + dataUri(s.entry, assetPath) + '"/>'
  ];
  const labelItems = [];

  if (s.key === 'south-america' && s.basin === 'amazon basin') {
    const pts = polyPoints(shared.AMAZON_BASIN_SOUTH_AMERICA, w, h);
    parts.push('<polyline points="' + pts + '" fill="none" stroke="' + HALO + '" stroke-width="' + f(stroke * HALO_MULTIPLE) + '" stroke-linejoin="round"/>');
    parts.push('<polyline points="' + pts + '" fill="none" stroke="#' + shared.COLOURS.orange + '" stroke-width="' + f(stroke) + '" stroke-dasharray="' + f(stroke * 3) + ' ' + f(stroke * 2) + '" stroke-linejoin="round"/>');
    labelItems.push({
      text: s.basinLabel,
      anchor: shared.AMAZON_BASIN_LABEL_SOUTH_AMERICA,
      preferred: shared.AMAZON_BASIN_LABEL_SOUTH_AMERICA,
      colour: shared.COLOURS.orange
    });
  }

  s.annotations.forEach(function (mark, index) {
    if (mark.kind === 'point') {
      parts.push('<circle cx="' + f(mark.at[0] * w) + '" cy="' + f(mark.at[1] * h) + '" r="' + f(dot) +
        '" fill="#' + mark.colour + '" stroke="' + HALO + '" stroke-width="' + f(stroke * 0.7) + '"/>');
    } else {
      const list = mark.kind === 'area' ? mark.points.concat([mark.points[0]]) : mark.points;
      const pts = polyPoints(list, w, h);
      // A shaded region prints hatched, not solid: the sheet is photocopied in
      // grey and a solid fill takes the coastline and the rivers with it.
      if (mark.shaded) {
        parts.push('<polygon points="' + pts + '" fill="url(#hatch-' + index + ')" stroke="none"/>');
      }
      parts.push('<polyline points="' + pts + '" fill="none" stroke="' + HALO + '" stroke-width="' + f(stroke * HALO_MULTIPLE) + '" stroke-linejoin="round"/>');
      const heads = mark.arrow
        ? ' marker-end="url(#head-' + index + ')"' + (mark.arrow === 'both' ? ' marker-start="url(#tail-' + index + ')"' : '')
        : '';
      parts.push('<polyline points="' + pts + '" fill="none" stroke="#' + mark.colour + '" stroke-width="' + f(stroke) +
        (mark.kind === 'area' && !mark.shaded ? '" stroke-dasharray="' + f(stroke * 3) + ' ' + f(stroke * 2) : '') + '" stroke-linejoin="round"' + heads + '/>');
    }
    labelItems.push({
      text: mark.label,
      anchor: mark.anchor,
      preferred: mark.labelAt,
      colour: mark.colour
    });
  });

  // Labels last, so no stroke is ever drawn across the words, and laid out
  // against each other so two marks near the same place do not stack up.
  const placed = shared.refuseCrowdedLabels(
    shared.layoutLabels(labelItems, labelSizer(w, h, fontSize)),
    'the printed ' + s.key + ' map'
  );
  const labels = placed
    .map(function (item) { return drawLeader(item, w, h, fontSize); })
    .concat(placed.map(function (item) { return drawLabel(item, w, h, fontSize); }));

  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
      'viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' +
      parts.join('') + labels.join('') +
    '</svg>';

  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg, cacheKey };
