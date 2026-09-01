'use strict';

const fs = require('fs');
const path = require('path');

const { FONT, COLOURS, FIT } = require('../styles');
const { warn } = require('../warnings');
const { drawMissingImage } = require('../images/placeholder');
const { longPathSafe } = require('../images/resolve');
const requireGlobal = require('../require-global');
const { polyline, arrow } = require('./_geom');
const { checkZoneFill } = require('./_zone-fill');
const shared = require('../../../shared/visuals/map-annotations');
const sevenContinentMap = require('../../../shared/visuals/seven-continent-world-map-svg');

// ─── CONSTANTS ───────────────────────────────
const PAD = 0.12;                 // zone padding (inches)
const CAPTION_H = 0.40;           // caption band (inches)
const CAPTION_GAP = 0.08;         // map-to-caption gap (inches)
const CAPTION_FONT = 14;          // caption ceiling (points)
const OVERLAY_LABEL_FONT = 18;    // annotation-label ceiling (points)
const BASIN_LINE_PT = 3;          // basin outline (points)
const BASIN_HALO_PT = 6;          // basin outline halo (points)
const BASIN_COLOUR = 'C65911';
const COUNTRY_FILL = { r: 189, g: 220, b: 235 };
const MARK_LINE_PT = 3;           // annotation stroke (points)
const MARK_HALO_PT = 6;           // annotation halo (points)
const MARK_DOT_IN = 0.13;         // point mark diameter (inches)
const GLOBE_PX = 640;             // globe raster diameter (pixels)
const TRANSFORM_PX = 1800;        // transformation raster width at all 3 stages
const LABEL_W_MIN = 0.82;         // label pill width floor (inches)
const LABEL_W_MAX = 1.62;         // label pill width ceiling (inches)
const LABEL_H = 0.34;             // label pill height (inches)
const LEADER_PT = 1.5;            // leader-line weight (points)
// ─── END CONSTANTS ───────────────────────────

const ASSET_DIR = shared.ASSET_DIR;
const MAPS = shared.MAPS;
const normaliseMapKey = shared.normaliseMapKey;
const normaliseOverlayName = shared.normaliseOverlayName;
const checkOverlaySupport = shared.checkOverlaySupport;
const BRAZIL_SEED = shared.BRAZIL_SEED_SOUTH_AMERICA;

function normalisePresentation(value) {
  return String(value || '').trim().toLowerCase().replace(/[ _]+/g, '-');
}

function transformationSpec(data) {
  const presentation = normalisePresentation(data && data.presentation);
  if (!presentation) return null;
  if (presentation === 'seven-continent-world') return null;
  if (presentation !== 'globe-to-flat') {
    throw new Error(
      'MAP_PRESENTATION_UNSUPPORTED: presentation ' + JSON.stringify(String(data.presentation)) +
        ' is not drawable. Supported: globe-to-flat, seven-continent-world.'
    );
  }
  const mapName = normaliseMapKey(data && data.map);
  if (mapName !== 'world') {
    throw new Error('MAP_TRANSFORMATION_UNSUPPORTED: globe-to-flat requires map "world".');
  }
  if ((data.annotations && data.annotations.length) || data.selectedCountry || data.basin) {
    throw new Error(
      'MAP_TRANSFORMATION_UNSUPPORTED: globe-to-flat explains the projection and cannot also carry place annotations or region overlays.'
    );
  }
  const revealStage = data.revealStage === undefined ? 3 : Number(data.revealStage);
  if (![1, 2, 3].includes(revealStage)) {
    throw new Error('MAP_TRANSFORMATION_INVALID: revealStage must be 1, 2 or 3.');
  }
  if (data.suppressSecondPacific !== undefined && typeof data.suppressSecondPacific !== 'boolean') {
    throw new Error('MAP_TRANSFORMATION_INVALID: suppressSecondPacific must be true or false.');
  }
  const defaults = {
    globe: 'A globe has no beginning or end.',
    cut: 'Choose one cut through the Pacific Ocean.',
    flat: 'Open the cut and lay the surface flat.'
  };
  const rawNotes = data.notes === undefined ? {} : data.notes;
  if (!rawNotes || typeof rawNotes !== 'object' || Array.isArray(rawNotes)) {
    throw new Error('MAP_TRANSFORMATION_INVALID: notes must be an object with globe, cut and flat text.');
  }
  const notes = {};
  for (const key of ['globe', 'cut', 'flat']) {
    notes[key] = rawNotes[key] === undefined ? defaults[key] : String(rawNotes[key]).trim();
    if (notes[key].length > 110) {
      throw new Error('MAP_TRANSFORMATION_INVALID: notes.' + key + ' must be 110 characters or fewer.');
    }
  }
  return {
    revealStage,
    suppressSecondPacific: data.suppressSecondPacific !== false,
    notes
  };
}

