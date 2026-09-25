"""The subject-files release (topic 8, release 1), step 15, by the lead after the
merge check (`merge-291-check.md`): three corrections on the merged tree.

1. PF-N74 and N75 are pinned by topic 7's 7B, not 7A: the topic 7 plan gives the
   rest-of-preferences pin file to 7B. Corrected in the preferences ledger and in
   the log entry.
2. The log entry names the merge's pin move again (the rewrite dropped the only line
   that did) and gives the suite counts on the combined tree.
3. The worksheets ledger gains a closing note for WS-G09's move.

Each old text is asserted once; each file keeps its own line endings."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
print(f"repo: {REPO}")


def patch(rel: str, pairs: list[tuple[str, str]]) -> None:
    path = REPO / rel
    raw = path.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    t = raw.replace("\r\n", "\n")
    for old, new in pairs:
        assert t.count(old) == 1, (rel, old[:60], t.count(old))
        t = t.replace(old, new)
    if crlf:
        t = t.replace("\n", "\r\n")
    path.write_bytes(t.encode("utf-8"))
    print("patched", rel)


patch("plans/2026-09-23-preferences-rest-ledger.md", [(
    "no longer holds: topic 7's 7A pins them as gone, never as kept.",
    "no longer holds: topic 7's 7B, which pins this list, pins them as gone, never as kept.",
)])

patch("plugins/lesson-v4/references/build-review-log.md", [
    (
        "PF-N74 and N75 are gone, and topic 7's 7A pins them so, never as kept.",
        "PF-N74 and N75 are gone, and topic 7's 7B, which pins that list, pins them so, "
        "never as kept. At the merge, `sj-change/sj_09_follow_at_merge.py` moved the "
        "worksheets release's two pins on the maths file's Classroom Secrets paragraph "
        "(WS-G09 and its home) to the undated words, and on the combined tree every suite "
        "passes: Python 2,241 passed and 1 skipped, the voice harness 21, the builder 742, "
        "the sheet engine 766, the stick-in pack 70, the wall 142, shared 126 and the root "
        "tests 46.",
    ),
])

patch("plans/2026-09-23-worksheets-ledger.md", [(
    "  rechecked against the working tree afterwards and all are found word for word.\n",
    "  rechecked against the working tree afterwards and all are found word for word.\n"
    "\n"
    "### After the subject-files release (4.2.291, 25 September 2026)\n"
    "\n"
    "- **WS-G09** and its home paragraph: the subject-files list's settled item 10 took\n"
    "  the date \"(16 September 2026)\" off the maths file's Classroom Secrets paragraph,\n"
    "  every other word kept. At the merge, `sj-change/sj_09_follow_at_merge.py` moved\n"
    "  the pin and the home to the undated words; the rule is unchanged.\n",
)])
print("ok")
