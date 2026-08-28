'use strict';

const fs = require('fs');
const path = require('path');

const requireGlobal = require('../require-global');
let sharp = null;
function getSharp() {
  if (!sharp) sharp = requireGlobal('sharp');
  return sharp;
}

const MAX_DIMENSION = 1600;

// Sourced maps and diagrams often arrive matted on a white page, and that border
// is dead space on the board: the picture is sized to its file, so the padding
// eats the room and the map itself renders smaller than the slide could show. The
// teacher's own fix is to crop the white away so the picture can be bigger, and
// this does the same thing once, centrally, so every surface that draws the photo
// (slides, worksheets, the working wall, stick-in sheets) gets the cropped version.
//
// Only a near-WHITE border is taken, because that is a matte rather than content:
// trimming any uniform edge would eat a real sky or a plain wall out of a
// photograph. The kept-area floor is the second guard: a "trim" that removes most
// of the picture means the edge colour ran into the subject, so the original is
// left alone rather than shipped mangled.
const TRIM_THRESHOLD = 12;      // how far from pure white still counts as matte
const MIN_AREA_KEPT = 0.55;     // below this, assume the trim ate real content
const MIN_AREA_GAIN = 0.02;     // ignore trims too small to be worth a cache file

function collectImagePaths(lesson) {
  const out = new Set();
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (typeof obj.imagePath === 'string' && obj.imagePath) {
      out.add(obj.imagePath);
    }
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    for (const k of Object.keys(obj)) walk(obj[k]);
  }
  walk(lesson);
  return Array.from(out);
}

// Returns the white-matte-trimmed image as a buffer when trimming genuinely helps,
// and null when the picture should be left exactly as it arrived.
async function trimWhiteMatte(s, absolute, width, height) {
  if (!width || !height) return null;
  try {
    const out = await s(absolute)
      .trim({ background: '#ffffff', threshold: TRIM_THRESHOLD })
      .toBuffer({ resolveWithObject: true });
    const areaBefore = width * height;
    const areaAfter = (out.info.width || 0) * (out.info.height || 0);
    if (!areaAfter) return null;
    const kept = areaAfter / areaBefore;
    if (kept < MIN_AREA_KEPT) return null;        // the trim reached into the subject
    if (kept > 1 - MIN_AREA_GAIN) return null;    // nothing meaningful to remove
    return out.data;
  } catch (err) {
    return null;                                   // no matte found, or trim unsupported
  }
}

async function resizeIfNeeded(imagePath, lessonDir, keepFraming) {
  if (!imagePath) return;
  const absolute = path.isAbsolute(imagePath) ? imagePath : path.join(lessonDir, imagePath);
  if (!fs.existsSync(absolute)) return;

  const relative = path.relative(lessonDir, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return;

  const cachePath = path.join(lessonDir, '.resized', relative);
  const s = getSharp();

  try {
    const metadata = await s(absolute).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // A labelled diagram pins each dot to a percentage of its base image, so
    // re-cropping that image would slide every dot off the part it names. Those
    // bases keep their framing and are only ever resized.
    const trimmed = keepFraming ? null : await trimWhiteMatte(s, absolute, width, height);
    const oversized = width > MAX_DIMENSION || height > MAX_DIMENSION;
    if (!trimmed && !oversized) return;

    if (fs.existsSync(cachePath)) {
      const srcStat = fs.statSync(absolute);
      const cacheStat = fs.statSync(cachePath);
      if (cacheStat.mtimeMs >= srcStat.mtimeMs) return;
    }

    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    await s(trimmed || absolute)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .toFile(cachePath);
  } catch (err) {
    console.warn(`[resize] could not prepare ${absolute}: ${err.message}`);
  }
}

// The base image of a labelled diagram, whose callout dots are placed as
// percentages of the picture and so depend on its exact framing.
function collectAnchoredImagePaths(lesson) {
  const out = new Set();
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.type === 'label-diagram' && typeof obj.imagePath === 'string') {
      out.add(obj.imagePath);
    }
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    for (const k of Object.keys(obj)) walk(obj[k]);
  }
  walk(lesson);
  return out;
}

async function preResizeAll(lesson, lessonDir) {
  const paths = collectImagePaths(lesson);
  const anchored = collectAnchoredImagePaths(lesson);
  for (const p of paths) {
    await resizeIfNeeded(p, lessonDir, anchored.has(p));
  }
}

module.exports = { preResizeAll };
