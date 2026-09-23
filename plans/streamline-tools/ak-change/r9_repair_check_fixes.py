"""Assumed knowledge (4.2.287): fixes from the second check
(`assumed-knowledge-repair-check.md`) that need no decision from the teacher.
Its finding 3 (is words about how a picture was made "never", or "only when the
lesson uses them") and the Tudor calibration's captions (finding 1) wait for
his answer."""
from pathlib import Path

REPO = Path(r"C:\Users\Daniel\Projects\lessonv4")
ROOT = REPO / "plugins" / "lesson-v4"
HERE = Path(__file__).resolve().parent


def patch(path: Path, pairs) -> None:
    t = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (path.name, t.count(old), old[:100])
        t = t.replace(old, new)
    path.write_text(t, encoding="utf-8")
    print("patched", path.name)


HIST = ROOT / "references" / "subject-history.md"
patch(HIST, [
    # Finding 5: every source keeps the honesty rule; the picture sentence
    # below covers only a picture made later.
    ("Identify written sources honestly, in words the class already has:",
     "Identify sources honestly, in words the class already has:"),
    # Finding 2: his words were "doesn't need to be in the speaker notes".
    ("carries no words about how it was made (`This is a reconstructed picture of a historical setting`), on the board or in the notes; the teacher can say it if they need to.",
     "has no caption about how it was made (`This is a reconstructed picture of a historical setting`), and the notes need not say it either; the teacher can say it if they need to."),
])

PLAYBOOK = ROOT / "references" / "slide-composition-playbook.md"
patch(PLAYBOOK, [
    # Finding 3, the settled half: decision 7 as agreed says "unless the
    # lesson teaches them", as history and the reviewer do.
    ("`reconstructed`, `modern summary` and an organisation's name never go under a picture.",
     "`reconstructed`, `modern summary` and an organisation's name never go under a picture unless the lesson teaches them."),
])

# Finding 4: "not a card alone" fits names, things met on the way and a word
# worth its card (`parliament`) alike.
patch(ROOT / "references" / "preferences.md", [
    ("For these, the repair is in how the teaching is worded, not a vocabulary card.",
     "For these, the repair is in how the teaching is worded; a vocabulary card alone does not do it."),
])
patch(ROOT / "agents" / "design-reviewer.md", [
    ("For a name, or a thing the lesson meets on the way, the repair is in how the teaching is worded, not a card: it arrives with its context",
     "For a name, or a thing the lesson meets on the way, the repair is in how the teaching is worded, not a card alone: it arrives with its context"),
])

TESTS = ROOT / "scripts" / "tests"
patch(TESTS / "test_the_leisure_lesson_repairs.py", [
    ('        self.assertIn("Identify written sources honestly, in words the class already has", history)\n',
     '        self.assertIn("Identify sources honestly, in words the class already has", history)\n'),
])
patch(TESTS / "test_words_questions_and_do_beats.py", [
    ('        self.assertIn("carries no words about how it was made (`This is a reconstructed picture of a historical setting`), on the board or in the notes", history)\n',
     '        self.assertIn("has no caption about how it was made (`This is a reconstructed picture of a historical setting`), and the notes need not say it either", history)\n'),
])
patch(TESTS / "test_assumed_knowledge_ledger_is_kept.py", [
    ('        self.assertIn("For these, the repair is in how the teaching is worded, not a vocabulary card.", self.SLIDES)\n',
     '        self.assertIn("For these, the repair is in how the teaching is worded; a vocabulary card alone does not do it.", self.SLIDES)\n'),
])
# Finding 6: the added words only act inside a run, so the test puts them there.
patch(TESTS / "test_names_on_the_board_are_read_as_the_class_reads_them.py", [
    ('''        self.assertEqual(packet.board_names_in("Prove Oliver wrong. Someone said so. I'd like to know."), ["Oliver"])
''',
     '''        self.assertEqual(packet.board_names_in("Prove Oliver wrong. Someone said so. I'd like to know."), ["Oliver"])
        # Mid-sentence, where the old list printed `Someone I` and `I'm`.
        self.assertEqual(packet.board_names_in("Then Someone I know said so. Maybe I'm wrong, and so is Mia."), ["Mia"])
'''),
])

# The mapping's half ran separately, as r9b_mapping.py (a quoting slip here stopped it).
