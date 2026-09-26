"""Release 7A (4.2.293): no em or en dash in any line this release wrote,
except an existing dash in a line only corrected elsewhere (the plan's rule:
"An existing dash in a line that is only being corrected elsewhere is left
alone; a sentence being rewritten loses it"). Every added line holding a dash
is printed with whether the same dash stood in the line it replaced; the pin
files and the ledgers are left out (they quote the old words).

    python -X utf8 a15_dash_check.py
"""
import re
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
DASH = re.compile("[–—]")
diff = subprocess.run(["git", "diff", "-U0", "b1c2d427", "--", "plugins/lesson-v4",
                       ":(exclude)*_ledger_pins.json"], cwd=REPO, capture_output=True, text=True,
                      encoding="utf-8").stdout
new_files = subprocess.run(["git", "ls-files", "--others", "--exclude-standard", "--", "plugins/lesson-v4"],
                           cwd=REPO, capture_output=True, text=True).stdout.split()
problems = []
file = None
removed = []
for line in diff.splitlines():
    if line.startswith("+++ "):
        file = line[6:]
        removed = []
    elif line.startswith("@@"):
        removed = []
    elif line.startswith("-") and not line.startswith("---"):
        removed.append(line[1:])
    elif line.startswith("+") and DASH.search(line):
        text = line[1:]
        # the dash's own left context, to find it in the line it replaced
        kept = all(any(text[max(0, m.start() - 25):m.start() + 1] in old for old in removed)
                   for m in DASH.finditer(text))
        problems.append((file, "kept from the old line" if kept else "NEW", text[:160]))
for path in new_files:
    if path.endswith((".py", ".js", ".md", ".json")) and "__pycache__" not in path and not path.endswith("_ledger_pins.json"):
        for n, line in enumerate((REPO / path).read_text(encoding="utf-8").splitlines(), 1):
            if DASH.search(line):
                problems.append((path, f"NEW (new file, line {n})", line[:160]))
for file, verdict, text in problems:
    print(f"{verdict}: {file}: {text}")
print(f"{sum(1 for p in problems if p[1].startswith('NEW'))} new dashes; "
      f"{sum(1 for p in problems if not p[1].startswith('NEW'))} kept from the lines they stood in")
