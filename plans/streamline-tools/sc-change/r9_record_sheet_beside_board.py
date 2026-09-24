"""Success criteria (4.2.288): the mapping and the log follow r8 (the review
page heads the worksheet with where the criteria a child uses were shown) and
the restored sheet-fit check in the components file (the first check's 1a)."""
from pathlib import Path

HERE = Path(__file__).resolve().parent
LOG = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\references\build-review-log.md")


def patch(path: Path, pairs) -> None:
    t = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (path.name, t.count(old), old[:100])
        t = t.replace(old, new)
    path.write_text(t, encoding="utf-8")
    print("patched", path.name)


patch(HERE / "build_sc_mapping.py", [
    ('    "SC-N08": "decision 8: a worksheet never carries SC, and the validator refuses any",\n',
     '    "SC-N08": "decision 8: a worksheet never carries SC, and the validator refuses any; the check that the board\'s criteria fit the sheet\'s own evidence and response stays (the change check\'s 1a), and the review page heads the sheet with where they were shown",\n'),
    ('    "SC-N08": [(LDC, "**A worksheet never carries SC.** The criteria stay on the board (`preferences.md` → Success Criteria), so `worksheet.successCriteriaRefs` is empty on every sheet; the validator refuses any.")],\n',
     '    "SC-N08": [(LDC, "**A worksheet never carries SC.** The criteria stay on the board (`preferences.md` → Success Criteria), so `worksheet.successCriteriaRefs` is empty on every sheet; the validator refuses any."),\n'
     '               (LDC, "Check the board\'s criteria against the worksheet\'s own evidence and response, not only the board task they were written for, because a child working the sheet looks up at them."),\n'
     '               ("scripts/design-review-packet.py", "return f\\"Worksheet (done beside the success criteria shown above at {shown})\\"")],\n'),
])

patch(LOG, [
    ("the check that the board's criteria fit the sheet's own task had gone (restored);",
     "the check that the board's criteria fit the sheet's own task had gone (restored, and the review page, which used to print a sheet's own criteria beside it, now heads the sheet with the beat where the criteria a child uses were shown);"),
])
