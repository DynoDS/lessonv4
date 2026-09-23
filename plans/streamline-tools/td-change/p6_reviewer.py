"""4.2.285: the design reviewer's rhythm checks say what the teacher decided."""
from pathlib import Path

P = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\agents\design-reviewer.md")
text = P.read_text(encoding="utf-8")


def swap(old: str, new: str) -> None:
    global text
    n = text.count(old)
    assert n == 1, (n, old[:80])
    text = text.replace(old, new)


# Decision 9: read what children do, not the format line.
swap(
    "And a lesson whose Do beats all share one response channel (every `format` a spoken or written explanation) is \"listen, then discuss\"",
    "And a lesson whose Do beats all share one response channel (every Do a spoken or written explanation, read from what children actually do rather than from its `format` line) is \"listen, then discuss\"",
)

# Decision 2: the fault is a second new idea before the first is used.
swap(
    "A beat carrying a second job that has no beat of its own, or a run of teacher-presented beats with no pupil action between them, is a purposeful design defect, not polish (`preferences.md` → The Teach → Do → Teach → Do Rhythm);",
    "A beat carrying a second job that has no beat of its own, or a run of teacher-presented beats that teaches a second new idea before children have used the first, is a purposeful design defect, not polish; two teacher slides carrying one idea, such as a Teach split across two slides, are not that run (`preferences.md` → The Teach → Do → Teach → Do Rhythm);",
)

P.write_text(text, encoding="utf-8")
print("design-reviewer.md patched")
