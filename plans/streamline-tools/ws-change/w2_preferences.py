"""The worksheets release (4.2.290), step 3: `preferences.md`, the home of what a
sheet is for and of the printed page (change plan section 1, decisions 2, 9,
10 and 13; section 2, settled items a, g, h and k; section 4, stories).

Each replacement names its decision and the ledger row it changes. His words
are in `plans/2026-09-23-worksheets-ledger.md`, "His answers, 24 September
(morning)" and the settled items he confirmed ("y")."""
from _patch import PREF, replace_once, assert_absent

# Decision 2 (B01): "I wouldn't want the same exact questions on both ... It's
# just different context, different numbers etc in maths. Other lessons like
# PSHE etc might be different, it might be working towards a particular one
# question answered, the sheet is the proof of that." The practice slide keeps
# its own questions; the sheet never carries them. "Same performance" (the
# skill) stays, and a test holds that sentence; the new sentence says
# questions, so it cannot be read as performance.
replace_once(
    PREF,
    "The slide lesson remains teachable without printing. The teacher may use the worksheet as additional practice or as a printed alternative to the slide task. For an alternative, keeping the same useful task, diagram, labels and response structure is legitimate: the child does that work once, using the chosen medium. Record this intended use in the existing worksheet planning fields. When the sheet asks for essentially the same performance as the slide Practise, choose one and say it in `worksheet.demand`: it replaces that Practise (children do the work once, on paper), or it is additional practice after it. `It can replace the slide Practise or follow it` hands the design's decision to the teacher. The schema value `separate-fresh-worksheet` identifies the optional resource branch; it does not prohibit this deliberate reuse. A worked answer must still be withheld when independent retrieval is intended.",
    "The slide lesson remains teachable without printing. The practice slide keeps its own questions, and the sheet never carries them: in maths the sheet has different numbers and contexts; in a lesson like PSHE that works towards one question, the sheet can be that question, answered once, on the sheet, as the proof. The teacher may use the worksheet as additional practice or in place of the slide practice. In its place, keeping the slide's diagram, labels and response structure is legitimate, with the sheet's own questions: the child does the work once, using the chosen medium. Record this intended use in the existing worksheet planning fields. When the sheet asks for essentially the same performance as the slide Practise, choose one and say it in `worksheet.demand`: it replaces that Practise (children do the sheet in its place), or it is additional practice after it. `It can replace the slide Practise or follow it` hands the design's decision to the teacher. The schema value `separate-fresh-worksheet` identifies the optional resource branch; it does not prohibit keeping the slide's representation. A worked answer must still be withheld when independent retrieval is intended.",
)

# Decision 2 (B02): reuse for consolidation keeps the task's shape, never its
# questions.
replace_once(
    PREF,
    "Reusing a task for consolidation is legitimate when that is its stated purpose, rather than claiming it demonstrates unseen transfer.",
    "Reusing a task's shape for consolidation, with the sheet's own questions, is legitimate when that is its stated purpose, rather than claiming it demonstrates unseen transfer.",
)

# Decision 2 (A05).
replace_once(
    PREF,
    "including as the printed alternative described above.",
    "including in place of the slide practice, as described above.",
)

# Settled item k, his answer of 24 September (evening), "yes" (S01): the sheet
# may carry the same kind of write-on figure with its own questions, never the
# practice's own questions; the example is the one his question carried.
replace_once(
    PREF,
    "The same useful figure and task may also appear on that worksheet as a printed alternative, under the worksheet-use judgement above.",
    "The same kind of figure may also appear on that worksheet, under the worksheet-use judgement above, with the sheet's own questions and never the practice's own: in maths, different numbers (the practice marks 3,250 and 4,750 on a number line in steps of 250; the sheet's line asks for 6,250 and 8,500).",
)

# Decision 9, "yes" (D09): producing is chosen when it moves the objective on;
# making up their own values is one option, not the default; maths keeps its
# lean. Settled item g: the pointer names where the moves now live.
replace_once(
    PREF,
    "Reach for them by default on repeatable practice, falling back to a set list of questions only when generating would change the skill or there is no natural generator. The operational moves for briefing them live in the lesson-designer Worksheet section, and the maths-specific set in `subject-maths.md`.",
    "Choose one when producing moves the objective on; making up their own values is one option, not the default. In maths the lean is towards the child producing the maths (`subject-maths.md` → Making practice generative). The operational moves for briefing them live in `lesson-designer-components.md` → Generated worksheet, and the maths-specific set in `subject-maths.md`.",
)

# Settled item g (A06): a true pointer; this is the judgement's home.
replace_once(
    PREF,
    "The judgement above governs what an optional worksheet is for and why it is normally not load-bearing, including the required central-task-resource exception, and it is the only place that judgement lives. How one is generated lives in the Worksheet section of the lesson-designer agent: the two cases (Teacher provides / Generated), how question quantity is judged, the page-and-picture sizing rules, the generative moves, the question-labelling rule, the frame-as-worksheet case, and the duplicate-check between PPT and worksheet.",
    "The judgement above governs what an optional worksheet is for and why it is normally not load-bearing, including the required central-task-resource exception, and this is its home. How a generated sheet is designed lives in `lesson-designer-components.md` → Generated worksheet, which the lesson designer loads for a generated sheet: the activity, how question quantity is judged, the page-and-picture sizing rules, the generative moves and the response form. The lesson designer's own Worksheet section records the sheet: the two cases (teacher-provided or generated), the frame-as-worksheet case, the question-labelling rule and the check that the deck does not reuse a supplied sheet's numbers or contexts.",
)

