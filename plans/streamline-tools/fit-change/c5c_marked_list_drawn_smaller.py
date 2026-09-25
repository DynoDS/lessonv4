"""His ruling on the last resort, in the fit release (4.2.289): a list the
lesson designer marked too long is drawn a little smaller on a finished,
flagged slide, never left as a blank page.

The fourth check's round (c3, c5b) let a list the lesson designer marked
`tooLongForPanels` through the lesson check, and every slide that showed it
reached the teacher as a blank page to check before teaching. Told so, he said
of fixes in general: "i hardly want things broken so then the agents just go
oh well let's just report it and most of the time I get a finished product
with no finished product at all it should still try to fix it try to repair
it". Asked whether a marked list should instead be drawn a little smaller,
down to 16 point, on a finished, flagged slide, with his class test stated
(20 point the smallest everyone could read; 16 "really close to that limit"),
he answered "agree." The 18 point floor stands for everything else, unmarked
lists included. Runs after c5b, on the text c3 and c5b wrote.

- `builder/src/content/steps.js`: the step fitter takes its floor from the
  zone (`floorPt`, 18 unless the panel lowers it), in every measure, every
  refusal and the final fit's floor on each line; a list laid out under 18pt
  is recorded as a finding instead of the "within the 18pt floor" warning,
  and its lines are named `marked-` for the final fit.
- `builder/src/success-criteria-panel.js`: for a marked list (known by its
  words, `marked-criteria.js`), the panel draws at the largest floor from 18
  down to 16 at which the list fits, found by drawing it onto a slide nobody
  sees; on a practice template only at its widest, because the template tries
  its wider widths at 18pt first.
- `builder/src/templates/maths-turn-sc.js`: the practice panel's zone says it
  is one, so the panel knows when it is not yet at its widest.
- `builder/build.js`: the marked lists go into every slide's context; a marked
  list drawn under 18pt is a flagged finding (`CRITERIA_BELOW_READABLE_FLOOR`,
  `faultClass: "content"`), so the slide is finished, named for the teacher to
  check, and left alone by the slide designer; a marked list still refused is
  the slide designer's to move when the practice panel at its widest or the
  half-width split holds it at 16pt, and only when neither does (the rarest
  case) is it the design's, a page for the teacher to check.
- `builder/scripts/fit_text_postprocess.py`: the final text fit honours a
  lower floor only on a marked list's lines, and never under 16pt.
- `scripts/validate-lesson-design.py`: a marked list passes only if it fits at
  16pt in the practice panel at its widest or the half-width side; one too
  long even then is refused, so the designer tightens it at least that far.
  Every refusal states the true cost.
- `scripts/design-review-packet.py`, `references/output-template.md`,
  `agents/lesson-designer.md`, `references/slide-success-criteria.md`: the
  true cost where the old one was written.

    python -X utf8 plans/streamline-tools/fit-change/c5c_marked_list_drawn_smaller.py
"""
from _patch import replace_once

STEPS = "builder/src/content/steps.js"
PANEL = "builder/src/success-criteria-panel.js"
TURN_SC = "builder/src/templates/maths-turn-sc.js"
BUILD = "builder/build.js"
FIT = "builder/scripts/fit_text_postprocess.py"
V = "scripts/validate-lesson-design.py"
PACKET = "scripts/design-review-packet.py"
OT = "references/output-template.md"
LD = "agents/lesson-designer.md"
SSC = "references/slide-success-criteria.md"

# ─── The step fitter: its floor comes from the zone ──────────────────────────

replace_once(STEPS, """const { warn } = require('../warnings');
""", """const { warn } = require('../warnings');
const { recordCriteriaBelowFloor } = require('../marked-criteria');
""")

replace_once(STEPS, """const TEXT_FONT_TARGET = 20;
const TEXT_FONT_MIN    = 18;
const TEXT_FONT_MAX    = 36;
""", """const TEXT_FONT_TARGET = 20;
const TEXT_FONT_MIN    = 18;
const TEXT_FONT_MAX    = 36;
// The floor is the zone's to lower, and only one zone does: a success-criteria
// panel holding a list the lesson designer marked too long for every panel,
// which is drawn at the largest size that fits there, down to 16pt, on a slide
// flagged for the teacher (success-criteria-panel.js, marked-criteria.js).
// Every other list keeps TEXT_FONT_MIN, and every function below that takes a
// floor defaults to it.
""")

replace_once(STEPS, """function largestStepFont(text, widthIn, heightIn) {
  for (let pt = TEXT_FONT_MAX; pt >= TEXT_FONT_MIN; pt -= 1) {""", """function largestStepFont(text, widthIn, heightIn, floorPt = TEXT_FONT_MIN) {
  for (let pt = TEXT_FONT_MAX; pt >= floorPt; pt -= 1) {""")

