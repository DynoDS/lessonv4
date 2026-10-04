"""The design reviewer release: no em or en dash in anything it wrote.

Reads every line the release added to the plugin and to `plans/` (against
4.2.292, `b1c2d427`) and every file it created, and lists each line holding an
em or en dash. A pin file quotes the files' own paragraphs, dashes and all, so
it is left out; everything else must be empty."""
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
DASHES = (chr(0x2014), chr(0x2013))
QUOTES = ("plugins/lesson-v4/scripts/tests/design_reviewer_ledger_pins.json",)
print(f"reading {REPO}")

diff = subprocess.run(["git", "diff", "-U0", "b1c2d427", "--", "plugins/lesson-v4", "plans"],
                      cwd=REPO, capture_output=True, text=True, encoding="utf-8").stdout
added = []
current = None
for line in diff.splitlines():
    if line.startswith("+++ "):
        current = line[6:]
    elif line.startswith("+") and not line.startswith("+++"):
        added.append((current, line[1:]))
untracked = subprocess.run(["git", "ls-files", "--others", "--exclude-standard", "plugins/lesson-v4", "plans"],
                           cwd=REPO, capture_output=True, text=True, encoding="utf-8").stdout.split()
for rel in untracked:
    if rel in QUOTES or not rel.endswith((".py", ".md", ".json", ".js", ".txt")):
        continue
    for line in (REPO / rel).read_text(encoding="utf-8").splitlines():
        added.append((rel, line))

bad = [(rel, line.strip()[:160]) for rel, line in added
       if any(d in line for d in DASHES) and not (rel or "").endswith("_ledger_pins.json")]
for rel, line in bad:
    print("DASH:", rel, line)
print(f"DASH_CHECK {'OK' if not bad else 'FAILED'} ({len(added)} added lines read, {len(bad)} with a dash)")
