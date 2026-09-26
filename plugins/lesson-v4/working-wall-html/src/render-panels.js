"use strict";

// Panel family renderers: sticky knowledge, vocab definition, worked example,
// sentence stem and misconception.

const {
  printableInches,
  fitLinearBodySize,
  linearBodyFitsAtFloor,
  fitTitleSize,
  titleBarHeightInches,
  TITLE_BAR_LINE_HEIGHT,
  tryReadPhoto,
  photoAspect,
  stackedCaptionInches,
  panelPage,
} = require("./layout");
const {
  panelFractionFor,
  panelFractionThatFits,
  wideVisualReserveInches,
  stackedFigureInches,
  pickVisual,
  defaultVisualLabel,
  cardLabel,
  stackedBodyOpts,
  defaultBodyPt,
  minBodyPt,
  panelLabelPt,
  badgeInches,
  accentLabelPtFor,
  isStepLabel,
  PHOTO_AT_A_THIRD,
} = require("./visuals");
const { badgeKey } = require("./svg-renderer");
const { esc, markedHtml, mm, hash, imgTag, visualTag, titleBarHtml, panelHtml, panelWithVisualHtml, twoUpPanelsHtml } = require("./shared");
const { criteriaSegments, plainCriteria } = require("../../shared/text/criteria-marks");

// A step's marked parts in the colour the board gave them.
function criteriaHtml(text) {
  return criteriaSegments(text)
    .map((segment) => (segment.colour ? `<span style="color:${segment.colour};">${esc(segment.text)}</span>` : esc(segment.text)))
    .join("");
}

// Arrows come from "Wall Arrows" (shared.js says why).
const FONT_STACK_FALLBACK = "'Wall Arrows', 'Segoe Print', cursive";

// Local title-fit wrapper used by this renderer family.
function titlePtFor(card, style) {
  const base = card.page.size === "A3" ? style.sizes.a3TitlePt : style.sizes.a4TitlePt;
  return fitTitleSize(card.title || "", base, card.page.size, card.page.orientation, style);
}

// How much of the page the title bar takes, so the panel below is fitted to the
// room that is actually left.
//
// These renderers used to reserve a flat 1.6in (1.8 with step badges) while an
// A3 title bar draws at about 2.19in, because nothing set a line-height and
// Comic Sans' own line box is nearer 1.4 than the 1.25 the constant assumes. A
// card could therefore be sized against six tenths of an inch it did not have,
// run past the bottom of the sheet, and push its last words onto a second A3
// page carrying nothing else - which is how a Year 4 place-value wall shipped
// with "times the place to its right." alone on its own sheet.
//
// render-grids solved this for reference tables long ago and this is the same
// two moves: pin the line-height in the CSS so the bar's height is decided here
// rather than by the font, then reserve exactly that. A worked example's badge
// rows used to reserve a flat 0.2in more; the page model now measures each row
// at its badge's own height (layout.js, What the page draws).

function titleBarOpts() {
  return { lineHeight: TITLE_BAR_LINE_HEIGHT };
}

// One centred bold line per body item, drawn with the board's colour marks (a
// taught word green). Use padding rather than margins so consecutive line
// spacing does not collapse.
function bodyLineHtml(text, pt, style) {
  const padMm = mm(200 / 1440);
  return (
    `<div style="box-sizing:border-box;padding:${padMm}mm 0;text-align:center;` +
    `font-family:'${style.fonts.body}', ${FONT_STACK_FALLBACK};font-weight:bold;` +
    `font-size:${pt}pt;color:${hash(style.colours.body)};">${markedHtml(text)}</div>`
  );
}

function optionalCardImagePath(card) {
  return card.photo || (card.picture && card.picture.imagePath) || null;
}

function optionalCardEmojiVisual(card) {
  if (!card || card.photo) return null;
  const picture = card.picture;
  if (!picture || picture.kind !== "emoji") return null;
  const value = typeof picture.value === "string" ? picture.value.trim() : "";
  if (!value) return null;
  return {
    emoji: value,
    aspect: 1,
    alt: typeof picture.alt === "string" ? picture.alt : "",
  };
}

// ─── Sticky knowledge: purple panel, big bold body ──────────────────────

