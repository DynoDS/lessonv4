"""Assumed knowledge (4.2.287): the teacher's fourth-round words on pictures
(23 September 2026): "It could use a caption if it's helpful. Like maybe it's a
painting from Van Gogh and it says Starry Night by Van Gogh. That could be
helpful if he thinks. But it doesn't always have to be. This is a
reconstructed picture of a historical setting."

A caption that names the picture may help and is never required; words about
how a picture was made ("This is a reconstructed picture of a historical
setting") are the ones that stay off."""
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
    "**A picture is just shown.** An artist's drawing of how something might have looked, or a photograph of a place today, carries no words about where it came from, on the board or in the notes; the teacher can say it if they need to. A caption a picture does need (which of two pictures is which) takes height from the picture (`slide-composition-playbook.md` → Sets, banks, categories and captions), so it is printed once, at the picture's first appearance, and a Teach script's `Caption the picture ...` note is for that first appearance.",
    "**A picture is just shown.** An artist's drawing of how something might have looked, or a photograph of a place today, carries no words about how it was made (`This is a reconstructed picture of a historical setting`), on the board or in the notes; the teacher can say it if they need to. A caption that names the picture may help and is never required: a famous painting can carry its title and painter (`The Starry Night by Van Gogh`), and two pictures side by side can say which is which. A caption takes height from the picture (`slide-composition-playbook.md` → Sets, banks, categories and captions), so it is printed once, at the picture's first appearance, and a Teach script's `Caption the picture ...` note is for that first appearance.",
)])

patch(ROOT / "references" / "slide-composition-playbook.md", [(
    "and a picture an artist drew to show how something might have looked, or a photograph of a place today, has no caption saying so: the picture is just shown, and the teacher can say it if they need to. `reconstructed`, `modern summary` and an organisation's name never go under a picture.",
    "and a picture an artist drew to show how something might have looked, or a photograph of a place today, has no caption saying how it was made (`This is a reconstructed picture of a historical setting`): the picture is just shown, and the teacher can say it if they need to. `reconstructed`, `modern summary` and an organisation's name never go under a picture. A caption that names the picture may help and is never required (`The Starry Night by Van Gogh`).",
)])

patch(ROOT / "agents" / "design-reviewer.md", [(
    "and a picture is just shown, with no words about where it came from.",
    "and a picture is just shown, with no words about how it was made; a caption naming it (`The Starry Night by Van Gogh`) may help and is never required.",
)])

patch(ROOT / "scripts" / "tests" / "test_words_questions_and_do_beats.py", [(
    '''        self.assertIn("carries no words about where it came from, on the board or in the notes", history)
''',
    '''        self.assertIn("carries no words about how it was made (`This is a reconstructed picture of a historical setting`), on the board or in the notes", history)
        # His fourth-round words: a caption that names the picture may help.
        self.assertIn("A caption that names the picture may help and is never required", history)
''',
), (
    '''        self.assertIn("has no caption saying so: the picture is just shown", playbook)
''',
    '''        self.assertIn("has no caption saying how it was made", playbook)
        self.assertIn("A caption that names the picture may help and is never required (`The Starry Night by Van Gogh`).", playbook)
''',
)])

patch(REPO / "plans" / "2026-09-22-assumed-knowledge-ledger.md", [(
    "  source's date and maker) is untouched.\n",
    "  source's date and maker) is untouched.\n"
    "- 7, fourth round (the same evening): \"It could use a caption if it's helpful.\n"
    "  Like maybe it's a painting from Van Gogh and it says Starry Night by Van\n"
    "  Gogh. That could be helpful if he thinks. But it doesn't always have to be.\n"
    "  This is a reconstructed picture of a historical setting.\" Settled: a caption\n"
    "  that names the picture (a famous painting's title and painter) may help and\n"
    "  is never required; what stays off is words about how a picture was made\n"
    "  (\"This is a reconstructed picture of a historical setting\").\n",
)])

patch(ROOT / "references" / "build-review-log.md", [(
    "The teacher can say it if they need to.\").\n",
    "The teacher can say it if they need to.\"), and a caption that names the picture may help and is never required (\"maybe it's a painting from Van Gogh and it says Starry Night by Van Gogh. That could be helpful... But it doesn't always have to be.\").\n",
)])

M = Path(__file__).resolve().with_name("build_ak_mapping.py")
patch(M, [
    ("each stays off the board unless the lesson teaches it, and a picture is just shown, with no words about where it came from.\")],",
     "each stays off the board unless the lesson teaches it, and a picture is just shown, with no words about how it was made; a caption naming it (`The Starry Night by Van Gogh`) may help and is never required.\")],"),
    ("[(HIST, \"**A picture is just shown.** An artist's drawing of how something might have looked, or a photograph of a place today, carries no words about where it came from, on the board or in the notes; the teacher can say it if they need to. A caption a picture does need (which of two pictures is which) takes height from the picture (`slide-composition-playbook.md` → Sets, banks, categories and captions), so it is printed once, at the picture's first appearance, and a Teach script's `Caption the picture ...` note is for that first appearance.\"),",
     "[(HIST, \"**A picture is just shown.** An artist's drawing of how something might have looked, or a photograph of a place today, carries no words about how it was made (`This is a reconstructed picture of a historical setting`), on the board or in the notes; the teacher can say it if they need to. A caption that names the picture may help and is never required: a famous painting can carry its title and painter (`The Starry Night by Van Gogh`), and two pictures side by side can say which is which. A caption takes height from the picture (`slide-composition-playbook.md` → Sets, banks, categories and captions), so it is printed once, at the picture's first appearance, and a Teach script's `Caption the picture ...` note is for that first appearance.\"),"),
    ("has no caption saying so: the picture is just shown, and the teacher can say it if they need to. `reconstructed`, `modern summary` and an organisation's name never go under a picture. The limit",
     "has no caption saying how it was made (`This is a reconstructed picture of a historical setting`): the picture is just shown, and the teacher can say it if they need to. `reconstructed`, `modern summary` and an organisation's name never go under a picture. A caption that names the picture may help and is never required (`The Starry Night by Van Gogh`). The limit"),
])
