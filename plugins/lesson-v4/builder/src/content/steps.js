'use strict';

const { FONT, COLOURS, FIT, CARD, CARD_COMPACT } = require('../styles');
const { splitAnswerRuns } = require('../answer-text');
const { drawSignal } = require('../signals');
const { drawSuccessCriteriaHelper, helperKeyForStep } = require('../success-criteria-helpers');
const { fitGroupId, growFitObjectName } = require('../text-fit');
const { textWidthEm, RENDER_SAFETY } = require('../../../shared/text/comic-glyph-width');
const { warn } = require('../warnings');
const { recordCriteriaBelowFloor } = require('../marked-criteria');

// ─── CONSTANTS ────────────────────────────────────────────────
const PAD              = 0.15;
const PAD_LEFT         = 0.05;
const BADGE_W          = 0.55;
const BADGE_MARGIN_MAX = 0.08;
const BADGE_GAP        = 0.10;
const BADGE_FONT_MAX   = 20;
const BADGE_FONT_MIN   = 8;
// Two different questions, so two different numbers.
//
// TARGET is what a step should be set at, and the size every card's height is
// measured against below, so a card with room to give lands there. MIN is the
// separate question of when a step is too small to put in front of a class,
// and it matches DEFAULT_FLOOR_PT in scripts/fit_text_postprocess.py.
//
// Sizing to MIN instead would build every card to the smallest size allowed
// and leave the text there whenever the zone was tight. Blocking at TARGET
// instead would refuse a whole build over a step that landed at 19pt in a
// narrow side column, which the teacher read off his own board and passed.
const TEXT_FONT_TARGET = 20;
const TEXT_FONT_MIN    = 18;
const TEXT_FONT_MAX    = 36;
// The floor is the zone's to lower, and only one zone does: a success-criteria
// panel holding a list the lesson designer marked too long for every panel,
// which is drawn at the largest size that fits there, down to 16pt, on a slide
// flagged for the teacher (success-criteria-panel.js, marked-criteria.js).
// Every other list keeps TEXT_FONT_MIN, and every function below that takes a
// floor defaults to it.
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
// A step of a worked example is { text, colorRole: 'worked-purple' }: its
// words and its number print purple, the worked example's colour (the
// teacher's rule of 24 September 2026). validate.js refuses any other role.
function normaliseStep(step) {
  if (step && typeof step === 'object' && !Array.isArray(step)) {
    return {
      text: step.text == null ? '' : String(step.text),
      helper: helperKeyForStep(step),
      worked: step.colorRole === 'worked-purple'
    };
  }
  return { text: String(step == null ? '' : step), helper: '', worked: false };
}

// How many lines a piece of text takes at a given size in a given width, if it
// is allowed to wrap.
//
// The old sizing looked only at row HEIGHT: a tall row got big text whether or
// not the words fitted across it, and a short row got small text even when the
// words would have fitted at a larger size on two lines. Wrapping is what makes
// the difference between those two, so it is measured rather than assumed.
//
// It is measured the way the build's final text check measures it: the words
// the child actually sees (marks removed), in bold Comic Sans widths, breaking
// only between words. Counting letters instead said "Choose the nearer hundred;
// at halfway, choose the greater hundred." took three lines in a 3.35" card
// when the real words take four, so the card passed here, came out a millimetre
// short, and the final check refused eleven slides of a Year 4 deck after every
// repair pass had been spent (16 September 2026). A word wider than the card
// cannot wrap at all, so it needs more lines than any card has.
//
// The widths are the font's own advances, without the render allowance the
// picture helpers add. That allowance makes a box a little wider than its words,
// which is right for a box drawn to hold a label; here the card is already
// drawn and the question is only whether the words wrap as the final check will
// wrap them. Its real-font measure of a line comes out just under the advances,
// so this stays a whisker on the cautious side, and adding the allowance too
// refused a criterion the final check passes.
function lineWidthIn(text, pt) {
  return (textWidthEm(text, true) / RENDER_SAFETY) * pt / 72;
}

