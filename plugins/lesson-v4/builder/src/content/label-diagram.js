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
// Built like the clock/turn diagram: the composite (image + overlay) is rendered
// to a PNG once before the slide loop (in preRenderLabelDiagrams), then
// drawLabelDiagram reads from ctx.labelDiagramImages, so the draw step stays fast
// and synchronous.
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

function checkLabels(data, entry, ctx) {
  const found = labelFaultsFor(data, entry && entry.measured);
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
  // The key dedupes identical diagrams before the render loop. Two diagrams that
  // share an image and callouts but differ in how their labels are laid out are
  // not the same picture, so the presentation flags belong in the key — otherwise
  // the second would wrongly reuse the first's rendered PNG.
  return [
    String(data.imagePath || ''),
    JSON.stringify(data.callouts || []),
    data.layout || 'auto',
    data.marginXRatio, data.marginYRatio, data.labelMaxChars, data.arrow, data.labelColour,
  ].join('|');
}

async function preRenderLabelDiagrams(lesson, lessonDir) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (e) { return {}; }

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

  const map = {};
  const ctx = { lessonDir };
  for (const [key, spec] of Object.entries(specs)) {
    const resolved = resolveForEmbed(spec.imagePath, ctx);
    if (!resolved || !fs.existsSync(resolved)) continue;   // drawLabelDiagram shows the fallback marker
    try {
      // sharp needs the long-path form; fs above does not. See images/resolve.js.
      const meta = await sharp(longPathSafe(resolved)).metadata();
      const b64 = fs.readFileSync(resolved).toString('base64');
      // A photo-backed anatomy diagram (parts of a church, parts of a real
      // flower) reads best as a POSTER, the `sides` layout. Its defaults live
      // in the shared drawing now, so the working wall draws the same poster
      // the slide shows; the slide passes only its own blue and font.
      const { svg, aspect, outgrown, labelFaults } = labelDiagramSvg({
        ...spec,
        imageHref: `data:${mimeFor(meta.format)};base64,${b64}`,
        imageWidth: meta.width,
        imageHeight: meta.height,
        blue: BLUE,
        font: FONT,
      });
      const png = await sharp(Buffer.from(svg), { density: RENDER_DENSITY }).png().toBuffer();
      map[key] = { png, aspect, measured: { outgrown, labelFaults } };
    } catch (e) {
      // skip: drawLabelDiagram shows the "could not be drawn" marker
    }
  }
  return map;
}

function drawLabelDiagram(pptx, slide, zone, data, ctx) {
  const caption    = data.caption || '';
  const hasCaption = caption.length > 0;

  const innerX = zone.x + PAD;
  const innerY = zone.y + PAD;
  const innerW = zone.w - 2 * PAD;
  const bandH  = hasCaption ? (CAPTION_H + CAPTION_GAP) : 0;
  const innerH = Math.max(0, zone.h - 2 * PAD - bandH);

  const entry = ctx.labelDiagramImages && ctx.labelDiagramImages[labelDiagramKey(data)];

  checkLabels(data, entry, ctx);

  if (innerW > 0.05 && innerH > 0.05) {
    if (entry && entry.png) {
      // Contain-fit the composite into the available area, preserving aspect so
      // the picture is never stretched and the leader lines stay true.
      const a = entry.aspect || 1;
      const frameAspect = innerW / innerH;
      let fw, fh;
      if (a > frameAspect) { fw = innerW; fh = innerW / a; }
      else { fh = innerH; fw = innerH * a; }
      const fx = innerX + (innerW - fw) / 2;
      const fy = innerY + (innerH - fh) / 2;
      slide.addImage({ data: 'image/png;base64,' + entry.png.toString('base64'), x: fx, y: fy, w: fw, h: fh });
    } else {
      require('./figure-fallback').drawFigureFallback(pptx, slide, { x: innerX, y: innerY, w: innerW, h: innerH }, ctx, 'labelled diagram');
    }
  }

  if (hasCaption) {
    slide.addText(caption, {
      x: innerX, y: innerY + innerH + CAPTION_GAP, w: innerW, h: CAPTION_H,
      fontFace: FONT, fontSize: CAPTION_FONT, italic: true, color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0, fit: FIT
    });
  }
}

// Card-ready extent: the prepared composite's natural aspect contained in the
// zone (a caption keeps its band at the bottom of the card), so the card hugs
// the diagram instead of spanning the whole zone around a centred picture.
// No prepared image means the fallback marker draws, and a fallback marker has
// no aspect to hug - the card then spans the zone as it always has.
function measureLabelDiagram(zone, data, ctx) {
  const entry = ctx && ctx.labelDiagramImages
    && ctx.labelDiagramImages[labelDiagramKey(data)];
  if (!entry) return null;
  const hasCaption = !!(data && data.caption);
  const bandH = hasCaption ? (CAPTION_H + CAPTION_GAP) : 0;
  const frame = { x: zone.x, y: zone.y, w: zone.w, h: Math.max(0, zone.h - bandH) };
  const rect = measureContainedAspect(frame, entry.aspect || 1, PAD);
  return hasCaption ? Object.assign({}, rect, { h: rect.h + bandH }) : rect;
}

module.exports = {
  drawLabelDiagram,
  preRenderLabelDiagrams,
  labelDiagramKey,
  measureLabelDiagram,
  labelFaultsFor,
  labelDiagramFindings,
  clearLabelDiagramFindings
};
