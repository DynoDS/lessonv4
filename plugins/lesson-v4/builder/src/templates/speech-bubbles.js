'use strict';

const fs = require('fs');
const path = require('path');

const { bodyZone } = require('../layout');
const { drawHeader } = require('../headers');
const { drawContent } = require('../content');
const { FONT, COLOURS, FIT } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');

// ─── COORDINATES ──────────────────────────────────────────────
const STATEMENT_H_RATIO        = 0.20;   // a short text statement sits in a slim band
const STATEMENT_H_RATIO_VISUAL = 0.50;   // a diagram statement in a band, when a caller pins it there
const STATEMENT_GAP     = 0.15;   // gap below the statement before the speakers
// A DIAGRAM statement goes BESIDE the speakers, not above them, for the same
// reason the one-speaker layout already does it: a band above is the full body
// width but only half its height, so a figure placed there is height-bound and
// comes out small with wide empty slide either side of it, however much width the
// band has. Given its own column the same figure gets the body's full height and
// roughly doubles, which matters because a diagram statement is the thing children
// must read to judge who is right. A short TEXT statement still sits in the slim
// band above, where a line of words reads perfectly well and the speakers keep the
// room. A caller that genuinely wants the band for a figure can still say so with
// `statementLayout: "band"`.
const SIDE_STATEMENT_RATIO = 0.44;  // share of the body width the side statement takes
const SIDE_STATEMENT_GAP   = 0.30;  // gap between the statement column and the speakers
const COL_GAP           = 0.45;   // gap between speaker columns
const FIG_BLOCK_RATIO   = 0.46;   // figure + name height as a fraction of the speaker area
const NAME_H            = 0.45;   // name label height (inches)
const BUBBLE_FIG_GAP    = 0.10;   // gap between the tail tip and the figure
const TAIL_W            = 0.55;   // speech-bubble tail width (inches)
const TAIL_H            = 0.42;   // speech-bubble tail height (inches)
const BUBBLE_RADIUS     = 0.10;   // rounded-corner radius of the bubble
const LINE_W            = 2.25;   // bubble + tail outline weight (points)
const TEXT_PAD_X        = 0.22;   // horizontal inset of speech text inside the bubble
const TEXT_PAD_Y        = 0.16;   // vertical inset of speech text inside the bubble
// Speech text ceiling. The fit-text post-pass measures the real glyphs and
// binary-searches the largest size that fits each bubble, but it can only search
// DOWNWARDS from whatever size is written here — so this number is not a style
// choice, it is the headroom the measurement is allowed to use. At the old flat
// 22 a one-line remark and a four-line one both came out at 22, and a short line
// sat marooned in a bubble two thirds empty, which is the "size text to the room
// it has" failure preferences.md warns about. Set it to the largest size a bubble
// should ever show and let the measured pass come down from there.
const BUBBLE_FONT       = 34;
const NAME_FONT         = 20;     // name label ceiling
// ─── END COORDINATES ──────────────────────────────────────────

// Bundled character art lives beside the coins in assets/. Each entry records
// the file, the default on-slide name, and the trimmed natural aspect (w / h)
// so the figure embeds without ever being squashed.
const CHILD_DIR = path.join(__dirname, '..', '..', 'assets', 'children');
const CHILDREN = {
  'bailey':       { file: 'bailey.png',       name: 'Bailey',       aspect: 1.0509 },
  'mr-sear':      { file: 'mr-sear.png',      name: 'Mr Sear',      aspect: 0.7097 },
  'miss-brooker': { file: 'miss-brooker.png', name: 'Miss Brooker', aspect: 0.7482 }
};
// Speakers that don't name a character fill in this order, left to right.
const DEFAULT_ORDER = ['mr-sear', 'miss-brooker', 'bailey'];

