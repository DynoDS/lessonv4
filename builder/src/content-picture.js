'use strict';

const fs = require('fs');
const { resolveForEmbed } = require('./images/resolve');

const PICTURE_GAP = 0.10;
const PICTURE_MAX_H = 1.16;
const PICTURE_MAX_W = 1.55;
const PICTURE_TRANSPARENCY = 50;

function itemText(item) {
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    return String(item.text == null ? '' : item.text);
  }
  return String(item == null ? '' : item);
}

function itemPicture(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  return item.picture && typeof item.picture === 'object' ? item.picture : null;
}

function emojiValue(picture) {
  if (!picture) return '';
  if (picture.kind === 'emoji' && picture.value != null) return String(picture.value);
  if (picture.fallbackEmoji != null) return String(picture.fallbackEmoji);
  return '';
}

function imageValue(picture, ctx) {
  if (!picture || typeof picture.imagePath !== 'string' || !picture.imagePath) return null;
  const resolved = resolveForEmbed(picture.imagePath, ctx);
  if (!resolved || !fs.existsSync(resolved)) return null;
  return {
    type: 'image',
    imagePath: picture.imagePath,
    resolvedPath: resolved,
    alt: picture.alt || picture.context || picture.concept || ''
  };
}

// Each item earns its own picture. When at least one Educational SVG image exists, keep
// the sourced monochrome drawings and let an unsourced Educational SVG item close up
// bare rather than mixing in a colourful fallback. When no drawings exist,
// suitable emoji fallbacks can still carry the individual items.
function resolvePictureSet(items, ctx) {
  const source = Array.isArray(items) ? items : [];
  const requested = source.map(itemPicture);
  if (!requested.some(Boolean)) return source.map(function () { return null; });

  const images = requested.map(function (picture) { return imageValue(picture, ctx); });
  if (images.some(Boolean)) {
    return requested.map(function (picture, i) {
      if (!picture) return null;
      if (images[i]) return images[i];
      if (picture.kind !== 'emoji') return null;
      const value = emojiValue(picture);
      return value ? { type: 'emoji', value: value, alt: picture.alt || '' } : null;
    });
  }

  const emojis = requested.map(emojiValue);
  return emojis.map(function (value, i) {
    if (!value || !requested[i]) return null;
    return {
      type: 'emoji',
      value: value,
      alt: requested[i].alt || requested[i].context || requested[i].concept || ''
    };
  });
}

function pictureMetrics(picture, availableH, ctx, maxW) {
  if (!picture) return { w: 0, h: 0 };
  const h = Math.max(0.28, Math.min(PICTURE_MAX_H, availableH || PICTURE_MAX_H));
  const capW = Math.max(0.28, Math.min(PICTURE_MAX_W, maxW || PICTURE_MAX_W));
  if (picture.type === 'image') {
    const dims = ctx && ctx.imageDims ? ctx.imageDims[picture.imagePath] : null;
    if (dims && dims.w > 0 && dims.h > 0) {
      const w = Math.min(capW, h * dims.w / dims.h);
      return { w: w, h: Math.min(h, w * dims.h / dims.w) };
    }
  }
  return { w: Math.min(h, capW), h: Math.min(h, capW) };
}

function drawContentPicture(slide, picture, frame, options) {
  if (!picture || !frame || frame.w <= 0 || frame.h <= 0) return;
  const opts = options || {};
  const objectName = opts.objectName || 'context-picture';
  const transparency = Number.isFinite(Number(opts.transparency))
    ? Math.max(0, Math.min(100, Number(opts.transparency)))
    : PICTURE_TRANSPARENCY;

  if (picture.type === 'image') {
    slide.addImage({
      path: picture.resolvedPath,
      x: frame.x,
      y: frame.y,
      w: frame.w,
      h: frame.h,
      rotate: opts.rotate || 0,
      transparency: transparency,
      altText: picture.alt || '',
      objectName: objectName + '-image'
    });
    return;
  }

  if (picture.type === 'emoji') {
    slide.addText(picture.value, {
      x: frame.x,
      y: frame.y,
      w: frame.w,
      h: frame.h,
      fontFace: 'Segoe UI Emoji',
      fontSize: Math.max(14, Math.round(frame.h * 72 * 0.70)),
      align: 'center',
      valign: 'middle',
      margin: 0,
      fit: 'shrink',
      rotate: opts.rotate || 0,
      transparency: transparency,
      objectName: objectName + '-emoji'
    });
  }
}

module.exports = {
  PICTURE_GAP,
  PICTURE_TRANSPARENCY,
  itemText,
  itemPicture,
  resolvePictureSet,
  pictureMetrics,
  drawContentPicture
};
