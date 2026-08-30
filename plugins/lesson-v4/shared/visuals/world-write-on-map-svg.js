'use strict';

// Landscape worksheet world map built on the real Natural Earth-derived asset
// builder/assets/maps/world-with-antarctica.png. This module adds only teaching
// marks and write-on spaces; it never supplies coastline coordinates.

const fs = require('fs');
const shared = require('./map-annotations');

const FONT = 'Comic Sans MS, Comic Sans, Chalkboard SE, sans-serif';
const MAP_KEY = 'world-with-antarctica';
const FOOTER_H = 92;             // joined-edge cue beneath map (asset units)
const MARKER_R = 19;             // numbered/lettered marker radius (asset units)
const MARKER_FONT = 24;          // marker text size (asset units)
const SEA_W = 58;                // pupil sea-initial box width (asset units)
const SEA_H = 38;                // pupil sea-initial box height (asset units)
const EQUATOR_PT = 4;            // equator stroke (asset units)
const COMPASS_R = 48;            // compass radius (asset units)
const EDGE_BAND_W = 20;          // matching Pacific edge band (asset units)
const MAX_CONTINENT_MARKERS = 7;
const MAX_OCEAN_MARKERS = 5;
const SEA_SPACE_COUNT = 3;

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function point(value, label) {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error('MAP_WRITE_ON_INVALID: ' + label + ' must be [x, y].');
  }
  const pair = value.map(Number);
  if (pair.some(function (n) { return !Number.isFinite(n) || n < 0 || n > 1; })) {
    throw new Error('MAP_WRITE_ON_INVALID: ' + label + ' coordinates must be fractions from 0 to 1.');
  }
  return pair;
}

function markerList(raw, label, max) {
  if (!Array.isArray(raw) || raw.length > max) {
    throw new Error('MAP_WRITE_ON_INVALID: ' + label + ' must contain at most ' + max + ' markers.');
  }
  const seen = new Set();
  return raw.map(function (item, index) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error('MAP_WRITE_ON_INVALID: ' + label + '[' + index + '] must be an object.');
    }
    const marker = String(item.marker == null ? '' : item.marker).trim();
    if (!marker || marker.length > 3) {
      throw new Error('MAP_WRITE_ON_INVALID: ' + label + '[' + index + '].marker must be 1-3 characters.');
    }
    if (seen.has(marker)) {
      throw new Error('MAP_WRITE_ON_INVALID: duplicate marker ' + JSON.stringify(marker) + ' in ' + label + '.');
    }
    seen.add(marker);
    const at = point(item.at, label + '[' + index + '].at');
    const repeatAt = item.repeatAt == null ? null : point(item.repeatAt, label + '[' + index + '].repeatAt');
    return { marker, at, repeatAt };
  });
}

function resolve(spec) {
  const d = spec || {};
  if (shared.normaliseMapKey(d.map) !== MAP_KEY) {
    throw new Error('MAP_WRITE_ON_INVALID: worksheetMode "continents-and-oceans" requires map "' + MAP_KEY + '".');
  }
  const continentMarkers = markerList(d.continentMarkers || [], 'continentMarkers', MAX_CONTINENT_MARKERS);
  const oceanMarkers = markerList(d.oceanMarkers || [], 'oceanMarkers', MAX_OCEAN_MARKERS);
  if (continentMarkers.length !== MAX_CONTINENT_MARKERS || oceanMarkers.length !== MAX_OCEAN_MARKERS) {
    throw new Error('MAP_WRITE_ON_INVALID: the complete task needs exactly 7 continentMarkers and 5 oceanMarkers.');
  }
  const repeated = oceanMarkers.filter(function (item) { return item.repeatAt; });
  if (repeated.length !== 1) {
    throw new Error('MAP_WRITE_ON_INVALID: exactly one ocean marker must have repeatAt for the Pacific at both map edges.');
  }
  const seaInitialSpaces = d.seaInitialSpaces;
  if (!Array.isArray(seaInitialSpaces) || seaInitialSpaces.length !== SEA_SPACE_COUNT) {
    throw new Error('MAP_WRITE_ON_INVALID: seaInitialSpaces must contain exactly 3 water positions.');
  }
  return {
    entry: shared.mapEntry(MAP_KEY),
    continentMarkers,
    oceanMarkers,
    seaInitialSpaces: seaInitialSpaces.map(function (p, i) { return point(p, 'seaInitialSpaces[' + i + ']'); }),
    showEquator: d.showEquator !== false,
    showCompass: d.showCompass !== false,
    joinedEdges: d.joinedEdges !== false
  };
}

