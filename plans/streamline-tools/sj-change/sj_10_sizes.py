"""The subject-files release (topic 8, release 1): bytes before and after, as git
stores them (LF), file by file and by group. "Before" is commit 2db3ceba
(4.2.289), read with `git show`; "after" is this copy's working tree with any
Windows line endings counted as git will store them.

    python -X utf8 plans/streamline-tools/sj-change/sj_10_sizes.py
"""
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
BASE = "2db3ceba"
P = "plugins/lesson-v4/"
print(f"copy: {REPO}")

GROUPS = {
    "Read in a lesson: the six subject files": [P + f"references/subject-{s}.md" for s in
                                                ("maths", "history", "geography", "science", "re", "pshe")],
    "Read in a lesson: the other instruction files": [P + f for f in (
        "agents/lesson-designer.md", "agents/adaptation-designer.md", "references/preferences.md", "references/reasoning-prompts.md",
        "references/adaptive-adaptation.md", "references/templates.md", "references/worksheet-helpers/science.md",
        "references/working-wall-card-contracts.md")],
    "Setup guide and read-me": [P + "references/computer-setup.md", P + "README.md"],
    "Removed (never read in a lesson)": [P + "skills/make-subject-file/SKILL.md", P + "references/authoring-subject-files.md"],
    "Tests and pins": [P + "scripts/tests/" + f for f in (
        "ledger_pin_checks.py", "test_diet_and_safety_content_boundaries.py", "test_plugin_root_contract.py",
        "test_run_never_publishes.py", "test_vocabulary_ledger_is_kept.py", "test_subject_files_ledger_is_kept.py",
        "subject_files_ledger_pins.json", "assumed_knowledge_ledger_pins.json", "success_criteria_ledger_pins.json",
        "teach_then_do_ledger_pins.json", "vocabulary_ledger_pins.json")],
    "The build log": [P + "references/build-review-log.md"],
}


def before(rel: str) -> int:
    proc = subprocess.run(["git", "-C", str(REPO), "show", f"{BASE}:{rel}"], capture_output=True)
    return len(proc.stdout) if proc.returncode == 0 else 0


def after(rel: str) -> int:
    path = REPO / rel
    return len(path.read_bytes().replace(b"\r\n", b"\n")) if path.exists() else 0


TEXT = {".md", ".py", ".js", ".json", ".txt", ".css", ".html", ".svg", ".sh", ".toml", ".yaml", ".yml", ".cjs", ".mjs"}


def package_before() -> int:
    listing = subprocess.run(["git", "-C", str(REPO), "ls-tree", "-r", "-l", BASE, P.rstrip("/")],
                             capture_output=True, text=True, check=True).stdout
    return sum(int(line.split()[3]) for line in listing.splitlines() if line.split()[1] == "blob")


def package_after() -> int:
    listing = subprocess.run(["git", "-C", str(REPO), "ls-files", "--cached", "--others", "--exclude-standard",
                              P.rstrip("/")], capture_output=True, text=True, check=True).stdout.splitlines()
    total = 0
    for rel in listing:
        path = REPO / rel
        if not path.is_file():
            continue
        data = path.read_bytes()
        total += len(data.replace(b"\r\n", b"\n") if path.suffix in TEXT else data)
    return total


pb, pa = package_before(), package_after()
print(f"The whole package (plugins/lesson-v4, as git stores it): {pb:,} -> {pa:,} ({pa - pb:+,})")

rows = []
for group, files in GROUPS.items():
    b = sum(before(f) for f in files)
    a = sum(after(f) for f in files)
    rows.append((group, b, a))
    print(f"\n{group}: {b:,} -> {a:,} ({a - b:+,})")
    for f in files:
        fb, fa = before(f), after(f)
        if fb != fa:
            print(f"  {f[len(P):]}: {fb:,} -> {fa:,} ({fa - fb:+,})")
