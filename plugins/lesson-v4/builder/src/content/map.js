'use strict';

const fs = require('fs');
const path = require('path');

const { FONT, COLOURS, FIT } = require('../styles');
const { warn } = require('../warnings');
const { drawMissingImage } = require('../images/placeholder');
const { longPathSafe } = require('../images/resolve');
const requireGlobal = require('../require-global');
const { polyline } = require('./_geom');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD          = 0.12;
const CAPTION_H    = 0.40;
const CAPTION_GAP  = 0.08;
const CAPTION_FONT = 14;
const OVERLAY_LABEL_FONT = 18;
const BASIN_LINE_PT = 3;
const BASIN_HALO_PT = 6;
const BASIN_COLOUR = 'C65911';
const COUNTRY_FILL = { r: 189, g: 220, b: 235 };
// ─── END CONSTANTS ────────────────────────────────────────────

const ASSET_DIR = path.resolve(__dirname, '..', '..', 'assets', 'maps');

// Real pixel dimensions recorded here at authoring time rather than read from
// the file at render time, the same way money.js hardcodes each coin's
// real-world size instead of inspecting the asset — it keeps this renderer
// synchronous and avoids a dependency on ctx.imageDims, which nothing in the
// pipeline currently populates. Add a new entry whenever a new file is added
// to builder/assets/maps/.
const MAPS = {
  world:           { file: 'world.png', w: 1272, h: 647 },
  europe:          { file: 'europe.png', w: 554, h: 554 },
  africa:          { file: 'africa.png', w: 554, h: 554 },
  asia:            { file: 'asia.png', w: 624, h: 491 },
  'south-america': { file: 'south-america.png', w: 472, h: 649 },
  'north-america': { file: 'north-america.jpg', w: 1936, h: 2200 },
  oceania:         { file: 'oceania.jpg', w: 2200, h: 1690 }
};

const BRAZIL_SEED = { x: 300, y: 220 };
const AMAZON_BASIN = [
  [86, 98], [116, 76], [158, 78], [205, 92], [253, 109], [306, 121],
  [353, 143], [378, 176], [365, 203], [329, 226], [286, 242], [241, 261],
  [198, 270], [153, 253], [119, 231], [90, 204], [75, 170], [74, 134], [86, 98]
];

function normaliseMapKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[ _]+/g, '-');
}

function normaliseOverlayName(value) {
  return String(value || '').trim().toLowerCase().replace(/[-_]+/g, ' ');
}

// What this helper can actually draw on top of a base map.
//
// Normalising "South_America" to "south-america" is harmless: the same place,
// spelled differently. An overlay is not like that. A country the drawing has no
// region for cannot be shaded, and quietly rendering the plain map instead sends
// a teacher a slide that is missing the one thing it was asked for - with
// nothing anywhere saying so. So a requested overlay either appears or the build
// says why it did not.
const COUNTRY_OVERLAYS = new Set(['brazil']);
const BASIN_OVERLAYS = new Set(['amazon basin']);

function checkOverlaySupport(data) {
  const country = normaliseOverlayName(data && data.selectedCountry);
  if (country && !COUNTRY_OVERLAYS.has(country)) {
    throw new Error(
      `MAP_OVERLAY_UNSUPPORTED: selectedCountry ${JSON.stringify(String(data.selectedCountry))} ` +
        `has no shaded region in this map. Supported: ${[...COUNTRY_OVERLAYS].join(', ')}.`
    );
  }

  const basin = normaliseOverlayName(data && data.basin);
  if (basin && !BASIN_OVERLAYS.has(basin)) {
    throw new Error(
      `MAP_OVERLAY_UNSUPPORTED: basin ${JSON.stringify(String(data.basin))} ` +
        `has no outline in this map. Supported: ${[...BASIN_OVERLAYS].join(', ')}.`
    );
  }
}

function mapKey(data) {
  return [normaliseMapKey(data && data.map), normaliseOverlayName(data && data.selectedCountry)].join('|');
}

function contentSpecs(lesson) {
  const specs = {};
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.type === 'map') specs[mapKey(obj)] = obj;
    Object.keys(obj).forEach(function (key) { walk(obj[key]); });
  }
  walk(lesson);
  return specs;
}

