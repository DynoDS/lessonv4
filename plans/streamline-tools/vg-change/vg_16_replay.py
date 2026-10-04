"""The voice guide release: replay the change scripts, in order, on a clean 4.2.294
tree and compare the result with this branch's tree.

    python -X utf8 vg_16_replay.py

Takes `git archive 91687471` of `plugins/lesson-v4` and `plans` into
`plans/streamline-tools/scratch/vg/replay/`, copies this folder's scripts in
(each finds the tree from its own place), runs them in replay order, and lists
every file whose bytes differ from this branch's (the plugin without
`node_modules`, and the plans files the release writes). Nothing in this
branch's tree is written."""
import filecmp
import io
import shutil
import subprocess
import sys
import tarfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
OUT = REPO / "plans" / "streamline-tools" / "scratch" / "vg" / "replay"
print(f"branch: {REPO}")
print(f"replaying into {OUT}")
if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir(parents=True)
archive = subprocess.run(["git", "archive", "91687471", "plugins/lesson-v4", "plans"], cwd=REPO,
                         capture_output=True, check=True).stdout
with tarfile.open(fileobj=io.BytesIO(archive)) as tar:
    tar.extractall(OUT)
shutil.copytree(HERE, OUT / "plans" / "streamline-tools" / "vg-change",
                ignore=shutil.ignore_patterns("__pycache__"))

ORDER = ["vg_00_his_rhythm_answer.py", "vg_01_stories_first.py", "vg_02_guide.py", "vg_03_reaches.py", "vg_04_harness.py", "vg_05_tests.py",
         "vg_05b_repair_budget.py", "vg_06_repin_other_topics.py", "vg_07_record_in_ledgers.py",
         "vg_08_log_entry.py", "build_vg_mapping.py"]
for script in ORDER:
    run = subprocess.run([sys.executable, "-X", "utf8", str(OUT / "plans" / "streamline-tools" / "vg-change" / script)],
                         capture_output=True, text=True, encoding="utf-8")
    print(f"$ {script}: exit {run.returncode}")
    assert run.returncode == 0, run.stdout + run.stderr

different = []
mine = REPO / "plugins" / "lesson-v4"
theirs = OUT / "plugins" / "lesson-v4"
for path in sorted(mine.rglob("*")):
    rel = path.relative_to(mine)
    if path.is_dir() or "node_modules" in rel.parts or "__pycache__" in rel.parts or ".pytest_cache" in rel.parts:
        continue
    other = theirs / rel
    if not other.exists() or not filecmp.cmp(path, other, shallow=False):
        different.append(f"plugins/lesson-v4/{rel.as_posix()}")
for path in sorted(theirs.rglob("*")):
    rel = path.relative_to(theirs)
    if path.is_file() and not (mine / rel).exists():
        different.append(f"only in the replay: plugins/lesson-v4/{rel.as_posix()}")
for rel in ("2026-09-22-assumed-knowledge-ledger.md", "2026-09-22-quick-checks-ledger.md",
            "2026-09-23-starters-sticky-apply-ledger.md", "2026-09-23-success-criteria-ledger.md",
            "2026-09-22-teach-then-do-ledger.md", "2026-09-22-vocabulary-ledger.md",
            "2026-09-23-teacher-voice-ledger.md", "2026-09-23-worksheets-ledger.md",
            "2026-09-24-topic-7-change-plan.md", "2026-09-26-teacher-voice-mapping.md"):
    if not filecmp.cmp(REPO / "plans" / rel, OUT / "plans" / rel, shallow=False):
        different.append(f"plans/{rel}")
print("different from this branch: " + (", ".join(different) if different else "nothing"))
