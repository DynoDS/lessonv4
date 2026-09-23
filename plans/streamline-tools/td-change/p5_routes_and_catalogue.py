"""4.2.285: task, discovery and dialogic routes, the Do catalogue, the voice
guide's practical section, the evidence file and the route checks."""
from pathlib import Path

REF = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\references")


class File:
    def __init__(self, name: str) -> None:
        self.path = REF / name
        self.text = self.path.read_text(encoding="utf-8")

    def swap(self, old: str, new: str) -> None:
        n = self.text.count(old)
        assert n == 1, (self.path.name, n, old[:80])
        self.text = self.text.replace(old, new)

    def save(self) -> None:
        self.path.write_text(self.text, encoding="utf-8")
        print("patched", self.path.name)


# ---- Task-centred route ----
task = File("teaching-sequence-task-centred.md")
# Decision 2: the fault is ideas taught before children use the first.
task.swap(
    "Packing the ideas into one unit with one check after all of them puts several slides of the teacher talking in a row, and the deck reads",
    "Packing the ideas into one unit with one check after all of them teaches several ideas before children use the first, and the deck reads",
)
# Decision 1: the three homes for a second job now live in the rhythm's home.
task.swap(
    "Give it a home on the line instead. If the task can use it, it is an enabling idea before the doing. If it belongs to the product, put it in the product: a question box is a rule about how we ask questions, so it can be one of the agreement's own rules. If it is a routine rather than learning, it lives in the teacher's notes.",
    "Give it a home on the line instead: an enabling idea before the doing, part of the product, or the teacher's notes (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `Each major beat changes the state of the lesson`, says which is which).",
)
# Decision 7: say which unit the validator checks.
task.swap(
    "the validator refuses a `teach-needed` followed by another whose `pupilInstruction` is null.",
    "the validator refuses a `teach-needed` whose `pupilInstruction` is null when another `teach-needed` follows it.",
)
# Decision 6: the staged-task rule moves above the line the reviewer reads to.
staged = (
    "**A task with several stages stays one `do-task`, and `steps` is where the stages live.** Making a class agreement runs propose → combine → agree; a design-and-make runs sketch → build → test. Each stage is its own entry in `launch.steps`, in the order children work through them, and the slide designer gives a stage that needs the board its own slide. That is the intended route, not a workaround for a scaffold that only allows one task: the single `do-task` is what keeps the doing reading as the centrepiece instead of fragmenting into a run of short practice beats. Reach for a separate `plan-checkpoint` unit only when planning produces a distinct artefact before the doing begins."
)
task.swap(
    staged + " Use a separate `plan-checkpoint` source unit only when planning produces a genuinely distinct artefact/beat before the doing. When CURRENT's planning/checkpoint is deliberately folded",
    "When the planning or checkpoint is deliberately folded",
)
task.swap(
    "A task children can begin from its question alone, because the enabling input was one unit and the product form is familiar, leaves `launch` null.\n",
    "A task children can begin from its question alone, because the enabling input was one unit and the product form is familiar, leaves `launch` null.\n\n" + staged + "\n",
)
task.save()

# ---- Discovery route (decision 4) ----
disc = File("teaching-sequence-discovery.md")
disc.swap(
    "### Finish purposefully\n",
    "### When the lesson discovers two things\n"
    "\n"
    "A discovery lesson may discover more than one thing, and the rhythm holds inside it: each finding is taught and then used before the next is taught (`preferences.md` → The Teach → Do → Teach → Do Rhythm). There are two shapes, and the design chooses. When one exploration reveals both, make both visible, then teach why for the first and have children use it, then teach why for the second and use that. When the second finding builds on the first, run a second exploration once the first has been taught and used: explore, make the result visible, teach why, use the learning. Either way, each `Teach why` carries one idea.\n"
    "\n"
    "### Finish purposefully\n",
)
disc.swap(
    "When writing `lesson-design.json`, append these source-unit kinds to `teachingSequence` in the lesson's final order. The common source-unit fields live in `output-template.md`.",
    "When writing `lesson-design.json`, append these source-unit kinds to `teachingSequence` in the lesson's final order: `question`, `explore`, `make-sense`, `teach-why`, `use-learning`, then for each further finding either `teach-why`, `use-learning` (the same exploration showed it) or `explore`, `make-sense`, `teach-why`, `use-learning` (a second exploration), then `finish`. The common source-unit fields live in `output-template.md`.",
)
disc.save()

# ---- Dialogic route (decisions 5 and 7) ----
dial = File("teaching-sequence-dialogic.md")
dial.swap(
    "- Role-play or hot-seating (\"you're [character] — what would you say?\")\n- Short structured debate\n",
    "- Role-play or hot-seating (\"you're [character] — what would you say?\"), only when every child first commits to what their character would say, in writing or to a partner, before anyone performs\n- Short structured debate, only when every child first picks a side and writes one reason\n",
)
dial.swap(
    "Do not use this for substantial factual teaching; CURRENT's Content-based routing rule still applies.",
    "Do not use this for substantial factual teaching; that still needs Content-based teaching.",
)
dial.save()

# ---- The Do catalogue (decision 5) ----
beats = File("do-beats.md")
beats.swap(
    "### 9.7 Think-Aloud Reverse\nThe teacher has modelled",
    "### 9.7 Think-Aloud Reverse\n**Teacher-owned response routine:** do not select this unless the teacher explicitly requests it.\nThe teacher has modelled",
)
beats.swap(
    "**Best for:** lesson 2+ in a sequence; opening Do beat after Teach 1.",
    "**Best for:** the starter of lesson 2+ in a sequence.",
)
beats.save()

# ---- The voice guide's practical section (decisions 1 and 11) ----
voice = File("teacher-voice.md")
voice.swap(
    "For a practical lesson:\n- use short challenges;\n- give only the teaching needed before the next action;\n- let pupils notice patterns;\n- pause for brief teaching;\n- send them back to the task.\n\nExample structure:\n> Challenge → brief teaching → try it → quick check → improve it → record it.\n\n",
    "The shape of a practical lesson, and when it may open on the challenge itself, is in `preferences.md` → The Teach → Do → Teach → Do Rhythm, `A practical lesson keeps the teaching short and lets the doing lead`. What it sounds like:\n\n",
)
voice.swap(
    "Avoid turning an activity-led lesson into:\n> explanation → explanation → explanation → worksheet.\n\n---\n\n# 14. Tone by lesson type",
    "---\n\n# 14. Tone by lesson type",
)
voice.save()

# ---- Evidence file (decisions 7 and 12) ----
ev = File("evidence-synthesis.md")
ev.swap(
    "→ teach the next distinct chunk → larger practice that draws the lesson's knowledge together.",
    "→ teach the next distinct chunk → larger practice that draws the lesson's knowledge together, placed where the class is ready for it.",
)
ev.swap(
    "Add an honest synthesis when it helps children compare what actually emerged, then obtain proper individual evidence",
    "End with an honest synthesis that compares what actually emerged, then obtain proper individual evidence",
)
ev.save()

# ---- Route checks (decision 4) ----
rc = File("design-review-route-checks.md")
rc.swap(
    "the result becomes visible, and explicit explanation follows.",
    "the result becomes visible, and explicit explanation follows each finding, with children using one finding before the next is taught.",
)
rc.save()
