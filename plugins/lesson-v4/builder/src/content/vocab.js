'use strict';

const fs = require("node:fs");
const {
  validateSemanticEducationalSvgVisual,
} = require("../../../shared/educational-svg-asset");

const { FONT, COLOURS, FIT } = require('../styles');
const { fitGroupId, growFitObjectName } = require('../text-fit');
const { warn } = require('../warnings');
const { drawMoney } = require('./money');
const { drawImage, imageWillDraw } = require('./image');
const { drawTurnDiagram } = require('./turn-diagram');
const { drawAngle } = require('./angle');
const { drawTriangle, drawTriangleNonExample } = require('./triangle');
const { drawLinePair } = require('./line-pair');
const { drawGeoboard } = require('./geoboard');
const { drawPolygon } = require('./polygon');
const { drawVenn } = require('./venn');
const { drawCarroll } = require('./carroll');
const { drawRainforestLayers } = require('./rainforest-layers');
const { drawPlaceValueMini } = require('./place-value-mini');
const { splitAnswerRuns } = require('../answer-text');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD              = 0.15;
// The grow-fit ceiling, not a fixed size. The card used to pin its text at
// 16pt with shrink-only autofit, so a one-word slide sat in a wide cream box
// with small type and a lot of dead space: Daniel measured the same box
// taking 40pt before the text outgrew it. Every other text surface in the
// deck already grows through the fit pass; this card was the one left behind.
// 40 matches the deck's largest ceiling (the question cards and the
// lesson-cover LO), and the fit pass still shrinks a four-entry card to what
// its rows can hold.
const FONT_MAX         = 40;
const FILL_COLOUR      = 'FFF9E6';
const BORDER_COLOUR    = 'CCCCCC';
const RECT_RADIUS      = 0.04;
const DIVIDER_H        = 0.02;
const ROW_PAD_Y        = 0.06;
const VISUAL_COL_FRAC  = 0.28;   // fraction of boxW reserved for the visual column
const VISUAL_INNER_PAD = 0.06;   // padding inside the visual cell
// ─── END CONSTANTS ────────────────────────────────────────────

// A vocab card draws money, image, turn-diagram, angle, triangle,
// triangle-nonexample, line-pair, geoboard, polygon, place-value-mini, and
// non-empty text visuals. Other content types (a fraction wall, a clock, and so
// on) can't render on a card. turn-diagram,
// angle, triangle, line-pair, geoboard and polygon are supported because a small turn, angle,
// triangle, line-pair, shape-on-pegs or named-shape picture is a natural icon for a
// turns/angles/shapes/lines word — "angle" shown as a quarter turn, "acute angle"
// shown as the angle itself, "scalene" shown as the scalene triangle with its dashes,
// "parallel lines" shown as a parallel pair, "trapezium" shown as the trapezium
// itself on a geoboard, or "regular polygon" shown as a true regular hexagon — and each
// renders as a self-contained figure just like an image, so it fits the card's visual
// cell with no extra layout work. (polygon is the right icon for a regular-shape word,
// where the preset geometry draws a truly regular shape that a geoboard's integer pegs
// can't seat.)
// resolveVocabVisual is the single gate the card layouts call before reserving
// any space: it returns the visual when it will actually draw, and otherwise
// returns null so the card treats itself as having no picture — full-width text,
// no empty framed panel — rather than reserving a cell that ends up blank or, on
// older builds, stamped with a "[type]" token. A genuinely unsupported type is
// surfaced as a build warning so the slide spec gets corrected upstream; an
// absent or empty visual is simply "no picture" and passes quietly.
function resolveVocabVisual(visual, ctx) {
  if (!visual || !visual.type) return null;
  const t = visual.type;
  if (t === "image" && visual.kind === "educational-svg") {
    const checked = validateSemanticEducationalSvgVisual(
      visual,
      ctx && ctx.lessonDir,
      "semantic vocabulary Educational SVG visual"
    );
    if (checked.error) {
      if (ctx) {
        warn(
          ctx.slideIndex,
          `${checked.error} The vocabulary card was rendered text-only.`
        );
      }
      return null;
    }
    if (!checked.resolvedPath || !fs.existsSync(checked.resolvedPath)) return null;
    return visual;
  }
  // A photo has to clear a second hurdle the drawn visuals don't: its file has to
  // be there. Asking only whether `image` is a type this card can draw let a card
  // reserve its picture cell for a photo that was never sourced, and the cell then
  // printed as an empty framed box a quarter of the card wide. "Can I draw this
  // kind of thing?" is not the question this gate exists to answer; "will anything
  // appear here?" is.
  if (t === 'image') return imageWillDraw(visual, ctx) ? visual : null;
  if (t === 'money' || t === 'turn-diagram' || t === 'angle' ||
      t === 'triangle' || t === 'triangle-nonexample' || t === 'line-pair' ||
      t === 'geoboard' || t === 'polygon' || t === 'venn' || t === 'carroll' ||
      t === 'rainforest-layers' || t === 'place-value-mini') return visual;
  if (t === 'text') {
    return (visual.value != null && String(visual.value) !== '') ? visual : null;
  }
  if (ctx) warn(ctx.slideIndex, 'vocab visual type "' + t + '" can\'t render on a vocab card — left blank (use a supported visual from the key-vocabulary catalogue)');
  return null;
}

