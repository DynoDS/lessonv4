"""Assumed knowledge (4.2.287): the teacher's ruling on where a picture came
from (23 September 2026, third round of decision 7): "We're over complicating
it. I don't think there should be any words. Just show the picture. The
teacher can say it if they need to. Doesn't need to be in the speaker notes.
Doesn't need to be on the board."

It is about pictures (an artist's drawing of how something might have looked,
a photograph of a place today). Written sources keep their honest labels in
children's words, a made-up child is still labelled as made up, and a caption
that carries something children use (which of two pictures is which, a place's
name, the date and maker of a source they judge) is untouched."""
from pathlib import Path

REPO = Path(r"C:\Users\Daniel\Projects\lessonv4")
ROOT = REPO / "plugins" / "lesson-v4"


def patch(path: Path, pairs) -> None:
    t = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (path.name, t.count(old), old[:100])
        t = t.replace(old, new)
    path.write_text(t, encoding="utf-8")
    print("patched", path.name)


patch(ROOT / "references" / "subject-history.md", [(
    "Identify sources honestly, in words the class already has: `This is what the Queen's order said, in simpler words`, `An artist drew this recently, to show what it might have looked like`. A label in a historian's words (`modern summary`, `modern reconstruction`, an organisation's name as the heading of a card) stays off the board unless the lesson teaches it: it is honest to an adult and means nothing to a Year 4 child, who now has one more thing on the board to ask about; the exact provenance goes in `teacherInfo`. Where a source came from is said only when it matters to the lesson, and not every source needs a line about it. Say it once: a set of pictures an artist drew recently is introduced as that at the first one, in the class's words (`An artist drew these recently, to show what it might have looked like`), and not captioned again under every return, because each caption takes height from the picture (`slide-composition-playbook.md` → Sets, banks, categories and captions); a Teach script's `Caption the picture ...` note is for its first appearance.",
    "Identify written sources honestly, in words the class already has: `This is what the Queen's order said, in simpler words`. A label in a historian's words (`modern summary`, `modern reconstruction`, an organisation's name as the heading of a card) stays off the board unless the lesson teaches it: it is honest to an adult and means nothing to a Year 4 child, who now has one more thing on the board to ask about; the exact provenance goes in `teacherInfo`. Where a source came from is said only when it matters to the lesson, and not every source needs a line about it. **A picture is just shown.** An artist's drawing of how something might have looked, or a photograph of a place today, carries no words about where it came from, on the board or in the notes; the teacher can say it if they need to. A caption a picture does need (which of two pictures is which) takes height from the picture (`slide-composition-playbook.md` → Sets, banks, categories and captions), so it is printed once, at the picture's first appearance, and a Teach script's `Caption the picture ...` note is for that first appearance.",
)])

patch(ROOT / "references" / "slide-composition-playbook.md", [(
    "and a caption that must be honest about what a picture is (drawn recently to show what it might have looked like, a photograph of the place today) is said once, in the class's words, at the picture's first appearance (`as it might have looked`, not `reconstructed`), not reprinted beneath each return; `reconstruction`, `modern summary` and an organisation's name stay off the board unless the lesson teaches them, and the exact provenance goes in the teacher's note.",
    "and a picture an artist drew to show how something might have looked, or a photograph of a place today, has no caption saying so: the picture is just shown, and the teacher can say it if they need to. `reconstructed`, `modern summary` and an organisation's name never go under a picture.",
)])

patch(ROOT / "agents" / "design-reviewer.md", [(
    "which a child reads as one more thing to ask about; each stays off the board unless the lesson teaches it, and the exact provenance goes in `teacherInfo`.",
    "which a child reads as one more thing to ask about; each stays off the board unless the lesson teaches it, and a picture is just shown, with no words about where it came from.",
)])

patch(ROOT / "scripts" / "tests" / "test_words_questions_and_do_beats.py", [(
    '''        # 4.2.287 (the teacher's assumed-knowledge decision 7): said once, in
        # the class's words, and never the word "reconstruction" untaught.
        history = flat(ROOT / "references" / "subject-history.md")
        self.assertIn("Say it once: a set of pictures an artist drew recently is introduced as that at the first one, in the class's words", history)
        self.assertNotIn("named as reconstructions", history)
        self.assertIn("`as it might have looked`, not `reconstructed`", flat(ROOT / "references" / "slide-composition-playbook.md"))
''',
    '''        # 4.2.287 (the teacher's ruling on decision 7, 23 September 2026:
        # "Just show the picture. The teacher can say it if they need to."):
        # no words about where a picture came from, on the board or in the notes.
        history = flat(ROOT / "references" / "subject-history.md")
        self.assertIn("**A picture is just shown.**", history)
        self.assertIn("carries no words about where it came from, on the board or in the notes", history)
        self.assertNotIn("named as reconstructions", history)
        playbook = flat(ROOT / "references" / "slide-composition-playbook.md")
        self.assertIn("has no caption saying so: the picture is just shown", playbook)
        self.assertIn("which of two pictures is which", playbook)
''',
)])

# His words, recorded in the ledger beside the other rounds.
LEDGER = REPO / "plans" / "2026-09-22-assumed-knowledge-ledger.md"
anchor = "- His test, given in his Teach then Do decision 3 reply (recorded in full in\n  that ledger):"
assert LEDGER.read_text(encoding="utf-8").count(anchor) == 1
patch(LEDGER, [(anchor,
    "- 7, third round (asked after the change check found the caption rule and a\n"
    "  Teach slide's script disagreeing): \"We're over complicating it. I don't think\n"
    "  there should be any words. Just show the picture. The teacher can say it if\n"
    "  they need to. Doesn't need to be in the speaker notes. Doesn't need to be on\n"
    "  the board.\" Settled: a picture (an artist's drawing of how something might\n"
    "  have looked, a photograph of a place today) carries no words about where it\n"
    "  came from, on the board or in the notes. Written sources keep their honest\n"
    "  labels in children's words, a made-up child is still labelled as made up,\n"
    "  and a caption children use (which picture is which, a place's name, a\n"
    "  source's date and maker) is untouched.\n" + anchor)])