function cacheKey(spec) {
  const s = resolve(spec);
  return [
    'world-write-on', JSON.stringify(s.continentMarkers), JSON.stringify(s.oceanMarkers),
    JSON.stringify(s.seaInitialSpaces), s.showEquator, s.showCompass, s.joinedEdges
  ].join(':');
}

function markerBox(at, w, h) {
  const x = at[0] * w;
  const y = at[1] * h;
  return { x: x - MARKER_R, y: y - MARKER_R, w: MARKER_R * 2, h: MARKER_R * 2 };
}

function seaBox(at, w, h) {
  const x = at[0] * w;
  const y = at[1] * h;
  return { x: x - SEA_W / 2, y: y - SEA_H / 2, w: SEA_W, h: SEA_H };
}

function describeLayout(spec) {
  const s = resolve(spec);
  const w = s.entry.w;
  const h = s.entry.h;
  const markerBoxes = [];
  s.continentMarkers.concat(s.oceanMarkers).forEach(function (item) {
    markerBoxes.push(markerBox(item.at, w, h));
    if (item.repeatAt) markerBoxes.push(markerBox(item.repeatAt, w, h));
  });
  return {
    w,
    mapH: h,
    h: h + (s.joinedEdges ? FOOTER_H : 0),
    markerBoxes,
    seaBoxes: s.seaInitialSpaces.map(function (at) { return seaBox(at, w, h); })
  };
}

function dataUri(entry) {
  const assetPath = shared.assetPathFor(MAP_KEY);
  if (!entry || !assetPath || !fs.existsSync(assetPath)) {
    throw new Error('MAP_ASSET_MISSING: ' + MAP_KEY + ' is not installed in builder/assets/maps.');
  }
  return 'data:image/png;base64,' + fs.readFileSync(assetPath).toString('base64');
}

function drawMarker(item, at, kind, w, h) {
  const x = at[0] * w;
  const y = at[1] * h;
  const fill = kind === 'continent' ? '#FFF2CC' : '#DDEBF7';
  const stroke = kind === 'continent' ? '#C65911' : '#0070C0';
  return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + MARKER_R +
      '" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="10"/>' +
    '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + MARKER_R +
      '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="4"/>' +
    '<text x="' + x.toFixed(1) + '" y="' + (y + MARKER_FONT * 0.36).toFixed(1) +
      '" text-anchor="middle" font-family="' + FONT + '" font-size="' + MARKER_FONT +
      '" font-weight="bold" fill="#1A1A1A">' + esc(item.marker) + '</text>';
}

