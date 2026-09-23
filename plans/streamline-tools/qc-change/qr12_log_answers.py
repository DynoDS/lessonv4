"""Both log entries record the teacher's answers to their open questions."""
from pathlib import Path

log = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\references\build-review-log.md")
t = log.read_text(encoding="utf-8")


def swap(old: str, new: str) -> None:
    global t
    assert t.count(old) == 1, old[:90]
    t = t.replace(old, new)


swap("Three questions are his: whether the designer should be able to ask for the scene on a slide of its own when the first board would fit; whether a discovery lesson may discover more than two things (the code allows any number, each taught and used before the next); and whether the reviewer should keep reading the whole rhythm section every review now that it is about 32 KB rather than shorter.",
     "The three questions the change raised were put to the teacher and answered: the scene stays the opening of the first Teach, on its own slide only when the first board would be too full (\"sometimes it doesnt always have to be a full slide, sometimes just a note on slide is fine\"); a discovery lesson may discover any number of things, each taught and used before the next; and the reviewer keeps reading the whole rhythm section every review.")
swap("Three questions are the teacher's, because each changes wording he agreed: the map contrast still calls a label-reading check after a new map skill \"an honest recall beat\", which the new recall line says is not recall unless the map is off the board; the history contrast's \"where the simpler task is right\" paragraph now names no simpler task that is right; and five of the eight summary formats still name straight after the Teach as their best use, Quick Sketch opens on drawing \"what was just described\", and Diagram to Words keeps \"the check that a picture children copied actually means something to them\", each of which the new limits rule out.",
     "Three questions the change raised were put to the teacher and agreed: a label-reading check after a new map skill is on a map the lesson has not shown; the history contrast's simpler task that is right is the quick match of jobs the slide did not show to what each gave the family; and the summary formats' best-use lines, Quick Sketch's opening (now a sketch from memory of something taught earlier) and Diagram to Words' copied-picture clause (now in a later lesson) name the moment their limits allow.")
log.write_text(t, encoding="utf-8")
print("log ok")
