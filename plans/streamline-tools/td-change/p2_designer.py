"""4.2.285: the lesson designer keeps how it records the rhythm and points to
the one home. Every replacement asserts its old text appears exactly once."""
from pathlib import Path

P = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\agents\lesson-designer.md")
text = P.read_text(encoding="utf-8")


def swap(old: str, new: str) -> None:
    global text
    n = text.count(old)
    assert n == 1, (n, old[:80])
    text = text.replace(old, new)


# Decision 7: the content structure's practice sits where the class is ready.
swap(
    "→ next distinct chunk → larger practice drawing learning together. Closely",
    "→ next distinct chunk → larger practice drawing learning together, placed where the class is ready for it. Closely",
)

# Decision 1: the section's opening two paragraphs become one reading paragraph.
swap(
    "Short explanation + model completing same manageable idea may be one coherent teaching block. Children must then use/process that idea before teacher introduces different new idea. Rule prevents several different concepts taught before children do anything; does not force activity between explanation and model of one idea.\n"
    "\n"
    "Skill-based: child-processing = guided + independent practice. Content-based: short use/processing beat after each chunk. Dialogic: Stimulus→Talk. Discovery: Explore before Teach why, Use learning after. Task-Centred: one enabling idea per `teach-needed` unit, each used through its `pupilInstruction` before the next is taught; only the last may be used by the plan or the task itself. Short teaching is not exempt: two ideas told before children use the first is the same failure as two Teach slides in a row. Questioning is not doing: the Do half, a `do` unit or a `pupilInstruction`, is every child using the idea (decide, sort, improve, rewrite, choose, produce); a question to the room is the beat only when chosen so the answer needs the idea and every child commits (`preferences.md` → The Teach → Do → Teach → Do Rhythm). A use of the wrong idea is not the beat either: the Do practises the move this Teach taught, not a neighbouring one the lesson happens to be about, so a Teach defining primary and secondary sources followed by children judging what one portrait proves about everybody taught one thing and used another, and passes every check that only asks whether children were active (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `The Do uses the idea its own Teach just taught`). Heading, explanation and following Do name one move between them; read the three back to back. A substantial task is launched before it is instructed: what the lesson has established, a good instance beside a weak one, the steps, on the board (`preferences.md` → Slide Philosophy, `Giving a task its instructions is not launching it`).\n",
    "`preferences.md` → The Teach → Do → Teach → Do Rhythm is the rhythm: read it whole at the start and again before you sequence the lesson. It holds an explanation and the model of one idea as one block; one idea per Teach, used by every child before the next, counted in ideas rather than slides, so two teacher slides carrying one idea are fine and a second new idea before children have used the first is not; how every route keeps the rhythm, short teaching included; a practical lesson's shape; questioning is not doing, and the Do uses the idea its own Teach just taught (heading, explanation and following Do name one move between them; read the three back to back); orientation, setting the scene, and every beat earning its place against the objective; naming what a chunk needs before choosing its activity; quick checks, matches and sorts; variety and demand across the lesson; and each beat changing the state of the lesson. What this section adds is how you record it. The Do half is a `do` unit or a `pupilInstruction`. A substantial task is launched before it is instructed: what the lesson has established, a good instance beside a weak one, the steps, on the board (`preferences.md` → Slide Philosophy, `Giving a task its instructions is not launching it`).\n",
)

# Stories leave, reasons and the teacher's words stay.
swap(
    "A teacher met exactly that on a finished Year 4 history deck (18 September 2026): \"because we had a big task already",
    "A teacher met exactly that on a finished deck: \"because we had a big task already",
)
swap(
    "a Teach without one is telling, and 28 saved designs in a row had written `null` there.",
    "a Teach without one is telling.",
)

# Decision 1: the earn-its-place paragraph now lives in the one home, with its limits.
swap(
    "**Every beat earns place against objective, and beat serving indirectly says so out loud.** Rhythm keeps children active, easy for beat to be busy without being lesson: background knowledge worth having can become little lesson inside lesson, children labelling lines while objective about biomes. Check each beat against LO as write: what does this let child do objective asks? When honest answer is beat supplies groundwork children will use (a prerequisite fact the first idea rests on), keep and make link part of teaching: say why matters for today's real question, have beat land back on objective. When it is orientation children will not use (what the subject is, why we are here, scene-setting), it is not automatically a chunk and needs no manufactured Do. Give it only the brief context the opening needs, separately when folding it into the first example would overload that example (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `Orientation is not automatically a Teach chunk`). Quick check: could child say what today's lesson was about after every beat, or would one leave thinking lesson about something else? Where beat serves nothing objective asks and cannot be linked back honestly, cut.\n\n",
    "",
)

# Decision 1: keep only what the designer adds to choosing a Do.
swap(
    "**Choose the thinking first, then the response form, then demand - three separate decisions.** Every Do beat: every child uses the chunk and leaves something the teacher can see (written answer, partner's spoken response, visible decision, physical position). Name what",
    "**Choose the thinking first, then the response form, then demand - three separate decisions.** Name what",
)
swap(
    "which explanation is better). Vary form when improves learning/attention/access, not quota. Demand climbs across lesson where the objective supports it; `preferences.md` owns that judgement across teaching responses and main practice together. A short recall response",
    "which explanation is better). A short recall response",
)

# Decision 10: a sort and its short reason are one action.
swap(
    "When children first sort, then explain, then generate new case, write three consecutive source units, each own prompt and answer.",
    "A sort and a short reason for its placements are one action and one unit (`Sort the six jobs, then say why you put the hardest one where you did`); an explanation or a new case that is its own piece of work is its own unit, with its own prompt and answer (`Sort the jobs, then write a paragraph on why Tudor children worked` is two).",
)
swap(
    "(a claim to judge and the explanation of that same claim; a calculation and the sentence about that same calculation)",
    "(a claim to judge and the explanation of that same claim; a sort and a short reason for its placements; a calculation and the sentence about that same calculation)",
)

# Decision 7: maintainer history and a stale description.
swap(
    "a row of arrows labels an order and cannot make one beat need the last, which is why an earlier version of this file that asked arrows to carry the spine was retired (2 September 2026); the spine is carried slide by slide below",
    "a row of arrows labels an order and cannot make one beat need the last, so the spine is carried slide by slide below",
)
swap(
    "The rhythm section is the load-bearing shape of every structure, task-centred and discovery included, and it is short.",
    "The rhythm section is the load-bearing shape of every structure, task-centred and discovery included.",
)

P.write_text(text, encoding="utf-8")
print("lesson-designer.md patched")
