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

function collectImagePaths(lesson) {
  const out = new Set();
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (typeof obj.imagePath === 'string' && obj.imagePath) out.add(obj.imagePath);
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    for (const k of Object.keys(obj)) walk(obj[k]);
  }
  walk(lesson);
  return Array.from(out);
}

// Reads natural pixel dimensions of every image referenced in the lesson.
// Returns a Map keyed by the original imagePath string (relative or absolute,
// exactly as it appears in the lesson JSON) so the draw step can look up
// dims synchronously by the same key it already has.
async function preMeasureAll(lesson, lessonDir) {
  const dims = Object.create(null);
  const paths = collectImagePaths(lesson);
  let s;
  try { s = getSharp(); } catch (e) { return dims; }
  for (const rel of paths) {
    // `rel` stays the key the lesson JSON used, because the draw step looks the
    // dimensions up by that exact string. Only the path opened off disk changes.
    const local = normalizeLocalPath(rel);
    const abs = path.isAbsolute(local)
      ? local
      : path.join(normalizeLocalPath(lessonDir), local);
    if (!fs.existsSync(abs)) continue;
    try {
      // sharp gets the long-path form. Without it a photograph in a lesson
      // folder past 260 characters is reported missing by sharp alone, and the
      // build then stops on a picture that is sitting exactly where it should.
      const meta = await s(longPathSafe(abs)).metadata();
      if (meta && meta.width && meta.height) {
        dims[rel] = { w: meta.width, h: meta.height };
      }
    } catch (e) {
      // Leave this image unmeasured. The draw step will stop with
      // IMAGE_DIMENSIONS_UNAVAILABLE instead of stretching it.
    }
  }
  return dims;
}

module.exports = { preMeasureAll };
