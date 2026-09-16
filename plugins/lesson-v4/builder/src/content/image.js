'use strict';

const fs = require('fs');
const path = require('path');

const { FONT, COLOURS, SIZE_CEILINGS, FIT } = require('../styles');
const { resolveFit } = require('../images/fit');
const { drawMissingImage } = require('../images/placeholder');
const { resolveForEmbed } = require('../images/resolve');
const { warn } = require('../warnings');
const { checkZoneFill } = require('./_zone-fill');

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
// The floor depends on how many such pictures share the slide, because the
// question the floor answers is "is this the thing children are looking at
// while they work?", and one picture alone on a slide IS that thing. A
// history deck put its only classroom photograph, the one the task said to
// "look closely" at, in a 2" cell beside an empty table and a 5" square of
// blank slide, and a single 1.6" floor passed it: the picture was not
// broken, it was merely the smallest thing on the board. So:
//
//   one picture children work from on the slide  → 3.0"  (it is the hero)
//   two                                           → 2.2"  (a comparison pair)
//   three or more                                 → 1.6"  (a set in a grid)
//
// The 1.6" base sits between the part-whole model's 1.4" floor (a photograph
// carries far more incidental detail than a two-circle diagram) and the clock's
// 2.0" (a photograph is recognised as a whole object, not by the fine angle of
// a hand). `references/slide-visual-sizing.md` carries the same figures beside
// their siblings; change them in both places.
//
// It is measured on the allocated cell, not on the picture that arrived, so the
// answer is the same before and after the picture stage delivers. A supporting
// photo is meant to be small and says so with `essential: false`, which takes it
// out of this check entirely and out of the count.
const PICTURE_READABLE_FLOOR = 1.6;
const PICTURE_FLOOR_ALONE    = 3.0;
const PICTURE_FLOOR_PAIR     = 2.2;
// ─── END CONSTANTS ────────────────────────────────────────────

// Every breach of the floor, kept for the build to report after the draw as a
// blocking composition diagnostic. The floor used to be a `[warn]` line only,
// and a warning is a line a designer can read past: a history deck
// shipped its lone classroom photograph at two inches under a task that said
// "look closely", with the warning printed and the check reporting OK
// (4 September 2026). Mirrors `_zone-fill.js`: the store is cleared between
// the layout preflight and the real draw so nothing is counted twice.
const floorFindings = [];
// A placeholder has no picture relationship for the ZIP verifier to inspect.
// Record actual required-image omissions separately; composition previews may
// show them, but the final builder must not publish them as a finished deck.
const missingPictures = new Map();

function clearMissingPictures() {
  missingPictures.clear();
}

function missingPictureFindings() {
  return Array.from(missingPictures.values(), (finding) => ({ ...finding }));
}

function clearPictureFloor() {
  floorFindings.length = 0;
}

function pictureFloorFindings() {
  return floorFindings.slice();
}

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
  const resolved = resolveForEmbed(imageData.imagePath, ctx);
  if (resolved && fs.existsSync(resolved)) return true;
  // A missing essential photo still draws: the grey placeholder is the signal
  // that it needs sourcing, so the space it holds is doing a job.
  return imageData.essential !== false;
}

// The pictures children work FROM on one slide: every `image` content object in
// the slide's spec that has not opted out with `essential: false`. Walked from
// the spec rather than counted as pictures draw, so the first picture on a
// slide already knows how many it shares the board with.
//
// Four places a picture can live are left out on purpose. An `inset` is a
// corner of its parent and is meant to be small. A vocabulary card's `visual`
// under `words` is a picture beside a word, not one children study. A
// template's `supports` row is, by its own contract, "the smaller supporting
// items below" the thing being taught. All of those are held to the base floor
// below rather than the hero's. `decorations` are the optional drawing layer
// and never count at all.
const WORKING_PICTURE_SKIP_KEYS = new Set(['inset', 'words', 'supports', 'decorations', 'speakerNotes']);

