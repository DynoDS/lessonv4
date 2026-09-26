"""Release 7A (4.2.293): bytes before (4.2.292, `git show b1c2d427:`) and after
(the working tree), with line endings normalised, for every plugin file the
release changed or added, grouped as the earlier releases grouped them.

    python -X utf8 a14_sizes.py
"""
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
PLUGIN = "plugins/lesson-v4/"


def git(*args):
    return subprocess.run(["git", *args], cwd=REPO, capture_output=True, check=True).stdout


changed = git("diff", "--name-only", "b1c2d427", "--", PLUGIN).decode().split()
added = [p for p in git("ls-files", "--others", "--exclude-standard", "--", PLUGIN).decode().split()
         if "__pycache__" not in p]


def before(path):
    try:
        return len(git("show", f"b1c2d427:{path}").replace(b"\r\n", b"\n"))
    except subprocess.CalledProcessError:
        return 0


def after(path):
    file = REPO / path
    return len(file.read_bytes().replace(b"\r\n", b"\n")) if file.exists() else 0


def group(path):
    rel = path[len(PLUGIN):]
    if rel == "references/build-review-log.md":
        return "the build log"
    if "/tests/" in rel or "/test/" in rel or rel.endswith("_pins.json"):
        return "tests and pins"
    if rel.endswith(".md"):
        return "instruction files"
    if rel.endswith("plugin.json"):
        return "plugin.json"
    return "programs"


totals = {}
rows = []
for path in sorted(set(changed) | set(added)):
    b, a = before(path), after(path)
    g = group(path)
    t = totals.setdefault(g, [0, 0, 0])
    t[0] += b
    t[1] += a
    t[2] += 1
    rows.append((g, path[len(PLUGIN):], b, a))
for g, rel, b, a in sorted(rows):
    print(f"{g:18} {rel:75} {b:>9} {a:>9} {a - b:>+8}")
print()
for g, (b, a, n) in totals.items():
    print(f"{g}: {n} files, {b:,} -> {a:,} ({a - b:+,} bytes)")
