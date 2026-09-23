"""4.2.286 repairs from the quick-checks change check
(`plans/streamline-tools/quick-checks-change-check.md`)."""
from pathlib import Path

ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")
HOME = "`A quick check is a fresh case, not the last slide again`"
BOTH = "a fact, name or definition may be recalled with the answer off the board; an idea needs a fresh case"


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
# 1a: each pointer carries both halves of the recall line, not only the permitting half.
pref.swap(
    "(a quick check on a fresh case, or recall with the answer off the board: `A quick check is a fresh case, not the last slide again`).",
    f"({HOME}: {BOTH}).",
)
pref.swap(
    "(recall with the answer off the board, or a fresh case: `A quick check is a fresh case, not the last slide again`).",
    f"({HOME}: {BOTH}).",
)
# 1g: the proposal's own words, scoped to straight after teaching.
pref.swap(
    "A fact, a name or a definition is the one thing recalled rather than applied: straight after teaching it may be asked for once the answer is no longer on show, because that makes every child produce it and tells the teacher who has it, and it claims recall, never understanding.",
    "A fact, a name or a definition may be recalled straight after teaching once the answer is no longer on show, because that makes every child produce it and tells the teacher who has it, and it claims recall, never understanding.",
)
# 1f: A21's must-not comes with it.
pref.swap(
    "The same conclusion can be valid in two cases when each requires that work. A fact, a name",
    "The same conclusion can be valid in two cases when each requires that work; do not force different answers. A fact, a name",
)
# Section 5: the list that sends designers to decision 6's formats carries its condition.
pref.swap(
    "turn the words into a diagram or the diagram back into words,",
    "turn the words into a diagram or a diagram the class has not had explained back into words,",
)
pref.save()

ld = File("agents/lesson-designer.md")
# Section 3: B06 keeps its words and points home (decision 4), as decision 1 listed it word for word.
ld.swap(
    "A quick recall check is fine when recall is the claim and the answer is off the board (`preferences.md` → `A quick check is a fresh case, not the last slide again`); do not present it as deeper evidence.",
    f"A quick recall check is fine when recall is the claim; do not present it as deeper evidence (`preferences.md` → {HOME}: {BOTH}).",
)
ld.swap(
    "A short recall response may secure new knowledge, including in the last Do, when the answer is no longer on show (`preferences.md` → `A quick check is a fresh case, not the last slide again`).",
    f"A short recall response may secure new knowledge, including in the last Do (`preferences.md` → {HOME}: {BOTH}).",
)
ld.save()

rev = File("agents/design-reviewer.md")
rev.swap(
    "Preserve purposeful repeated practice and useful simple checks (a fresh case, or recall with the answer off the board: `preferences.md` → `A quick check is a fresh case, not the last slide again`);",
    f"Preserve purposeful repeated practice and useful simple checks (`preferences.md` → {HOME}: {BOTH});",
)
rev.swap(
    "the words turned into a diagram or back,",
    "the words turned into a diagram or a diagram the Teach did not explain turned back into words,",
)
rev.save()

beats = File("references/do-beats.md")
beats.swap(
    "Accurate classification may itself be the intended check, on cards the Teach did not show (`preferences.md` → `A quick check is a fresh case, not the last slide again`); do not",
    f"Accurate classification may itself be the intended check (`preferences.md` → {HOME}: the cards are cases the Teach did not show); do not",
)
beats.swap(
    "A short response can establish new knowledge, when its answer is not on the board (`preferences.md` → `A quick check is a fresh case, not the last slide again`); select",
    f"A short response can establish new knowledge (`preferences.md` → {HOME}: {BOTH}); select",
)
# 1b: the whole of True or False's limit.
beats.swap(
    "**The limit:** as True or False (5.3), fine but can be cheap: it earns its place only when the lie is one a child in the class could genuinely believe, never the slide's own sentence twisted.",
    "**The limit:** as True or False (5.3), fine but can be cheap: it earns its place only when the lie is one a child in the class could genuinely believe, never the slide's own sentence twisted, and the reason is written. Prefer a sort, a match or an odd one out when those force the same decision.",
)
# 1h: the label formats carry the no-other-picture limit.
beats.swap(
    "of a thing the Teach did not label (a different flower, a new stretch of river), or the taught one in a later lesson, when it is retrieval;",
    "of a thing the Teach did not label (a different flower, a new stretch of river), a blank copy of the taught one where no other picture of the thing exists (the world map), or the taught one in a later lesson, when it is retrieval;",
)
beats.swap(
    "Given a partially-blank diagram of a thing the Teach did not label, or the taught one in a later lesson, pupils fill in labels",
    "Given a partially-blank diagram of a thing the Teach did not label, a blank copy of the taught one where no other picture of it exists, or the taught one in a later lesson, pupils fill in labels",
)
# 1i: the example is the proposal's own, of a diagram the class has not had explained.
beats.swap(
    "*\"In one sentence, what is this diagram telling us about how the water gets back to the sky?\"*",
    "*\"In one sentence, what is this drawing of a puddle drying telling us?\"*",
)
beats.save()

tc = File("references/task-contrasts.md")
# 1d: the different-apprentice sentence was not in the proposal; back to what he agreed.
tc.swap(
    "**Where the simpler task is right.** A sort still earns its place when its cards are cases the lesson did not show: sorting a different apprentice's deal, once this one is taught, settles the vocabulary of the deal and needs it. The good/bad sort of the deal just taught is not the lesson's evidence, and a lesson that leans on it has taught less than it looks.",
    "**Where the simpler task is right.** The good/bad sort of the deal just taught is not the lesson's evidence, and a lesson that leans on it has taught less than it looks.",
)
tc.save()
