"""The design reviewer release: the trial merge with release 7A, resolved the way
the lead would resolve the real one, then this release's follow-up run on it.

Run after `rv_14_merge_trial.py`. On the trial tree only:

1. The build log: 7A's log, then this release's entry after it (both releases
   append one entry at the end, so git cannot place the second by itself).
2. Each pin file that conflicted (both releases moved the same reviewer
   paragraph pins): 7A's side, then this release's `rv_06_repin_other_topics.py`,
   which finds each pin by its old sentences and changes only this release's.
3. This release's `build_rv_mapping.py`, which on this tree finds 7A's words and
   maps its seven rows of the reviewer's list to them.

Then the whole Python suite runs on the trial tree
(`scratch/rv/merge/tests.txt`)."""
import os
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
SEVEN_A = "59f85708"
OUT = REPO / "plans" / "streamline-tools" / "scratch" / "rv" / "merge"
TREE = OUT / "tree"
PLUGIN = TREE / "plugins" / "lesson-v4"
print(f"resolving the trial tree {TREE}")
LOG = "plugins/lesson-v4/references/build-review-log.md"

base = subprocess.run(["git", "show", f"b1c2d427:{LOG}"], cwd=REPO, capture_output=True).stdout.decode("utf-8")
mine = (REPO / LOG).read_text(encoding="utf-8")
theirs = subprocess.run(["git", "show", f"{SEVEN_A}:{LOG}"], cwd=REPO, capture_output=True).stdout.decode("utf-8")
assert mine.startswith(base), "this release only appends to the log"
entry = mine[len(base):]
(TREE / LOG).write_text(theirs.rstrip("\n") + "\n" + entry, encoding="utf-8", newline="\n")
print("log: 7A's entry, then this release's")

conflicts = [p for p in OUT.glob("*.conflict")]
for conflict in conflicts:
    rel = conflict.name[: -len(".conflict")].replace("__", "/")
    if rel.endswith("_ledger_pins.json"):
        (TREE / rel).write_bytes(subprocess.run(["git", "show", f"{SEVEN_A}:{rel}"], cwd=REPO,
                                                capture_output=True).stdout)
        print(f"{rel}: 7A's side")
    else:
        assert rel == LOG, f"an unplanned conflict: {rel}"

# The lead numbers the entry at merge; a stand-in version here.
HEADING = ("## 2026-09-26 - The design reviewer mends the words itself and names the bigger fixes for the lesson "
           "designer, judges the board before the notes, and opens the three sections its checks send it to")
log = (TREE / LOG).read_text(encoding="utf-8")
assert log.count(HEADING + "\n") == 1
(TREE / LOG).write_text(log.replace(HEADING + "\n", HEADING + " (4.2.294)\n"), encoding="utf-8", newline="\n")

steps = []
for script in ("rv_09_follow_at_merge.py",):
    run = subprocess.run([sys.executable, "-X", "utf8", str(TREE / "plans" / "streamline-tools" / "rv-change" / script)],
                         capture_output=True, text=True, encoding="utf-8")
    steps.append(f"$ {script} (exit {run.returncode})\n{run.stdout}{run.stderr}")
    print(steps[-1])
    assert run.returncode == 0, script

# The whole Python suite, as the second check ran it on its merged tree.
tests = ["scripts/tests"]
run = subprocess.run([sys.executable, "-X", "utf8", "-m", "pytest", *tests, "-q", "-p", "no:cacheprovider"],
                     cwd=PLUGIN, capture_output=True, text=True, encoding="utf-8", env=dict(os.environ))
tail = (run.stdout + run.stderr).strip().splitlines()[-15:]
(OUT / "tests.txt").write_text("\n".join(steps) + "\n\n" + "\n".join(tests) + "\n\n" + "\n".join(tail) + "\n",
                               encoding="utf-8")
print("\n".join(tail))
