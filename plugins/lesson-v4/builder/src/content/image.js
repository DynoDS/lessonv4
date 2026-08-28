'use strict';

const fs = require('fs');
const path = require('path');

const { FONT, COLOURS, SIZE_CEILINGS, FIT } = require('../styles');
const { resolveFit } = require('../images/fit');
const { drawMissingImage } = require('../images/placeholder');
const { resolveForEmbed } = require('../images/resolve');
const { warn } = require('../warnings');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD            = 0.12;
const CAPTION_H      = 0.46;
const CAPTION_GAP    = 0.08;
// A caption on a projected photo is board type, read from the back of the room,
// not print type read at a desk, so it starts where the labelled diagram's caption
// already sits rather than at footnote size. It is also the label under each photo
// in a comparison row ("Desert", "Tundra"), which children read across the room
// while they decide, so a caption that needs squinting at empties the row of its
// point. `captionFontSize` lets a designer lift it further on a photo whose label
// is doing real work, and the shrink-to-fit still protects a long caption.
const CAPTION_FONT   = 20;
const INSET_W_RATIO  = 0.25;
const INSET_BORDER_W = 3;
const INSET_MARGIN   = 0.10;
// The shape a picture that has not arrived yet is drawn as.
//
// A delivered photograph is contain-fitted to its own proportions, so the room
// it actually gets is capped by the SHORT side of its frame: a near-square
// photograph in a wide, shallow cell binds on height and renders a fraction of
// the width that cell had. A placeholder that filled the whole cell therefore
// promised a shape no photograph is guaranteed to arrive in, and the preview a
// designer judges its composition against showed a broad landscape band where a
// small square was what would turn up.
//
// Square is the honest stand-in. It assumes neither orientation, because which
// one arrives is not the lesson's to choose; it binds on whichever axis is
// genuinely scarce (height in a wide cell, width in a tall one); and it is
// exactly the size the cell can guarantee whatever shape turns up. A delivered
// picture only ever differs from it by growing along the axis with room to
// spare, so a slide that is half-delivered stays composed instead of going
// ragged between full-cell bands and hugged photographs.
const PENDING_ASPECT = 1;
// The smallest short side, in slide inches, at which a picture children work
// FROM is still readable from the back of the room. That reading is the work, so
// a picture below this is on the slide without doing its job.
//
// It sits between the part-whole model's 1.4" floor (a photograph carries far
// more incidental detail than a two-circle diagram) and the clock's 2.0" (a
// photograph is recognised as a whole object, not by the fine angle of a hand).
// `references/slide-visual-sizing.md` carries the same figure beside its
// siblings; change it in both places.
//
// It is measured on the allocated cell, not on the picture that arrived, so the
// answer is the same before and after the picture stage delivers. A supporting
// photo is meant to be small and says so with `essential: false`, which takes it
// out of this check entirely.
const PICTURE_READABLE_FLOOR = 1.6;
// ─── END CONSTANTS ────────────────────────────────────────────

// Centre a picture of `aspect` inside `frame` without stretching it: the same
// containment the contain-fit draw performs, shared so a reserved space and the
// thing later drawn in it cannot drift apart.
function containRect(frame, aspect) {
  const frameAspect = frame.w / frame.h;
  let w;
  let h;
  if (aspect > frameAspect) {
    w = frame.w;
    h = frame.w / aspect;
  } else {
    h = frame.h;
    w = frame.h * aspect;
  }
  return {
    x: frame.x + (frame.w - w) / 2,
    y: frame.y + (frame.h - h) / 2,
    w: w,
    h: h
  };
}

function resolveImagePath(imagePath, ctx) {
  return resolveForEmbed(imagePath, ctx);
}

// Will this image actually put something on the slide? Any layout that reserves
// space for a picture, or writes a caption describing one, needs this answer
// rather than "is `image` a type I can draw?" — the two come apart exactly when
// an optional photo could not be sourced, and the gap between them is what
// leaves a reserved cell sitting empty or a caption talking about a picture that
// is not there. A missing photo the lesson can live without is deliberately
// allowed to vanish; what must not vanish with it is the space and the words
// that were promised on its behalf.
function imageWillDraw(imageData, ctx) {
  if (!imageData || !imageData.imagePath) return false;
  const resolved = resolveImagePath(imageData.imagePath, ctx);
  if (resolved && fs.existsSync(resolved)) return true;
  // A missing essential photo still draws: the grey placeholder is the signal
  // that it needs sourcing, so the space it holds is doing a job.
  return imageData.essential !== false;
}

