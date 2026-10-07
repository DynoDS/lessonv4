"use strict";

// stepByStep: a method or a sequence told as steps down the page, each step a
// coloured card beside its own picture.
//
// Why this family exists. On 5 October 2026 the teacher took down a column
// addition wall (one finished sum with five step numbers scattered over it)
// and showed the sheet he would have put up: the steps in order down the page,
// each in its own coloured box with a big number on its corner, the same sum
// drawn again beside each step one move further on, the digit just written
// picked out, and a short note with a curly arrow to it. He approved a mock-up
// built that way ("yeah its great") and asked that it be a style any wall can
// use, in any subject: the stages of a method, the events of a story, the
// steps of an investigation, each beside the picture of that stage.
//
// What the layout holds to:
//   1. reading order is the page's order, top to bottom, never a grid whose
//      order has to be worked out;
//   2. every step's words have three weights, so the eye finds the step, then
//      what it does, then how: a bold heading, a `key` line in the step's
//      colour (the sum, the date, the quoted words), and a plain sentence;
//   3. the pictures line up down one column at one scale, so the eye sees what
//      changed from one step to the next;
//   4. a note points at one place in its picture with a curly arrow, and where
//      the picture names what is written there, that is ringed.

const { printableInches, fitTitleSize, titleBarHeightInches, TITLE_BAR_LINE_HEIGHT, boldWidthPx, wrappedLines, tryReadPhoto, photoAspect } = require("./layout");
const { pickVisual } = require("./visuals");
const { esc, markedHtml, hash, imgTag, titleBarHtml } = require("./shared");
const { plainCriteria } = require("../../shared/text/criteria-marks");
const { STEP_THEMES, stepVisual } = require("./step-colours");

const FONT_STACK_FALLBACK = "'Wall Arrows', 'Segoe Print', cursive";

const MIN_STEPS = 2;
const MAX_STEPS = 5;

// Sizes are searched downward together from the ceilings and never below the
// floors. The floors are the sizes of the mock-up the teacher approved: the
// cards are the close-up reminder beside a picture, as a pictureFirst sheet's
// steps are, and five steps with their pictures do not fit a sheet at the
// wall's 36pt.
const HEADING_PT = { ceiling: 40, floor: 26, line: 1.15 };
const KEY_PT = { ceiling: 36, floor: 22, line: 1.2 };
const TEXT_PT = { ceiling: 30, floor: 22, line: 1.25 };
const NOTE_PT = { ceiling: 24, floor: 18, line: 1.3 };
const NOTE_MAX_LINES = 3;

const TITLE_PT = 64;
const MM_PER_PT = 25.4 / 72;
const PX_PER_MM = 96 / 25.4;
const GAP_MM = 5;
const EXAMPLE_H_MM = 20;
// The example's line box (1.4 times its type) has to sit inside the strip's
// borders: at 46pt it printed 5px past them.
const EXAMPLE_PT = { wide: 36, narrow: 28 };
const ROW_MAX_MM = 105;
const CARD_SHARE = 0.42;
const NOTE_SHARE = 0.19;
const FIGURE_GAP_MM = 6;
const ARROW_RUN_MM = 13;
// A picture wider than this (a number line, a timeline) takes the whole width
// beside its card, and its note sits above it instead of in a column of its
// own: in the column layout a six-to-one number line printed 14mm tall.
const WIDE_ASPECT = 2.2;
const NOTE_BAND_MM = 15;
// A one-line note at its largest is 17mm in that 15mm band, and the sheets
// approved with it stay as they are: a note may dip this far into the clear
// strip above its picture, and no further.
const NOTE_OVERHANG_MM = 2.5;
const CARD_BORDER_MM = 1.3;
const CARD_PAD_MM = 4;

function cardName(card) {
  return `Step-by-step sheet "${card.title || "untitled"}"`;
}

