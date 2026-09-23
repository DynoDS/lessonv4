"""4.2.285 decision 6: the reviewer reads the rhythm every review."""
from pathlib import Path

ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")
P = ROOT / "scripts" / "design-review-packet.py"
text = P.read_text(encoding="utf-8")


def swap(old: str, new: str) -> None:
    global text
    n = text.count(old)
    assert n == 1, (n, old[:80])
    text = text.replace(old, new)


# The conditional entry and its comment go; the reasoning moves to the always-read entry.
swap(
    '''    # A trigger has to be something the reviewer can see in the view before it
    # has made the judgement, or it never fires. "Read when a Do practises a
    # different idea from the one its own Teach taught" asks the reviewer to
    # have already found the fault in order to be sent to the section that
    # would help it find the fault, and a Year 4 History lesson was approved
    # twice with nothing but punctuation corrections. Counting Teach beats and
    # reading the last task are things the view answers on its face.
    (
        "The Teach → Do → Teach → Do Rhythm",
        "Read when two teacher-presented beats run with no pupil action "
        "between them, in any route, when a Do beat practises a different "
        "idea from the one its own Teach just taught, when a beat carries a "
        "second job that has no beat of its own, when a Do beat's expected "
        "answer is a summary, headline, recap or restatement of the "
        "explanation its own Teach just gave, or whenever the sequence has "
        "three or more Teach beats - with three, say in your own words the "
        "move each Teach taught and what its own Do makes children do, and "
        "check each pair before reading on.",
    ),
''',
    "",
)
swap(
    '''        "in its script, when a Do beat is a question to the room rather "
        "than every child using the idea, or when a substantial task "
        "arrives with instructions only.",''',
    '''        "in its script, or when a substantial task arrives with "
        "instructions only.",''',
)
swap(
    '''    (
        "preferences.md",
        "What a Lesson Is For",
        "The learning-contract checks cite it throughout; read it before them.",
    ),
''',
    '''    (
        "preferences.md",
        "What a Lesson Is For",
        "The learning-contract checks cite it throughout; read it before them.",
    ),
    # The rhythm was a conditional read, and two of its triggers (a Do on a
    # different idea from its own Teach, a beat with a second job) could only
    # be met by a reviewer that had already found the fault. A Year 4 History
    # lesson was approved twice with nothing but punctuation corrections. The
    # teacher's decision of 23 September 2026 made it an every-review read,
    # which also covers a question to the room, once routed to Slide
    # Philosophy, where only one clause on it lived.
    (
        "preferences.md",
        "The Teach → Do → Teach → Do Rhythm",
        "Read every review, before the thinking, practice and evidence "
        "checks: one idea per Teach used by every child before the next, "
        "counted in ideas rather than slides; a question to the room against "
        "every child using the idea; the pairing test; orientation and every "
        "beat earning its place; quick checks; and each beat changing the "
        "state of the lesson. When the sequence has three or more Teach "
        "beats, say in your own words the move each Teach taught and what its "
        "own Do makes children do, and check each pair before reading on.",
    ),
''',
)
P.write_text(text, encoding="utf-8")
print("packet patched")

R = ROOT / "agents" / "design-reviewer.md"
rtext = R.read_text(encoding="utf-8")
old = "- always read `preferences.md` → Pride Lessons (Quality Anchor) and What a Lesson Is For, `teacher-voice.md`"
assert rtext.count(old) == 1
rtext = rtext.replace(
    old,
    "- always read `preferences.md` → Pride Lessons (Quality Anchor), What a Lesson Is For and The Teach → Do → Teach → Do Rhythm, `teacher-voice.md`",
)
R.write_text(rtext, encoding="utf-8")
print("reviewer compatibility route patched")
