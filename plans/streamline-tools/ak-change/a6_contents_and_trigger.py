"""Assumed knowledge (4.2.287): the contents lines name what the sections now
hold, and the reviewer's trigger for Source and Scenario Integrity names the
two rules that moved there, so a lesson with either opens it."""
from pathlib import Path

ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")


def patch(rel: str, pairs) -> None:
    path = ROOT / rel
    t = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (rel, t.count(old), old[:100])
        t = t.replace(old, new)
    path.write_text(t, encoding="utf-8")
    print("patched", rel)


patch("references/preferences.md", [
    ("- **What a Lesson Is For** - durable learning named before the task, every stage there because the next needs it, and a final task that draws together what was built rather than checking who listened. Everyone who designs or reviews a lesson, every run.",
     "- **What a Lesson Is For** - durable learning named before the task, every stage there because the next needs it, a final task that draws together what was built rather than checking who listened, work drawn only from what children can use at that point, and knowledge taught before any beat asks for a judgement. Everyone who designs or reviews a lesson, every run."),
    ("- **Slide Philosophy** — the glance test, live teaching and visible meaning, takeaways, and the speaker-notes voice.",
     "- **Slide Philosophy** — the glance test, live teaching and visible meaning, takeaways, a case or a name arriving with its context, and the speaker-notes voice."),
])
patch("scripts/design-review-packet.py", [
    ('''        "Source and Scenario Integrity",
        "Read for real, classic, sensitive or changing sources and claims.",''',
     '''        "Source and Scenario Integrity",
        "Read for real, classic, sensitive or changing sources and claims, "
        "a named source, story or clip that may cost more explaining than it "
        "teaches, and any beat that invites children's own experience.",'''),
])
