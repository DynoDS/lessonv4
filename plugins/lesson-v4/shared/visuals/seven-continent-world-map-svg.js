'use strict';

// Configurable slide world map built on the shipped Natural Earth-derived
// world-with-antarctica.png. The module adds labels, clues and teaching cues;
// a sea zoom is a crop of the same pixels, never a redrawn coastline.

const fs = require('fs');
const maps = require('./map-annotations');

const MAP_KEY = 'world-with-antarctica';
const FONT = 'Aptos, Arial, sans-serif';
const LABEL_FONT = 27;
const SEA_FONT = 23;
const MARKER_R = 21;
const MARKER_FONT = 25;
const COMPASS_R = 48;
const EDGE_BAND_W = 22;
const FOOTER_H = 92;
const KEY_H = 84;
const MAX_CONTINENT_LABELS = 7;
const MAX_OCEAN_LABELS = 5;
const MAX_SEA_LABELS = 5;
const MAX_CLUE_MARKERS = 12;

// The shipped asset is a full equirectangular world: 1800 x 900, -180 to 180 by
// -90 to 90. So a line of latitude is arithmetic on the real image rather than a
// line drawn where it looks about right, which is the only reason this module is
// allowed to draw one at all.
const LATITUDES = [
  { key: 'equator', lat: 0, text: 'Equator' },
  { key: 'cancer', lat: 23.5, text: 'Tropic of Cancer' },
  { key: 'capricorn', lat: -23.5, text: 'Tropic of Capricorn' }
];

function latitudeFraction(lat) {
  return (90 - lat) / 180;
}

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function point(value, label) {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error('SEVEN_CONTINENT_MAP_INVALID: ' + label + ' must be [x, y].');
  }
  const out = value.map(Number);
  if (out.some(function (n) { return !Number.isFinite(n) || n < 0 || n > 1; })) {
    throw new Error('SEVEN_CONTINENT_MAP_INVALID: ' + label + ' coordinates must be fractions from 0 to 1.');
  }
  return out;
}

function textItems(raw, label, max) {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length > max) {
    throw new Error('SEVEN_CONTINENT_MAP_INVALID: ' + label + ' accepts at most ' + max + ' labels.');
  }
  return raw.map(function (item, index) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error('SEVEN_CONTINENT_MAP_INVALID: ' + label + '[' + index + '] must be an object.');
    }
    const text = String(item.text == null ? '' : item.text).trim();
    if (!text || text.length > 34) {
      throw new Error('SEVEN_CONTINENT_MAP_INVALID: ' + label + '[' + index + '].text must be 1-34 characters.');
    }
    return {
      text,
      at: point(item.at, label + '[' + index + '].at'),
      labelAt: item.labelAt == null ? null : point(item.labelAt, label + '[' + index + '].labelAt'),
      repeatAt: item.repeatAt == null ? null : point(item.repeatAt, label + '[' + index + '].repeatAt')
    };
  });
}

function clueMarkers(raw) {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length > MAX_CLUE_MARKERS) {
    throw new Error('SEVEN_CONTINENT_MAP_INVALID: clueMarkers accepts at most 12 markers.');
  }
  return raw.map(function (item, index) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error('SEVEN_CONTINENT_MAP_INVALID: clueMarkers[' + index + '] must be an object.');
    }
    const marker = String(item.marker == null ? '' : item.marker).trim();
    if (!marker || marker.length > 3) {
      throw new Error('SEVEN_CONTINENT_MAP_INVALID: clueMarkers[' + index + '].marker must be 1-3 characters.');
    }
    const kind = String(item.kind || 'continent').trim().toLowerCase();
    if (kind !== 'continent' && kind !== 'ocean' && kind !== 'sea') {
      throw new Error('SEVEN_CONTINENT_MAP_INVALID: clue marker kind must be continent, ocean or sea.');
    }
    return {
      marker,
      kind,
      at: point(item.at, 'clueMarkers[' + index + '].at'),
      repeatAt: item.repeatAt == null ? null : point(item.repeatAt, 'clueMarkers[' + index + '].repeatAt')
    };
  });
}

