'use strict';

const fs = require('fs');
const path = require('path');

const { FONT, COLOURS, FIT } = require('../styles');
const { warn } = require('../warnings');
const { drawMissingImage } = require('../images/placeholder');
const { longPathSafe } = require('../images/resolve');
const requireGlobal = require('../require-global');
const { polyline } = require('./_geom');
const shared = require('../../../shared/visuals/map-annotations');

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
const MARK_LINE_PT  = 3;      // annotation stroke (points)
const MARK_HALO_PT  = 6;      // white halo behind it, so a mark stays visible over dark map ink
const MARK_DOT_IN   = 0.13;   // point-annotation dot diameter (inches)
// ─── END CONSTANTS ────────────────────────────────────────────

const ASSET_DIR = shared.ASSET_DIR;

// The map registry, the two named overlays and the annotation contract all live
// in shared/visuals/map-annotations.js, so the slide engine and the worksheet
// engine draw the identical geography from the identical real asset.
const MAPS = shared.MAPS;
const normaliseMapKey = shared.normaliseMapKey;
const normaliseOverlayName = shared.normaliseOverlayName;
const checkOverlaySupport = shared.checkOverlaySupport;

const BRAZIL_SEED = shared.BRAZIL_SEED_SOUTH_AMERICA;

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

  // Every requested overlay and annotation is checked whether or not this
  // machine can draw one, so a bad value is reported the same way everywhere.
  for (const [, spec] of specs) {
    checkOverlaySupport(spec);
    shared.resolveAnnotations(spec);
  }

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

function fractionPoint(point, x, y, w, h) {
  return { x: x + point[0] * w, y: y + point[1] * h };
}

function mapPoint(point, x, y, w, h, entry) {
  return fractionPoint([point[0] / entry.w, point[1] / entry.h], x, y, w, h);
}

const LABEL_W_MIN = 0.82;   // label pill width floor (inches)
const LABEL_W_MAX = 1.62;   // label pill width ceiling (inches)
const LABEL_H     = 0.34;   // label pill height (inches)
const LEADER_PT   = 1.5;    // leader-line weight (points)

function pillWidth(text) {
  return Math.min(LABEL_W_MAX, Math.max(LABEL_W_MIN, String(text).length * 0.105));
}

function drawMapPill(pptx, slide, text, box, colour) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: box.x, y: box.y, w: box.w, h: box.h,
    rectRadius: 0.05,
    fill: { color: 'FFFFFF', transparency: 8 },
    line: { color: colour || '333333', width: 1.2 }
  });
  slide.addText(String(text), {
    x: box.x + 0.04, y: box.y + 0.02, w: box.w - 0.08, h: box.h - 0.04,
    fontFace: FONT, fontSize: OVERLAY_LABEL_FONT, bold: true, color: COLOURS.body,
    align: 'center', valign: 'middle', margin: 0, fit: FIT
  });
}

// Every word printed on the map goes through one layout pass, shared with the
// worksheet engine, rather than each label being dropped where its own mark
// happens to sit. Three marks a few percent apart used to print three pills on
// top of each other and only the last was readable.
function drawMapLabels(pptx, slide, items, fx, fy, fw, fh) {
  const placed = shared.layoutLabels(items, function (text) {
    return { w: pillWidth(text) / fw, h: LABEL_H / fh };
  });
  const boxes = placed.map(function (item) {
    return {
      item,
      box: { x: fx + item.box.x * fw, y: fy + item.box.y * fh, w: item.box.w * fw, h: item.box.h * fh }
    };
  });
  // Leaders first, so no line is drawn across the words it belongs to.
  boxes.forEach(function (entry) {
    if (!entry.item.leader) return;
    const from = fractionPoint(entry.item.leader[0], fx, fy, fw, fh);
    const to = fractionPoint(entry.item.leader[1], fx, fy, fw, fh);
    polyline(pptx, slide, [from, to], { lineColor: entry.item.colour || '333333', width: LEADER_PT });
  });
  boxes.forEach(function (entry) {
    drawMapPill(pptx, slide, entry.item.text, entry.box, entry.item.colour);
  });
}

// Marks drawn ON TOP of the real map: a dot on a city, a dashed outline round a
// region, a line along a river. Every one is placed in fractions of the real
// asset, so nothing here redraws the land itself.
function drawAnnotations(pptx, slide, marks, fx, fy, fw, fh) {
  marks.forEach(function (mark) {
    if (mark.kind === 'point') {
      const at = fractionPoint(mark.at, fx, fy, fw, fh);
      slide.addShape(pptx.ShapeType.ellipse, {
        x: at.x - MARK_DOT_IN / 2, y: at.y - MARK_DOT_IN / 2, w: MARK_DOT_IN, h: MARK_DOT_IN,
        fill: { color: mark.colour },
        line: { color: 'FFFFFF', width: 1.5 }
      });
    } else {
      const points = mark.points.map(function (p) { return fractionPoint(p, fx, fy, fw, fh); });
      // An area closes back on itself; a river does not.
      const path = mark.kind === 'area' ? points.concat([points[0]]) : points;
      polyline(pptx, slide, path, { lineColor: 'FFFFFF', width: MARK_HALO_PT });
      polyline(pptx, slide, path, {
        lineColor: mark.colour,
        width: MARK_LINE_PT,
        dash: mark.kind === 'area' ? 'dash' : undefined
      });
    }
  });
}

function drawMap(pptx, slide, zone, data, ctx) {
  // Before anything is drawn: an overlay or annotation this map cannot produce
  // is a refusal, not a quieter picture.
  checkOverlaySupport(data);
  const marks = shared.resolveAnnotations(data);

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
    const points = shared.AMAZON_BASIN_SOUTH_AMERICA.map(function (point) {
      return fractionPoint(point, fittedX, fittedY, fittedW, fittedH);
    });
    polyline(pptx, slide, points, { lineColor: 'FFFFFF', width: BASIN_HALO_PT });
    polyline(pptx, slide, points, { lineColor: BASIN_COLOUR, width: BASIN_LINE_PT, dash: 'dash' });
  }

  drawAnnotations(pptx, slide, marks, fittedX, fittedY, fittedW, fittedH);

  const labels = labelsFor(data);
  const labelItems = [];
  if (key === 'south-america') {
    if (normaliseOverlayName(data.selectedCountry) === 'brazil' && labels.country) {
      labelItems.push({
        text: labels.country,
        anchor: shared.BRAZIL_LABEL_SOUTH_AMERICA,
        preferred: shared.BRAZIL_LABEL_SOUTH_AMERICA
      });
    }
    if (basin === 'amazon basin' && labels.basin) {
      labelItems.push({
        text: labels.basin,
        anchor: shared.AMAZON_BASIN_LABEL_SOUTH_AMERICA,
        preferred: shared.AMAZON_BASIN_LABEL_SOUTH_AMERICA,
        colour: BASIN_COLOUR
      });
    }
  }
  marks.forEach(function (mark) {
    if (!mark.label) return;
    labelItems.push({ text: mark.label, anchor: mark.anchor, preferred: mark.labelAt, colour: mark.colour });
  });
  drawMapLabels(pptx, slide, labelItems, fittedX, fittedY, fittedW, fittedH);

  if (hasCaption) {
    slide.addText(caption, {
      x: frameX, y: frameY + frameH + CAPTION_GAP, w: frameW, h: CAPTION_H,
      fontFace: FONT, fontSize: CAPTION_FONT, italic: true, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }
}

module.exports = { drawMap, preRenderMaps, mapKey, normaliseMapKey, mapPoint };
