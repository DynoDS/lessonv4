"""The voice guide release: sizes before and after, line endings normalised.

    python -X utf8 vg_12_sizes.py

Compares this branch's files with a clean `git archive 91687471` (4.2.294),
read from the commit, never from the main checkout. Writes nothing."""
import io
import subprocess
import tarfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
PLUGIN = "plugins/lesson-v4/"
print(f"branch: {REPO}")

archive = subprocess.run(["git", "archive", "91687471", "plugins/lesson-v4"], cwd=REPO, capture_output=True,
                         check=True).stdout
before = {}
with tarfile.open(fileobj=io.BytesIO(archive)) as tar:
    for member in tar.getmembers():
        if member.isfile():
            before[member.name[len(PLUGIN):]] = tar.extractfile(member).read()


def size(data: bytes | None) -> int:
    return 0 if data is None else len(data.replace(b"\r\n", b"\n"))


def now(rel: str) -> bytes | None:
    path = REPO / PLUGIN / rel
    return path.read_bytes() if path.exists() else None


GROUPS = {
    "the voice guide (read for every piece of writing, §2 and §17 always)": ["references/teacher-voice.md"],
    "the lesson designer": ["agents/lesson-designer.md"],
    "preferences": ["references/preferences.md"],
    "the slide designer, its repair and the composition playbook": [
        "agents/slide-designer.md", "agents/slide-designer-focused-repair.md",
        "references/slide-composition-playbook.md"],
    "the routes, the activity list and the research file": [
        "references/teaching-sequence-dialogic.md", "references/teaching-sequence-task-centred.md",
        "references/do-beats.md", "references/evidence-synthesis.md"],
    "the adaptation designer and reference": ["agents/adaptation-designer.md", "references/adaptive-adaptation.md"],
    "the voice harness (read by no lesson)": ["evals/teacher-voice/README.md", "evals/teacher-voice/sweep-runner.md"],
    "the build log": ["references/build-review-log.md"],
}
tests = sorted({rel for rel in before if rel.startswith("scripts/tests/")} |
               {p.relative_to(REPO / PLUGIN).as_posix() for p in (REPO / PLUGIN / "scripts" / "tests").glob("*.*")})
changed_tests = [rel for rel in tests if size(before.get(rel)) != size(now(rel)) or before.get(rel) is None]
GROUPS["tests and pins"] = changed_tests

total_instr_before = total_instr_after = 0
for name, files in GROUPS.items():
    b = sum(size(before.get(f)) for f in files)
    a = sum(size(now(f)) for f in files)
    print(f"{name}: {b:,} -> {a:,} ({a - b:+,})")
    for f in files:
        fb, fa = size(before.get(f)), size(now(f))
        if fb != fa:
            print(f"    {f}: {fb:,} -> {fa:,} ({fa - fb:+,})")
    if name not in ("the voice harness (read by no lesson)", "the build log", "tests and pins"):
        total_instr_before += b
        total_instr_after += a
print(f"instruction files in all: {total_instr_before:,} -> {total_instr_after:,} "
      f"({total_instr_after - total_instr_before:+,})")
