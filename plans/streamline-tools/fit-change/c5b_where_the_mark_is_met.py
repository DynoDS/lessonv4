"""Where the lesson designer, the design reviewer and the slide builder meet a
criteria list marked too long, in the fit release (4.2.289).

The lesson designer marks a list it has tightened and still cannot fit on the
list itself, `"tooLongForPanels": true`, and says why in `flagsForTeacher` as
for any other departure. The lesson check reads only the mark (c3). The fourth
check found that reading the flag's words let a flag written for something else
through and covered lists it did not name, so nothing reads a flag's words now.

- `output-template.md`, the design's contract: the mark is described beside
  `drawLive`, with when it is allowed and what it costs, and the flag channel's
  "only for" list gains the reason for a marked list.
- `lesson-designer.md`: its list of what belongs in `flagsForTeacher` gains
  the reason, and says to mark the list too.
- `lesson-design-scaffold.py`: every success-criteria object is written with
  the mark false, so the field is there to see and set.
- `design-review-packet.py`: the review page, beside a marked list the check
  finds too long, asks the reviewer whether the list could be tightened until
  it fits and, if so, to send it back to the lesson designer naming the fix
  (the teacher decided on 24 September 2026 that a fix changing what children
  read is the lesson designer's, with the reviewer naming it); beside a marked
  list the check does not find too long, it says so.
- `builder/build.js` and `builder/src/content/capacity.js`: the build reads the
  mark from `lesson-design.json` beside the lesson file (the slide check reads
  that file already), and a slide whose criteria are a marked list, word for
  word, is refused as the design's (`faultClass: "content"`) with "marked too
  long in the design: leave the slide flagged", so the slide designer does not
  spend its repair passes on it; its own file already leaves a content fault
  alone. The new `builder/src/marked-criteria.js` is placed by c7.

    python -X utf8 plans/streamline-tools/fit-change/c5b_where_the_mark_is_met.py
"""
from _patch import replace_once

OT = "references/output-template.md"
LD = "agents/lesson-designer.md"
SCAFFOLD = "scripts/lesson-design-scaffold.py"
PACKET = "scripts/design-review-packet.py"
BUILD = "builder/build.js"
CAPACITY = "builder/src/content/capacity.js"

replace_once(OT, """It does not prescribe where the teacher writes.
""", """It does not prescribe where the teacher writes.

`tooLongForPanels` is false (or left out) unless the lesson check refuses a steps list as too long for every criteria panel and you have tightened it and still cannot fit it without losing what a step tells a stuck child to do. Only then set it `true` on that list, and say why in `flagsForTeacher`. The check reads the mark and lets the list through, but every slide that shows it reaches the teacher as a blank page to check before teaching, so it is never a way round tightening.
""")

replace_once(OT, """- a genuine teacher-owned judgement between more than one sound option.

Do not put ordinary design rationale here;""", """- a genuine teacher-owned judgement between more than one sound option;
- as a last resort, why a success-criteria list you marked `tooLongForPanels` could not be tightened, naming the list in plain words by its words.

Do not put ordinary design rationale here;""")

replace_once(LD, """Three things belong: an unmet direct teacher requirement or departure from the supplied plan's curriculum coverage; a contradiction/gap in the brief designed around; a judgement the teacher owns. Declined suggestions need no flag.""",
"""Three things belong: an unmet direct teacher requirement or departure from the supplied plan's curriculum coverage; a contradiction/gap in the brief designed around; a judgement the teacher owns. Declined suggestions need no flag. A fourth, only as a last resort: why a success-criteria list the lesson check refuses as too long could not be tightened without losing what a step tells a stuck child to do, naming the list in plain words. Mark that list `tooLongForPanels: true` as well: the check reads the mark, not the flag. Every slide that shows that list then reaches the teacher as a blank page to check before teaching, so tighten first.""")

replace_once(SCAFFOLD, """                "drawLive": PLACEHOLDER,
                "content": PLACEHOLDER,
            }""", """                "drawLive": PLACEHOLDER,
                "content": PLACEHOLDER,
                # True only for a list the lesson check refuses as too long
                # and the designer cannot tighten (output-template.md).
                "tooLongForPanels": False,
            }""")

