"""Assumed knowledge (4.2.287): the teacher's fifth-round answer on pictures
(23 September 2026): "I disagree. I don't think children need to know that
that particular picture isn't from the time. If it asks, what does this picture
tell us about Tudor farm work? ... Children don't need to know it isn't from
that time. Well, they do, but the board doesn't need to say it. And the teacher
can say it."

So there is no exception: the board never says how a picture was made, even
when the lesson asks what the picture tells us. His calibration slides follow:
`, reconstructed` comes off their captions, and a picture met again keeps no
second caption (his 14 September ruling on the same deck). His idea that the
caption could hold the question is recorded and put to him; not done here."""
import json
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


HIST_OLD = "and the notes need not say it either; the teacher can say it if they need to. A caption that names"
HIST_NEW = ("and the notes need not say it either; the teacher can say it if they need to. That holds when the lesson asks what the picture tells us (`What does this picture tell us about Tudor farm work?`): the class may need to know it was made later, and the teacher says so; the board does not. A caption that names")
patch(ROOT / "references" / "subject-history.md", [(HIST_OLD, HIST_NEW)])

PB_OLD = "`reconstructed`, `modern summary` and an organisation's name never go under a picture unless the lesson teaches them."
PB_NEW = "`reconstructed`, `modern summary` and an organisation's name never go under a picture, even when the lesson asks what the picture tells us; the teacher says it if the class needs to know."
patch(ROOT / "references" / "slide-composition-playbook.md", [(PB_OLD, PB_NEW)])

# His calibration slides.
EX = ROOT / "references" / "examples" / "tudor-teach-slides.lesson.json"
raw = EX.read_text(encoding="utf-8")
data = json.loads(raw)
slides = data["slides"]
assert slides[0]["pictures"][0]["caption"] == "Tudor England 1485 to 1603, reconstructed"
assert slides[1]["pictures"][0]["caption"] == "Tudor England 1485 to 1603, reconstructed"
assert slides[2]["pictures"][0]["caption"] == "A leather workshop, reconstructed"
assert slides[4]["pictures"][0]["caption"] == "A leather workshop, reconstructed"
# Edit the text in place so the file keeps its own layout.
raw = raw.replace('"caption": "Tudor England 1485 to 1603, reconstructed"', '"caption": "Tudor England 1485 to 1603"', 1)
raw = raw.replace('"caption": "A leather workshop, reconstructed"', '"caption": "A leather workshop"', 1)
for gone in ('"caption": "Tudor England 1485 to 1603, reconstructed"', '"caption": "A leather workshop, reconstructed"'):
    assert raw.count(gone) == 1, gone
    # The returning picture's second caption goes, with the comma before it.
    i = raw.index(gone)
    j = raw.rindex(",", 0, i)
    raw = raw[:j] + raw[i + len(gone):]
old_info = "Teacher information: The picture is a modern reconstruction, not a photograph of a real Tudor child; the caption says so."
new_info = "Teacher information: The picture is a modern reconstruction, not a photograph of a real Tudor child."
assert raw.count(old_info) == 1
raw = raw.replace(old_info, new_info)
check = json.loads(raw)
caps = [[p.get("caption") for p in s.get("pictures", [])] for s in check["slides"]]
print("captions now:", caps)
EX.write_text(raw, encoding="utf-8")

# A test holds the calibration to both rulings.
T = ROOT / "scripts" / "tests" / "test_words_questions_and_do_beats.py"
patch(T, [(
    '''        self.assertIn("which of two pictures is which", playbook)
''',
    '''        self.assertIn("which of two pictures is which", playbook)
        self.assertIn("even when the lesson asks what the picture tells us", playbook)

    def test_the_calibration_slides_show_the_pictures_as_the_teacher_ruled(self) -> None:
        # The Teach run the slide designer opens first and trusts over prose:
        # no caption says how a picture was made, and a picture met again is
        # not captioned again (the teacher's rulings of 14 and 23 September 2026).
        import json
        example = json.loads((ROOT / "references" / "examples" / "tudor-teach-slides.lesson.json").read_text(encoding="utf-8"))
        seen = set()
        for slide in example["slides"]:
            for picture in slide.get("pictures", []):
                caption = picture.get("caption") or ""
                self.assertNotIn("reconstruct", caption.lower())
                if picture["imagePath"] in seen:
                    self.assertEqual(caption, "", picture["imagePath"])
                seen.add(picture["imagePath"])
''',
)])

patch(REPO / "plans" / "2026-09-22-assumed-knowledge-ledger.md", [(
    "  (\"This is a reconstructed picture of a historical setting\").\n",
    "  (\"This is a reconstructed picture of a historical setting\").\n"
    "- 7, fifth round (asked whether the board should say a picture is a modern\n"
    "  drawing when the lesson asks what it tells us, and whether to take\n"
    "  \", reconstructed\" off his Tudor example slides): \"I disagree. I don't think\n"
    "  children need to know that that particular picture isn't from the time. If\n"
    "  it asks, what does this picture tell us about Tudor farm work? In fact, while\n"
    "  I was reading it, I was thinking, you know what could be in the actual\n"
    "  caption? The question, what does this picture tell us about Tudor farm work?\n"
    "  Which leaves space elsewhere. Children don't need to know it isn't from that\n"
    "  time. Well, they do, but the board doesn't need to say it. And the teacher\n"
    "  can say it.\" Settled: no exception; the board never says how a picture was\n"
    "  made, even when the lesson asks what it tells us, and the teacher says it.\n"
    "  His Tudor example slides lose \", reconstructed\" and the second caption on a\n"
    "  returning picture. His idea of the question in the caption changes how\n"
    "  questions look on a slide, so it was put to him rather than done.\n",
)])

M = HERE / "build_ak_mapping.py"
patch(M, [
    ("and the notes need not say it either; the teacher can say it if they need to. A caption that names",
     "and the notes need not say it either; the teacher can say it if they need to. That holds when the lesson asks what the picture tells us (`What does this picture tell us about Tudor farm work?`): the class may need to know it was made later, and the teacher says so; the board does not. A caption that names"),
    ("`reconstructed`, `modern summary` and an organisation's name never go under a picture unless the lesson teaches them. A caption that names",
     "`reconstructed`, `modern summary` and an organisation's name never go under a picture, even when the lesson asks what the picture tells us; the teacher says it if the class needs to know. A caption that names"),
    ("`reconstructed` and the rest never go under a picture unless the lesson teaches them;",
     "`reconstructed` and the rest never go under a picture, even when the lesson asks what it tells us (his fifth round);"),
])
