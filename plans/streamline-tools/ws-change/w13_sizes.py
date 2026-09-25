"""The worksheets release (4.2.290): bytes before (4.2.289) and after, per file
and per group, measured as git stores them (line endings as LF), so a file a
tool rewrote with other line endings is not counted as grown.

    python -X utf8 plans/streamline-tools/ws-change/w13_sizes.py
"""
import subprocess
from collections import defaultdict

from _patch import ROOT

REPO = ROOT.parents[1]


def git(*args):
    return subprocess.run(["git", *args], cwd=REPO, capture_output=True, check=True).stdout


tracked = git("diff", "--name-only", "2db3ceba", "--", "plugins/lesson-v4").decode().split()
new = git("ls-files", "--others", "--exclude-standard", "--", "plugins/lesson-v4").decode().split()
new = [p for p in new if "__pycache__" not in p and ".pytest_cache" not in p]


def group(rel):
    if rel.endswith("build-review-log.md"):
        return "the build log"
    if rel.endswith(("catalogue.md", "worksheet-compositions.md")):
        return "generated references"
    if "/scripts/tests/" in rel or "/test/" in rel:
        return "tests and pins"
    if rel.endswith(".md"):
        return "instruction files"
    if rel.endswith("plugin.json"):
        return "version"
    return "programs"


totals = defaultdict(lambda: [0, 0])
rows = []
for rel in tracked + new:
    before = 0 if rel in new else len(git("show", f"2db3ceba:{rel}").replace(b"\r\n", b"\n"))
    path = REPO / rel
    after = len(path.read_bytes().replace(b"\r\n", b"\n")) if path.exists() else 0
    g = group(rel)
    totals[g][0] += before
    totals[g][1] += after
    rows.append((g, rel, before, after))
for g, rel, before, after in sorted(rows):
    print(f"{g:22} {after - before:+7d}  {before:7d} -> {after:7d}  {rel.replace('plugins/lesson-v4/', '')}")
print()
for g, (before, after) in sorted(totals.items()):
    print(f"{g:22} {before:8d} -> {after:8d}  ({after - before:+d} bytes)")
