"""The fifth check's repairs in the fit release (4.2.289). Runs after c5d.

1. A stale mark never shrinks a list. The builder drew a marked list under 18pt
   wherever it met the list's words, even when the practice panel at its widest
   or the half-width split holds it at 18pt (a mark left behind after the list
   was tightened), and flagged the slide with words that were then untrue. Now
   a criteria panel lowers the floor only for a marked list that neither of
   those shapes holds at 18pt (`markedListHeldAt18`, `marked-criteria.js`,
   placed by c7); otherwise the list is treated as unmarked, and a panel that
   cannot hold it refuses it at 18pt with its roomier shape named, for the
   slide designer to move.
2. Only the marked list goes under 18pt. His ruling keeps 18pt for everything
   else ("The 18 point floor stands for everything else"), so a sticky line
   beside a marked list keeps the readable floor in every measure and every
   refusal, keeps its own name, and has its own size group in the final text
   fit, which lowers the floor only on a marked list's own step lines. One
   that does not fit is refused as it would be beside an unmarked list ("carry
   the fact in its own on-slide treatment"), and the build leaves that refusal
   with the slide designer when a named shape holds the marked list itself at
   16pt (`markedListRoom` measures the list without its sticky line).

- `builder/src/success-criteria-panel.js`: the stale-mark test.
- `builder/src/content/steps.js`: the sticky line keeps 18pt beside a marked
  list.
- `builder/scripts/fit_text_postprocess.py`: only a line named
  `marked-step-text-` may go under 18pt.
- `scripts/validate-lesson-design.py`: its copy of the fitter measures a sticky
  line at 18pt beside a list measured smaller, as the builder now does, so the
  two still give one verdict.
- `references/slide-success-criteria.md`: a sticky line beside a marked list
  stays at 18pt (SC-K06's whole-paragraph pin follows).

    python -X utf8 plans/streamline-tools/fit-change/c5e_only_a_list_too_long_goes_smaller.py
"""
from _patch import replace_once

PANEL = "builder/src/success-criteria-panel.js"
STEPS = "builder/src/content/steps.js"
FIT = "builder/scripts/fit_text_postprocess.py"
V = "scripts/validate-lesson-design.py"
SSC ="references/slide-success-criteria.md"

# ─── 1. A stale mark never shrinks a list ─────────────────────────────────────

replace_once(PANEL, """const { isMarkedList, markedListFloor } = require('./marked-criteria');""",
             """const { isMarkedList, markedListHeldAt18, markedListFloor } = require('./marked-criteria');""")

replace_once(PANEL, """      // widest. Every other list keeps the 18pt floor.
      if (content.type === 'steps' && isMarkedList(content.steps, ctx.markedCriteria) &&
          (!zone.practicePanel || zone.widestPracticePanel)) {""", """      // widest. Every other list keeps the 18pt floor, and so does a marked
      // list that the practice panel at its widest or the half-width split
      // holds at 18pt: its mark is stale (left behind after the list was
      // tightened), and drawing it smaller, or telling the teacher it is too
      // long for every panel, would both be untrue.
      if (content.type === 'steps' && isMarkedList(content.steps, ctx.markedCriteria) &&
          (!zone.practicePanel || zone.widestPracticePanel) &&
          !markedListHeldAt18(content.steps, ctx)) {""")

# ─── 2. Only the marked list goes under 18pt ─────────────────────────────────

replace_once(STEPS, """  // The readable floor, unless this is a criteria panel holding a list marked
  // too long, whose panel has lowered it (see the constants above).
  const floorPt = Number.isFinite(zone.floorPt) ? zone.floorPt : TEXT_FONT_MIN;
  const drawnSmaller = floorPt < TEXT_FONT_MIN;
""", """  // The readable floor, unless this is a criteria panel holding a list marked
  // too long, whose panel has lowered it (see the constants above). Only the
  // marked list's own steps take the lowered floor: a sticky line beside them
  // keeps the readable one in every measure and every refusal, because the
  // teacher kept 18pt for everything else.
  const floorPt = Number.isFinite(zone.floorPt) ? zone.floorPt : TEXT_FONT_MIN;
  const drawnSmaller = floorPt < TEXT_FONT_MIN;
  const floorFor = (s) => (isReferenceStep(s) ? TEXT_FONT_MIN : floorPt);
""")

replace_once(STEPS, """      const floorTotal = steps.reduce((total, s) => total + floorNeed(textOf(s), shortRows, floorPt), 0);""",
             """      const floorTotal = steps.reduce((total, s) => total + floorNeed(textOf(s), shortRows, floorFor(s)), 0);""")

replace_once(STEPS, """      ? wrappedLineCount(textOf(s), usableWidth(Math.max(0.3, stepTextW)), floorPt)
          * (floorPt / 72) * 1.28 + FIT_PAD_H""", """      ? wrappedLineCount(textOf(s), usableWidth(Math.max(0.3, stepTextW)), TEXT_FONT_MIN)
          * (TEXT_FONT_MIN / 72) * 1.28 + FIT_PAD_H""")

