"""Success criteria (4.2.288), decision 8 reaching the colour marks: the marks
are coloured the same on the board and the wall; a worksheet no longer carries
criteria."""
from pathlib import Path
ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")
def patch(rel, pairs):
    p = ROOT / rel; t = p.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (rel, t.count(old), old[:90]); t = t.replace(old, new)
    p.write_text(t, encoding="utf-8"); print("patched", rel)
patch("references/preferences.md", [(
    "and the engine colours it the same way on the board, the worksheet and the working wall:",
    "and the engine colours it the same way on the board and the working wall:")])
patch("references/slide-success-criteria.md", [(
    "because the worksheet and the wall copy the same marks and a mark added or dropped on the board shows the child a different colour in each place.",
    "because the wall copies the same marks and a mark added or dropped on the board shows the child a different colour in each place.")])
