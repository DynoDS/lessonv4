"""The mapping half of r9_repair_check_fixes.py."""
from pathlib import Path

HERE = Path(__file__).resolve().parent


def patch(path, pairs):
    t = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (path.name, t.count(old), old[:100])
        t = t.replace(old, new)
    path.write_text(t, encoding="utf-8")
    print("patched", path.name)


M = HERE / "build_ak_mapping.py"
patch(M, [
    ("For a name, or a thing the lesson meets on the way, the repair is in how the teaching is worded, not a card: it arrives",
     "For a name, or a thing the lesson meets on the way, the repair is in how the teaching is worded, not a card alone: it arrives"),
    ("for a name or a thing met on the way the repair is in the wording, not a card;",
     "for a name or a thing met on the way the repair is in the wording, not a card alone;"),
    ("and for these the repair is the wording, not a card (an ordinary word the teaching leans on keeps the vocabulary rule's three repairs),",
     "and for these the repair is the wording, not a card alone (an ordinary word the teaching leans on keeps the vocabulary rule's three repairs),"),
    ("[(HIST, \"Identify written sources honestly, in words the class already has:",
     "[(HIST, \"Identify sources honestly, in words the class already has:"),
    ("\"decision 7: a written source is labelled honestly in children's words,",
     "\"decision 7: a source is labelled honestly in children's words,"),
    ("carries no words about how it was made (`This is a reconstructed picture of a historical setting`), on the board or in the notes; the teacher can say it if they need to. A caption that names",
     "has no caption about how it was made (`This is a reconstructed picture of a historical setting`), and the notes need not say it either; the teacher can say it if they need to. A caption that names"),
    ("carries no words about where it came from, on the board or in the notes; a caption a picture does need is printed once; never named as reconstructions\",",
     "has no caption about how it was made, and the notes need not say it; a caption that names the picture may help and is printed once; never named as reconstructions\","),
    ("`reconstructed`, `modern summary` and an organisation's name never go under a picture. A caption that names",
     "`reconstructed`, `modern summary` and an organisation's name never go under a picture unless the lesson teaches them. A caption that names"),
    ("has no caption saying so; `reconstructed` and the rest never go under a picture;",
     "has no caption saying how it was made; `reconstructed` and the rest never go under a picture unless the lesson teaches them;"),
    ("while a picture is just shown with no words about where it came from (",
     "while a picture is just shown with no words about how it was made ("),
    # Finding 6: the retired picture wordings are barred everywhere.
    ('[(HIST, "`An artist drew this recently, to show what it might have looked like`", "local")]),',
     '[(HIST, "`An artist drew this recently, to show what it might have looked like`")]),'),
    ('(HIST, "Say it once: a set of pictures", "local")]),',
     '(HIST, "Say it once: a set of pictures")]),'),
    ('(PLAYBOOK, "a caption that must be honest about what a picture is", "local")]),',
     '(PLAYBOOK, "a caption that must be honest about what a picture is")]),'),
])
