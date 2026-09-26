"""The design reviewer release (topic 8, release 2), run by the lead AFTER
bringing it into main on top of release 7A (4.2.293), once the merge's
conflicts are resolved and the log entry's heading carries its version.

The trial merge (`rv_14_merge_trial.py`, `rv_15_merge_trial_resolve.py`) found
four conflicts, all expected, and every test that reads these files passing
once they were resolved this way:

- `references/build-review-log.md`: both releases append one entry at the end.
  Keep 7A's entry, then this release's after it.
- `quick_checks_ledger_pins.json`, `success_criteria_ledger_pins.json` and
  `teach_then_do_ledger_pins.json`: both releases moved the same reviewer
  paragraph pins. Take 7A's side of each file; step 1 below then moves only this
  release's sentences inside them (and inside 7A's own SA-M08).

Then, in order:

1. `rv_06_repin_other_topics.py`: every earlier topic's pin that still holds one
   of this release's old sentences follows it (a pin git merged cleanly is left
   as it is, and checked).
2. `build_rv_mapping.py`: this topic's pins and mapping, rebuilt on the merged
   tree, where it finds 7A's words and maps its seven rows of the reviewer's
   list to them, and where the story pins take the log heading with its version.
   After this run the builder is frozen like every finished topic's.
3. `rv_10_record_after_merge.py`: the rows of the two topic 7 lists this release
   changed are recorded in their ledgers.

    python -X utf8 plans/streamline-tools/rv-change/rv_09_follow_at_merge.py"""
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
LOG = REPO / "plugins" / "lesson-v4" / "references" / "build-review-log.md"
print(f"following the merge in {REPO}")

HEADING = ("## 2026-09-26 - The design reviewer mends the words itself and names the bigger fixes for the lesson "
           "designer, judges the board before the notes, and opens the three sections its checks send it to")
log = LOG.read_text(encoding="utf-8")
assert log.count(HEADING) == 1, "the entry's heading should appear once"
assert HEADING + "\n" not in log, "number the entry's heading first (it ends with its version)"
assert "<<<<<<<" not in log and ">>>>>>>" not in log, "resolve the log's conflict first"

for script in ("rv_06_repin_other_topics.py", "build_rv_mapping.py", "rv_10_record_after_merge.py"):
    print(f"$ {script}")
    run = subprocess.run([sys.executable, "-X", "utf8", str(HERE / script)])
    assert run.returncode == 0, script
print("FOLLOW_OK")