// Is the cell this picture was allocated big enough for a class to read it?
//
// The test runs on the cell rather than on the delivered file, so it gives the
// same answer while the picture stage is still working as it does afterwards:
// the fault is the allocation, and the allocation is the designer's to repair
// while a repair is still cheap. `zone.cell` is the pre-hug allocation when the
// card look has already shrunk the zone around the drawn picture.
function checkPictureCellSize(zone, data, ctx) {
  if (!ctx || !data || data.essential === false) return;
  if (!data.imagePath) return;
  if (resolveFit(data, false) !== 'contain') return;
  const cell = zone.cell || zone;
  const caption = data.caption || '';
  const frameW = cell.w - 2 * PAD;
  const frameH = cell.h - 2 * PAD - (caption.length > 0 ? (CAPTION_H + CAPTION_GAP) : 0);
  const guaranteed = Math.min(frameW, frameH);
  if (!(guaranteed > 0) || guaranteed >= PICTURE_READABLE_FLOOR) return;
  warn(
    ctx.slideIndex,
    `image "${data.imagePath}" has a picture space only ${guaranteed.toFixed(2)}" ` +
      `on its short side, so a photograph of any shape renders below the ` +
      `${PICTURE_READABLE_FLOOR}" a class can read from the back of the room. ` +
      'Give the picture a taller or wider zone, put fewer pictures in this zone, ' +
      'or mark it non-essential if it is only supporting context.'
  );
}

