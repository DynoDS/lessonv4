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
  lineBoxPx,
  boldWidthPx,
  wrappedLines,
} = require("./layout");
const { esc, markedHtml, mm, hash, imgTag, titleBarHtml } = require("./shared");
const { plainCriteria } = require("../../shared/text/criteria-marks");
const { pickVisual } = require("./visuals");
const { badgeKey } = require("./svg-renderer");

// Arrows come from "Wall Arrows" (shared.js says why).
const FONT_STACK_FALLBACK = "'Wall Arrows', 'Segoe Print', cursive";

// One theme per part, so a section reads as two or three distinct things at a
// glance rather than one grey wall of boxes. The hues are the board's own
// category colours (`categoryColor`: blue, orange, purple), because the wall
// uses the board's colour meanings (the teacher's rule of 24 September 2026):
// green is a taught word or an answer, so it never tells parts apart. A fourth
// part takes blue again, diagonally across the grid from the first.
const PART_THEMES = [
  { strip: "0070C0", fill: "EEF5FB", accent: "0070C0" },
  { strip: "E46C0A", fill: "FEF4EB", accent: "E46C0A" },
  { strip: "7030A0", fill: "F4EEF9", accent: "7030A0" },
];

// The answer a part works out is green, what an answer is on the board,
// whatever the part's own colour. A part that shows a worked example, a
// mistaken one included, is marked `worked: true` and its result is the
// worked-example purple: a wrong result on green tells a child it is right.
const RESULT_GREEN = "00B050";
const RESULT_WORKED = "7030A0";

// A part heading starts here and shrinks to the same 36pt floor the notes
// use, never past it: a heading nobody can read from a desk names nothing.
const HEADING_PT = 44;
const HEADING_MIN_PT = 36;
// The heading strip as headingHtml draws it: its padding above and below the
// words, at its sides, the gap under it, and its line height.
const HEADING_PAD_IN = 0.06;
const HEADING_SIDE_IN = 0.08;
const HEADING_GAP_IN = 0.08;
const HEADING_LINE = 1.15;
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
  if (result) items.push({ kind: "result", text: result, worked: part.worked === true });
  return items;
}

function headingHtml(part, theme, heading) {
  return (
    `<div data-part="heading" style="box-sizing:border-box;width:100%;background:${hash(theme.strip)};` +
    `padding:${mm(heading.padIn)}mm ${mm(HEADING_SIDE_IN)}mm;margin-bottom:${mm(HEADING_GAP_IN)}mm;">` +
    `<div style="text-align:center;font-family:'${"Comic Sans MS"}', ${FONT_STACK_FALLBACK};` +
    `font-weight:bold;font-size:${heading.pt}pt;line-height:${HEADING_LINE};color:#FFFFFF;">${esc(part.heading || "")}</div></div>`
  );
}