replace_once(STEPS, """  const floorLines = wrappedLineCount(text, usableWidth(widthIn), TEXT_FONT_MIN);
  if (floorLines * (TEXT_FONT_MIN / 72) * 1.28 <= usableHeight(heightIn) + FLOOR_ROUNDING) {
    return TEXT_FONT_MIN;
  }""", """  const floorLines = wrappedLineCount(text, usableWidth(widthIn), floorPt);
  if (floorLines * (floorPt / 72) * 1.28 <= usableHeight(heightIn) + FLOOR_ROUNDING) {
    return floorPt;
  }""")

replace_once(STEPS, """function budgetSentence(widthIn, heightIn, text) {""",
             """function budgetSentence(widthIn, heightIn, text, floorPt = TEXT_FONT_MIN) {""")

replace_once(STEPS, """  const perChar = shown.length ? lineWidthIn(shown, TEXT_FONT_MIN) / shown.length : 0;""",
             """  const perChar = shown.length ? lineWidthIn(shown, floorPt) / shown.length : 0;""")

replace_once(STEPS, """  const oneLine = (TEXT_FONT_MIN / 72) * 1.28;""", """  const oneLine = (floorPt / 72) * 1.28;""")

replace_once(STEPS, """      `${TEXT_FONT_MIN}pt needs ${needs.toFixed(2)}in, so it holds no line at ` +""",
             """      `${floorPt}pt needs ${needs.toFixed(2)}in, so it holds no line at ` +""")

replace_once(STEPS, """  const takes = wrappedLineCount(text, usableWidth(widthIn), TEXT_FONT_MIN);""",
             """  const takes = wrappedLineCount(text, usableWidth(widthIn), floorPt);""")

replace_once(STEPS, """  return `The card holds about ${budget} characters at ${TEXT_FONT_MIN}pt ` +""",
             """  return `The card holds about ${budget} characters at ${floorPt}pt ` +""")

replace_once(STEPS, """function overloadMessage(steps, index, budget, sourceAuthored, widestPracticePanel) {
  const reference = isReferenceStep(steps[index]);""", """function overloadMessage(steps, index, budget, sourceAuthored, widestPracticePanel, floorPt = TEXT_FONT_MIN) {
  const reference = isReferenceStep(steps[index]);
  // A list marked too long is refused only below the least it may be drawn
  // at, which is not the readable minimum every other list keeps.
  const floor = floorPt < TEXT_FONT_MIN
    ? `the ${floorPt}pt a list marked too long may be drawn at`
    : `the ${TEXT_FONT_MIN}pt readable minimum`;""")

replace_once(STEPS, """      `fit its card at the ${TEXT_FONT_MIN}pt readable minimum.${room} Its ` +""",
             """      `fit its card at ${floor}.${room} Its ` +""")

replace_once(STEPS, """        `the ${TEXT_FONT_MIN}pt readable minimum.${room} Its wording is the ` +""",
             """        `${floor}.${room} Its wording is the ` +""")

replace_once(STEPS, """    : `STEP_TEXT_OVERLOAD: step ${stepNumber} does not fit its card at the ` +
        `${TEXT_FONT_MIN}pt readable minimum.${room} Shorten the step to that, ` +""",
             """    : `STEP_TEXT_OVERLOAD: step ${stepNumber} does not fit its card at ` +
        `${floor}.${room} Shorten the step to that, ` +""")

replace_once(STEPS, """// The height a step or a sticky line needs at the readable floor, its card's
// gap included: the least room it can be given without being refused.
function floorNeed(text, rows) {
  return wrappedLineCount(text, usableWidth(Math.max(0.3, rows.stepTextW)), TEXT_FONT_MIN)
    * (TEXT_FONT_MIN / 72) * 1.28 + FIT_PAD_H + rows.rowGapForFit;
}""", """// The height a step or a sticky line needs at the floor, its card's gap
// included: the least room it can be given without being refused.
function floorNeed(text, rows, floorPt = TEXT_FONT_MIN) {
  return wrappedLineCount(text, usableWidth(Math.max(0.3, rows.stepTextW)), floorPt)
    * (floorPt / 72) * 1.28 + FIT_PAD_H + rows.rowGapForFit;
}""")

replace_once(STEPS, """  const innerW = zone.w - PAD_LEFT - PAD;
  let   innerH = zone.h - 2 * PAD;
""", """  const innerW = zone.w - PAD_LEFT - PAD;
  let   innerH = zone.h - 2 * PAD;
  // The readable floor, unless this is a criteria panel holding a list marked
  // too long, whose panel has lowered it (see the constants above).
  const floorPt = Number.isFinite(zone.floorPt) ? zone.floorPt : TEXT_FONT_MIN;
  const drawnSmaller = floorPt < TEXT_FONT_MIN;
""")

replace_once(STEPS, """      const floorTotal = steps.reduce((total, s) => total + floorNeed(textOf(s), shortRows), 0);""",
             """      const floorTotal = steps.reduce((total, s) => total + floorNeed(textOf(s), shortRows, floorPt), 0);""")

replace_once(STEPS, """      ? wrappedLineCount(textOf(s), usableWidth(Math.max(0.3, stepTextW)), TEXT_FONT_MIN)
          * (TEXT_FONT_MIN / 72) * 1.28 + FIT_PAD_H""", """      ? wrappedLineCount(textOf(s), usableWidth(Math.max(0.3, stepTextW)), floorPt)
          * (floorPt / 72) * 1.28 + FIT_PAD_H""")

