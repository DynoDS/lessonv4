"""4.2.286 quick checks: the text changes, decisions 1 to 8 and 10 of the
quick-checks ledger (all "Agree", 23 September 2026). Every replacement
asserts its old text appears exactly once."""
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


# ---- The one home: preferences.md, the rhythm section ----
pref = File("references/preferences.md")
# Decision 8 with decisions 1 and 4: the home carries what makes a case fresh,
# when recall is honest, and when saying what a beat is for is honest.
pref.swap(
    "**A quick check is a fresh case, not the last slide again.** A short check straight after teaching is a real Do beat when children apply what was just taught to something the Teach did not show: a new picture to place, a new card to sort, a new example to judge, a new situation to predict (the teacher's ruling, 14 September 2026).",
    "**A quick check is a fresh case, not the last slide again.** A short check straight after teaching is a real Do beat when children apply what was just taught to something the Teach did not show: a new picture to place, a new card to sort, a new example to judge, a new situation to predict (the teacher's ruling).",
)
pref.swap(
    "That holds for an option bank whose right answer is the Teach's own sentence reworded, and for a wrong option no child this age would believe. A retrieval starter",
    "That holds for an option bank whose right answer is the Teach's own sentence reworded, and for a wrong option no child this age would believe. What makes a case fresh depends on what it checks: for a procedure, fresh values can be enough when carrying out the procedure is itself the target; for reasoning, inference or explanation, a different name, picture or claim earns freshness only when children must examine or use its relevant features to reach an answer, and reusing the taught conclusion while ignoring the new material is weak evidence. The same conclusion can be valid in two cases when each requires that work. A fact, a name or a definition is the one thing recalled rather than applied: straight after teaching it may be asked for once the answer is no longer on show, because that makes every child produce it and tells the teacher who has it, and it claims recall, never understanding. A check that an idea, a relationship or a method's decision has landed is a fresh case. The difference is whether the answer is still in front of the child: after the enamel slide, `cover the board: what is the hard outer layer called?` is recall, `which of these says what enamel does?` with the Teach's own sentence as the right option is finding, and `which of these three teeth has lost its enamel?` is the fresh case. Saying what a beat is for is honest when it changes what the beat claims or what is done to the task (a check of unaided work takes its support away, a supported rehearsal says it is not assessing, a reused task says it is consolidation). It never lets a label stand in for the fresh case: after teaching the key on a map of Brazil, the check is reading the key on a map of Kenya, and calling a re-read of the Brazil map a quick check does not make it one. A retrieval starter",
)
# Decision 3: a label check straight after teaching uses a new picture, with its two limits.
pref.swap(
    "The limit is the recap boundary above: where securing the exact term is the point (naming the layers on the tooth diagram just taught), labelling the taught thing is right, and the design says so.",
    "Where securing the exact term is the point, the label check straight after the Teach is on a new picture of the same thing: the layers named on a different tooth cut in half, not on the tooth diagram just taught. Where no other picture of the thing exists (the world map), a blank copy of the same one is the check, and in a later lesson the same picture is fine, because by then it is retrieval (`A quick check is a fresh case, not the last slide again`).",
)
# Decision 4: each permission keeps its words and points to the recall line.
pref.swap(
    "A quick check, fresh practice of a taught method and a discussion in which each child's reasoning is heard all stay legitimate choices rather than failures to aim higher.",
    "A quick check, fresh practice of a taught method and a discussion in which each child's reasoning is heard all stay legitimate choices rather than failures to aim higher (a quick check on a fresh case, or recall with the answer off the board: `A quick check is a fresh case, not the last slide again`).",
)
pref.swap(
    "A response after new teaching may simply establish or retrieve it, including the last short response before main practice.",
    "A response after new teaching may simply establish or retrieve it, including the last short response before main practice (recall with the answer off the board, or a fresh case: `A quick check is a fresh case, not the last slide again`).",
)
# Decision 8: the thinking line is read against the board and against what the class knew.
pref.swap(
    "Then read it against what the slide will show. If the line can be answered by reading the board, choose again,",
    "Then read it against what the slide will show and against what the class knew walking in. If the line can be answered by reading the board, choose again,",
)
pref.save()

