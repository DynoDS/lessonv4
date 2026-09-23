"""4.2.285 repairs from the independent change check
(`plans/streamline-tools/teach-then-do-change-check.md`)."""
from pathlib import Path

ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")


class File:
    def __init__(self, rel: str) -> None:
        self.path = ROOT / rel
        self.text = self.path.read_text(encoding="utf-8")

    def swap(self, old: str, new: str) -> None:
        n = self.text.count(old)
        assert n == 1, (self.path.name, n, old[:90])
        self.text = self.text.replace(old, new)

    def save(self) -> None:
        self.path.write_text(self.text, encoding="utf-8")
        print("patched", self.path.name)


pref = File("references/preferences.md")
# 1c: the designer's copy said "short" and "manageable"; the home carries both.
pref.swap(
    "An explanation and its model may form one coherent teaching block when they develop the same idea.",
    "A short explanation and its model may form one coherent teaching block when they develop the same manageable idea.",
)
# 1d: the designer's copy said Discovery explores before its Teach why.
pref.swap(
    "and Discovery as the use of each finding after its Teach why.",
    "and Discovery as an exploration before each Teach why and the use of that finding straight after it.",
)
# 1b: the challenge is an attempt at the target; investigating first has its own route; maths skill lessons.
pref.swap(
    "It opens on the challenge itself, before any teaching, only under the Skill-based route's conditions for a bounded first attempt: the attempt is safe, cheap and quick to reset, the goal is self-evident, and success or failure is visible to the child without the teacher judging it (`teaching-sequence-skill-based.md`). `Can you make the bulb light?` passes, because it lights or it does not. `Have a go at column subtraction first` does not, because a written method fails silently, and a maths lesson opens with the model (`subject-maths.md`). Otherwise the brief teaching comes first and the challenge follows it.",
    "It opens on the challenge itself, an attempt at the target before any teaching, only under the Skill-based route's conditions for a bounded first attempt: the attempt is safe, cheap and quick to reset, the goal is self-evident, and success or failure is visible to the child without the teacher judging it (`teaching-sequence-skill-based.md`). `Can you make the bulb light?` passes, because it lights or it does not. `Have a go at column subtraction first` does not, because a written method fails silently, and a maths skill lesson opens with the model (`subject-maths.md`). Otherwise the brief teaching comes first and the challenge follows it. An investigation or observation before the teaching is not this challenge and follows its own rules: the Discovery route, the content route's `observe`, and the subject file.",
)
# 1a: say what the system can do; the question of a scene slide on a board that fits goes to the teacher.
pref.swap(
    "In a knowledge lesson the scene is the opening of the first Teach beat, on a slide of its own when that makes sense (the Slide Designer splits the beat there), and never a beat of its own with a made-up task after it.",
    "In a knowledge lesson the scene is the opening of the first Teach beat, on a slide of its own when the first board would otherwise be too full (the Slide Designer splits the beat there), and never a beat of its own with a made-up task after it.",
)
pref.save()

content = File("references/teaching-sequence-content-based.md")
content.swap(
    "in this route the scene is the opening of the first Teach, on a slide of its own when that avoids overloading the first teaching board, and never a beat of its own with a made-up Do after it.",
    "in this route the scene is the opening of the first Teach, on a slide of its own when the first board would otherwise be too full, and never a beat of its own with a made-up Do after it.",
)
content.save()

ld = File("agents/lesson-designer.md")
# Section 4: "again" was new; the preferences introduction already says return to the part a decision needs.
ld.swap(
    "`preferences.md` → The Teach → Do → Teach → Do Rhythm is the rhythm: read it whole at the start and again before you sequence the lesson.",
    "`preferences.md` → The Teach → Do → Teach → Do Rhythm is the rhythm: read it whole at the start, and go back to the part a decision needs when you make it.",
)
ld.swap(
    "It holds an explanation and the model of one idea as one block;",
    "It holds a short explanation and the model of one manageable idea as one block;",
)
ld.save()

skill = File("references/teaching-sequence-skill-based.md")
# 1e: the plain example stays, as it did for J17 and J18.
skill.swap(
    "leaves the first move a single demonstration away from independent work. So the Your Turn",
    "leaves the first move a single demonstration away from independent work: 43 and 45 modelled and guided once, then not written by a child until a mixed set twenty minutes and two more moves later. So the Your Turn",
)
# Section 3: the slide check refuses consecutive My Turn slides from different units only.
skill.swap(
    "and the slide check refuses two consecutive My Turn slides (`MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS`), which is the same board reached by splitting one unit whose examples cannot share a visual.",
    "and the slide check refuses two consecutive My Turn slides from different units (`MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS`); two slides that split one unit whose examples cannot share a visual are one move and pass.",
)
skill.save()

dial = File("references/teaching-sequence-dialogic.md")
# 1f: the decision said "writes a position or picks a side".
dial.swap(
    "only when every child first commits to what their character would say, in writing or to a partner, before anyone performs",
    "only when every child first writes what their character would say, or picks a side, before anyone performs",
)
dial.save()

beats = File("references/do-beats.md")
# 1g: its best use is now the starter.
beats.swap(
    "Bakes spacing into the Do beat itself.",
    "Bakes spacing into the starter itself.",
)
beats.save()

readme = ROOT / "README.md"
rt = readme.read_text(encoding="utf-8")
old = "Children process information before the next piece arrives. Never two teach beats back-to-back."
assert rt.count(old) == 1
readme.write_text(rt.replace(old, "Children process information before the next piece arrives. Never a second new idea taught before children have used the first."), encoding="utf-8")
print("patched README.md")

packet = ROOT / "scripts" / "design-review-packet.py"
pt = packet.read_text(encoding="utf-8")
old = '''        "the pairing test; a Do whose expected "'''
assert pt.count(old) == 1
pt = pt.replace(old, '''        "the pairing test; a beat that carries a second job; a Do whose expected "''')
packet.write_text(pt, encoding="utf-8")
print("patched design-review-packet.py")
