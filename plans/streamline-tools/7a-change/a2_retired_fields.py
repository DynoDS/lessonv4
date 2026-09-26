"""Release 7A (4.2.293), step 2: the two retired parts of the lesson file.

A1, the test-question starter goes as if it never existed (his "get rid of the
'will return' stuff, it needs to be like it didnt even exist"): the always-empty
`starter.content.testQuestionPath` leaves the contract, the validator (its key
and its answer rule), the scaffold, the tests and the fixture, and the
tall-picture starter loses the scanned question it was described by. The
template, its `question` slot and its answer example stay.

A2, the Lesson 2 plan goes (PF decision 20, his "Is there a thing that says that
if I've provided a lot of things that it suggests what the second lesson should
contain? If so, I think that should come out because it already knows how much
it can fit in one lesson", then "yes and yes"; and the change plan's question 2,
"yes": today's lesson still ends on its main idea while it is fresh, and what the
next lesson opens with comes out). `lesson.scope`, `lesson.deferredLearning` and
`lesson.lesson2Direction` go with their checks, scaffold, review view and tests;
so does the starter-slide orientation paragraph about the split, and the Roman
diary example. The designer still fits one lesson properly and splits rather
than crams; a lesson that left something out says what in one line of the
walk-through's closing decisions, whose "related content deliberately deferred"
line is unchanged. The reviewer's "lesson scope" and "change lesson scope" are
plain English about what a lesson covers and stay; the playbook's report list
loses its "lesson scope", whose only source was `lesson.scope` (the first
check's low note)."""
from _patch import (LD, OT, PACKET, PB, PREF, REV, SCAFFOLD, SCAFFOLD_GUIDE, TALL, TMPL, VALIDATOR, WALL_PACKET,
                    assert_absent, replace_once)

# --- A1: the test-question starter -------------------------------------------------

replace_once(OT, '''    "format": "...",
    "testQuestionPath": null
  },''', '''    "format": "..."
  },''')
replace_once(OT, '''`testQuestionPath` is always `null`. The route that filled it - a starter built on a real past-paper question image - is parked while its question source is rebuilt, so there is nothing to put here and no path to invent. The field stays in the shape because the validator and the slide side still understand it, and the route will return to it.

''', '')

replace_once(TMPL,
             "**Purpose:** A starter built around one tall portrait image the children read from, such as a scanned question. The standard",
             "**Purpose:** A starter built around one tall portrait image the children read from. The standard")
replace_once(TMPL,
             "Right side is one full-height zone for the question image.",
             "Right side is one full-height zone for the image.")
# The two examples of the `left` slot read like the removed slide ("Answer the
# question.", "350 millilitres"); they become an ordinary starter from a saved
# deck, the Year 4 science starter "Teeth and their jobs"
# (`output/working/name-the-layers-of-teeth`) and its check slide.
replace_once(TMPL,
             '(for example, "Answer the question.") or nothing; on the answer slide the answer in green via the `||` marker (e.g. `{ "type": "text", "text": "||350 millilitres" }`).',
             '(for example, "Which teeth cut food?") or nothing; on the answer slide the answer in green via the `||` marker (e.g. `{ "type": "text", "text": "||Incisors cut food." }`).')

replace_once(VALIDATOR, '''    if kind == "starter":
        keys = {"activity", "connection", "format", "testQuestionPath"}
        expect_exact_keys(content, keys, keys, path)
        strings(("activity", "connection", "format"))
        expect_nullable_string(content["testQuestionPath"], f"{path}.testQuestionPath")
''', '''    if kind == "starter":
        keys = {"activity", "connection", "format"}
        expect_exact_keys(content, keys, keys, path)
        strings(("activity", "connection", "format"))
''')
replace_once(VALIDATOR, '''    if kind == "starter" and unit["content"]["testQuestionPath"] is not None:
        expect(
            answer_kind == "exact" and answer_delivery == "answer-slide",
            f"{path}.answer must be an exact answer-slide answer when starter.testQuestionPath is present",
        )

''', '')

replace_once(SCAFFOLD,
             '    "starter": ("activity", "connection", "format", "testQuestionPath"),',
             '    "starter": ("activity", "connection", "format"),')

replace_once(TALL, '''// A starter built around one tall portrait image the children read from, such
// as a scanned question. The usual full-width starter header would leave the
''', '''// A starter built around one tall portrait image the children read from.
// The usual full-width starter header would leave the
''')

# --- A2: the Lesson 2 plan ----------------------------------------------------------

replace_once(PREF,
             '"understand the water cycle, then draw and explain it"; "know how a Roman lived, then write a diary entry as one"; "understand the structure of a volcano',
             '"understand the water cycle, then draw and explain it"; "understand the structure of a volcano')
replace_once(PREF,
             "When it is two lessons, split at the natural seam: teach and consolidate the knowledge today, ending on the lesson's core idea while it is still fresh; make the production the opening of the next lesson, warmed by a quick retrieval of today's learning. The reason is how working memory leaves a lesson — the last thing children hold should be the idea the lesson was built to land, not the hardest task attempted when their attention and stamina are already spent (the cognitive-load and closure mechanisms are in `evidence-synthesis.md` §7–8). A lesson that builds",
             "When it is two lessons, split at the natural seam: teach and consolidate the knowledge today, ending on the lesson's core idea while it is still fresh. The reason is how working memory leaves a lesson: the last thing children hold should be the idea the lesson was built to land, not the hardest task attempted when their attention and stamina are already spent. A lesson that builds")