function linesOf(value) {
  const list = Array.isArray(value) ? value : value == null ? [] : [value];
  return list.map((line) => (typeof line === "string" ? line.trim() : "")).filter(Boolean);
}

function figureFor(card, step, index, specDir, ctx) {
  if (step.visual) {
    const v = pickVisual(stepVisual(card, index), ctx);
    if (!v || !v.buf) {
      throw new Error(`${cardName(card)} step ${index + 1} names a ${step.visual.type || "visual"} the builder could not draw.`);
    }
    return v;
  }
  if (step.photo) {
    const buf = tryReadPhoto(specDir, step.photo);
    if (!buf) throw new Error(`${cardName(card)} step ${index + 1} could not read its photograph "${step.photo}".`);
    return { buf, aspect: photoAspect(buf) || 1.5 };
  }
  return null;
}

// Where a step's note points, as a share of its picture: a named place that
// holds writing (`box`, ringed), a named spot, or a spot given by numbers on a
// photograph. Nothing named means the note points at the picture as a whole.
function pointFor(card, step, index, figure) {
  const point = step.point;
  if (point == null || !figure) return null;
  if (Array.isArray(point) && point.length >= 2 && point.every((n) => Number.isFinite(n))) {
    return { x: point[0], y: point[1] };
  }
  const anchors = figure.anchors || {};
  const boxes = anchors.pointAt || {};
  if (Array.isArray(boxes[point])) {
    const b = boxes[point];
    return { x: b[0], y: b[1], halfW: b[2], halfH: b[3], written: b[4] !== 0, box: true };
  }
  const spot = Array.isArray(anchors[point]) ? anchors[point] : anchors.rows && anchors.rows[point];
  if (Array.isArray(spot)) return { x: spot[0], y: spot[1] };
  const names = [...Object.keys(boxes), ...Object.keys(anchors).filter((k) => Array.isArray(anchors[k])), ...Object.keys(anchors.rows || {})];
  throw new Error(
    `${cardName(card)} step ${index + 1} points at "${point}", which its picture does not name. ` +
    (names.length ? `It names: ${names.join(", ")}.` : "This picture names no places; give `point` as [x%, y%] of the picture, or leave it out.")
  );
}

function blockHeightMm(lines, size) {
  return lines * size.pt * size.line * MM_PER_PT;
}

// One step's words at a set of sizes: its height, or null when a word will not
// fit its line.
function measureCard(step, sizes, innerWmm) {
  const widthPx = innerWmm * PX_PER_MM;
  const count = (text, pt) => wrappedLines(plainCriteria(text), pt, widthPx);
  const head = count(step.heading, sizes.heading.pt);
  const key = step.key ? count(step.key, sizes.key.pt) : 0;
  const text = step.text.map((line) => count(line, sizes.text.pt));
  if (![head, key, ...text].every(Number.isFinite)) return null;
  const textLines = text.reduce((sum, n) => sum + n, 0);
  return (
    blockHeightMm(head, sizes.heading) +
    (key ? blockHeightMm(key, sizes.key) + 1.5 : 0) +
    (textLines ? blockHeightMm(textLines, sizes.text) + text.length : 0)
  );
}

function sizesAt(scale) {
  const at = (range) => ({ pt: Math.max(range.floor, Math.round(range.ceiling * scale)), line: range.line });
  return { heading: at(HEADING_PT), key: at(KEY_PT), text: at(TEXT_PT) };
}

