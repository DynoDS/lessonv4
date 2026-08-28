'use strict';

const fs = require('fs');
const path = require('path');

function resolveAbsolute(imagePath, ctx) {
  if (!imagePath) return null;
  if (path.isAbsolute(imagePath)) return imagePath;
  const base = (ctx && ctx.lessonDir) || process.cwd();
  return path.join(base, imagePath);
}

function resolveForEmbed(imagePath, ctx) {
  const absolute = resolveAbsolute(imagePath, ctx);
  if (!absolute) return null;
  const base = (ctx && ctx.lessonDir) || process.cwd();
  const relative = path.relative(base, absolute);
  if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
    const cachePath = path.join(base, '.resized', relative);
    if (fs.existsSync(cachePath)) return cachePath;
  }
  return absolute;
}

module.exports = { resolveAbsolute, resolveForEmbed };
