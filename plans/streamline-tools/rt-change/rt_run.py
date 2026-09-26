"""Run the routes release's change scripts in replay order, stopping at the first
that fails. With `LESSONV4_PLUGIN_ROOT` (and `LESSONV4_MAPPING_OUT`,
`LESSONV4_PLANS_OUT`) set, they write to a scratch copy; each prints the root
it writes to first.

    python -X utf8 rt_run.py"""
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ORDER = [
    "rt_01_stories_first.py",
    "rt_02_routes.py",
    "rt_03_explaining.py",
    "rt_04_launch.py",
    "rt_05_code.py",
    "rt_05b_round1.py",
    "rt_06_tests.py",
    "rt_07_repin_other_topics.py",
    "build_rt_mapping.py",
    "rt_08_ledger_notes.py",
    "rt_09_log_entry.py",
]
for name in ORDER:
    if not (HERE / name).exists():
        print(f"(not written yet: {name})")
        continue
    print(f"== {name}", flush=True)
    done = subprocess.run([sys.executable, "-X", "utf8", str(HERE / name)])
    if done.returncode:
        raise SystemExit(f"{name} failed ({done.returncode})")
print("RUN_OK")