function fitCards(card, steps, innerWmm, roomMm) {
  for (let scale = 1; scale >= 0.5; scale -= 0.04) {
    const sizes = sizesAt(scale);
    const heights = steps.map((step) => measureCard(step, sizes, step.figure ? innerWmm.beside : innerWmm.alone));
    if (heights.every((h) => h !== null && h <= roomMm)) return sizes;
  }
  const floor = sizesAt(0);
  const worst = steps
    .map((step, index) => ({ index, h: measureCard(step, floor, step.figure ? innerWmm.beside : innerWmm.alone) }))
    .find((m) => m.h === null || m.h > roomMm);
  throw new Error(
    `${cardName(card)}: step ${worst.index + 1}'s words do not fit its card at the smallest size ` +
    `(${HEADING_PT.floor}pt heading, ${TEXT_PT.floor}pt words) with ${steps.length} steps on the sheet. ` +
    "A step is a heading, one key line and a short sentence: shorten it, or tell the method in fewer steps."
  );
}

function fitNote(card, index, lines, innerWmm) {
  const widthPx = innerWmm * PX_PER_MM;
  // Each line on one line if any size allows it ("4 + 3 + 1" over "= 8" reads
  // as two things); only then may a line wrap.
  for (let pt = NOTE_PT.ceiling; pt >= NOTE_PT.floor; pt -= 1) {
    if (lines.length <= NOTE_MAX_LINES && lines.every((line) => wrappedLines(plainCriteria(line), pt, widthPx) === 1)) return { pt, total: lines.length };
  }
  for (let pt = NOTE_PT.ceiling; pt >= NOTE_PT.floor; pt -= 1) {
    const counts = lines.map((line) => wrappedLines(plainCriteria(line), pt, widthPx));
    const total = counts.reduce((sum, n) => sum + n, 0);
    if (counts.every(Number.isFinite) && total <= NOTE_MAX_LINES) return { pt, total };
  }
  throw new Error(
    `${cardName(card)} step ${index + 1}'s note does not fit beside its picture in ${NOTE_MAX_LINES} lines at ${NOTE_PT.floor}pt. ` +
    "A note is a few words pointing at one place (\"10 ones for 1 ten\"); the sentence belongs in the step's card."
  );
}

const n2 = (v) => (Math.round(v * 100) / 100).toString();

