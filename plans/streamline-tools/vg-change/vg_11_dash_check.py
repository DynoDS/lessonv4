"""The voice guide release: no em or en dash in anything it wrote.

Reads every line the release added to the plugin and to `plans/` (against
4.2.294, `91687471`) and every file it created, and lists each line holding an
em or en dash. A pin file quotes the files' own paragraphs, dashes and all, so
it is left out. An added line that is an old line with only this release's
words changed may keep a dash the old line already had (the agent-facing prose
around an example whose own dash went); such a line passes only when it holds
no more dashes than the line it replaced, and it is listed so it can be read.
The mapping quotes whole paragraphs, so its lines pass on the same terms when
every dash sits inside a «quote». Everything else must be empty."""
import re
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
DASHES = (chr(0x2014), chr(0x2013))
print(f"reading {REPO}")


def dashes(line: str) -> int:
    return sum(line.count(d) for d in DASHES)


diff = subprocess.run(["git", "diff", "-U0", "91687471", "--", "plugins/lesson-v4", "plans"],
                      cwd=REPO, capture_output=True, text=True, encoding="utf-8").stdout
added, removed = [], {}
current = None
for line in diff.splitlines():
    if line.startswith("+++ "):
        current = line[6:]
    elif line.startswith("--- "):
        continue
    elif line.startswith("+"):
        added.append((current, line[1:]))
    elif line.startswith("-"):
        removed.setdefault(current, []).append(line[1:])
untracked = subprocess.run(["git", "ls-files", "--others", "--exclude-standard", "plugins/lesson-v4", "plans"],
                           cwd=REPO, capture_output=True, text=True, encoding="utf-8").stdout.split()
for rel in untracked:
    if not rel.endswith((".py", ".md", ".json", ".js", ".txt")):
        continue
    for line in (REPO / rel).read_text(encoding="utf-8").splitlines():
        added.append((rel, line))

bad, kept = [], []
for rel, line in added:
    if not dashes(line) or (rel or "").endswith("_ledger_pins.json"):
        continue
    if rel.endswith("-mapping.md") and not dashes(re.sub(r"«.*?»", "", line)):
        kept.append((rel, "inside a quote"))
        continue
    olds = removed.get(rel, [])
    words = set(re.findall(r"\w+", line))
    best = max(olds, key=lambda o: len(words & set(re.findall(r"\w+", o))), default=None)
    if best is not None and dashes(line) <= dashes(best) and len(words & set(re.findall(r"\w+", best))) > 0.8 * len(words):
        kept.append((rel, f"kept {dashes(line)} of the old line's {dashes(best)}"))
        continue
    bad.append((rel, line.strip()[:160]))
for rel, why in kept:
    print("kept:", rel, why)
for rel, line in bad:
    print("DASH:", rel, line)
print(f"DASH_CHECK {'OK' if not bad else 'FAILED'} ({len(added)} added lines read, {len(bad)} with a new dash)")
