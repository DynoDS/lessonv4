"""Success criteria (4.2.288), decision 12 in the wall's program: the overflow
message the wall designer is told to follow says a success-criteria step is
never shortened, and names the room-making moves."""
from pathlib import Path

P = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\working-wall-html\src\layout.js")
t = P.read_text(encoding="utf-8")
pairs = [
    ('      remedies.push("Splitting the items in order over a second card keeps every word and is a layout change (a wall takes two teaching cards); otherwise remove an item or shorten the longest");\n',
     '      remedies.push("Splitting the items in order over a second card keeps every word and is a layout change (a wall takes two teaching cards); otherwise remove an item or shorten the longest, never a success-criteria step, which is copied word for word");\n'),
    ('      remedies.push("an item over its own budget fits only reworded, which is the wall designer\'s decision, not a focused repair\'s");\n',
     '      remedies.push("an item over its own budget fits only reworded, which is the wall designer\'s decision, not a focused repair\'s; a success-criteria step is never reworded, so its card makes room instead (the picture off, or the list over two cards)");\n'),
]
for old, new in pairs:
    assert t.count(old) == 1, old[:80]
    t = t.replace(old, new)
P.write_text(t, encoding="utf-8")
print("wall messages ok")
