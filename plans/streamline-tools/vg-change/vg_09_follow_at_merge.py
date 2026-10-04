"""The voice guide release: what the lead runs once this branch is merged onto the
tree the routes release (topic 8, release 3) left.

    python -X utf8 plans/streamline-tools/vg-change/vg_09_follow_at_merge.py

Before running it: number this release's build-log heading; where a pin file
conflicted, take main's side (the routes release's) and let step 1 move this
release's words into it; where a ledger conflicted at its end (both releases
append a closing section), take main's side and let step 2 append this one's.

0. `vg_00_his_rhythm_answer.py`, only when the voice ledger lacks his answer of
   26 September (taking main's side of that ledger drops it).
1. `vg_06_repin_other_topics.py`: every pin anywhere, the routes release's own
   pin file included, that still holds this release's old words follows them.
2. `vg_07_record_in_ledgers.py`: this release's closing notes, where missing.
3. `build_vg_mapping.py`: this list's pins and mapping rebuilt on the merged
   tree, mapping the rows the routes release reworded (its `ROUTES`, checked
   against that release's committed words; any other it reworded fails the
   build as "changed but not mapped"), and the voice guide's sections as they
   now stand (the routes release adds a sentence under §5). Then the builder is
   frozen like every finished topic's.
4. `vg_10_record_after_merge.py`: the rest-of-preferences and routes lists'
   rows, recorded in those ledgers.

It first checks the tree is the merged one, and that the routes release copied
the content route's tooth-slide story into the log before taking it out, which
this release relied on rather than copying it a second time."""
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2] / "plugins" / "lesson-v4"
print(f"merged tree: {ROOT}")


def flat(text: str) -> str:
    return " ".join(text.split())


voice = flat((ROOT / "references" / "teacher-voice.md").read_text(encoding="utf-8"))
content = (ROOT / "references" / "teaching-sequence-content-based.md").read_text(encoding="utf-8")
log = flat((ROOT / "references" / "build-review-log.md").read_text(encoding="utf-8"))
assert "### How this teacher explains" in content, "the routes release is not on this tree"
assert "**Definitions and scripts are the other two**" in voice, "this release is not on this tree"
assert "A Year 4 science slide showed a tooth cross-section, labelled `Enamel`, headed `Inside a tooth`" in log, \
    "the log lacks the tooth slide the routes release was to copy"
if "headed `Inside a tooth`" in flat(content):
    print("note: the content route still tells the tooth slide; the routes release left it there")

# His answer of 26 September sits inside the voice ledger's "Decisions taken"
# (`vg_00`). Taking main's side of that ledger at a conflict drops it, so it is
# put back when no entry under its heading is there.
ledger = (HERE.parents[2] / "plans" / "2026-09-23-teacher-voice-ledger.md").read_text(encoding="utf-8")
steps = ["vg_06_repin_other_topics.py", "vg_07_record_in_ledgers.py", "build_vg_mapping.py",
         "vg_10_record_after_merge.py"]
if "His week 3 notes, and a phrase repeated for rhythm" not in ledger:
    steps.insert(0, "vg_00_his_rhythm_answer.py")
for script in steps:
    run = subprocess.run([sys.executable, "-X", "utf8", str(HERE / script)], capture_output=True, text=True,
                         encoding="utf-8")
    print(f"$ {script}: exit {run.returncode}")
    print(run.stdout.strip())
    assert run.returncode == 0, run.stderr
print("FOLLOW_AT_MERGE_OK")
