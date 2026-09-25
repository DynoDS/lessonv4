"""Point 2 of the fit release (4.2.289): the practice panel widens itself, only
as far as 18pt needs, and never past half the slide.

One shared choice in `maths-turn-sc.js`, used by all four live `*-sc`
templates: the narrowest of 4.60, 5.50 and 6.35 inches that holds the whole
list at 18pt or more. It is found by drawing the panel at each width onto a
slide nobody sees, with the same code that draws it for real, and only the
list not fitting (the step fitter's `STEP_TEXT_OVERLOAD`) moves it to the next
width: any other refusal inside the panel (a fraction wall too shallow in a
criteria stack, say) is raised at the width it happened, as before, because
the teacher agreed a box that widens when a list needs it (the first check's
finding 2). A list that fits 4.60 keeps it, so every saved lesson that draws
today draws the same. The panel's right
edge stays put; each template's question, reference, card and working widths
give up what the panel takes (`panelWidening`), from their own coordinates, so
at 4.60 every number is exactly today's. On `maths-turn-sc`, when the panel
has widened and the picture cannot be drawn in its half of the side beside the
working space, the picture goes above the working space instead. The retired
`maths-mtotyt-sc` keeps calling `drawScPanel` with no width and so keeps
today's 4.60 panel.

The dry drawings record nothing (`withoutRecording` in `warnings.js`): no
warning, and none of the findings the build reports as blocking (a picture
under its readable floor, a figure underfilling its zone, a missing picture),
so each is reported once, from the real drawing (the first check's finding 3).

A photograph always draws, so on a widened `maths-turn-sc` it stays beside the
working space and gets smaller; below its readable floor the build reports it
once, as at 4.60 inches. Above the working space it would get at most half the
height, which does not rescue it.

At the widest practice panel, a list that still does not fit is refused with a
pointer to the one shape that can hold more, the half-width split, which is
0.15 inches taller; the offer of "a wider or taller composition" is gone there.
(A list the lesson designer marked too long for every panel is told apart by
the build, not by this refusal: see `c5b_where_the_mark_is_met.py`.)

    python -X utf8 plans/streamline-tools/fit-change/c2_practice_panel_widens.py
"""
from _patch import replace_once

WARN = "builder/src/warnings.js"
MTSC = "builder/src/templates/maths-turn-sc.js"
REF = "builder/src/templates/maths-turn-ref-sc.js"
YT = "builder/src/templates/maths-your-turn-sc.js"
WR = "builder/src/templates/writing-turn-ref-sc.js"

# ── warnings.js: a measurement nobody sees raises nothing ─────────────────────
replace_once(WARN, """const warnings = [];

function warn(slideIndex, message) {
  const tag""", """const warnings = [];
let quiet = 0;

function warn(slideIndex, message) {
  if (quiet) return;
  const tag""")

replace_once(WARN, """function note(message) {
  const full""", """function note(message) {
  if (quiet) return;
  const full""")

replace_once(WARN, """module.exports = { warn, note, getWarnings, clearWarnings, restoreWarnings };""",
"""// Run a measurement that draws onto a slide nobody will see, recording nothing
// it raises: no warning, printed or kept, and none of the findings the build
// reports as blocking (the picture floor, a figure underfilling its zone, a
// missing picture), whose stores ask `recording()` before they keep one.
//
// A template that tries its success-criteria panel at a few widths, or tries a
// picture beside its working space, draws them each time, and every try would
// raise the same things as the real drawing. The real drawing raises them once,
// when it happens; the tries raise nothing.
function withoutRecording(fn) {
  quiet += 1;
  try {
    return fn();
  } finally {
    quiet -= 1;
  }
}

function recording() {
  return quiet === 0;
}

module.exports = { warn, note, getWarnings, clearWarnings, restoreWarnings, withoutRecording, recording };""")

