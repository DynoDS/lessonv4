"use strict";

// Display-family card renderers (full-page, no body text): section heading,
// labelledDiagram, mnemonicPoster and banner. Each render<Type>(card, style,
// specDir, ctx) returns either the card's inner HTML (one page) or an ARRAY
// of inner-HTML strings (one per physical page, all using the card's page
// config) - build.js owns the page wrapper either way.

const { fitTitleSize, printableInches, printableDxa } = require("./layout");
const { pickRainbowColour, pickVisual } = require("./visuals");
const { esc, mm, hash, imgTag, titleBarHtml, panelHtml, colouredLetterBoxHtml } = require("./shared");

const FONT_STACK_FALLBACK = "'Segoe Print', cursive";

// Local title-fit wrapper used by this renderer family.
function titlePtFor(card, style) {
  const base = card.page.size === "A3" ? style.sizes.a3TitlePt : style.sizes.a4TitlePt;
  return fitTitleSize(card.title || "", base, card.page.size, card.page.orientation, style);
}

// ─── Section heading: full-page bordered pill, no body, no visual ───────
// Full printable-width white pill with accent border and centred bold heading.
// The pill is the card's only content - it sits at the top of the printable
// area and is not vertically centred.
function renderSectionHeading(card, style) {
  const headingText = (card.heading || "").trim();
  const accent = (card.colour || pickRainbowColour(0, style)).replace(/^#/, "");

  const baseTitlePt = card.page.size === "A3" ? style.sizes.a3TitlePt : style.sizes.a4TitlePt;
  const fittedPt = fitTitleSize(headingText, baseTitlePt, card.page.size, card.page.orientation, style);

  // 600 dxa before-and-after spacing on top of the panel's 720 dxa cell
  // padding, preserving the same total white space around the heading.
  const headingHtml =
    `<div style="text-align:center;margin:${mm(600 / 1440)}mm 0;font-family:'${style.fonts.title}', ${FONT_STACK_FALLBACK};` +
    `font-weight:bold;font-size:${fittedPt}pt;color:${hash(accent)};">${esc(headingText)}</div>`;

  return panelHtml(headingHtml, "FFFFFF", accent, style, card.page.size, card.page.orientation, {
    borderEighths: 48,
    paddingDxa: 720,
  });
}

// ─── Labelled diagram: the anatomy-poster reference card ────────────────
// Anatomy-poster reference card: title bar, annotated composite, optional caption.
// The annotated composite from ctx.svgImages resolved via pickVisual (the callouts
// variant resolves automatically off the visual's own key), contain-fitted into the
// space between the title bar and an optional caption band, vertically centred by
// padding the leftover height above it, optional bold 28pt caption below.
// Single page - no array return.
function renderLabelledDiagram(card, style, specDir, ctx = {}) {
  const titleText = card.title || "How to read it";
  const titlePt = titlePtFor({ ...card, title: titleText }, style);
  const titleBarEl = titleBarHtml(titleText, style.colours.workedExampleTitleBarFill, style, titlePt, card.page.size, card.page.orientation);

  const _v = pickVisual(card.visual, ctx);
  const dims = printableInches(card.page.size, card.page.orientation, style);
  const caption = card.caption || "";
  const hasCaption = caption.length > 0;
  // A3-only builder: use the fixed A3 values below.
  const titleAreaInches = 1.9;
  const captionBand = hasCaption ? 0.9 : 0.2;
  const safetyInches = 0.25;
  const bodyH = Math.max(1, dims.height - titleAreaInches);
  const imageBoxH = Math.max(1, bodyH - captionBand - safetyInches);
  const availW = dims.width;

  if (!(_v && _v.buf)) {
    return titleBarEl;
  }

  const aspect = _v.aspect || 1;
  // Contain-fit into the whole image box, then centre vertically by padding
  // above with whatever height is left over, so the diagram sits in the
  // middle of the card and the caption falls to the bottom. Fill the card at
  // true inch size; no px-per-inch correction factor needed.
  let wIn = availW;
  let hIn = wIn / aspect;
  if (hIn > imageBoxH) { hIn = imageBoxH; wIn = hIn * aspect; }
  const topPadIn = Math.max(0, (imageBoxH - hIn) / 2);

  let html = titleBarEl + `<div style="text-align:center;padding-top:${mm(topPadIn)}mm;">${imgTag(_v.buf, mm(wIn), mm(hIn), "margin:0 auto;")}</div>`;

  if (hasCaption) {
    // topPadTwips + 200 dxa gap below the centred diagram sets the caption
    // apart from the picture while preserving the vertical centre of the
    // diagram in imageBoxH.
    const captionGapIn = topPadIn + 200 / 1440;
    html += `<div style="text-align:center;padding-top:${mm(captionGapIn)}mm;font-weight:bold;font-size:28pt;` +
      `color:${hash(style.colours.body)};font-family:'${style.fonts.body}', ${FONT_STACK_FALLBACK};">${esc(caption)}</div>`;
  }

  return html;
}

// ─── Mnemonic poster: multi-page (RUCSAC-style) ─────────────────────────
// Multi-page mnemonic poster: summary page followed by one page per letter.
// Page 1 is the title bar, an optional subtitle, and one row of every letter
// (small coloured letter box with its phrase beneath). Pages 2..N+1 are one
// per letter: a half-printable-width giant letter box centred, phrase at 96pt
// below. Returns an array of page-inner HTML strings - page 1 plus one per
// letter - so build.js expands this single card into 1 + items.length pages.
function renderMnemonicPoster(card, style, specDir, ctx = {}) {
  const items = (Array.isArray(card.items) ? card.items : []).filter((it) => it && it.letter);
  const titleText = card.title || "Remember";
  const subtitleText = card.subtitle || "";
  const pdxa = printableDxa(card.page.size, card.page.orientation, style);
  const titlePt = titlePtFor({ ...card, title: titleText }, style);
  const titleBarEl = titleBarHtml(titleText, style.colours.mnemonicTitleBarFill, style, titlePt, card.page.size, card.page.orientation);

  if (items.length === 0) {
    return [titleBarEl];
  }

  // A3-only builder: use the fixed A3 values below.
  const summaryLetterPt = 64;
  const summaryPhrasePt = 28;
  const perLetterPt = 320;
  const perPhrasePt = 96;
  const subtitlePt = 56;

  let page1 = titleBarEl;

  if (subtitleText) {
    const beforeAfterMm = mm(400 / 1440);
    page1 += `<div style="text-align:center;padding:${beforeAfterMm}mm 0;font-weight:bold;font-size:${subtitlePt}pt;` +
      `color:${hash(style.colours.body)};font-family:'${style.fonts.body}', ${FONT_STACK_FALLBACK};">${esc(subtitleText)}</div>`;
  }

  const totalDxa = pdxa.width;
  const cellDxa = Math.floor(totalDxa / items.length);

  const cellsHtml = items.map((item, idx) => {
    const colour = (item.colour || pickRainbowColour(idx, style)).replace(/^#/, "");
    const letterBoxHtml = colouredLetterBoxHtml(item.letter, colour, style, summaryLetterPt, {
      paddingDxa: 160,
      widthMm: mm((cellDxa - 160) / 1440),
    });
    const phraseTopMm = mm(200 / 1440);
    const phraseHtml = `<div style="text-align:center;padding-top:${phraseTopMm}mm;font-weight:bold;font-size:${summaryPhrasePt}pt;` +
      `color:${hash(style.colours.body)};font-family:'${style.fonts.body}', ${FONT_STACK_FALLBACK};">${esc(item.phrase || "")}</div>`;
    return `<div style="box-sizing:border-box;width:${mm(cellDxa / 1440)}mm;padding:${mm(120 / 1440)}mm ${mm(80 / 1440)}mm;">${letterBoxHtml}${phraseHtml}</div>`;
  }).join("");

  page1 += `<div style="display:flex;align-items:flex-start;width:100%;">${cellsHtml}</div>`;

  const pages = [page1];

  items.forEach((item, idx) => {
    const colour = (item.colour || pickRainbowColour(idx, style)).replace(/^#/, "");
    const letterBoxHtml = colouredLetterBoxHtml(item.letter, colour, style, perLetterPt, {
      widthMm: mm(pdxa.width / 1440 / 2),
      paddingDxa: 480,
    });
    const phraseTopMm = mm(600 / 1440);
    const phraseHtml = `<div style="text-align:center;padding-top:${phraseTopMm}mm;font-weight:bold;font-size:${perPhrasePt}pt;` +
      `color:${hash(style.colours.body)};font-family:'${style.fonts.body}', ${FONT_STACK_FALLBACK};">${esc(item.phrase || "")}</div>`;
    pages.push(`<div style="text-align:center;">${letterBoxHtml}${phraseHtml}</div>`);
  });

  return pages;
}

// ─── Banner: chunky display-title strip pinned across the top of the wall ─
// One word per page, filled across the printable area in the rainbow palette.
// Each page filled edge-to-edge across the PRINTABLE area (the page's own margin
// stays white) with a saturated rainbow-palette colour cycling by word
// index, the word centred in massive bold white type sized by fitTitleSize
// so a long word shrinks rather than overflows. Returns an array of
// page-inner HTML strings, one per word.
function renderBanner(card, style) {
  const words = Array.isArray(card.words) ? card.words.filter((w) => w && String(w).trim().length > 0) : [];
  if (words.length === 0) {
    return [""];
  }

  const pdxa = printableDxa(card.page.size, card.page.orientation, style);
  // A3-only builder: use the fixed A3 values below.
  const baseBannerPt = 320;

  return words.map((word, idx) => {
    const colour = pickRainbowColour(idx, style);
    const fittedPt = fitTitleSize(String(word), baseBannerPt, card.page.size, card.page.orientation, style);
    return colouredLetterBoxHtml(String(word), colour, style, fittedPt, {
      widthMm: mm(pdxa.width / 1440),
      paddingDxa: 720,
    });
  });
}

module.exports = { renderSectionHeading, renderLabelledDiagram, renderMnemonicPoster, renderBanner };