function drawImage(pptx, slide, zone, data, ctx) {
  const caption    = data.caption || '';
  const hasCaption = caption.length > 0;

  checkPictureCellSize(zone, data, ctx);

  const frameX = zone.x + PAD;
  const frameY = zone.y + PAD;
  const frameW = zone.w - 2 * PAD;
  const frameH = zone.h - 2 * PAD - (hasCaption ? (CAPTION_H + CAPTION_GAP) : 0);
  const frame  = { x: frameX, y: frameY, w: frameW, h: frameH };

  drawOneImage(pptx, slide, frame, data, false, ctx);

  if (data.inset && data.inset.imagePath) {
    drawInset(pptx, slide, frame, data.inset, ctx);
  }

  if (hasCaption) {
    slide.addText(caption, {
      x: frameX, y: frameY + frameH + CAPTION_GAP, w: frameW, h: CAPTION_H,
      fontFace: FONT, fontSize: data.captionFontSize || CAPTION_FONT, italic: true, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }
}

function drawOneImage(pptx, slide, frame, imageData, isInset, ctx) {
  const raw = imageData.imagePath;
  const resolved = resolveImagePath(raw, ctx);

  if (!resolved || !fs.existsSync(resolved)) {
    // A photo the lesson-designer marked non-essential is an enhancement, not
    // load-bearing — when it can't be sourced, leave the zone as clean slide
    // background rather than a grey box. Essential photos (the default) keep
    // the placeholder, so a missing must-have image stays visible as a signal
    // that it still needs sourcing.
    if (imageData.essential === false) return;
    // A load-bearing image that can't be found stays VISIBLE as a grey placeholder
    // AND announces itself, so a missing must-have photo can't hide behind a clean
    // "No warnings" summary — it still needs sourcing before the lesson.
    if (ctx) warn(ctx.slideIndex, `image "${raw}" could not be found — showing a placeholder; source the photo or mark it non-essential in the lesson`);
    // The placeholder holds the room a picture is actually guaranteed, not the
    // whole frame: see PENDING_ASPECT. A cover-fit picture really will fill its
    // frame, so there the frame is already the honest answer.
    drawMissingImage(
      slide,
      resolveFit(imageData, isInset) === 'contain'
        ? containRect(frame, PENDING_ASPECT)
        : frame
    );
    return;
  }

  const fit = resolveFit(imageData, isInset);
  const dims = ctx && ctx.imageDims ? ctx.imageDims[raw] : null;
  if (!dims || !(dims.w > 0) || !(dims.h > 0)) {
    throw new Error(
      `IMAGE_DIMENSIONS_UNAVAILABLE: image "${raw}" could not be measured. ` +
      'Nothing was stretched; measure the image before building.'
    );
  }

  const altText =
    imageData.kind === 'educational-svg' && typeof imageData.alt === 'string'
      ? imageData.alt
      : undefined;

  if (fit === 'contain') {
    const fitted = containRect(frame, dims.w / dims.h);
    slide.addImage({
      path: resolved,
      x: fitted.x,
      y: fitted.y,
      w: fitted.w,
      h: fitted.h,
      altText: altText
    });
    return;
  }

  const scale = Math.max(frame.w / dims.w, frame.h / dims.h);
  const scaledW = dims.w * scale;
  const scaledH = dims.h * scale;
  slide.addImage({
    path: resolved,
    x: frame.x,
    y: frame.y,
    w: scaledW,
    h: scaledH,
    sizing: {
      type: 'crop',
      x: (scaledW - frame.w) / 2,
      y: (scaledH - frame.h) / 2,
      w: frame.w,
      h: frame.h
    },
    altText: altText
  });
}

function insetPosition(frame, position, insetW, insetH) {
  const margin = INSET_MARGIN;
  switch (position) {
    case 'top-left':
      return { x: frame.x + margin, y: frame.y + margin, w: insetW, h: insetH };
    case 'top-right':
      return { x: frame.x + frame.w - insetW - margin, y: frame.y + margin, w: insetW, h: insetH };
    case 'bottom-left':
      return { x: frame.x + margin, y: frame.y + frame.h - insetH - margin, w: insetW, h: insetH };
    case 'bottom-right':
    default:
      return { x: frame.x + frame.w - insetW - margin, y: frame.y + frame.h - insetH - margin, w: insetW, h: insetH };
  }
}

function drawInset(pptx, slide, frame, inset, ctx) {
  const position = inset.position || 'bottom-right';
  const insetW = frame.w * INSET_W_RATIO;
  const insetH = insetW * 0.75;
  const pos = insetPosition(frame, position, insetW, insetH);

  slide.addShape(pptx.shapes.RECTANGLE, {
    x: pos.x - INSET_BORDER_W / 72, y: pos.y - INSET_BORDER_W / 72,
    w: pos.w + (INSET_BORDER_W * 2) / 72, h: pos.h + (INSET_BORDER_W * 2) / 72,
    fill: { color: COLOURS.pureWhite },
    line: { color: COLOURS.pureWhite, width: INSET_BORDER_W }
  });

  drawOneImage(pptx, slide, pos, inset, true, ctx);
}

// Card-look measure: where the photo (and its caption) will actually sit, so
// the card hugs the picture instead of spanning a wide zone with dead white
// bands either side of a portrait image. MIRRORS drawImage's frame maths and
// drawOneImage's contain fit - change either in both places. Returns:
// `none` when the image will not draw at all (an optional photo that could
// not be sourced must not leave an empty white card behind); null when the
// extent cannot be predicted (cover fit, or no measured dimensions), which
// falls back to the full-zone card; otherwise the fitted rect, expanded back
// out by the helper's own PAD so the redraw inside it lands exactly where
// this predicted. `clamp` hands the helper that rect as its zone.
//
// A picture the run has not delivered yet is measured too, at PENDING_ASPECT,
// because the reserved space is what a designer reads the composition off. It
// used to fall through to the full-zone card, which is why a pending picture
// showed a wide band and its delivered neighbour a hugged photograph on the
// same slide.
function measureImage(zone, data, ctx) {
  if (!imageWillDraw(data, ctx)) return { none: true };

  const fit = resolveFit(data, false);
  if (fit !== 'contain') return null;                       // cover fills the zone, so the card should too

  const resolved = resolveImagePath(data.imagePath, ctx);
  const pending = !resolved || !fs.existsSync(resolved);
  const dims = ctx && ctx.imageDims ? ctx.imageDims[data.imagePath] : null;
  if (!pending && (!dims || !(dims.w > 0) || !(dims.h > 0))) return null;

  const caption    = data.caption || '';
  const hasCaption = caption.length > 0;
  const frameW = zone.w - 2 * PAD;
  const frameH = zone.h - 2 * PAD - (hasCaption ? (CAPTION_H + CAPTION_GAP) : 0);
  if (frameW <= 0.3 || frameH <= 0.3) return null;

  const fitted = containRect(
    { x: 0, y: 0, w: frameW, h: frameH },
    pending ? PENDING_ASPECT : dims.w / dims.h
  );

  return {
    x: zone.x + (zone.w - (fitted.w + 2 * PAD)) / 2,
    y: zone.y,
    w: fitted.w + 2 * PAD,
    h: fitted.h + 2 * PAD + (hasCaption ? (CAPTION_H + CAPTION_GAP) : 0),
    clamp: true
  };
}

module.exports = { drawImage, imageWillDraw, measureImage, PICTURE_READABLE_FLOOR };