function fillRegion(raw, info, seed, colour) {
  const width = info.width;
  const height = info.height;
  const channels = info.channels;
  const start = seed.y * width + seed.x;
  const seen = new Uint8Array(width * height);
  const stack = [start];
  seen[start] = 1;

  function isOpen(index) {
    const p = index * channels;
    return raw[p] > 235 && raw[p + 1] > 235 && raw[p + 2] > 235;
  }

  while (stack.length) {
    const index = stack.pop();
    if (!isOpen(index)) continue;
    const p = index * channels;
    raw[p] = colour.r;
    raw[p + 1] = colour.g;
    raw[p + 2] = colour.b;
    const x = index % width;
    const neighbours = [index - 1, index + 1, index - width, index + width];
    neighbours.forEach(function (next, direction) {
      if (next < 0 || next >= width * height || seen[next]) return;
      if ((direction === 0 && x === 0) || (direction === 1 && x === width - 1)) return;
      seen[next] = 1;
      if (isOpen(next)) stack.push(next);
    });
  }
}

async function preRenderMaps(lesson) {
  const specs = Object.entries(contentSpecs(lesson));

  // Every requested overlay is checked whether or not this machine can draw
  // one, so an unsupported name is reported the same way everywhere.
  for (const [, spec] of specs) checkOverlaySupport(spec);

  const wantsOverlay = specs.some(
    ([, spec]) =>
      normaliseMapKey(spec.map) === 'south-america' &&
      normaliseOverlayName(spec.selectedCountry) === 'brazil'
  );

  let sharp;
  try {
    sharp = requireGlobal('sharp');
  } catch (e) {
    if (wantsOverlay) {
      // Asked for shading on a box that cannot produce it. Technical, and
      // fixable - but not something to discover from the printed slide.
      throw new Error(
        'MAP_OVERLAY_RENDER_FAILED: the sharp image library is not available ' +
          'here, so the requested country shading could not be drawn.'
      );
    }
    return {};
  }

  const rendered = {};
  for (const [key, spec] of specs) {
    const mapName = normaliseMapKey(spec.map);
    const country = normaliseOverlayName(spec.selectedCountry);
    if (mapName !== 'south-america' || country !== 'brazil') continue;
    const entry = MAPS[mapName];
    const assetPath = path.join(ASSET_DIR, entry.file);
    if (!fs.existsSync(assetPath)) {
      throw new Error(
        `MAP_OVERLAY_RENDER_FAILED: the ${mapName} map asset is missing, so the ` +
          `requested country shading could not be drawn.`
      );
    }
    try {
      // sharp needs the long-path form; fs above does not. See images/resolve.js.
      const image = sharp(longPathSafe(assetPath)).ensureAlpha();
      const decoded = await image.raw().toBuffer({ resolveWithObject: true });
      fillRegion(decoded.data, decoded.info, BRAZIL_SEED, COUNTRY_FILL);
      const png = await sharp(decoded.data, { raw: decoded.info }).png().toBuffer();
      rendered[key] = { png, aspect: entry.w / entry.h };
    } catch (e) {
      // The shading WAS asked for, so falling back to the plain map would hand
      // over a slide missing the thing that made it worth showing, and say
      // nothing. A picture that failed to draw is a fault, not a variant.
      throw new Error(
        `MAP_OVERLAY_RENDER_FAILED: could not shade ${JSON.stringify(String(spec.selectedCountry))} ` +
          `on the ${mapName} map: ${(e && e.message) || e}`
      );
    }
  }
  return rendered;
}

// Words printed ON the map, which are only ever words somebody wrote.
//
// These used to fall back to the overlay's own field, so asking to shade Brazil
// silently printed the word "Brazil" across the country. That is a teaching
// decision made by a renderer: a map for "which country is this?" must not
// answer its own question, and nothing in the spec had asked for a label.
function labelsFor(data) {
  if (data.labels === false) return { country: '', basin: '' };
  const labels = data.labels && typeof data.labels === 'object' ? data.labels : {};
  return {
    country: labels.country || '',
    basin: labels.basin || ''
  };
}

function mapPoint(point, x, y, w, h, entry) {
  return { x: x + point[0] / entry.w * w, y: y + point[1] / entry.h * h };
}

