"use strict";

// diagramSection: one wall section built from one to four drawn parts.
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
const { esc, markedHtml, mm, hash, imgTag, titleBarHtml, offerRoom } = require("./shared");
const { plainCriteria } = require("../../shared/text/criteria-marks");
const { pickVisual } = require("./visuals");
const { partVisual } = require("./step-colours");
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
// Between the parts of a `sequence` standing side by side: room for the arrow
// that says one became the other.
const SEQUENCE_GAP_IN = 0.8;
const PART_PAD_IN = 0.18;
// The line round a part, and the gap above and below its drawing. Both are on
// the page, so both come out of the room: left out, a drawing as tall as its
// room printed 2 to 3mm into its part's padding on four walls of twenty, and a
// result within 4px of its strip's width was planned on one line and printed
// on two, 12mm past the foot of its part (stress test, 7 October 2026).
const PART_BORDER_IN = 0.02;
const FIGURE_PAD_IN = 0.08;
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

// The lines one item takes at `pt` across a part `widthPx` wide, as the page
// draws it: a note and a step in the regular weight, a step in the column
// beside its number (every line of it, not only the first), a result in bold
// inside its strip's padding. The refusal and the room
// reserved both read this, so a part is never refused for a line it would not
// print, nor given room for one fewer than it does.
function itemLines(item, pt, widthPx) {
  const markPx = item.kind === "step" ? Math.max(boldWidthPx(`${item.label}.`, pt), lineBoxPx(pt)) + mm(0.06) * 96 / 25.4 : 0;
  const room = item.kind === "result" ? widthPx - 2 * mm(0.08) * 96 / 25.4 : widthPx - markPx;
  return wrappedLines(plainCriteria(item.text), pt, room, { regular: item.kind !== "result" });
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
    `<div data-wall-figure style="display:flex;justify-content:center;padding:${mm(FIGURE_PAD_IN)}mm 0;">` +
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

// The arrow between two stages, in the colour of the stage it leads to.
function sequenceArrowHtml(theme) {
  const w = mm(SEQUENCE_GAP_IN);
  const inner = mm(SEQUENCE_GAP_IN - 0.16);
  return (
    `<div data-part="sequence-arrow" style="flex:none;width:${w}mm;display:flex;align-items:center;justify-content:center;">` +
    `<svg viewBox="0 0 100 80" style="width:${inner}mm;height:${mm((SEQUENCE_GAP_IN - 0.16) * 0.8)}mm;">` +
    `<polygon points="0,26 54,26 54,4 100,40 54,76 54,54 0,54" fill="${hash(theme.strip)}"/></svg></div>`
  );
}

// A sheet that holds one idea has one part: the drawing, its few lines and its
// answer, with the sheet to itself (the teacher, 10 October 2026: perimeter on
// one sheet and area on another, each shape nearly twice the size it was when
// they shared one, "they'd have to be visually different and colour's a great
// way to start"). Each one-part sheet in a wall takes the next part colour,
// title bar and all, so two sheets side by side read as two different things.
function soloTheme(card, ctx) {
  const cards = ctx && Array.isArray(ctx.cards) ? ctx.cards : [];
  const solos = cards.filter((c) => c && c.type === "diagramSection" && Array.isArray(c.parts) && c.parts.length === 1);
  const at = solos.indexOf(card);
  return PART_THEMES[(at < 0 ? 0 : at) % PART_THEMES.length];
}

function renderDiagramSection(card, style, specDir, ctx) {
  const parts = Array.isArray(card.parts) ? card.parts : [];
  if (parts.length < 1 || parts.length > 4) {
    throw new Error(
      `Card "${card.title || card.type}" is a diagramSection and needs 1-4 parts; it has ${parts.length}. ` +
      `One part is one idea with the sheet to itself; more than four is too many drawings to read on one sheet.`
    );
  }
  const solo = parts.length === 1 ? soloTheme(card, ctx) : null;
  parts.forEach((part, index) => {
    if (!part || !String(part.heading || "").trim()) {
      throw new Error(`${partLabel(card, index)} has no heading; every part of a section names what it shows.`);
    }
  });

  const figures = parts.map((part, index) => (part.visual ? pickVisual(partVisual(card, index), ctx) : null));
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
    solo ? solo.strip : style.colours.referenceTableHeaderFill,
    style,
    titlePt,
    card.page.size,
    orientation
  );

  const { cols, rows } = gridFor(
    parts.length,
    orientation,
    // A note box beside a compact drawing made it measure as a wide one, so two
    // clocks with a label each were stacked as strips a tenth of the sheet tall
    // (a wall worker's trial, 10 October 2026). The picture's own shape decides.
    figures.map((figure) => (figure ? figure.pictureAspect || figure.aspect || 1 : 0))
  );
  const bodyHeight = dims.height - titleBarHeightInches(titlePt) - SAFETY_IN;
  const rowHeight = (bodyHeight - GAP_IN * (rows - 1)) / rows;
  // Parts that are stages of one thing, side by side, are joined by an arrow.
  const joined = card.sequence === true && cols > 1;
  const colGap = joined ? SEQUENCE_GAP_IN : GAP_IN;
  const colWidth = (dims.width - colGap * (cols - 1)) / cols;
  const innerWidth = colWidth - 2 * PART_PAD_IN - 2 * PART_BORDER_IN;
  // The heading strip's own width for its words: the part less its padding and
  // border, less the strip's side padding, as the HTML writes them.
  const stripWidthPx = ((mm(colWidth) - 2 * mm(PART_PAD_IN) - 2 * mm(PART_BORDER_IN) - 2 * mm(HEADING_SIDE_IN)) * 96) / 25.4;

  // Measure every part first, then draw them all at one shared note size.
  // Fitting each part on its own gave a sheet whose left column ran at 24pt
  // and whose right column ran at 44pt, because one part happened to carry
  // three lines and its neighbour carried one. On a single sheet that reads
  // as a mistake; the smallest size any part needs is the size they all use.
  const measured = parts.map((part, index) => {
    const figure = figures[index];
    const items = textItemsFor(part);
    const heading = headingFor(part.heading, stripWidthPx);
    // What the drawing and the words share: the part less its padding, its
    // border, its heading and the gap the drawing keeps above and below itself.
    const available =
      rowHeight - 2 * PART_PAD_IN - 2 * PART_BORDER_IN - heading.heightIn - (figure && figure.buf ? 2 * FIGURE_PAD_IN : 0);
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
          linesOf: (item, pt) => itemLines(item, pt, innerWidth * 96),
          // The fitter adds 0.04in to every item; a result keeps its strip
          // (RESULT_EXTRA_IN, already out of the ceiling) and not that gap.
          titleAreaInches: dims.height - textCeiling - 0.04 * (resultExtra / RESULT_EXTRA_IN),
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
    return { part, figure, items, heading, available, textCeiling, notePt, resultExtra, floorPt };
  });

  const largestNotePt = measured.reduce(
    (smallest, m) => (m.notePt ? Math.min(smallest, m.notePt) : smallest),
    NOTE_PT
  );

  // The height each part's words take at a note size, and the figure that
  // leaves. Each item's own lines are counted as Chrome wraps them. Planned at
  // one line an item, a note that wraps (the fitter allows two) got one line's
  // room, the figure took the rest, and the second line printed under the
  // part's panel: "and takes it somewhere new" on the Year 6 renga wall, 2
  // October 2026.
  const widthPx = innerWidth * 96;
  // What the drawn page said each part's drawing must give up (build.js reads
  // the page in Chrome and asks for the sheet again): inches off the drawing's
  // room, so the words keep theirs.
  const cardAt = ctx && Array.isArray(ctx.cards) ? ctx.cards.indexOf(card) : -1;
  const partId = (index) => `${cardAt}:${index}`;
  const giveIn = (index) => (ctx && ctx.give && ctx.give[partId(index)]) || 0;
  const layoutAt = (pt) => {
    const lineIn = pt * 1.3 / 72;
    // A step's row is as tall as its number badge when that is taller than its
    // words: the badge is the font's own line box (about 1.4 times the type)
    // and a line of words is 1.3. Planned at 1.3 a row, three one-line steps
    // came out a few pixels taller than their room and the last one printed
    // past the foot of its panel (Year 1 number bonds wall, 7 October 2026).
    const badgeIn = lineBoxPx(pt) / 96;
    const heights = measured.map(({ items, textCeiling, resultExtra }, index) => {
      if (!items.length) return giveIn(index);
      const linesIn = items.reduce((sum, item) => {
        const counted = itemLines(item, pt, widthPx);
        const wordsIn = (Number.isFinite(counted) ? counted : 1) * lineIn;
        return sum + (item.kind === "step" ? Math.max(wordsIn, badgeIn) : wordsIn);
      }, 0);
      // A note and a step keep 0.02in above and below; a result keeps its
      // strip instead (RESULT_EXTRA_IN). This is the height the page draws,
      // with nothing added for luck: the drawn page is read afterwards
      // (build.js), and a tenth of an inch held back here came off the drawing.
      const padsIn = items.filter((item) => item.kind !== "result").length * 0.04;
      return Math.min(textCeiling, linesIn + padsIn) + resultExtra + giveIn(index);
    });
    // Drawings of one shape standing in one row give their words the same
    // height, the tallest's, so they come out one size: a result that wrapped
    // to a second line on the left used to print its shape smaller than the
    // same shape on the right. Drawings of different shapes keep their own
    // room, or a part with one line would lose its drawing to a neighbour's
    // five steps.
    const shapeOf = (m) => (m.figure && m.figure.buf ? m.figure.pictureAspect || m.figure.aspect || 1 : 0);
    const rowHeights = heights.map((own, index) => {
      const start = Math.floor(index / cols) * cols;
      const mine = shapeOf(measured[index]);
      if (!mine) return own;
      const alike = heights.slice(start, start + cols).filter((_, k) => {
        const theirs = shapeOf(measured[start + k]);
        return theirs && Math.abs(theirs - mine) / mine < 0.05;
      });
      return Math.max(own, ...alike);
    });
    return measured.map(({ figure, available }, index) => ({
      roomIn: available - rowHeights[index],
      size: figureSize(figure, innerWidth, available - rowHeights[index]),
    }));
  };
  const areaOf = (laid) => laid.reduce((sum, { size }) => sum + (size ? size.wIn * size.hIn : 0), 0);

  // The drawing has first call on the room. The words used to be set as large
  // as their share allowed and the drawing took what was left, so an L-shape
  // printed 79mm wide in a 181mm panel under two 44pt sums (stress test, 7
  // October 2026). The teacher chose the other way round from pictures of
  // that poster (10 October 2026): the words drop to their readable floor and
  // the drawing takes the room. So the notes start at their floor, and grow
  // only while that costs the drawings nothing, which is the case when a
  // drawing is as wide as its part and the height under it is spare.
  const floorNotePt = Math.min(
    largestNotePt,
    Math.max(...measured.map((m) => (m.items.length ? m.floorPt : 0)), 0) || largestNotePt
  );
  let sharedNotePt = floorNotePt;
  const areaAtFloor = areaOf(layoutAt(floorNotePt));
  for (let pt = floorNotePt + 2; pt <= largestNotePt; pt += 2) {
    if (areaOf(layoutAt(pt)) < areaAtFloor * 0.98) break;
    sharedNotePt = pt;
  }
  const laidOut = layoutAt(sharedNotePt);

  const partHtmls = measured.map(({ part, figure, items, heading }, index) => {
    const theme = solo || PART_THEMES[index % PART_THEMES.length];
    const { size, roomIn } = laidOut[index];
    if (size) offerRoom(figure.buf, mm(innerWidth), mm(roomIn));

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
      `<div data-wall-part="${partId(index)}" style="box-sizing:border-box;width:${mm(colWidth)}mm;height:${mm(rowHeight)}mm;` +
      `background:${hash(theme.fill)};border:${mm(PART_BORDER_IN)}mm solid ${hash(theme.strip)};` +
      `padding:${mm(PART_PAD_IN)}mm;display:flex;flex-direction:column;">${inner}</div>`
    );
  });

  const rowHtmls = [];
  for (let row = 0; row < rows; row += 1) {
    const cells = partHtmls.slice(row * cols, row * cols + cols);
    if (!cells.length) continue;
    const start = row * cols;
    rowHtmls.push(
      joined
        ? `<div style="display:flex;align-items:stretch;width:100%;">${cells.map((cell, at) => (at === 0 ? cell : sequenceArrowHtml(PART_THEMES[(start + at) % PART_THEMES.length]) + cell)).join("")}</div>`
        : `<div style="display:flex;gap:${mm(GAP_IN)}mm;align-items:stretch;width:100%;">${cells.join("")}</div>`
    );
  }

  return titleHtml + `<div style="display:flex;flex-direction:column;gap:${mm(GAP_IN)}mm;">${rowHtmls.join("")}</div>`;
}

module.exports = { renderDiagramSection, TEXT_SHARE_WITH_FIGURE, gridFor };
