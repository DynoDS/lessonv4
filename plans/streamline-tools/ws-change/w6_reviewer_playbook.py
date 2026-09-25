"""The worksheets release (4.2.290), step 7: the design reviewer's worksheet
checks and two playbook lines (change plan section 1, decision 2; section 2,
settled items a, b, f and g). The playbook must stay under its measured 77 KiB
cap; both of its edits shrink it. The playbook topic (10) and the reviewer
topic (8) must re-read these lines when they land."""
from _patch import REV, PB, replace_once, assert_absent

# Settled item a (I05): the board or the wall while children work.
replace_once(
    REV,
    "For needed support omitted from a sheet, check the planned shared access before making a finding; do not assume either that nothing is available or that the board will always be there;",
    "For needed support omitted from a sheet, check whether the board or the working wall shows it while children work before making a finding (every sheet is done in class);",
)

# Decision 2 (Q02): the sheet never repeats the practice slide's questions.
replace_once(
    REV,
    "- the work serves its stated practice purpose: a printed alternative may preserve the same slide task and representation; additional practice or claimed fresh application follows `preferences.md` → Worksheets. Do not reject deliberate consolidation or printed reuse for lacking novelty;",
    "- the work serves its stated practice purpose: the sheet never repeats the practice slide's questions (in maths, different numbers and contexts; in a lesson working towards one question, the sheet may be that question, answered once); a sheet in place of the slide practice may keep its representation; additional practice or claimed fresh application follows `preferences.md` → Worksheets. Do not reject deliberate consolidation for lacking novelty;",
)

# Settled item b (Q08): the sheet's time sits inside the lesson's minutes.
replace_once(
    REV,
    "Count only work expected in the lesson against its duration; an optional sheet does not automatically need extra minutes, but a proposed replacement must preserve the intended learning and evidence;",
    "The sheet's time sits inside the lesson's minutes, in the beat it replaces or the independent work the slides leave room for, never set for another time or added on top; a replacement must preserve the intended learning and evidence;",
)

# Settled item g (A12): the validator refuses anything but the two values.
replace_once(
    PB,
    "- A generated worksheet is expected unless the teacher supplied one; an\n"
    "  unexplained `not-needed` decision is a design fault.\n",
    "- A generated worksheet is expected unless the teacher supplied one.\n",
)

# Settled item f (P32): re-pointing, as P48 already says.
replace_once(
    PB,
    "unavailable and that re-authoring that one question against what exists is the\n"
    "repair, not a scope breach.",
    "unavailable and that re-pointing that one reference at what exists is the\n"
    "repair, not a scope breach.",
)

for rel, gone in (
    (REV, "a printed alternative may preserve the same slide task"),
    (REV, "or printed reuse for lacking novelty"),
    (REV, "an optional sheet does not automatically need extra minutes"),
    (REV, "check the planned shared access"),
    (PB, "an unexplained `not-needed` decision"),
    (PB, "re-authoring that one question against what exists"),
):
    assert_absent(rel, gone)
print("reviewer and playbook changed")