# The finding stores keep nothing a dry drawing raises.
IMAGE = "builder/src/content/image.js"
FILL = "builder/src/content/_zone-fill.js"
replace_once(IMAGE, """const { warn } = require('../warnings');""", """const { warn, recording } = require('../warnings');""")
replace_once(IMAGE, """    if (imageData.essential === false) return;
    const slideNumber = ctx && Number.isInteger(ctx.slideIndex) ? ctx.slideIndex + 1 : undefined;
    missingPictures.set(JSON.stringify([slideNumber, raw]), {""", """    if (imageData.essential === false) return;
    const slideNumber = ctx && Number.isInteger(ctx.slideIndex) ? ctx.slideIndex + 1 : undefined;
    if (recording()) missingPictures.set(JSON.stringify([slideNumber, raw]), {""")
replace_once(IMAGE, """  warn(ctx.slideIndex, message);
  floorFindings.push({
    signal: 'PICTURE_BELOW_READABLE_FLOOR',""", """  warn(ctx.slideIndex, message);
  if (!recording()) return;
  floorFindings.push({
    signal: 'PICTURE_BELOW_READABLE_FLOOR',""")
replace_once(FILL, """const findings = [];
""", """const { recording } = require('../warnings');

const findings = [];
""")
replace_once(FILL, """function checkZoneFill(ctx, zone, drawn, label) {
  if (!ctx || typeof ctx.slideIndex !== 'number') return;""", """function checkZoneFill(ctx, zone, drawn, label) {
  if (!ctx || typeof ctx.slideIndex !== 'number') return;
  // A drawing nobody will see (a template trying a width) records nothing.
  if (!recording()) return;""")

# At the widest practice panel, the refusal points at the one taller shape.
PANEL = "builder/src/success-criteria-panel.js"
STEPS = "builder/src/content/steps.js"
replace_once(PANEL, """      // Tells the steps helper this list is a criteria panel, whose card
      // height does not grow when the list is short (see steps.js).
      criteriaPanel: true,""", """      // Tells the steps helper this list is a criteria panel, whose card
      // height does not grow when the list is short (see steps.js).
      criteriaPanel: true,
      // A practice template's panel at the widest it goes, so a refusal names
      // the one shape that can hold more (see steps.js).
      widestPracticePanel: !!zone.widestPracticePanel,""")
replace_once(STEPS, """function overloadMessage(steps, index, budget, sourceAuthored) {""",
"""function overloadMessage(steps, index, budget, sourceAuthored, widestPracticePanel) {""")
replace_once(STEPS, """  const roomier =
    `Give the panel more room instead: a wider or taller \\`sc-panel\\` ` +
    `composition up to half the slide, never fewer criteria. See ` +
    `\\`slide-success-criteria.md\\`.`;""", """  //
  // A practice template's panel refused at its widest has only one taller
  // shape left within half the slide, so it is named rather than "a wider or
  // taller composition", which there is not.
  const roomier = widestPracticePanel
    ? `The practice panel is already as wide as it goes. Give the list more ` +
      `room instead: the half-width split (\\`split-h-50-50\\`) with the criteria ` +
      `in an \\`sc-panel\\` down one whole side is a little taller and can hold ` +
      `what this panel cannot, never fewer criteria. See ` +
      `\\`slide-success-criteria.md\\`.`
    : `Give the panel more room instead: a wider or taller \\`sc-panel\\` ` +
      `composition up to half the slide, never fewer criteria. See ` +
      `\\`slide-success-criteria.md\\`.`;""")
steps_calls = [
    ("""          steps.findIndex(isReferenceStep),
          undefined,
          zone.sourceAuthoredText
        )""", """          steps.findIndex(isReferenceStep),
          undefined,
          zone.sourceAuthoredText,
          zone.widestPracticePanel
        )"""),
    ("""          textNeed.indexOf(Math.max(...textNeed)),
          undefined,
          zone.sourceAuthoredText
        )""", """          textNeed.indexOf(Math.max(...textNeed)),
          undefined,
          zone.sourceAuthoredText,
          zone.widestPracticePanel
        )"""),
    ("""          textOf(steps[overloadedAt])
        ),
        zone.sourceAuthoredText
      )""", """          textOf(steps[overloadedAt])
        ),
        zone.sourceAuthoredText,
        zone.widestPracticePanel
      )"""),
    ("""            textOf(steps[i])
          ),
          zone.sourceAuthoredText
        )""", """            textOf(steps[i])
          ),
          zone.sourceAuthoredText,
          zone.widestPracticePanel
        )"""),
]
for old, new in steps_calls:
    replace_once(STEPS, old, new)

