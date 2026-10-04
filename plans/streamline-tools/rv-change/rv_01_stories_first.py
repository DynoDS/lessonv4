"""The design reviewer release, step 1: the stories that leave the reviewer's
instructions are copied to the build log first, before any runtime text moves.
Each incident is already in the log in other words (the ledger's "Stories and
dated rulings" table), but not every sentence the reviewer carried, so each
leaves word for word into one "Stories kept here" block. The entry starts here
with only its heading and its stories; `rv_08_log_entry.py` writes the rest
above them. The heading carries no version number: the lead numbers the release
at merge."""
from _patch import LOG, REV, append, assert_present, read

assert "(4.2.292)" in read(LOG)
HEADING = ("## 2026-09-26 - The design reviewer mends the words itself and names the bigger fixes for the "
           "lesson designer, judges the board before the notes, and opens the three sections its checks send it to")
assert HEADING not in read(LOG)

# Copied, not moved: each sentence is still in the reviewer's file until
# `rv_02_reviewer.py` takes it out.
LEFT = [
    "The lesson that shows the gap: a Year 4 history design was approved here on 10 September 2026 with "
    "`both comparison objects available and live model space retained`, and was abandoned in the room, because "
    "one plate came back on nine of eighteen slides and the practice beat carried all four sources, a two-part "
    "task, three bullets and an evidence question at once.",
    "and the plugin approved a deck that failed it on 14 September 2026 (a photograph, `A Tudor farm household` "
    "under it, the teaching in the notes; the user: \"there's nothing on the slide to guide me to know what to "
    "say\").",
    "On 22 September 2026 two lessons in a row were approved with `each Teach board can be taught with notes "
    "closed` while every Teach script carried a reason or a refusal the board did not",
    "and that is how a class met `What does one visible detail suggest about this class?` after a review that "
    "found nothing.",
    "`Read 66 child-facing strings as a Year 4 child; repaired 0.` was the whole sweep on a Year 4 PSHE lesson "
    "whose four task strings the teacher could not read at all (`Food: rush through the morning without eating "
    "until late afternoon.`)",
    "An RE beat printed `What do their reasons share?` over a script saying `Tell your partner what is the same "
    "and what is different`; the plain version was already written and the class got the clever one.",
    "A Year 4 RE deck passed this review with two children's reasons on the board as text cards and its own "
    "carol-singing photograph unused.",
    "This is the check that was too thin to catch a place-value-chart lesson whose sheet had no chart on it",
    "it was the shape of every sheet counted on 12 September 2026, including a *name the layers of teeth* sheet "
    "that asked for three names on three ruled lines under an unused diagram.",
    "and today the teacher edits it out by hand.",
]
for sentence in LEFT:
    assert_present(REV, sentence)

STORIES = (
    "- **Stories kept here as they leave the runtime.** The design reviewer's instructions told nine incidents "
    "and one reason written as a moment. Each incident is already in this log in other words; the reviewer's own "
    "sentences are kept here as they stood. On amount: \"" + LEFT[0] + "\" On the Teach board that teaches too "
    "little: \"" + LEFT[1][4:] + "\" and \"" + LEFT[2] + "\"; the two script lines that sentence went on to quote "
    "(`He wasn't a king who could order everybody to obey him`; `People sometimes call the whole front of their "
    "body their tummy, but the stomach is this one organ`) stay in the reviewer's instructions as plain examples "
    "of the finding. On reading the words as a child, a string read inside JSON braces is read as a "
    "specification, \"" + LEFT[3] + "\" On the voice sweep's count line: \"" + LEFT[4] + ", and that line is what "
    "a sweep that happened and a sweep that did not both produce.\" The reason stays there, the incident leaves. "
    "On a question the slide asks more compactly than its script: \"" + LEFT[5] + "\" `What do their reasons "
    "share?` stays there as a plain example. On an invented person: \"" + LEFT[6] + "\" On a maths sheet: \""
    + LEFT[7] + ", so read the forms rather than confirming the objective matches.\" On the response forms: \"A "
    "sheet whose questions are all `written-explanation` and `short-answer` is the shape this check exists to "
    "catch: " + LEFT[8] + "\" The teeth sheet stays there as a plain undated example. And the reason a voice miss "
    "is not polish ended \"" + LEFT[9] + "\", a moment written as a reason; it now says the teacher would have to "
    "edit it out by hand.\n"
)

append(LOG, (
    "\n"
    + HEADING + "\n"
    "\n"
    "*Topic 8 of the streamline in `plans/streamline-plan.md`, its release 2: the design reviewer. Built on a "
    "side branch; the version is set at merge.*\n"
    "\n"
    + STORIES
))
print("stories copied")
