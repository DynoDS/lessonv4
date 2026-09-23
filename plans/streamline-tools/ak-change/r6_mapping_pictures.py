"""Assumed knowledge (4.2.287): the mapping follows the teacher's ruling that a
picture is just shown (r5)."""
from pathlib import Path

M = Path(__file__).resolve().with_name("build_ak_mapping.py")
t = M.read_text(encoding="utf-8")


def swap(old: str, new: str) -> None:
    global t
    assert t.count(old) == 1, old[:100]
    t = t.replace(old, new)


RULING = "the teacher's third-round ruling (\\\"Just show the picture. The teacher can say it if they need to.\\\")"

swap("and source words stay off the board unless taught\",",
     f"and source words stay off the board unless taught, while a picture is just shown with no words about where it came from ({RULING})\",")
swap("which a child reads as one more thing to ask about; each stays off the board unless the lesson teaches it, and the exact provenance goes in `teacherInfo`.\")],\n               [(REV, \"or in an earlier lesson the brief names\")]),",
     "which a child reads as one more thing to ask about; each stays off the board unless the lesson teaches it, and a picture is just shown, with no words about where it came from.\")],\n               [(REV, \"or in an earlier lesson the brief names\")]),")

swap('''    "AK-D05": ("decision 7: a historian's label stays off the board unless the lesson teaches it, and where a source came from is said only when it matters",
               [(HIST, "Identify sources honestly, in words the class already has: `This is what the Queen's order said, in simpler words`, `An artist drew this recently, to show what it might have looked like`. A label''',
     f'''    "AK-D05": ("decision 7: a written source is labelled honestly in children's words, a historian's label stays off the board unless the lesson teaches it, and where a source came from is said only when it matters; the picture example left with {RULING}",
               [(HIST, "Identify written sources honestly, in words the class already has: `This is what the Queen's order said, in simpler words`. A label''')
swap('''               []),
    "AK-D06": ("decision 7: a set of pictures an artist drew recently is introduced as that once, in the class's words, never named as reconstructions",
               [(HIST, "Say it once: a set of pictures an artist drew recently is introduced as that at the first one, in the class's words (`An artist drew these recently, to show what it might have looked like`), and not captioned again under every return, because each caption takes height from the picture (`slide-composition-playbook.md` → Sets, banks, categories and captions); a Teach script's `Caption the picture ...` note is for its first appearance. Put''',
     f'''               [(HIST, "`An artist drew this recently, to show what it might have looked like`", "local")]),
    "AK-D06": ("decision 7 with {RULING}: a picture an artist drew, or a photograph of a place today, carries no words about where it came from, on the board or in the notes; a caption a picture does need is printed once; never named as reconstructions",
               [(HIST, "**A picture is just shown.** An artist's drawing of how something might have looked, or a photograph of a place today, carries no words about where it came from, on the board or in the notes; the teacher can say it if they need to. A caption a picture does need (which of two pictures is which) takes height from the picture (`slide-composition-playbook.md` → Sets, banks, categories and captions), so it is printed once, at the picture's first appearance, and a Teach script's `Caption the picture ...` note is for that first appearance."),
                (HIST, "Put''')
swap('''               [(HIST, "named as reconstructions"), (HIST, "a set of reconstruction pictures")]),''',
     '''               [(HIST, "named as reconstructions"), (HIST, "a set of reconstruction pictures"), (HIST, "Say it once: a set of pictures", "local")]),''')
swap('''    "AK-D12": ("decision 7: the honest caption is in the class's words at the first appearance (`as it might have looked`), `reconstruction` and the rest stay off the board unless taught, and the limit on a caption a child needs is kept",
               [(PLAYBOOK, "and a caption that must be honest about what a picture is (drawn recently to show what it might have looked like, a photograph of the place today) is said once, in the class's words, at the picture's first appearance (`as it might have looked`, not `reconstructed`), not reprinted beneath each return; `reconstruction`, `modern summary` and an organisation's name stay off the board unless the lesson teaches them, and the exact provenance goes in the teacher's note. The limit''',
     f'''    "AK-D12": ("decision 7 with {RULING}: a picture an artist drew, or a photograph of a place today, has no caption saying so; `reconstructed` and the rest never go under a picture; the limit on a caption a child needs is kept",
               [(PLAYBOOK, "and a picture an artist drew to show how something might have looked, or a photograph of a place today, has no caption saying so: the picture is just shown, and the teacher can say it if they need to. `reconstructed`, `modern summary` and an organisation's name never go under a picture. The limit''')
swap('''               [(PLAYBOOK, "at the picture's first appearance or in the script")]),''',
     '''               [(PLAYBOOK, "at the picture's first appearance or in the script"), (PLAYBOOK, "a caption that must be honest about what a picture is", "local")]),''')
M.write_text(t, encoding="utf-8")
print("mapping follows the ruling")
