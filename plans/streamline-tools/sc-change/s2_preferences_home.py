"""Success criteria (4.2.288): `preferences.md` → Success Criteria, the home,
takes the teacher's decisions 1 to 6, 8, 9 and 15 (ledger, "Decisions taken"
and "Read back")."""
from pathlib import Path

P = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\references\preferences.md")
t = P.read_text(encoding="utf-8")


def swap(old: str, new: str) -> None:
    global t
    assert t.count(old) == 1, (t.count(old), old[:100])
    t = t.replace(old, new)


# Decision 4: a criteria-only slide is for criteria taught or built, never overflow.
swap(
    "The criteria belong on the My Turn slide and on practice slides, where children see them in use.\n",
    "The criteria belong on the My Turn slide and on practice slides, where children see them in use. A slide that is only the criteria is for criteria being taught, compared or built with the class, and then it may fill the slide (the vertebrates table in `Pride Lessons`); it is never where criteria go because they did not fit beside the work.\n",
)

# Decision 8: never on a worksheet.
swap(
    "The same holds for any slide whose whole job is a reveal.\n",
    "The same holds for any slide whose whole job is a reveal.\n"
    "\n"
    "**They stay on the board, and never go on a worksheet.** The teacher has cut the criteria off printed sheets before as a waste of the page, and does not want them on any worksheet or slip. A child working from a sheet has the board.\n",
)

# Decision 6: what criteria are, and sentence stems.
swap(
    "So success criteria can be how-to steps, a lookup table, a worked example, or a labelled reference/diagram; pick the form by what a child must glance at to succeed, and use more than one form when both genuinely help.",
    "So success criteria can be how-to steps, a lookup table, a worked example, a labelled reference/diagram, or sentence stems; pick the form by what a child must glance at to succeed, and use more than one form when both genuinely help.",
)
swap(
    "**Criteria say what the child does, or what good work shows. A table of facts the child reads is a representation, not the criteria, even when the task uses it.**",
    "**Criteria are what a child who gets stuck looks at and uses to do the task. A table of facts the child reads is a representation, not the criteria, even when the task uses it.**",
)
swap(
    "Keep the reference in its own zone under its own name and put the criteria under the criteria label. The one case where a labelled set IS the criteria is recognition: naming this tooth, this turn, this word class, where matching the instance to the named categories is the whole judgement.",
    "Keep the reference in its own zone under its own name and put the criteria under the criteria label. The one case where a labelled set IS the criteria is recognition: naming this tooth, this turn, this word class, where matching the instance to the named categories is the whole judgement. In a lesson where children explain, discuss or write, sentence stems are criteria too, inside a step or beside the steps (`Find something that has changed. This has changed because ...`), because a child who is stuck can pick one up and use it.",
)

# Decisions 9, 2 and 15: a second sentence, extra knowledge, questions as steps.
swap(
    "use as many steps as the method has, each one sentence with only the words it needs, and leave a step that is already clear alone.",
    "use as many steps as the method has, each normally one sentence with only the words it needs, and leave a step that is already clear alone. A second sentence is not a fault in itself, but one that only names what the step has just produced goes, because the panel has little enough room: `Change the ones digit to 0.` needs no `That's the ten below.`",
)
swap(
    "A condition the method always meets stays in the steps as a plain `If...` sentence; use a lookup table when several cases are easier to scan there.",
    "A condition that is part of a step stays in it, as a plain `If...` sentence or as a short question that tells the child what to do next (`Same? Move right.`); a fact to use, or a case that only sometimes comes up, is extra knowledge and goes to sticky knowledge or the teaching, not the steps. Use a lookup table when several cases are easier to scan there.",
)

# Decision 1: every taught word green, every time.
swap(
    "When one word could take two colours, the picture wins, then the taught word. Mark the words doing that work and leave the rest black: usually one or two parts of a step, and a step with nothing to pick out stays plain, because a step with every noun coloured has nothing standing out.",
    "Every taught word is green, every time, even when it also names a coloured part of the picture (`tens` beside a coloured tens column is green). The picture and orange marks go on the other words doing that work, so a step is not all black: usually one or two parts of a step, and a step with nothing else to pick out stays plain, because a step with every noun coloured has nothing standing out.",
)

# Decision 3: the whole list or none.
swap(
    "A method is not two methods merely because a narrow panel cannot hold it.",
    "A method is not two methods merely because a narrow panel cannot hold it. A method's steps appear all together, in order, or not at all: never only some of them, on a slide, on the wall or anywhere else, and when they do not fit, the layout changes, never the list.",
)

# Decision 5: offered to the wall, the same steps if they go up.
swap(
    "Mark such a criteria `drawLive: true`; the slide then carries a small flipchart drawing in the corner of its green panel, suggesting the possibility to the teacher, and the working wall reproduces the same reference.",
    "Mark such a criteria `drawLive: true`; the slide then carries a small flipchart drawing in the corner of its green panel, suggesting the possibility to the teacher, and the criteria are offered to the working wall. The wall designer decides whether there is a wall at all and what earns a place on it; criteria that go up are the exact same steps the class used, never a different version.",
)

# The contents line names what the section now holds.
swap(
    "- **Success Criteria** — a live reference, form follows the task, and the draw-live marking for wall-worthy references.",
    "- **Success Criteria** — what a stuck child uses while working, form follows the task, the whole list on the board and never on a worksheet, the colour marks, and the draw-live marking that offers a reference to the wall.",
)
P.write_text(t, encoding="utf-8")
print("preferences home ok")
