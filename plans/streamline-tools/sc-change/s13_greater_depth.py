"""Success criteria (4.2.288), decision 8 reaching Greater Depth: a sharper
criterion is written into the task or its standard, never printed on the
sheet as a criteria panel, because a Greater Depth resource is a worksheet."""
from pathlib import Path
P = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\agents\adaptation-designer.md")
t = P.read_text(encoding="utf-8")
old = "- a less familiar application when the unfamiliarity genuinely increases the relevant thinking.\n"
new = old + ("\nA criterion in this section, sharper or kept as support, is written into the task or the standard it asks for, never printed on the sheet as a success-criteria panel: success criteria stay on the board and never go on a worksheet (`preferences.md` → Success Criteria).\n")
assert t.count(old) == 1
P.write_text(t.replace(old, new), encoding="utf-8")
print("greater depth ok")
