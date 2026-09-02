'use strict';

const { FONT, COLOURS, SIZE_CEILINGS, FIT } = require('../styles');
const { SLIDE_H, SLIDE_W, MARGIN_X, starterPrompt } = require('../layout');
const { drawContent } = require('../content');

// A starter built around one tall test-question image (a portrait crop from a
// real paper). The usual full-width starter header would leave the image only
// the body height below it, shrinking a tall question past readability — so
// this template stacks the date / LO / heading down the LEFT column and gives
// the question the slide's FULL height on the right. Wide question crops
// don't need this: they fit under the normal starter header on `body-full`.

// ─── COORDINATES ──────────────────────────────────────────────
const LEFT_X    = MARGIN_X;          // left column of header text
const LEFT_W    = 6.00;

const DATE_Y    = 0.25;
const DATE_H    = 0.60;
const LO_Y      = 1.00;
const LO_H      = 1.20;              // taller than the standard header: the LO wraps in the narrow column
const HEADING_Y = 2.35;
const HEADING_H = 0.60;

const PROMPT_Y  = 3.02;              // the starter's own question, under the "Starter" label
const PROMPT_H  = 0.80;              // taller than the wide header's row: it wraps in this column

const LEFT_ZONE_Y = 3.15;            // optional content below the heading (prompt / green answer)

const IMAGE_X   = 6.40;              // question panel: full slide height, right side
const IMAGE_W   = SLIDE_W - IMAGE_X;
// ─── END COORDINATES ──────────────────────────────────────────

function drawStarterQuestionTall(pptx, slide, data, ctx) {
  slide.addText('Date', {
    x: LEFT_X, y: DATE_Y, w: LEFT_W, h: DATE_H,
    fontFace: FONT, fontSize: SIZE_CEILINGS.lo, bold: true,
    color: COLOURS.body, align: 'left', valign: 'middle',
    underline: { style: 'sng' }, margin: 0, fit: FIT
  });

  if (data.lo) {
    slide.addText('LO: ' + data.lo, {
      x: LEFT_X, y: LO_Y, w: LEFT_W, h: LO_H,
      fontFace: FONT, fontSize: SIZE_CEILINGS.lo, bold: true,
      color: COLOURS.lo, align: 'left', valign: 'top',
      underline: { style: 'sng' }, margin: 0, fit: FIT
    });
  }

  // "Starter" is the opening slide's heading in every lesson, always; the
  // designer's own question reads underneath it. See `starterPrompt` in
  // layout.js for why the label is not replaceable.
  slide.addText('Starter', {
    x: LEFT_X, y: HEADING_Y, w: LEFT_W, h: HEADING_H,
    fontFace: FONT, fontSize: SIZE_CEILINGS.heading, bold: true,
    color: COLOURS.title, align: 'left', valign: 'middle',
    underline: { style: 'sng' }, margin: 0, fit: FIT
  });

  const prompt = starterPrompt(data);
  if (prompt) {
    slide.addText(prompt, {
      x: LEFT_X, y: PROMPT_Y, w: LEFT_W, h: PROMPT_H,
      fontFace: FONT, fontSize: SIZE_CEILINGS.slideTitle, bold: true,
      color: COLOURS.title, align: 'left', valign: 'top',
      margin: 0, fit: FIT
    });
  }

  const leftZoneY = prompt ? PROMPT_Y + PROMPT_H + 0.10 : LEFT_ZONE_Y;
  const leftZone = {
    x: LEFT_X, y: leftZoneY, w: LEFT_W,
    h: SLIDE_H - 0.25 - leftZoneY, class: 'E-narrow'
  };
  const questionZone = { x: IMAGE_X, y: 0, w: IMAGE_W, h: SLIDE_H, class: 'A' };

  if (data.left)     drawContent(pptx, slide, leftZone,     data.left,     ctx);
  if (data.question) drawContent(pptx, slide, questionZone, data.question, ctx);
}

module.exports = { drawStarterQuestionTall };