function renderStickyKnowledge(card, style, specDir, ctx = {}) {
  const shown = card.items || [];
  // The fits measure the words a child reads, never a colour mark.
  const items = shown.map((item) => ({ ...item, text: plainCriteria(item.text) }));
  const fillColour = style.colours.stickyPanelFill;
  const borderColour = style.colours.stickyPanelLine;

  const titleText = card.title || "Remember";
  const titlePt = titlePtFor({ ...card, title: titleText }, style);
  const titleBarEl = titleBarHtml(titleText, style.colours.stickyTitleBarFill, style, titlePt, card.page.size, card.page.orientation, titleBarOpts());

  const dims = printableInches(card.page.size, card.page.orientation, style);
  const imagePath = optionalCardImagePath(card);
  const emojiVisual = optionalCardEmojiVisual(card);
  const hasVisual = !!(card.visual || imagePath || emojiVisual);
  const pictureBeside = hasVisual && !card.visual;
  // How many lines a fact may take at the floor size: the card's usual two,
  // unless its photo has narrowed to about a third (visuals.js).
  let factLines = null;
  const bodyOpts = (fraction) => ({
    ...stackedBodyOpts(card, fraction, style),
    ...(factLines ? { floorLinesPerItem: factLines, longItemsAtFloor: PHOTO_AT_A_THIRD.factsOnThreeLines } : {}),
  });
  const fitsAt = (fraction, extra) =>
    linearBodyFitsAtFloor(
      items.length > 0 ? items : [{ text: "" }],
      minBodyPt(card, style),
      card.page.size,
      card.page.orientation,
      style,
      { widthOverride: dims.width * fraction - 0.6, titleAreaInches: titleBarHeightInches(titlePt), ...stackedBodyOpts(card, fraction, style), ...extra }
    );
  const fitsBeside = (fraction) => fitsAt(fraction, bodyOpts(fraction));
  let panelFraction = panelFractionThatFits(panelFractionFor(card, ctx, pictureBeside), fitsBeside);
  let photoOff = false;
  if (pictureBeside && !fitsBeside(panelFraction)) {
    panelFraction = PHOTO_AT_A_THIRD.share;
    factLines = PHOTO_AT_A_THIRD.floorLines;
    // His rule allows one fact on three lines beside the photo, and the next
    // goes on a second card: the wall designer's move, where the wall has room.
    // A card that still holds more than one here is never lost for it. The
    // build cannot write a shorter sentence, so it takes his order's last move
    // for this card alone, the photo off, every sentence kept whole on the full
    // width, and says so (the fourth check, 26 September 2026).
    const onlyTheCount = !fitsBeside(panelFraction) && fitsAt(panelFraction, { floorLinesPerItem: factLines });
    if (onlyTheCount && fitsAt(1, {})) {
      photoOff = true;
      panelFraction = 1;
      factLines = null;
      console.log(
        `[working-wall] ${cardLabel(card)}: more than one fact needs three lines beside the photo, and a card holds ` +
          "one fact that long, so this card is built with its photo off and every sentence whole. To keep the photo, " +
          "the wall designer moves the next long fact to a second card where the wall has room, or gives it a shorter " +
          "whole sentence."
      );
    }
  }
  const widthOverride = dims.width * panelFraction - 0.6;
  // A3-only builder: use the fixed A3 value below.
  // The figure is offered the generous share and handed back whatever the
  // panel cannot give up: this probe re-runs the body's own fit at its floor
  // size for a candidate reserve, so no card can be pushed under the text
  // size its steps need in order to print a bigger diagram.
  // A figure stacked under the panel carries its caption beneath it too.
  const caption = stackedCaptionInches(card.visual ? defaultVisualLabel(card.visual) : null, card.page.orientation, style);
  const bodyFitsAtFloor = (reserve) =>
    linearBodyFitsAtFloor(
      items.length > 0 ? items : [{ text: "" }],
      minBodyPt(card, style),
      card.page.size,
      card.page.orientation,
      style,
      { widthOverride, titleAreaInches: titleBarHeightInches(titlePt) + (reserve > 0 ? stackedFigureInches(card, ctx, style, reserve) + caption : 0), ...bodyOpts(panelFraction) }
    );
  const wideVisualReserve = wideVisualReserveInches(card, ctx, style, bodyFitsAtFloor);
  const titleAreaInches = titleBarHeightInches(titlePt) + (wideVisualReserve > 0 ? stackedFigureInches(card, ctx, style, wideVisualReserve) + caption : 0);
  // The draw uses the number the reserve was made with; the 0.25in is the
  // gap `wideVisualReserveInches` adds above the figure.
  const maxVisualHeightIn = wideVisualReserve > 0 ? wideVisualReserve - 0.25 : undefined;

  const bodyPt = fitLinearBodySize(
    items.length > 0 ? items : [{ text: "" }],
    defaultBodyPt(card, style),
    minBodyPt(card, style),
    card.page.size,
    card.page.orientation,
    style,
    { widthOverride, titleAreaInches, ...bodyOpts(panelFraction) }
  );

  const panelChildrenHtml = shown.map((item) => bodyLineHtml(item.text, bodyPt, style)).join("");

  if (card.visual) {
    const v = pickVisual(card.visual, ctx);
    const visualLabel = defaultVisualLabel(card.visual);
    return (
      titleBarEl +
      panelWithVisualHtml(panelChildrenHtml, v, visualLabel, fillColour, borderColour, style, card.page.size, card.page.orientation, { panelFraction, aspect: v ? v.aspect : 1, maxVisualHeightIn, bodyHeightIn: printableInches(card.page.size, card.page.orientation, style).height - titleBarHeightInches(titlePt) })
    );
  }

  if (emojiVisual && !photoOff) {
    return (
      titleBarEl +
      panelWithVisualHtml(
        panelChildrenHtml,
        emojiVisual,
        null,
        fillColour,
        borderColour,
        style,
        card.page.size,
        card.page.orientation,
        { panelFraction, aspect: emojiVisual.aspect }
      )
    );
  }

  if (imagePath && !photoOff) {
    const photoBuf = tryReadPhoto(specDir, imagePath);
    if (photoBuf) {
// No aspect is passed for this photo path, so panelWithVisualHtml uses its
  // square default. Preserve that existing behaviour.
      return (
        titleBarEl +
        panelWithVisualHtml(panelChildrenHtml, { buf: photoBuf, aspect: 1 }, null, fillColour, borderColour, style, card.page.size, card.page.orientation, { panelFraction })
      );
    }
  }

  return titleBarEl + panelHtml(panelChildrenHtml, fillColour, borderColour, style, card.page.size, card.page.orientation);
}