replace_once(STEPS, """  const stepFloorNeed = steps.map((s) => (isReferenceStep(s) ? 0 : floorNeed(textOf(s), rows)));""",
             """  const stepFloorNeed = steps.map((s) => (isReferenceStep(s) ? 0 : floorNeed(textOf(s), rows, floorPt)));""")

replace_once(STEPS, """        Math.max(0.1, stepShareAtRefFloor - rowGapForFit)
      );""", """        Math.max(0.1, stepShareAtRefFloor - rowGapForFit),
        floorPt
      );""")

replace_once(STEPS, """          steps.findIndex(isReferenceStep),
          undefined,
          zone.sourceAuthoredText,
          zone.widestPracticePanel
        )""", """          steps.findIndex(isReferenceStep),
          undefined,
          zone.sourceAuthoredText,
          zone.widestPracticePanel,
          floorPt
        )""")

replace_once(STEPS, """          textNeed.indexOf(Math.max(...textNeed)),
          undefined,
          zone.sourceAuthoredText,
          zone.widestPracticePanel
        )""", """          textNeed.indexOf(Math.max(...textNeed)),
          undefined,
          zone.sourceAuthoredText,
          zone.widestPracticePanel,
          floorPt
        )""")

replace_once(STEPS, """  const perStepFont = steps.map((s, i) =>
    largestStepFont(textOf(s), Math.max(0.3, stepTextW), Math.max(0.1, fitHeights[i]))
  );""", """  const perStepFont = steps.map((s, i) =>
    largestStepFont(textOf(s), Math.max(0.3, stepTextW), Math.max(0.1, fitHeights[i]), floorPt)
  );""")

replace_once(STEPS, """          Math.max(0.1, fitHeights[overloadedAt]),
          textOf(steps[overloadedAt])
        ),
        zone.sourceAuthoredText,
        zone.widestPracticePanel
      )""", """          Math.max(0.1, fitHeights[overloadedAt]),
          textOf(steps[overloadedAt]),
          floorPt
        ),
        zone.sourceAuthoredText,
        zone.widestPracticePanel,
        floorPt
      )""")

replace_once(STEPS, """  // Codex run recorded four panels at 18pt as an accepted minor issue and
  // nothing told it which step was doing it (19 September 2026).
  if (zone.criteriaPanel && sharedFont < TEXT_FONT_TARGET && ctx && ctx.slideIndex !== undefined) {""",
             """  // Codex run recorded four panels at 18pt as an accepted minor issue and
  // nothing told it which step was doing it (19 September 2026). A list set
  // under the floor is not "within" it: that is a list marked too long, and it
  // is recorded as a finding once it is drawn (below).
  if (zone.criteriaPanel && sharedFont < TEXT_FONT_TARGET && sharedFont >= TEXT_FONT_MIN &&
      ctx && ctx.slideIndex !== undefined) {""")

replace_once(STEPS, """    const fits = largestStepFont(
      textOf(steps[i]),
      Math.max(0.3, availableW),
      Math.max(0.1, fitHeights[i])
    );""", """    const fits = largestStepFont(
      textOf(steps[i]),
      Math.max(0.3, availableW),
      Math.max(0.1, fitHeights[i]),
      floorPt
    );""")

replace_once(STEPS, """            Math.max(0.1, fitHeights[i]),
            textOf(steps[i])
          ),
          zone.sourceAuthoredText,
          zone.widestPracticePanel
        )""", """            Math.max(0.1, fitHeights[i]),
            textOf(steps[i]),
            floorPt
          ),
          zone.sourceAuthoredText,
          zone.widestPracticePanel,
          floorPt
        )""")

replace_once(STEPS, """  const cardPad   = itemCards ? P.pad : 0;

  let stepNum = 0;""", """  const cardPad   = itemCards ? P.pad : 0;

  // The final text fit holds each line to the floor its name carries, so a
  // list drawn under the readable floor names its lines as a marked list's,
  // the only lines that fit may take below 18pt (fit_text_postprocess.py).
  const lineName = (label, i) => drawnSmaller
    ? growFitObjectName(stepTextGroup, TEXT_FONT_MAX, 'marked-' + label + i, floorPt)
    : growFitObjectName(stepTextGroup, TEXT_FONT_MAX, label + i, label === 'step-text-' ? TEXT_FONT_MIN : undefined);
  let smallestDrawn = Infinity;

  let stepNum = 0;""")

replace_once(STEPS, """      const shown = starW ? step.text.replace(/^\\s*✨\\s*/, '') : step.text;
      slide.addText(splitAnswerRuns(shown, true), {""", """      const shown = starW ? step.text.replace(/^\\s*✨\\s*/, '') : step.text;
      smallestDrawn = Math.min(smallestDrawn, textFont);
      slide.addText(splitAnswerRuns(shown, true), {""")

replace_once(STEPS, """        objectName: growFitObjectName(stepTextGroup, TEXT_FONT_MAX, 'step-reference-' + i)
      });""", """        objectName: lineName('step-reference-', i)
      });""")