function drawSpeechBubbles(pptx, slide, data, ctx, count) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle);

  // ── Statement under the header ──
  // A short text prompt sits in a slim band. When the statement is the very thing
  // children must read to judge — a Venn or Carroll they decide a placement on —
  // it is the central content of the slide, so it claims a taller band and reads at
  // size instead of shrinking to a thumbnail above the speakers. A caller can tune
  // the share explicitly with `statementRatio`.
  let statement = data.statement;
  if (typeof statement === 'string') statement = { type: 'text', value: statement };
  const isVisualStatement = !!(statement && statement.type && statement.type !== 'text');
  const sideStatement = isVisualStatement && data.statementLayout !== 'band';

  // A diagram statement takes its own full-height column on the left; anything
  // else keeps the slim band above the speakers.
  let speakerAreaX = bz.x, speakerAreaW = bz.w;
  let speakerAreaY = bz.y, speakerAreaH = bz.h;

  if (sideStatement) {
    let ratio = (typeof data.statementRatio === 'number') ? data.statementRatio : SIDE_STATEMENT_RATIO;
    ratio = Math.max(0.3, Math.min(0.6, ratio));
    const leftW = bz.w * ratio - SIDE_STATEMENT_GAP / 2;
    drawContent(pptx, slide, { x: bz.x, y: bz.y, w: leftW, h: bz.h, class: 'E-wide' }, statement, ctx);
    speakerAreaX = bz.x + leftW + SIDE_STATEMENT_GAP;
    speakerAreaW = bz.w - leftW - SIDE_STATEMENT_GAP;
  } else {
    let ratio = (typeof data.statementRatio === 'number')
      ? data.statementRatio
      : (isVisualStatement ? STATEMENT_H_RATIO_VISUAL : STATEMENT_H_RATIO);
    ratio = Math.max(0.15, Math.min(0.6, ratio));
    const statementZone = { x: bz.x, y: bz.y, w: bz.w, h: bz.h * ratio, class: 'E-wide' };
    if (statement) drawContent(pptx, slide, statementZone, statement, ctx);
    if (statement) {
      speakerAreaY = statementZone.y + statementZone.h + STATEMENT_GAP;
      speakerAreaH = bz.y + bz.h - speakerAreaY;
    }
  }

  const colW = (speakerAreaW - (count - 1) * COL_GAP) / count;

  const speakers = Array.isArray(data.speakers) ? data.speakers : [];

  for (let i = 0; i < count; i++) {
    const colX = speakerAreaX + i * (colW + COL_GAP);
    const speaker = speakers[i] || {};

    const figBlockH = speakerAreaH * FIG_BLOCK_RATIO;
    const figBlockY = speakerAreaY + speakerAreaH - figBlockH;
    const bubbleY   = speakerAreaY;
    const bubbleH   = speakerAreaH - figBlockH - TAIL_H - BUBBLE_FIG_GAP;
    const figCx     = colX + colW / 2;

    drawBubble(pptx, slide, {
      x: colX, y: bubbleY, w: colW, h: bubbleH,
      tailCx: figCx, speech: speaker.speech || ''
    });

    drawFigure(pptx, slide, {
      x: colX, y: figBlockY, w: colW, h: figBlockH, cx: figCx,
      speaker: speaker, index: i
    }, ctx);
  }
}

function drawBubble(pptx, slide, b) {
  const bottom = b.y + b.h;

  // Bubble body
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: b.x, y: b.y, w: b.w, h: b.h,
    rectRadius: BUBBLE_RADIUS,
    fill: { color: COLOURS.pureWhite },
    line: { color: COLOURS.body, width: LINE_W }
  });

  // Downward tail (apex points to the figure)
  slide.addShape(pptx.shapes.ISOSCELES_TRIANGLE, {
    x: b.tailCx - TAIL_W / 2, y: bottom - 0.02, w: TAIL_W, h: TAIL_H,
    rotate: 180,
    fill: { color: COLOURS.pureWhite },
    line: { color: COLOURS.body, width: LINE_W }
  });

  // Seam eraser: white fill (no line) over the join, hiding the bubble's
  // bottom border and the tail's base border so the tail reads as an opening.
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: b.tailCx - TAIL_W / 2 + 0.05, y: bottom - 0.04,
    w: TAIL_W - 0.10, h: 0.08,
    fill: { color: COLOURS.pureWhite },
    line: { type: 'none' }
  });

  // Speech text (separate from the shape so autofit measures it correctly).
  // Run through the shared inline-marker formatter so a [[focus]] word a child
  // must weigh, a **stressed** word, or a ||answer reveal inside a character's
  // line renders as styled runs rather than literal brackets, asterisks, or
  // pipes — exactly as the same markers render in body text and steps.
  slide.addText(splitAnswerRuns(b.speech, true), {
    x: b.x + TEXT_PAD_X, y: b.y + TEXT_PAD_Y,
    w: b.w - 2 * TEXT_PAD_X, h: b.h - 2 * TEXT_PAD_Y,
    fontFace: FONT, fontSize: BUBBLE_FONT, bold: true,
    color: COLOURS.body, align: 'left', valign: 'top',
    margin: 0, fit: FIT
  });
}