# Settled item g (O02): nothing is titled on a sheet since 12 September.
replace_once(
    PREF,
    "The finished page must still have readable type, usable writing or plotting space, and a compact child-facing title.",
    "The finished page must still have readable type and usable writing or plotting space.",
)

# Settled item g (O12).
replace_once(
    PREF,
    "breathing room. Keep a compact title, one quiet accent and restrained square",
    "breathing room. Keep one quiet accent and restrained square",
)

# Settled item g (O36): a sheet has no header or objective. The paragraph's
# two em dashes go with the edit (the change plan, section 5).
replace_once(
    PREF,
    "The full LO is still used internally in the lesson design, worksheet headers, and spoken teacher orientation; only the on-slide display is cut short.",
    "The full LO is still used internally in the lesson design and spoken teacher orientation; only the on-slide display is cut short.",
)
replace_once(
    PREF,
    "Many LOs are a core action with detail tacked on — joined by a colon",
    "Many LOs are a core action with detail tacked on, joined by a colon",
)
replace_once(
    PREF,
    "The board reads **LO: To [verb] [object]** — \"To plan a fair test\"",
    "The board reads **LO: To [verb] [object]**: \"To plan a fair test\"",
)

# Settled item a (I01), his 23 September ruling: "worksheets are not homework,
# worksheets are delivered in class all the time".
replace_once(
    PREF,
    "A separate worksheet need not duplicate a reference that remains accessible, but a resource intended for use on its own cannot assume an unseen board.",
    "A worksheet need not duplicate a reference the board or the working wall shows while children work: every sheet is done in class.",
)

# Stories (O08): the superseded arrangement's history leaves (it is in the
# log); its last sentence is a live rule and stays.
replace_once(
    PREF,
    "This supersedes the earlier \"shared evidence panel\" arrangement recorded here, which had the question run down the left and a map, source set or data table in a panel on the right. That is the shape he rejected. A panel every question works from is a stimulus, and it goes above its questions in their own column.",
    "A panel every question works from is a stimulus, and it goes above its questions in their own column.",
)

# Decision 10, "yes" (O09): a method's steps are never a list printed just as
# a reminder; a fill-in frame is a question, and steps a task needs go with
# their question.
# It says nothing about where else the steps are shown. Settled item h: the
# worksheet designer's sentence-start case comes here as one plain example.
replace_once(
    PREF,
    "A step list a child must work *through* in order before they can answer anything is not support at all: it is part of the task, and goes above the questions in their own column like anything else they read from. And a step list",
    "A step list a child must work *through* in order before they can answer anything is not support at all: it is part of the task, and goes above the questions in their own column like anything else they read from. A list of a method's steps is never printed just as a reminder for the child to consult; a fill-in frame the child writes into (`method-frame` in maths) is a question, and steps a task needs worked through belong to their question. And a step list",
)
# Decision 10, as the lead read his "yes" in the first check's repair round:
# "never a list of steps printed just as a reminder" is the lead's wording, not
# his, and he called the reading "fine"; a one-line reminder of a method a
# child glances at is still support that comes after the work.
replace_once(
    PREF,
    "A reminder of a method they have already used and a prompt to check their work pass that test,",
    "A one-line reminder of a method they have already used and a prompt to check their work pass that test,",
)
replace_once(
    PREF,
    "so each of those is part of its question and sits with it, above the writing space rather than under it.",
    "so each of those is part of its question and sits with it, above the writing space rather than under it. Filed as a reminder instead, one prints where a child cannot use it: `Optional sentence start: \"You can...\"` under the line the sentence was to be written on.",
)

# Decision 13, "yes" (O11): each question takes the form its thinking needs;
# the cases vary, not the forms. "A title" is stale (settled item g), and
# "never chosen" is E05's own limit in this section.
replace_once(
    PREF,
    "Use one coherent visual or working surface, clear section blocks, small banks/cards/tables where they reduce reading load, and enough variation in response type to make the thinking visible. Colour is for navigation and support, not decoration. A title followed by a long numbered list and answer lines is a warning sign even when the prose is colour-coded.",
    "Use one coherent visual or working surface, clear section blocks, and small banks/cards/tables where they reduce reading load. Each question takes the form its thinking needs, and what varies is the cases, not the forms for their own sake. Colour is for navigation and support, not decoration. A long numbered list with answer lines that was never chosen is a warning sign, even when the prose is colour-coded.",
)

for gone in (
    "keeping the same useful task, diagram, labels and response structure is legitimate",
    "it does not prohibit this deliberate reuse",
    "including as the printed alternative described above",
    "Reusing a task for consolidation is legitimate",
    "Reach for them by default on repeatable practice",
    "and it is the only place that judgement lives",
    "How one is generated lives in the Worksheet section of the lesson-designer agent",
    "The operational moves for briefing them live in the lesson-designer Worksheet section",
    "compact child-facing title",
    "Keep a compact title",
    "worksheet headers",
    "cannot assume an unseen board",
    "enough variation in response type to make the thinking visible",
    "A title followed by a long numbered list",
    "as a printed alternative, under the worksheet-use judgement",
    "That is the shape he rejected.",
):
    assert_absent(PREF, gone)
print("preferences.md changed")