replace_once(STEPS, """          steps.findIndex(isReferenceStep),
          undefined,
          zone.sourceAuthoredText,
          zone.widestPracticePanel,
          floorPt
        )""", """          steps.findIndex(isReferenceStep),
          undefined,
          zone.sourceAuthoredText,
          zone.widestPracticePanel,
          TEXT_FONT_MIN
        )""")

replace_once(STEPS, """          textNeed.indexOf(Math.max(...textNeed)),
          undefined,
          zone.sourceAuthoredText,
          zone.widestPracticePanel,
          floorPt
        )""", """          textNeed.indexOf(Math.max(...textNeed)),
          undefined,
          zone.sourceAuthoredText,
          zone.widestPracticePanel,
          floorFor(steps[textNeed.indexOf(Math.max(...textNeed))])
        )""")

replace_once(STEPS, """    largestStepFont(textOf(s), Math.max(0.3, stepTextW), Math.max(0.1, fitHeights[i]), floorPt)""",
             """    largestStepFont(textOf(s), Math.max(0.3, stepTextW), Math.max(0.1, fitHeights[i]), floorFor(s))""")

replace_once(STEPS, """          Math.max(0.1, fitHeights[overloadedAt]),
          textOf(steps[overloadedAt]),
          floorPt
        ),
        zone.sourceAuthoredText,
        zone.widestPracticePanel,
        floorPt
      )""", """          Math.max(0.1, fitHeights[overloadedAt]),
          textOf(steps[overloadedAt]),
          floorFor(steps[overloadedAt])
        ),
        zone.sourceAuthoredText,
        zone.widestPracticePanel,
        floorFor(steps[overloadedAt])
      )""")

replace_once(STEPS, """  // The final text fit holds each line to the floor its name carries, so a
  // list drawn under the readable floor names its lines as a marked list's,
  // the only lines that fit may take below 18pt (fit_text_postprocess.py).
  const lineName = (label, i) => drawnSmaller
    ? growFitObjectName(stepTextGroup, TEXT_FONT_MAX, 'marked-' + label + i, floorPt)
    : growFitObjectName(stepTextGroup, TEXT_FONT_MAX, label + i, label === 'step-text-' ? TEXT_FONT_MIN : undefined);""",
             """  // The final text fit holds each line to the floor its name carries, so a
  // list drawn under the readable floor names its steps as a marked list's,
  // the only lines that fit may take below 18pt (fit_text_postprocess.py). The
  // fit gives every line of one group the smallest size any of them needs, so
  // a sticky line beside them takes a group of its own and keeps 18pt.
  const lineName = (label, i) => {
    if (!drawnSmaller) {
      return growFitObjectName(stepTextGroup, TEXT_FONT_MAX, label + i, label === 'step-text-' ? TEXT_FONT_MIN : undefined);
    }
    return label === 'step-text-'
      ? growFitObjectName(stepTextGroup, TEXT_FONT_MAX, 'marked-' + label + i, floorPt)
      : growFitObjectName(fitGroupId(zone, 'step-reference'), TEXT_FONT_MAX, label + i);
  };""")

replace_once(STEPS, """      const shown = starW ? step.text.replace(/^\\s*✨\\s*/, '') : step.text;
      smallestDrawn = Math.min(smallestDrawn, textFont);
      slide.addText(splitAnswerRuns(shown, true), {""", """      const shown = starW ? step.text.replace(/^\\s*✨\\s*/, '') : step.text;
      slide.addText(splitAnswerRuns(shown, true), {""")

replace_once(FIT, """    \"\"\"An explicit projected-reading floor survives the global fitting pass.
    Only a marked list's line may carry one under the default, and never under
    MARKED_LIST_FLOOR_PT.\"\"\"""", """    \"\"\"An explicit projected-reading floor survives the global fitting pass.
    Only a marked list's step line may carry one under the default (a sticky
    line beside it keeps 18pt), and never under MARKED_LIST_FLOOR_PT.\"\"\"""")

replace_once(FIT, """    if explicit < default and match.group(2).startswith("marked-"):""",
             """    if explicit < default and match.group(2).startswith("marked-step-text-"):""")

replace_once(V, """        lines = [wrapped_lines(step, usable, floor_pt) for step in steps]
        needs = [count * (floor_pt / 72) * LINE_HEIGHT + FIT_PAD_H + gap for count in lines]""",
             """        # A sticky line keeps 18pt beside a list drawn smaller, as the builder
        # keeps it; only the list's own steps take the lower floor.
        floors = [FLOOR_PT if step.lstrip().startswith("\\u2728") else floor_pt for step in steps]
        lines = [wrapped_lines(step, usable, pt) for step, pt in zip(steps, floors)]
        needs = [count * (pt / 72) * LINE_HEIGHT + FIT_PAD_H + gap for count, pt in zip(lines, floors)]""")

replace_once(SSC, """the builder draws it at the largest size that fits, down to 16pt, the one exception to the 18pt minimum, on a finished slide""",
             """the builder draws it at the largest size that fits, down to 16pt, the one exception to the 18pt minimum (a sticky line beside it stays at 18pt), on a finished slide""")

print("c5e: only a list too long for every panel at 18pt goes smaller, and only its steps")
