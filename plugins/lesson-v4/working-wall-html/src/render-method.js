"use strict";

// workedExample with `layout: "pictureFirst"`: the worked example drawn large,
// then each step of the method beside its own line of working.
//
// Why this layout exists. On 29 September 2026 the teacher flagged two Year 4
// maths walls as "very texty": five success-criteria steps in full, then the
// worked example as one run-on line ("48 + 25: 48 + 20 = 68, 68 + 2 = 70, ...")
// that broke partway through a sum, and a number line under it all that showed
// only half the method. He approved hand-made mock-ups built the other way
// round, and asked that the wall do the same for any lesson:
//
//   1. the picture is the worked example itself, drawn large;
//   2. each step's number is pinned to its part of the picture (a callout with
//      `step`, drawn by svg-renderer.js), so a child matches step 4 to the +2;
//   3. each step sits beside its own working, so a step is never separated from
//      what it does to the numbers;
//   4. the steps stay word for word from the board, as the support.
//
// The figure is the sheet. Its words take a capped share of the height and the
// figure keeps the rest, the rule diagramSection already holds, and no word is
// printed under the wall's 36pt floor: a card whose steps and working will not
// fit beside its picture at that size is refused, never printed without the
// picture.

const { printableInches, fitTitleSize, titleBarHeightInches, TITLE_BAR_LINE_HEIGHT, lineBoxPx, boldWidthPx, wrappedLines, tryReadPhoto, photoAspect } = require("./layout");
const { pickVisual, isStepLabel } = require("./visuals");
const { badgeKey } = require("./svg-renderer");
const { esc, mm, hash, imgTag, titleBarHtml } = require("./shared");
const { criteriaSegments, plainCriteria } = require("../../shared/text/criteria-marks");

const FONT_STACK_FALLBACK = "'Wall Arrows', 'Segoe Print', cursive";

// Sizes are searched downward from the ceiling and never below the floor,
// which is style.sizes.a3BodyMinPt.
const STEP_PT_CEILING = 48;
// Working prints larger than its step: it is the part a child reads from
// across the room, and the step is the reminder of why.
const WORKING_SCALE = 1.3;
const WORKING_MAX_SHARE = 0.5;
const QUESTION_PT_CEILING = 80;
const QUESTION_PT_FLOOR = 44;
// The words' share of the panel when the figure sits above them.
const TEXT_SHARE = 0.6;
// A figure narrower than this beside a landscape sheet goes to the left of the
// steps instead of above them, as the Thursday mock-up laid it out.
const SIDE_BY_SIDE_ASPECT = 1.4;
const SIDE_FIGURE_SHARE = 0.45;

const PAD_IN = 0.25;
const GAP_IN = 0.18;
const ROW_GAP_IN = 0.14;
const WORK_PAD_X_IN = 0.14;
const WORK_PAD_Y_IN = 0.05;
const SAFETY_IN = 0.3;
const PANEL_FOOT_IN = 0.06;
const PX = 96;

function marked(text) {
  return criteriaSegments(String(text || ""))
    .map((segment) => (segment.colour ? `<span style="color:${segment.colour};">${esc(segment.text)}</span>` : esc(segment.text)))
    .join("");
}

function cardName(card) {
  return `Worked example "${card.title || "untitled"}"`;
}

// The picture the sheet is built round: a drawn visual (with any step numbers
// pinned on it) or a lesson photograph.
function figureFor(card, specDir, ctx) {
  if (card.visual) {
    const v = pickVisual(card.visual, ctx);
    if (!v || !v.buf) {
      throw new Error(`${cardName(card)} is picture-first but its ${card.visual.type || "visual"} could not be drawn.`);
    }
    return v;
  }
  if (card.photo) {
    const buf = tryReadPhoto(specDir, card.photo);
    if (!buf) throw new Error(`${cardName(card)} could not read its photograph "${card.photo}".`);
    return { buf, aspect: photoAspect(buf) || 1.5, alt: card.title || "" };
  }
  throw new Error(
    `${cardName(card)} is picture-first but has no picture. The layout is built round the worked example ` +
    "drawn large; give it the lesson's own figure as `visual` (or a lesson photograph as `photo`)."
  );
}

