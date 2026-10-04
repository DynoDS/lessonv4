"""Run the playbook release's change scripts in replay order, stopping at the
first that fails. Each prints the plugin root it writes to first.

    python -X utf8 pb_run.py            # every script
    python -X utf8 pb_run.py c1 c3      # only the named ones, in replay order
"""
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ORDER = [
    "c1_stories_first.py",
    "c2_runtime.py",
    "c3_playbook.py",
    "c4_skill.py",
    "c5_references.py",
    "c6_template_editor.py",
    "c7_report_check.py",
    "c7b_repair_scope.py",
    "c7c_saving_again.py",
    "c8_tests.py",
    "c8b_repin_other_topics.py",
    "build_pb_mapping.py",
    "c9_log_entry.py",
    "c10_ledger_notes.py",
]

wanted = sys.argv[1:]
for script in ORDER:
    if wanted and not any(script.startswith(w) for w in wanted):
        continue
    if not (HERE / script).exists():
        print(f"(not written yet: {script})")
        continue
    result = subprocess.run([sys.executable, "-X", "utf8", str(HERE / script)], cwd=HERE)
    if result.returncode:
        print(f"RUN_FAILED at {script}")
        sys.exit(1)
print("RUN_OK")
