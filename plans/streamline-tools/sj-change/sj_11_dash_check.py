"""The subject-files release (topic 8, release 1): no em or en dash in anything
this release wrote. Every line the diff adds to a tracked file is checked (a
paragraph that already carried a dash and gained a sentence is named, so it can
be seen that the dash was there before), and every new file is checked whole.

    python -X utf8 plans/streamline-tools/sj-change/sj_11_dash_check.py
"""
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
DASHES = (chr(0x2014), chr(0x2013))
print(f"copy: {REPO}")

diff = subprocess.run(["git", "-C", str(REPO), "diff", "-U0", "2db3ceba", "--", "plugins", "plans"],
                      capture_output=True, text=True, encoding="utf-8").stdout
faults, carried = [], []
current = None
removed = {}
for line in diff.splitlines():
    if line.startswith("+++ "):
        current = line[6:]
        continue
    if line.startswith("-") and not line.startswith("---"):
        removed.setdefault(current, []).append(line[1:])
    if line.startswith("+") and not line.startswith("+++") and any(d in line for d in DASHES):
        # A dash the old line already had is the file's, not this release's.
        if any(line[1:].startswith(old[:60]) and sum(old.count(d) for d in DASHES) == sum(line.count(d) for d in DASHES)
               for old in removed.get(current, [])):
            carried.append(f"{current}: {line[1:90]}")
        else:
            faults.append(f"{current}: {line[1:120]}")

untracked = subprocess.run(["git", "-C", str(REPO), "ls-files", "--others", "--exclude-standard", "--", "plugins", "plans"],
                           capture_output=True, text=True, encoding="utf-8").stdout.split()
for rel in untracked:
    if "2026-09-23-subject-files-ledger.md" in rel or rel.endswith((".log", ".json")) and "sj-" in rel:
        continue  # the ledger is his record, copied unchanged; logs are tool output
    text = (REPO / rel).read_text(encoding="utf-8", errors="replace")
    if rel.endswith("_ledger_pins.json") or rel.endswith("-mapping.md"):
        continue  # checked below: they quote the files' own words, dashes included
    for n, line in enumerate(text.splitlines(), 1):
        if any(d in line for d in DASHES):
            faults.append(f"{rel}:{n}: {line[:120]}")

print("\n".join(f"carried (already there): {c}" for c in carried))
print("\n".join(faults) if faults else "no em or en dash in anything this release wrote")
raise SystemExit(1 if faults else 0)