function drawMapLabel(pptx, slide, text, px, py, mapW, mapH) {
  if (!text) return;
  const w = Math.min(1.62, Math.max(0.82, String(text).length * 0.105));
  const h = 0.34;
  const x = px - w / 2;
  const y = py - h / 2;
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.05,
    fill: { color: 'FFFFFF', transparency: 8 },
    line: { color: '333333', width: 1.2 }
  });
  slide.addText(String(text), {
    x: x + 0.04, y: y + 0.02, w: w - 0.08, h: h - 0.04,
    fontFace: FONT, fontSize: OVERLAY_LABEL_FONT, bold: true, color: COLOURS.body,
    align: 'center', valign: 'middle', margin: 0, fit: FIT
  });
}

function drawMap(pptx, slide, zone, data, ctx) {
  // Before anything is drawn: an overlay this map cannot produce is a refusal,
  // not a quieter picture.
  checkOverlaySupport(data);

  const key = normaliseMapKey(data.map);
  const entry = MAPS[key];
  const caption = data.caption || '';
  const hasCaption = caption.length > 0;

  const frameX = zone.x + PAD;
  const frameY = zone.y + PAD;
  const frameW = zone.w - 2 * PAD;
  const frameH = zone.h - 2 * PAD - (hasCaption ? (CAPTION_H + CAPTION_GAP) : 0);

  if (!entry) {
    if (ctx) warn(ctx.slideIndex, `map "${key}" is unknown — rendering placeholder. Known maps: ${Object.keys(MAPS).join(', ')}`);
    drawMissingImage(slide, { x: frameX, y: frameY, w: frameW, h: frameH });
    return;
  }

  const assetPath = path.join(ASSET_DIR, entry.file);
  if (!fs.existsSync(assetPath)) {
    if (ctx) warn(ctx.slideIndex, `map asset file missing for "${key}" — rendering placeholder`);
    drawMissingImage(slide, { x: frameX, y: frameY, w: frameW, h: frameH });
    return;
  }

  // True contain: preserve the map's real aspect ratio, centred in the zone —
  // the same non-distorting fit image.js uses for photos. A stretched map
  // draws countries the wrong shape, which is worse than a smaller map.
  const imgAspect = entry.w / entry.h;
  const frameAspect = frameW / frameH;
  let fittedW, fittedH;
  if (imgAspect > frameAspect) {
    fittedW = frameW;
    fittedH = frameW / imgAspect;
  } else {
    fittedH = frameH;
    fittedW = frameH * imgAspect;
  }
  const fittedX = frameX + (frameW - fittedW) / 2;
  const fittedY = frameY + (frameH - fittedH) / 2;

  const prepared = ctx && ctx.mapImages && ctx.mapImages[mapKey(data)];
  if (prepared && prepared.png) {
    slide.addImage({ data: 'image/png;base64,' + prepared.png.toString('base64'), x: fittedX, y: fittedY, w: fittedW, h: fittedH });
  } else {
    slide.addImage({ path: assetPath, x: fittedX, y: fittedY, w: fittedW, h: fittedH });
  }

  const basin = normaliseOverlayName(data.basin);
  if (key === 'south-america' && basin === 'amazon basin') {
    const points = AMAZON_BASIN.map(function (point) {
      return mapPoint(point, fittedX, fittedY, fittedW, fittedH, entry);
    });
    polyline(pptx, slide, points, { lineColor: 'FFFFFF', width: BASIN_HALO_PT });
    polyline(pptx, slide, points, { lineColor: BASIN_COLOUR, width: BASIN_LINE_PT, dash: 'dash' });
  }

  const labels = labelsFor(data);
  if (key === 'south-america') {
    if (normaliseOverlayName(data.selectedCountry) === 'brazil') {
      const countryPoint = mapPoint([294, 286], fittedX, fittedY, fittedW, fittedH, entry);
      drawMapLabel(pptx, slide, labels.country, countryPoint.x, countryPoint.y, fittedW, fittedH);
    }
    if (basin === 'amazon basin') {
      const basinPoint = mapPoint([210, 163], fittedX, fittedY, fittedW, fittedH, entry);
      drawMapLabel(pptx, slide, labels.basin, basinPoint.x, basinPoint.y, fittedW, fittedH);
    }
  }

  if (hasCaption) {
    slide.addText(caption, {
      x: frameX, y: frameY + frameH + CAPTION_GAP, w: frameW, h: CAPTION_H,
      fontFace: FONT, fontSize: CAPTION_FONT, italic: true, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }
}

module.exports = { drawMap, preRenderMaps, mapKey, normaliseMapKey };
