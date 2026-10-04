"""The colours release, step 1: the stories that leave the runtime text are
copied to the build log first, before any runtime text moves. The entry starts
here with only its stories; `k9_log_entry.py` writes the rest above them. The
heading carries no version number: the lead numbers the release at merge."""
from _patch import LOG, append, assert_present, read

assert "(4.2.289)" in read(LOG)
assert "Blue is a question or a short task" not in read(LOG)
# The stories below are copied, not moved: each is still in its runtime home
# until the later scripts rewrite that home.
assert_present("builder/scripts/check-slide-design.js", "can we make only")
assert_present("references/teacher-slide-visual-profile.md",
               "A lone (1) on the circuit calibration was not identified as an intentional teacher correction.")

STORIES = (
    "- **Stories kept here as they leave the runtime.** "
    "A Year 4 history deck put `Explain your answer using the photograph.`, `Point to the details that support your comparison.` "
    "and seven more task lines in house blue, so the board arrived almost entirely blue and the colour stopped marking anything; "
    "the teacher asked (3 September 2026) \"can we make only questions to children blue\", and from then until this release "
    "the slide check refused every blue instruction and the visual profile said a task is black either way. "
    "His answer of 24 September 2026 narrows that ruling rather than reversing it: a question or a short task is blue, and a "
    "longer instruction about how to go about it stays black. Asked on 25 September 2026 whether the first of those two "
    "lines is blue, he said \"y\": a job that names what to use is still the job, so it is blue once marked, and only a line "
    "that says how to go about the job stays black. "
    "The visual profile's numbering note also recorded that a lone (1) on the circuit calibration was not identified as an "
    "intentional teacher correction; the profile now only points at Question Labelling.\n"
)

append(LOG, (
    "\n"
    "## 2026-09-25 - Blue is a question or a short task, green a taught word or an answer, and a worked example is purple on the board, the sheet and the wall\n"
    "\n"
    "*Topic 7's 7C in `plans/2026-09-24-topic-7-change-plan.md`: colours.*\n"
    "\n"
    + STORIES
))
print("stories copied")
