'use strict';

// Renders a LABELLED DIAGRAM on a slide: a photo or drawing with a small anchor
// dot on each part, a straight leader line out to the part's label, and either
// the printed label (a completed/answer diagram) or a blank write-on line (the
// teacher fills it in live, or it is the question form). This is the board-side
// twin of the worksheet's labelled diagram, and it draws from the SAME geometry
// source (../../shared/visuals/label-diagram-svg.js), so the part the dot sits
// on and the line that leads to its label match wherever the child meets the
// figure. It exists because the nearest old slide option (teach-annotated) drops
// four corner captions with no line a child can map back to a part, which is not
// a labelled diagram.
//
// The picture is read once before the slide loop (preRenderLabelDiagrams); the
// composite (image + overlay) is laid out for the room its slide gives it, with
// the labels at the board's own size, and made between the build's two passes
// (rasteriseLabelDiagrams), so the draw step stays synchronous.
//
// Spec:
//   imagePath  the base image, resolved like every other slide image (relative to
//              the lesson folder, honouring the .resized cache).
//   callouts   array of { anchor:[x%,y%], label, label_at?:[x%,y%], given? }:
//              see the shared module for the full field meaning. `given:true`
//              prints the label (answer/handed part); absent draws a blank line.
//   caption    optional line under the diagram (e.g. "Label the parts of the river").
//   layout, marginXRatio, marginYRatio, labelMaxChars, arrow, labelColour
//              optional presentation flags forwarded to the shared geometry.
//              `layout:"sides"` is the poster form for a PHOTO: the part names
//              stack out in the side margins on clear white, joined by leader
//              lines, so dark label text never has to land on the picture and
//              stay readable against any photograph. Each flag defaults to the
//              previous behaviour, so a white-background line drawing that
//              places its labels with label_at renders exactly as before.

const requireGlobal = require('../require-global');
const { FONT, COLOURS, FIT } = require('../styles');
const { resolveForEmbed, longPathSafe } = require('../images/resolve');
const { tightSvg: labelDiagramSvg } = require('../../../shared/visuals/label-diagram-svg');
const { measureContainedAspect } = require('./contained-extent');
const { warn, recording } = require('../warnings');
const fs = require('fs');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD          = 0.10;   // zone inner padding (inches)
const CAPTION_H    = 0.45;
const CAPTION_GAP  = 0.06;
const CAPTION_FONT = 20;     // board-readable, like the turn-diagram label
const BLUE         = '#' + COLOURS.prompt;   // house board blue for the anchor dots
// Render at the SVG's own pixel size (density 96 = 1:1), so the embedded photo
// keeps its native resolution rather than being upscaled and softened, while the
// vector lines and labels stay crisp.
const RENDER_DENSITY = 96;
// ─── END CONSTANTS ────────────────────────────────────────────

// What a labelled diagram's own labels came to once they were laid out. The
// words are inside a picture by the time the slide places it, so no text
// measure and no page reader can see them: on 6 October 2026 a Year 4 deck
// went out with eight paragraph-long callouts drawn through each other on
// four slides and every check passed. The drawing now stacks the labels of
// the poster layout by their own height and reports what it measured
// (shared/visuals/label-diagram-svg.js), and the slide says two things:
//   - labels that still land on each other or run off the drawing, which
//     only a label placed where it was told can do, are a fault, refused by
//     name the way an undersized picture is;
//   - labels that stand taller than the picture they label are a cue to
//     look, never a fault: how many words belong round a picture is a
//     judgement, and the drawing has already laid them out readably.
// Kept like the picture floor: cleared between the layout preflight and the
// real draw.
const labelFindings = [];

function clearLabelDiagramFindings() {
  labelFindings.length = 0;
}

function labelDiagramFindings() {
  return labelFindings.slice();
}

const quoted = (name) => `"${name.length > 28 ? name.slice(0, 27).trimEnd() + '...' : name}"`;