function wrappedLineCount(text, widthIn, pt) {
  const runs = splitAnswerRuns(text, true);
  const shown = Array.isArray(runs) ? runs.map((run) => run.text).join('') : String(runs);

  return Math.max(
    1,
    shown.split(/\n/).reduce((count, line) => {
      const words = line.split(/[ \t\r\f\v]+/).filter(Boolean);
      let lines = 1;
      let current = '';

      for (const word of words) {
        if (lineWidthIn(word, pt) > widthIn + 1e-6) return Infinity;
        const candidate = current ? `${current} ${word}` : word;
        if (lineWidthIn(candidate, pt) <= widthIn + 1e-6) {
          current = candidate;
        } else {
          lines += 1;
          current = word;
        }
      }

      return count + lines;
    }, 0)
  );
}

// The inset the build's text fitter takes off a box before it measures anything
// (PAD_W and PAD_H in scripts/fit_text_postprocess.py). Sizing a card without
// them measures the text against room the fitter will not give it, so the card
// is born a fraction too short, the fitter drops the text below the projection
// floor to cope, and a step that this renderer believed fitted comes back as a
// build overload. The two measurements have to be taken against the same box.
const FIT_PAD_W = 0.05;
const FIT_PAD_H = 0.03;

const usableWidth = (widthIn) => Math.max(0.1, widthIn - FIT_PAD_W);
const usableHeight = (heightIn) => Math.max(0.1, heightIn - FIT_PAD_H);

// How far a card given exactly the height its lines need may miss it by in the
// arithmetic and still hold them at the floor: a millionth of an inch, far
// below anything the board can show.
const FLOOR_ROUNDING = 1e-6;

