'use strict';

const { FONT, COLOURS, FIT, CARD, CARD_COMPACT } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');
const { drawSignal } = require('../signals');
const { drawSuccessCriteriaHelper, helperKeyForStep } = require('../success-criteria-helpers');
const { fitGroupId, growFitObjectName } = require('../text-fit');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD              = 0.15;
const PAD_LEFT         = 0.05;
const BADGE_W          = 0.55;
const BADGE_MARGIN_MAX = 0.08;
const BADGE_GAP        = 0.10;
const BADGE_FONT_MAX   = 20;
const BADGE_FONT_MIN   = 8;
const TEXT_FONT_MIN    = 18;
const TEXT_FONT_MAX    = 36;
const DIVIDER_H        = 0.01;
const DIVIDER_COLOUR   = '888888';
const SC_HELPER_SLOT_W = 0.68;
const SC_HELPER_H_MAX  = 0.62;
const SC_HELPER_GAP    = 0.10;
// ─── END CONSTANTS ────────────────────────────────────────────

// Ordinary steps stay as strings. A step that names a visible mark may instead
// be { text, helper }; the legacy `figure` field remains accepted. Keeping the
// normal string form avoids making every
// criterion carry object boilerplate just because a small catalogue exists.
function normaliseStep(step) {
  if (step && typeof step === 'object' && !Array.isArray(step)) {
    return {
      text: step.text == null ? '' : String(step.text),
      helper: helperKeyForStep(step)
    };
  }
  return { text: String(step == null ? '' : step), helper: '' };
}

// How many lines a piece of text takes at a given size in a given width, if it
// is allowed to wrap.
//
// The old sizing looked only at row HEIGHT: a tall row got big text whether or
// not the words fitted across it, and a short row got small text even when the
// words would have fitted at a larger size on two lines. Wrapping is what makes
// the difference between those two, so it is measured rather than assumed.
function wrappedLineCount(text, widthIn, pt) {
  const glyphIn = pt * 0.52 / 72;
  const charsPerLine = Math.max(1, Math.floor(widthIn / glyphIn));

  return Math.max(
    1,
    String(text).split(/\n/).reduce(
      (count, line) => count + Math.max(1, Math.ceil(line.length / charsPerLine)),
      0
    )
  );
}

// The largest size at which this text genuinely fits its card, or null when
// even the readable floor will not hold it.
//
// Counting DOWN from the maximum is what makes this "largest readable fit"
// rather than "whatever the row height implies": the first size that fits is
// the biggest one that does.
function largestStepFont(text, widthIn, heightIn) {
  for (let pt = TEXT_FONT_MAX; pt >= TEXT_FONT_MIN; pt -= 1) {
    const lines = wrappedLineCount(text, widthIn, pt);
    const neededHeight = lines * (pt / 72) * 1.28;

    if (neededHeight <= heightIn) return pt;
  }

  return null;
}

// An item that opens with ✨ is a sticky-knowledge REFERENCE, not a how-to step:
// it carries the rule the steps enact, so it must read as a distinct reminder
// rather than wear a number badge that makes it look like the next thing to do.
// Only the genuine steps are numbered, and the count skips the reference so the
// steps stay 1..N.
function isReferenceStep(step) {
  return /^\s*✨/.test(normaliseStep(step).text);
}

// A refusal names the item the way the panel prints it.
//
// The steps are numbered 1..N and a reference carries a star where a number
// would be, so reporting "step 6" on a panel that visibly numbers five steps
// sends the reader hunting for a step that does not exist. The two also have
// different owners: a too-long step is wording the designer may tighten, while
// a too-long reference is a sticky fact from the lesson design that nobody
// downstream may reword. Saying which one refused is what points the repair at
// the person who can actually make it.
function overloadMessage(steps, index) {
  const reference = isReferenceStep(steps[index]);
  const stepNumber = steps
    .slice(0, index + 1)
    .filter((s) => !isReferenceStep(s)).length;

  return reference
    ? `STEP_TEXT_OVERLOAD: the sticky-knowledge reference line does not fit its ` +
        `card at the ${TEXT_FONT_MIN}pt readable minimum. Its wording is ` +
        `source-authored and is not yours to shorten: carry the fact in its own ` +
        `on-slide treatment, or give the zone more room. Nothing was shrunk ` +
        `further or cut.`
    : `STEP_TEXT_OVERLOAD: step ${stepNumber} does not fit its card at the ` +
        `${TEXT_FONT_MIN}pt readable minimum. Shorten the step or give the ` +
        `zone more room; nothing was shrunk further or cut.`;
}

