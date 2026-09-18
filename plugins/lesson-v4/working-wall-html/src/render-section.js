"use strict";

// diagramSection: one wall section built from two to four drawn parts.
//
// Why this family exists. Every other family that lays several pieces out on
// one sheet - photoMapOverview, heroCallouts, causeCards - requires a
// photograph, so a lesson whose pictures are drawings (a number line, a
// place-value chart, a bar model) could only ever have one panel of words with
// one figure beside it. Across 45 built lessons that produced 56 sheets, of
// which the teacher put up two, and both were heroCallouts. The maths wall he
// asked for is three sections, each holding two or three small diagrams with
// their own headings and a line or two of numbers underneath: the shape this
// family draws.
//
// The rule the layout enforces is the one that separates the sections he keeps
// from the sheets he bins: the drawing is the main thing on each part and the
// words sit around it. The text block is capped at a share of the part's
// height and the figure takes the rest, rather than the text growing to fill
// the page and the figure getting whatever is left.

const {
  printableInches,
  fitTitleSize,
  titleBarHeightInches,
  fitLinearBodySize,
} = require("./layout");
const { esc, mm, hash, imgTag, titleBarHtml } = require("./shared");
const { pickVisual } = require("./visuals");

const FONT_STACK_FALLBACK = "'Segoe Print', cursive";

// One theme per part, so a section reads as two or three distinct things at a
// glance rather than one grey wall of boxes. Same hues the other families
// already use, so a section does not look like a different product.
const PART_THEMES = [
  { strip: "1F4E79", fill: "F2F7FB", accent: "1F4E79" },
  { strip: "0D9488", fill: "F0FDFA", accent: "0D9488" },
  { strip: "D97706", fill: "FEF6E7", accent: "B45309" },
  { strip: "00B050", fill: "F1FBF4", accent: "00873E" },
];

// A part heading starts here and shrinks to the same 36pt floor the notes
// use, never past it: a heading nobody can read from a desk names nothing.
const HEADING_PT = 44;
const HEADING_MIN_PT = 36;
// The ceiling the note fitter starts from, not the size notes come out at. It
// is deliberately far above anything a note will use, because the fitter only
// searches downward: a low ceiling is how the first draft of this family put
// three lines of 28pt at the top of a half-empty A3 panel. The cap that keeps
// the figure dominant is TEXT_SHARE_WITH_FIGURE below, not this number.
const NOTE_PT = 44;
// The wall's own readable floor (style.sizes.a3BodyMinPt). A note set smaller
// than this is not a wall note, it is small print on a large sheet, and the
// rest of the builder has refused to go below it since the September review.
// A part whose words will not fit at 36pt is a part with too many words: the
// fitter names it and the build stops, which is the answer that reaches the
// designer.
const NOTE_MIN_PT = 36;

// The most of a part's height the words may take, so the figure always keeps
// at least the remaining 40% of its own part.
//
// What stops a section turning back into a sheet of words is not this number
// on its own. It is three things together: a section must draw something or
// the build refuses it, every figure keeps at least 40% of its part, and a
// note may not print below the 36pt floor above, so notes cannot multiply
// quietly at smaller and smaller sizes. Held at half, a part could not carry
// two short lines and a result at a readable size on a two-part landscape
// sheet, and refusing that is the wrong answer: the figure is wide, so the
// height the words take comes off its height and not off its presence.
const TEXT_SHARE_WITH_FIGURE = 0.6;

// A result prints on its own strip, so it costs its line plus the strip's
// margin and padding. Left out of the reserve, the strip drew past the bottom
// of its own part and sat over the panel border.
const RESULT_EXTRA_IN = 0.17;

const GAP_IN = 0.22;
const PART_PAD_IN = 0.18;
const SAFETY_IN = 0.3;

function partLabel(card, index) {
  const title = typeof card.title === "string" ? card.title.trim() : "";
  return `diagramSection ${title ? `"${title}" ` : ""}part ${index + 1}`;
}

// Rows and columns for this many parts, decided by the shape of the drawings
// rather than by the page.
//
// The figures this family exists for are mostly wide: a number line measures
// about six to one, a place-value chart about four to one. Side by side in
// half a sheet, a number line comes off an A3 page under 50mm tall, which is
// the "reads as an afterthought" fault this family was built to end. Given the
// full width of the sheet the same line is nearly four times longer and a
// child can read it from a desk. So wide figures stack as full-width strips
// and only compact ones sit in columns.
//
// Four parts stay two-by-two whatever their shape; four full-width strips are
// each too shallow to hold a drawing and its numbers.
const STACK_ASPECT = 2;

function gridFor(count, orientation, aspects = []) {
  if (count === 4) return { cols: 2, rows: 2 };
  const widest = aspects.reduce((max, aspect) => Math.max(max, aspect || 0), 0);
  if (widest >= STACK_ASPECT) return { cols: 1, rows: count };
  if (orientation === "landscape") return { cols: count, rows: 1 };
  return { cols: 1, rows: count };
}