function sevenContinentSpec(data) {
  const presentation = normalisePresentation(data && data.presentation);
  if (presentation !== 'seven-continent-world') return null;
  return sevenContinentMap.resolve(data);
}

function mapKey(data) {
  const transform = transformationSpec(data);
  const seven = sevenContinentSpec(data);
  return [
    normaliseMapKey(data && data.map),
    normaliseOverlayName(data && data.selectedCountry),
    transform ? 'globe-to-flat' : '',
    transform ? transform.revealStage : '',
    transform ? (transform.suppressSecondPacific ? 'one-pacific' : 'two-edge-labels') : '',
    transform ? JSON.stringify(transform.notes) : '',
    seven ? sevenContinentMap.cacheKey(data) : ''
  ].join('|');
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

// Inverse orthographic sampling. The source pixels are the shipped
// equirectangular world map; no coastline or border is recreated here.
function projectEquirectangularToOrthographic(raw, info, centralLongitude, size) {
  const width = size || GLOBE_PX;
  const height = width;
  const channels = 4;
  const out = Buffer.alloc(width * height * channels);
  const radius = width / 2 - 3;
  const centre = width / 2;
  const lambda0 = Number(centralLongitude || 0) * Math.PI / 180;
  for (let y = 0; y < height; y += 1) {
    const ny = (y + 0.5 - centre) / radius;
    for (let x = 0; x < width; x += 1) {
      const nx = (x + 0.5 - centre) / radius;
      const rr = nx * nx + ny * ny;
      const dest = (y * width + x) * channels;
      if (rr > 1) continue;
      const z = Math.sqrt(Math.max(0, 1 - rr));
      const latitude = Math.asin(-ny);
      let longitude = lambda0 + Math.atan2(nx, z);
      while (longitude < -Math.PI) longitude += 2 * Math.PI;
      while (longitude >= Math.PI) longitude -= 2 * Math.PI;
      const sx = Math.min(info.width - 1, Math.max(0, Math.round((longitude + Math.PI) / (2 * Math.PI) * (info.width - 1))));
      const sy = Math.min(info.height - 1, Math.max(0, Math.round((Math.PI / 2 - latitude) / Math.PI * (info.height - 1))));
      const source = (sy * info.width + sx) * info.channels;
      out[dest] = raw[source];
      out[dest + 1] = raw[source + 1];
      out[dest + 2] = raw[source + 2];
      out[dest + 3] = 255;
    }
  }
  return { data: out, info: { width, height, channels } };
}

function esc(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

function wrapMeasured(text, maxUnits, maxLines) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (line && glyphUnits(next) > maxUnits) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    throw new Error('MAP_TRANSFORMATION_INVALID: a stage note is too long to fit its measured label area.');
  }
  return lines;
}

function noteSvg(text, centreX, topY, widthPx) {
  const lines = wrapMeasured(text, widthPx / 20, 3);
  return lines.map(function (line, index) {
    return `<text x="${centreX}" y="${topY + index * 26}" text-anchor="middle" class="note">${esc(line)}</text>`;
  }).join('');
}