# ---- The designer ----
ld = File("agents/lesson-designer.md")
ld.swap(
    "A quick recall check is fine when recall is the claim; do not present it as deeper evidence.",
    "A quick recall check is fine when recall is the claim and the answer is off the board (`preferences.md` → `A quick check is a fresh case, not the last slide again`); do not present it as deeper evidence.",
)
ld.swap(
    "A short recall response may secure new knowledge, including in the last Do.",
    "A short recall response may secure new knowledge, including in the last Do, when the answer is no longer on show (`preferences.md` → `A quick check is a fresh case, not the last slide again`).",
)
# Decision 8: the designer keeps the disagreement case and a pointer; the rule itself is the home's.
ld.swap(
    "A quick check straight after teaching is a legitimate beat, and not every Do must stretch, when children use what was just taught on a case the Teach did not show: a new picture to place, a new card to sort (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `A quick check is a fresh case, not the last slide again`). Keep it short and save the reasoning for later. Picking or finishing the sentence just said is not a check, whatever the beat is named. What this rule prevents",
    "A quick check straight after teaching is a legitimate beat, and not every Do must stretch, when it is a fresh case (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `A quick check is a fresh case, not the last slide again`). Keep it short and save the reasoning for later. What this rule prevents",
)
ld.save()

# ---- The reviewer (its own words kept; decision 2 and a pointer for decision 4) ----
rev = File("agents/design-reviewer.md")
rev.swap(
    "so a pleasant/unpleasant sort is adequate as a brief orientation and insufficient as the main evidence of an explanation.",
    "so a pleasant/unpleasant sort is insufficient as the main evidence of an explanation.",
)
rev.swap(
    "Preserve purposeful repeated practice and useful simple checks;",
    "Preserve purposeful repeated practice and useful simple checks (a fresh case, or recall with the answer off the board: `preferences.md` → `A quick check is a fresh case, not the last slide again`);",
)
rev.save()

# ---- The contrasts (decisions 1 and 2) ----
tc = File("references/task-contrasts.md")
tc.swap(
    "**Where the simpler task is right.** As a two-minute orientation straight after the deal is taught, the good/bad sort settles the vocabulary of the deal before the question that matters. It is fine there, named as a check, and it is not the lesson's evidence.",
    "**Where the simpler task is right.** A sort still earns its place when its cards are cases the lesson did not show: sorting a different apprentice's deal, once this one is taught, settles the vocabulary of the deal and needs it. The good/bad sort of the deal just taught is not the lesson's evidence, and a lesson that leans on it has taught less than it looks.",
)
tc.swap(
    "a quick label-reading check after a new map skill is an honest recall beat, named as one.",
    "a quick label-reading check after a new map skill is an honest recall beat.",
)
tc.save()

# ---- History (decisions 2 and 10) ----
hist = File("references/subject-history.md")
hist.swap(
    "and the Tudor lesson rebuilt on 14 September 2026 is the calibration for both halves.",
    "and the teacher's rebuilt Tudor lesson (`Why did Tudor children work?`) is the calibration for both halves.",
)
hist.swap(
    "To `sort what was bad and what was good about being an apprentice` is still a fair two-minute orientation before the question that matters; it is not evidence that children can explain the choice, and a lesson that treats it as the main work has taught less than it looks.",
    "To `sort what was bad and what was good about being an apprentice` straight after the deal is taught is a sort a child finishes from everyday sense; it is not evidence that children can explain the choice, and a lesson that leans on it has taught less than it looks.",
)
hist.save()