replace_once(STEPS, """    slide.addText(splitAnswerRuns(step.text, true), {
      x: textX, y: rowY,
      w: textW, h: cardH,
      fontFace: FONT, fontSize: textFont, bold: true,
      color: COLOURS.body,
      align: 'left', valign: 'middle', margin: 0, fit: FIT,
      objectName: growFitObjectName(stepTextGroup, TEXT_FONT_MAX, 'step-text-' + i, TEXT_FONT_MIN)
    });
  });
}

module.exports = { drawSteps };""", """    smallestDrawn = Math.min(smallestDrawn, textFont);
    slide.addText(splitAnswerRuns(step.text, true), {
      x: textX, y: rowY,
      w: textW, h: cardH,
      fontFace: FONT, fontSize: textFont, bold: true,
      color: COLOURS.body,
      align: 'left', valign: 'middle', margin: 0, fit: FIT,
      objectName: lineName('step-text-', i)
    });
  });

  // A list the lesson designer marked too long, drawn under the readable
  // floor: finished, and named for the teacher to check before teaching.
  if (drawnSmaller && smallestDrawn < TEXT_FONT_MIN) {
    recordCriteriaBelowFloor(ctx, smallestDrawn, steps.map(textOf).filter((t) => !/^\\s*✨/.test(t)));
  }
}

module.exports = { drawSteps, TEXT_FONT_MIN };""")

# ─── The panel: a marked list goes as small as it must, down to 16pt ─────────

replace_once(PANEL, """const { FONT, FIT } = require('./styles');
const { warn } = require('./warnings');""", """const { FONT, FIT } = require('./styles');
const { warn, withoutRecording } = require('./warnings');
const { isMarkedList, markedListFloor } = require('./marked-criteria');
const requireGlobal = require('./require-global');""")

replace_once(PANEL, """    const hadBarrier = !!ctx._cardBarrier;
    ctx._cardBarrier = content.type !== 'steps';
    try {
      drawContent(pptx, slide, contentZone, content, ctx);
    } finally {""", """    const hadBarrier = !!ctx._cardBarrier;
    ctx._cardBarrier = content.type !== 'steps';
    try {
      // A list the lesson designer marked too long for every criteria panel
      // (`tooLongForPanels`) is drawn smaller rather than not at all: at the
      // largest floor from 18pt down to 16pt at which it fits, found by drawing
      // it onto a slide nobody sees, and the build flags the slide for the
      // teacher (his ruling of 24 September 2026). Only where this panel is as
      // roomy as its route makes it: a practice template tries its wider widths
      // at 18pt first (maths-turn-sc.js), so its panel goes smaller only at its
      // widest. Every other list keeps the 18pt floor.
      if (content.type === 'steps' && isMarkedList(content.steps, ctx.markedCriteria) &&
          (!zone.practicePanel || zone.widestPracticePanel)) {
        const PptxGenJS = requireGlobal('pptxgenjs');
        contentZone.floorPt = markedListFloor((floorPt) => {
          const dry = new PptxGenJS();
          withoutRecording(() => drawContent(dry, dry.addSlide(), Object.assign({}, contentZone, { floorPt }), content, ctx));
        });
      }
      drawContent(pptx, slide, contentZone, content, ctx);
    } finally {""")

# ─── The practice panel says it is one ────────────────────────────────────────

replace_once(TURN_SC, """function scPanelZone(panelW) {
  return {
    x: SC_X - panelWidening(panelW), y: SC_Y, w: panelW, h: SC_H,
    widestPracticePanel: panelW === SC_WIDTHS[SC_WIDTHS.length - 1]
  };
}""", """function scPanelZone(panelW) {
  return {
    x: SC_X - panelWidening(panelW), y: SC_Y, w: panelW, h: SC_H,
    // A list marked too long goes under 18pt only at the widest (see
    // success-criteria-panel.js): below it, the next width comes first.
    practicePanel: true,
    widestPracticePanel: panelW === SC_WIDTHS[SC_WIDTHS.length - 1]
  };
}""")

# ─── The build: the marked lists in every slide's context, and the flag ──────

replace_once(BUILD, """const { markedCriteriaLists, showsMarkedList, MARKED_TOO_LONG_MESSAGE } = require('./src/marked-criteria');""",
             """const {
  markedCriteriaLists,
  showsMarkedList,
  markedListRoom,
  criteriaBelowFloorFindings,
  clearCriteriaBelowFloor,
  MARKED_TOO_LONG_MESSAGE,
} = require('./src/marked-criteria');""")

replace_once(BUILD, """  'PICTURE_BELOW_READABLE_FLOOR',
  'FIXED_CAPTION_CAPACITY',""", """  'PICTURE_BELOW_READABLE_FLOOR',
  'FIXED_CAPTION_CAPACITY',
  // A list the lesson designer marked too long, drawn under 18pt: a finished
  // slide, which the teacher checks before teaching (marked-criteria.js).
  'CRITERIA_BELOW_READABLE_FLOOR',""")

