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
// Hugging floor: a bubble never shrinks below this, so a two-word claim still
// reads as a speech bubble rather than a strip.
const MIN_BUBBLE_H      = 0.9;
// ─── END COORDINATES ──────────────────────────────────────────

// How tall the speech needs its bubble to be, at the BUBBLE_FONT ceiling.
// Same estimation convention as the other content helpers (CHAR_W_EM glyph
// width), deliberately generous: if the words turn out wider than estimated,
// the fit post-pass shrinks the text inside whatever box was drawn, exactly
// as it always has. What this estimate buys is the SHAPE hugging its claim:
// before it, the bubble always took the column's full height, and a two-line
// claim sat over half a slide of blank white (water-cycle DECK-002,
// 30 August 2026) with no supported control to repair it.
const CHAR_W_EM  = 0.58;
const LINE_H_EM  = 1.3;
const HUG_SAFETY = 1.15;

function estimateSpeechHeight(speech, innerW) {
  // Inline markers style runs without printing; count only what a child reads.
  const text = String(speech || '').replace(/\[\[|\]\]|\*\*|\|\|/g, '');
  const glyphW = (BUBBLE_FONT * CHAR_W_EM) / 72;
  const charsPerLine = Math.max(1, Math.floor(innerW / glyphW));
  let lines = 1;
  let len = 0;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const add = (len ? 1 : 0) + word.length;
    if (len > 0 && len + add > charsPerLine) { lines += 1; len = word.length; }
    else len += add;
  }
  return lines * ((BUBBLE_FONT * LINE_H_EM) / 72) * HUG_SAFETY;
}

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

// Which side of the body the statement column takes. Children read left to
// right, so the side decides what they meet first: the thing being judged, or
// the question about it. A slide whose speaker holds the claim wants the
// speaker first and the question after it; a slide whose statement IS the thing
// being judged wants the statement first. Left is the default because the
// statement is usually the object of the judgement.
function statementSide(data) {
  return data && data.statementSide === 'right' ? 'right' : 'left';
}

function drawSpeechBubbles(pptx, slide, data, ctx, count) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

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
    const statementW = bz.w * ratio - SIDE_STATEMENT_GAP / 2;
    const speakersW = bz.w - statementW - SIDE_STATEMENT_GAP;
    const statementFirst = statementSide(data) === 'left';
    drawContent(pptx, slide, {
      x: statementFirst ? bz.x : bz.x + speakersW + SIDE_STATEMENT_GAP,
      y: bz.y, w: statementW, h: bz.h, class: 'E-wide'
    }, statement, ctx);
    speakerAreaX = statementFirst ? bz.x + statementW + SIDE_STATEMENT_GAP : bz.x;
    speakerAreaW = speakersW;
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
  // The bubble hugs its claim. The bottom edge is fixed (the tail below it
  // points at the figure), so the height it gives back comes off the TOP,
  // where blank slide reads as breathing room rather than as an unfinished
  // surface.
  const neededH = estimateSpeechHeight(b.speech, b.w - 2 * TEXT_PAD_X) + 2 * TEXT_PAD_Y;
  const h = Math.max(MIN_BUBBLE_H, Math.min(b.h, neededH));
  const y = b.y + b.h - h;
  const bottom = y + h;

  // Bubble body
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: b.x, y: y, w: b.w, h: h,
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
    x: b.x + TEXT_PAD_X, y: y + TEXT_PAD_Y,
    w: b.w - 2 * TEXT_PAD_X, h: h - 2 * TEXT_PAD_Y,
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
// the prompt) sits beside the one character speaking - the natural home for a
// lesson where ONE child makes a claim the class tests, or Bailey asks the
// question a child is afraid to ask. `statementSide` decides which of the two a
// child meets first; see `statementSide` above. With no statement, the single
// speaker simply centres in the body.
const SOLO_GAP             = 0.45;  // gap between the statement and the speaker column
const SOLO_STATEMENT_RATIO = 0.55;  // default share the statement column takes
const SOLO_COL_FRAC        = 0.6;   // speaker column width as a fraction of the body when alone

function drawSpeechBubbles1(pptx, slide, data, ctx) {
  drawHeader(slide, data, ctx);
  const bz = bodyZone(data.headerStyle, data);

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
    let ratio = (typeof data.statementRatio === 'number') ? data.statementRatio : SOLO_STATEMENT_RATIO;
    ratio = Math.max(0.3, Math.min(0.7, ratio));
    const statementW = bz.w * ratio - SOLO_GAP / 2;
    const speakerW   = bz.w - statementW - SOLO_GAP;
    const statementFirst = statementSide(data) === 'left';
    drawContent(pptx, slide, {
      x: statementFirst ? bz.x : bz.x + speakerW + SOLO_GAP,
      y: bz.y, w: statementW, h: bz.h, class: 'E-wide'
    }, statement, ctx);
    drawSpeaker(statementFirst ? bz.x + statementW + SOLO_GAP : bz.x, bz.y, speakerW, bz.h);
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