// A heading is one strip across its own column, so it shrinks to fit its
// column rather than wrapping into three lines and eating the figure's room.
// It is measured as the page draws it: whole words of Comic Sans MS Bold across
// the strip's own width (layout.js, What the page draws).
//
// A heading line is 1.15 times its type, tighter than the font's own line box
// (its ascender and descender, about 1.4 times), so the words of the first and
// last lines reach past their line by the difference. The strip's padding takes
// at least that much: at a flat 0.06in a saved heading, "Count backwards in
// ones.", printed 2.3px past its strip (release 7A's audit, 26 September 2026).
// Returns the size, the lines, the padding and the height the strip and the gap
// under it take from the part.
function headingFor(text, stripWidthPx) {
  let pt = HEADING_PT;
  let lines = wrappedLines(text, pt, stripWidthPx);
  while (pt > HEADING_MIN_PT && lines > 2) {
    pt -= 2;
    lines = wrappedLines(text, pt, stripWidthPx);
  }
  const drawnLines = Number.isFinite(lines) ? lines : 2;
  const px = pt * (96 / 72);
  const overhangPx = Math.max(0, (lineBoxPx(pt) - px * HEADING_LINE) / 2);
  const padIn = Math.max(HEADING_PAD_IN, (overhangPx + 0.5) / 96);
  const heightIn = (2 * mm(padIn) + mm(HEADING_GAP_IN)) / 25.4 + (drawnLines * px * HEADING_LINE) / 96;
  return { pt, lines: drawnLines, padIn, heightIn };
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

// A step's number in the list is the same green circle its pin prints on the
// figure (the pictureFirst sheet's badge), so a child matches step 2 below to
// step 2 on the drawing by its look as well as its number. A part numbered in
// its own theme colour beside green pins read as two different sets of steps
// (the divisibility wall, 3 October 2026). Plain text only when no badge was
// rendered.
function stepMarkHtml(label, pt, theme, ctx, font) {
  const badge = ctx && ctx.svgImages ? ctx.svgImages[badgeKey(Number(label))] : null;
  if (badge) {
    const sizeMm = mm(lineBoxPx(pt) / 96);
    return imgTag(badge, sizeMm, sizeMm, "flex:none;align-self:flex-start;");
  }
  return `<div style="${font}font-weight:bold;color:${hash(theme.accent)};">${esc(label)}.</div>`;
}

function textBlockHtml(items, pt, theme, ctx) {
  if (!items.length) return "";
  const font = `font-family:'Comic Sans MS', ${FONT_STACK_FALLBACK};font-size:${pt}pt;line-height:1.3;`;
  const rows = items.map((item) => {
    if (item.kind === "step") {
      return (
        `<div data-part="step" style="display:flex;align-items:baseline;gap:${mm(0.06)}mm;padding:${mm(0.02)}mm 0;">` +
        stepMarkHtml(item.label, pt, theme, ctx, font) +
        `<div style="flex:1;${font}color:#000000;">${markedHtml(item.text)}</div></div>`
      );
    }
    if (item.kind === "result") {
      // The answer the part works out, marked the way the teacher's own wall
      // marks it: its own coloured strip, so a child finds the result without
      // reading the workings first. The strip is answer green, or purple on a
      // worked part.
      return (
        `<div data-part="result" style="margin-top:${mm(0.07)}mm;background:${hash(item.worked ? RESULT_WORKED : RESULT_GREEN)};padding:${mm(0.05)}mm ${mm(0.08)}mm;">` +
        `<div style="text-align:center;${font}font-weight:bold;color:#FFFFFF;">${esc(item.text)}</div></div>`
      );
    }
    return `<div data-part="note" style="text-align:center;${font}color:#000000;padding:${mm(0.02)}mm 0;">${markedHtml(item.text)}</div>`;
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
  // The heading strip's own width for its words: the part less its padding and
  // border, less the strip's side padding, as the HTML writes them.
  const stripWidthPx = ((mm(colWidth) - 2 * mm(PART_PAD_IN) - 2 * mm(0.02) - 2 * mm(HEADING_SIDE_IN)) * 96) / 25.4;

  // Measure every part first, then draw them all at one shared note size.
  // Fitting each part on its own gave a sheet whose left column ran at 24pt
  // and whose right column ran at 44pt, because one part happened to carry
  // three lines and its neighbour carried one. On a single sheet that reads
  // as a mistake; the smallest size any part needs is the size they all use.
  const measured = parts.map((part, index) => {
    const figure = figures[index];
    const items = textItemsFor(part);
    const heading = headingFor(part.heading, stripWidthPx);
    const available = rowHeight - 2 * PART_PAD_IN - heading.heightIn;
    // The figure is the part. Words get a capped share and the drawing keeps
    // the rest, so a long note can never push the diagram down to a strip.
    const resultExtra = items.filter((item) => item.kind === "result").length * RESULT_EXTRA_IN;
    const textCeiling =
      (figure && figure.buf ? available * TEXT_SHARE_WITH_FIGURE : available) - resultExtra;
    // A part that is a worked example's method (steps beside its own drawing)
    // reads like a pictureFirst sheet: the drawing is read from across the
    // room and the steps are the close-up reminder, so they take that sheet's
    // step floor. At 36pt the four checks of a divisibility wall needed four
    // times their parts' height; the two-sheet version the teacher approved
    // set them at 28pt (2 October 2026). A part of notes alone keeps 36pt.
    const closeUp = figure && figure.buf && items.some((item) => item.kind === "step");
    const floorPt = closeUp ? (style.sizes.a3StepSupportMinPt || NOTE_MIN_PT) : NOTE_MIN_PT;
    const notePt = items.length
      ? fitLinearBodySize(items.map((item) => ({ ...item, text: plainCriteria(item.text) })), NOTE_PT, floorPt, card.page.size, orientation, style, {
          label: partLabel(card, index),
          widthOverride: innerWidth,
          titleAreaInches: dims.height - textCeiling,
          safety: 0,
          interItem: 0.04,
          // A close-up step is a success-criteria step copied word for word,
          // so it may wrap to a third line rather than be refused: "Is the
          // digit sum in the 3 times table? Then the number is divisible by
          // 3." takes three at 28pt in a half-sheet part.
          maxLinesPerItem: closeUp ? 3 : 2,
          floorLinesPerItem: closeUp ? 3 : 2,
        })
      : 0;
    return { part, figure, items, heading, available, textCeiling, notePt, resultExtra };
  });

  const sharedNotePt = measured.reduce(
    (smallest, m) => (m.notePt ? Math.min(smallest, m.notePt) : smallest),
    NOTE_PT
  );

  const partHtmls = measured.map(({ part, figure, items, heading, available, textCeiling, resultExtra }, index) => {
    const theme = PART_THEMES[index % PART_THEMES.length];
    // Each item's own lines at the shared size. Planned at one line an item,
    // a note that wraps (the fitter allows two) got one line's room, the
    // figure took the rest, and the second line printed under the part's
    // panel: "and takes it somewhere new" on the Year 6 renga wall, 2 October
    // 2026. Counted as Chrome wraps, a wrapped note costs its second line.
    const lineIn = sharedNotePt * 1.3 / 72;
    const widthPx = innerWidth * 96;
    const lines = items.reduce((sum, item) => {
      const room = item.kind === "result" ? widthPx - 2 * mm(0.08) * 96 / 25.4 : widthPx;
      const prefixPx = item.kind === "step" ? Math.max(boldWidthPx(`${item.label}.`, sharedNotePt), lineBoxPx(sharedNotePt)) + mm(0.06) * 96 / 25.4 : 0;
      const counted = wrappedLines(plainCriteria(item.text), sharedNotePt, room, { prefixPx });
      return sum + (Number.isFinite(counted) ? counted : 1);
    }, 0);
    const textHeight = items.length
      ? Math.min(textCeiling, lines * lineIn + items.length * 0.04 + 0.06) + resultExtra
      : 0;
    const size = figureSize(figure, innerWidth, available - textHeight);

    // Heading at the top, then the figure and its words as one block centred
    // in what is left, so spare room reads as margin rather than as a hole
    // between the drawing and the note under it.
    const inner =
      headingHtml(part, theme, heading) +
      `<div style="flex:1;display:flex;flex-direction:column;justify-content:center;">` +
      figureHtml(figure, size) +
      textBlockHtml(items, sharedNotePt, theme, ctx) +
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