// The findings for one drawn diagram, as { signal, message }. Pure, so it is
// tested without a slide.
function labelFaultsFor(data, measured) {
  const out = [];
  if (!measured) return out;
  const which = `labelled diagram "${data.imagePath}"`;

  const overlaps = (measured.labelFaults && measured.labelFaults.overlaps) || [];
  const clipped = (measured.labelFaults && measured.labelFaults.clipped) || [];
  if (overlaps.length || clipped.length) {
    const parts = [];
    if (overlaps.length) {
      const shown = overlaps.slice(0, 3).map(([a, b]) => `${quoted(a)} on ${quoted(b)}`).join(', ');
      parts.push(
        `${overlaps.length} pair(s) of labels are drawn on top of each other (${shown}` +
        `${overlaps.length > 3 ? ', and more' : ''})`
      );
    }
    if (clipped.length) {
      parts.push(
        `${clipped.length} label(s) run off the edge of the drawing ` +
        `(${clipped.slice(0, 3).map(quoted).join(', ')}${clipped.length > 3 ? ', and more' : ''})`
      );
    }
    out.push({
      signal: 'LABEL_DIAGRAM_LABELS_COLLIDE',
      message:
        `${which}: ${parts.join(', and ')}, so they cannot be read. ` +
        'Give the diagram `"layout": "sides"`: it stacks every label in the white margins ' +
        'beside the picture, spaced by its own height, where two labels cannot land on each ' +
        'other and none is cut off. A label placed with `label_at` goes exactly where it is ' +
        'told, so on a diagram that keeps `label_at`, move the labels apart instead.',
    });
  }

  const tall = measured.outgrown || [];
  if (tall.length) {
    const worst = tall.reduce((x, y) => (y.need / y.room > x.need / x.room ? y : x));
    out.push({
      signal: 'LABEL_DIAGRAM_LABELS_OUTGROW_PICTURE',
      cue: true,
      message:
        `${which}: the labels down the ${tall.map((side) => side.side).join(' and the ')} of the ` +
        `picture stand ${(worst.need / worst.room).toFixed(1)} times as tall as the picture ` +
        `itself (the longest runs to ${worst.rows} rows), so the drawing has grown to hold ` +
        'them and the picture takes a smaller share of its space. They are laid out and ' +
        'readable; this is a cue to look, not a fault. A callout is read at a glance beside ' +
        'its part, so it usually carries the name; a sentence about the part usually reads ' +
        'better in the lines beside the picture, moved there word for word, and where the ' +
        'same sentence is already in those lines the callout can keep the name alone.',
    });
  }
  return out;
}

function checkLabels(data, laid, ctx) {
  const found = labelFaultsFor(data, laid && laid.measured);
  if (!found.length || !ctx || !Number.isInteger(ctx.slideIndex)) return;
  for (const finding of found) {
    warn(ctx.slideIndex, finding.message);
    if (!recording()) continue;
    labelFindings.push({
      signal: finding.signal,
      cue: !!finding.cue,
      slide: ctx.slideIndex + 1,
      field: `label-diagram:${data.imagePath}`,
      message: finding.message,
    });
  }
}

const mimeFor = (fmt) => fmt === 'png' ? 'image/png' : fmt === 'svg' ? 'image/svg+xml' : 'image/jpeg';

function labelDiagramKey(data) {
  // The key names one diagram: a picture, its callouts and how they are laid
  // out. Two diagrams that share an image and callouts but differ in how their
  // labels are laid out are not the same picture.
  return [
    String(data.imagePath || ''),
    JSON.stringify(data.callouts || []),
    data.layout || 'auto',
    data.marginXRatio, data.marginYRatio, data.labelMaxChars, data.arrow, data.labelColour,
    JSON.stringify(data.frame || null),
  ].join('|');
}

// The same photograph in the same place on several slides (a question slide
// and its answer, one beat told over two slides) is one picture to the class,
// so it must not move when a label gets longer. Each slide keeps room for the
// longest labels any of them carries: same picture, in the same slot of the
// same template and layout. A slide that arranges its pictures differently
// gives the picture a different place anyway, and shares nothing.
function standStillGroups(lesson, measureBands) {
  const groups = new Map();
  const members = [];
  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];
  slides.forEach((slide, slideIndex) => {
    (function walk(obj, slot) {
      if (!obj || typeof obj !== 'object') return;
      if (obj.type === 'label-diagram' && obj.layout === 'sides') {
        const bands = measureBands(obj);
        if (bands) {
          const group = [
            String(obj.imagePath || ''), slide && slide.template,
            typeof (slide && slide.layout) === 'string' ? slide.layout : '', slot,
          ].join('|');
          const kept = groups.get(group) || { leftEm: 0, rightEm: 0, rows: 1 };
          kept.leftEm = Math.max(kept.leftEm, bands.leftEm);
          kept.rightEm = Math.max(kept.rightEm, bands.rightEm);
          kept.rows = Math.max(kept.rows, bands.rows);
          groups.set(group, kept);
          members.push({ id: `${slideIndex}|${labelDiagramKey(obj)}`, group });
        }
      }
      for (const k of Object.keys(obj)) walk(obj[k], `${slot}/${k}`);
    })(slide, '');
  });
  const reserves = {};
  for (const { id, group } of members) reserves[id] = groups.get(group);
  return reserves;
}

