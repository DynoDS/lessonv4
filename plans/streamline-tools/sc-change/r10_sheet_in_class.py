"""Success criteria (4.2.288): his answer to the first check's 2c (a sheet used
away from the board), recorded in the ledger and the log. No plugin rule is
added: worksheets are done in class, where the board is."""
from pathlib import Path

REPO = Path(r"C:\Users\Daniel\Projects\lessonv4")
LEDGER = REPO / "plans" / "2026-09-23-success-criteria-ledger.md"
LOG = REPO / "plugins" / "lesson-v4" / "references" / "build-review-log.md"


def patch(path: Path, pairs) -> None:
    t = path.read_text(encoding="utf-8")
    for old, new in pairs:
        assert t.count(old) == 1, (path.name, t.count(old), old[:100])
        t = t.replace(old, new)
    path.write_text(t, encoding="utf-8")
    print("patched", path.name)


patch(LEDGER, [
    ("14. As suggested. 16. As suggested.\n",
     "14. As suggested. 16. As suggested.\n"
     "\n"
     "### After the first change check (23 September 2026)\n"
     "\n"
     "The check asked what a sheet used away from the board (cover, homework) does\n"
     "now that it cannot carry the criteria; the suggestion was a line that such a\n"
     "sheet writes what a child needs into its questions. His answer:\n"
     "\n"
     "- \"no overcomplications. worksheets are not homework, worksheets are delivered\n"
     "  in class all the time\"\n"
     "\n"
     "Settled: no line is added. A worksheet is done in class, where the board and\n"
     "its criteria are. The places that still speak of a sheet used on its own\n"
     "(assumed knowledge's rows J03, J04 and J13 to J17) belong to the worksheets\n"
     "topic, whose decision 1 carries his words.\n"),
])

patch(LOG, [
    ("A worksheet used away from the board (a cover lesson, homework) can no longer carry the criteria, and whether it writes what a child needs into its questions is put to the teacher. ",
     "Asked whether a worksheet used away from the board should write what a child needs into its questions, the teacher answered that worksheets are not homework and are done in class, so no line was added; the places that still speak of a sheet used on its own are the worksheets topic's. "),
])