# ── maths-turn-sc.js: the shared choice, and the picture above the work ───────
replace_once(MTSC, """const { drawSuccessCriteriaPanel } = require('../success-criteria-panel');
""", """const { drawSuccessCriteriaPanel } = require('../success-criteria-panel');
const { withoutRecording } = require('../warnings');
const requireGlobal = require('../require-global');
""")

replace_once(MTSC, """const SC_W           = 4.60;
const SC_H           = 6.50;
""", """const SC_W           = 4.60;
const SC_H           = 6.50;
// The widths the panel may take, narrowest first. It keeps 4.60 unless the
// whole list needs more to read at 18pt; 6.35 is 41% of the slide, inside the
// teacher's half-slide limit. Its right edge stays where it is, and the
// question and working side give up what the panel takes.
const SC_WIDTHS      = [SC_W, 5.50, 6.35];
""")

replace_once(MTSC, """                                    // reads as one crowded block   // gap between the (now content-sized) question box and the visual below it
// ─── END COORDINATES ──────────────────────────────────────────
""", """                                    // reads as one crowded block   // gap between the (now content-sized) question box and the visual below it
const STACKED_PICTURE_SHARE = 0.5;  // the most of the height a picture above the working space takes
// ─── END COORDINATES ──────────────────────────────────────────
""")

replace_once(MTSC, """function drawMathsTurnSc(pptx, slide, data, ctx) {
  const titleOverride = data.title || 'My Turn';""", """function drawMathsTurnSc(pptx, slide, data, ctx) {
  // The panel's width comes first: the question and working side take what it
  // leaves, and a list no width holds is refused before anything is drawn.
  const panelW = scPanelWidth(data, ctx);
  const qW     = Q_W - panelWidening(panelW);
  const workW  = WORK_W - panelWidening(panelW);

  const titleOverride = data.title || 'My Turn';""")

replace_once(MTSC, """  const naturalQH = measureQuestionsHeight(questions, Q_W, null, qOptions);""",
"""  const naturalQH = measureQuestionsHeight(questions, qW, null, qOptions);""")

replace_once(MTSC, """  const baseVisualY = questions.length ? (Q_Y + baseQH + Q_VISUAL_GAP) : Q_Y;
  const baseVisualH = Q_BOTTOM - baseVisualY;
  const visWidth    = noWork ? WORK_W : (WORK_W - VISUAL_GAP) / 2;

  let qH = baseQH;
  let questionFont;

  if (questions.length && data.questionVisual && baseVisualH > 0) {""", """  const baseVisualY = questions.length ? (Q_Y + baseQH + Q_VISUAL_GAP) : Q_Y;
  const baseVisualH = Q_BOTTOM - baseVisualY;

  // A picture beside the working space gets half of what the panel leaves.
  // When the panel has widened and the picture cannot be drawn in that half (a
  // number line is refused in a column much under today's 3.9in), it goes above
  // the working space instead, across the whole side, as the reference does on
  // `maths-turn-ref-sc`. At today's width nothing moves. A photograph always
  // draws, so it stays beside and gets smaller, and below its readable floor
  // the build reports it as it would at 4.60in: above, it would get at most
  // half the height, which does not rescue it.
  const besideW  = (workW - VISUAL_GAP) / 2;
  const stacked  = !noWork && !!data.questionVisual && panelW > SC_W &&
    !drawsIn(data.questionVisual, { x: WORK_X, y: baseVisualY, w: besideW, h: baseVisualH, class: 'C' }, ctx);
  const visWidth = noWork || stacked ? workW : besideW;

  let qH = baseQH;
  let questionFont;

  if (questions.length && data.questionVisual && baseVisualH > 0 && !stacked) {""")