function tightSvg(spec) {
  const s = resolve(spec);
  const layout = describeLayout(spec);
  const w = layout.w;
  const mapH = layout.mapH;
  const h = layout.h;
  const parts = [
    '<image x="0" y="0" width="' + w + '" height="' + mapH + '" href="' + dataUri(s.entry) + '"/>'
  ];

  if (s.showEquator) {
    const y = mapH / 2;
    parts.push('<line x1="0" y1="' + y + '" x2="' + w + '" y2="' + y +
      '" stroke="#C65911" stroke-width="' + EQUATOR_PT + '" stroke-dasharray="18 12"/>');
    parts.push('<rect x="' + (w / 2 - 65) + '" y="' + (y - 25) + '" width="130" height="30" rx="12" fill="#FFFFFF" fill-opacity="0.92"/>');
    parts.push('<text x="' + (w / 2) + '" y="' + (y - 3) + '" text-anchor="middle" font-family="' + FONT +
      '" font-size="22" font-weight="bold" fill="#C65911">Equator</text>');
  }

  if (s.showCompass) {
    const cx = w - 82;
    const cy = 83;
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + COMPASS_R + '" fill="#FFFFFF" fill-opacity="0.94" stroke="#17365D" stroke-width="3"/>');
    parts.push('<path d="M' + cx + ' ' + (cy - 38) + ' L' + (cx + 12) + ' ' + cy + ' L' + cx + ' ' + (cy + 38) + ' L' + (cx - 12) + ' ' + cy + ' Z" fill="#DDEBF7" stroke="#17365D" stroke-width="3"/>');
    parts.push('<text x="' + cx + '" y="' + (cy - 52) + '" text-anchor="middle" font-family="' + FONT + '" font-size="23" font-weight="bold" fill="#17365D">N</text>');
  }

  s.continentMarkers.forEach(function (item) { parts.push(drawMarker(item, item.at, 'continent', w, mapH)); });
  s.oceanMarkers.forEach(function (item) {
    parts.push(drawMarker(item, item.at, 'ocean', w, mapH));
    if (item.repeatAt) parts.push(drawMarker(item, item.repeatAt, 'ocean', w, mapH));
  });

  s.seaInitialSpaces.forEach(function (at) {
    const box = seaBox(at, w, mapH);
    parts.push('<rect x="' + box.x.toFixed(1) + '" y="' + box.y.toFixed(1) + '" width="' + box.w + '" height="' + box.h +
      '" rx="10" fill="#FFFFFF" fill-opacity="0.96" stroke="#2E7D45" stroke-width="3" stroke-dasharray="8 5"/>');
    parts.push('<line x1="' + (box.x + 12).toFixed(1) + '" y1="' + (box.y + box.h - 9).toFixed(1) + '" x2="' + (box.x + box.w - 12).toFixed(1) + '" y2="' + (box.y + box.h - 9).toFixed(1) + '" stroke="#2E7D45" stroke-width="2"/>');
  });

  if (s.joinedEdges) {
    parts.push('<defs><pattern id="pacific-edge" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="#DDEBF7"/><rect width="5" height="14" fill="#0070C0"/></pattern><marker id="edge-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#0070C0"/></marker></defs>');
    parts.push('<rect x="0" y="0" width="' + EDGE_BAND_W + '" height="' + mapH + '" fill="url(#pacific-edge)"/>');
    parts.push('<rect x="' + (w - EDGE_BAND_W) + '" y="0" width="' + EDGE_BAND_W + '" height="' + mapH + '" fill="url(#pacific-edge)"/>');
    parts.push('<path d="M25 ' + (mapH + 20) + ' C280 ' + (mapH + 82) + ' 610 ' + (mapH + 82) + ' ' + (w / 2 - 150) + ' ' + (mapH + 42) + '" fill="none" stroke="#0070C0" stroke-width="5" marker-end="url(#edge-arrow)"/>');
    parts.push('<path d="M' + (w - 25) + ' ' + (mapH + 20) + ' C' + (w - 280) + ' ' + (mapH + 82) + ' ' + (w - 610) + ' ' + (mapH + 82) + ' ' + (w / 2 + 150) + ' ' + (mapH + 42) + '" fill="none" stroke="#0070C0" stroke-width="5" marker-end="url(#edge-arrow)"/>');
    parts.push('<text x="' + (w / 2) + '" y="' + (mapH + 72) + '" text-anchor="middle" font-family="' + FONT + '" font-size="24" font-weight="bold" fill="#0070C0">These patterned edges join: one Pacific Ocean</text>');
  }

  return {
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + parts.join('') + '</svg>',
    aspect: w / h,
    w,
    h
  };
}

module.exports = { tightSvg, cacheKey, describeLayout, resolve, MAP_KEY };
