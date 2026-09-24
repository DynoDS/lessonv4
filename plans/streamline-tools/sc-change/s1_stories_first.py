"""Success criteria (4.2.288): the stories the ledger found missing from the
log are copied there first, before any wording moves."""
from pathlib import Path

LOG = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\references\build-review-log.md")
t = LOG.read_text(encoding="utf-8")
assert "(4.2.288)" not in t
entry = (
    "\n"
    "## 2026-09-23 - Success criteria are what a stuck child uses: written once, in full on the board, never on a worksheet (4.2.288)\n"
    "\n"
    "*Topic 5 of the streamline in `plans/streamline-plan.md`: success criteria.*\n"
    "\n"
    "- **Stories kept here.** A Year 4 science content lesson chose steps for its criteria and wrote `Explain the job electricity powers`, a step nothing anywhere had told it how to phrase; that is why a lesson on any route whose criteria come out as steps reads the skill route's section on writing them. A Year 4 history lesson referenced its criteria on three source units and printed the panel on six slides, so on the two continuation slides the green box was as loud as the new source comparison it was meant to serve; that is why the criteria do not arrive on every part of a split by default. And the class that could not find the tens either side (4.2.221) was stuck on 346 (17 September 2026): `Find the 10s or 100s each side of your number.` named what to find without saying how.\n"
)
LOG.write_text(t.rstrip("\n") + "\n" + entry, encoding="utf-8")
print("stories copied")
