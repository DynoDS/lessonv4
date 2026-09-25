"""The worksheets release (4.2.290), step 4: the lesson designer's own file, its
worksheet component and the contract (change plan section 1, decision 2;
section 2, settled items b, e, g, h's O18 and N03, k and l; section 4, E02's
count)."""
from _patch import LD, LDC, OT, replace_once, assert_absent

# Decision 2 (A08): the sheet may keep the slide task's representation, never
# its questions. The supplied-sheet clauses before it stay word for word (two
# tests and a quick-checks pin hold them).
replace_once(
    LD,
    "That owner permits a printed alternative using the same task; the lesson still does not depend on printing it.",
    "That owner lets the sheet keep the slide task's representation, never its questions (in a lesson like PSHE that works towards one question, the sheet can be that question, answered as the proof); the lesson still does not depend on printing it.",
)

# Settled item k, his answer of 24 September (evening), "yes" (S02): a
# write-on figure is still a stick-in moment, so the lesson does not depend on
# the sheet for it; the sheet may carry the same kind of figure with its own
# questions, never the Your Turn's.
replace_once(
    LD,
    "A write-on figure the child could not rule by hand is a stick-in moment, not a worksheet: design the Your Turn normally with its own questions on the representation and record it under Printed extras below.",
    "A write-on figure the child could not rule by hand is a stick-in moment, so the lesson does not depend on the worksheet for it: design the Your Turn normally with its own questions on the representation and record it under Printed extras below. The worksheet may carry the same kind of figure too, with its own questions and never the Your Turn's (`preferences.md` → Worksheets).",
)

# Settled item e (A17): the kit is not repeated on the lesson's worksheet;
# every lesson still has one.
replace_once(
    LD,
    "the run cannot close complete without it, and the main task does not automatically get a worksheet as well.",
    "the run cannot close complete without it, and the sort is not repeated on the lesson's worksheet.",
)

# Settled item b (A18), his 18 September words ("it won't fit the 45 min") and
# his 23 September ruling: the sheet's time sits inside the lesson.
replace_once(
    LD,
    "Explain where an optional worksheet fits and what it replaces if used within the lesson; do not budget it as compulsory extra work or leave the teacher to infer the substitution.",
    "Say where the worksheet's time sits inside the lesson: the beat it replaces, or the independent work the slides leave room for. It is never set for another time and never added on top of a full lesson; do not leave the teacher to infer the substitution.",
)

# Settled item g (O37): a sheet has no header.
replace_once(
    LD,
    "`lo` is the teacher's objective verbatim, used in internal planning, worksheet headers, orientation.",
    "`lo` is the teacher's objective verbatim, used in internal planning and orientation.",
)

# Settled item g (C06): the contract and the validator require `per-child`.
replace_once(
    LD,
    "Leave `resourceMode` unset for a per-child sheet, which differentiates into Expected, Below and Greater Depth.",
    "Set `resourceMode` to `per-child` for a child's own sheet, which differentiates into Expected, Below and Greater Depth.",
)

# Decision 2 (B05): the first sentence and the photographs example stay.
replace_once(
    LDC,
    "A printed alternative may retain the same task under `preferences.md` → Worksheets.",
    "A sheet in place of the slide practice may keep its representation, never its questions (in a lesson like PSHE that works towards one question, the sheet can be that question, answered as the proof; `preferences.md` → Worksheets).",
)

# Stories (E02): the dated count leaves (it is in the log, 4.2.162); the reason
# stays, and the teeth sheet stays as a plain, undated example.
replace_once(
    LDC,
    "Eleven sheets built between 5 and 12 September 2026 were counted by what they actually put on paper. Ruled writing lines and a plain printed instruction were the two commonest things on every one of them; across all eleven, label-a-diagram, match, sort, sequence and correct-an-example were used no times at all. The page engine draws every one of those. What produced it was `response` being free text: a line reading `two handwriting lines` is a settled decision, the worksheet designer may not change a settled response, and so the form was fixed by whoever wrote the question fastest.",
    "While `response` was free text, a line reading `two handwriting lines` was a settled decision, the worksheet designer may not change a settled response, and so the form was fixed by whoever wrote the question fastest: ruled writing lines and a plain printed instruction were the commonest things on the sheets, and label-a-diagram, match, sort, sequence and correct-an-example, which the page engine draws, went unused.",
)

# Settled item l (H12): parts share a question only when they are one job; a
# shared stimulus is not enough.
replace_once(
    LDC,
    "**Multipart only for one connected pupil job.** Several parts may share one main question when use one decision rule, one central stimulus or one dependent answer route. Shared picture/topic/context not enough when actually separate assessment job; start new question.",
    "**Multipart only for one connected pupil job.** Several parts share one main question only when they are one job: one decision rule or one dependent answer route. A shared picture, stimulus, topic or context is not enough when each part is a separate assessment job; start a new question.",
)

# Settled item h (O18): one page and the two-page exception are the printed
# page's; the pointer keeps both halves and its one extra.
replace_once(
    LDC,
    "**Normally one page per resource version.** Two pages only when the central task needs a substantial write-on visual pupils plot, measure, draw, label or annotate directly and it cannot stay usable on one page: state the eligibility and protect the visual. A second page is never for overflow, prose or extra questions; the fit priority above handles those.",
    "**Normally one page per resource version; the two-page exception and its limits are `preferences.md` → The printed page's.** When a central write-on visual earns it, state the eligibility and protect the visual. A second page is never for overflow, prose or extra questions; the fit priority above handles those.",
)

# Settled item h (N03): the copy that dropped O04's condition is brought into
# line.
replace_once(
    OT,
    "Use `[]` when nothing may be removed. A misconception's retest",
    "Use `[]` only when nothing may be removed and the priced set already fits. A misconception's retest",
)

for rel, gone in (
    (LD, "permits a printed alternative using the same task"),
    (LD, "is a stick-in moment, not a worksheet"),
    (LD, "does not automatically get a worksheet as well"),
    (LD, "do not budget it as compulsory extra work"),
    (LD, "worksheet headers"),
    (LD, "Leave `resourceMode` unset"),
    (LDC, "A printed alternative may retain the same task"),
    (LDC, "Eleven sheets built between 5 and 12 September 2026"),
    (LDC, "one central stimulus"),
    (LDC, "Two pages only when the central task needs a substantial write-on visual"),
):
    assert_absent(rel, gone)
print("lesson designer, components and contract changed")