replace_once(PREF,
             "When a split is chosen, the lesson design must say plainly that the package covers Lesson 1 only, name what has been deferred and state what Lesson 2 should cover. Record those three facts in `lesson.scope`, `lesson.deferredLearning` and `lesson.lesson2Direction` respectively, and surface the same orientation in the starter-slide teacher orientation paragraph so the split is not buried in structured fields.",
             "When a split is chosen, today's lesson teaches what fits properly and says in one line of the walk-through's closing decisions what it left for another lesson; it does not plan that lesson.")

replace_once(LD,
             "If not fit, today teaches/consolidates knowledge, production opens next. See `preferences.md` → How Much Fits. Signal split in `lesson.scope`, `deferredLearning`, `lesson2Direction` + orientation.",
             "If not fit, today teaches/consolidates knowledge and ends on its core idea. See `preferences.md` → How Much Fits. If it left something out, say what in one line of the walk-through's closing decisions; never plan the next lesson.")

replace_once(OT, '''    "durationMinutes": 45,
    "scope": "Complete lesson",
    "deferredLearning": null,
    "lesson2Direction": null,
    "stickingPoint": "..."''', '''    "durationMinutes": 45,
    "stickingPoint": "..."''')
replace_once(OT, '''`scope` is exactly `Complete lesson` or `Lesson 1 of 2`.

For `Complete lesson`, both `deferredLearning` and `lesson2Direction` are `null`.

For `Lesson 1 of 2`, both are non-empty strings.

''', '')

replace_once(SCAFFOLD_GUIDE, '''  "subject": "Science",
  "scope": "Complete lesson",
''', '''  "subject": "Science",
''')

replace_once(REV, "- deferred learning is not taught early;",
             "- what the walk-through says was left for another lesson is not taught early;")
replace_once(REV, "- any lesson split is honest and visible;",
             "- a lesson that left learning for another lesson says so, honestly and visibly, in the walk-through;")

replace_once(PB, '''teacher-facing report naming the topic, year, subject, objective, lesson scope,
exact files''', '''teacher-facing report naming the topic, year, subject, objective,
exact files''')
replace_once(PB, '''State when
a two-lesson scope covers Lesson 1 only and name deferred learning.''', '''When the
walk-through says the lesson left something for another lesson, say what in one line.''')

replace_once(VALIDATOR,
             '        "durationMinutes", "scope", "deferredLearning", "lesson2Direction", "stickingPoint",',
             '        "durationMinutes", "stickingPoint",')
replace_once(VALIDATOR, '''    expect_positive_int(lesson["durationMinutes"], "lesson.durationMinutes")
    scope = expect_string(lesson["scope"], "lesson.scope")
    expect(scope in {"Complete lesson", "Lesson 1 of 2"}, "lesson.scope invalid")
    expect_nullable_string(lesson["deferredLearning"], "lesson.deferredLearning")
    expect_nullable_string(lesson["lesson2Direction"], "lesson.lesson2Direction")
    if scope == "Complete lesson":
        expect(lesson["deferredLearning"] is None, "complete lesson must have deferredLearning null")
        expect(lesson["lesson2Direction"] is None, "complete lesson must have lesson2Direction null")
    else:
        expect_string(lesson["deferredLearning"], "lesson.deferredLearning")
        expect_string(lesson["lesson2Direction"], "lesson.lesson2Direction")
''', '''    expect_positive_int(lesson["durationMinutes"], "lesson.durationMinutes")
''')

replace_once(SCAFFOLD, '''    "subject",
    "scope",
    "vocabularyCount",''', '''    "subject",
    "vocabularyCount",''')
replace_once(SCAFFOLD, '''    scope = text(
        request["scope"],
        "scope",
    )
    require(
        scope in {
            "Complete lesson",
            "Lesson 1 of 2",
        },
        f"scope invalid: {scope}",
    )

''', '')
replace_once(SCAFFOLD, '''            "durationMinutes": PLACEHOLDER,
            "scope": request["scope"],
            "deferredLearning": (
                None
                if request["scope"] == "Complete lesson"
                else PLACEHOLDER
            ),
            "lesson2Direction": (
                None
                if request["scope"] == "Complete lesson"
                else PLACEHOLDER
            ),
            "stickingPoint": PLACEHOLDER,''', '''            "durationMinutes": PLACEHOLDER,
            "stickingPoint": PLACEHOLDER,''')

replace_once(PACKET, '''        f"- Duration: {lesson['durationMinutes']} minutes",
        f"- Scope: {lesson['scope']}",
    ]
    if lesson["deferredLearning"] is not None:
        lines.append(
            f"- Deferred learning: {lesson['deferredLearning']}"
        )
    if lesson["lesson2Direction"] is not None:
        lines.append(
            f"- Lesson 2 direction: {lesson['lesson2Direction']}"
        )
''', '''        f"- Duration: {lesson['durationMinutes']} minutes",
    ]
''')

replace_once(WALL_PACKET,
             '    for key in ("structure", "subject", "yearGroup", "lo", "displayedLo", "durationMinutes", "scope"):',
             '    for key in ("structure", "subject", "yearGroup", "lo", "displayedLo", "durationMinutes"):')

for rel in (PREF, LD, OT, SCAFFOLD_GUIDE, REV, PB, VALIDATOR, SCAFFOLD, PACKET, WALL_PACKET, TMPL, TALL):
    for phrase in ("testQuestionPath", "lesson2Direction", "deferredLearning", "Lesson 1 of 2",
                   "know how a Roman lived", "scanned question", "will return to it"):
        assert_absent(rel, phrase)
print("retired fields removed")