replace_once(MTSC, """        questionFont = largestQuestionFont(questions, Q_W, qH, qOptions);
        // Take only the height the larger type genuinely needs. Growing the box
        // past the text would just move the band of nothing inside the card.
        qH = Math.min(qH, measureQuestionsHeight(questions, Q_W, questionFont, qOptions));""",
"""        questionFont = largestQuestionFont(questions, qW, qH, qOptions);
        // Take only the height the larger type genuinely needs. Growing the box
        // past the text would just move the band of nothing inside the card.
        qH = Math.min(qH, measureQuestionsHeight(questions, qW, questionFont, qOptions));""")

replace_once(MTSC, """  drawQuestions(slide, questions, { x: Q_X, y: Q_Y, w: Q_W, h: qH }, pptx, ctx, {""",
"""  drawQuestions(slide, questions, { x: Q_X, y: Q_Y, w: qW, h: qH }, pptx, ctx, {""")

replace_once(MTSC, """  if (data.questionVisual) {
    const visW = visWidth;
    drawContent(pptx, slide, {
      x: WORK_X, y: visualY, w: visW, h: visualH, class: 'C'
    }, data.questionVisual, ctx);
    if (!noWork) {
      drawWorkingSpace(pptx, slide, {
        x: WORK_X + visW + VISUAL_GAP, y: visualY, w: WORK_W - visW - VISUAL_GAP, h: visualH
      });
    }
  } else if (!noWork) {
    drawWorkingSpace(pptx, slide, { x: WORK_X, y: visualY, w: WORK_W, h: visualH });
  }

  drawScPanel(pptx, slide, data, ctx);
}

// The panel geometry (surface, label, compact white cards, flipchart signal)
// is the shared success-criteria panel: one identity for the template route
// and the sc-panel content type alike.
function drawScPanel(pptx, slide, data, ctx) {
  drawSuccessCriteriaPanel(
    pptx,
    slide,
    { x: SC_X, y: SC_Y, w: SC_W, h: SC_H },
    data,
    ctx
  );
}

module.exports = { drawMathsTurnSc, drawScPanel };""", """  if (data.questionVisual && stacked) {
    // The picture takes the height it measures, at most half, and the working
    // space the rest; a picture that cannot say takes the half.
    const pictureMax = visualH * STACKED_PICTURE_SHARE;
    const wanted = measureCompositionExtent(
      { x: WORK_X, y: visualY, w: workW, h: pictureMax, class: 'C' },
      data.questionVisual,
      ctx
    );
    const pictureH = wanted ? Math.min(wanted.h, pictureMax) : pictureMax;
    drawContent(pptx, slide, {
      x: WORK_X, y: visualY, w: workW, h: pictureH, class: 'C'
    }, data.questionVisual, ctx);
    drawWorkingSpace(pptx, slide, {
      x: WORK_X, y: visualY + pictureH + VISUAL_GAP, w: workW, h: visualH - pictureH - VISUAL_GAP
    });
  } else if (data.questionVisual) {
    const visW = visWidth;
    drawContent(pptx, slide, {
      x: WORK_X, y: visualY, w: visW, h: visualH, class: 'C'
    }, data.questionVisual, ctx);
    if (!noWork) {
      drawWorkingSpace(pptx, slide, {
        x: WORK_X + visW + VISUAL_GAP, y: visualY, w: workW - visW - VISUAL_GAP, h: visualH
      });
    }
  } else if (!noWork) {
    drawWorkingSpace(pptx, slide, { x: WORK_X, y: visualY, w: workW, h: visualH });
  }

  drawScPanel(pptx, slide, data, ctx, panelW);
}

// The practice panel's width, one choice for every `*-sc` template: the
// narrowest of SC_WIDTHS at which the whole list fits at 18pt or more. A list
// that fits 4.60 keeps it, so a lesson that draws today draws the same (the
// teacher chose 18pt, not 20pt, as the trigger on 23 September 2026 for exactly
// that).
//
// Each width is tried by drawing the panel onto a slide nobody sees, with the
// same code that draws it for real, so the choice and the drawing cannot
// disagree. Only the list not fitting (`STEP_TEXT_OVERLOAD`, the step fitter's
// refusal) moves it to the next width: he agreed a box that widens when a list
// needs it, so anything else the panel refuses, a fraction wall too shallow in
// a criteria stack say, is raised at the width it happened. Either way the
// refusal is raised before anything else is drawn: the slide is refused for
// what is in its panel, not for whatever was squeezed beside it, and a list no
// width holds is refused by the numbers of the widest card it had.
function scPanelWidth(data, ctx) {
  const PptxGenJS = requireGlobal('pptxgenjs');
  const dry = new PptxGenJS();
  for (const w of SC_WIDTHS) {
    try {
      withoutRecording(() => drawSuccessCriteriaPanel(dry, dry.addSlide(), scPanelZone(w), data, ctx));
      return w;
    } catch (err) {
      const listDoesNotFit = /^STEP_TEXT_OVERLOAD:/.test(String(err && err.message));
      if (!listDoesNotFit || w === SC_WIDTHS[SC_WIDTHS.length - 1]) throw err;
    }
  }
  return SC_W;
}

// How much wider than 4.60 the panel is: what the question, reference, cards
// and working space beside it give up.
function panelWidening(panelW) {
  return panelW - SC_W;
}

function scPanelZone(panelW) {
  return {
    x: SC_X - panelWidening(panelW), y: SC_Y, w: panelW, h: SC_H,
    widestPracticePanel: panelW === SC_WIDTHS[SC_WIDTHS.length - 1]
  };
}

// Whether content can be drawn in a zone at all, found by drawing it onto a
// slide nobody sees.
function drawsIn(content, zone, ctx) {
  const PptxGenJS = requireGlobal('pptxgenjs');
  const dry = new PptxGenJS();
  try {
    withoutRecording(() => drawContent(dry, dry.addSlide(), zone, content, ctx));
    return true;
  } catch (err) {
    return false;
  }
}

// The panel geometry (surface, label, compact white cards, flipchart signal)
// is the shared success-criteria panel: one identity for the template route
// and the sc-panel content type alike. With no width it keeps today's 4.60,
// which the retired `maths-mtotyt-sc` relies on.
function drawScPanel(pptx, slide, data, ctx, panelW = SC_W) {
  drawSuccessCriteriaPanel(pptx, slide, scPanelZone(panelW), data, ctx);
}

module.exports = { drawMathsTurnSc, drawScPanel, scPanelWidth, panelWidening };""")