replace_once(BUILD, """  const sharedFigures = createSharedFigureStore();
  const contextForSlide = (i) => ({ sharedFigures, slideIndex: i, """, """  const sharedFigures = createSharedFigureStore();
  // The lists the lesson design beside this file marks too long for every
  // criteria panel, which a criteria panel draws smaller, down to 16pt, rather
  // than not at all (marked-criteria.js).
  const markedCriteria = markedCriteriaLists(jsonPath);
  const contextForSlide = (i) => ({ sharedFigures, markedCriteria, slideIndex: i, """)

replace_once(BUILD, """    // A slide whose criteria are a list the lesson designer marked too long
    // for every panel is refused as the design's, not as a composition fault:
    // no layout holds it, so the slide designer leaves it (marked-criteria.js).
    const marked = markedCriteriaLists(jsonPath);
    for (const error of preflight.errors) {
      const designs = error.signal === 'STEP_TEXT_OVERLOAD' &&
        showsMarkedList(coreSlides[error.slide - 1], marked);""", """    // A list the lesson designer marked too long is drawn smaller, down to
    // 16pt, so one still refused is the slide designer's to move while the
    // practice panel at its widest or the half-width split holds it at 16pt.
    // Only when neither does is it the design's, not a composition fault: no
    // layout holds it, so the slide designer leaves it (marked-criteria.js).
    for (const error of preflight.errors) {
      const designs = error.signal === 'STEP_TEXT_OVERLOAD' &&
        showsMarkedList(coreSlides[error.slide - 1], markedCriteria) &&
        !markedListRoom(coreSlides[error.slide - 1], contextForSlide(error.slide - 1));""")

replace_once(BUILD, """  clearZoneFill();
  clearPictureFloor();
  clearMissingPictures();
""", """  clearZoneFill();
  clearPictureFloor();
  clearMissingPictures();
  clearCriteriaBelowFloor();
""")

replace_once(BUILD, """  for (const finding of pictureFloorFindings()) {
    diagnostic(
      finding.signal,
      'composition',
      { slide: finding.slide, path: finding.field },
      finding.message
    );
  }
""", """  for (const finding of pictureFloorFindings()) {
    diagnostic(
      finding.signal,
      'composition',
      { slide: finding.slide, path: finding.field },
      finding.message
    );
  }

  // A list the lesson designer marked too long, drawn smaller than 18pt. The
  // slide is finished and flagged for the teacher, and it is the design's to
  // answer for, so the slide designer's own check passes it and leaves it.
  for (const finding of criteriaBelowFloorFindings()) {
    console.error(`  ! slide ${finding.slide}: ${finding.message}`);
    diagnostic(finding.signal, 'content', { slide: finding.slide }, finding.message);
  }
""")

# ─── The final text fit: a lower floor on a marked list's lines only ─────────

replace_once(FIT, """def shape_floor(name, default):
    \"\"\"An explicit projected-reading floor survives the global fitting pass.\"\"\"
    match = re.match(r"^GROWFIT__[^_]+__\\d+__MIN([1-9]\\d{0,2})__", name or "")
    return max(default, int(match.group(1))) if match else default""", """# A success-criteria list the lesson designer marked too long for every panel
# is drawn smaller rather than not at all, down to this, on a slide flagged for
# the teacher (his ruling of 24 September 2026: 20pt the smallest his whole
# class read, 16pt "really close to that limit"). The builder names that list's
# lines `marked-`; every other box keeps the projection floor, which its own
# explicit floor can only raise.
MARKED_LIST_FLOOR_PT = 16


def shape_floor(name, default):
    \"\"\"An explicit projected-reading floor survives the global fitting pass.
    Only a marked list's line may carry one under the default, and never under
    MARKED_LIST_FLOOR_PT.\"\"\"
    match = re.match(r"^GROWFIT__[^_]+__\\d+__MIN([1-9]\\d{0,2})__(.*)$", name or "")
    if not match:
        return default
    explicit = int(match.group(1))
    if explicit < default and match.group(2).startswith("marked-"):
        return max(explicit, MARKED_LIST_FLOOR_PT)
    return max(default, explicit)""")

# ─── The lesson check: a marked list passes only if it fits at 16pt ──────────

replace_once(V, """FLOOR_PT, CARD_SIZE_PT = 18, 36
""", """FLOOR_PT, CARD_SIZE_PT = 18, 36
# The least a list the lesson designer marked too long is drawn at, and where:
# the practice panel at its widest and the half-width side, the two shapes a
# criteria panel draws a marked list smaller in (builder/src/marked-criteria.js).
MARKED_FLOOR_PT = 16
SMALLER_PANELS = NAMED_PANELS[2:]
""")

replace_once(V, """def panel_fit(steps: list[str], panel_w: float, panel_h: float) -> dict[str, Any]:
    \"\"\"Whether a criteria list fits one panel at 18pt, with the lines each step
    takes there and the lines the panel holds for that many steps.\"\"\"""", """def panel_fit(steps: list[str], panel_w: float, panel_h: float, floor_pt: int = FLOOR_PT) -> dict[str, Any]:
    \"\"\"Whether a criteria list fits one panel at its floor, 18pt unless the
    list is marked too long, with the lines each step takes there and the lines
    the panel holds for that many steps.\"\"\"""")

