"""4.2.285: the content route keeps its own shape and points to the one home."""
from pathlib import Path

P = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\references\teaching-sequence-content-based.md")
text = P.read_text(encoding="utf-8")


def swap(old: str, new: str) -> None:
    global text
    n = text.count(old)
    assert n == 1, (n, old[:80])
    text = text.replace(old, new)


# The story is in the build log (4.2.285); the rule and its reason stay.
swap(
    "The judgement is readiness, not position. A Year 4 history class (15 September 2026) could have written its explanations after the second chunk and instead sat through three more short whiteboard beats on the carpet, because the route put the main work last and the guidance that says to treat a substantial beat as main practice had nowhere earlier to put it. When the use",
    "The judgement is readiness, not position. When the use",
)

# Decision 1: a true repeat of the home becomes a pointer carrying its own words.
swap(
    "A content chunk teaches knowledge about the topic. Teach a new thinking move through the material it helps children understand, with enough explanation and guided use for the later task. A brief cue may suffice for a familiar comparison; an unfamiliar evidence decision may need focused teaching of its own. Keep that teaching connected to substantive content rather than replacing the lesson with generic rules about thinking.",
    "A content chunk teaches knowledge about the topic, and a new thinking move is taught through the material it helps children understand, with enough explanation and guided use for the later task (`preferences.md` → The Teach → Do → Teach → Do Rhythm owns when a brief cue is enough and when an unfamiliar move needs focused teaching).",
)

# Decision 3.
swap(
    "**Orient children enough to enter the first example.** Follow `preferences.md` → The Teach → Do → Teach → Do Rhythm: a brief separate presentation moment is allowed when it avoids overloading the first Teach, without inventing a Do for scene-setting. New prerequisite learning that children must use still earns teaching and processing.",
    "**Orient children enough to enter the first example.** Follow `preferences.md` → The Teach → Do → Teach → Do Rhythm, `Orientation is not automatically a Teach chunk`: in this route the scene is the opening of the first Teach, on a slide of its own when that avoids overloading the first teaching board, and never a beat of its own with a made-up Do after it. New prerequisite learning that children must use still earns teaching and processing.",
)

# Decision 8: this route agrees with the home on a question as the Do.
swap(
    "Every child uses it; a question to the room is a key question, not this beat (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `Questioning is not doing`).",
    "Every child uses it; a question to the room is a key question, not this beat, unless it is chosen so the answer needs the idea and every child commits, with how they commit written into the task (`preferences.md` → The Teach → Do → Teach → Do Rhythm, `Questioning is not doing`).",
)

# The teacher's words stay without their date; decision 9: read what children do, not the format line.
swap(
    "and a lesson whose every Do beat is `spoken explanation` has picked the channel once and repeated it. A Year 4 history lesson on why Tudor children worked (14 September 2026) read only §10, and every beat came out as explain it to your partner; the user taught it as \"listen to teacher, class discussion over and over again\". Before the design is settled, read the Do beats' `format` lines in order: when three or more in a row are talk or written explanation,",
    "and a lesson whose every Do beat is a spoken explanation has picked the channel once and repeated it. A lesson that read only §10 came out with every beat as explain it to your partner, and the teacher who taught it called it \"listen to teacher, class discussion over and over again\". Before the design is settled, read what children actually do in each Do beat, its task and instruction, in order, whatever its `format` line says: when three or more in a row are talk or written explanation,",
)

# Decision 7: a leftover name, and the Practise's place.
swap(
    "CURRENT allows a bounded observation, pattern or short exploration before a Teach",
    "This route allows a bounded observation, pattern or short exploration before a Teach",
)
swap(
    "\"activity\": \"the main application task after all Teach/Do pairs\",",
    "\"activity\": \"the main application task, after the Teach/Do pairs that supply what it needs\",",
)

P.write_text(text, encoding="utf-8")
print("content route patched")
