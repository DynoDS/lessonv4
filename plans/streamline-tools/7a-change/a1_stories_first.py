"""Release 7A (4.2.293), step 1: the one story the starters ledger found missing
from the build log (SA-H13, change plan A13 "Copy first") is copied there
before any runtime text moves. The entry starts here with only its stories;
`a12_log_entry.py` writes the rest above them.

The other stories this release takes out of runtime text are already in the log
and are not copied again: the PSHE deck that lost its "Starter" (2 September
2026, the log's entry of that day), his starter-title ruling of 19 September
(L645) and his 21 September words on the test-question starter (L43)."""
from _patch import CONTENT, LOG, append, assert_present, read

assert "(4.2.292)" in read(LOG)
assert "(4.2.293)" not in read(LOG)
assert "How a lesson opens and closes" not in read(LOG)
# Copied, not moved: the story is still in its runtime home until a4 rewrites it.
assert_present(CONTENT, "A Year 4 history beat took it on 17 September 2026 and opened `A photograph of Victorian children who worked.`")
# The stories already in the log, checked by their words rather than trusted.
assert_present(LOG, "The heading is now always \"Starter\", drawn by the builder")
assert_present(LOG, "It keeps doing little titles for the starter.")
assert_present(LOG, "i dont want anything to do with it. its not ready. its not a feature needed")

STORIES = (
    "- **Stories kept here as they leave the runtime.** "
    "The content route once offered a second shape for a Teach slide whose sentence is a sticky fact, where `takeaway` "
    "carried the fact and the headline named what was on the board. A Year 4 history beat took it on 17 September 2026 "
    "and opened `A photograph of Victorian children who worked.`, with `Victorian children from poor families worked "
    "because their families needed the money` demoted to the star line at the bottom; the teacher rebuilt the slide by "
    "hand to put the sentence back at the top, and the route then wrote the headline as the landed sentence (4.2.223, "
    "which had no entry of its own here). The reason stays in the route as a clause: a child can already see what the "
    "picture shows, and cannot see why.\n"
)

append(LOG, (
    "\n"
    "## 2026-09-26 - How a lesson opens and closes: the test-question starter and the Lesson 2 plan are gone, "
    "sticky knowledge and the Apply are written once, a sticky fact usually leads its Teach board, and the wall keeps "
    "the lesson's sentences whole (4.2.293)\n"
    "\n"
    "*Topic 7's 7A in `plans/2026-09-24-topic-7-change-plan.md`: starters, sticky knowledge, the Apply slide and "
    "the lesson's ends. The change scripts are in `plans/streamline-tools/7a-change/`.*\n"
    "\n"
    + STORIES
))
print("stories copied")