// The class characters (Mr Sear, Miss Brooker, Bailey) are drawings of who is
// speaking. Children read what the character says, never the drawing, so a
// portrait is context however small it lands, exactly as a picture marked
// `essential: false` is: out of the readable-floor check and out of the count
// of pictures children work from. A Year 4 rounding deck set Miss Brooker and
// Mr Sear beside a claim and a number line, and the build held each face to the
// 3" floor for the only picture on the slide and refused both slides (16
// September 2026). Matched on the engine's own character folder, wherever the
// plugin is installed, because a run writes its install path into the spec;
// a sourced photograph that merely shares a file name keeps its floor.
const CLASS_CHARACTER_PORTRAIT = /(^|[\\/])assets[\\/]children[\\/](mr-sear|miss-brooker|bailey)\.png$/i;

function isClassCharacterPortrait(imagePath) {
  return typeof imagePath === 'string' && CLASS_CHARACTER_PORTRAIT.test(imagePath);
}

function workingPicturePaths(slideSpec) {
  const paths = [];
  const visit = (node) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== 'object') return;
    if (
      node.type === 'image' &&
      node.essential !== false &&
      typeof node.imagePath === 'string' &&
      !isClassCharacterPortrait(node.imagePath)
    ) {
      paths.push(node.imagePath);
    }
    for (const [key, value] of Object.entries(node)) {
      if (WORKING_PICTURE_SKIP_KEYS.has(key)) continue;
      if (value && typeof value === 'object') visit(value);
    }
  };
  visit(slideSpec);
  return paths;
}

// Which floor this picture is held to, and the words that say why.
//
// A slide the check cannot see (no lesson on the context) keeps the base
// floor. The real build always hands the lesson over, so this is only the
// answer for a helper drawn on its own in a test or a tool, where the picture's
// company genuinely is unknown and the old flat floor is the honest one.
function pictureFloorFor(data, ctx) {
  const slides = ctx && ctx.lesson && Array.isArray(ctx.lesson.slides) ? ctx.lesson.slides : null;
  const slideSpec = slides ? slides[ctx.slideIndex] : null;
  if (!slideSpec) {
    return { floor: PICTURE_READABLE_FLOOR, role: 'As a picture children work from' };
  }
  const paths = workingPicturePaths(slideSpec);
  if (!paths.includes(data.imagePath)) {
    // Drawn through a route the spec walk does not count - a vocabulary
    // card's picture, a template's supporting row, an evidence card's
    // photograph - so it keeps the base floor it always had.
    return { floor: PICTURE_READABLE_FLOOR, role: 'As a supporting picture rather than one the slide is built around' };
  }
  const count = paths.length;
  if (count === 1) {
    return { floor: PICTURE_FLOOR_ALONE, role: 'As the only picture children work from on this slide' };
  }
  if (count === 2) {
    return { floor: PICTURE_FLOOR_PAIR, role: 'As one of two pictures children work from on this slide' };
  }
  return { floor: PICTURE_READABLE_FLOOR, role: `As one of ${count} pictures children work from on this slide` };
}

// The proportions this picture will actually be drawn at, and whether they are
// the real file's or the square stand-in a picture that has not arrived yet is
// reserved at. `imageAspect` answers the first question for the layout; the
// floor check needs the second as well, because what it can honestly say about
// a picture's size depends on whether the picture exists yet.
function pictureShape(data, ctx) {
  const resolved = resolveForEmbed(data.imagePath, ctx);
  if (!resolved || !fs.existsSync(resolved)) {
    return { aspect: PENDING_ASPECT, delivered: false, dims: null };
  }
  const dims = ctx && ctx.imageDims ? ctx.imageDims[data.imagePath] : null;
  if (!dims || !(dims.w > 0) || !(dims.h > 0)) return null;
  return { aspect: dims.w / dims.h, delivered: true, dims };
}