// The lines of words under one part's figure, in reading order, as the fitter
// wants them: notes as plain lines, steps carrying their number as a label.
function textItemsFor(part) {
  const items = [];
  for (const note of part.notes || []) {
    const text = typeof note === "string" ? note.trim() : "";
    if (text) items.push({ kind: "note", text });
  }
  (part.steps || []).forEach((step, index) => {
    const text = typeof step === "string" ? step.trim() : "";
    if (text) items.push({ kind: "step", label: String(index + 1), text });
  });
  const result = typeof part.result === "string" ? part.result.trim() : "";
  if (result) items.push({ kind: "result", text: result });
  return items;
}

function headingHtml(part, theme, widthIn) {
  const pt = fitHeadingPt(part.heading || "", widthIn);
  return (
    `<div data-part="heading" style="box-sizing:border-box;width:100%;background:${hash(theme.strip)};` +
    `padding:${mm(0.06)}mm ${mm(0.08)}mm;margin-bottom:${mm(0.08)}mm;">` +
    `<div style="text-align:center;font-family:'${"Comic Sans MS"}', ${FONT_STACK_FALLBACK};` +
    `font-weight:bold;font-size:${pt}pt;line-height:1.15;color:#FFFFFF;">${esc(part.heading || "")}</div></div>`
  );
}

// A heading is one strip across its own column, so it shrinks to fit its
// column rather than wrapping into three lines and eating the figure's room.
function fitHeadingPt(text, widthIn) {
  let pt = HEADING_PT;
  while (pt > HEADING_MIN_PT) {
    const lines = Math.ceil((text.length * pt * 0.55) / 72 / Math.max(0.5, widthIn - 0.2));
    if (lines <= 2) return pt;
    pt -= 2;
  }
  return HEADING_MIN_PT;
}

// The figure at its natural shape, never stretched into the height it was
// allowed. Reserving the full allowance and centring inside it put an inch of
// nothing above and below a wide number line; whatever the drawing does not
// need goes back to the part, which centres its whole block instead.
function figureSize(visual, maxWIn, maxHIn) {
  if (!visual || !visual.buf || maxHIn <= 0.2) return null;
  const aspect = visual.aspect || 1;
  let wIn = maxWIn;
  let hIn = wIn / aspect;
  if (hIn > maxHIn) {
    hIn = maxHIn;
    wIn = hIn * aspect;
  }
  return { wIn, hIn };
}

function figureHtml(visual, size) {
  if (!size) return "";
  return (
    `<div style="display:flex;justify-content:center;padding:${mm(0.08)}mm 0;">` +
    imgTag(visual.buf, mm(size.wIn), mm(size.hIn), "margin:0 auto;", visual.alt) +
    `</div>`
  );
}

function textBlockHtml(items, pt, theme) {
  if (!items.length) return "";
  const font = `font-family:'Comic Sans MS', ${FONT_STACK_FALLBACK};font-size:${pt}pt;line-height:1.3;`;
  const rows = items.map((item) => {
    if (item.kind === "step") {
      return (
        `<div data-part="step" style="display:flex;align-items:baseline;gap:${mm(0.06)}mm;padding:${mm(0.02)}mm 0;">` +
        `<div style="${font}font-weight:bold;color:${hash(theme.accent)};">${esc(item.label)}.</div>` +
        `<div style="flex:1;${font}color:#000000;">${esc(item.text)}</div></div>`
      );
    }
    if (item.kind === "result") {
      // The answer the part works out, marked the way the teacher's own wall
      // marks it: its own coloured strip, so a child finds the result without
      // reading the workings first.
      return (
        `<div data-part="result" style="margin-top:${mm(0.07)}mm;background:${hash(theme.strip)};padding:${mm(0.05)}mm ${mm(0.08)}mm;">` +
        `<div style="text-align:center;${font}font-weight:bold;color:#FFFFFF;">${esc(item.text)}</div></div>`
      );
    }
    return `<div data-part="note" style="text-align:center;${font}color:#000000;padding:${mm(0.02)}mm 0;">${esc(item.text)}</div>`;
  });
  return rows.join("");
}

