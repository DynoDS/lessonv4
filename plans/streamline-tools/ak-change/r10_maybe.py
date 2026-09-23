"""`Maybe I'm wrong` was listed as a name (`Maybe I'm`); the repair check saw it
and the new mid-sentence test caught it."""
from pathlib import Path
P = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\scripts\design-review-packet.py")
t = P.read_text(encoding="utf-8")
old = '    "Looking", "Exploring", "Meeting", "Helping", "Prove",\n}'
new = '    "Looking", "Exploring", "Meeting", "Helping", "Prove", "Maybe", "Perhaps",\n}'
assert t.count(old) == 1
P.write_text(t.replace(old, new), encoding="utf-8")
print("ok")
