"""The subject-files release (topic 8, release 1): replay every change script
on a clean 2db3ceba (4.2.289) tree and compare the result with this copy, file
by file, so a checker can see the scripts are the whole change.

    python -X utf8 plans/streamline-tools/sj-change/sj_12_replay.py <empty scratch folder>

The clean tree is `git archive 2db3ceba` of this copy's `plugins` and `plans`
(no `node_modules`: nothing is linked or deleted). Two files the lead changed
on this branch before the release began (`ledger_mapping.py` and
`run-all-suites.sh`, so that they work from the copy they sit in) are copied
over first, and the ledger, which is not on the branch's history, is copied from
this copy's `plans/` folder. Then the scripts run in order in the scratch copy,
each finding its paths from its own place there."""
import shutil
import subprocess
import sys
import tarfile
from io import BytesIO
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[3]
TARGET = Path(sys.argv[1]).resolve()
print(f"source copy: {SOURCE}")
print(f"replay into: {TARGET}")
assert TARGET != SOURCE and SOURCE not in TARGET.parents, "the replay must not write into this copy"
assert not TARGET.exists() or not any(TARGET.iterdir()), "the scratch folder must be empty"
TARGET.mkdir(parents=True, exist_ok=True)

archive = subprocess.run(["git", "-C", str(SOURCE), "archive", "2db3ceba", "plugins", "plans"],
                         capture_output=True, check=True).stdout
with tarfile.open(fileobj=BytesIO(archive)) as tar:
    tar.extractall(TARGET, filter="data")

for rel in ("plans/streamline-tools/ledger_mapping.py", "plans/streamline-tools/run-all-suites.sh",
            "plans/2026-09-23-subject-files-ledger.md"):
    shutil.copy2(SOURCE / rel, TARGET / rel)
shutil.copytree(SOURCE / "plans/streamline-tools/sj-change", TARGET / "plans/streamline-tools/sj-change",
                ignore=shutil.ignore_patterns("__pycache__"))

ORDER = ["sj_01_stories", "sj_02_remove", "sj_03_subjects", "sj_04_reaches", "sj_05_tests",
         "sj_06_repin_other_topics", "sj_07_record_in_ledgers", "build_sj_mapping", "sj_08_log_entry"]
for name in ORDER:
    proc = subprocess.run([sys.executable, "-X", "utf8", str(TARGET / "plans/streamline-tools/sj-change" / f"{name}.py")],
                          capture_output=True, text=True, encoding="utf-8")
    print(f"{name}: {'ok' if proc.returncode == 0 else 'FAILED'}")
    if proc.returncode:
        print(proc.stdout[-2000:], proc.stderr[-2000:])
        raise SystemExit(1)


def lf(path: Path) -> bytes:
    return path.read_bytes().replace(b"\r\n", b"\n")


different, only_here, only_there = [], [], []
for top in ("plugins/lesson-v4", "plans"):
    here = {p.relative_to(SOURCE) for p in (SOURCE / top).rglob("*")
            if p.is_file() and "node_modules" not in p.parts and "__pycache__" not in p.parts}
    there = {p.relative_to(TARGET) for p in (TARGET / top).rglob("*")
             if p.is_file() and "__pycache__" not in p.parts}
    # Tool output, this release's own report, logs and check reports, and a
    # checker's scratch folder are not made by the scripts.
    skip = lambda rel: rel.parts[:2] == ("plans", "streamline-tools") and (
        rel.name.startswith("sj-") or rel.parts[2:3] == ("scratch",))
    only_here += sorted(str(r) for r in here - there if not skip(r))
    only_there += sorted(str(r) for r in there - here if not skip(r))
    different += sorted(str(r) for r in here & there if not skip(r) and lf(SOURCE / r) != lf(TARGET / r))

print("only in this copy:", only_here or "nothing")
print("only in the replay:", only_there or "nothing")
print("different:", different or "nothing")
raise SystemExit(0 if not (different or only_here or only_there) else 1)
