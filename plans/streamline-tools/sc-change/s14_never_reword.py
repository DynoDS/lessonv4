"""The wall's "never reword the steps" is pinned by a test and is the rule the
teacher's decision 12 rests on; the trim in s10 took it out, so it goes back."""
from pathlib import Path
ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4")
def patch(p, old, new):
    t = p.read_text(encoding="utf-8"); assert t.count(old) == 1, (p.name, old[:80]); p.write_text(t.replace(old, new), encoding="utf-8"); print("patched", p.name, len(t.encode("utf-8")))
old = "over two cards of the same type and title; if it still will not fit, omit the card."
new = "over two cards of the same type and title; if it still will not fit, omit the card, but never reword the steps."
patch(ROOT / "plugins/lesson-v4/agents/working-wall-designer.md", old, new)
patch(ROOT / "plans/streamline-tools/sc-change/build_sc_mapping.py", old, new)