function drawFigure(pptx, slide, f, ctx) {
  const key = f.speaker.child || DEFAULT_ORDER[f.index % DEFAULT_ORDER.length];
  const child = CHILDREN[key] || CHILDREN[DEFAULT_ORDER[f.index % DEFAULT_ORDER.length]];
  const displayName = f.speaker.name || child.name;

  const imgAreaH = f.h - NAME_H;
  const assetPath = path.join(CHILD_DIR, child.file);

  if (fs.existsSync(assetPath) && imgAreaH > 0) {
    // Aspect-preserving contain, centred horizontally, bottom-aligned so every
    // figure stands on the same line just above its name.
    let h = imgAreaH;
    let w = h * child.aspect;
    if (w > f.w) { w = f.w; h = w / child.aspect; }
    const x = f.cx - w / 2;
    const y = f.y + imgAreaH - h;
    slide.addImage({ path: assetPath, x: x, y: y, w: w, h: h });
  }

  slide.addText(displayName, {
    x: f.x, y: f.y + f.h - NAME_H, w: f.w, h: NAME_H,
    fontFace: FONT, fontSize: NAME_FONT, bold: true,
    color: COLOURS.body, align: 'center', valign: 'middle',
    margin: 0, fit: FIT
  });
}

// A single speaker reads best side-by-side rather than as one bubble stretched
// across the whole slide: the thing being voiced about (the shape a child judges,
// the prompt) sits on the left, and the one character speaks from the right — the
// natural home for a lesson where ONE child makes a claim the class tests, or
// Bailey asks the question a child is afraid to ask. With no statement, the single
// speaker simply centres in the body.
const SOLO_GAP        = 0.45;   // gap between the statement and the speaker column
const SOLO_LEFT_RATIO = 0.55;   // default share the statement takes on the left
const SOLO_COL_FRAC   = 0.6;    // speaker column width as a fraction of the body when alone

function drawSpeechBubbles1(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle);

  let statement = data.statement;
  if (typeof statement === 'string') statement = { type: 'text', value: statement };

  const speakers = Array.isArray(data.speakers) ? data.speakers : [];
  const speaker = speakers[0] || {};

  // Speaker column geometry, shared by both branches.
  function drawSpeaker(colX, colY, colW, colH) {
    const figBlockH = colH * FIG_BLOCK_RATIO;
    const figBlockY = colY + colH - figBlockH;
    const bubbleH   = colH - figBlockH - TAIL_H - BUBBLE_FIG_GAP;
    const figCx     = colX + colW / 2;
    drawBubble(pptx, slide, {
      x: colX, y: colY, w: colW, h: bubbleH, tailCx: figCx, speech: speaker.speech || ''
    });
    drawFigure(pptx, slide, {
      x: colX, y: figBlockY, w: colW, h: figBlockH, cx: figCx, speaker: speaker, index: 0
    }, ctx);
  }

  if (statement) {
    let ratio = (typeof data.statementRatio === 'number') ? data.statementRatio : SOLO_LEFT_RATIO;
    ratio = Math.max(0.3, Math.min(0.7, ratio));
    const leftW  = bz.w * ratio - SOLO_GAP / 2;
    const rightW = bz.w - leftW - SOLO_GAP;
    drawContent(pptx, slide, { x: bz.x, y: bz.y, w: leftW, h: bz.h, class: 'E-wide' }, statement, ctx);
    drawSpeaker(bz.x + leftW + SOLO_GAP, bz.y, rightW, bz.h);
  } else {
    const colW = bz.w * SOLO_COL_FRAC;
    drawSpeaker(bz.x + (bz.w - colW) / 2, bz.y, colW, bz.h);
  }
}

function drawSpeechBubbles2(pptx, slide, data, ctx) {
  drawSpeechBubbles(pptx, slide, data, ctx, 2);
}

function drawSpeechBubbles3(pptx, slide, data, ctx) {
  drawSpeechBubbles(pptx, slide, data, ctx, 3);
}

module.exports = { drawSpeechBubbles1, drawSpeechBubbles2, drawSpeechBubbles3 };
