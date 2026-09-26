"""The routes release: sizes before and after, line endings normalised, for every
file the release touched, grouped as the earlier reports group them. Before is
the clean 4.2.293 copy in `scratch/rt/p293`; after is this branch.

    python -X utf8 rt_sizes.py"""
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
BEFORE = REPO / "plans" / "streamline-tools" / "scratch" / "rt" / "p293" / "plugins" / "lesson-v4"
AFTER = REPO / "plugins" / "lesson-v4"

changed = subprocess.run(["git", "diff", "--name-only", "59f85708", "--", "plugins/lesson-v4"], cwd=REPO,
                         capture_output=True, text=True).stdout.split()
added = subprocess.run(["git", "ls-files", "--others", "--exclude-standard", "plugins/lesson-v4"], cwd=REPO,
                       capture_output=True, text=True).stdout.split()


def size(path: Path) -> int:
    return len(path.read_bytes().replace(b"\r\n", b"\n")) if path.exists() else 0


groups = {"instructions": [], "programs": [], "tests and pins": [], "log": []}
for rel in sorted(set(changed) | set(added)):
    inner = rel[len("plugins/lesson-v4/"):]
    if inner.endswith("build-review-log.md"):
        group = "log"
    elif inner.startswith("scripts/tests/"):
        group = "tests and pins"
    elif inner.startswith("scripts/"):
        group = "programs"
    else:
        group = "instructions"
    groups[group].append((inner, size(BEFORE / inner), size(AFTER / inner)))

for group, rows in groups.items():
    before = sum(b for _r, b, _a in rows)
    after = sum(a for _r, _b, a in rows)
    print(f"{group}: {before:,} -> {after:,} ({after - before:+,}) in {len(rows)} files")
    for rel, b, a in rows:
        print(f"    {rel}: {b:,} -> {a:,} ({a - b:+,})")
content = BEFORE / "references" / "teaching-sequence-content-based.md"
print("what a non-content lesson that explains now reads (the two sections):")
for heading in ("How this teacher explains", "The launch"):
    done = subprocess.run(["python", "-X", "utf8", str(AFTER / "scripts" / "read-reference.py"), "--select",
                           f"teaching-sequence-content-based.md::{heading}"], capture_output=True, text=True,
                          encoding="utf-8")
    print(f"    {heading}: {done.stdout.strip().splitlines()[-1]}")