// Reads every labelled diagram's picture once, before the slide loop. The
// drawing itself is laid out when its slide is drawn, because its words are
// set at the board's size and how much picture fits beside them depends on the
// room the slide gives it (see layoutAt). The build draws every slide twice,
// so the preflight asks for each drawing at its real room, the pictures are
// made between the two passes (rasteriseLabelDiagrams) and the real pass
// places them: the way every shared drawing reaches the board
// (shared-figure.js).
// The pictures a build has read, keyed by labelDiagramKey, each as
// { href, width, height }, with the build's own record of what it has laid out,
// asked for and made riding along unseen.
function preparedLabelDiagrams(entries) {
  const map = { ...entries };
  const store = { requested: new Map(), made: new Map(), layouts: new Map(), reserves: {}, rasterised: false };
  Object.defineProperty(map, '_store', { value: store, enumerable: false });
  return map;
}

async function preRenderLabelDiagrams(lesson, lessonDir) {
  const map = preparedLabelDiagrams({});
  const store = map._store;
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (e) { return map; }

  const specs = {};
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.type === 'label-diagram') {
      const key = labelDiagramKey(obj);
      if (!specs[key]) specs[key] = obj;
    }
    for (const k of Object.keys(obj)) walk(obj[k]);
  }
  walk(lesson);

  const ctx = { lessonDir };
  for (const [key, spec] of Object.entries(specs)) {
    const resolved = resolveForEmbed(spec.imagePath, ctx);
    if (!resolved || !fs.existsSync(resolved)) continue;   // drawLabelDiagram shows the fallback marker
    try {
      // sharp needs the long-path form; fs above does not. See images/resolve.js.
      const meta = await sharp(longPathSafe(resolved)).metadata();
      const b64 = fs.readFileSync(resolved).toString('base64');
      map[key] = { href: `data:${mimeFor(meta.format)};base64,${b64}`, width: meta.width, height: meta.height };
    } catch (e) {
      // skip: drawLabelDiagram shows the "could not be drawn" marker
    }
  }
  store.reserves = standStillGroups(lesson, (spec) => {
    const entry = map[labelDiagramKey(spec)];
    if (!entry) return null;
    // Band needs are counted in type sizes, so any type size measures them.
    return compose(spec, entry, 100, null, 'measure').bands;
  });
  return map;
}

// A label on the board is board text: a child at the back reads "confluence"
// beside the photograph as they read the sentence under it. So the words have
// the board's size and the picture takes the room they leave, never the other
// way round. 20pt wherever it fits; 18pt, the board's floor for anything a
// child reads, only where 20pt would leave the picture under its own floor
// (the teacher's rulings on the real pages, 8 October 2026).
const LABEL_PT = 20;
const LABEL_PT_TIGHT = 18;
// The least a labelled picture may measure on its short side, in inches: the
// floor an ordinary picture children work from is held to (image.js).
const PICTURE_FLOOR = 1.6;
// Under this the words have left no picture to speak of (eight sentences round
// one photograph). Such a diagram is drawn the way paper draws it, the words a
// share of the picture, so a delivered deck shows a diagram and not a sliver;
// it is the same fault either way.
const PICTURE_GONE = 0.6;
// Pixels per inch the composite is made at, at least: the words stay crisp on
// a board-sized screen however coarse the photograph is.
const MIN_PPI = 200;

function compose(data, entry, fontSize, reserve, href) {
  return labelDiagramSvg({
    ...data,
    imageHref: href,
    imageWidth: entry.width,
    imageHeight: entry.height,
    blue: BLUE,
    font: FONT,
    fontSize,
    reserve,
  });
}

// Lay the diagram out for a box of `w` by `h` inches with its words at `pt`.
// The bands that hold the words are a fixed size on the board, so the scale of
// the picture is what is solved for: inches per picture pixel.
function solve(data, entry, reserve, w, h, pt) {
  const at = (scale) => compose(data, entry, (pt / 72) / scale, reserve, 'measure');
  const fits = (scale) => {
    const built = at(scale);
    return built.w * scale <= w && built.h * scale <= h;
  };
  // The largest picture that fits with its words beside it: a bigger picture
  // always makes a bigger drawing, so the answer is found by halving. Words
  // that leave the picture nothing still draw, with a sliver of picture, and
  // the floor below says so by name.
  let low = 0.2 / Math.max(entry.width, entry.height);
  let high = Math.max(low, Math.min(w / entry.width, h / entry.height));
  if (!fits(high)) {
    for (let round = 0; round < 40; round++) {
      const mid = (low + high) / 2;
      if (fits(mid)) low = mid; else high = mid;
    }
    high = low;
  }
  const scale = high;
  let built = null;
  const fontSize = (pt / 72) / scale;
  built = compose(data, entry, fontSize, reserve, 'measure');
  const fit = Math.min(w / built.w, h / built.h, scale);
  return {
    pt: pt * (fit / scale),
    fontSize,
    scale: fit,
    w: built.w * fit,
    h: built.h * fit,
    aspect: built.aspect,
    pictureShort: Math.min(built.picture.w, built.picture.h) * fit,
    picture: { x: built.picture.x * fit, y: built.picture.y * fit, w: built.picture.w * fit, h: built.picture.h * fit },
    measured: { outgrown: built.outgrown, labelFaults: built.labelFaults },
  };
}

