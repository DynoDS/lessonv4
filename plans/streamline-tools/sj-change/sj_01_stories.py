"""The subject-files release (topic 8, release 1), step 1: the one story the
ledger found missing from the build log is copied there first, before the file
that tells it is removed (change plan section 2 and section 10: SJ-C43 and
SJ-C50, "geography lost two ideas", told twice in the make-subject-file skill).
The entry starts here with only its stories; `sj_08_log_entry.py` writes the
rest above them. The entry has no version number: the lead numbers it at merge.

Every other date or story this release takes out of a runtime file is already
in the log, which this script checks before anything moves: the Victorian
schooling sketch (4.2.99), the Tudor boards he chose, the Tudor deck told in the
present tense with his words, the nearest-100 lesson that modelled 34 first,
the Classroom Secrets standard (4.2.220) and the balanced-diet lesson the food
rules came from."""
from _patch import LOG, append, read

log = read(LOG)
assert "(4.2.289)" in log
assert "The subject files are the six the plugin has" not in log

# Already in the log, so the runtime can lose the date or the telling.
for phrase in (
    "his own sketch of a Victorian schooling lesson (added 4 September, 4.2.99)",
    "`What a Teach slide holds: the Tudor calibration`",
    "Some children will just think THAT child experienced it, rather than this was a different time in history and many children experienced this.",
    "34 to the nearest 100 takes the same steps as 342",
    "## 2026-09-16 A maths sheet's questions read like Classroom Secrets (4.2.220)",
    "## 2026-08-31 " + chr(0x2014) + " Year 4 PSHE: What is a balanced diet and why does having one matter?",
):
    assert phrase in log, f"not in the log: {phrase}"

# Missing, and copied first.
assert "Geography proved this the hard way" not in log
assert "Geography lost two ideas" not in log

STORIES = (
    "- **Stories kept here as they left the runtime.** The make-subject-file skill, removed in this release, "
    "told one story the log did not hold, twice. At its cutting stage: \"Geography proved this the hard way. "
    "Its guard against showing a place through one lens survived compression intact, because it names where "
    "the repair lands: in the photo requirements, which the designer has to write. Its two best ideas alongside "
    "it, the beat where children question their evidence and the moment children are struck by the world, were "
    "compressed into true, well-argued sections that named no mechanism, and the very next lesson design skipped "
    "both.\" And at its proving stage, the whole paragraph: \"The comparison is the only check that catches what "
    "cutting broke, and it catches it nowhere else. The casualty and the cousin both ask whether the drafted file "
    "produces a good lesson, and it will: a strong lesson with one of his best ideas silently missing still reads as "
    "a strong lesson, so nobody notices the loss without the other version beside it. Geography lost two ideas "
    "exactly this way, and both were found by this run rather than by reading the file.\" By the time the skill was removed the telling was out of date in part: "
    "geography's one-lens guard no longer names the photo requirements, and its evidence-questioning beat still "
    "names nothing the designer has to fill.\n"
)

# Each passage quoted from the skill is its own words, whole (the skill is still
# there: sj_02 removes it).
skill = " ".join(read("skills/make-subject-file/SKILL.md").split())
quoted = STORIES.split('"')[1::2]
assert len(quoted) == 2, len(quoted)
for passage in quoted:
    assert " ".join(passage.split()) in skill, passage[:80]

append(LOG, (
    "\n"
    "## 2026-09-25 - The subject files are the six the plugin has: the skill that wrote new ones is gone, "
    "a history lesson need not use sources, food follows the NHS Eatwell Guide, and no lesson shows the Prophet Muhammad\n"
    "\n"
    "*Topic 8 of the streamline in `plans/streamline-plan.md`, its first release: the subject files. "
    "Built on a side branch; the version is set at merge.*\n"
    "\n"
    + STORIES
))
print("stories copied")