replace_once(V, """        lines = [wrapped_lines(step, usable, FLOOR_PT) for step in steps]
        needs = [count * (FLOOR_PT / 72) * LINE_HEIGHT + FIT_PAD_H + gap for count in lines]""",
             """        lines = [wrapped_lines(step, usable, floor_pt) for step in steps]
        needs = [count * (floor_pt / 72) * LINE_HEIGHT + FIT_PAD_H + gap for count in lines]""")

replace_once(V, """    lines, needs, gap, usable = at(height)
    line_h = (FLOOR_PT / 72) * LINE_HEIGHT
    shown = " ".join(" ".join(shown_criterion(step).split()) for step in steps)
    per_char = line_width_in(shown, FLOOR_PT) / len(shown) if shown else 0""", """    lines, needs, gap, usable = at(height)
    line_h = (floor_pt / 72) * LINE_HEIGHT
    shown = " ".join(" ".join(shown_criterion(step).split()) for step in steps)
    per_char = line_width_in(shown, floor_pt) / len(shown) if shown else 0""")

replace_once(V, """        "roomiest": fits[ROOMIEST_PANEL],
    }


# Decision 11 in his words:""", """        "roomiest": fits[ROOMIEST_PANEL],
    }


def criteria_fit_smaller(steps: list[str]) -> dict[str, Any]:
    \"\"\"Whether a list no named panel holds at 18pt fits once it is drawn
    smaller, as a list marked too long is: the largest floor from 17pt down to
    16pt at which the practice panel at its widest or the half-width side holds
    it, as the builder tries them, with the roomiest one's measure at 16pt for
    a refusal to quote.\"\"\"
    for floor_pt in range(FLOOR_PT - 1, MARKED_FLOOR_PT - 1, -1):
        for name, w, h in SMALLER_PANELS:
            if panel_fit(steps, w, h, floor_pt)["fits"]:
                return {"fits": True, "pt": floor_pt, "holder": name}
    roomiest = next((w, h) for name, w, h in NAMED_PANELS if name == ROOMIEST_PANEL)
    return {"fits": False, "roomiest": panel_fit(steps, *roomiest, MARKED_FLOOR_PT)}


# Decision 11 in his words:""")

replace_once(V, """# Decision 11 in his words: "There is not a time where I want the PowerPoint
# slide deck to never be produced because of an error." A design the validator
# still refuses after the designer's repair passes ends the run with no deck,
# so a list the lesson designer has tightened and still cannot fit is marked on
# the list itself, `tooLongForPanels: true`, and passes. The check reads only
# that mark, never the words of a flag; the designer's reason reaches the
# teacher in `flagsForTeacher`, like any other departure. The slide builder
# reads the same mark (builder/src/marked-criteria.js), so every slide that
# shows the list is delivered as a page for the teacher to check, and the slide
# designer is told to leave it.""", """# Decision 11 in his words: "There is not a time where I want the PowerPoint
# slide deck to never be produced because of an error." A design the validator
# still refuses after the designer's repair passes ends the run with no deck,
# so a list the lesson designer has tightened and still cannot fit is marked on
# the list itself, `tooLongForPanels: true`, and passes if it fits at 16pt in
# the practice panel at its widest or the half-width side. The check reads only
# that mark, never the words of a flag; the designer's reason reaches the
# teacher in `flagsForTeacher`, like any other departure. The slide builder
# reads the same mark (builder/src/marked-criteria.js) and draws the list at the
# largest size that fits, down to 16pt, on a finished slide flagged for the
# teacher to check: his ruling of 24 September 2026, who wants a finished slide
# rather than a blank page ("it should still try to fix it try to repair it").
# A list too long even at 16pt could not be drawn at all, so it is refused,
# marked or not, and the designer tightens it at least that far.""")

replace_once(V, """    \"\"\"Which steps lists no named panel holds, which of those the lesson
    designer has marked too long, and marks on lists the check does not find
    too long.\"\"\"""", """    \"\"\"Which steps lists no named panel holds at 18pt; of those, which are
    unmarked, which the lesson designer has marked too long and fit once drawn
    smaller, and which are marked but too long even at 16pt; and marks on lists
    the check does not find too long.\"\"\"""")

replace_once(V, """        if measured and not entry["fit"]["fits"]:
            too_long.append(entry)
        elif entry["marked"]:
            stale.append(entry)
    return {
        "too_long": too_long,
        "unmarked": [entry for entry in too_long if not entry["marked"]],
        "marked": [entry for entry in too_long if entry["marked"]],
        "stale": stale,
    }""", """        if measured and not entry["fit"]["fits"]:
            entry["smaller"] = criteria_fit_smaller(steps)
            too_long.append(entry)
        elif entry["marked"]:
            stale.append(entry)
    return {
        "too_long": too_long,
        "unmarked": [entry for entry in too_long if not entry["marked"]],
        "marked": [entry for entry in too_long if entry["marked"] and entry["smaller"]["fits"]],
        "beyond_smaller": [entry for entry in too_long if entry["marked"] and not entry["smaller"]["fits"]],
        "stale": stale,
    }""")

