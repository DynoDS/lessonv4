"""The design reviewer release, step 2: the reviewer's own instructions
(`agents/design-reviewer.md`), decision by decision, as the change plan's
section 3 has them (`plans/2026-09-24-topic-8-change-plan.md`) and his words in
`plans/2026-09-23-design-reviewer-ledger.md` ("His answers, 24 September").

Each replacement asserts its old text once; the stories were copied to the log
by `rv_01_stories_first.py` before this runs."""
from _patch import REV, assert_absent, assert_present, read, replace_once

assert "stories kept here as they leave the runtime" in read("references/build-review-log.md").lower()

# --- Decision 2 (his 1, then "1. y"): small wording fixes are the reviewer's; a
# picture swap or a rewritten Do beat goes to the lesson designer, with the
# reviewer naming the fix. Two checks worded those fixes as the reviewer's own.
# RV-C10 (a Teach example written as an instruction to look) is a wording fix
# and stays the reviewer's, unchanged: his answer of 26 September, asked with
# "Look at the diagram." whether the reviewer rewrites it itself as what children
# will notice ("Notice the enamel is the hardest layer."), was "yes"
# (`rv_00_his_c10_answer.py`).

# RV-J34: a Do that says its Teach back. The list of repairs and both pointers
# are unchanged.
replace_once(
    REV,
    "The repair is local and keeps the chunk: ask for the because, one link in the chain,",
    "The repair keeps the chunk and is the Lesson Designer's, because it changes what children have to think: return "
    "it naming the fix, which asks for the because, one link in the chain,",
)

# RV-M14: a photograph of a tool the engine draws. M15 is unchanged.
replace_once(
    REV,
    "Raise it as a correction naming the helper that should draw it.",
    "Return it to the Lesson Designer, naming the helper that should draw it.",
)

# --- Settled item 4 (his b, stronger): the board first, judged on its own; the
# speaker notes separately. RV-I07's second half is unchanged.
replace_once(
    REV,
    "Judge the spoken and visible explanation together; do not solve a missing connection merely by adding words "
    "to an already crowded slide.",
    "Judge the visible explanation first, on its own, and the spoken one separately, so nothing counts as taught on "
    "the board because the script says it; do not solve a missing connection merely by adding words to an already "
    "crowded slide.",
)

# --- Settled item 5, the reviewer's own out-of-date lines.

# RV-O14: the run now sends a failed check to the reviewer's focused repair
# first, and only then to a fresh design attempt. The reason still holds.
replace_once(
    REV,
    "The orchestrator can only answer a failed check by sending the whole design back for repair, which delays every "
    "resource in the lesson so that one sentence can be shortened, and shortening it here costs you a minute.",
    "A failed check sends your corrections to a focused repair and, only if that fails, the whole design to a fresh "
    "attempt, which delays every resource in the lesson so that one sentence can be shortened; shortening it here "
    "costs you a minute.",
)

# RV-P06: the report shape shows the closest calls the after-review check
# already requires.
replace_once(
    REV,
    "## Voice sweep\n"
    "Read [N] child-facing strings as a Year [Y] child; repaired [M].\n"
    "\n"
    "## Judgements\n",
    "## Voice sweep\n"
    "Read [N] child-facing strings as a Year [Y] child; repaired [M].\n"
    "Closest to a repair:\n"
    "> \"the exact string\" - why it stands\n"
    "> \"the exact string\" - why it stands\n"
    "> \"the exact string\" - why it stands\n"
    "\n"
    "## Judgements\n",
)

# RV-J18: a note about a past change; the field is simply there now.
replace_once(REV, "The design now states this in each unit's `unlocks`", "The design states this in each unit's `unlocks`")

# --- Settled item 10, one copy of each rule. The near-repeats keep their words
# (O01 "one clear", K03's middle sentence, N09, P08).

# RV-E05: the validator list (E02) holds it.
replace_once(REV, "\n\nDo not recheck identifier or reference legality.\n\n", "\n\n")

# RV-N14: the reading list's step 11 and the walk-through step hold the order.
replace_once(
    REV,
    "Then read the closing decisions of `design-decisions.md`, the part you left until now.\n\n",
    "",
)

# RV-K09: the User-fit judgement (C02) owns the amount test.
replace_once(
    REV,
    "- each moment carries only what the class can take in at once (the User-fit judgement above owns that test; do "
    "not run it twice);\n",
    "",
)

# RV-K03: the middle sentence stays; "do not repeat a separate whole-lesson
# sweep" is G02's "Do not perform separate whole-lesson rereads for each one."
replace_once(
    REV,
    "Here judge the wording you noted in its teaching context; do not repeat a separate whole-lesson sweep.",
    "Here judge the wording you noted in its teaching context.",
)

# RV-P12 joins P09: moved word for word beside it.
replace_once(
    REV,
    "Use `APPROVED` when no purposeful lesson decision remains defective. Local corrections and teacher flags may "
    "exist.\n",
    "Use `APPROVED` when no purposeful lesson decision remains defective. Local corrections and teacher flags may "
    "exist. Use `REDESIGN REQUIRED` when one or more purposeful lesson decisions must change.\n",
)
replace_once(REV, "\n\nUse `REDESIGN REQUIRED` when one or more purposeful lesson decisions must change.\n\n", "\n\n")

