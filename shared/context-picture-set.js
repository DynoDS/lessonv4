'use strict';

const fs = require('fs');
const path = require('path');

function pictureRequest(item) {
  return item && typeof item === 'object' && item.picture && typeof item.picture === 'object'
    ? item.picture
    : null;
}

function fallbackEmoji(picture) {
  if (!picture) return '';
  if (picture.kind === 'emoji' && picture.value != null) return String(picture.value);
  if (picture.fallbackEmoji != null) return String(picture.fallbackEmoji);
  return '';
}

function selectContextPictureSet(items, baseDir) {
  const source = Array.isArray(items) ? items : [];
  const requests = source.map(pictureRequest);
  if (!requests.some(Boolean)) return source.map(function () { return null; });

  const images = requests.map(function (picture) {
    if (typeof picture.imagePath !== 'string' || !picture.imagePath) return null;
    const absolute = path.isAbsolute(picture.imagePath)
      ? picture.imagePath
      : path.join(baseDir || process.cwd(), picture.imagePath);
    if (!fs.existsSync(absolute)) return null;
    return {
      type: 'image',
      path: absolute,
      buffer: fs.readFileSync(absolute),
      alt: picture.alt || picture.context || picture.concept || ''
    };
  });
  if (images.some(Boolean)) {
    return requests.map(function (picture, i) {
      if (!picture) return null;
      if (images[i]) return images[i];
      if (picture.kind !== 'emoji') return null;
      const value = fallbackEmoji(picture);
      return value
        ? { type: 'emoji', value: value, alt: picture.alt || '' }
        : null;
    });
  }

  const emojis = requests.map(fallbackEmoji);
  return emojis.map(function (value, i) {
    if (!value || !requests[i]) return null;
    return {
      type: 'emoji',
      value: value,
      alt: requests[i].alt || requests[i].context || requests[i].concept || ''
    };
  });
}

module.exports = { selectContextPictureSet };
