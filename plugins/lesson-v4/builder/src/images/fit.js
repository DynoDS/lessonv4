'use strict';

function normalise(p) {
  return String(p || '').replace(/\\/g, '/');
}

function resolveFit(imageData, isInset) {
  if (imageData && (imageData.fit === 'cover' || imageData.fit === 'contain')) {
    return imageData.fit;
  }
  if (isInset) return 'cover';
  return 'contain';
}

module.exports = { resolveFit };