// The diagram with its words a share of the picture, fitted to the box.
function asOnPaper(data, entry, w, h) {
  const built = compose(data, entry, null, null, 'measure');
  const fit = Math.min(w / built.w, h / built.h);
  return {
    pt: built.fontSize * fit * 72,
    fontSize: null,
    scale: fit,
    w: built.w * fit,
    h: built.h * fit,
    aspect: built.aspect,
    pictureShort: Math.min(built.picture.w, built.picture.h) * fit,
    picture: { x: built.picture.x * fit, y: built.picture.y * fit, w: built.picture.w * fit, h: built.picture.h * fit },
    measured: { outgrown: built.outgrown, labelFaults: built.labelFaults },
  };
}

function reserveFor(data, ctx) {
  const store = ctx && ctx.labelDiagramImages && ctx.labelDiagramImages._store;
  if (!store || !Number.isInteger(ctx.slideIndex)) return null;
  return store.reserves[`${ctx.slideIndex}|${labelDiagramKey(data)}`] || null;
}

// The layout of one diagram in one box: 20pt words, or 18pt where that keeps
// the picture over its floor and 20pt does not.
function layoutAt(data, entry, ctx, w, h) {
  const store = ctx.labelDiagramImages._store;
  const reserve = reserveFor(data, ctx);
  const id = [labelDiagramKey(data), JSON.stringify(reserve), w.toFixed(3), h.toFixed(3)].join('|');
  if (store && store.layouts.has(id)) return store.layouts.get(id);
  let laid = solve(data, entry, reserve, w, h, LABEL_PT);
  if (laid.pictureShort < PICTURE_FLOOR) {
    laid = solve(data, entry, reserve, w, h, LABEL_PT_TIGHT);
    if (laid.pictureShort < PICTURE_FLOOR) laid.squeezed = laid.pictureShort;
    if (laid.pictureShort < PICTURE_GONE) laid = Object.assign(asOnPaper(data, entry, w, h), { squeezed: laid.pictureShort });
  }
  laid.id = id;
  laid.reserve = laid.fontSize ? reserve : null;
  if (store) store.layouts.set(id, laid);
  return laid;
}

async function rasteriseLabelDiagrams(map) {
  const store = map && map._store;
  if (!store) return;
  store.rasterised = true;
  if (!store.requested.size) return;
  const sharp = requireGlobal('sharp');
  for (const [id, { data, entry, laid }] of store.requested) {
    try {
      const { svg } = compose(data, entry, laid.fontSize, laid.reserve, entry.href);
      // The SVG is in picture pixels. Made 1:1 the photograph keeps its own
      // resolution; a coarse photograph shown large is made finer than that,
      // so the words and lines are not as soft as the picture.
      const density = RENDER_DENSITY * Math.min(4, Math.max(1, MIN_PPI * laid.scale));
      const png = await sharp(Buffer.from(svg), { density, limitInputPixels: false, unlimited: true }).png().toBuffer();
      store.made.set(id, png);
    } catch (e) {
      // skip: drawLabelDiagram shows the "could not be drawn" marker
    }
  }
  store.requested.clear();
}

function boxFor(zone, data) {
  const hasCaption = !!(data && data.caption);
  const bandH = hasCaption ? (CAPTION_H + CAPTION_GAP) : 0;
  return {
    hasCaption,
    bandH,
    x: zone.x + PAD,
    y: zone.y + PAD,
    w: zone.w - 2 * PAD,
    h: Math.max(0, zone.h - 2 * PAD - bandH),
  };
}