replace_once(V, """def validate_criteria_fit_a_named_panel(sc_items: list[Any]) -> None:
    \"\"\"Refuse a steps list none of the panels the guidance names can hold,
    unless the lesson designer, having tried to tighten it, has marked it too
    long: the teacher's decision 11 is that an error never costs the deck, and
    a design the validator refuses at the end of its repair passes ends the run
    with none. Every slide that shows a marked list is then delivered as a
    blank page for the teacher to check.\"\"\"
    unmarked = criteria_fit_status(sc_items)["unmarked"]
    if not unmarked:
        return
    too_long = []
    for entry in unmarked:
        steps, sc, roomiest = entry["steps"], entry["sc"], entry["fit"]["roomiest"]
        if any(math.isinf(count) for count in roomiest["lines"]):
            takes = "one of its words is wider than a criteria card, so it cannot wrap"
        else:
            takes = (
                f"its {len(steps)} steps take {int(sum(roomiest['lines']))} lines "
                f"(step by step: {', '.join(str(int(count)) for count in roomiest['lines'])})"
            )
        too_long.append(
            f"successCriteria[{entry['index']}] ({sc.get('id')}), the list that begins "
            f"\\"{list_opening(steps)}\\", is too long for the criteria panels slides are built "
            f"with: at 18pt, the smallest the board allows, {takes} in the roomiest of them, "
            f"the half-width side (6.35in wide and 6.65in tall), which holds {roomiest['holds']} "
            f"lines of about {roomiest['chars']} characters for {len(steps)} steps, and the "
            f"practice panel holds it at none of its three widths."
        )
    raise ContractError(
        " ".join(too_long)
        + " Tighten the wording here, where it is written, keeping what each step tells "
        "a stuck child to do, until the whole list fits: the slide designer has no roomier "
        "panel to give it, and nobody after you may reword a criterion. Only if you have "
        "tightened it and no step can lose a word without losing what it tells a stuck "
        "child to do, keep the words, mark "
        + ("each list" if len(unmarked) > 1 else "the list")
        + f" `\\"{MARKED_TOO_LONG}\\": true`, and say why in `flagsForTeacher`, in plain words "
        "for the teacher that name the list by its words. The check reads only the mark. It "
        "then lets the list through, but it costs every slide that shows the list: each "
        "reaches the teacher as a blank page that says to check it before teaching, with its "
        "question, working space and criteria not drawn. So tighten it if any word can go."
    )""", """def takes_lines(steps: list[str], measure: dict[str, Any]) -> str:
    \"\"\"The lines a list takes in a panel, step by step, as a refusal says it.\"\"\"
    if any(math.isinf(count) for count in measure["lines"]):
        return "one of its words is wider than a criteria card, so it cannot wrap"
    return (
        f"its {len(steps)} steps take {int(sum(measure['lines']))} lines "
        f"(step by step: {', '.join(str(int(count)) for count in measure['lines'])})"
    )


def validate_criteria_fit_a_named_panel(sc_items: list[Any]) -> None:
    \"\"\"Refuse a steps list none of the panels the guidance names can hold,
    unless the lesson designer, having tried to tighten it, has marked it too
    long and it fits once drawn smaller, down to 16pt: the teacher's decision 11
    is that an error never costs the deck, and a design the validator refuses at
    the end of its repair passes ends the run with none. Every slide that shows
    a marked list then draws it smaller, flagged for the teacher to check. A
    list too long even at 16pt is refused, marked or not.\"\"\"
    status = criteria_fit_status(sc_items)
    unmarked, beyond = status["unmarked"], status["beyond_smaller"]
    if not unmarked and not beyond:
        return
    said = []
    for entry in unmarked:
        steps, sc, roomiest = entry["steps"], entry["sc"], entry["fit"]["roomiest"]
        said.append(
            f"successCriteria[{entry['index']}] ({sc.get('id')}), the list that begins "
            f"\\"{list_opening(steps)}\\", is too long for the criteria panels slides are built "
            f"with: at 18pt, the smallest the board allows, {takes_lines(steps, roomiest)} in the "
            f"roomiest of them, the half-width side (6.35in wide and 6.65in tall), which holds "
            f"{roomiest['holds']} lines of about {roomiest['chars']} characters for {len(steps)} "
            f"steps, and the practice panel holds it at none of its three widths."
            + ("" if entry["smaller"]["fits"] else
               f" Even at {MARKED_FLOOR_PT}pt it does not fit, so marking it would not let it through.")
        )
    if unmarked:
        said.append(
            "Tighten the wording here, where it is written, keeping what each step tells "
            "a stuck child to do, until the whole list fits: the slide designer has no roomier "
            "panel to give it, and nobody after you may reword a criterion. Only if you have "
            "tightened it and no step can lose a word without losing what it tells a stuck "
            "child to do, keep the words, mark "
            + ("each list" if len(unmarked) > 1 else "the list")
            + f" `\\"{MARKED_TOO_LONG}\\": true`, and say why in `flagsForTeacher`, in plain words "
            "for the teacher that name the list by its words. The check reads only the mark. It "
            f"then lets the list through if it fits at {MARKED_FLOOR_PT}pt, but it costs every "
            "slide that shows the list: each draws it smaller than the 18pt the board allows "
            f"everything else, down to {MARKED_FLOOR_PT}pt, close to the smallest a class can "
            "read from the back of the room, and is flagged for the teacher to check before "
            "teaching. So tighten it if any word can go."
        )
    for entry in beyond:
        steps, sc, roomiest = entry["steps"], entry["sc"], entry["smaller"]["roomiest"]
        said.append(
            f"successCriteria[{entry['index']}] ({sc.get('id')}), the list that begins "
            f"\\"{list_opening(steps)}\\", is marked `{MARKED_TOO_LONG}`, but it is too long even "
            f"at {MARKED_FLOOR_PT}pt, the least a marked list is drawn at: {takes_lines(steps, roomiest)} "
            f"in the roomiest criteria panel, the half-width side, which holds {roomiest['holds']} "
            f"lines of about {roomiest['chars']} characters at {MARKED_FLOOR_PT}pt for {len(steps)} steps."
        )
    if beyond:
        said.append(
            "Tighten it here, where it is written, keeping what each step tells a stuck child "
            f"to do, at least until it fits at {MARKED_FLOOR_PT}pt, and better until it fits at 18pt "
            f"and needs no mark: a list no panel holds even at {MARKED_FLOOR_PT}pt cannot be drawn at "
            "all, and every slide that shows it would reach the teacher as a blank page to check "
            "before teaching. Nobody after you may reword a criterion."
        )
    raise ContractError(" ".join(said))""")