// ─── Vocab definition: term in title bar, definition + drawn example in body ─

function renderVocabDefinition(card, style, specDir, ctx = {}) {
  const titleText = card.title || "Vocabulary";
  const definition = card.definition || "";

  const titlePt = titlePtFor({ ...card, title: titleText }, style);
  const titleBarEl = titleBarHtml(titleText, style.colours.vocabDefinitionTitleBarFill, style, titlePt, card.page.size, card.page.orientation, titleBarOpts());

  const fillColour = style.colours.vocabDefinitionPanelFill;
  const borderColour = style.colours.vocabDefinitionPanelLine;

  const dims = printableInches(card.page.size, card.page.orientation, style);
  const hasVisual = !!card.visual;
  const panelFraction = panelFractionThatFits(panelFractionFor(card, ctx, hasVisual && !card.visual), (fraction) =>
    linearBodyFitsAtFloor(
      [{ text: definition ? plainCriteria(definition) : "" }],
      minBodyPt(card, style),
      card.page.size,
      card.page.orientation,
      style,
      { widthOverride: dims.width * fraction - 0.6, titleAreaInches: titleBarHeightInches(titlePt), ...stackedBodyOpts(card, fraction, style) }
    ));
  const widthOverride = dims.width * panelFraction - 0.6;
  // The figure is offered the generous share and handed back whatever the
  // panel cannot give up: this probe re-runs the body's own fit at its floor
  // size for a candidate reserve, so no card can be pushed under the text
  // size its steps need in order to print a bigger diagram.
  // Declared BEFORE the closure that reads it, which is the whole point of
  // where this line sits. It used to sit below `wideVisualReserveInches`, and
  // that call invokes `bodyFitsAtFloor` whenever the card carries a wide
  // visual - so every `vocabDefinition` with a wide figure died on
  // "Cannot access 'items' before initialization" before it drew anything.
  // The three other panel renderers in this file already declare theirs first;
  // this one was the odd one out, and the cost was a Year 4 maths wall
  // shipping without the card defining `exchange`, the word two of its own
  // method steps hang on.
  const items = definition ? [{ text: plainCriteria(definition) }] : [{ text: "" }];

  // A figure stacked under the panel carries its caption beneath it too.
  const caption = stackedCaptionInches(card.visual ? defaultVisualLabel(card.visual) : null, card.page.orientation, style);
  const bodyFitsAtFloor = (reserve) =>
    linearBodyFitsAtFloor(
      items.length > 0 ? items : [{ text: "" }],
      minBodyPt(card, style),
      card.page.size,
      card.page.orientation,
      style,
      { widthOverride, titleAreaInches: titleBarHeightInches(titlePt) + (reserve > 0 ? stackedFigureInches(card, ctx, style, reserve) + caption : 0), ...stackedBodyOpts(card, panelFraction, style) }
    );
  const wideVisualReserve = wideVisualReserveInches(card, ctx, style, bodyFitsAtFloor);
  const titleAreaInches = titleBarHeightInches(titlePt) + (wideVisualReserve > 0 ? stackedFigureInches(card, ctx, style, wideVisualReserve) + caption : 0);
  // The draw uses the number the reserve was made with; the 0.25in is the
  // gap `wideVisualReserveInches` adds above the figure.
  const maxVisualHeightIn = wideVisualReserve > 0 ? wideVisualReserve - 0.25 : undefined;
  const bodyPt = fitLinearBodySize(
    items,
    defaultBodyPt(card, style),
    minBodyPt(card, style),
    card.page.size,
    card.page.orientation,
    style,
    { widthOverride, titleAreaInches, ...stackedBodyOpts(card, panelFraction, style) }
  );

  const panelChildrenHtml = bodyLineHtml(definition, bodyPt, style);

  if (hasVisual) {
    const v = pickVisual(card.visual, ctx);
    const visualLabel = defaultVisualLabel(card.visual);
    return (
      titleBarEl +
      panelWithVisualHtml(panelChildrenHtml, v, visualLabel, fillColour, borderColour, style, card.page.size, card.page.orientation, { panelFraction, aspect: v ? v.aspect : 1, maxVisualHeightIn, bodyHeightIn: printableInches(card.page.size, card.page.orientation, style).height - titleBarHeightInches(titlePt) })
    );
  }

  return titleBarEl + panelHtml(panelChildrenHtml, fillColour, borderColour, style, card.page.size, card.page.orientation);
}