// The steps and their working, measured at one step size and one working
// size. Returns the rows' height in inches, or null when a step will not fit
// its column, or the working column would take more than half the sheet.
function measureRows(steps, pt, widthIn, workPt = Math.round(pt * WORKING_SCALE)) {
  const workings = steps.map((s) => plainCriteria(s.working || ""));
  const workWIn = Math.max(0, ...workings.map((w) => (w ? boldWidthPx(w, workPt) / PX + 2 * WORK_PAD_X_IN : 0)));
  if (workWIn > widthIn * WORKING_MAX_SHARE) return null;
  const badgeIn = lineBoxPx(pt) / PX;
  const textWIn = widthIn - badgeIn - GAP_IN - (workWIn ? workWIn + GAP_IN : 0);
  const rows = [];
  for (const step of steps) {
    const lines = wrappedLines(plainCriteria(step.text), pt, textWIn * PX);
    if (!Number.isFinite(lines)) return null;
    const textH = (lines * lineBoxPx(pt)) / PX;
    const workH = step.working ? lineBoxPx(workPt) / PX + 2 * WORK_PAD_Y_IN : 0;
    rows.push(Math.max(textH, workH, badgeIn));
  }
  const heightIn = rows.reduce((sum, h) => sum + h, 0) + ROW_GAP_IN * Math.max(0, rows.length - 1);
  return { pt, workPt, workWIn, badgeIn, heightIn };
}

// The largest steps that fit, and for them the largest working. Working
// starts larger than its step, because it is what is read from across the
// room, and gives that back before the steps shrink: never below its step.
function fitRows(steps, widthIn, ceilingIn, floorPt) {
  for (let pt = STEP_PT_CEILING; pt >= floorPt; pt -= 2) {
    for (let workPt = Math.round(pt * WORKING_SCALE); workPt >= pt; workPt -= 2) {
      const m = measureRows(steps, pt, widthIn, workPt);
      if (m && m.heightIn <= ceilingIn) return m;
    }
  }
  return null;
}

function fitQuestion(text, widthIn) {
  if (!text) return null;
  const plain = plainCriteria(text);
  for (let pt = QUESTION_PT_CEILING; pt >= QUESTION_PT_FLOOR; pt -= 2) {
    if (boldWidthPx(plain, pt) / PX <= widthIn) return { pt, heightIn: lineBoxPx(pt) / PX + GAP_IN };
  }
  return { pt: QUESTION_PT_FLOOR, heightIn: (2 * lineBoxPx(QUESTION_PT_FLOOR)) / PX + GAP_IN };
}

function figureSize(figure, maxWIn, maxHIn) {
  const aspect = figure.aspect || 1;
  let wIn = maxWIn;
  let hIn = wIn / aspect;
  if (hIn > maxHIn) {
    hIn = maxHIn;
    wIn = hIn * aspect;
  }
  return { wIn, hIn };
}

function rowsHtml(steps, m, style, ctx) {
  const font = `font-family:'${style.fonts.body}', ${FONT_STACK_FALLBACK};font-weight:bold;`;
  return steps
    .map((step) => {
      const badge = ctx.svgImages ? ctx.svgImages[badgeKey(step.number)] : null;
      const badgeHtml = badge
        ? imgTag(badge, mm(m.badgeIn), mm(m.badgeIn), "flex:none;")
        : `<div style="flex:none;width:${mm(m.badgeIn)}mm;${font}font-size:${m.pt}pt;color:${hash(style.colours.workedExampleLabel)};">${step.number}.</div>`;
      const working = step.working
        ? `<div data-part="working" style="flex:none;box-sizing:border-box;width:${mm(m.workWIn)}mm;background:#FFFFFF;border-radius:${mm(0.12)}mm;` +
          `padding:${mm(WORK_PAD_Y_IN)}mm ${mm(WORK_PAD_X_IN)}mm;text-align:center;white-space:nowrap;${font}font-size:${m.workPt}pt;` +
          `color:${hash(style.colours.body)};">${marked(step.working)}</div>`
        : "";
      return (
        `<div data-part="step" style="display:flex;align-items:center;gap:${mm(GAP_IN)}mm;">` +
        badgeHtml +
        `<div style="flex:1 1 auto;min-width:0;text-align:left;${font}font-size:${m.pt}pt;color:${hash(style.colours.body)};">${marked(step.text)}</div>` +
        working +
        `</div>`
      );
    })
    .join("");
}