# ---- Science (decision 8: the pointer carries the format's two conditions) ----
sci = File("references/subject-science.md")
sci.swap(
    "- **Which result supports it?** Choose the result that is evidence for the claim, and say what rules the others out (10.8).",
    "- **Which result supports it?** Choose the result that is evidence for the claim, and say what rules the others out (10.8: results children read for themselves, with wrong options a child could believe).",
)
sci.save()

# ---- The catalogue (decisions 3, 4, 5 and 6) ----
beats = File("references/do-beats.md")
SUMMARY_LIMIT = "**The limit:** not straight after the Teach it gives back, and only where children have been taught to summarise (`evidence-synthesis.md` §4); it earns its place when children choose across several things with the teaching off the board."
SKETCH_LIMIT = "**The limit:** not straight after the Teach it gives back, and only where children have been taught to sketch from memory, with what the sketch must contain named (`evidence-synthesis.md` §4); it earns its place when children choose across several things with the teaching off the board."
for old in (
    "**Best for:** consolidating a single Teach chunk fast. Lower stakes than Brain Dump.\n",
    "**Best for:** after a content-rich Teach slide; works as the bridge into written response.\n",
    "**Best for:** end of a Teach chunk where there is a single core idea.\n",
    "**Best for:** abstract or wordy chunks where pupils need to identify the core.\n",
    "**Best for:** end of a major Teach chunk; bridge into the lesson's main Practise.\n",
    "**Best for:** end-of-lesson consolidation; mid-lesson if you want a wider sweep.\n",
):
    beats.swap(old, old + SUMMARY_LIMIT + "\n")
for old in (
    "**Best for:** any chunk with a spatial or sequential structure.\n",
    "**Best for:** end-of-chunk consolidation when content is conceptual.\n",
):
    beats.swap(old, old + SKETCH_LIMIT + "\n")
beats.swap(
    "**Best for:** recall consolidation that feels like a game.\n",
    "**Best for:** recall consolidation that feels like a game.\n**The limit:** as True or False (5.3), fine but can be cheap: it earns its place only when the lie is one a child in the class could genuinely believe, never the slide's own sentence twisted.\n",
)
beats.swap(
    "A simple unlabelled diagram is provided; pupils add labels, arrows, and short notes from memory",
    "A simple unlabelled diagram is provided, of a thing the Teach did not label (a different flower, a new stretch of river), or the taught one in a later lesson, when it is retrieval; pupils add labels, arrows, and short notes from memory",
)
beats.swap(
    "Given a partially-blank diagram, pupils fill in labels",
    "Given a partially-blank diagram of a thing the Teach did not label, or the taught one in a later lesson, pupils fill in labels",
)
beats.swap(
    "Different children can be given different links.\n",
    "Different children can be given different links. The link is one the Teach did not explain; explaining the arrow the teacher has just talked through is saying it back.\n",
)
beats.swap(
    "Name what the diagram has to contain, or the task drifts into decoration.\n",
    "Name what the diagram has to contain, or the task drifts into decoration. The explanation is one the class has not already been shown drawn; drawing the diagram just shown is copying it.\n",
)
beats.swap(
    "**Best for:** after a modelled diagram, and as the check that a picture children copied actually means something to them.",
    "**Best for:** a diagram the class has not had explained (the same process drawn differently, a new cycle), and as the check that a picture children copied actually means something to them. One sentence about the diagram the teacher has just talked through is a restatement, not this.",
)
beats.swap(
    "Accurate classification may itself be the intended check; do not turn every quick sort into a written explanation.",
    "Accurate classification may itself be the intended check, on cards the Teach did not show (`preferences.md` → `A quick check is a fresh case, not the last slide again`); do not turn every quick sort into a written explanation.",
)
beats.swap(
    "A short response can establish new knowledge; select meaningful use",
    "A short response can establish new knowledge, when its answer is not on the board (`preferences.md` → `A quick check is a fresh case, not the last slide again`); select meaningful use",
)
beats.save()
