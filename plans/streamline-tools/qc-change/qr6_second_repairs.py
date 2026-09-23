"""4.2.286 repairs from the second check
(`plans/streamline-tools/quick-checks-repair-check.md`)."""
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


# Decision 10's second half: the incidents leave, the reasons stay (both are in the log).
rev = File("agents/design-reviewer.md")
rev.swap("passing for its thinking (what the source shows about the people, and why), and a reviewer approved both.",
         "passing for its thinking (what the source shows about the people, and why).")
# The pointer says what the view does: the first beat after each piece of teaching.
rev.swap("puts the expected answer of each beat where children use the teaching, in every route (a Do, a Your Turn, a Use the learning, an enabling input's own instruction), next to the teaching it follows,",
         "puts the expected answer of the first beat where children use each piece of teaching, in every route (a Do, a Your Turn beside its whole cycle, a Use the learning, a Talk, an enabling input's own instruction), next to the teaching it follows,")
rev.save()

pref = File("references/preferences.md")
pref.swap("set a description against a reason about an unnamed \"it\", and the teacher who wrote the lesson could not tell the groups apart.",
          "set a description against a reason about an unnamed \"it\", and even the adult who wrote them cannot tell the groups apart.")
# E03: the home gives the guessing half as well as the board's.
pref.swap("copying is what will be remembered (`What a Lesson Is For`, `Three questions, in this order`).",
          "copying is what will be remembered (`What a Lesson Is For`, `Three questions, in this order`). A line a child could have answered before the lesson is guessing, and gets the same answer.")
pref.save()

ld = File("agents/lesson-designer.md")
# Decision 6 in the designer's own list of the explanation formats.
ld.swap("words to diagram and back, what can we tell,",
        "words to diagram and back (a diagram the class has not had explained), what can we tell,")
ld.save()

beats = File("references/do-beats.md")
# Decision 5: Two Truths and a Lie took True or False's limit; its access line follows True or False's.
beats.swap("**SEND access:** familiar party-game framing lowers anxiety; concrete decision, not open prose.",
           "**SEND access:** familiar party-game framing lowers anxiety; the decision is the entry and the written reason the stretch.")
beats.save()

# The view: a combined stimulus and talk is read against the grounding input
# before it; every Use the learning of one exploration against the result made
# visible; a plan-checkpoint is a pupil beat; a Your Turn looks back to its own
# cycle only.
packet = File("scripts/design-review-packet.py")
packet.swap('''BESIDE_PUPIL_KINDS = {
    "do", "practise", "use-learning", "our-turn", "your-turn", "talk",
    "stimulus-talk", "do-task",
}''', '''BESIDE_PUPIL_KINDS = {
    "do", "practise", "use-learning", "our-turn", "your-turn", "talk",
    "stimulus-talk", "do-task", "plan-checkpoint",
}''')
packet.swap('''        self_paired = (kind == "teach-needed" and unit.get("pupilInstruction")) or kind == "stimulus-talk"
        if self_paired:
            pairs.append(([], unit))
        if kind not in BESIDE_PUPIL_KINDS and not self_paired:
            continue
        if kind == "stimulus-talk":
            continue
        shown: list[dict] = []
        for earlier in reversed(sequence[:index]):
            earlier_kind = earlier.get("kind")
            if earlier_kind == "our-turn" and kind == "your-turn":
                shown.append(earlier)
                continue''', '''        self_paired = kind == "teach-needed" and unit.get("pupilInstruction")
        if self_paired:
            pairs.append(([], unit))
            continue
        if kind not in BESIDE_PUPIL_KINDS:
            continue
        shown: list[dict] = []
        for earlier in reversed(sequence[:index]):
            earlier_kind = earlier.get("kind")
            if earlier_kind == "our-turn" and kind == "your-turn":
                shown.append(earlier)
                continue
            if earlier_kind == "my-turn" and kind == "your-turn":
                shown.append(earlier)
                break
            # One exploration can show two findings: every Use the learning
            # is read against the result made visible, not only the first.
            if kind == "use-learning" and earlier_kind in {"use-learning", "teach-why"}:
                if earlier_kind == "teach-why":
                    shown.append(earlier)
                continue''')
packet.swap('''        if shown and not (self_paired and kind == "teach-needed"):
            pairs.append((list(reversed(shown)), unit))''', '''        if kind == "stimulus-talk":
            # The activity is its own stimulus: what the class reads on it
            # counts, beside any grounding input before it.
            shown.insert(0, {**unit, "answer": None})
        if shown:
            pairs.append((list(reversed(shown)), unit))''')
packet.save()