// The largest size at which this text genuinely fits its card, or null when
// even the readable floor will not hold it.
//
// Counting DOWN from the maximum is what makes this "largest readable fit"
// rather than "whatever the row height implies": the first size that fits is
// the biggest one that does.
function largestStepFont(text, widthIn, heightIn, floorPt = TEXT_FONT_MIN) {
  for (let pt = TEXT_FONT_MAX; pt >= floorPt; pt -= 1) {
    const lines = wrappedLineCount(text, usableWidth(widthIn), pt);
    const neededHeight = lines * (pt / 72) * 1.28;

    if (neededHeight <= usableHeight(heightIn)) return pt;
  }

  // A card given exactly the height its lines need at the floor holds them.
  // The taller card below is sized to exactly that, and taking the sum that
  // sized it apart again can come back a millionth of an inch short, which
  // refused a list with room to spare and then described a 26-character step
  // as over its 25-character line. Only a refusal gives way here: a card that
  // fits above the floor keeps the size it has always had.
  const floorLines = wrappedLineCount(text, usableWidth(widthIn), floorPt);
  if (floorLines * (floorPt / 72) * 1.28 <= usableHeight(heightIn) + FLOOR_ROUNDING) {
    return floorPt;
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
// How much text this card can actually hold at a given size, as a sentence the
// reader can act on.
//
// A refusal that says only "does not fit" leaves the designer to find the limit
// by trying again, and the next attempt is a guess: three words shorter is as
// likely to be refused as it is to pass. The card's width and height are known
// at the moment it refuses, so the budget is known too, and saying it turns a
// retry into arithmetic.
function budgetSentence(widthIn, heightIn, text, floorPt = TEXT_FONT_MIN) {
  // Counted from the words the card shows and measured as the lines are, so the
  // budget and the refusal cannot disagree: a letter-count budget once said a
  // criterion was inside it while the real words took a line more than the
  // card had.
  const runs = splitAnswerRuns(text, true);
  const shown = (Array.isArray(runs) ? runs.map((run) => run.text).join('') : String(runs))
    .replace(/\s+/g, ' ')
    .trim();
  const perChar = shown.length ? lineWidthIn(shown, floorPt) / shown.length : 0;
  const charsPerLine = perChar > 0
    ? Math.max(1, Math.floor(usableWidth(widthIn) / perChar))
    : 1;
  const oneLine = (floorPt / 72) * 1.28;
  const lines = Math.floor(usableHeight(heightIn) / oneLine);

  // A card with no room for a single line is the case this sentence could not
  // say. The count used to be floored at one, so the refusal described a card
  // holding ninety-five characters on a line that was not there, and then
  // refused forty characters for not fitting in it. Every number in it pointed
  // at the wording, which is the one thing that cannot help: no wording fits a
  // card with no line. Year 4 Maths Lesson 17 (22 September 2026) spent all
  // three Slide Designer repair passes on four such cards and gave up with the
  // first fault still standing.
  //
  // Height is the fault, so the sentence says height, and says it against the
  // same floor the refusal used.
  if (lines < 1) {
    const needs = oneLine + FIT_PAD_H;
    return `The card is ${heightIn.toFixed(2)}in tall and one line at ` +
      `${floorPt}pt needs ${needs.toFixed(2)}in, so it holds no line at ` +
      `all and no wording will fit it. This is room, not words: each card here ` +
      `is about ${(needs - heightIn).toFixed(2)}in short.`;
  }

  const budget = charsPerLine * lines;
  const takes = wrappedLineCount(text, usableWidth(widthIn), floorPt);
  const wraps = Number.isFinite(takes)
    ? `, which wrap to ${takes} line${takes === 1 ? '' : 's'}`
    : ', and one word is wider than the card';

  return `The card holds about ${budget} characters at ${floorPt}pt ` +
    `(${lines} line${lines === 1 ? '' : 's'} of about ${charsPerLine}); this ` +
    `one is ${shown.length} characters${wraps}.`;
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
function overloadMessage(steps, index, budget, sourceAuthored, widestPracticePanel, floorPt = TEXT_FONT_MIN) {
  const reference = isReferenceStep(steps[index]);
  // A list marked too long is refused only below the least it may be drawn
  // at, which is not the readable minimum every other list keeps.
  const floor = floorPt < TEXT_FONT_MIN
    ? `the ${floorPt}pt a list marked too long may be drawn at`
    : `the ${TEXT_FONT_MIN}pt readable minimum`;
  const stepNumber = steps
    .slice(0, index + 1)
    .filter((s) => !isReferenceStep(s)).length;
  const room = budget ? ` ${budget}` : '';

  // A refusal is only useful if the repair it names is one the reader is
  // allowed to make. A sticky reference and a success criterion are both the
  // lesson designer's words, and `slide-success-criteria.md` already tells the
  // slide designer to move a method that will not fit into a roomier panel
  // rather than compact it - so telling it here to shorten the step sets the
  // engine against its own guidance at the one moment the guidance is needed,
  // and the cheaper-looking repair is the one that breaks the lesson.
  //
  // A practice template's panel refused at its widest has only one taller
  // shape left within half the slide, so it is named rather than "a wider or
  // taller composition", which there is not.
  const roomier = widestPracticePanel
    ? `The practice panel is already as wide as it goes. Give the list more ` +
      `room instead: the half-width split (\`split-h-50-50\`) with the criteria ` +
      `in an \`sc-panel\` down one whole side is a little taller and can hold ` +
      `what this panel cannot, never fewer criteria. See ` +
      `\`slide-success-criteria.md\`.`
    : `Give the panel more room instead: a wider or taller \`sc-panel\` ` +
      `composition up to half the slide, never fewer criteria. See ` +
      `\`slide-success-criteria.md\`.`;

  if (reference) {
    return `STEP_TEXT_OVERLOAD: the sticky-knowledge reference line does not ` +
      `fit its card at ${floor}.${room} Its ` +
      `wording is source-authored and is not yours to shorten: carry the fact ` +
      `in its own on-slide treatment, or give the zone more room. Nothing was ` +
      `shrunk further or cut.`;
  }

  return sourceAuthored
    ? `STEP_TEXT_OVERLOAD: criterion ${stepNumber} does not fit its card at ` +
        `${floor}.${room} Its wording is the ` +
        `lesson designer's and is not yours to shorten or merge. ${roomier} ` +
        `Nothing was shrunk further or cut.`
    : `STEP_TEXT_OVERLOAD: step ${stepNumber} does not fit its card at ` +
        `${floor}.${room} Shorten the step to that, ` +
        `or give the zone more room; nothing was shrunk further or cut.`;
}

// The card geometry a list gets from its height: each row's share, the number
// badge, one card width for the related set, and the width left for the words.
// A function of the height because the short-list rule in drawSteps sizes a
// list twice when it gives way.
function cardRows(steps, zone, innerX, innerW, height) {
  const rowH   = height / steps.length;

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
  const longest = steps.reduce(
    (m, s) => Math.max(m, normaliseStep(s).text.length),
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

  return { rowH, badgeW, badgeFont, cardW, cardX, stepTextW, rowGapForFit };
}

// The height a step or a sticky line needs at the floor, its card's gap
// included: the least room it can be given without being refused.
function floorNeed(text, rows, floorPt = TEXT_FONT_MIN) {
  return wrappedLineCount(text, usableWidth(Math.max(0.3, rows.stepTextW)), floorPt)
    * (floorPt / 72) * 1.28 + FIT_PAD_H + rows.rowGapForFit;
}

function drawSteps(pptx, slide, zone, data, ctx) {
  const steps = Array.isArray(data.steps) ? data.steps : [];
  if (steps.length === 0) return;

  const innerX = zone.x + PAD_LEFT;
  let   innerY = zone.y + PAD;
  const innerW = zone.w - PAD_LEFT - PAD;
  let   innerH = zone.h - 2 * PAD;
  // The readable floor, unless this is a criteria panel holding a list marked
  // too long, whose panel has lowered it (see the constants above). Only the
  // marked list's own steps take the lowered floor: a sticky line beside them
  // keeps the readable one in every measure and every refusal, because the
  // teacher kept 18pt for everything else.
  const floorPt = Number.isFinite(zone.floorPt) ? zone.floorPt : TEXT_FONT_MIN;
  const drawnSmaller = floorPt < TEXT_FONT_MIN;
  const floorFor = (s) => (isReferenceStep(s) ? TEXT_FONT_MIN : floorPt);

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

  // A short criteria list keeps the card height of a normal-length one.
  //
  // Rows share the panel's height, and the text grows to fill its card, so two
  // steps in a panel built for four came out in cards twice as tall with text
  // blown up to fill them: a Year 4 "find the tens either side" slide
  // (17 September 2026) put two short criteria at poster size beside a number
  // line, and the teacher called it overfilled. So a panel with fewer steps than
  // a normal list uses the top of its height at the same card size, and the
  // spare room stays empty below. Only criteria panels do this; a steps list
  // that is the slide's main content still fills its zone.
  //
  // The rule gives way when the list needs the height. A short list that its
  // share of four rows cannot hold at the 18pt floor takes the height its lines
  // need there, and no more, up to the whole panel: a single long criterion
  // (the saved RE step, 76 characters) was refused with three quarters of the
  // panel empty below it. The gap between cards and the number badge grow with
  // the row, so in a shallow band a list given what it needed at its small share
  // needs a little more at the new height: it is measured again at the height it
  // is given until the need settles, which takes a few passes because both stop
  // growing (a one-step `Round to the nearer ten.` in the bottom 40% band was
  // refused about 0.01in short after one). The rounding allowance on top keeps
  // the checks below, which add the same heights up in a different order, from
  // refusing it by a hair.
  const CRITERIA_PANEL_ROWS = 4;
  const textOf = (s) => normaliseStep(s).text;
  const panelH = innerH;
  if (zone.criteriaPanel && steps.length < CRITERIA_PANEL_ROWS) {
    innerH = innerH * steps.length / CRITERIA_PANEL_ROWS;
    for (let pass = 0; pass < 8 && innerH < panelH; pass += 1) {
      const shortRows = cardRows(steps, zone, innerX, innerW, innerH);
      const floorTotal = steps.reduce((total, s) => total + floorNeed(textOf(s), shortRows, floorFor(s)), 0);
      if (floorTotal <= innerH + 1e-9) break;
      innerH = Math.min(panelH, floorTotal + FLOOR_ROUNDING);
    }
  }

  const rows = cardRows(steps, zone, innerX, innerW, innerH);
  const { rowH, badgeW, badgeFont, cardW, cardX, stepTextW, rowGapForFit } = rows;

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
    wrappedLineCount(textOf(s), usableWidth(Math.max(0.3, stepTextW)), TEXT_FONT_TARGET)
      * (TEXT_FONT_TARGET / 72) * 1.28 + FIT_PAD_H
  );

  // What the reference would need if it were held to the floor rather than the
  // target. This is not the size it will be set at; it is the least room it can
  // be given without refusing the panel, and it is what the allocation below
  // falls back to when serving the reference in full would cost the criteria.
  const referenceFloorNeed = steps.map((s) =>
    isReferenceStep(s)
      ? wrappedLineCount(textOf(s), usableWidth(Math.max(0.3, stepTextW)), TEXT_FONT_MIN)
          * (TEXT_FONT_MIN / 72) * 1.28 + FIT_PAD_H
      : 0
  );

  // What each criterion needs at the readable floor, its gap included. A
  // criterion that wraps takes a taller card below when the panel has the
  // room, so these, added up, are what the criteria need together.
  const stepFloorNeed = steps.map((s) => (isReferenceStep(s) ? 0 : floorNeed(textOf(s), rows, floorPt)));

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
    // The criteria are what the class actually works from, so they are served
    // first and the reference takes what is left.
    //
    // Serving the reference in full first is what used to happen, and on a full
    // panel it quietly cost the criteria their size: a three-line sentence
    // claimed the room five short imperatives were sharing, and every item
    // ended up at the floor together. So the reference is cut back toward the
    // floor exactly as far as the criteria need, and no further - it keeps any
    // room the criteria are not using, and it never drops below the floor,
    // where the panel is refused instead of shipping a line nobody can read.
    // What the criteria need together, at the least, is each one's own height
    // at the readable floor, added up, because a criterion that wraps takes a
    // taller card below when the panel has the room. Measuring every one at
    // the 20pt target, and as tall as the tallest, overstated it and refused
    // panels with a sticky line that had room for everything at 18 or 19pt
    // (the saved rounding and partition lists).
    const stepCountForNeed = steps.filter((s) => !isReferenceStep(s)).length;
    const stepNeedTotal = stepFloorNeed.reduce((total, need) => total + need, 0);

    // Size the criteria against a panel where the reference is held to its
    // floor, then hand the reference everything the criteria did not use.
    //
    // Reserving room for the criteria in one pass cannot work: what they need
    // depends on the size they end up at, and that depends on the room left
    // after the reference, so an estimate either strands room the criteria
    // could have grown into or claims room they can never use and refuses a
    // panel that fits. Sizing them once against their guaranteed share settles
    // it, and the remainder is real room rather than a guess.
    const referenceFloorTotalRoom = steps.reduce(
      (total, s, i) => (isReferenceStep(s) ? total + referenceFloorNeed[i] + rowGapForFit : total),
      0
    );
    const stepShareAtRefFloor = stepCountForNeed
      ? (innerH - referenceFloorTotalRoom) / stepCountForNeed
      : 0;
    const stepFontAtRefFloor = steps.reduce((smallest, s, i) => {
      if (isReferenceStep(s)) return smallest;

      const font = largestStepFont(
        textOf(s),
        Math.max(0.3, stepTextW),
        Math.max(0.1, stepShareAtRefFloor - rowGapForFit),
        floorPt
      );

      return font === null ? smallest : Math.min(smallest, font);
    }, TEXT_FONT_MAX);
    const stepRoomAtBestFont = steps.reduce(
      (tallest, s, i) =>
        isReferenceStep(s)
          ? tallest
          : Math.max(
              tallest,
              wrappedLineCount(textOf(s), usableWidth(Math.max(0.3, stepTextW)), stepFontAtRefFloor)
                * (stepFontAtRefFloor / 72) * 1.28 + FIT_PAD_H
            ),
      0
    );
    const stepClaim = stepCountForNeed * (stepRoomAtBestFont + rowGapForFit);

    // A panel where the reference cannot reach its floor even after the criteria
    // are served has more in it than it can hold. Saying so here names the item
    // that is over capacity, rather than letting the shortfall fall on whichever
    // criterion happens to wrap and reporting that one instead.
    const referenceFloorTotal = steps.reduce(
      (total, s, i) => (isReferenceStep(s) ? total + referenceFloorNeed[i] + rowGapForFit : total),
      0
    );

    if (referenceFloorTotal && stepNeedTotal + referenceFloorTotal > innerH) {
      throw new Error(
        overloadMessage(
          steps,
          steps.findIndex(isReferenceStep),
          undefined,
          zone.sourceAuthoredText,
          zone.widestPracticePanel,
          TEXT_FONT_MIN
        )
      );
    }
    const referenceHeights = steps.map((s, i) => {
      if (!isReferenceStep(s)) return 0;

      const wanted = textNeed[i] + rowGapForFit;
      const floorRoom = referenceFloorNeed[i] + rowGapForFit;
      const spare = innerH - stepClaim;

      // The reference claims the floor, and room beyond that goes to the
      // criteria first. Letting it claim the target instead is what put a whole
      // panel at one size: the sentence took the room the criteria would have
      // grown into, and a fact the class glances at once set the size of the
      // five lines they work from all lesson. It still keeps whatever the
      // criteria genuinely cannot use.
      return Math.max(floorRoom, Math.min(wanted, spare));
    });
    const referenceTotal = referenceHeights.reduce((total, h) => total + h, 0);
    const stepCount = steps.filter((s) => !isReferenceStep(s)).length;
    const stepShare = stepCount ? (innerH - referenceTotal) / stepCount : 0;

    if (referenceTotal > innerH || (stepCount && stepShare <= rowGapForFit)) {
      // Even at the readable floor the items together want more height than the
      // zone has. Not printed unreadably small, and not trimmed: either the
      // words or the room has to change, and both are decisions above this
      // renderer.
      throw new Error(
        overloadMessage(
          steps,
          textNeed.indexOf(Math.max(...textNeed)),
          undefined,
          zone.sourceAuthoredText,
          zone.widestPracticePanel,
          floorFor(steps[textNeed.indexOf(Math.max(...textNeed))])
        )
      );
    }

    rowHeights = steps.map((s, i) =>
      isReferenceStep(s) ? referenceHeights[i] : stepShare
    );
  }

  // A criterion that cannot hold its matching share at the readable floor
  // takes the height it needs, when the panel has that room to give.
  //
  // Matching heights are what make the steps read as one set, so they stay
  // whenever they work. But a panel refused over one long criterion, while the
  // short ones beside it sit in room they do not use, costs the teacher the
  // whole deck for a millimetre: a Year 4 rounding panel of three short steps
  // and one four-line step was refused on eleven slides with over an inch of
  // spare height between them (16 September 2026). So only the steps that need
  // more are made taller, by exactly what they need, and every other step keeps
  // one shared height out of what is left. Refusing stays for a panel whose
  // steps genuinely need more height together than it has.
  const stepIndexes = steps.map((s, i) => i).filter((i) => !isReferenceStep(steps[i]));
  const stepRoom = innerH - steps.reduce(
    (total, s, i) => (isReferenceStep(s) ? total + rowHeights[i] : total),
    0
  );
  const shortOfFloor = stepIndexes.some((i) => rowHeights[i] < stepFloorNeed[i] - 1e-9);
  const stepNeedSum = stepIndexes.reduce((total, i) => total + stepFloorNeed[i], 0);

  if (shortOfFloor && stepIndexes.length && stepNeedSum <= stepRoom + 1e-9) {
    let taller = new Set();
    let shared = stepRoom / stepIndexes.length;

    for (;;) {
      const next = new Set(stepIndexes.filter((i) => stepFloorNeed[i] > shared + 1e-9));
      if (next.size === taller.size) break;
      taller = next;
      const tallerRoom = [...taller].reduce((total, i) => total + stepFloorNeed[i], 0);
      shared = (stepRoom - tallerRoom) / (stepIndexes.length - taller.size);
    }

    rowHeights = rowHeights.map((h, i) =>
      isReferenceStep(steps[i]) ? h : (taller.has(i) ? stepFloorNeed[i] : shared)
    );
  }

  const rowTops = rowHeights.reduce(function (tops, h, i) {
    tops.push(i === 0 ? innerY : tops[i - 1] + rowHeights[i - 1]);
    return tops;
  }, []);
  const fitHeights = rowHeights.map((h) => h - rowGapForFit);

  const perStepFont = steps.map((s, i) =>
    largestStepFont(textOf(s), Math.max(0.3, stepTextW), Math.max(0.1, fitHeights[i]), floorFor(s))
  );

  const overloadedAt = perStepFont.indexOf(null);
  if (overloadedAt !== -1) {
    throw new Error(
      overloadMessage(
        steps,
        overloadedAt,
        budgetSentence(
          Math.max(0.3, stepTextW),
          Math.max(0.1, fitHeights[overloadedAt]),
          textOf(steps[overloadedAt]),
          floorFor(steps[overloadedAt])
        ),
        zone.sourceAuthoredText,
        zone.widestPracticePanel,
        floorFor(steps[overloadedAt])
      )
    );
  }

  // The numbered steps share one size, because they are the set the eye reads
  // down. A reference line is already marked out as a different kind of thing,
  // by its own colour and a star where a number would be, so it takes its own
  // largest fit instead of dragging every step down to the size a full sentence
  // can manage.
  const stepOnlyFonts = perStepFont.filter((f, i) => !isReferenceStep(steps[i]));
  const sharedFont = Math.min(...(stepOnlyFonts.length ? stepOnlyFonts : perStepFont));

  // A criteria panel is read from a table while children work, so it has a
  // readable target of its own, above the deck-wide floor. Settling below it is
  // not a fault in itself: 18pt is his floor, and he chose to widen a panel only
  // as far as 18pt needs. The words are the lesson designer's and stay (the
  // teacher's decisions of 23 September 2026), and a list that does not fit is
  // refused with a roomier shape named, so this message asks for nothing. A
  // Codex run recorded four panels at 18pt as an accepted minor issue and
  // nothing told it which step was doing it (19 September 2026). A list set
  // under the floor is not "within" it: that is a list marked too long, and it
  // is recorded as a finding once it is drawn (below).
  if (zone.criteriaPanel && sharedFont < TEXT_FONT_TARGET && sharedFont >= TEXT_FONT_MIN &&
      ctx && ctx.slideIndex !== undefined) {
    const longest = steps
      .filter((s) => !isReferenceStep(s))
      .reduce((most, s) => (textOf(s).length > textOf(most).length ? s : most), steps[0]);
    warn(
      ctx.slideIndex,
      `success criteria set at ${sharedFont}pt: within the 18pt floor, below the ` +
      `${TEXT_FONT_TARGET}pt a panel reads best at from a table. The longest step is ` +
      `"${textOf(longest)}". Nothing need change: the words are the lesson ` +
      `designer's and stay as they are, and a list that does not fit is refused ` +
      `with a roomier shape named.`
    );
  }
  const coherentFont = perStepFont.map(function (font, i) {
    return isReferenceStep(steps[i]) ? font : sharedFont;
  });
  const stepTextGroup = fitGroupId(zone, 'step-text');

  const fontForStep = (i, availableW) => {
    if (availableW >= stepTextW - 0.001) return coherentFont[i];

    const fits = largestStepFont(
      textOf(steps[i]),
      Math.max(0.3, availableW),
      Math.max(0.1, fitHeights[i]),
      floorPt
    );

    if (fits === null) {
      throw new Error(
        overloadMessage(
          steps,
          i,
          budgetSentence(
            Math.max(0.3, availableW),
            Math.max(0.1, fitHeights[i]),
            textOf(steps[i]),
            floorPt
          ),
          zone.sourceAuthoredText,
          zone.widestPracticePanel,
          floorPt
        )
      );
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

  // The final text fit holds each line to the floor its name carries, so a
  // list drawn under the readable floor names its steps as a marked list's,
  // the only lines that fit may take below 18pt (fit_text_postprocess.py). The
  // fit gives every line of one group the smallest size any of them needs, so
  // a sticky line beside them takes a group of its own and keeps 18pt.
  const lineName = (label, i) => {
    if (!drawnSmaller) {
      return growFitObjectName(stepTextGroup, TEXT_FONT_MAX, label + i, label === 'step-text-' ? TEXT_FONT_MIN : undefined);
    }
    return label === 'step-text-'
      ? growFitObjectName(stepTextGroup, TEXT_FONT_MAX, 'marked-' + label + i, floorPt)
      : growFitObjectName(fitGroupId(zone, 'step-reference'), TEXT_FONT_MAX, label + i);
  };
  let smallestDrawn = Infinity;

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
        objectName: lineName('step-reference-', i)
      });
      return;
    }

    stepNum += 1;
    const badgeColour = step.worked ? COLOURS.worked : COLOURS.green;
    slide.addShape(pptx.shapes.OVAL, {
      x: rowX, y: badgeY, w: badgeW, h: badgeW,
      fill: { color: badgeColour },
      line: { color: badgeColour, width: 1 }
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

    smallestDrawn = Math.min(smallestDrawn, textFont);
    // A worked step's runs start from the worked purple, so a taught word or a
    // bold word in it does not turn the rest of the step black (the fourth check).
    slide.addText(splitAnswerRuns(step.text, true, step.worked ? COLOURS.worked : undefined), {
      x: textX, y: rowY,
      w: textW, h: cardH,
      fontFace: FONT, fontSize: textFont, bold: true,
      color: step.worked ? COLOURS.worked : COLOURS.body,
      align: 'left', valign: 'middle', margin: 0, fit: FIT,
      objectName: lineName('step-text-', i)
    });
  });

  // A list the lesson designer marked too long, drawn under the readable
  // floor: finished, and named for the teacher to check before teaching.
  if (drawnSmaller && smallestDrawn < TEXT_FONT_MIN) {
    recordCriteriaBelowFloor(ctx, smallestDrawn, steps.map(textOf).filter((t) => !/^\s*✨/.test(t)));
  }
}

module.exports = { drawSteps, TEXT_FONT_MIN };