function renderPictureFirstWorkedExample(card, style, specDir, ctx = {}) {
  const items = Array.isArray(card.items) ? card.items : [];
  let stepNumber = 0;
  const steps = [];
  const others = [];
  for (const item of items) {
    if (isStepLabel(item.label)) {
      stepNumber += 1;
      steps.push({ number: stepNumber, text: item.text, working: typeof item.working === "string" ? item.working.trim() : "" });
    } else if (item && typeof item.text === "string" && item.text.trim()) {
      if (item.working) {
        throw new Error(`${cardName(card)}: "${item.label}" carries working, but working belongs beside a step.`);
      }
      others.push(item.text.trim());
    }
  }
  if (!steps.length) throw new Error(`${cardName(card)} is picture-first but has no steps to pair with its picture.`);

  const figure = figureFor(card, specDir, ctx);
  const orientation = card.page.orientation === "portrait" ? "portrait" : "landscape";
  const dims = printableInches(card.page.size, orientation, style);
  const titleText = card.title || "How to do it";
  const titlePt = fitTitleSize(titleText, style.sizes.a3TitlePt, card.page.size, orientation, style);
  const titleH = titleBarHeightInches(titlePt);
  // The steps here are the close-up reminder of why each line of working
  // happens; the figure, the worked example and the working are what is read
  // from across the room, and print larger. So the steps keep a lower floor
  // than the wall's 36pt: at 36pt five verbatim steps need more height than a
  // whole A3 sheet, and a sheet held to it could never carry its picture
  // (measured on the two walls this layout was built for, 30 September 2026;
  // the mock-ups the teacher approved set their steps at 26-32pt).
  const floorPt = style.sizes.a3StepSupportMinPt || style.sizes.a3BodyMinPt;

  const innerW = dims.width - 2 * PAD_IN;
  const innerH = dims.height - titleH - 2 * PAD_IN - SAFETY_IN;
  const question = fitQuestion(others.join("   "), innerW);
  const questionH = question ? question.heightIn : 0;
  const sideBySide = orientation === "landscape" && (figure.aspect || 1) < SIDE_BY_SIDE_ASPECT;

  let rows;
  let figureBox;
  let rowsW;
  if (sideBySide) {
    const figureW = innerW * SIDE_FIGURE_SHARE;

    rowsW = innerW - figureW - GAP_IN;
    rows = fitRows(steps, rowsW, innerH - questionH, floorPt);
    figureBox = figureSize(figure, figureW, innerH - questionH);
  } else {
    rowsW = innerW;
    const body = innerH - questionH - GAP_IN;
    // A wide figure (a number line) is at full size in well under 40% of the
    // sheet; the words may have whatever height it does not need.
    const figureNaturalH = innerW / (figure.aspect || 1);
    rows = fitRows(steps, rowsW, Math.max(body * TEXT_SHARE, body - figureNaturalH), floorPt);
    if (rows) figureBox = figureSize(figure, innerW, body - rows.heightIn);
  }
  if (!rows) {
    throw new Error(
      `${cardName(card)}: its ${steps.length} steps and their working do not fit beside its picture at the ${floorPt}pt ` +
      "floor. The picture stays and the steps are never reworded: shorten a line of working, move a step's working " +
      "into the picture, or leave this card off the wall."
    );
  }

  const font = `font-family:'${style.fonts.body}', ${FONT_STACK_FALLBACK};font-weight:bold;`;
  const questionHtml = question
    ? `<div data-part="question" style="text-align:center;${font}font-size:${question.pt}pt;line-height:1.1;` +
      `color:${hash(style.colours.body)};margin-bottom:${mm(GAP_IN)}mm;">${marked(others.join("   "))}</div>`
    : "";
  const figureHtml =
    `<div data-part="figure" style="display:flex;justify-content:center;align-items:center;${sideBySide ? `flex:none;width:${mm(innerW * SIDE_FIGURE_SHARE)}mm;` : ""}">` +
    imgTag(figure.buf, mm(figureBox.wIn), mm(figureBox.hIn), "margin:0 auto;", figure.alt || titleText) +
    `</div>`;
  const stepsHtml =
    `<div data-part="steps" style="display:flex;flex-direction:column;justify-content:center;gap:${mm(ROW_GAP_IN)}mm;` +
    `${sideBySide ? "flex:1 1 auto;min-width:0;" : ""}">${rowsHtml(steps, rows, style, ctx)}</div>`;

  const body = sideBySide
    ? `<div style="flex:1 1 auto;display:flex;gap:${mm(GAP_IN)}mm;align-items:center;">${figureHtml}${stepsHtml}</div>`
    : `<div style="flex:1 1 auto;display:flex;flex-direction:column;justify-content:space-evenly;">${figureHtml}${stepsHtml}</div>`;

  // The panel runs to the foot of the sheet; the fit above keeps SAFETY_IN of
  // it spare, so the words never reach its edge.
  const panelH = dims.height - titleH - PANEL_FOOT_IN;
  return (
    titleBarHtml(titleText, style.colours.workedExampleTitleBarFill, style, titlePt, card.page.size, orientation, { lineHeight: TITLE_BAR_LINE_HEIGHT }) +
    `<div style="box-sizing:border-box;width:100%;height:${mm(panelH)}mm;background:${hash(style.colours.workedExamplePanelFill)};` +
    `border:${mm(0.03)}mm solid ${hash(style.colours.workedExamplePanelLine)};border-top:none;padding:${mm(PAD_IN)}mm;` +
    `display:flex;flex-direction:column;">${questionHtml}${body}</div>`
  );
}

module.exports = { renderPictureFirstWorkedExample, measureRows, TEXT_SHARE };
