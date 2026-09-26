"""The voice guide release, step 1: the stories that leave the runtime are copied
to the build log first, before any runtime text moves (change plan section 6,
"Stories", and section 10). Each sentence that leaves is kept here word for
word, in one "Stories kept here" block; so is each story the plan names to be
copied where the log lacks it, though its runtime sentence stays where it is.
The entry starts with only its heading and its stories; `vg_08_log_entry.py`
writes the rest above them. The heading carries no version number: the lead
numbers the release at merge.

Not copied here: the tooth slide inside the content route's first-day test
(VG-L61). The routes release (topic 8, release 3), which merges before this one,
takes that story out of the route and copies it into its own entry first; this
release does not touch that paragraph, so until the routes release lands the
story stays in the route, and nothing is lost either way. `vg_09_follow_at_merge.py`
checks the log holds it on the merged tree."""
import re

from _patch import LD, LOG, SD, TV, append, assert_present, read

assert "(4.2.294)" in read(LOG)
HEADING = ("## 2026-09-26 - The voice guide sends every kind of writing to its own part, humour is welcome in "
           "every subject, a class the lesson comes back to gets a lively name, and speaker notes are as long as "
           "the idea needs")
assert HEADING not in read(LOG)

# Copied, not moved: each sentence is still in its file until `vg_02_guide.py`
# takes it out (the first two), or stays where it is (the rest).
A11 = ("Three reached real children. `Choose a job.` on an appliances sheet, which a class answered `Fireman`, and "
       "`Write one question you would ask before making a stronger judgement.` on a Greater Depth diet sheet, both "
       "§6 (5 September 2026). `What do their reasons share?` on a Year 4 RE slide, where §12's own calibrated "
       "wording was already sitting in that same slide's teacher script (11 September 2026). Every one was written "
       "by an agent that had read each section it was routed to.")
C13 = ("A Year 4 RE slide printed `What do their reasons share?` while its own script said `Tell your partner what is "
       "the same and what is different`. The plain version was already written, by the same agent, on the same "
       "slide. The board got the clever one, and `share` means something different to a nine-year-old than it does "
       "to an adult.")
L18 = ("which is why a real Year 4 class met `Begin with one clip deliberately left loose, trace the broken path` on "
       "the whiteboard.")
O07 = ("A real deck showed a Year 4 class `A rechargeable battery charged from the mains` and `It is powered by a "
       "person's hand, not electricity`, which are mark-scheme phrasings, where a child says `a battery you charge "
       "up` and `you turn it with your hand`.")
O49 = ("A Year 4 deck printed \"One fictional child\" in the middle of its concept map because the description was "
       "copied as if it were a label; a child reads \"fictional\" and meets the planning voice, not the lesson.")
for rel, sentence in ((TV, A11), (TV, C13), (LD, L18), (LD, O07), (SD, O49)):
    assert_present(rel, sentence)

# Two stories live in code comments, which no agent reads (VG-P04, VG-Q29).
# They stay there; the log gains them. The worksheet test's comment quotes two
# em dashes, which are named here rather than copied.
Q29 = ("on 22 September 2026 a repair moved a portrait slide to lead-picture-lines and put the title in the line, so "
       "the class read the question twice and no teaching.")
assert Q29 in re.sub(r"' \+\s*'", "", read("builder/scripts/check-slide-design.js"))
P04_WORDS = "On 30 August 2026 two lessons\n// shipped worksheets carrying raw em dashes"
assert P04_WORDS in read("worksheet-html/test/house-style-wiring.test.js")

STORIES = (
    "- **Stories kept here as they leave the runtime.** The voice guide's reading route told the three prompts that "
    "reached children, which its reason stood on: \"" + A11 + "\" Each is in this log already, the diet sheet's "
    "question in the worksheets entry (4.2.290); the reason stays in the guide without them. The guide's reversal "
    "check told the RE slide as it happened: \"" + C13 + "\" It stays there as one plain example of the shape, "
    "without the incident. Two of his rulings in the guide lost their dates and keep his words: \"quick, punchy and "
    "summarised. It doesn't sound warm. It doesn't sound human\" (14 September 2026, in this log at 4.2.200, whose "
    "own telling has another order, and each place keeps its own) and \"now slides are simple and better, a bit of "
    "humour would make me like them more but has to be funny\" (12 September 2026, in this log at 4.2.152). "
    "Copied here because this log lacked them, while their sentences stay where they are: the lesson designer's "
    "stage directions on the board (\"" + L18 + "\"), its answer slide in mark-scheme words (\"" + O07 + "\"), the "
    "slide designer's concept map (\"" + O49 + "\"), the slide check's message on a Teach card that repeats its "
    "title (\"" + Q29 + "\"), and the house-style test's comment: on 30 August 2026 two lessons shipped worksheets "
    "carrying raw em dashes, one in the Year 4 water-cycle sheet's word bank, between `evaporation` and `water goes "
    "into the air`, and one in the Year 4 friendships Greater Depth help line, between `boundary` and `a limit`, "
    "while the same day's decks and walls were clean. The tooth slide inside the content route's first-day test is "
    "copied by the routes release, which takes it out of the route.\n"
)

append(LOG, (
    "\n"
    + HEADING + "\n"
    "\n"
    "*Topic 8 of the streamline in `plans/streamline-plan.md`, its release 5: the voice guide. Built on a side "
    "branch; the version is set at merge.*\n"
    "\n"
    + STORIES
))
print("STORIES_FIRST_OK")
