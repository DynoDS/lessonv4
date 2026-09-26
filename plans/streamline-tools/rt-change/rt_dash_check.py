"""The routes release: no em or en dash is added anywhere. Every added line in the
branch's diff against `59f85708` (the plugin and `plans/`) and every file this
release created is read; a line holding a dash is listed only when the dash is
new (a line edited in place may keep a dash that was already in words it did
not rewrite, and those are listed separately, with the line they came from).

    python -X utf8 rt_dash_check.py"""
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
DASHES = ("—", "–")

diff = subprocess.run(["git", "diff", "-U0", "59f85708", "--", "plugins/lesson-v4", "plans"], cwd=REPO,
                      capture_output=True, text=True, encoding="utf-8").stdout
new_dashes, kept = [], []
removed = []
current = None
for line in diff.splitlines():
    if line.startswith("+++ "):
        current = line[6:]
        removed = []
    elif line.startswith("-") and not line.startswith("---"):
        removed.append(line[1:])
    elif line.startswith("+") and any(d in line for d in DASHES):
        added = line[1:]
        count = sum(added.count(d) for d in DASHES)
        before = max((sum(r.count(d) for d in DASHES) for r in removed), default=0)
        (kept if count <= before else new_dashes).append(f"{current}: {added[:140]}")
# A file this release created quotes the plugin's own words (the mapping, the
# change scripts, the tests); a dash inside a quote the clean tree already held
# is not a new one. Each dash is looked up with a few characters either side.
archive_text = []
for rel in subprocess.run(["git", "ls-tree", "-r", "--name-only", "59f85708", "plugins/lesson-v4"], cwd=REPO,
                          capture_output=True, text=True).stdout.split():
    if rel.endswith((".md", ".py", ".js", ".json")):
        blob = subprocess.run(["git", "show", f"59f85708:{rel}"], cwd=REPO, capture_output=True).stdout
        archive_text.append(" ".join(blob.decode("utf-8", "replace").split()))
ARCHIVE = " | ".join(archive_text)


def quoted(line):
    flat = " ".join(line.split())
    for i, ch in enumerate(flat):
        if ch in DASHES and flat[max(0, i - 12):i + 13] not in ARCHIVE:
            return False
    return True


untracked = subprocess.run(["git", "ls-files", "--others", "--exclude-standard", "plugins/lesson-v4", "plans"], cwd=REPO,
                           capture_output=True, text=True).stdout.split()
for rel in untracked:
    if rel.endswith((".py", ".md", ".json", ".txt")):
        for n, line in enumerate((REPO / rel).read_text(encoding="utf-8").splitlines(), 1):
            if any(d in line for d in DASHES) and not quoted(line):
                new_dashes.append(f"{rel}:{n}: {line[:140]}")
print(f"added lines keeping a dash already there: {len(kept)}")
for item in kept:
    print("  " + item)
print(f"new dashes: {len(new_dashes)}")
for item in new_dashes:
    print("  " + item)