# ── maths-turn-ref-sc.js ──────────────────────────────────────────────────────
replace_once(REF, """const { drawScPanel } = require('./maths-turn-sc');""",
"""const { drawScPanel, scPanelWidth, panelWidening } = require('./maths-turn-sc');""")

replace_once(REF, """// SC zone is identical to `maths-turn-sc` and is delegated to that
// module's drawScPanel — keeps the two templates aligned automatically.""",
"""// SC zone is identical to `maths-turn-sc` and is delegated to that
// module's drawScPanel, which keeps the two templates aligned automatically,
// its width included: the left side gives up what the panel takes.""")

replace_once(REF, """function drawMathsTurnRefSc(pptx, slide, data, ctx) {
  const titleOverride = data.title || 'My Turn';""", """function drawMathsTurnRefSc(pptx, slide, data, ctx) {
  const panelW   = scPanelWidth(data, ctx);
  const widening = panelWidening(panelW);

  const titleOverride = data.title || 'My Turn';""")

replace_once(REF, """  drawQuestions(slide, questions, { x: Q_X, y: Q_Y, w: Q_W, h: Q_H }, pptx, ctx, {
    questionNumbering: data.questionNumbering
  });

  // Hiding the ruled working space""", """  drawQuestions(slide, questions, { x: Q_X, y: Q_Y, w: Q_W - widening, h: Q_H }, pptx, ctx, {
    questionNumbering: data.questionNumbering
  });

  // Hiding the ruled working space""")