function drawVisual(pptx, slide, zone, visual, ctx) {
  if (!visual || !visual.type) return;
  if (visual.type === 'money') return drawMoney(pptx, slide, zone, visual, ctx);
  if (visual.type === 'image') return drawImage(pptx, slide, zone, visual, ctx);
  if (visual.type === 'turn-diagram') return drawTurnDiagram(pptx, slide, zone, visual, ctx);
  if (visual.type === 'angle') return drawAngle(pptx, slide, zone, visual, ctx);
  if (visual.type === 'triangle') return drawTriangle(pptx, slide, zone, visual, ctx);
  if (visual.type === 'triangle-nonexample') return drawTriangleNonExample(pptx, slide, zone, visual, ctx);
  if (visual.type === 'line-pair') return drawLinePair(pptx, slide, zone, visual, ctx);
  if (visual.type === 'geoboard') return drawGeoboard(pptx, slide, zone, visual, ctx);
  if (visual.type === 'polygon') return drawPolygon(pptx, slide, zone, visual, ctx);
  if (visual.type === 'venn') return drawVenn(pptx, slide, zone, visual, ctx);
  if (visual.type === 'carroll') return drawCarroll(pptx, slide, zone, visual, ctx);
  if (visual.type === 'place-value-mini') return drawPlaceValueMini(pptx, slide, zone, visual, ctx);
  // A layer word ("canopy", "understorey") is best shown as the whole cross
  // section with that one layer highlighted and the other three dimmed — the
  // child sees where in the forest the word lives, not just a patch of green.
  // Drop `labels` on a vocab card: the word is already printed beside it.
  if (visual.type === 'rainforest-layers') return drawRainforestLayers(pptx, slide, zone, visual, ctx);
  if (visual.type === 'text') {
    const value = visual.value != null ? String(visual.value) : '';
    if (!value) return;
    const tokens = value.trim().split(/\s+/);
    const notationSequence = visual.singleLine === true ||
      (visual.singleLine !== false && value.length <= 12 && tokens.length > 1 &&
        tokens.every(function (token) { return token.length <= 3; }));
    const singleLineFont = notationSequence
      ? Math.max(18, Math.min(48, Math.floor((zone.w * 72) / Math.max(1, value.length * 0.62))))
      : 48;
    // The visual is the card's example slot — the word or phrase shown in action.
    // Run it through the shared inline-marker formatter so a designer highlighting
    // the example ("[[Relax]]. [[Unwind]]. [[Escape]].") gets coloured, weighted
    // words rather than literal brackets. Plain example text is returned unchanged.
    slide.addText(splitAnswerRuns(value, false, COLOURS.body), {
      x: zone.x, y: zone.y, w: zone.w, h: zone.h,
      fontFace: FONT, fontSize: singleLineFont,
      color: COLOURS.body,
      align: 'center', valign: 'middle', margin: 0, fit: FIT,
      breakLine: false,
      wrap: !notationSequence
    });
    return;
  }
  // Safety net: callers gate on resolveVocabVisual, so an unrenderable type should
  // never reach here. If one does, draw nothing rather than a placeholder token.
}

function drawVocab(pptx, slide, zone, data, ctx) {
  const words = Array.isArray(data.words) ? data.words : [];
  if (words.length === 0) return;

  // Resolve each card's visual once. A visual that can't render counts as no
  // picture, so the column is only reserved when at least one card truly has one.
  const resolved = words.map(function (w) { return resolveVocabVisual(w.visual, ctx); });
  const hasVisuals = resolved.some(Boolean);

  const boxX = zone.x + PAD;
  const boxY = zone.y + PAD;
  const boxW = zone.w - 2 * PAD;
  const boxH = zone.h - 2 * PAD;

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: boxX, y: boxY, w: boxW, h: boxH,
    fill: { color: FILL_COLOUR },
    line: { color: BORDER_COLOUR, width: 1 },
    rectRadius: RECT_RADIUS
  });

  const visualColW = hasVisuals ? boxW * VISUAL_COL_FRAC : 0;
  const textColW   = boxW - visualColW;
  const rowH       = boxH / words.length;

  // One fit group for the whole card, so every row lands on the same final
  // size (the smallest any row can take) and the card reads as one set.
  const textGroup = fitGroupId(zone, 'vocab-defn');

  words.forEach(function (item, i) {
    const rowY = boxY + i * rowH;

    // A colon, not an em dash: the em dash is not part of this teacher's
    // written voice anywhere a child reads (preferences.md, Written Voice).
    const runs = [
      { text: item.word || '',
        options: { color: COLOURS.green, bold: true } },
      { text: ': ' + (item.definition || ''),
        options: { color: COLOURS.body, bold: true } }
    ];

    slide.addText(runs, {
      x: boxX + PAD, y: rowY + ROW_PAD_Y,
      w: textColW - 2 * PAD, h: rowH - 2 * ROW_PAD_Y,
      fontFace: FONT, fontSize: FONT_MAX,
      align: 'left', valign: 'middle', margin: 0, fit: FIT,
      objectName: growFitObjectName(textGroup, FONT_MAX, 'vocab-' + i)
    });

    if (hasVisuals && resolved[i]) {
      const visualZone = {
        x: boxX + textColW + VISUAL_INNER_PAD,
        y: rowY + VISUAL_INNER_PAD,
        w: visualColW - 2 * VISUAL_INNER_PAD,
        h: rowH - 2 * VISUAL_INNER_PAD
      };
      drawVisual(pptx, slide, visualZone, resolved[i], ctx);
    }

    if (i < words.length - 1) {
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: boxX + PAD, y: rowY + rowH - DIVIDER_H / 2,
        w: boxW - 2 * PAD, h: DIVIDER_H,
        fill: { color: COLOURS.green },
        line: { color: COLOURS.green, width: 0 }
      });
    }
  });
}

module.exports = { drawVocab, drawVisual, resolveVocabVisual };