function renderStepByStep(card, style, specDir, ctx = {}) {
  const raw = Array.isArray(card.steps) ? card.steps : [];
  if (raw.length < MIN_STEPS || raw.length > MAX_STEPS) {
    throw new Error(
      `${cardName(card)} needs ${MIN_STEPS}-${MAX_STEPS} steps and has ${raw.length}. ` +
      "More than five and each picture is too small to read; group two moves into one step or split the method over two sheets."
    );
  }
  if (!card.page || card.page.orientation !== "portrait") {
    throw new Error(`${cardName(card)} is read down the page, so it is a portrait sheet: set page.orientation to "portrait".`);
  }
  const steps = raw.map((step, index) => {
    const heading = step && typeof step.heading === "string" ? step.heading.trim() : "";
    if (!heading) throw new Error(`${cardName(card)} step ${index + 1} has no heading; every step names what it does.`);
    const figure = figureFor(card, step, index, specDir, ctx);
    return {
      heading,
      key: typeof step.key === "string" ? step.key.trim() : "",
      text: linesOf(step.text),
      note: linesOf(step.note),
      figure,
      point: pointFor(card, step, index, figure),
    };
  });
  if (!steps.some((step) => step.figure)) {
    throw new Error(
      `${cardName(card)} draws nothing. The sheet exists to put each step beside its picture; ` +
      "steps in words alone belong on the slides, or off the wall."
    );
  }
  steps.forEach((step, index) => {
    if (step.note.length && !step.figure) {
      throw new Error(`${cardName(card)} step ${index + 1} has a note but no picture for it to point at.`);
    }
  });

  const dims = printableInches(card.page.size, "portrait", style);
  const W = dims.width * 25.4;
  const H = dims.height * 25.4;
  const titleText = card.title || "Step by step";
  // The title is held under the wall's usual 96pt: every millimetre it gives
  // back goes to five rows of pictures, which are what is read from the carpet.
  const titlePt = Math.min(TITLE_PT, fitTitleSize(titleText, style.sizes.a3TitlePt, card.page.size, "portrait", style));
  const titleH = titleBarHeightInches(titlePt) * 25.4;
  const example = typeof card.example === "string" ? card.example.trim() : "";
  const exampleH = example ? EXAMPLE_H_MM + GAP_MM : 0;

  const count = steps.length;
  const bodyH = H - titleH - GAP_MM - exampleH - 4;
  const rowH = Math.min(ROW_MAX_MM, (bodyH - GAP_MM * (count - 1)) / count);
  const anyNote = steps.some((step) => step.note.length);
  const cardW = W * CARD_SHARE;
  // Each step is laid out by its own picture's shape. Decided once for the
  // whole sheet, one counter chart a little over two to one sent the column
  // sum on the same sheet into the wide layout too: its note stood above it
  // and the arrow ran down through the heading and three digits to reach the
  // carried one (6 October 2026). A sum's note belongs beside it, where the
  // arrow stops at the picture's edge.
  const isWide = (step) => Boolean(step.figure) && (step.figure.aspect || 1) >= WIDE_ASPECT;
  const anyWideNote = steps.some((step) => isWide(step) && step.note.length);
  const anySideNote = steps.some((step) => !isWide(step) && step.note.length);
  const noteWFor = (step) => (anyNote ? W * NOTE_SHARE * (isWide(step) ? 1.3 : 1) : 0);
  const figureX = cardW + FIGURE_GAP_MM;
  const figureZoneWFor = (step) => W - figureX - (anySideNote && !isWide(step) ? noteWFor(step) + ARROW_RUN_MM : 0);
  // Above a wide picture the note stands in a band of its own, and the band
  // is as deep as the tallest note on the sheet. At a flat 15mm it held one
  // line: a two-line note ("1 exchanged" over "hundred") was 28mm tall and
  // printed over the top of its own picture, across the "Hundreds" heading of
  // a column sum (6 October 2026).
  const fittedNotes = steps.map((step, index) => (step.note.length ? fitNote(card, index, step.note, noteWFor(step) - 5) : null));
  const noteHeightMm = (fitted) => fitted.total * fitted.pt * NOTE_PT.line * MM_PER_PT + 6;
  // Every wide picture gives up the same band, noted or not, so they stay at
  // one scale down the page.
  const wideNoteBand = anyWideNote
    ? Math.max(NOTE_BAND_MM, ...steps.map((step, index) => (isWide(step) && fittedNotes[index] ? noteHeightMm(fittedNotes[index]) - NOTE_OVERHANG_MM : 0)))
    : 0;
  const circleD = Math.min(23, rowH * 0.36);
  const textLeft = circleD - 2;
  const innerW = {
    beside: cardW - 2 * CARD_BORDER_MM - textLeft - CARD_PAD_MM,
    alone: W - 2 * CARD_BORDER_MM - textLeft - CARD_PAD_MM,
  };
  const sizes = fitCards(card, steps, innerW, rowH - 2 * CARD_BORDER_MM - 4);
  const font = `font-family:'${style.fonts.body}', ${FONT_STACK_FALLBACK};`;
  const ink = hash(style.colours.body);

  const rows = steps.map((step, index) => {
    const theme = STEP_THEMES[index % STEP_THEMES.length];
    const main = hash(theme.main);
    const thisCardW = step.figure ? cardW : W;

    const words =
      `<div data-part="heading" style="font-weight:bold;font-size:${sizes.heading.pt}pt;line-height:${sizes.heading.line};color:${ink};">${markedHtml(step.heading)}</div>` +
      (step.key
        ? `<div data-part="key" style="font-weight:bold;font-size:${sizes.key.pt}pt;line-height:${sizes.key.line};color:${main};margin-top:1.5mm;">${esc(plainCriteria(step.key))}</div>`
        : "") +
      step.text
        .map((line) => `<div data-part="text" style="font-weight:normal;font-size:${sizes.text.pt}pt;line-height:${sizes.text.line};color:${ink};margin-top:1mm;">${markedHtml(line)}</div>`)
        .join("");
    const cardHtml =
      `<div data-part="card" style="position:absolute;left:0;top:0;width:${n2(thisCardW)}mm;height:${n2(rowH)}mm;box-sizing:border-box;` +
      `background:${hash(theme.fill)};border:${CARD_BORDER_MM}mm solid ${main};border-radius:6mm;` +
      `padding:2mm ${CARD_PAD_MM}mm 2mm ${n2(textLeft)}mm;display:flex;flex-direction:column;justify-content:center;${font}">${words}</div>` +
      `<div data-part="number" style="position:absolute;left:-3mm;top:-3mm;width:${n2(circleD)}mm;height:${n2(circleD)}mm;border-radius:50%;` +
      `background:${main};border:1.2mm solid #FFFFFF;box-sizing:border-box;display:flex;align-items:center;justify-content:center;` +
      `${font}color:#FFFFFF;font-weight:bold;font-size:${Math.round(circleD * 1.75)}pt;line-height:1;">${index + 1}</div>`;
    if (!step.figure) {
      return `<div data-part="step" style="position:relative;width:${n2(W)}mm;height:${n2(rowH)}mm;">${cardHtml}</div>`;
    }

    // The picture at its own shape, in the column every step's picture shares.
    const wide = isWide(step);
    const noteW = noteWFor(step);
    const figureZoneW = figureZoneWFor(step);
    const noteBand = wide ? wideNoteBand : 0;
    const aspect = step.figure.aspect || 1;
    let figH = rowH - 2 - noteBand;
    let figW = figH * aspect;
    if (figW > figureZoneW) {
      figW = figureZoneW;
      figH = figW / aspect;
    }
    const figY = noteBand + (rowH - noteBand - figH) / 2;
    const figureHtml =
      `<div data-part="figure" style="position:absolute;left:${n2(figureX)}mm;top:${n2(figY)}mm;">` +
      imgTag(step.figure.buf, n2(figW), n2(figH), "", step.heading) +
      `</div>`;

    const point = step.point;
    const tx = point ? figureX + (point.x / 100) * figW : figureX + figW;
    const ty = point ? figY + (point.y / 100) * figH : rowH / 2;
    let overlay = "";
    if (point && point.box && point.written) {
      const halfW = Math.max((point.halfW / 100) * figW, 2.6) + 2.2;
      const halfH = Math.max((point.halfH / 100) * figH, 2.2) + 1.6;
      overlay += `<rect data-part="ring" x="${n2(tx - halfW)}" y="${n2(ty - halfH)}" width="${n2(2 * halfW)}" height="${n2(2 * halfH)}" rx="2.2" fill="none" stroke="${main}" stroke-width="1.1"/>`;
    }

    let noteHtml = "";
    if (step.note.length) {
      const fitted = fittedNotes[index];
      const noteH = noteHeightMm(fitted);
      // Beside the picture in its own column, or above a wide one, a little
      // to the right of the place it points at.
      const noteOnLeft = wide && tx + 10 + noteW > W;
      const noteX = !wide ? W - noteW : noteOnLeft ? Math.max(figureX, tx - 10 - noteW) : tx + 10;
      const noteY = wide ? 0 : Math.min(Math.max(ty - noteH / 2 - 10, 0), rowH - noteH);
      noteHtml =
        `<div data-part="note" style="position:absolute;left:${n2(noteX)}mm;top:${n2(noteY)}mm;width:${n2(noteW)}mm;height:${n2(noteH)}mm;box-sizing:border-box;` +
        `background:${hash(theme.fill)};border:0.6mm solid ${main};border-radius:4mm;padding:0 2mm;display:flex;flex-direction:column;align-items:center;justify-content:center;` +
        `${font}font-size:${fitted.pt}pt;line-height:${NOTE_PT.line};color:${ink};text-align:center;">` +
        step.note.map((line, k) => `<div style="font-weight:${k === 0 ? "bold" : "normal"};">${markedHtml(line)}</div>`).join("") +
        `</div>`;
      // The curly arrow. Into a picture whose places are full of writing it
      // stops at the picture's edge, level with the ringed place, so it never
      // runs through a digit; onto any other picture it lands on the spot.
      const sx = noteOnLeft ? noteX + noteW : noteX;
      const sy = noteY + noteH / 2;
      const toEdge = !wide && (!point || point.box);
      const ex = toEdge ? figureX + figW + 1.2 : wide ? tx : tx + 2.5;
      const ey = wide ? Math.max(ty - 1.5, noteY + noteH + 5) : ty;
      const c1x = wide ? (sx + ex) / 2 : sx - 9;
      const c1y = wide ? sy : sy + 1;
      const c2x = wide ? ex : ex + 9;
      const c2y = ey - 9;
      const angle = Math.atan2(ey - c2y, ex - c2x);
      const headL = 5.2;
      const headW = 2.7;
      const bx = ex - Math.cos(angle) * headL;
      const by = ey - Math.sin(angle) * headL;
      overlay +=
        `<path data-part="arrow" d="M ${n2(sx)} ${n2(sy)} C ${n2(c1x)} ${n2(c1y)}, ${n2(c2x)} ${n2(c2y)}, ${n2(bx)} ${n2(by)}" fill="none" stroke="${main}" stroke-width="1.5" stroke-linecap="round"/>` +
        `<polygon points="${n2(ex)},${n2(ey)} ${n2(bx - Math.sin(angle) * headW)},${n2(by + Math.cos(angle) * headW)} ${n2(bx + Math.sin(angle) * headW)},${n2(by - Math.cos(angle) * headW)}" fill="${main}"/>`;
    }
    const overlayHtml = overlay
      ? `<svg style="position:absolute;left:0;top:0;overflow:visible;" width="${n2(W)}mm" height="${n2(rowH)}mm" viewBox="0 0 ${n2(W)} ${n2(rowH)}">${overlay}</svg>`
      : "";

    return `<div data-part="step" style="position:relative;width:${n2(W)}mm;height:${n2(rowH)}mm;">${cardHtml}${figureHtml}${noteHtml}${overlayHtml}</div>`;
  });

  const exampleHtml = example
    ? `<div data-part="example" style="box-sizing:border-box;height:${EXAMPLE_H_MM}mm;margin-bottom:${GAP_MM}mm;background:${hash(style.colours.workedExamplePanelFill)};` +
      `border:1mm solid ${hash(style.colours.workedExamplePanelLine)};border-radius:5mm;display:flex;align-items:center;justify-content:center;` +
      `${font}font-weight:bold;font-size:${boldWidthPx(plainCriteria(example), EXAMPLE_PT.wide) / PX_PER_MM <= W - 12 ? EXAMPLE_PT.wide : EXAMPLE_PT.narrow}pt;line-height:1;white-space:nowrap;overflow:hidden;color:${ink};">${markedHtml(example)}</div>`
    : "";

  return (
    titleBarHtml(titleText, style.colours.workedExampleTitleBarFill, style, titlePt, card.page.size, "portrait", { lineHeight: TITLE_BAR_LINE_HEIGHT }) +
    `<div style="height:${n2(H - titleH - 1)}mm;box-sizing:border-box;padding-top:${GAP_MM}mm;display:flex;flex-direction:column;">` +
    exampleHtml +
    `<div data-part="steps" style="flex:1 1 auto;display:flex;flex-direction:column;justify-content:space-evenly;gap:${GAP_MM}mm;padding-top:2mm;">${rows.join("")}</div>` +
    `</div>`
  );
}

module.exports = { renderStepByStep, STEP_THEMES, MAX_STEPS };