// Is this picture big enough for a class to read once it is on the slide?
//
// ONE finding per picture, on the truest measurement available at the time.
// Before the file has been measured the only honest number is what the cell
// GUARANTEES whatever shape turns up - the short side of the reserved frame -
// and that is the early answer a designer can act on while the picture stage
// is still running. Once the file has been measured, the contain fit is known
// and so is the rectangle actually put on the slide.
//
// Those two are not the same number, and the difference was a real hole in
// this check. A 400 x 332 classroom photograph in a 3.5" square cell leaves a
// 3.26" frame, which reads as comfortably over the 3.0" hero floor, and then
// contain-fits to 3.26" by 2.71": a quarter of an inch UNDER the floor, with
// nothing reported (5 September 2026). A frame with room in it is not proof of
// a picture big enough to read. The check therefore measures the drawn
// rectangle whenever the drawn rectangle is knowable, and the reserved frame
// only while it is not - never both, because two findings and two warnings
// about one photograph, quoting two different short sides, leave a designer
// unable to tell which number to repair against.
//
// The measurement runs on `zone.cell`, the pre-hug allocation, when the card
// look has already shrunk the zone around the drawn picture: the allocation is
// what a designer repairs, and hugging a zone around a small picture does not
// make the picture bigger.
//
// The message names WHICH AXIS BINDS, because only one of the available
// repairs can move a given case and the other reads just as plausible. A row
// of captioned photographs in a shallow band binds on height: taking a picture
// out of the row makes the survivors wider and leaves the short side exactly
// where it was. A designer that reaches for the wrong lever spends a repair
// pass measuring the same number again, and a bounded self-repair budget is
// spent three times over on a composition nothing has touched - which is how a
// deck reached `EXHAUSTED 3/3` still 0.11" short. Reporting the binding axis,
// the shortfall and what the caption costs turns three guesses into one
// repair.
//
// With the picture's shape known, the binding axis is the one the fit is
// stopped by, and that is not always the shorter side of the cell. A landscape
// photograph in a square cell is stopped by WIDTH - it already uses the full
// width and its height follows from that - so a taller cell moves nothing and
// a wider one moves everything. Contain-fitting an image of aspect `a` leaves
// a short side of min(w, h, w/a, h*a), so the frame needs `floor * max(1, a)`
// of width and `floor * max(1, 1/a)` of height, and whichever of those two it
// is missing is the axis to name.
function checkPictureCellSize(zone, data, ctx) {
  if (!ctx || !data || data.essential === false) return;
  if (!data.imagePath) return;
  if (isClassCharacterPortrait(data.imagePath)) return;
  if (resolveFit(data, false) !== 'contain') return;
  const shape = pictureShape(data, ctx);
  if (!shape) return;
  const { aspect, delivered, dims } = shape;
  if (!(aspect > 0)) return;

  const cell = zone.cell || zone;
  const caption = data.caption || '';
  const captionCost = caption.length > 0 ? (CAPTION_H + CAPTION_GAP) : 0;
  const frameW = cell.w - 2 * PAD;
  const frameH = cell.h - 2 * PAD - captionCost;
  if (!(frameW > 0) || !(frameH > 0)) return;

  const { floor, role } = pictureFloorFor(data, ctx);
  const guaranteed = Math.min(frameW, frameH);
  const drawn = containRect({ x: 0, y: 0, w: frameW, h: frameH }, aspect);
  const measured = Math.min(drawn.w, drawn.h);
  if (!(measured > 0) || measured >= floor) return;

  const short = (n) => n.toFixed(2);
  const widthShort = floor * Math.max(1, aspect) - frameW;
  const heightShort = floor * Math.max(1, 1 / aspect) - frameH;

  let opening;
  if (delivered) {
    opening =
      `image "${data.imagePath}" renders ${short(drawn.w)}" by ${short(drawn.h)}" ` +
      `on the slide, so it is only ${short(measured)}" on its short side. ${role} ` +
      `it needs ${short(floor)}" for a class to read it from the back of the room. `;
    if (guaranteed >= floor) {
      opening +=
        `The cell reserves ${short(guaranteed)}", which reads as enough, but this ` +
        `photograph is ${dims.w} by ${dims.h} and keeps its true proportions, so the ` +
        `spare room on the other axis stays empty instead of going into the picture. `;
    }
  } else {
    opening =
      `image "${data.imagePath}" is guaranteed only ${short(measured)}" on its ` +
      `short side. ${role} it needs ${short(floor)}" for a class to read it from ` +
      `the back of the room, so a photograph of any shape renders below that. `;
  }

  // Height and width are both short of what the floor needs: neither axis
  // alone is the story, and a designer told only about one will fix it and
  // meet the other.
  const bothBind = widthShort > 0 && heightShort > 0;

  let diagnosis;
  if (bothBind) {
    diagnosis =
      `Both axes are short: the cell is ${short(cell.w)}" by ${short(cell.h)}"` +
      (captionCost ? `, and the caption under the picture takes ${short(captionCost)}" of the height` : '') +
      `. A cell this size cannot hold a picture children work from whatever ` +
      `you rearrange inside it, so this needs a different template or the beat ` +
      `split across two slides, not a smaller adjustment.`;
  } else if (heightShort > 0) {
    diagnosis =
      `Height is what binds: the cell is ${short(cell.h)}" tall` +
      (captionCost ? `, and the caption under the picture takes ${short(captionCost)}" of that` : '') +
      `. Find this picture ${short(heightShort)}" more height - a taller zone, fewer ` +
      `rows stacked down it, or the beat split across two slides` +
      (captionCost
        ? `; a label the task does not need is ${short(captionCost)}" back on its own`
        : '') +
      `. Fewer pictures side by side will not move it, because each one is ` +
      `already stopped by the height.`;
  } else {
    diagnosis =
      `Width is what binds: the cell is ${short(cell.w)}" wide. Find this ` +
      `picture ${short(widthShort)}" more width - a wider zone, fewer pictures side ` +
      `by side, or the same set laid out as a grid rather than one long row. ` +
      `A taller zone will not move it, because each picture is already ` +
      `stopped by the width.`;
  }

  const message =
    opening +
    diagnosis +
    ' A picture that is only supporting context belongs here at this size ' +
    'and should say so with `essential: false`.';
  warn(ctx.slideIndex, message);
  floorFindings.push({
    signal: 'PICTURE_BELOW_READABLE_FLOOR',
    slide: ctx.slideIndex + 1,
    field: `image:${data.imagePath}`,
    message,
  });
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

  // An inset is either a second picture, or a named part of this one enlarged.
  if (data.inset && (data.inset.imagePath || data.inset.detail)) {
    drawInset(pptx, slide, frame, data.inset, ctx, data);
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
  const resolved = resolveForEmbed(raw, ctx);

  if (!resolved || !fs.existsSync(resolved)) {
    // A photo the lesson-designer marked non-essential is an enhancement, not
    // load-bearing — when it can't be sourced, leave the zone as clean slide
    // background rather than a grey box. Essential photos (the default) keep
    // the placeholder, so a missing must-have image stays visible as a signal
    // that it still needs sourcing.
    if (imageData.essential === false) return;
    const slideNumber = ctx && Number.isInteger(ctx.slideIndex) ? ctx.slideIndex + 1 : undefined;
    missingPictures.set(JSON.stringify([slideNumber, raw]), {
      slide: slideNumber,
      part: raw,
      message: `slide ${slideNumber === undefined ? '?' : slideNumber}: required image "${raw}" could not be drawn; only a placeholder was rendered.`,
    });
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
    // Contained means the picture keeps its true shape, so a frame shaped unlike
    // it leaves the rest empty. `cover` is exempt because it fills by design, and
    // an inset is exempt because being small in a corner is the whole point of one.
    if (!isInset) checkZoneFill(ctx, frame, fitted, 'this photograph');
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

// ─── Showing one part of a photograph, enlarged ───────────────────────
//
// A Year 4 History lesson asked children to compare Edward VI's rattle with a
// modern one. The rattle is a few millimetres of a full portrait, and at the
// back of the room it is not there at all. The final review said so three times
// and the repair could not be made: an inset needed a second photograph, and
// nobody has a photograph of just that rattle (7 September 2026).
//
// So an inset may instead name a RECTANGLE of the picture it sits on:
//
//   "inset": { "detail": { "x": 0.41, "y": 0.55, "w": 0.14, "h": 0.12 } }
//
// Fractions of the whole image, origin top-left. No second file is sourced, no
// pixels are processed, and nothing new is rendered: PowerPoint's own crop does
// it, which is why this was the cheapest of the ways of pointing at a detail.
// The full photograph still prints behind it, because a child needs to see the
// object in its source as well as close up - a magnified fragment with no
// context is a different, worse slide.
//
// Deliberately NOT done here: greying the rest of the picture and leaving the
// detail in colour. It looks the part, and it makes the child's task depend on
// telling two colours apart, which `worksheet-visual-profile.md` refuses outright
// and which fails a colour-blind child and a black-and-white printout together.
//
// The label belongs to the `callout` helper, which already points at things.
function detailRect(frame, dims, detail) {
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const w = clamp(Number(detail.w) || 0, 0.01, 1);
  const h = clamp(Number(detail.h) || 0, 0.01, 1);
  const x = clamp(Number(detail.x) || 0, 0, 1 - w);
  const y = clamp(Number(detail.y) || 0, 0, 1 - h);

  // Scale so the NAMED REGION covers the inset frame, then crop everything
  // outside it. The region keeps its own shape, so the part of the frame the
  // region cannot fill is taken from the picture around it rather than by
  // stretching - the detail is evidence, and evidence is not stretched.
  const scale = Math.max(frame.w / (w * dims.w), frame.h / (h * dims.h));
  const scaledW = dims.w * scale;
  const scaledH = dims.h * scale;
  const centreX = (x + w / 2) * scaledW;
  const centreY = (y + h / 2) * scaledH;

  return {
    w: scaledW,
    h: scaledH,
    sizing: {
      type: 'crop',
      x: clamp(centreX - frame.w / 2, 0, Math.max(0, scaledW - frame.w)),
      y: clamp(centreY - frame.h / 2, 0, Math.max(0, scaledH - frame.h)),
      w: frame.w,
      h: frame.h,
    },
  };
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

function drawInset(pptx, slide, frame, inset, ctx, parent) {
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

  if (inset.detail && !inset.imagePath) {
    drawDetailInset(slide, pos, inset.detail, parent, ctx);
    return;
  }

  drawOneImage(pptx, slide, pos, inset, true, ctx);
}

// The enlarged part of the picture the inset sits on. It reuses the parent's
// own file and measurements, so there is nothing extra to source or measure.
function drawDetailInset(slide, pos, detail, parent, ctx) {
  const raw = parent && parent.imagePath;
  const resolved = resolveForEmbed(raw, ctx);
  if (!resolved || !fs.existsSync(resolved)) return;

  const dims = ctx && ctx.imageDims ? ctx.imageDims[raw] : null;
  if (!dims || !(dims.w > 0) || !(dims.h > 0)) {
    throw new Error(
      `IMAGE_DIMENSIONS_UNAVAILABLE: image "${raw}" could not be measured, so ` +
      'the detail inset cannot be placed. Measure the image before building.'
    );
  }

  const cropped = detailRect(pos, dims, detail);
  slide.addImage({
    path: resolved,
    x: pos.x,
    y: pos.y,
    w: cropped.w,
    h: cropped.h,
    sizing: cropped.sizing,
  });
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

  const resolved = resolveForEmbed(data.imagePath, ctx);
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

// The width-per-height this image will contain-fit at, or null when that
// cannot be predicted (cover fit, a file on disk with no measured dimensions).
// A picture the run has not delivered yet answers PENDING_ASPECT, for the same
// reason measureImage gives it one: the reserved space is what a composition
// is judged against, and it must not change shape when the photo lands.
function imageAspect(data, ctx) {
  if (!imageWillDraw(data, ctx)) return null;
  if (resolveFit(data, false) !== 'contain') return null;
  const resolved = resolveForEmbed(data.imagePath, ctx);
  if (!resolved || !fs.existsSync(resolved)) return PENDING_ASPECT;
  const dims = ctx && ctx.imageDims ? ctx.imageDims[data.imagePath] : null;
  if (!dims || !(dims.w > 0) || !(dims.h > 0)) return null;
  return dims.w / dims.h;
}

module.exports = {
  drawImage,
  imageWillDraw,
  measureImage,
  imageAspect,
  PICTURE_READABLE_FLOOR,
  pictureFloorFindings,
  clearPictureFloor,
  clearMissingPictures,
  missingPictureFindings,
  detailRect,
};