replace_once(PACKET, """def canonical_paths(""", """def _load_design_validator():
    import importlib.util

    name = "lesson_v4_validate_lesson_design"
    if name in sys.modules:
        return sys.modules[name]
    path = Path(__file__).resolve().parent / "validate-lesson-design.py"
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def criteria_mark_lines(design: dict) -> dict[int, list[str]]:
    \"\"\"What the review page says beside a criteria list the lesson designer
    has marked too long for every criteria panel, keyed by the list's position.\"\"\"
    status = _load_design_validator().criteria_fit_status(design.get("successCriteria"))
    lines: dict[int, list[str]] = {}
    for entry in status["marked"]:
        lines.setdefault(entry["index"], []).append(
            "Lesson check (read this one): no criteria panel a slide is built with holds this "
            "list at 18pt, and the lesson designer has marked it too long for them after trying "
            "to tighten it, so every slide that shows it will reach the teacher as a blank page "
            "to check before teaching. Could the list be tightened until it fits, with every "
            "step still telling a stuck child what to do? If so, return `REDESIGN REQUIRED` and "
            "name the tightening: the words are the lesson designer's to change."
        )
    for entry in status["stale"]:
        lines.setdefault(entry["index"], []).append(
            "Lesson check: this list is marked too long for the criteria panels, but the check "
            "does not find it too long; say so in your review, so the mark and the flag that "
            "explains it come out and the teacher is not told something untrue."
        )
    return lines


def canonical_paths(""")

replace_once(PACKET, """    for row in design["successCriteria"]:
        lines.append(
            f"- `{row['id']}` {row['type']} "
            f"(drawLive: {str(row['drawLive']).lower()}): "
            f"{review_json(row['content'])}"
        )
        for cue in criteria_review_cues(row, vocabulary_terms):
            lines.append(f"  - Review cue (not a failure): {cue}.")
    lines.append("")""", """    mark_lines = criteria_mark_lines(design)
    for index, row in enumerate(design["successCriteria"]):
        lines.append(
            f"- `{row['id']}` {row['type']} "
            f"(drawLive: {str(row['drawLive']).lower()}): "
            f"{review_json(row['content'])}"
        )
        for cue in criteria_review_cues(row, vocabulary_terms):
            lines.append(f"  - Review cue (not a failure): {cue}.")
        for line in mark_lines.get(index, []):
            lines.append(f"  - {line}")
    lines.append("")""")

replace_once(CAPACITY, """module.exports = {
  capacityWarnings,""", """module.exports = {
  capacityWarnings,
  criteriaStepsOf,""")

replace_once(BUILD, """const { preRenderSuccessCriteriaHelpers } = require('./src/success-criteria-helpers');
""", """const { preRenderSuccessCriteriaHelpers } = require('./src/success-criteria-helpers');
const { markedCriteriaLists, showsMarkedList, MARKED_TOO_LONG_MESSAGE } = require('./src/marked-criteria');
""")

replace_once(BUILD, """    for (const error of preflight.errors) {
      console.error(`  ✗ slide ${error.slide}: ${error.signal}: ${error.message}`);
      diagnostic(
        error.signal,
        error.signal === 'CONTENT_ZONE_INCOMPATIBLE'
          ? 'compatibility'
          : error.signal === 'LAYOUT_PREFLIGHT_FAILED'
            ? 'technical'
            : 'composition',""", """    // A slide whose criteria are a list the lesson designer marked too long
    // for every panel is refused as the design's, not as a composition fault:
    // no layout holds it, so the slide designer leaves it (marked-criteria.js).
    const marked = markedCriteriaLists(jsonPath);
    for (const error of preflight.errors) {
      const designs = error.signal === 'STEP_TEXT_OVERLOAD' &&
        showsMarkedList(coreSlides[error.slide - 1], marked);
      if (designs) error.message = MARKED_TOO_LONG_MESSAGE;
      console.error(`  ✗ slide ${error.slide}: ${error.signal}: ${error.message}`);
      diagnostic(
        error.signal,
        designs
          ? 'content'
          : error.signal === 'CONTENT_ZONE_INCOMPATIBLE'
            ? 'compatibility'
            : error.signal === 'LAYOUT_PREFLIGHT_FAILED'
              ? 'technical'
              : 'composition',""")

print("c5b: the designer's contract, the review page and the build meet the mark")
