"""The design reviewer release: bytes before (4.2.292, `b1c2d427`) and after, as
git stores the files (line endings normalised to LF), by group. Prints a table."""
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
P = "plugins/lesson-v4/"
print(f"reading {REPO}")

GROUPS = {
    "Instruction files": ["agents/design-reviewer.md"],
    "Programs": ["scripts/design-review-packet.py"],
    "Tests, pins and the fixture": [
        "scripts/tests/design_reviewer_ledger_pins.json", "scripts/tests/test_design_reviewer_ledger_is_kept.py",
        "scripts/tests/test_design_review_packet.py", "scripts/tests/fixtures/design-reviewer-behaviour-cases.json",
        "scripts/tests/test_reviewer_voice_authority.py", "scripts/tests/test_a_maths_sheet_continues_the_lesson.py",
        "scripts/tests/assumed_knowledge_ledger_pins.json", "scripts/tests/quick_checks_ledger_pins.json",
        "scripts/tests/success_criteria_ledger_pins.json", "scripts/tests/teach_then_do_ledger_pins.json",
        "scripts/tests/worksheets_ledger_pins.json",
    ],
    "The build log": ["references/build-review-log.md"],
}


def before(rel):
    run = subprocess.run(["git", "show", f"b1c2d427:{P}{rel}"], cwd=REPO, capture_output=True)
    return len(run.stdout.replace(b"\r\n", b"\n")) if run.returncode == 0 else 0


def after(rel):
    path = REPO / P / rel
    return len(path.read_bytes().replace(b"\r\n", b"\n")) if path.exists() else 0


print("| Group | 4.2.292 | After | Change |")
print("|---|---|---|---|")
for group, files in GROUPS.items():
    b = sum(before(f) for f in files)
    a = sum(after(f) for f in files)
    print(f"| {group} ({len(files)}) | {b:,} | {a:,} | {a - b:+,} |")
print()
for files in GROUPS.values():
    for rel in files:
        print(f"- {rel}: {before(rel):,} -> {after(rel):,} ({after(rel) - before(rel):+,})")
