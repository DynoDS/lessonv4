"""The colours release (topic 7's 7C), step 19, by the lead after the merge check
(`merge-292-check.md`): two log sentences made true on the merged tree.

1. "Built on a side branch beside 7A and 7B." read as if 7A and 7B were built; they
   are still to come.
2. The rendered pages sit in `plans/streamline-tools/colours-renders/`, which git
   ignores (four large pictures kept on the teacher's computer, not in history), so
   the log says so.

Each old text is asserted once; the log keeps its line endings."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
p = REPO / "plugins" / "lesson-v4" / "references" / "build-review-log.md"
print(p)
raw = p.read_bytes().decode("utf-8")
crlf = "\r\n" in raw
t = raw.replace("\r\n", "\n")
pairs = [
    ("\"1. yes 2. leave it 3. yes\". Built on a side branch beside 7A and 7B.",
     "\"1. yes 2. leave it 3. yes\". Built on a side branch from 4.2.289 and brought in "
     "after the worksheets and subject-files releases; topic 7's 7A and 7B are still to come."),
    ("- **Not done.** Untried on a real run. The rendered pages he has not yet seen: "
     "`plans/streamline-tools/colours-renders/compare-slides.png`",
     "- **Not done.** Untried on a real run. The rendered pages he has not yet seen, kept on "
     "his computer and out of git (four large pictures): "
     "`plans/streamline-tools/colours-renders/compare-slides.png`"),
]
for old, new in pairs:
    assert t.count(old) == 1, old[:60]
    t = t.replace(old, new)
if crlf:
    t = t.replace("\n", "\r\n")
p.write_bytes(t.encode("utf-8"))
print("ok")