# --- Settled item 11, stories (all copied to the log by step 1). Reasons stay.

# RV-C06
replace_once(
    REV,
    " The lesson that shows the gap: a Year 4 history design was approved here on 10 September 2026 with `both "
    "comparison objects available and live model space retained`, and was abandoned in the room, because one plate "
    "came back on nine of eighteen slides and the practice beat carried all four sources, a two-part task, three "
    "bullets and an evidence question at once.",
    "",
)

# RV-C08: the sentence ends at "this catches too little".
replace_once(
    REV,
    "Amount catches too much; this catches too little, and the plugin approved a deck that failed it on 14 September "
    "2026 (a photograph, `A Tudor farm household` under it, the teaching in the notes; the user: \"there's nothing on "
    "the slide to guide me to know what to say\").",
    "Amount catches too much; this catches too little.",
)

# RV-C13: its two script lines stay, as plain examples of the finding.
replace_once(
    REV,
    "On 22 September 2026 two lessons in a row were approved with `each Teach board can be taught with notes closed` "
    "while every Teach script carried a reason or a refusal the board did not (`He wasn't a king who could order "
    "everybody to obey him`; `People sometimes call the whole front of their body their tummy, but the stomach is "
    "this one organ`).",
    "A script line such as `He wasn't a king who could order everybody to obey him` or `People sometimes call the "
    "whole front of their body their tummy, but the stomach is this one organ`, with no counterpart on the board, is "
    "that finding.",
)

# RV-F09: the reason stays.
replace_once(
    REV,
    "A string read inside JSON braces beside its field name is read as a specification, and that is how a class met "
    "`What does one visible detail suggest about this class?` after a review that found nothing.",
    "A string read inside JSON braces beside its field name is read as a specification.",
)

# RV-G05: its last clause is the reason the closest calls exist, and stays.
replace_once(
    REV,
    "`Read 66 child-facing strings as a Year 4 child; repaired 0.` was the whole sweep on a Year 4 PSHE lesson whose "
    "four task strings the teacher could not read at all (`Food: rush through the morning without eating until late "
    "afternoon.`), and that line is what a sweep that happened and a sweep that did not both produce.",
    "A count line alone is what a sweep that happened and a sweep that did not both produce.",
)

# RV-G21: `What do their reasons share?` over its script stays as a plain
# example.
replace_once(
    REV,
    "An RE beat printed `What do their reasons share?` over a script saying `Tell your partner what is the same and "
    "what is different`; the plain version was already written and the class got the clever one.",
    "`What do their reasons share?` printed over a script saying `Tell your partner what is the same and what is "
    "different` is the shape: the plain version is already written, and the class gets the clever one.",
)

# RV-M06
replace_once(
    REV,
    " A Year 4 RE deck passed this review with two children's reasons on the board as text cards and its own "
    "carol-singing photograph unused.",
    "",
)

# RV-D06: a moment written as a reason; the reason stays.
replace_once(REV, "and today the teacher edits it out by hand.", "and the teacher would have to edit it out by hand.")

# RV-L10 (the worksheets plan's Q10, left here): the instruction stays.
replace_once(
    REV,
    "This is the check that was too thin to catch a place-value-chart lesson whose sheet had no chart on it, so read "
    "the forms rather than confirming the objective matches.",
    "Read the forms rather than confirming the objective matches.",
)

# RV-L11 (the worksheets plan's Q11, left here): the teeth sheet stays as a
# plain undated example, as the lesson designer's components keep it.
replace_once(
    REV,
    "is the shape this check exists to catch: it was the shape of every sheet counted on 12 September 2026, including "
    "a *name the layers of teeth* sheet",
    "is the shape this check exists to catch, as in a *name the layers of teeth* sheet",
)

# --- The fixed reader: the lead's reading of his words, not his wording. On the
# rest-of-preferences list (24 September) he said "I actually don't know why it
# says nine-year-old. Um, because the plugin is for years one, two, three, four,
# five, and six, right?" of other lines; the lead carried it to this one, in
# the words "the actual child in this class".
replace_once(
    REV,
    "the actual eight- or nine-year-old the year group names, who has not read the plan",
    "the actual child in this class, who has not read the plan",
)

for gone in (
    "10 September 2026", "14 September 2026", "22 September 2026", "12 September 2026", "nine of eighteen",
    "An RE beat printed", "carol-singing", "today the teacher", "too thin to catch", "Read 66 child-facing",
    "Raise it as a correction", "The repair is local",
    "spoken and visible explanation together", "can only answer a failed check", "The design now states",
    "Do not recheck identifier", "the part you left until now", "do not run it twice",
    "do not repeat a separate whole-lesson sweep", "eight- or nine-year-old",
):
    assert_absent(REV, gone)
assert read(REV).count("Use `REDESIGN REQUIRED` when one or more purposeful lesson decisions must change.") == 1
# His answer on C10: the reviewer's own wording fix, its words unchanged.
assert_present(REV, "Repair it to what they will notice, or, when the picture's own label already names the thing, "
                    "take the line off the board and let the key question do the pointing")
assert_present(REV, "Neither is a count. There is no cap on beats, slides, sources or words, and a lesson that needs "
                    "six beats gets six; the question is what a child holds at once and whether a return adds something.")
print("reviewer done")
