"use strict";

// working-wall-html shared primitives: card title bars, panels, panel + visual
// layouts, two-up panels and coloured letter boxes. Every renderer in this
// builder composes cards from these primitives.
//
// Translation rules used everywhere in this builder:
// - all layout is in CSS mm; font sizes are in CSS pt.
// - dxa to mm: dxa / 1440 * 25.4, done by calling mm(dxa / 1440) since
//   dxa / 1440 is already inches.
// - colours from style.json carry no leading '#' - hash() adds it.

const {
  printableInches,
  TITLE_BAR_PADDING_DXA,
  WIDE_ASPECT,
} = require("./layout");

const FONT_STACK_FALLBACK = "'Segoe Print', cursive";

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escAttr(value) {
  return esc(value).replace(/"/g, "&quot;");
}

function mm(inches) {
  return Math.round(inches * 25.4 * 100) / 100;
}

function hash(c) {
  if (!c) return "#000000";
  return c.startsWith("#") ? c : `#${c}`;
}

function pngDataUri(buf) {
  return `data:image/png;base64,${buf.toString("base64")}`;
}

function imgTag(buf, wMm, hMm, extraStyle = "", altText) {
  const alt =
    typeof altText === "string" ? ` alt="${escAttr(altText)}"` : "";
  return `<img src="${pngDataUri(buf)}"${alt} style="display:block;width:${wMm}mm;height:${hMm}mm;${extraStyle}" />`;
}

function visualTag(visual, wMm, hMm, extraStyle = "") {
  if (visual && visual.buf) {
    return imgTag(visual.buf, wMm, hMm, extraStyle, visual.alt);
  }
  if (visual && typeof visual.emoji === "string" && visual.emoji) {
    const alt = typeof visual.alt === "string" ? visual.alt : "";
    const fontMm = Math.round(Math.min(wMm, hMm) * 0.72 * 100) / 100;
    return (
      `<div data-context-picture="emoji" role="img" aria-label="${escAttr(alt)}" ` +
      `style="display:flex;align-items:center;justify-content:center;width:${wMm}mm;height:${hMm}mm;` +
      `font-size:${fontMm}mm;line-height:1;${extraStyle}">${esc(visual.emoji)}</div>`
    );
  }
  return "";
}

// Single-quoted: every caller embeds this inside a double-quoted HTML
// style="..." attribute, where a literal " would terminate it early.
function fontStack(name) {
  return `'${name}', ${FONT_STACK_FALLBACK}`;
}

// ─── Title bar (saturated colour, white text, sits ABOVE the panel) ─────
// Full printable-width div, background fill colour, white bold centred text
// at the fitted pt, padding 240 dxa (4.2mm) all round. size/orientation are
// accepted for interface parity with the other *Html builders below - the bar
// is always full width of whatever printable-width container it renders
// inside, so it never needs the page dimensions itself.
function titleBarHtml(text, fillColour, style, fittedPt, size, orientation, opts = {}) {
  const paddingMm = mm(TITLE_BAR_PADDING_DXA / 1440);
  const textColour = hash(style.colours.titleBarText || "FFFFFF");
  const lineHeight = opts.lineHeight != null ? `line-height:${opts.lineHeight};` : "";
  return (
    `<div style="box-sizing:border-box;width:100%;background:${hash(fillColour)};padding:${paddingMm}mm;">` +
    `<div style="text-align:center;font-family:${fontStack(style.fonts.title)};font-weight:bold;` +
    `font-size:${fittedPt}pt;${lineHeight}color:${textColour};">${esc(text)}</div></div>`
  );
}

// ─── Panel (the "green box") ─────────────────────────────────────────────
// Div with background fill, border weight from style.sizes.panelBorderEighths
// (eighths of a point), padding matching the cell margins (360 dxa default,
// ~6.35mm).
// `wall-panel` centres the panel's own children when the panel is taller than
// they are. A panel that is the card's whole body also carries `wall-body`, so
// it grows to the bottom of the page rather than stopping at its text.
function panelHtml(innerHtml, fillColour, borderColour, style, size, orientation, opts = {}) {
  const borderEighths = opts.borderEighths || style.sizes.panelBorderEighths || 24;
  const borderMm = mm(borderEighths / 8 / 72);
  const paddingDxa = opts.paddingDxa != null ? opts.paddingDxa : 360;
  const paddingMm = mm(paddingDxa / 1440);
  const widthStyle = opts.widthMm != null ? `width:${opts.widthMm}mm;` : "width:100%;";
  const classes = opts.widthMm != null ? "wall-panel" : "wall-body wall-panel";
  return (
    `<div class="${classes}" style="box-sizing:border-box;${widthStyle}background:${hash(fillColour)};` +
    `border:${borderMm}mm solid ${hash(borderColour)};padding:${paddingMm}mm;">${innerHtml}</div>`
  );
}

// ─── Panel + visual (side-by-side / stacked / dominant) ──────────────────
// Three layouts, chosen by
// opts.panelFraction: side-by-side (fraction < 1 - panel left at `fraction`
// of printable width, visual right, vertically centred, optional bold
// caption under the visual), stacked (fraction is 1.0 and a visual is
// present at or above WIDE_ASPECT: full-width panel with the wide visual
// centred beneath at wideVisualReserveInches height), and dominant
// (fraction 0.32 - the same side-by-side arithmetic with a small panel
// column, not a separate branch, matching panelWithVisual itself).
//
// `visual` is a { buf, aspect, alt } image, a { emoji, aspect, alt } context
// picture, or null.
function panelWithVisualHtml(innerHtml, visual, visualLabel, fillColour, borderColour, style, size, orientation, opts = {}) {
  const dims = printableInches(size, orientation, style);
  const spacerMm = mm(0.2);
  const panelFraction = opts.panelFraction || 0.6;
  const aspect = (visual && visual.aspect) || opts.aspect || 1;
  const paddingDxa = opts.paddingDxa || 360;
  const paddingMm = mm(paddingDxa / 1440);
  const captionHtml = (text) =>
    `<div style="text-align:center;font-weight:bold;font-size:28pt;color:${hash(style.colours.body)};font-family:${fontStack(style.fonts.body)};">${esc(text)}</div>`;

  // Stacked: a wide diagram becomes a thumbnail beside a narrow panel, so it
  // is placed full-width beneath a full-width panel instead.
  if (panelFraction >= 0.99 && aspect >= WIDE_ASPECT) {
    const panelEl = panelHtml(innerHtml, fillColour, borderColour, style, size, orientation, { widthMm: mm(dims.width), paddingDxa });
    let visualHtml = "";
    if (visual && (visual.buf || visual.emoji)) {
      const visualWidthIn = Math.max(1, dims.width - (2 * paddingDxa) / 1440) * 0.96;
      let visualHeightIn = visualWidthIn / aspect;
      // The reserve the card already subtracted from its text area, passed in
      // so the space set aside for the figure is the space it is drawn at.
      // These two drifting apart is how a card reserves room a figure never
      // uses. Falls back to the guaranteed share for a caller that reserved
      // nothing.
      const maxVisualHeightIn = opts.maxVisualHeightIn || dims.height * 0.21;
      let fittedVisualWidthIn = visualWidthIn;
      if (visualHeightIn > maxVisualHeightIn) {
        visualHeightIn = maxVisualHeightIn;
        fittedVisualWidthIn = visualHeightIn * aspect;
      }
      visualHtml =
        `<div style="text-align:center;margin-top:${mm(160 / 1440)}mm;">` +
        visualTag(visual, mm(fittedVisualWidthIn), mm(visualHeightIn), "margin:0 auto;") +
        `</div>`;
    }
    const labelHtml = visualLabel ? `<div style="margin-top:${mm(90 / 1440)}mm;">${captionHtml(visualLabel)}</div>` : "";
    return (
      `<div class="wall-body" style="display:flex;flex-direction:column;">` +
      panelEl + visualHtml + labelHtml +
      `</div>`
    );
  }

  // Side-by-side (and dominant, which is the same arithmetic with a small
  // panelFraction): panel column left, visual column right.
  const panelWidthMm = mm(dims.width * panelFraction);
  const spacerAndVisualIn = dims.width - dims.width * panelFraction - 0.2;
  const visualWidthIn = spacerAndVisualIn;
  let effectiveVisualWidthIn = visualWidthIn * 0.94;
  let effectiveVisualHeightIn = effectiveVisualWidthIn / aspect;
  const maxHeightIn = visualWidthIn * 1.5 * 0.94;
  if (effectiveVisualHeightIn > maxHeightIn) {
    effectiveVisualHeightIn = maxHeightIn;
    effectiveVisualWidthIn = effectiveVisualHeightIn * aspect;
  }

  const panelEl = panelHtml(innerHtml, fillColour, borderColour, style, size, orientation, { widthMm: panelWidthMm, paddingDxa });

  let visualInner = `<div></div>`;
  if (visual && (visual.buf || visual.emoji)) {
    visualInner = visualTag(
      visual,
      mm(effectiveVisualWidthIn),
      mm(effectiveVisualHeightIn),
      "margin:0 auto;"
    );
  }
  const labelHtml = visualLabel ? captionHtml(visualLabel) : "";

  return (
    `<div class="wall-body" style="display:flex;align-items:stretch;width:100%;">` +
    `<div style="width:${panelWidthMm}mm;flex:none;display:flex;">${panelEl}</div>` +
    `<div style="width:${spacerMm}mm;flex:none;"></div>` +
    `<div style="width:${mm(visualWidthIn)}mm;flex:none;align-self:center;box-sizing:border-box;padding:${paddingMm}mm 0;text-align:center;">${visualInner}${labelHtml}</div>` +
    `</div>`
  );
}

// ─── Two-up panels (misconception "Don't" | "Do") ────────────────────────
// Two independently-coloured panels side by side with a thin spacer.
// Used only by the misconception card.
function twoUpPanelsHtml(leftInnerHtml, leftFill, leftBorder, rightInnerHtml, rightFill, rightBorder, style, size, orientation, opts = {}) {
  const dims = printableInches(size, orientation, style);
  const spacerDxa = opts.spacerDxa != null ? opts.spacerDxa : 360;
  const spacerMm = mm(spacerDxa / 1440);
  const halfIn = (dims.width - spacerDxa / 1440) / 2;
  const halfMm = mm(halfIn);
  const borderEighths = opts.borderEighths || style.sizes.panelBorderEighths || 24;
  const borderMm = mm(borderEighths / 8 / 72);
  const paddingDxa = opts.paddingDxa != null ? opts.paddingDxa : 320;
  const paddingMm = mm(paddingDxa / 1440);
  const cell = (innerHtml, fill, border) =>
    `<div style="box-sizing:border-box;width:${halfMm}mm;background:${hash(fill)};` +
    `border:${borderMm}mm solid ${hash(border)};padding:${paddingMm}mm;">${innerHtml}</div>`;
  return (
    `<div class="wall-body" style="display:flex;align-items:stretch;width:100%;">` +
    cell(leftInnerHtml, leftFill, leftBorder) +
    `<div style="width:${spacerMm}mm;flex:none;"></div>` +
    cell(rightInnerHtml, rightFill, rightBorder) +
    `</div>`
  );
}

// ─── Coloured letter box (saturated cell with a single white letter) ────
// Saturated cell with a single white letter.
function colouredLetterBoxHtml(text, fillColour, style, letterPt, opts = {}) {
  const paddingDxa = opts.paddingDxa != null ? opts.paddingDxa : 240;
  const paddingMm = mm(paddingDxa / 1440);
  const widthStyle = opts.widthMm != null ? `width:${opts.widthMm}mm;` : (opts.widthPct != null ? `width:${opts.widthPct}%;` : "width:100%;");
  const marginStyle = opts.align === "left" ? "" : "margin:0 auto;";
  const textColour = hash(style.colours.titleBarText || "FFFFFF");
  return (
    `<div style="box-sizing:border-box;${widthStyle}${marginStyle}background:${hash(fillColour)};padding:${paddingMm}mm;">` +
    `<div style="text-align:center;font-family:${fontStack(style.fonts.title)};font-weight:bold;` +
    `font-size:${letterPt}pt;color:${textColour};">${esc(String(text || ""))}</div></div>`
  );
}

const PAGE_CSS = `
@page a3portrait { size: A3 portrait; margin: 0; }
@page a3landscape { size: A3 landscape; margin: 0; }
html, body { margin: 0; padding: 0; }
body { font-family: "Comic Sans MS", "Segoe Print", cursive; }
.page {
  box-sizing: border-box;
  overflow: hidden;
  page-break-after: always;
  position: relative;
}
.page-core {
  box-sizing: border-box;
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
/* A card used to be laid out at the height of its own text and left whatever
   the page had spare as a blank white band across the bottom - about a fifth
   of an A3 sheet on a four-step worked example, room the panel and the
   photograph could both have used. The title bar keeps its natural height;
   the card's body takes the rest of the page. */
.page-core > * { flex: 0 0 auto; }
.page-core > .wall-body { flex: 1 1 auto; min-height: 0; }
.wall-body > .wall-panel { flex: 1 1 auto; min-height: 0; }
/* A panel taller than its own content centres that content rather than
   pinning it to the top and reopening the same band inside the panel. */
.wall-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.decoration-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.decoration-layer--low { z-index: 0; }
.decoration-layer--high { z-index: 2; }
.decoration {
  position: absolute;
  display: block;
  object-fit: contain;
  transform-origin: center center;
}
.page.portrait { page: a3portrait; width: 297mm; height: 420mm; }
.page.landscape { page: a3landscape; width: 420mm; height: 297mm; }
`;

module.exports = {
  esc,
  mm,
  hash,
  pngDataUri,
  imgTag,
  visualTag,
  titleBarHtml,
  panelHtml,
  panelWithVisualHtml,
  twoUpPanelsHtml,
  colouredLetterBoxHtml,
  PAGE_CSS,
};