replace_once(REF, """  drawReferencePanel(pptx, slide, data, ctx, refH);

  if (data.hideWorkingSpace && data.questionVisual) {
    drawContent(
      pptx,
      slide,
      { x: WORK_X, y: WORK_Y, w: WORK_W, h: WORK_H, class: 'A' },
      data.questionVisual,
      ctx
    );
  } else if (!data.hideWorkingSpace) {
    if (data.questionVisual) {
      const visW = (WORK_W - VISUAL_GAP) / 2;
      drawContent(pptx, slide, { x: WORK_X, y: WORK_Y, w: visW, h: WORK_H, class: 'C' }, data.questionVisual, ctx);
      drawWorkingSpace(pptx, slide, { x: WORK_X + visW + VISUAL_GAP, y: WORK_Y, w: WORK_W - visW - VISUAL_GAP, h: WORK_H });
    } else {
      drawWorkingSpace(pptx, slide, { x: WORK_X, y: WORK_Y, w: WORK_W, h: WORK_H });
    }
  }

  drawScPanel(pptx, slide, data, ctx);
}

function drawReferencePanel(pptx, slide, data, ctx, refH = REF_H) {
  const hasLabel = !!data.referenceLabel;

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: REF_X, y: REF_Y, w: REF_W, h: refH,""", """  drawReferencePanel(pptx, slide, data, ctx, refH, REF_W - widening);

  const workW = WORK_W - widening;
  if (data.hideWorkingSpace && data.questionVisual) {
    drawContent(
      pptx,
      slide,
      { x: WORK_X, y: WORK_Y, w: workW, h: WORK_H, class: 'A' },
      data.questionVisual,
      ctx
    );
  } else if (!data.hideWorkingSpace) {
    if (data.questionVisual) {
      const visW = (workW - VISUAL_GAP) / 2;
      drawContent(pptx, slide, { x: WORK_X, y: WORK_Y, w: visW, h: WORK_H, class: 'C' }, data.questionVisual, ctx);
      drawWorkingSpace(pptx, slide, { x: WORK_X + visW + VISUAL_GAP, y: WORK_Y, w: workW - visW - VISUAL_GAP, h: WORK_H });
    } else {
      drawWorkingSpace(pptx, slide, { x: WORK_X, y: WORK_Y, w: workW, h: WORK_H });
    }
  }

  drawScPanel(pptx, slide, data, ctx, panelW);
}

function drawReferencePanel(pptx, slide, data, ctx, refH = REF_H, refW = REF_W) {
  const hasLabel = !!data.referenceLabel;

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: REF_X, y: REF_Y, w: refW, h: refH,""")

replace_once(REF, """    slide.addText(data.referenceLabel, {
      x: REF_X + REF_PAD, y: REF_Y + REF_PAD,
      w: REF_W - 2 * REF_PAD, h: REF_LABEL_H,""", """    slide.addText(data.referenceLabel, {
      x: REF_X + REF_PAD, y: REF_Y + REF_PAD,
      w: refW - 2 * REF_PAD, h: REF_LABEL_H,""")

replace_once(REF, """      y: REF_Y + REF_PAD + labelOffset,
      w: REF_W - 2 * REF_PAD,
      h: refH - 2 * REF_PAD - labelOffset,""", """      y: REF_Y + REF_PAD + labelOffset,
      w: refW - 2 * REF_PAD,
      h: refH - 2 * REF_PAD - labelOffset,""")

# ── maths-your-turn-sc.js ─────────────────────────────────────────────────────
replace_once(YT, """const { drawScPanel } = require('./maths-turn-sc');""",
"""const { drawScPanel, scPanelWidth, panelWidening } = require('./maths-turn-sc');""")

replace_once(YT, """function drawMathsYourTurnSc(pptx, slide, data, ctx) {
  const titleOverride = data.title || 'Your Turn';""", """function drawMathsYourTurnSc(pptx, slide, data, ctx) {
  // The cards give up what the success-criteria panel takes (maths-turn-sc).
  const panelW = scPanelWidth(data, ctx);
  const cardsW = CARDS_W - panelWidening(panelW);

  const titleOverride = data.title || 'Your Turn';""")