// ─── Worked example: purple panel + green numbered badges ───────────────
// The panel is the worked-example purple, the board's sticky purple; the step
// badges stay the green of the success-criteria steps they copy.
// A badge column (fixed width, aligned to the top of the whole row) beside the
// step text. A wrapped step keeps its number beside its first line. A missing
// badge buffer (sharp unavailable) falls
// back to a plain "N." label rather than an empty cell, so a step never
// loses its number.
function stepBadgeRowHtml(badgeBuf, text, bodyPt, badgeIn, style, stepNumber) {
  const badgeMm = mm(badgeIn);
  const gapMm = mm(200 / 1440);
  const vPadMm = mm(60 / 1440);
  const badgeInnerHtml = badgeBuf
    ? imgTag(badgeBuf, badgeMm, badgeMm)
    : `<div style="text-align:left;font-family:'${style.fonts.title}', ${FONT_STACK_FALLBACK};` +
      `font-weight:bold;font-size:${bodyPt}pt;color:${hash(style.colours.workedExampleLabel)};">${stepNumber}.</div>`;
  return (
    `<div style="display:flex;align-items:flex-start;box-sizing:border-box;padding:${vPadMm}mm 0;">` +
    `<div style="flex:none;width:${badgeMm}mm;margin-right:${gapMm}mm;">${badgeInnerHtml}</div>` +
    `<div style="flex:1 1 auto;text-align:left;font-family:'${style.fonts.body}', ${FONT_STACK_FALLBACK};` +
    `font-weight:bold;font-size:${bodyPt}pt;color:${hash(style.colours.body)};">${criteriaHtml(text)}</div>` +
    `</div>`
  );
}

// A trailing (non-step) item: label in the panel accent colour, text in body
// colour, both bold. Padding (not margin) so consecutive rows don't collapse
// their spacing, matching bodyLineHtml's convention above.
function modelExampleParagraphHtml(label, text, bodyPt, labelPt, accentColour, style) {
  const beforeMm = mm(240 / 1440);
  const afterMm = mm(120 / 1440);
  const labelHtml = label
    ? `<span style="font-family:'${style.fonts.title}', ${FONT_STACK_FALLBACK};font-weight:bold;` +
      `font-size:${labelPt}pt;color:${hash(accentColour)};">${esc(label)}: </span>`
    : "";
  return (
    `<div style="box-sizing:border-box;padding:${beforeMm}mm 0 ${afterMm}mm 0;text-align:left;">` +
    labelHtml +
    `<span style="font-family:'${style.fonts.body}', ${FONT_STACK_FALLBACK};font-weight:bold;` +
    `font-size:${bodyPt}pt;color:${hash(style.colours.body)};">${markedHtml(text)}</span>` +
    `</div>`
  );
}

