"""Assumed knowledge (4.2.287): the one story the ledger found with no log
entry is copied to the log first; only then does history keep its case as a
plain example, without the date."""
from pathlib import Path

ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")
LOG = ROOT / "references" / "build-review-log.md"
HIST = ROOT / "references" / "subject-history.md"

STORY = (
    "A Year 4 lesson on Victorian working conditions (16 September 2026) set Sarah Gooder's own 1842 words beside George, an invented servant boy, and Sam, an invented bird scarer, told in the same plain voice with nothing saying which was evidence and which was an example."
)

log = LOG.read_text(encoding="utf-8")
assert STORY not in log
entry = (
    "\n"
    "## 2026-09-23 - A child's world is not assumed: the board carries the teaching, a name arrives with its context, and the reviewer sees every name (4.2.287)\n"
    "\n"
    "*Topic 2 of the streamline in `plans/streamline-plan.md`: what children are assumed to already know.*\n"
    "\n"
    f"- **Stories kept here.** {STORY} That is why a made-up child is labelled as made up where children read the story (`subject-history.md`), which keeps the case as a plain example without its date.\n"
)
LOG.write_text(log.rstrip("\n") + "\n" + entry, encoding="utf-8")
print("log: story copied")

hist = HIST.read_text(encoding="utf-8")
assert hist.count(STORY) == 1
hist = hist.replace(
    STORY,
    "Sarah Gooder's own 1842 words set beside George, an invented servant boy, and Sam, an invented bird scarer, told in the same plain voice with nothing saying which was evidence and which was an example, is the confusion this prevents.",
)
HIST.write_text(hist, encoding="utf-8")
print("history: plain example")
