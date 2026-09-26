"""The voice guide release: a trial merge onto main as it now stands, the routes
release committed there (`8af6f8a9`, 4.2.295), done as the lead will do it.

    python -X utf8 vg_14_merge_trial.py [main-commit]

Clones the repository into `plans/streamline-tools/scratch/vg/merge/repo`
(sharing its objects; nothing in the main checkout or this branch is written),
commits this branch's files on top of `91687471` there, and merges that commit
into main's. Then it resolves as `vg_09_follow_at_merge.py` tells the lead: a
pin file or a ledger that conflicts takes main's side; the build log takes
main's side and gains this release's entry at its end, numbered 4.2.296. Then
it runs `vg_09_follow_at_merge.py` and the Python suite and the voice harness
on the merged tree. The node suites need the libraries, which the clone does
not have, and no engine changed, so they are not run here."""
import os
import shutil
import stat
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
MAIN = sys.argv[1] if len(sys.argv) > 1 else "8af6f8a9"
OUT = REPO / "plans" / "streamline-tools" / "scratch" / "vg" / "merge"
CLONE = OUT / "repo"
print(f"this branch: {REPO}")
print(f"main commit: {MAIN}")
print(f"trial clone: {CLONE}")
ID = ["-c", "user.name=trial", "-c", "user.email=trial@example.invalid"]


def git(*args, cwd=CLONE, check=True):
    return subprocess.run(["git", *ID, *args], cwd=cwd, capture_output=True, text=True, encoding="utf-8",
                          check=check)


def _writable(func, path, _exc):
    # git marks its object files read-only; clear that and try again.
    os.chmod(path, stat.S_IWRITE)
    func(path)


if OUT.exists():
    shutil.rmtree(OUT, onerror=_writable)
OUT.mkdir(parents=True)
subprocess.run(["git", "clone", "-q", "--shared", "--no-checkout", str(REPO), str(CLONE)], check=True)
git("checkout", "-q", "-b", "voice", "91687471")

names = set(git("diff", "--name-only", "91687471", "--", "plugins/lesson-v4", "plans", cwd=REPO).stdout.split())
names |= set(git("ls-files", "--others", "--exclude-standard", "plugins/lesson-v4", "plans", cwd=REPO).stdout.split())
names = sorted(n for n in names if "scratch/" not in n)
for rel in names:
    source, target = REPO / rel, CLONE / rel
    if source.exists():
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
    elif target.exists():
        target.unlink()
git("add", "-A", "--", "plugins/lesson-v4", "plans")
git("commit", "-q", "-m", "The voice guide release (trial)")
git("checkout", "-q", "-b", "trial", MAIN)
git("merge", "--no-edit", "voice", check=False)
conflicted = git("diff", "--name-only", "--diff-filter=U").stdout.split()
print("conflicts: " + (", ".join(conflicted) if conflicted else "none"))

LOG = "plugins/lesson-v4/references/build-review-log.md"
HEAD = "## 2026-09-26 - The voice guide sends every kind of writing"
for rel in conflicted:
    if rel == LOG:
        main_log = git("show", f"{MAIN}:{LOG}").stdout
        mine = (REPO / LOG).read_text(encoding="utf-8")
        entry = mine[mine.index(HEAD):]
        first = entry.split("\n", 1)[0]
        entry = entry.replace(first, first + " (4.2.296)", 1)
        (CLONE / LOG).write_text(main_log.rstrip("\n") + "\n\n" + entry, encoding="utf-8", newline="\n")
        print(f"resolved {rel}: main's side, then this release's entry, numbered 4.2.296")
    elif rel.endswith("_ledger_pins.json") or (rel.startswith("plans/") and rel.endswith(".md")):
        git("checkout", "--ours", "--", rel)
        print(f"resolved {rel}: main's side; the follow-at-merge steps put this release's words back")
    else:
        sys.exit(f"MERGE_TRIAL: an unexpected conflict in {rel}")
    git("add", "--", rel)
if conflicted:
    git("commit", "-q", "--no-edit")

run = subprocess.run([sys.executable, "-X", "utf8", str(CLONE / "plans" / "streamline-tools" / "vg-change" /
                                                        "vg_09_follow_at_merge.py")],
                     capture_output=True, text=True, encoding="utf-8")
print(run.stdout[-5000:])
if run.returncode != 0:
    print(run.stderr[-3000:])
    sys.exit("MERGE_TRIAL FAILED at the follow-at-merge steps")

plugin = CLONE / "plugins" / "lesson-v4"
failed = False
for label, args in (("python", ["scripts/tests"]), ("voice harness", ["evals/teacher-voice"])):
    res = subprocess.run([sys.executable, "-X", "utf8", "-m", "pytest", *args, "-q", "-p", "no:cacheprovider"],
                         cwd=plugin, capture_output=True, text=True, encoding="utf-8")
    lines = res.stdout.strip().splitlines()
    for line in [x for x in lines if x.startswith(("FAILED", "SUBFAILED", "ERROR"))][:30]:
        print(line[:220])
    print(f"{label}: {lines[-1] if lines else res.stderr[-500:]}")
    failed |= res.returncode != 0
print("MERGE_TRIAL", "TESTS FAILED" if failed else "OK")
