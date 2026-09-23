"""Add the Quick Sketch substitution with plain quotation marks."""
from pathlib import Path

p = Path(__file__).with_name("build_qc_mapping.py")
t = p.read_text(encoding="utf-8")
old = 'Pupils draw what was just described. *"Sketch the water cycle as I described it. 90 seconds. Stick figures fine."*'
new = 'Pupils sketch from memory something taught earlier, with what the sketch must show named. *"Sketch the water cycle from memory: the sea, a cloud, the rain and the arrows between them. 90 seconds. Stick figures fine."*'
anchor = "]\n\nAUTO = {"
assert t.count(anchor) == 1
t = t.replace(anchor, f"    ({old!r}, {new!r}),\n" + anchor)
p.write_text(t, encoding="utf-8")
print("added")