// The finding for a picture its labels have squeezed under the floor, or null.
// Pure, so it is tested without a slide. A picture that is only context
// (`essential: false`) is meant to be small and is left alone, as the picture
// floor leaves it.
function pictureFaultFor(data, laid) {
  if (!laid || !(laid.squeezed < PICTURE_FLOOR) || data.essential === false) return null;
  return {
    signal: 'LABEL_DIAGRAM_PICTURE_TOO_SMALL',
    message:
      `labelled diagram "${data.imagePath}": with its labels at ${LABEL_PT_TIGHT}pt, the smallest a ` +
      `child at the back can read, the picture is left ${laid.squeezed.toFixed(2)}" on its short ` +
      `side, under the ${PICTURE_FLOOR.toFixed(1)}" a class needs to see the part each label points ` +
      'at. Labels keep their size on the board and the picture takes the room they leave, so the ' +
      'picture needs more room or the labels fewer words: fewer pictures on this slide, a slot ' +
      'that gives this one more width, or the beat told over two slides; a sentence about a part ' +
      'moved, word for word, to the lines beside the picture so its callout keeps the name; or ' +
      'letters (A, B, C) on the picture with the names in the lines beside it, which take far ' +
      'less room than names printed either side.',
  };
}

function checkPicture(data, laid, ctx) {
  const finding = pictureFaultFor(data, laid);
  if (!finding || !ctx || !Number.isInteger(ctx.slideIndex)) return;
  warn(ctx.slideIndex, finding.message);
  if (!recording()) return;
  labelFindings.push({
    signal: finding.signal,
    cue: false,
    slide: ctx.slideIndex + 1,
    field: `label-diagram:${data.imagePath}`,
    message: finding.message,
  });
}

function drawLabelDiagram(pptx, slide, zone, data, ctx) {
  const caption = data.caption || '';
  const box = boxFor(zone, data);
  const entry = ctx.labelDiagramImages && ctx.labelDiagramImages[labelDiagramKey(data)];

  if (box.w > 0.05 && box.h > 0.05) {
    if (entry) {
      const store = ctx.labelDiagramImages._store;
      const laid = layoutAt(data, entry, ctx, box.w, box.h);
      checkLabels(data, laid, ctx);
      checkPicture(data, laid, ctx);
      const at = { x: box.x + (box.w - laid.w) / 2, y: box.y + (box.h - laid.h) / 2, w: laid.w, h: laid.h };
      const png = store.made.get(laid.id);
      if (png) {
        slide.addImage({ data: 'image/png;base64,' + png.toString('base64'), ...at });
      } else if (!store.rasterised) {
        // The preflight's job is only to ask: the picture is made before the
        // real pass. Hold its place so anything measuring the drawn extent
        // sees the real box.
        store.requested.set(laid.id, { data, entry, laid });
        slide.addShape(pptx.shapes.RECTANGLE, { ...at, fill: { color: 'FFFFFF', transparency: 100 }, line: { type: 'none' } });
      } else {
        require('./figure-fallback').drawFigureFallback(pptx, slide, at, ctx, 'labelled diagram');
      }
    } else {
      require('./figure-fallback').drawFigureFallback(pptx, slide, { x: box.x, y: box.y, w: box.w, h: box.h }, ctx, 'labelled diagram');
    }
  }

  if (box.hasCaption) {
    slide.addText(caption, {
      x: box.x, y: box.y + box.h + CAPTION_GAP, w: box.w, h: CAPTION_H,
      fontFace: FONT, fontSize: CAPTION_FONT, italic: true, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }
}

// Card-ready extent: the diagram as it is laid out for this zone, contained in
// it (a caption keeps its band at the bottom of the card), so the card hugs
// the diagram instead of spanning the whole zone around a centred picture.
// No prepared image means the fallback marker draws, and a fallback marker has
// no aspect to hug - the card then spans the zone as it always has.
function measureLabelDiagram(zone, data, ctx) {
  const entry = ctx && ctx.labelDiagramImages
    && ctx.labelDiagramImages[labelDiagramKey(data)];
  if (!entry) return null;
  const box = boxFor(zone, data);
  const frame = { x: zone.x, y: zone.y, w: zone.w, h: Math.max(0, zone.h - box.bandH) };
  const laidOut = entry.width > 0 && box.w > 0.05 && box.h > 0.05;
  const aspect = laidOut ? layoutAt(data, entry, ctx, box.w, box.h).aspect : (entry.aspect || 1);
  const rect = measureContainedAspect(frame, aspect, PAD);
  return box.hasCaption ? Object.assign({}, rect, { h: rect.h + box.bandH }) : rect;
}

module.exports = {
  drawLabelDiagram,
  preRenderLabelDiagrams,
  preparedLabelDiagrams,
  rasteriseLabelDiagrams,
  layoutAt,
  pictureFaultFor,
  labelDiagramKey,
  measureLabelDiagram,
  labelFaultsFor,
  labelDiagramFindings,
  clearLabelDiagramFindings
};