function renderWorkedExample(card, style, specDir, ctx = {}) {
  const items = card.items || [];
  // Steps copied from the board keep their colour marks; the fit reads only
  // the words a child sees.
  const fitItems = items.map((item) => ({
    ...item,
    text: typeof item.text === "string" ? plainCriteria(item.text) : item.text,
    kind: isStepLabel(item.label) ? "step" : "trailing",
  }));
  const fillColour = style.colours.workedExamplePanelFill;
  const borderColour = style.colours.workedExamplePanelLine;
  const labelColour = style.colours.workedExampleLabel;

  const titleText = card.title || "How to do it";
  const titlePt = titlePtFor({ ...card, title: titleText }, style);
  const titleBarEl = titleBarHtml(titleText, style.colours.workedExampleTitleBarFill, style, titlePt, card.page.size, card.page.orientation, titleBarOpts());

  const dims = printableInches(card.page.size, card.page.orientation, style);
  const imagePath = optionalCardImagePath(card);
  const emojiVisual = optionalCardEmojiVisual(card);
  const hasSideVisual = Boolean(imagePath || emojiVisual);
  const panelFraction = panelFractionThatFits(panelFractionFor(card, ctx, hasSideVisual), (fraction) =>
    linearBodyFitsAtFloor(
      fitItems.length > 0 ? fitItems : [{ text: "" }],
      minBodyPt(card, style),
      card.page.size,
      card.page.orientation,
      style,
      { widthOverride: dims.width * fraction - 0.6, titleAreaInches: titleBarHeightInches(titlePt), ...stackedBodyOpts(card, fraction, style) }
    ));
  const widthOverride = dims.width * panelFraction - 0.6;
  // A3-only builder: use the fixed A3 value below.
  // The figure is offered the generous share and handed back whatever the
  // panel cannot give up: this probe re-runs the body's own fit at its floor
  // size for a candidate reserve, so no card can be pushed under the text
  // size its steps need in order to print a bigger diagram.
  // A figure stacked under the panel carries its caption beneath it too.
  const caption = stackedCaptionInches(card.visual ? defaultVisualLabel(card.visual) : null, card.page.orientation, style);
  const bodyFitsAtFloor = (reserve) =>
    linearBodyFitsAtFloor(
      fitItems.length > 0 ? fitItems : [{ text: "" }],
      minBodyPt(card, style),
      card.page.size,
      card.page.orientation,
      style,
      { widthOverride, titleAreaInches: titleBarHeightInches(titlePt) + (reserve > 0 ? stackedFigureInches(card, ctx, style, reserve) + caption : 0), ...stackedBodyOpts(card, panelFraction, style) }
    );
  const wideVisualReserve = wideVisualReserveInches(card, ctx, style, bodyFitsAtFloor);
  const titleAreaInches = titleBarHeightInches(titlePt) + (wideVisualReserve > 0 ? stackedFigureInches(card, ctx, style, wideVisualReserve) + caption : 0);
  // The draw uses the number the reserve was made with; the 0.25in is the
  // gap `wideVisualReserveInches` adds above the figure.
  const maxVisualHeightIn = wideVisualReserve > 0 ? wideVisualReserve - 0.25 : undefined;

  const bodyPt = fitLinearBodySize(
    fitItems.length > 0 ? fitItems : [{ text: "" }],
    defaultBodyPt(card, style),
    minBodyPt(card, style),
    card.page.size,
    card.page.orientation,
    style,
    { widthOverride, titleAreaInches, ...stackedBodyOpts(card, panelFraction, style) }
  );
  const accentLabelPt = accentLabelPtFor(bodyPt);
  const fittedBadgeInches = badgeInches(bodyPt);

  // Numeric steps get a green badge row; non-numeric labels (like "Worked
  // example") render after the steps as a labelled paragraph in the panel
  // accent colour, exactly as render-card.js's stepIdx/trailingItems split.
  const stepRowsHtml = [];
  const trailingItemsHtml = [];
  let stepIdx = 0;
  for (const item of items) {
    if (isStepLabel(item.label)) {
      stepIdx += 1;
      const badge = ctx.svgImages ? ctx.svgImages[badgeKey(stepIdx)] : null;
      stepRowsHtml.push(stepBadgeRowHtml(badge, item.text, bodyPt, fittedBadgeInches, style, stepIdx));
    } else {
      trailingItemsHtml.push(modelExampleParagraphHtml(item.label, item.text, bodyPt, accentLabelPt, labelColour, style));
    }
  }
  const panelChildrenHtml = stepRowsHtml.join("") + trailingItemsHtml.join("");

  if (card.visual) {
    const v = pickVisual(card.visual, ctx);
    const visualLabel = defaultVisualLabel(card.visual);
    return (
      titleBarEl +
      panelWithVisualHtml(panelChildrenHtml, v, visualLabel, fillColour, borderColour, style, card.page.size, card.page.orientation, { panelFraction, aspect: v ? v.aspect : 1, maxVisualHeightIn, bodyHeightIn: printableInches(card.page.size, card.page.orientation, style).height - titleBarHeightInches(titlePt) })
    );
  }

  if (emojiVisual) {
    return (
      titleBarEl +
      panelWithVisualHtml(
        panelChildrenHtml,
        emojiVisual,
        null,
        fillColour,
        borderColour,
        style,
        card.page.size,
        card.page.orientation,
        { panelFraction, aspect: emojiVisual.aspect }
      )
    );
  }

  if (imagePath) {
    const photoBuf = tryReadPhoto(specDir, imagePath);
    if (!photoBuf) {
      throw new Error(`Card "${card.title || card.type}" could not read required worked-example photo "${imagePath}".`);
    }
    const aspect = photoAspect(photoBuf) || 1.5;
    return (
      titleBarEl +
      panelWithVisualHtml(
        panelChildrenHtml,
        { buf: photoBuf, aspect, alt: titleText },
        null,
        fillColour,
        borderColour,
        style,
        card.page.size,
        card.page.orientation,
        { panelFraction, aspect }
      )
    );
  }

  return titleBarEl + panelHtml(panelChildrenHtml, fillColour, borderColour, style, card.page.size, card.page.orientation);
}

