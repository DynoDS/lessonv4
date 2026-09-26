"""The design reviewer release: a trial merge with release 7A, on a scratch copy.

7A (4.2.293) is committed on main as `59f85708` and is merged before this
release. This builds, in `plans/streamline-tools/scratch/rv/merge/`, the tree
that merge would make: this branch's plugin and `plans/`, with every file 7A
changed three-way merged against `b1c2d427` (`git merge-file`), and every file
7A added copied in, each read from the commit, never from a working tree (7A's
own checks once wrote undo attacks into the main checkout for a few seconds at
a time, and two earlier trials copied one mid-attack). It lists the files that
merge cleanly and the ones that conflict, and leaves the merged copy for
`rv_15_merge_trial_resolve.py`. Nothing in either real tree is written.

    python -X utf8 rv_14_merge_trial.py"""
import shutil
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
SEVEN_A = "59f85708"
OUT = REPO / "plans" / "streamline-tools" / "scratch" / "rv" / "merge"
TREE = OUT / "tree"
print(f"branch: {REPO}")
print(f"7A read from commit {SEVEN_A}")
print(f"writing the trial tree into {TREE}")
if TREE.exists():
    shutil.rmtree(TREE)
for old in OUT.glob("*.conflict"):
    old.unlink()
shutil.copytree(REPO / "plugins" / "lesson-v4", TREE / "plugins" / "lesson-v4",
                ignore=shutil.ignore_patterns("node_modules", "__pycache__", ".pytest_cache"))
shutil.copytree(REPO / "plans", TREE / "plans", ignore=shutil.ignore_patterns("scratch", "*.log"))


def git(*args):
    return subprocess.run(["git", *args], cwd=REPO, capture_output=True)


status = git("diff", "--name-status", "b1c2d427", SEVEN_A, "--", "plugins/lesson-v4", "plans").stdout.decode().split("\n")
changed = [line.split("\t")[1] for line in status if line.startswith("M\t")]
added = [line.split("\t")[1] for line in status if line.startswith("A\t")]
mine_changed = set(git("diff", "--name-only", "b1c2d427", "--", "plugins/lesson-v4", "plans").stdout.decode().split())
mine_added = set(git("ls-files", "--others", "--exclude-standard", "plugins/lesson-v4", "plans").stdout.decode().split())

clean, conflicted, taken = [], [], []
for rel in changed:
    theirs = git("show", f"{SEVEN_A}:{rel}").stdout.replace(b"\r\n", b"\n")
    base = git("show", f"b1c2d427:{rel}").stdout.replace(b"\r\n", b"\n")
    target = TREE / rel
    if rel not in mine_changed:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(theirs)
        taken.append(rel)
        continue
    work = OUT / "work"
    work.mkdir(parents=True, exist_ok=True)
    (work / "base").write_bytes(base)
    (work / "theirs").write_bytes(theirs)
    (work / "mine").write_bytes((REPO / rel).read_bytes().replace(b"\r\n", b"\n"))
    run = subprocess.run(["git", "merge-file", "-p", "--diff3", str(work / "mine"), str(work / "base"),
                          str(work / "theirs")], capture_output=True)
    if run.returncode == 0:
        target.write_bytes(run.stdout)
        clean.append(rel)
    else:
        (OUT / (rel.replace("/", "__") + ".conflict")).write_bytes(run.stdout)
        conflicted.append((rel, run.returncode))
for rel in added:
    if rel in mine_added:
        conflicted.append((rel, "added on both sides"))
        continue
    target = TREE / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(git("show", f"{SEVEN_A}:{rel}").stdout)

lines = [
    f"7A ({SEVEN_A}) changed {len(changed)} files and added {len(added)}.",
    f"Taken from 7A as they are (this release did not touch them): {len(taken)}.",
    "Merged cleanly with this release's changes: " + (", ".join(clean) or "none") + ".",
    "Conflicted: " + (", ".join(f"{r} ({n})" for r, n in conflicted) or "none") + ".",
]
(OUT / "merge-trial.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
