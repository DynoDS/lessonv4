"use strict";

// Panel family renderers: sticky knowledge, vocab definition, worked example,
// sentence stem and misconception.

const {
  printableInches,
  fitLinearBodySize,
  fitTitleSize,
  tryReadPhoto,
  photoAspect,
} = require("./layout");
const {
  panelFractionFor,
  wideVisualReserveInches,
  pickVisual,
  defaultVisualLabel,
  stackedBodyOpts,
  defaultBodyPt,
  minBodyPt,
  panelLabelPt,
  badgeInches,
} = require("./visuals");
const { badgeKey } = require("./svg-renderer");
const { esc, mm, hash, imgTag, visualTag, titleBarHtml, panelHtml, panelWithVisualHtml, twoUpPanelsHtml } = require("./shared");

const FONT_STACK_FALLBACK = "'Segoe Print', cursive";

// Local title-fit wrapper used by this renderer family.
function titlePtFor(card, style) {
  const base = card.page.size === "A3" ? style.sizes.a3TitlePt : style.sizes.a4TitlePt;
  return fitTitleSize(card.title || "", base, card.page.size, card.page.orientation, style);
}

// One centred bold line per body item. Use padding rather than margins so
// consecutive line spacing does not collapse.
function bodyLineHtml(text, pt, style) {
  const padMm = mm(200 / 1440);
  return (
    `<div style="box-sizing:border-box;padding:${padMm}mm 0;text-align:center;` +
    `font-family:'${style.fonts.body}', ${FONT_STACK_FALLBACK};font-weight:bold;` +
    `font-size:${pt}pt;color:${hash(style.colours.body)};">${esc(text)}</div>`
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

// ─── Sticky knowledge: blue panel, big bold body ────────────────────────

function renderStickyKnowledge(card, style, specDir, ctx = {}) {
  const items = card.items || [];
  const fillColour = style.colours.stickyPanelFill;
  const borderColour = style.colours.stickyPanelLine;

  const titleText = card.title || "Remember";
  const titlePt = titlePtFor({ ...card, title: titleText }, style);
  const titleBarEl = titleBarHtml(titleText, style.colours.stickyTitleBarFill, style, titlePt, card.page.size, card.page.orientation);

  const dims = printableInches(card.page.size, card.page.orientation, style);
  const imagePath = optionalCardImagePath(card);
  const emojiVisual = optionalCardEmojiVisual(card);
  const hasVisual = !!(card.visual || imagePath || emojiVisual);
  const panelFraction = panelFractionFor(card, ctx, hasVisual && !card.visual);
  const widthOverride = dims.width * panelFraction - 0.6;
  // A3-only builder: use the fixed A3 value below.
  const titleAreaInches = 1.6 + wideVisualReserveInches(card, ctx, style);

  const bodyPt = fitLinearBodySize(
    items.length > 0 ? items : [{ text: "" }],
    defaultBodyPt(card, style),
    minBodyPt(card, style),
    card.page.size,
    card.page.orientation,
    style,
    { widthOverride, titleAreaInches, ...stackedBodyOpts(card, panelFraction) }
  );

  const panelChildrenHtml = items.map((item) => bodyLineHtml(item.text, bodyPt, style)).join("");

  if (card.visual) {
    const v = pickVisual(card.visual, ctx);
    const visualLabel = defaultVisualLabel(card.visual);
    return (
      titleBarEl +
      panelWithVisualHtml(panelChildrenHtml, v, visualLabel, fillColour, borderColour, style, card.page.size, card.page.orientation, { panelFraction, aspect: v ? v.aspect : 1 })
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
  const titleBarEl = titleBarHtml(titleText, style.colours.vocabDefinitionTitleBarFill, style, titlePt, card.page.size, card.page.orientation);

  const fillColour = style.colours.vocabDefinitionPanelFill;
  const borderColour = style.colours.vocabDefinitionPanelLine;

  const dims = printableInches(card.page.size, card.page.orientation, style);
  const hasVisual = !!card.visual;
  const panelFraction = panelFractionFor(card, ctx, hasVisual && !card.visual);
  const widthOverride = dims.width * panelFraction - 0.6;
  const titleAreaInches = 1.6 + wideVisualReserveInches(card, ctx, style);

  const items = definition ? [{ text: definition }] : [{ text: "" }];
  const bodyPt = fitLinearBodySize(
    items,
    defaultBodyPt(card, style),
    minBodyPt(card, style),
    card.page.size,
    card.page.orientation,
    style,
    { widthOverride, titleAreaInches, ...stackedBodyOpts(card, panelFraction) }
  );

  const panelChildrenHtml = bodyLineHtml(definition, bodyPt, style);

  if (hasVisual) {
    const v = pickVisual(card.visual, ctx);
    const visualLabel = defaultVisualLabel(card.visual);
    return (
      titleBarEl +
      panelWithVisualHtml(panelChildrenHtml, v, visualLabel, fillColour, borderColour, style, card.page.size, card.page.orientation, { panelFraction, aspect: v ? v.aspect : 1 })
    );
  }

  return titleBarEl + panelHtml(panelChildrenHtml, fillColour, borderColour, style, card.page.size, card.page.orientation);
}

// ─── Worked example: green panel + green numbered badges ────────────────
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
    `font-weight:bold;font-size:${bodyPt}pt;color:${hash(style.colours.body)};">${esc(text)}</div>` +
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
    `font-size:${bodyPt}pt;color:${hash(style.colours.body)};">${esc(text)}</span>` +
    `</div>`
  );
}

function renderWorkedExample(card, style, specDir, ctx = {}) {
  const items = card.items || [];
  const fillColour = style.colours.workedExamplePanelFill;
  const borderColour = style.colours.workedExamplePanelLine;
  const labelColour = style.colours.workedExampleLabel;

  const titleText = card.title || "How to do it";
  const titlePt = titlePtFor({ ...card, title: titleText }, style);
  const titleBarEl = titleBarHtml(titleText, style.colours.workedExampleTitleBarFill, style, titlePt, card.page.size, card.page.orientation);

  const dims = printableInches(card.page.size, card.page.orientation, style);
  const imagePath = optionalCardImagePath(card);
  const emojiVisual = optionalCardEmojiVisual(card);
  const hasSideVisual = Boolean(imagePath || emojiVisual);
  const panelFraction = panelFractionFor(card, ctx, hasSideVisual);
  const widthOverride = dims.width * panelFraction - 0.6;
  // A3-only builder: use the fixed A3 value below.
  const titleAreaInches = 1.8 + wideVisualReserveInches(card, ctx, style);

  const bodyPt = fitLinearBodySize(
    items.length > 0 ? items : [{ text: "" }],
    defaultBodyPt(card, style),
    minBodyPt(card, style),
    card.page.size,
    card.page.orientation,
    style,
    { widthOverride, titleAreaInches, ...stackedBodyOpts(card, panelFraction) }
  );
  const accentLabelPt = Math.max(28, Math.round(bodyPt * 0.7));
  const fittedBadgeInches = badgeInches(bodyPt);

  // Numeric steps get a green badge row; non-numeric labels (like "Worked
  // example") render after the steps as a labelled paragraph in the panel
  // accent colour, exactly as render-card.js's stepIdx/trailingItems split.
  const stepRowsHtml = [];
  const trailingItemsHtml = [];
  let stepIdx = 0;
  for (const item of items) {
    const label = (item.label || "").toLowerCase();
    const isStep = label.startsWith("step") || /^\d+\b/.test(label);
    if (isStep) {
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
      panelWithVisualHtml(panelChildrenHtml, v, visualLabel, fillColour, borderColour, style, card.page.size, card.page.orientation, { panelFraction, aspect: v ? v.aspect : 1 })
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

// ─── Sentence stem: green panel, bullet stems with ___ blanks ───────────
// Mirrors helpers.js#stemParagraph: bullet + text, both bold, the bullet
// itself in the panel accent colour. Filled lines (the modelled completion)
// sit directly beneath in accent colour, no bullet, indented to match the
// bullet text above.

function stemParagraphHtml(text, bodyPt, style) {
  const indentMm = mm(360 / 1440);
  const padMm = mm(200 / 1440);
  return (
    `<div style="box-sizing:border-box;padding:${padMm}mm 0;padding-left:${indentMm}mm;text-align:left;` +
    `font-family:'${style.fonts.body}', ${FONT_STACK_FALLBACK};font-weight:bold;font-size:${bodyPt}pt;">` +
    `<span style="color:${hash(style.colours.sentenceStemBullet)};">&bull;&nbsp;&nbsp;&nbsp;</span>` +
    `<span style="color:${hash(style.colours.body)};">${esc(text)}</span>` +
    `</div>`
  );
}

function filledParagraphHtml(text, bodyPt, accentColour, style) {
  const indentMm = mm(1080 / 1440);
  const afterMm = mm(240 / 1440);
  return (
    `<div style="box-sizing:border-box;padding:0 0 ${afterMm}mm 0;padding-left:${indentMm}mm;text-align:left;` +
    `font-family:'${style.fonts.body}', ${FONT_STACK_FALLBACK};font-weight:bold;font-size:${bodyPt}pt;` +
    `color:${hash(accentColour)};">${esc(text)}</div>`
  );
}

function renderSentenceStem(card, style, specDir, ctx = {}) {
  const items = card.items || [];
  const fillColour = style.colours.sentenceStemPanelFill;
  const borderColour = style.colours.sentenceStemPanelLine;

  const titleText = card.title || "How to explain it";
  const titlePt = titlePtFor({ ...card, title: titleText }, style);
  const titleBarEl = titleBarHtml(titleText, style.colours.sentenceStemTitleBarFill, style, titlePt, card.page.size, card.page.orientation);

  const dims = printableInches(card.page.size, card.page.orientation, style);
  const panelFraction = panelFractionFor(card, ctx, false);
  const widthOverride = dims.width * panelFraction - 0.6;
  // A3-only builder: use the fixed A3 value below.
  const titleAreaInches = 1.6 + wideVisualReserveInches(card, ctx, style);

  // Autofit treats each filled line as an extra body line so the pair sizes
  // down together rather than overflowing the panel.
  const fitItems = [];
  for (const item of items) {
    fitItems.push({ text: item.text });
    if (item.filled) fitItems.push({ text: item.filled });
  }
  const bodyPt = fitLinearBodySize(
    fitItems.length > 0 ? fitItems : [{ text: "" }],
    defaultBodyPt(card, style),
    minBodyPt(card, style),
    card.page.size,
    card.page.orientation,
    style,
    { widthOverride, titleAreaInches, ...stackedBodyOpts(card, panelFraction) }
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
      panelWithVisualHtml(panelChildrenHtml, v, card.visual.label || null, fillColour, borderColour, style, card.page.size, card.page.orientation, { panelFraction, aspect: v ? v.aspect : 1 })
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
  const titleBarEl = titleBarHtml(titleText, style.colours.misconceptionTitleBarFill, style, titlePt, card.page.size, card.page.orientation);

  const dims = printableInches(card.page.size, card.page.orientation, style);
  // The Don't/Do pair is always a fixed two-up, so each panel takes half the
  // page whatever the card carries - settled by the layout itself, not by
  // the visual, unlike the other panel renderers.
  const panelFraction = 0.5;
  const widthOverride = dims.width * panelFraction - 0.6;
  // A3-only builder: use the fixed A3 value below.
  const titleAreaInches = 1.6;

  const fitItems = items.length > 0 ? items : [{ text: "" }];
  const bodyPt = fitLinearBodySize(
    fitItems,
    defaultBodyPt(card, style),
    minBodyPt(card, style),
    card.page.size,
    card.page.orientation,
    style,
    { widthOverride, titleAreaInches, ...stackedBodyOpts(card, panelFraction) }
  );

  const dontDoLabelPt = labelPt * 0.85;
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

  let html = titleBarEl + pairHtml;

  // A misconception card may carry a `visual` (a diagram the Don't/Do advice
  // refers to), a straight `photo`, or a card-level P2 `picture`. Any of them
  // sits centred beneath the pair, never displacing a panel - the pair is the
  // card's spine. P1 photo/diagram still wins over a P2 emoji.
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
        console.log(
          `[working-wall] "${card.title || card.type}": photo omitted - only ${wIn.toFixed(1)}in of room is left under the Don't/Do pair, ` +
          `below the ${MIN_READABLE_IN}in a card needs to be read from across a room. Shorten the Don't/Do text to make room for it.`
        );
        return html;
      }
      widthIn = wIn;
      heightIn = hIn;
    }

    const topMm = mm(200 / 1440);
    html += `<div style="text-align:center;padding:${topMm}mm 0 0 0;">${visualTag(v, mm(widthIn), mm(heightIn), "margin:0 auto;")}</div>`;
  }

  return html;
}

module.exports = { renderStickyKnowledge, renderVocabDefinition, renderWorkedExample, renderSentenceStem, renderMisconception };