# ─── The true cost, wherever the old one was written ─────────────────────────

replace_once(PACKET, """    \"\"\"What the review page says beside a criteria list the lesson designer
    has marked too long for every criteria panel, keyed by the list's position.\"\"\"""", """    \"\"\"What the review page says beside a criteria list the lesson designer
    has marked too long for every criteria panel, keyed by the list's position.
    A marked list too long even at 16pt never reaches this page: the lesson
    check refuses it.\"\"\"""")

replace_once(PACKET, """            "list at 18pt, and the lesson designer has marked it too long for them after trying "
            "to tighten it, so every slide that shows it will reach the teacher as a blank page "
            "to check before teaching. Could the list be tightened until it fits, with every "
            "step still telling a stuck child what to do? If so, return `REDESIGN REQUIRED` and "
            "name the tightening: the words are the lesson designer's to change.\"""", """            "list at 18pt, and the lesson designer has marked it too long for them after trying "
            "to tighten it, so every slide that shows it will draw the list smaller than the "
            "18pt floor, down to 16pt, and be flagged for the teacher to check before teaching. "
            "Could the list be tightened until it fits at 18pt, with every step still telling a "
            "stuck child what to do? If so, return `REDESIGN REQUIRED` and name the tightening: "
            "the words are the lesson designer's to change.\"""")

replace_once(OT, """Only then set it `true` on that list, and say why in `flagsForTeacher`. The check reads the mark and lets the list through, but every slide that shows it reaches the teacher as a blank page to check before teaching, so it is never a way round tightening.""",
             """Only then set it `true` on that list, and say why in `flagsForTeacher`. The check reads the mark and lets the list through if it fits at 16pt, and every slide that shows it then draws it smaller than the 18pt floor, down to 16pt, flagged for the teacher to check before teaching, so it is never a way round tightening. A list too long even at 16pt is refused, marked or not: tighten it at least that far.""")

replace_once(LD, """Mark that list `tooLongForPanels: true` as well: the check reads the mark, not the flag. Every slide that shows that list then reaches the teacher as a blank page to check before teaching, so tighten first.""",
             """Mark that list `tooLongForPanels: true` as well: the check reads the mark, not the flag. Every slide that shows that list then draws it smaller than the 18pt floor, down to 16pt, flagged for the teacher to check, and a list too long even at 16pt is still refused, so tighten first.""")

replace_once(SSC, """One it could not tighten is marked too long in the design (`tooLongForPanels`), and the build says so on each slide that shows it: no panel holds it, so leave those slides, which are delivered flagged. A list that still reaches a slide some other way (a sticky line or a helper beside a step can take the last of the room) is delivered flagged for the teacher to check, never cut to fit.""",
             """One it could not tighten is marked too long in the design (`tooLongForPanels`): place it as any long list, and the builder draws it at the largest size that fits, down to 16pt, the one exception to the 18pt minimum, on a finished slide it flags for the teacher to check (`CRITERIA_BELOW_READABLE_FLOOR`, the design's to answer for, so leave it). A list that still fits nowhere (a sticky line or a helper beside a step can take the last of the room; the rarest case is a marked list no panel holds even at 16pt) is delivered flagged for the teacher to check, never cut to fit.""")

print("c5c: a marked list is drawn smaller, down to 16pt, and the lesson check lets it through only then")
