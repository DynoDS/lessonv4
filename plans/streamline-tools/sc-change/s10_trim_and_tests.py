"""Success criteria (4.2.288): the wall designer's role stays under its 51 KB
cap (the repair's own words are tightened), and the reading-order test names
the side of the rule that still applies now that criteria never go on a sheet."""
from pathlib import Path

ROOT = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4")


def patch(rel: str, pairs) -> None:
    path = ROOT / rel
    t = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (rel, t.count(old), old[:100])
        t = t.replace(old, new)
    path.write_text(t, encoding="utf-8")
    print("patched", rel, len(t.encode("utf-8")))


patch("agents/working-wall-designer.md", [
    ("SC steps are never shortened, split or reworded to meet the two-line limit or the character budget. If the full SC won't fit at the wall's fixed A3 size, make room: take the card's picture off (a step then has about 106 characters rather than 62), remove non-SC extras, or carry the list, in order, over two cards of the same type and title; if it still will not fit, omit the card, but never reword the steps.",
     "SC steps are never shortened, split or reworded to fit. If the full SC won't fit at the wall's fixed A3 size, make room: take the card's picture off (about 106 characters a step instead of 62), drop non-SC extras, or carry the list in order over two cards of the same type and title; if it still will not fit, omit the card."),
    ("A success-criteria step is the one item you never write short: it is copied word\n"
     "for word, and the card makes room for it instead (Rules That Never Change).",
     "A success-criteria step is never written short: it is copied, and the card makes\n"
     "room (Rules That Never Change)."),
    ("; the one exception is a success-criteria step, where taking the card's picture off is how the whole step fits.",
     "; a success-criteria step is the exception (Rules That Never Change)."),
])

patch("scripts/tests/test_reading_order_on_the_page.py", [
    ('                # Both sides of it, so neither drifts into a blanket rule.\n'
     '                self.assertIn("Success criteria", text)\n',
     '                # Both sides of it, so neither drifts into a blanket rule. (Success\n'
     '                # criteria were the first example of the "after" side until\n'
     '                # 4.2.288, when they left worksheets altogether.)\n'
     '                self.assertIn("reminder of a method they have already used", text)\n'),
])