function focusSpec(raw) {
  if (raw == null) return null;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('SEVEN_CONTINENT_MAP_INVALID: focus must be an object.');
  }
  const centre = point(raw.centre, 'focus.centre');
  const span = point(raw.span, 'focus.span');
  if (span[0] < 0.03 || span[0] > 0.55 || span[1] < 0.03 || span[1] > 0.55) {
    throw new Error('SEVEN_CONTINENT_MAP_INVALID: focus.span values must be from 0.03 to 0.55.');
  }
  const title = String(raw.title || '').trim();
  if (!title || title.length > 42) {
    throw new Error('SEVEN_CONTINENT_MAP_INVALID: focus.title must be 1-42 characters.');
  }
  return { centre, span, title };
}

function resolve(spec) {
  const d = spec || {};
  if (maps.normaliseMapKey(d.map) !== MAP_KEY) {
    throw new Error('SEVEN_CONTINENT_MAP_INVALID: presentation "seven-continent-world" requires map "' + MAP_KEY + '".');
  }
  const continentLabels = textItems(d.continentLabels, 'continentLabels', MAX_CONTINENT_LABELS);
  const oceanLabels = textItems(d.oceanLabels, 'oceanLabels', MAX_OCEAN_LABELS);
  if (oceanLabels.filter(function (item) { return item.repeatAt; }).length > 1) {
    throw new Error('SEVEN_CONTINENT_MAP_INVALID: only the Pacific ocean label may repeat at both edges.');
  }
  return {
    entry: maps.mapEntry(MAP_KEY),
    continentLabels,
    oceanLabels,
    seaLabels: textItems(d.seaLabels, 'seaLabels', MAX_SEA_LABELS),
    clueMarkers: clueMarkers(d.clueMarkers),
    // Marks on the world map. These used to be dropped here without a word: the
    // presentation was written for naming continents and oceans, so it ignored
    // `annotations` entirely, and a lesson that asked for the rainforests to be
    // shaded got a bare map and no error. That silence is why a rainforest
    // lesson had nowhere to put its rainforests.
    annotations: maps.resolveAnnotations(d),
    key: maps.resolveKey(d),
    focus: focusSpec(d.focus),
    showEquator: d.showEquator === true || d.showTropics === true,
    showTropics: d.showTropics === true,
    showCompass: d.showCompass !== false,
    joinedEdges: d.joinedEdges === true
  };
}

function cacheKey(spec) {
  const s = resolve(spec);
  return ['seven-continent-world', JSON.stringify(s)].join(':');
}

function dataUri(entry) {
  const assetPath = maps.assetPathFor(MAP_KEY);
  if (!entry || !assetPath || !fs.existsSync(assetPath)) {
    throw new Error('MAP_ASSET_MISSING: ' + MAP_KEY + ' is not installed in builder/assets/maps.');
  }
  return 'data:image/png;base64,' + fs.readFileSync(assetPath).toString('base64');
}