function buildTransformationSvg(flatPng, globePng, pacificPng, spec) {
  const widths = [500, 1040, 1800];
  const canvasW = widths[spec.revealStage - 1];
  const flatData = flatPng.toString('base64');
  const globeData = globePng.toString('base64');
  const pacificData = pacificPng.toString('base64');
  const stage2 = spec.revealStage >= 2 ? `
    <path d="M500 340 H540" class="flow" marker-end="url(#arrow)"/>
    <text x="790" y="40" class="title">2. Cut through the Pacific</text>
    <image href="data:image/png;base64,${pacificData}" x="610" y="82" width="360" height="360"/>
    <circle cx="790" cy="262" r="178" fill="none" stroke="#0070C0" stroke-width="5"/>
    <path d="M790 86 V438" fill="none" stroke="#C65911" stroke-width="7" stroke-dasharray="18 12"/>
    <rect x="770" y="191" width="40" height="142" rx="18" fill="#FFFFFF" fill-opacity="0.90"/>
    <text x="790" y="252" text-anchor="middle" class="cutword" transform="rotate(-90 790 252)">PACIFIC CUT LINE</text>
    ${noteSvg(spec.notes.cut, 790, 492, 430)}` : '';
  const pacificLabels = spec.suppressSecondPacific ? `
      <path d="M1120 530 C1210 585 1325 585 1400 548" class="join" marker-end="url(#arrowBlue)"/>
      <path d="M1760 530 C1670 585 1555 585 1480 548" class="join" marker-end="url(#arrowBlue)"/>
      <text x="1440" y="604" text-anchor="middle" class="pacific">The patterned edges join: one Pacific Ocean</text>` : `
      <text x="1130" y="553" text-anchor="start" class="pacific">Pacific Ocean</text>
      <text x="1750" y="553" text-anchor="end" class="pacific">Pacific Ocean</text>`;
  const stage3 = spec.revealStage >= 3 ? `
    <path d="M1040 340 H1080" class="flow" marker-end="url(#arrow)"/>
    <text x="1440" y="40" class="title">3. Open and flatten</text>
    <image href="data:image/png;base64,${flatData}" x="1110" y="125" width="660" height="336"/>
    <rect x="1110" y="125" width="24" height="336" fill="url(#edgePattern)"/>
    <rect x="1746" y="125" width="24" height="336" fill="url(#edgePattern)"/>
    <rect x="1110" y="125" width="660" height="336" fill="none" stroke="#333333" stroke-width="3"/>
    ${pacificLabels}
    ${noteSvg(spec.notes.flat, 1440, 635, 650)}` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="680" viewBox="0 0 ${canvasW} 680">
    <defs>
      <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#C65911"/></marker>
      <marker id="arrowBlue" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 Z" fill="#0070C0"/></marker>
      <pattern id="edgePattern" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="16" height="16" fill="#DDEBF7"/><rect width="6" height="16" fill="#0070C0"/></pattern>
      <style>
        .title{font:700 29px Arial,sans-serif;fill:#17365D;text-anchor:middle}.note{font:700 21px Arial,sans-serif;fill:#333333}.flow{fill:none;stroke:#C65911;stroke-width:7}.cutword{font:700 18px Arial,sans-serif;fill:#C65911}.join{fill:none;stroke:#0070C0;stroke-width:5}.pacific{font:700 20px Arial,sans-serif;fill:#0070C0}
      </style>
    </defs>
    <text x="250" y="40" class="title">1. Begin with the globe</text>
    <image href="data:image/png;base64,${globeData}" x="70" y="82" width="360" height="360"/>
    <circle cx="250" cy="262" r="178" fill="none" stroke="#17365D" stroke-width="5"/>
    ${noteSvg(spec.notes.globe, 250, 492, 430)}
    ${stage2}${stage3}
  </svg>`;
}

async function preRenderTransformation(sharp, spec, assetPath) {
  try {
    const source = await sharp(longPathSafe(assetPath)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const globe = projectEquirectangularToOrthographic(source.data, source.info, 15, GLOBE_PX);
    const pacific = projectEquirectangularToOrthographic(source.data, source.info, 180, GLOBE_PX);
    const globePng = await sharp(globe.data, { raw: globe.info }).png().toBuffer();
    const pacificPng = await sharp(pacific.data, { raw: pacific.info }).png().toBuffer();
    const flatPng = fs.readFileSync(assetPath);
    const svg = buildTransformationSvg(flatPng, globePng, pacificPng, spec);
    const aspect = [500, 1040, 1800][spec.revealStage - 1] / 680;
    const resize = aspect >= 1 ? { width: TRANSFORM_PX } : { height: TRANSFORM_PX };
    const png = await sharp(Buffer.from(svg)).resize(resize).png().toBuffer();
    return { png, aspect, transformation: true };
  } catch (e) {
    throw new Error('MAP_TRANSFORMATION_RENDER_FAILED: ' + ((e && e.message) || e));
  }
}

async function preRenderMaps(lesson) {
  const specs = Object.entries(contentSpecs(lesson));
  for (const [, spec] of specs) {
    checkOverlaySupport(spec);
    shared.resolveAnnotations(spec);
    transformationSpec(spec);
    sevenContinentSpec(spec);
  }
  const wantsPixels = specs.some(function ([, spec]) {
    return Boolean(transformationSpec(spec)) || Boolean(sevenContinentSpec(spec)) ||
      (normaliseMapKey(spec.map) === 'south-america' && normaliseOverlayName(spec.selectedCountry) === 'brazil');
  });
  if (!wantsPixels) return {};

  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (e) {
    if (specs.some(function ([, spec]) { return Boolean(transformationSpec(spec)) || Boolean(sevenContinentSpec(spec)); })) {
      throw new Error('MAP_PRESENTATION_RENDER_FAILED: the sharp image library is not available.');
    }
    throw new Error('MAP_OVERLAY_RENDER_FAILED: the sharp image library is not available here, so the requested country shading could not be drawn.');
  }

  const rendered = {};
  for (const [key, spec] of specs) {
    const transform = transformationSpec(spec);
    const seven = sevenContinentSpec(spec);
    if (transform) {
      const worldAsset = path.join(ASSET_DIR, MAPS.world.file);
      if (!fs.existsSync(worldAsset)) throw new Error('MAP_TRANSFORMATION_RENDER_FAILED: the world map asset is missing.');
      rendered[key] = await preRenderTransformation(sharp, transform, worldAsset);
      continue;
    }
    if (seven) {
      try {
        const built = sevenContinentMap.tightSvg(spec);
        const resize = built.aspect >= 1 ? { width: TRANSFORM_PX } : { height: TRANSFORM_PX };
        const png = await sharp(Buffer.from(built.svg), { density: 144 }).resize(resize).png().toBuffer();
        rendered[key] = { png, aspect: built.aspect, sevenContinentWorld: true };
      } catch (e) {
        throw new Error('MAP_PRESENTATION_RENDER_FAILED: ' + ((e && e.message) || e));
      }
      continue;
    }
    const mapName = normaliseMapKey(spec.map);
    const country = normaliseOverlayName(spec.selectedCountry);
    if (mapName !== 'south-america' || country !== 'brazil') continue;
    const entry = MAPS[mapName];
    const assetPath = path.join(ASSET_DIR, entry.file);
    if (!fs.existsSync(assetPath)) throw new Error('MAP_OVERLAY_RENDER_FAILED: the south-america map asset is missing.');
    try {
      const image = sharp(longPathSafe(assetPath)).ensureAlpha();
      const decoded = await image.raw().toBuffer({ resolveWithObject: true });
      fillRegion(decoded.data, decoded.info, BRAZIL_SEED, COUNTRY_FILL);
      const png = await sharp(decoded.data, { raw: decoded.info }).png().toBuffer();
      rendered[key] = { png, aspect: entry.w / entry.h };
    } catch (e) {
      throw new Error('MAP_OVERLAY_RENDER_FAILED: could not shade Brazil on the south-america map: ' + ((e && e.message) || e));
    }
  }
  return rendered;
}

function labelsFor(data) {
  if (data.labels === false) return { country: '', basin: '' };
  const labels = data.labels && typeof data.labels === 'object' ? data.labels : {};
  return { country: labels.country || '', basin: labels.basin || '' };
}

function fractionPoint(point, x, y, w, h) {
  return { x: x + point[0] * w, y: y + point[1] * h };
}

function mapPoint(point, x, y, w, h, entry) {
  return fractionPoint([point[0] / entry.w, point[1] / entry.h], x, y, w, h);
}

function pillWidth(text) {
  return Math.min(LABEL_W_MAX, Math.max(LABEL_W_MIN, glyphUnits(text) * 0.19));
}

function drawMapPill(pptx, slide, text, box, colour) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: box.x, y: box.y, w: box.w, h: box.h,
    rectRadius: 0.05, fill: { color: 'FFFFFF', transparency: 8 },
    line: { color: colour || '333333', width: 1.2 }
  });
  slide.addText(String(text), {
    x: box.x + 0.04, y: box.y + 0.02, w: box.w - 0.08, h: box.h - 0.04,
    fontFace: FONT, fontSize: OVERLAY_LABEL_FONT, bold: true, color: COLOURS.body,
    align: 'center', valign: 'middle', margin: 0, fit: FIT
  });
}

function drawMapLabels(pptx, slide, items, fx, fy, fw, fh, where) {
  // The pill is sized in inches, because a label on the board is read from the
  // back of the room whatever size the map ended up. So the same labels that fit
  // a full-width map cannot fit that map in a sidebar, and the layout is what
  // finds that out.
  const placed = shared.refuseCrowdedLabels(
    shared.layoutLabels(items, function (text) {
      return { w: pillWidth(text) / fw, h: LABEL_H / fh };
    }),
    where
  );
  const boxes = placed.map(function (item) {
    return { item, box: { x: fx + item.box.x * fw, y: fy + item.box.y * fh, w: item.box.w * fw, h: item.box.h * fh } };
  });
  boxes.forEach(function (entry) {
    if (!entry.item.leader) return;
    const from = fractionPoint(entry.item.leader[0], fx, fy, fw, fh);
    const to = fractionPoint(entry.item.leader[1], fx, fy, fw, fh);
    polyline(pptx, slide, [from, to], { lineColor: entry.item.colour || '333333', width: LEADER_PT });
  });
  boxes.forEach(function (entry) { drawMapPill(pptx, slide, entry.item.text, entry.box, entry.item.colour); });
}

// The plain slide map draws its marks as PowerPoint shapes over the asset, and a
// PowerPoint line cannot carry a hatch fill. So shading is refused here by name
// rather than quietly coming out as a bare outline: the whole point of shading a
// region is that the region reads as filled, and an outline says something else.
// The seven-continent-world presentation composes its picture as a drawing
// before it reaches the slide, which is why shading works there.
function refuseUndrawableShading(marks) {
  const shaded = marks.filter(function (mark) { return mark.shaded; });
  if (!shaded.length) return;
  throw new Error(
    'MAP_SHADING_UNSUPPORTED: ' + shaded.map(function (m) { return JSON.stringify(m.label || m.kind); }).join(', ') +
      ' asked to be shaded, which this map route draws as shapes on the slide and cannot fill. ' +
      'Use presentation "seven-continent-world" on map "world-with-antarctica", which composes the ' +
      'shading, the key and the latitude lines into one picture, or drop `shaded` for a dashed outline.'
  );
}

function drawAnnotations(pptx, slide, marks, fx, fy, fw, fh) {
  marks.forEach(function (mark) {
    if (mark.kind === 'point') {
      const at = fractionPoint(mark.at, fx, fy, fw, fh);
      slide.addShape(pptx.ShapeType.ellipse, {
        x: at.x - MARK_DOT_IN / 2, y: at.y - MARK_DOT_IN / 2, w: MARK_DOT_IN, h: MARK_DOT_IN,
        fill: { color: mark.colour }, line: { color: 'FFFFFF', width: 1.5 }
      });
    } else {
      const points = mark.points.map(function (p) { return fractionPoint(p, fx, fy, fw, fh); });
      const pathPoints = mark.kind === 'area' ? points.concat([points[0]]) : points;
      polyline(pptx, slide, pathPoints, { lineColor: 'FFFFFF', width: MARK_HALO_PT });
      polyline(pptx, slide, pathPoints, { lineColor: mark.colour, width: MARK_LINE_PT, dash: mark.kind === 'area' ? 'dash' : undefined });
      // The head goes on as its own final segment, because a PowerPoint
      // freeform carries no arrowhead. Drawn over the last leg of the line it
      // has just traced, so the point of the head lands exactly where the route
      // ends rather than near it.
      if (mark.arrow) {
        const last = points[points.length - 1];
        const before = points[points.length - 2];
        arrow(pptx, slide, before.x, before.y, last.x, last.y, { color: mark.colour, width: MARK_LINE_PT });
        if (mark.arrow === 'both') {
          arrow(pptx, slide, points[1].x, points[1].y, points[0].x, points[0].y, { color: mark.colour, width: MARK_LINE_PT });
        }
      }
    }
  });
}

function drawMap(pptx, slide, zone, data, ctx) {
  checkOverlaySupport(data);
  const transform = transformationSpec(data);
  const seven = sevenContinentSpec(data);
  const special = transform || seven;
  const marks = shared.resolveAnnotations(data);
  const key = normaliseMapKey(data.map);
  const entry = MAPS[key];
  const caption = data.caption || '';
  const hasCaption = caption.length > 0;
  const frameX = zone.x + PAD;
  const frameY = zone.y + PAD;
  const frameW = zone.w - 2 * PAD;
  const frameH = zone.h - 2 * PAD - (hasCaption ? CAPTION_H + CAPTION_GAP : 0);
  const prepared = ctx && ctx.mapImages && ctx.mapImages[mapKey(data)];

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

  const imgAspect = special ? (prepared && prepared.aspect) : entry.w / entry.h;
  if (!imgAspect || !Number.isFinite(imgAspect)) {
    throw new Error('MAP_PRESENTATION_RENDER_FAILED: the prepared map presentation image is missing.');
  }
  const frameAspect = frameW / frameH;
  let fittedW;
  let fittedH;
  if (imgAspect > frameAspect) { fittedW = frameW; fittedH = frameW / imgAspect; }
  else { fittedH = frameH; fittedW = frameH * imgAspect; }
  const fittedX = frameX + (frameW - fittedW) / 2;
  const fittedY = frameY + (frameH - fittedH) / 2;

  // A map keeps its true shape, so a slot shaped unlike it leaves the rest
  // empty and the map ends up a fraction of the size the slide had room for.
  checkZoneFill(ctx, zone, { w: fittedW, h: fittedH }, `the ${key} map`);

  if (prepared && prepared.png) {
    slide.addImage({ data: 'image/png;base64,' + prepared.png.toString('base64'), x: fittedX, y: fittedY, w: fittedW, h: fittedH });
  } else {
    slide.addImage({ path: assetPath, x: fittedX, y: fittedY, w: fittedW, h: fittedH });
  }

  if (!special) {
    refuseUndrawableShading(marks);
    const basin = normaliseOverlayName(data.basin);
    if (key === 'south-america' && basin === 'amazon basin') {
      const points = shared.AMAZON_BASIN_SOUTH_AMERICA.map(function (point) { return fractionPoint(point, fittedX, fittedY, fittedW, fittedH); });
      polyline(pptx, slide, points, { lineColor: 'FFFFFF', width: BASIN_HALO_PT });
      polyline(pptx, slide, points, { lineColor: BASIN_COLOUR, width: BASIN_LINE_PT, dash: 'dash' });
    }
    drawAnnotations(pptx, slide, marks, fittedX, fittedY, fittedW, fittedH);
    const labels = labelsFor(data);
    const labelItems = [];
    if (key === 'south-america') {
      if (normaliseOverlayName(data.selectedCountry) === 'brazil' && labels.country) {
        labelItems.push({ text: labels.country, anchor: shared.BRAZIL_LABEL_SOUTH_AMERICA, preferred: shared.BRAZIL_LABEL_SOUTH_AMERICA });
      }
      if (basin === 'amazon basin' && labels.basin) {
        labelItems.push({ text: labels.basin, anchor: shared.AMAZON_BASIN_LABEL_SOUTH_AMERICA, preferred: shared.AMAZON_BASIN_LABEL_SOUTH_AMERICA, colour: BASIN_COLOUR });
      }
    }
    marks.forEach(function (mark) {
      if (mark.label) labelItems.push({ text: mark.label, anchor: mark.anchor, preferred: mark.labelAt, colour: mark.colour });
    });
    drawMapLabels(
      pptx, slide, labelItems, fittedX, fittedY, fittedW, fittedH,
      `the ${key} map at ${fittedW.toFixed(2)}in wide`
    );
  }

  if (hasCaption) {
    slide.addText(caption, {
      x: frameX, y: frameY + frameH + CAPTION_GAP, w: frameW, h: CAPTION_H,
      fontFace: FONT, fontSize: CAPTION_FONT, italic: true, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }
}

module.exports = {
  drawMap,
  preRenderMaps,
  mapKey,
  normaliseMapKey,
  mapPoint,
  transformationSpec,
  sevenContinentSpec,
  projectEquirectangularToOrthographic,
  buildTransformationSvg
};