// ─── Sentence stem: neutral panel, bullet stems with ___ blanks ─────────
// Mirrors helpers.js#stemParagraph: bullet + text, both bold. Filled lines
// (the modelled completion, a worked example of the stem) sit directly
// beneath in the worked-example purple, no bullet, indented to match the
// bullet text above. A taught word marked `{{word}}` is green in either.

function stemParagraphHtml(text, bodyPt, style) {
  const indentMm = mm(360 / 1440);
  const padMm = mm(200 / 1440);
  return (
    `<div style="box-sizing:border-box;padding:${padMm}mm 0;padding-left:${indentMm}mm;text-align:left;` +
    `font-family:'${style.fonts.body}', ${FONT_STACK_FALLBACK};font-weight:bold;font-size:${bodyPt}pt;">` +
    `<span style="color:${hash(style.colours.sentenceStemBullet)};">&bull;&nbsp;&nbsp;&nbsp;</span>` +
    `<span style="color:${hash(style.colours.body)};">${markedHtml(text)}</span>` +
    `</div>`
  );
}

function filledParagraphHtml(text, bodyPt, accentColour, style) {
  const indentMm = mm(1080 / 1440);
  const afterMm = mm(240 / 1440);
  return (
    `<div style="box-sizing:border-box;padding:0 0 ${afterMm}mm 0;padding-left:${indentMm}mm;text-align:left;` +
    `font-family:'${style.fonts.body}', ${FONT_STACK_FALLBACK};font-weight:bold;font-size:${bodyPt}pt;` +
    `color:${hash(accentColour)};">${markedHtml(text)}</div>`
  );
}