replace_once(YT, """    drawContent(pptx, slide, {
      x: CARDS_X, y: CARDS_Y, w: CARDS_W, h: visualH, class: 'C'
    }, data.questionVisual, ctx);
    if (questions.length) {
      drawQuestionCards(pptx, slide, questions, {
        x: CARDS_X, y: CARDS_Y + visualH + VISUAL_GAP, w: CARDS_W, h: CARDS_H - visualH - VISUAL_GAP
      }, ctx, firstLabel(data));
    }
  } else {
    drawQuestionCards(pptx, slide, questions, {
      x: CARDS_X, y: CARDS_Y, w: CARDS_W, h: CARDS_H
    }, ctx, firstLabel(data));
  }

  drawScPanel(pptx, slide, data, ctx);""", """    drawContent(pptx, slide, {
      x: CARDS_X, y: CARDS_Y, w: cardsW, h: visualH, class: 'C'
    }, data.questionVisual, ctx);
    if (questions.length) {
      drawQuestionCards(pptx, slide, questions, {
        x: CARDS_X, y: CARDS_Y + visualH + VISUAL_GAP, w: cardsW, h: CARDS_H - visualH - VISUAL_GAP
      }, ctx, firstLabel(data));
    }
  } else {
    drawQuestionCards(pptx, slide, questions, {
      x: CARDS_X, y: CARDS_Y, w: cardsW, h: CARDS_H
    }, ctx, firstLabel(data));
  }

  drawScPanel(pptx, slide, data, ctx, panelW);""")

# ── writing-turn-ref-sc.js ────────────────────────────────────────────────────
replace_once(WR, """const { drawScPanel } = require('./maths-turn-sc');""",
"""const { drawScPanel, scPanelWidth, panelWidening } = require('./maths-turn-sc');""")

replace_once(WR, """function drawWritingTurnRefSc(pptx, slide, data, ctx) {
  const titleOverride = data.title || 'My Turn';""", """function drawWritingTurnRefSc(pptx, slide, data, ctx) {
  // The question strip and reference give up what the success-criteria panel
  // takes (maths-turn-sc).
  const panelW   = scPanelWidth(data, ctx);
  const widening = panelWidening(panelW);

  const titleOverride = data.title || 'My Turn';""")

replace_once(WR, """  drawQuestions(slide, questions, { x: Q_X, y: Q_Y, w: Q_W, h: Q_H }, pptx, ctx, {
    questionNumbering: data.questionNumbering
  });

  drawReferencePanel(pptx, slide, data, ctx);

  drawScPanel(pptx, slide, data, ctx);
}

function drawReferencePanel(pptx, slide, data, ctx) {
  const hasLabel = !!data.referenceLabel;

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: REF_X, y: REF_Y, w: REF_W, h: REF_H,""", """  drawQuestions(slide, questions, { x: Q_X, y: Q_Y, w: Q_W - widening, h: Q_H }, pptx, ctx, {
    questionNumbering: data.questionNumbering
  });

  drawReferencePanel(pptx, slide, data, ctx, REF_W - widening);

  drawScPanel(pptx, slide, data, ctx, panelW);
}

function drawReferencePanel(pptx, slide, data, ctx, refW = REF_W) {
  const hasLabel = !!data.referenceLabel;

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: REF_X, y: REF_Y, w: refW, h: REF_H,""")

replace_once(WR, """    slide.addText(data.referenceLabel, {
      x: REF_X + REF_PAD, y: REF_Y + REF_PAD,
      w: REF_W - 2 * REF_PAD, h: REF_LABEL_H,""", """    slide.addText(data.referenceLabel, {
      x: REF_X + REF_PAD, y: REF_Y + REF_PAD,
      w: refW - 2 * REF_PAD, h: REF_LABEL_H,""")

replace_once(WR, """      y: REF_Y + REF_PAD + labelOffset,
      w: REF_W - 2 * REF_PAD,
      h: REF_H - 2 * REF_PAD - labelOffset,""", """      y: REF_Y + REF_PAD + labelOffset,
      w: refW - 2 * REF_PAD,
      h: REF_H - 2 * REF_PAD - labelOffset,""")

print("c2: the practice panel widens itself")
