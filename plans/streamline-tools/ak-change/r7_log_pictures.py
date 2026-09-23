"""The log records the teacher's third-round ruling on pictures."""
from pathlib import Path
LOG = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\references\build-review-log.md")
t = LOG.read_text(encoding="utf-8")
old = "and `reconstruction`, `modern summary` and an organisation's name stay off the board unless taught.\n"
new = ("and `reconstruction`, `modern summary` and an organisation's name stay off the board unless taught. "
       "A picture is just shown: an artist's drawing of how something might have looked, or a photograph of a place today, carries no words about where it came from, on the board or in the notes (asked again when the caption rule and a Teach slide's script disagreed, he said: \"We're over complicating it. I don't think there should be any words. Just show the picture. The teacher can say it if they need to.\").\n")
assert t.count(old) == 1
t = t.replace(old, new)
old2 = "and \"spoken preparation\" and \"unless an earlier lesson the brief names\" were barred only at full length. All are now repaired, tested or pinned."
new2 = ("and \"spoken preparation\" and \"unless an earlier lesson the brief names\" were barred only at full length. All are now repaired, tested or pinned. "
        "It also found the caption rule giving a Teach slide two answers once \"or in the script\" had gone; that went to the teacher, whose answer is above.")
assert t.count(old2) == 1
LOG.write_text(t.replace(old2, new2), encoding="utf-8")
print("log ok")