function glyphUnits(text) {
  let units = 0;
  for (const char of String(text)) {
    if (/\s/.test(char)) units += 0.32;
    else if (/[ilI1.,'!|]/.test(char)) units += 0.30;
    else if (/[mwMW@#%]/.test(char)) units += 0.88;
    else units += 0.56;
  }
  return units;
}

function labelSize(text, fontSize, mapW, mapH) {
  return {
    w: Math.min(0.23, Math.max(0.075, (glyphUnits(text) * fontSize + fontSize * 0.9) / mapW)),
    h: (fontSize * 1.58) / mapH
  };
}

function project(at, rect) {
  return { x: rect.x + at[0] * rect.w, y: rect.y + at[1] * rect.h };
}

function drawLeader(item, rect, colour) {
  if (!item.leader) return '';
  const a = project(item.leader[0], rect);
  const b = project(item.leader[1], rect);
  return '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '" stroke="' + colour + '" stroke-width="3"/>';
}

function drawPill(item, rect, fontSize, fill, stroke) {
  const box = item.box;
  const x = rect.x + box.x * rect.w;
  const y = rect.y + box.y * rect.h;
  const w = box.w * rect.w;
  const h = box.h * rect.h;
  return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="12" fill="' + fill + '" fill-opacity="0.94" stroke="' + stroke + '" stroke-width="3"/>' +
    '<text x="' + (x + w / 2).toFixed(1) + '" y="' + (y + h * 0.69).toFixed(1) + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + fontSize + '" font-weight="bold" fill="#1A1A1A">' + esc(item.text) + '</text>';
}

function placedLabels(s, rect, mapW, mapH) {
  const inputs = [];
  function add(items, kind, fontSize) {
    items.forEach(function (item) {
      inputs.push({
        text: item.text,
        anchor: item.at,
        preferred: item.labelAt || item.at,
        kind,
        fontSize,
        repeatAt: item.repeatAt
      });
    });
  }
  add(s.continentLabels, 'continent', LABEL_FONT);
  add(s.oceanLabels, 'ocean', LABEL_FONT);
  add(s.seaLabels, 'sea', SEA_FONT);
  // A mark's own label joins the same layout rather than being drawn where it
  // asked, so a shaded region's name cannot land on top of a continent name.
  s.annotations.forEach(function (mark) {
    if (!mark.label) return;
    inputs.push({
      text: mark.label,
      anchor: mark.anchor,
      preferred: mark.labelAt || mark.anchor,
      kind: 'mark',
      colour: mark.colour,
      fontSize: SEA_FONT,
      repeatAt: null
    });
  });
  const placed = maps.refuseCrowdedLabels(
    maps.layoutLabels(inputs, function (text) {
      const item = inputs.find(function (candidate) { return candidate.text === text; });
      return labelSize(text, item ? item.fontSize : LABEL_FONT, mapW, mapH);
    }),
    'the seven-continent world map'
  );
  return placed.map(function (item, index) { return Object.assign(item, inputs[index]); });
}

function markerSvg(item, at, rect) {
  const p = project(at, rect);
  const colour = item.kind === 'continent' ? '#C65911' : item.kind === 'sea' ? '#2E7D45' : '#0070C0';
  const fill = item.kind === 'continent' ? '#FFF2CC' : item.kind === 'sea' ? '#E2F0D9' : '#DDEBF7';
  return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + MARKER_R + '" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="10"/>' +
    '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + MARKER_R + '" fill="' + fill + '" stroke="' + colour + '" stroke-width="4"/>' +
    '<text x="' + p.x.toFixed(1) + '" y="' + (p.y + MARKER_FONT * 0.36).toFixed(1) + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + MARKER_FONT + '" font-weight="bold" fill="#1A1A1A">' + esc(item.marker) + '</text>';
}

// A mark drawn on the map, in the same fractions everything else here uses. The
// order matters: shading first so it sits under the coastline strokes and the
// latitude lines, outlines next, dots last, and every label after all of them.
function annotationSvg(mark, rect, index) {
  const at = (p) => project(p, rect);
  if (mark.kind === 'point') {
    const p = at(mark.at);
    const r = Math.max(7, rect.h * 0.014);
    return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + r.toFixed(1) +
      '" fill="#' + mark.colour + '" stroke="#FFFFFF" stroke-width="' + (r * 0.45).toFixed(1) + '"/>';
  }
  const list = mark.kind === 'area' ? mark.points.concat([mark.points[0]]) : mark.points;
  const d = list.map(function (p, i) {
    const q = at(p);
    return (i ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1);
  }).join(' ');
  const stroke = Math.max(3, rect.h * 0.005);
  const out = [];
  if (mark.shaded) {
    out.push('<path d="' + d + ' Z" fill="url(#hatch-' + index + ')" stroke="none"/>');
  }
  out.push('<path d="' + d + '" fill="none" stroke="#FFFFFF" stroke-width="' + (stroke * 2.2).toFixed(1) + '" stroke-linejoin="round"/>');
  const heads = mark.arrow
    ? ' marker-end="url(#head-' + index + ')"' + (mark.arrow === 'both' ? ' marker-start="url(#tail-' + index + ')"' : '')
    : '';
  out.push('<path d="' + d + '" fill="none" stroke="#' + mark.colour + '" stroke-width="' + stroke.toFixed(1) +
    (mark.kind === 'area' && !mark.shaded ? '" stroke-dasharray="' + (stroke * 3).toFixed(1) + ' ' + (stroke * 2).toFixed(1) : '') +
    '" stroke-linejoin="round"' + heads + '/>');
  return out.join('');
}

// The hatch each shaded region is filled with, and the identical swatch its key
// entry shows. Hatched rather than solid so the map underneath still reads.
// One arrowhead per marked line, in that line's own colour, so a blue river and
// an orange journey do not end in the same head.
function arrowDefs(marks) {
  return marks.map(function (mark, index) {
    if (!mark.arrow) return '';
    const head = '<marker id="head-' + index + '" markerWidth="5" markerHeight="5" refX="4.2" refY="2.5" orient="auto" markerUnits="strokeWidth">' +
      '<path d="M0 0 L5 2.5 L0 5 Z" fill="#' + mark.colour + '"/></marker>';
    if (mark.arrow !== 'both') return head;
    return head + '<marker id="tail-' + index + '" markerWidth="5" markerHeight="5" refX="4.2" refY="2.5" orient="auto-start-reverse" markerUnits="strokeWidth">' +
      '<path d="M0 0 L5 2.5 L0 5 Z" fill="#' + mark.colour + '"/></marker>';
  }).join('');
}

function hatchDefs(marks) {
  return marks.map(function (mark, index) {
    if (!mark.shaded) return '';
    return '<pattern id="hatch-' + index + '" width="18" height="18" patternUnits="userSpaceOnUse">' +
      '<rect width="18" height="18" fill="#' + mark.colour + '" fill-opacity="0.16"/>' +
      '<path d="M-5 18 L18 -5 M4 23 L23 4" stroke="#' + mark.colour + '" stroke-width="5" stroke-opacity="0.85"/>' +
      '</pattern>';
  }).join('');
}

function keySvg(entries, rect, y) {
  if (!entries.length) return '';
  const cellW = Math.min(430, rect.w / entries.length);
  const startX = rect.x + (rect.w - cellW * entries.length) / 2;
  return entries.map(function (entry, i) {
    const x = startX + i * cellW;
    return '<rect x="' + x.toFixed(1) + '" y="' + y + '" width="46" height="34" rx="6" fill="url(#keyhatch-' + i + ')" stroke="#333333" stroke-width="2.5"/>' +
      '<text x="' + (x + 60).toFixed(1) + '" y="' + (y + 26) + '" font-family="' + FONT +
      '" font-size="26" font-weight="bold" fill="#1A1A1A">' + esc(entry.text) + '</text>';
  }).join('');
}

function keyHatchDefs(entries) {
  return entries.map(function (entry, i) {
    return '<pattern id="keyhatch-' + i + '" width="18" height="18" patternUnits="userSpaceOnUse">' +
      '<rect width="18" height="18" fill="#' + entry.colour + '" fill-opacity="0.16"/>' +
      '<path d="M-5 18 L18 -5 M4 23 L23 4" stroke="#' + entry.colour + '" stroke-width="5" stroke-opacity="0.85"/>' +
      '</pattern>';
  }).join('');
}

function mapLayer(s, uri, rect, parts) {
  parts.push('<image x="' + rect.x + '" y="' + rect.y + '" width="' + rect.w + '" height="' + rect.h + '" href="' + uri + '"/>');
  s.annotations.forEach(function (mark, index) { parts.push(annotationSvg(mark, rect, index)); });
  const drawn = LATITUDES.filter(function (line) {
    if (line.key === 'equator') return s.showEquator;
    return s.showTropics;
  });
  drawn.forEach(function (line, index) {
    const y = rect.y + latitudeFraction(line.lat) * rect.h;
    const labelX = rect.x + rect.w * (index % 2 === 0 ? 0.20 : 0.74);
    const halfWidth = 8 + line.text.length * 6.2;
    parts.push('<line x1="' + rect.x + '" y1="' + y + '" x2="' + (rect.x + rect.w) + '" y2="' + y + '" stroke="#C65911" stroke-width="4" stroke-dasharray="18 12"/>');
    parts.push('<rect x="' + (labelX - halfWidth) + '" y="' + (y - 29) + '" width="' + (halfWidth * 2) + '" height="31" rx="12" fill="#FFFFFF" fill-opacity="0.94"/>');
    parts.push('<text x="' + labelX + '" y="' + (y - 6) + '" text-anchor="middle" font-family="' + FONT + '" font-size="22" font-weight="bold" fill="#C65911">' + esc(line.text) + '</text>');
  });
  if (s.joinedEdges) {
    parts.push('<rect x="' + rect.x + '" y="' + rect.y + '" width="' + EDGE_BAND_W + '" height="' + rect.h + '" fill="url(#pacific-edge)"/>');
    parts.push('<rect x="' + (rect.x + rect.w - EDGE_BAND_W) + '" y="' + rect.y + '" width="' + EDGE_BAND_W + '" height="' + rect.h + '" fill="url(#pacific-edge)"/>');
  }
  const labels = placedLabels(s, rect, rect.w, rect.h);
  labels.forEach(function (item) {
    const colour = item.kind === 'mark' ? '#' + item.colour
      : item.kind === 'continent' ? '#C65911' : item.kind === 'sea' ? '#2E7D45' : '#0070C0';
    const fill = item.kind === 'mark' ? '#FFFFFF'
      : item.kind === 'continent' ? '#FFF2CC' : item.kind === 'sea' ? '#E2F0D9' : '#DDEBF7';
    parts.push(drawLeader(item, rect, colour));
    parts.push(drawPill(item, rect, item.fontSize, fill, colour));
    if (item.repeatAt) {
      const repeated = maps.layoutLabels([{ text: item.text, anchor: item.repeatAt, preferred: item.repeatAt }], function (text) { return labelSize(text, item.fontSize, rect.w, rect.h); })[0];
      parts.push(drawPill(Object.assign(repeated, { text: item.text }), rect, item.fontSize, '#DDEBF7', '#0070C0'));
    }
  });
  s.clueMarkers.forEach(function (item) {
    parts.push(markerSvg(item, item.at, rect));
    if (item.repeatAt) parts.push(markerSvg(item, item.repeatAt, rect));
  });
  if (s.showCompass) {
    const cx = rect.x + rect.w - 75;
    const cy = rect.y + 77;
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + COMPASS_R + '" fill="#FFFFFF" fill-opacity="0.94" stroke="#17365D" stroke-width="3"/>');
    parts.push('<path d="M' + cx + ' ' + (cy - 38) + ' L' + (cx + 12) + ' ' + cy + ' L' + cx + ' ' + (cy + 38) + ' L' + (cx - 12) + ' ' + cy + ' Z" fill="#DDEBF7" stroke="#17365D" stroke-width="3"/>');
    parts.push('<text x="' + cx + '" y="' + (cy - 52) + '" text-anchor="middle" font-family="' + FONT + '" font-size="23" font-weight="bold" fill="#17365D">N</text>');
  }
}

function tightSvg(spec) {
  const s = resolve(spec);
  const uri = dataUri(s.entry);
  const w = 1800;
  const keyH = s.key.length ? KEY_H : 0;
  const h = (s.focus ? 900 : 900 + (s.joinedEdges ? FOOTER_H : 0)) + keyH;
  const parts = [
    '<defs>' + hatchDefs(s.annotations) + arrowDefs(s.annotations) + keyHatchDefs(s.key) + '<pattern id="pacific-edge" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="#DDEBF7"/><rect width="5" height="14" fill="#0070C0"/></pattern><marker id="edge-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#0070C0"/></marker><marker id="focus-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#C65911"/></marker><clipPath id="zoom-clip"><rect x="1190" y="105" width="570" height="650" rx="18"/></clipPath></defs>'
  ];
  const rect = s.focus ? { x: 20, y: 175, w: 1080, h: 540 } : { x: 0, y: 0, w: 1800, h: 900 };
  mapLayer(s, uri, rect, parts);

  if (s.focus) {
    const fw = s.entry.w * s.focus.span[0];
    const fh = s.entry.h * s.focus.span[1];
    const fx = Math.max(0, Math.min(s.entry.w - fw, s.focus.centre[0] * s.entry.w - fw / 2));
    const fy = Math.max(0, Math.min(s.entry.h - fh, s.focus.centre[1] * s.entry.h - fh / 2));
    const focusAt = project(s.focus.centre, rect);
    parts.push('<rect x="' + (focusAt.x - 32).toFixed(1) + '" y="' + (focusAt.y - 25).toFixed(1) + '" width="64" height="50" rx="12" fill="none" stroke="#C65911" stroke-width="6"/>');
    parts.push('<path d="M' + (focusAt.x + 34).toFixed(1) + ' ' + focusAt.y.toFixed(1) + ' C1130 ' + focusAt.y.toFixed(1) + ' 1120 430 1190 430" fill="none" stroke="#C65911" stroke-width="5" marker-end="url(#focus-arrow)"/>');
    parts.push('<rect x="1178" y="92" width="594" height="676" rx="22" fill="#FFFFFF" stroke="#17365D" stroke-width="5"/>');
    parts.push('<svg x="1190" y="105" width="570" height="650" viewBox="' + fx.toFixed(1) + ' ' + fy.toFixed(1) + ' ' + fw.toFixed(1) + ' ' + fh.toFixed(1) + '" preserveAspectRatio="xMidYMid meet" clip-path="url(#zoom-clip)"><image x="0" y="0" width="' + s.entry.w + '" height="' + s.entry.h + '" href="' + uri + '"/></svg>');
    parts.push('<rect x="1230" y="38" width="490" height="56" rx="18" fill="#FFF2CC" stroke="#C65911" stroke-width="3"/>');
    parts.push('<text x="1475" y="76" text-anchor="middle" font-family="' + FONT + '" font-size="30" font-weight="bold" fill="#17365D">' + esc(s.focus.title) + '</text>');
  } else if (s.joinedEdges) {
    parts.push('<path d="M24 920 C280 980 610 980 750 940" fill="none" stroke="#0070C0" stroke-width="5" marker-end="url(#edge-arrow)"/>');
    parts.push('<path d="M1776 920 C1520 980 1190 980 1050 940" fill="none" stroke="#0070C0" stroke-width="5" marker-end="url(#edge-arrow)"/>');
    parts.push('<text x="900" y="972" text-anchor="middle" font-family="' + FONT + '" font-size="25" font-weight="bold" fill="#0070C0">These patterned edges join: one Pacific Ocean</text>');
  }
  if (keyH) parts.push(keySvg(s.key, { x: 0, w }, h - keyH + 24));
  return {
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + parts.join('') + '</svg>',
    aspect: w / h,
    w,
    h
  };
}

module.exports = { tightSvg, cacheKey, resolve, MAP_KEY };