function renderSentenceStem(card, style, specDir, ctx = {}) {
  const items = card.items || [];
  const fillColour = style.colours.sentenceStemPanelFill;
  const borderColour = style.colours.sentenceStemPanelLine;

  const titleText = card.title || "How to explain it";
  const titlePt = titlePtFor({ ...card, title: titleText }, style);
  const titleBarEl = titleBarHtml(titleText, style.colours.sentenceStemTitleBarFill, style, titlePt, card.page.size, card.page.orientation, titleBarOpts());

  const dims = printableInches(card.page.size, card.page.orientation, style);
  const stemLines = items.flatMap((item) => (item.filled
    ? [{ text: plainCriteria(item.text), kind: "stem" }, { text: plainCriteria(item.filled), kind: "filled" }]
    : [{ text: plainCriteria(item.text), kind: "stem" }]));
  const panelFraction = panelFractionThatFits(panelFractionFor(card, ctx, false), (fraction) =>
    linearBodyFitsAtFloor(
      stemLines.length > 0 ? stemLines : [{ text: "" }],
      minBodyPt(card, style),
      card.page.size,
      card.page.orientation,
      style,
      { widthOverride: dims.width * fraction - 0.6, titleAreaInches: titleBarHeightInches(titlePt), ...stackedBodyOpts(card, fraction, style) }
    ));
  const widthOverride = dims.width * panelFraction - 0.6;
  // A3-only builder: use the fixed A3 value below.
  // The figure is offered the generous share and handed back whatever the
  // panel cannot give up: this probe re-runs the body's own fit at its floor
  // size for a candidate reserve, so no card can be pushed under the text
  // size its steps need in order to print a bigger diagram.
  // A figure stacked under the panel carries its caption beneath it too.
  const caption = stackedCaptionInches(card.visual ? card.visual.label || null : null, card.page.orientation, style);
  const bodyFitsAtFloor = (reserve) =>
    linearBodyFitsAtFloor(
      stemLines.length > 0 ? stemLines : [{ text: "" }],
      minBodyPt(card, style),
      card.page.size,
      card.page.orientation,
      style,
      { widthOverride, titleAreaInches: titleBarHeightInches(titlePt) + (reserve > 0 ? stackedFigureInches(card, ctx, style, reserve) + caption : 0), ...stackedBodyOpts(card, panelFraction, style) }
    );
  const wideVisualReserve = wideVisualReserveInches(card, ctx, style, bodyFitsAtFloor);
  const titleAreaInches = titleBarHeightInches(titlePt) + (wideVisualReserve > 0 ? stackedFigureInches(card, ctx, style, wideVisualReserve) + caption : 0);
  // The draw uses the number the reserve was made with; the 0.25in is the
  // gap `wideVisualReserveInches` adds above the figure.
  const maxVisualHeightIn = wideVisualReserve > 0 ? wideVisualReserve - 0.25 : undefined;

  // Autofit treats each filled line as an extra body line so the pair sizes
  // down together rather than overflowing the panel. It measures the words a
  // child reads, never the colour marks.
  const bodyPt = fitLinearBodySize(
    stemLines.length > 0 ? stemLines : [{ text: "" }],
    defaultBodyPt(card, style),
    minBodyPt(card, style),
    card.page.size,
    card.page.orientation,
    style,
    { widthOverride, titleAreaInches, ...stackedBodyOpts(card, panelFraction, style) }
  );
  const accent = style.colours.sentenceStemLabel || style.colours.sentenceStemTitleBarFill;

  const panelChildrenHtml = items
    .map((item) => {
      let html = stemParagraphHtml(item.text, bodyPt, style);
      if (item.filled) html += filledParagraphHtml(item.filled, bodyPt, accent, style);
      return html;
    })
    .join("");

  if (card.visual) {
    const v = pickVisual(card.visual, ctx);
    return (
      titleBarEl +
      panelWithVisualHtml(panelChildrenHtml, v, card.visual.label || null, fillColour, borderColour, style, card.page.size, card.page.orientation, { panelFraction, aspect: v ? v.aspect : 1, maxVisualHeightIn, bodyHeightIn: printableInches(card.page.size, card.page.orientation, style).height - titleBarHeightInches(titlePt) })
    );
  }

  return titleBarEl + panelHtml(panelChildrenHtml, fillColour, borderColour, style, card.page.size, card.page.orientation);
}

// ─── Misconception: red panel + green panel side-by-side ────────────────
// "✗ Don't" / "✓ Do" sub-labels inside each panel half.
function panelLabelParagraphHtml(text, pt, colour, style) {
  const afterMm = mm(240 / 1440);
  return (
    `<div style="box-sizing:border-box;padding:0 0 ${afterMm}mm 0;text-align:left;` +
    `font-family:'${style.fonts.title}', ${FONT_STACK_FALLBACK};font-weight:bold;` +
    `font-size:${pt}pt;color:${hash(colour)};">${esc(text)}</div>`
  );
}

// "Don't" sits left in red, "Do" sits right in green so a child's eye lands
// on the corrective side second. Items are matched to a side by label;
// anything else is dropped.
function renderMisconception(card, style, specDir, ctx = {}) {
  const items = card.items || [];

  let dontItem = null;
  let doItem = null;
  for (const item of items) {
    const label = (item.label || "").toLowerCase();
    if (label === "don't" || label === "dont" || label === "wrong") dontItem = item;
    else if (label === "do" || label === "right" || label === "correct") doItem = item;
  }

  const labelPt = panelLabelPt(card, style);

  const titleText = card.title || "Look out for";
  const titlePt = titlePtFor({ ...card, title: titleText }, style);
  const titleBarEl = titleBarHtml(titleText, style.colours.misconceptionTitleBarFill, style, titlePt, card.page.size, card.page.orientation, titleBarOpts());

  const dims = printableInches(card.page.size, card.page.orientation, style);
  // The Don't/Do pair is always a fixed two-up, so each panel takes half the
  // page whatever the card carries - settled by the layout itself, not by
  // the visual, unlike the other panel renderers.
  const panelFraction = 0.5;
  const widthOverride = dims.width * panelFraction - 0.6;
  // The picture under the pair is settled first, because it takes the pair's
  // height: the pair used to be planned as if it had the whole body.
  const beneath = pictureBeneathPair(card, style, specDir, ctx, dims);
  const titleAreaInches = titleBarHeightInches(titlePt) + beneath.heightIn;
  const dontDoLabelPt = labelPt * 0.85;

  // Planned as drawn (layout.js, What the page draws): each of the two cells
  // (shared.js `twoUpPanelsHtml`) holds its label line and its one sentence,
  // side by side, so the pair is as tall as the taller cell.
  const pairItems = [dontItem, doItem].map((item) => ({
    label: item ? item.label : undefined,
    text: item ? plainCriteria(item.text) : "",
  }));
  const bodyPt = fitLinearBodySize(
    pairItems,
    defaultBodyPt(card, style),
    minBodyPt(card, style),
    card.page.size,
    card.page.orientation,
    style,
    {
      widthOverride,
      titleAreaInches,
      ...stackedBodyOpts(card, panelFraction, style),
      page: panelPage(card.page.orientation, style, panelFraction, {
        outerIn: (dims.width - 360 / 1440) / 2,
        paddingDxa: 320,
        pair: true,
        headPt: dontDoLabelPt,
        headPadDxa: 240,
      }),
    }
  );

  const wrongPanelHtml =
    panelLabelParagraphHtml("✗ Don't", dontDoLabelPt, style.colours.misconceptionWrongLabel, style) +
    bodyLineHtml(dontItem ? dontItem.text : "", bodyPt, style);
  const rightPanelHtml =
    panelLabelParagraphHtml("✓ Do", dontDoLabelPt, style.colours.misconceptionRightLabel, style) +
    bodyLineHtml(doItem ? doItem.text : "", bodyPt, style);

  const pairHtml = twoUpPanelsHtml(
    wrongPanelHtml,
    style.colours.misconceptionWrongPanelFill,
    style.colours.misconceptionWrongPanelLine,
    rightPanelHtml,
    style.colours.misconceptionRightPanelFill,
    style.colours.misconceptionRightPanelLine,
    style,
    card.page.size,
    card.page.orientation
  );

  if (beneath.notice) console.log(beneath.notice);
  return titleBarEl + pairHtml + beneath.html;
}

