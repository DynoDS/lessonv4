'use strict';

const fs = require('fs');
const path = require('path');

const { normalizeLocalPath, longPathSafe } = require('./resolve');

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
// this does the same thing once, centrally, before a slide build. Only the slides
// read the cropped copy: worksheets, the working wall and stick-in sheets draw
// the picture as it arrived. The slide is laid out by the copy's own shape
// (measure.js), so the crop changes the picture's size and never its proportions.
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

// Is the copy the whole picture, only smaller? Resizing to fit 1600 pixels
// rounds each side to a whole pixel, so "the same shape" allows a pixel.
async function sameShape(s, copy, width, height) {
  try {
    const meta = await s(copy).metadata();
    if (!meta.width || !meta.height) return false;
    return Math.abs(meta.width / meta.height - width / height) <= 1.5 / Math.min(meta.width, meta.height);
  } catch (err) {
    return false;
  }
}

// A copy with no picture to stand in for, or one the picture no longer needs, is
// taken away: the slide would otherwise go on showing it.
function removeCopy(cachePath) {
  try { fs.rmSync(cachePath, { force: true }); } catch (err) { /* left for next time */ }
}

async function resizeIfNeeded(imagePath, lessonDir, keepFraming) {
  if (!imagePath) return;
  const local = normalizeLocalPath(imagePath);
  const base = normalizeLocalPath(lessonDir);
  const absolute = path.isAbsolute(local) ? local : path.join(base, local);

  const relative = path.relative(base, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return;

  const cachePath = path.join(base, '.resized', relative);
  if (!fs.existsSync(absolute)) {
    removeCopy(cachePath);
    return;
  }
  const s = getSharp();

  // Every sharp call gets the long-path form of the file. Node's own fs calls
  // above go past 260 characters happily; sharp does not, so a lesson folder
  // deep inside OneDrive would otherwise leave every photograph unreadable to
  // the only library that measures and crops it.
  const readable = longPathSafe(absolute);
  const writable = longPathSafe(cachePath);

  try {
    // A copy written after the picture was last saved was made from this
    // picture. Publishing a picture always writes a new file, so a replaced
    // picture is newer than any copy made from the one before it.
    const fresh = fs.existsSync(cachePath) &&
      fs.statSync(cachePath).mtimeMs >= fs.statSync(absolute).mtimeMs;

    const metadata = await s(readable).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const oversized = width > MAX_DIMENSION || height > MAX_DIMENSION;

    // A labelled diagram pins each dot to a percentage of its base image, so
    // re-cropping that image would slide every dot off the part it names. Those
    // bases keep their framing and are only ever resized. A copy the same
    // picture was given as a plain photo is trimmed, so it is replaced, however
    // fresh it is.
    if (keepFraming) {
      if (!oversized) { removeCopy(cachePath); return; }
      if (fresh && await sameShape(s, writable, width, height)) return;
    } else if (fresh) {
      // Trimming reads every pixel, and the answer for this picture is already
      // on disk.
      return;
    }

    const trimmed = keepFraming ? null : await trimWhiteMatte(s, readable, width, height);
    if (!trimmed && !oversized) { removeCopy(cachePath); return; }

    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    await s(trimmed || readable)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .toFile(writable);
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