function drawSteps(pptx, slide, zone, data, ctx) {
  const steps = Array.isArray(data.steps) ? data.steps : [];
  if (steps.length === 0) return;

  const innerX = zone.x + PAD_LEFT;
  let   innerY = zone.y + PAD;
  const innerW = zone.w - PAD_LEFT - PAD;
  let   innerH = zone.h - 2 * PAD;

  // Optional heading sits directly above the first step so a label like
  // "✓ Success Criteria" reads as part of the list, not a caption floating
  // far above it. It takes only the room it needs; the steps keep the rest.
  if (data.heading) {
    const headingH = Math.min(0.6, innerH * 0.2);
    slide.addText(data.heading, {
      x: innerX, y: innerY, w: innerW, h: headingH,
      fontFace: FONT, fontSize: data.headingFontSize || 16, bold: true,
      color: data.headingColor || COLOURS.body,
      align: 'left', valign: 'middle', margin: 0, fit: FIT
    });
    innerY += headingH;
    innerH -= headingH;
  }

  const rowH   = innerH / steps.length;

  const badgeMargin = Math.min(BADGE_MARGIN_MAX, rowH * 0.1);
  const badgeW      = Math.min(BADGE_W, rowH - badgeMargin * 2);
  const badgeFont   = Math.max(
    BADGE_FONT_MIN,
    Math.min(BADGE_FONT_MAX, Math.floor(badgeW * 72 * 0.55))
  );

  // ONE card width for the whole related set, from the longest step.
  //
  // Every card used to take the full zone width, so three short steps sat in
  // three boxes far wider than their words and read as a mostly-empty panel.
  // The set is sized to what its longest member actually needs, capped at the
  // room available, and centred in the zone when it needs less: cards that
  // belong together stay the same width as each other, which is what makes them
  // read as one list.
  const textOf = (s) => normaliseStep(s).text;
  const longest = steps.reduce(
    (m, s) => Math.max(m, textOf(s).length),
    0
  );
  const gutterW = badgeW + BADGE_GAP;
  // At the largest size we would ever use, the width the longest step wants on
  // a single line, plus the badge column and padding.
  const wantedW = longest * (TEXT_FONT_MAX * 0.52 / 72) + gutterW;
  const cardW = Math.min(innerW, Math.max(innerW * 0.5, wantedW));
  const cardX = innerX + (innerW - cardW) / 2;

  // Each step at the largest size that genuinely fits ITS card.
  //
  // Related cards should still read as one set. Start from the largest size
  // every sibling can hold, but do not force exact equality when a step's own
  // larger fit changes its wrapping and still fits cleanly. That keeps siblings
  // consistent where a larger size would add no useful layout difference while
  // still allowing the wrapping-aware larger fit the content genuinely earns.
  const stepTextW = cardW - gutterW - 2 * (zone.itemCards ? (zone.compactCards ? CARD_COMPACT : CARD).pad : 0);
  const rowGapForFit = zone.itemCards
    ? Math.min((zone.compactCards ? CARD_COMPACT : CARD).itemGap, rowH * 0.18)
    : 0;

  // The height each item genuinely needs at the readable floor.
  //
  // Equal rows are the right default: cards of matching height are what make a
  // list read as one set. But an equal share is room measured by COUNT, not by
  // content, and the two part company as soon as one item is a different kind
  // of thing. A sticky-knowledge reference is a whole sentence where a step is
  // a short imperative, so on a five-step panel it wraps to three lines and
  // starves inside the same row that leaves each one-line step half its height
  // as unused air. That is the shape that used to refuse the build outright,
  // with every step on the slide sitting in room it did not need.
  const textNeed = steps.map((s) =>
    wrappedLineCount(textOf(s), Math.max(0.3, stepTextW), TEXT_FONT_MIN)
      * (TEXT_FONT_MIN / 72) * 1.28
  );

  // Equal rows stay exactly equal whenever equal rows work, so every panel that
  // fits today keeps the layout it already has. Only when an item cannot hold
  // its equal share does the surplus move from the items sitting in spare room
  // to the one that is short of it.
  const equalShareFits = textNeed.every((need) => need <= rowH - rowGapForFit);
  let rowHeights;

  if (equalShareFits) {
    rowHeights = steps.map(function () { return rowH; });
  } else {
    // A reference takes the height its sentence genuinely needs at the readable
    // floor, and the numbered steps stay one set sharing what is left equally.
    //
    // Sizing every item by its own need instead would be truer to the text and
    // worse on the board: one step that happens to wrap draws a taller card
    // than its neighbours, and a list of five instructions stops reading as a
    // list. The steps are the set the eye reads down, so they keep matching
    // heights; the reference already sits apart, under its own star and colour,
    // and is the one item that can take a different height without breaking
    // anything.
    const referenceHeights = steps.map((s, i) =>
      isReferenceStep(s) ? textNeed[i] + rowGapForFit : 0
    );
    const referenceTotal = referenceHeights.reduce((total, h) => total + h, 0);
    const stepCount = steps.filter((s) => !isReferenceStep(s)).length;
    const stepShare = stepCount ? (innerH - referenceTotal) / stepCount : 0;

    if (referenceTotal > innerH || (stepCount && stepShare <= rowGapForFit)) {
      // Even at the readable floor the items together want more height than the
      // zone has. Not printed unreadably small, and not trimmed: either the
      // words or the room has to change, and both are decisions above this
      // renderer.
      throw new Error(
        overloadMessage(steps, textNeed.indexOf(Math.max(...textNeed)))
      );
    }

    rowHeights = steps.map((s, i) =>
      isReferenceStep(s) ? referenceHeights[i] : stepShare
    );
  }

  const rowTops = rowHeights.reduce(function (tops, h, i) {
    tops.push(i === 0 ? innerY : tops[i - 1] + rowHeights[i - 1]);
    return tops;
  }, []);
  const fitHeights = rowHeights.map((h) => h - rowGapForFit);

  const perStepFont = steps.map((s, i) =>
    largestStepFont(textOf(s), Math.max(0.3, stepTextW), Math.max(0.1, fitHeights[i]))
  );

  const overloadedAt = perStepFont.indexOf(null);
  if (overloadedAt !== -1) {
    throw new Error(overloadMessage(steps, overloadedAt));
  }

  // The numbered steps share one size, because they are the set the eye reads
  // down. A reference line is already marked out as a different kind of thing,
  // by its own colour and a star where a number would be, so it takes its own
  // largest fit instead of dragging every step down to the size a full sentence
  // can manage.
  const stepOnlyFonts = perStepFont.filter((f, i) => !isReferenceStep(steps[i]));
  const sharedFont = Math.min(...(stepOnlyFonts.length ? stepOnlyFonts : perStepFont));
  const coherentFont = perStepFont.map(function (font, i) {
    return isReferenceStep(steps[i]) ? font : sharedFont;
  });
  const stepTextGroup = fitGroupId(zone, 'step-text');

  const fontForStep = (i, availableW) => {
    if (availableW >= stepTextW - 0.001) return coherentFont[i];

    const fits = largestStepFont(
      textOf(steps[i]),
      Math.max(0.3, availableW),
      Math.max(0.1, fitHeights[i])
    );

    if (fits === null) {
      throw new Error(overloadMessage(steps, i));
    }

    return Math.min(coherentFont[i], fits);
  };

  const isReference = isReferenceStep;

  // The card look's per-row form (zone.itemCards, set by drawContent): each
  // step rides its own white rounded card, the way the reference redesigns
  // card every list item, and the divider lines go - the gaps between cards
  // do that job. Inside a panel (SC slot) nothing changes; the panel is the
  // surface there.
  const itemCards = !!zone.itemCards;
  const P         = zone.compactCards ? CARD_COMPACT : CARD;
  const rowGap    = itemCards ? Math.min(P.itemGap, rowH * 0.18) : 0;
  const cardPad   = itemCards ? P.pad : 0;

  let stepNum = 0;
  steps.forEach(function (rawStep, i) {
    const step = normaliseStep(rawStep);
    const rowY   = rowTops[i];
    const cardH  = rowHeights[i] - rowGap;
    const badgeY = rowY + (cardH - badgeW) / 2;
    const rowX   = cardX + cardPad;
    const rowW   = cardW - 2 * cardPad;
    // The size this step genuinely fits at while keeping related cards coherent.
    // A card whose width is reduced below what the set was measured against
    // takes the largest size that still fits that narrower space.
    let textFont = coherentFont[i];

    if (itemCards) {
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: cardX, y: rowY, w: cardW, h: cardH,
        fill: { color: P.fill },
        line: P.lineW ? { color: P.line, width: P.lineW } : { type: 'none' },
        rectRadius: P.radius,
        shadow: Object.assign({}, P.shadow)
      });
    } else if (i > 0) {
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: cardX + badgeW + BADGE_GAP, y: rowY,
        // A full-width steps zone (class A) owns the page. Stopping every rule
        // at 60% makes the unused right third look like a missing panel; narrow
        // companion zones keep the quieter short divider.
        w: (cardW - badgeW - BADGE_GAP) * (zone.class === 'A' ? 1 : 0.6), h: DIVIDER_H,
        fill: { color: DIVIDER_COLOUR },
        line: { color: DIVIDER_COLOUR, width: 0 }
      });
    }

    if (isReference(step)) {
      // The marker is the drawn star from the signal set, sitting in the badge
      // column so the sticky line's text ranges with the numbered steps. The
      // typed ✨ stays in the JSON as the marker the designer writes; it comes
      // off the rendered text because the star now does its job. If the star
      // asset ever goes missing, the ✨ stays on and marks the line as before.
      const starH = Math.min(badgeW, cardH * 0.8);
      const starW = drawSignal(slide, 'star', {
        x: rowX + (badgeW - starH * 0.865) / 2,
        y: rowY + (cardH - starH) / 2, h: starH
      });
      const shown = starW ? step.text.replace(/^\s*✨\s*/, '') : step.text;
      slide.addText(splitAnswerRuns(shown, true), {
        x: starW ? rowX + badgeW + BADGE_GAP : rowX, y: rowY,
        w: starW ? rowW - badgeW - BADGE_GAP : rowW, h: cardH,
        fontFace: FONT, fontSize: textFont, bold: true,
        color: COLOURS.sticky,
        align: 'left', valign: 'middle', margin: 0, fit: FIT,
        objectName: growFitObjectName(stepTextGroup, TEXT_FONT_MAX, 'step-reference-' + i)
      });
      return;
    }

    stepNum += 1;
    slide.addShape(pptx.shapes.OVAL, {
      x: rowX, y: badgeY, w: badgeW, h: badgeW,
      fill: { color: COLOURS.green },
      line: { color: COLOURS.green, width: 1 }
    });
    slide.addText(String(stepNum), {
      x: rowX, y: badgeY, w: badgeW, h: badgeW,
      fontFace: FONT, fontSize: badgeFont, bold: true,
      color: COLOURS.pureWhite,
      align: 'center', valign: 'middle', margin: 0,
      objectName: 'NOFIT_step-badge'
    });
    let textX = rowX + badgeW + BADGE_GAP;
    let textW = rowW - badgeW - BADGE_GAP;

    // The Success Criteria Helper is a literal picture of the mark the child makes, placed
    // between the step number and the words. It takes a bounded slot so a wide
    // parallel-arrow drawing never pushes the criterion into the card edge.
    // If the image is unavailable, reserve nothing: readable instructions beat
    // a mysterious blank hole.
    if (step.helper && textW > SC_HELPER_SLOT_W + SC_HELPER_GAP + 0.8 && cardH > 0.34) {
      const helperH = Math.min(SC_HELPER_H_MAX, cardH * 0.72);
      const drew = drawSuccessCriteriaHelper(slide, step.helper, {
        x: textX,
        y: rowY + (cardH - helperH) / 2,
        w: SC_HELPER_SLOT_W,
        h: helperH
      }, ctx);
      if (drew) {
        textX += SC_HELPER_SLOT_W + SC_HELPER_GAP;
        textW -= SC_HELPER_SLOT_W + SC_HELPER_GAP;
        // The picture took part of this row, so this card has less width than
        // the set was sized against. It takes the largest size that fits what
        // is left rather than overflowing at the shared one.
        textFont = fontForStep(i, textW);
      }
    }

    slide.addText(splitAnswerRuns(step.text, true), {
      x: textX, y: rowY,
      w: textW, h: cardH,
      fontFace: FONT, fontSize: textFont, bold: true,
      color: COLOURS.body,
      align: 'left', valign: 'middle', margin: 0, fit: FIT,
      objectName: growFitObjectName(stepTextGroup, TEXT_FONT_MAX, 'step-text-' + i, TEXT_FONT_MIN)
    });
  });
}

module.exports = { drawSteps };