function renderDiagramSection(card, style, specDir, ctx) {
  const parts = Array.isArray(card.parts) ? card.parts : [];
  if (parts.length < 2 || parts.length > 4) {
    throw new Error(
      `Card "${card.title || card.type}" is a diagramSection and needs 2-4 parts; it has ${parts.length}. ` +
      `One part on its own is a workedExample or stickyKnowledge card, not a section.`
    );
  }
  parts.forEach((part, index) => {
    if (!part || !String(part.heading || "").trim()) {
      throw new Error(`${partLabel(card, index)} has no heading; every part of a section names what it shows.`);
    }
  });

  const figures = parts.map((part) => (part.visual ? pickVisual(part.visual, ctx) : null));
  if (!figures.some((figure) => figure && figure.buf)) {
    throw new Error(
      `Card "${card.title || card.type}" is a diagramSection whose parts draw nothing. ` +
      `A section exists to put two or three figures on one sheet; a sheet of words belongs in another family or off the wall.`
    );
  }
  parts.forEach((part, index) => {
    if (part.visual && !(figures[index] && figures[index].buf)) {
      throw new Error(
        `${partLabel(card, index)} names a ${part.visual.type || "visual"} the builder could not draw. ` +
        `A part that promised a figure and shipped words fails the glance-from-a-desk test.`
      );
    }
  });

  const orientation = card.page.orientation === "portrait" ? "portrait" : "landscape";
  const dims = printableInches(card.page.size, orientation, style);
  const titlePt = fitTitleSize(card.title || "", style.sizes.a3TitlePt, card.page.size, orientation, style);
  const titleHtml = titleBarHtml(
    card.title || "On the wall",
    style.colours.referenceTableHeaderFill,
    style,
    titlePt,
    card.page.size,
    orientation
  );

  const { cols, rows } = gridFor(
    parts.length,
    orientation,
    figures.map((figure) => (figure ? figure.aspect || 1 : 0))
  );
  const bodyHeight = dims.height - titleBarHeightInches(titlePt) - SAFETY_IN;
  const rowHeight = (bodyHeight - GAP_IN * (rows - 1)) / rows;
  const colWidth = (dims.width - GAP_IN * (cols - 1)) / cols;
  const innerWidth = colWidth - 2 * PART_PAD_IN;

  // Measure every part first, then draw them all at one shared note size.
  // Fitting each part on its own gave a sheet whose left column ran at 24pt
  // and whose right column ran at 44pt, because one part happened to carry
  // three lines and its neighbour carried one. On a single sheet that reads
  // as a mistake; the smallest size any part needs is the size they all use.
  const measured = parts.map((part, index) => {
    const figure = figures[index];
    const items = textItemsFor(part);
    const headingIn = fitHeadingPt(part.heading, innerWidth) * 1.15 / 72 + 0.14;
    const available = rowHeight - 2 * PART_PAD_IN - headingIn;
    // The figure is the part. Words get a capped share and the drawing keeps
    // the rest, so a long note can never push the diagram down to a strip.
    const resultExtra = items.filter((item) => item.kind === "result").length * RESULT_EXTRA_IN;
    const textCeiling =
      (figure && figure.buf ? available * TEXT_SHARE_WITH_FIGURE : available) - resultExtra;
    const notePt = items.length
      ? fitLinearBodySize(items, NOTE_PT, NOTE_MIN_PT, card.page.size, orientation, style, {
          label: partLabel(card, index),
          widthOverride: innerWidth,
          titleAreaInches: dims.height - textCeiling,
          safety: 0,
          interItem: 0.04,
          maxLinesPerItem: 2,
          floorLinesPerItem: 2,
        })
      : 0;
    return { part, figure, items, available, textCeiling, notePt, resultExtra };
  });

  const sharedNotePt = measured.reduce(
    (smallest, m) => (m.notePt ? Math.min(smallest, m.notePt) : smallest),
    NOTE_PT
  );

  const partHtmls = measured.map(({ part, figure, items, available, textCeiling, resultExtra }, index) => {
    const theme = PART_THEMES[index % PART_THEMES.length];
    const textHeight = items.length
      ? Math.min(textCeiling, items.length * (sharedNotePt * 1.3 / 72 + 0.04) + 0.06) + resultExtra
      : 0;
    const size = figureSize(figure, innerWidth, available - textHeight);

    // Heading at the top, then the figure and its words as one block centred
    // in what is left, so spare room reads as margin rather than as a hole
    // between the drawing and the note under it.
    const inner =
      headingHtml(part, theme, innerWidth) +
      `<div style="flex:1;display:flex;flex-direction:column;justify-content:center;">` +
      figureHtml(figure, size) +
      textBlockHtml(items, sharedNotePt, theme) +
      `</div>`;

    return (
      `<div style="box-sizing:border-box;width:${mm(colWidth)}mm;height:${mm(rowHeight)}mm;` +
      `background:${hash(theme.fill)};border:${mm(0.02)}mm solid ${hash(theme.strip)};` +
      `padding:${mm(PART_PAD_IN)}mm;display:flex;flex-direction:column;">${inner}</div>`
    );
  });

  const rowHtmls = [];
  for (let row = 0; row < rows; row += 1) {
    const cells = partHtmls.slice(row * cols, row * cols + cols);
    if (!cells.length) continue;
    rowHtmls.push(
      `<div style="display:flex;gap:${mm(GAP_IN)}mm;align-items:stretch;width:100%;">${cells.join("")}</div>`
    );
  }

  return titleHtml + `<div style="display:flex;flex-direction:column;gap:${mm(GAP_IN)}mm;">${rowHtmls.join("")}</div>`;
}

module.exports = { renderDiagramSection, TEXT_SHARE_WITH_FIGURE, gridFor };