// A misconception card may carry a `visual` (a diagram the Don't/Do advice
// refers to), a straight `photo`, or a card-level P2 `picture`. Any of them
// sits centred beneath the pair, never displacing a panel - the pair is the
// card's spine. P1 photo/diagram still wins over a P2 emoji. Returns the HTML,
// the height it takes under the pair, and the notice when a photo is omitted.
function pictureBeneathPair(card, style, specDir, ctx, dims) {
  const none = { html: "", heightIn: 0, notice: null };
  const imagePath = optionalCardImagePath(card);
  const emojiVisual = optionalCardEmojiVisual(card);
  const photoBuf = imagePath ? tryReadPhoto(specDir, imagePath) : null;
  const v = photoBuf
    ? { buf: photoBuf, aspect: photoAspect(photoBuf) || 1.5 }
    : (pickVisual(card.visual, ctx) || emojiVisual);
  if (v && (v.buf || v.emoji)) {
    const baseIn = Math.min(dims.width * 0.42, 3.2);
    const aspect = v.aspect || 1;
    // This branch intentionally scales the diagram by 72/96 before placement.
    // Preserve the existing 0.75 factor.
    let widthIn = baseIn * (72 / 96);
    let heightIn = widthIn / aspect;
    const maxHeightIn = baseIn * 1.3 * (72 / 96);
    if (heightIn > maxHeightIn) { heightIn = maxHeightIn; widthIn = heightIn * aspect; }

    if (photoBuf) {
      // A photo squeezed under the pair reads at only ~45mm on a full A3 landscape
      // sheet - below the size a wall card needs to be read from across a
      // room. Shown smaller than that would quietly argue against the card's
      // own teaching point, so it is omitted instead and the build says why.
      const MIN_READABLE_IN = 3.2;
      let hIn = dims.height * 0.2;
      let wIn = hIn * aspect;
      const maxWIn = dims.width * 0.62;
      if (wIn > maxWIn) { wIn = maxWIn; hIn = wIn / aspect; }
      if (wIn < MIN_READABLE_IN) {
        return {
          ...none,
          notice:
            `[working-wall] "${card.title || card.type}": photo omitted - only ${wIn.toFixed(1)}in of room is left under the Don't/Do pair, ` +
            `below the ${MIN_READABLE_IN}in a card needs to be read from across a room. Shorten the Don't/Do text to make room for it.`,
        };
      }
      widthIn = wIn;
      heightIn = hIn;
    }

    const topMm = mm(200 / 1440);
    return {
      html: `<div style="text-align:center;padding:${topMm}mm 0 0 0;">${visualTag(v, mm(widthIn), mm(heightIn), "margin:0 auto;")}</div>`,
      heightIn: (topMm + mm(heightIn)) / 25.4,
      notice: null,
    };
  }
  return none;
}

module.exports = { renderStickyKnowledge, renderVocabDefinition, renderWorkedExample, renderSentenceStem, renderMisconception };
