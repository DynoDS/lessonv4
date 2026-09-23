"""4.2.286: the reviewer's sample cases stop teaching the old excuse
(decisions 1 to 4), and the walk example is copied to the log before any
later change can lose it."""
import json
from pathlib import Path

ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")
FIXTURE = ROOT / "scripts" / "tests" / "fixtures" / "design-reviewer-behaviour-cases.json"

raw = FIXTURE.read_text(encoding="utf-8")
EDITS = [
    ("Do not reject a deliberately brief recall check when recall is the stated evidence claim.",
     "Do not reject a brief recall check whose answer is off the board when recall is the evidence it claims; a check that repeats the sentence just said is not that."),
    ("would be a sound task, and the sort is fine as a named two-minute orientation before the question that matters.",
     "would be a sound task."),
    ("A quick check may establish only that the class caught a new distinction when the design says so; judge what the beat claims",
     "A quick check may establish only that the class caught a new distinction, on a case the Teach did not show (here a fresh outline); judge what the beat claims"),
    ("Do not demand reasoning, a because sentence or fresh cases from a beat whose stated job is securing the names; do not call a supplied diagram answer leakage.",
     "Do not demand reasoning or a because sentence from a beat whose stated job is securing the names on a fresh outline; do not call a supplied diagram answer leakage."),
]
for old, new in EDITS:
    assert raw.count(old) == 1, old[:60]
    raw = raw.replace(old, new)
json.loads(raw)
FIXTURE.write_text(raw, encoding="utf-8")
print("fixture updated")
