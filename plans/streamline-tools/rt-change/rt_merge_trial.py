"""The routes release: a trial of the real merge, on scratch copies only.

Main is `91687471` (4.2.294): the design reviewer release, committed on 7A
(`59f85708`) with its own follow-up run. This builds in
`plans/streamline-tools/scratch/rt/merge/`:

1. `m1`: `git archive 91687471` of the plugin and `plans/`.
2. `m2`: this branch merged onto `m1` (`git merge-file`, base `59f85708`),
   resolved as `rt_follow_at_merge.py` says (the log and the ledgers keep both
   entries, the reviewer's first; a conflicting pin file or the reviewer's file
   takes main's side in each conflicting hunk), the heading numbered with a
   stand-in version, then `rt_follow_at_merge.py` run inside the copy, then the
   whole Python suite and the voice harness on it.

    python -X utf8 rt_merge_trial.py

It lists every file that merged cleanly and every conflict (for the reviewer's
file, each conflicting hunk), and writes `scratch/rt/merge/trial.txt`. Nothing
in either real tree is written."""
import io
import os
import shutil
import subprocess
import sys
import tarfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
OUT = REPO / "plans" / "streamline-tools" / "scratch" / "rt" / "merge"
M1, M2 = OUT / "m1", OUT / "m2"
SEVEN_A, MAIN = "59f85708", "91687471"
LOG = "plugins/lesson-v4/references/build-review-log.md"
REV = "plugins/lesson-v4/agents/design-reviewer.md"
report = []


def say(line):
    print(line)
    report.append(line)


def git(*args):
    return subprocess.run(["git", *args], cwd=REPO, capture_output=True)


def show(commit, rel):
    done = git("show", f"{commit}:{rel}")
    return done.stdout.replace(b"\r\n", b"\n") if done.returncode == 0 else None


def lf(path):
    return path.read_bytes().replace(b"\r\n", b"\n") if path.exists() else None


def merge3(mine, base, theirs):
    work = OUT / "work"
    work.mkdir(parents=True, exist_ok=True)
    for name, body in (("mine", mine), ("base", base), ("theirs", theirs)):
        (work / name).write_bytes(body)
    done = subprocess.run(["git", "merge-file", "-p", str(work / "mine"), str(work / "base"), str(work / "theirs")],
                          capture_output=True)
    return done.stdout, done.returncode


say(f"writing the trial trees into {OUT}")
if OUT.exists():
    shutil.rmtree(OUT)

# --- Step 1: main as the lead left it.
M1.mkdir(parents=True)
tarfile.open(fileobj=io.BytesIO(git("archive", MAIN, "plugins/lesson-v4", "plans").stdout)).extractall(M1)
say(f"step 1: main at {MAIN} (the reviewer release on 7A, its follow-up already run)")

# --- Step 2: this branch onto main.
shutil.copytree(M1, M2)
changed = git("diff", "--name-status", SEVEN_A, "--", "plugins/lesson-v4", "plans").stdout.decode().splitlines()
added = git("ls-files", "--others", "--exclude-standard", "plugins/lesson-v4", "plans").stdout.decode().split()
say(f"step 2: this branch's {len(changed)} changed and {len(added)} new files onto main")
for rel in added:
    target = M2 / rel
    assert not target.exists() or lf(target) == lf(REPO / rel), f"a new file both sides wrote: {rel}"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(lf(REPO / rel))
for line in changed:
    rel = line.split("\t")[-1]
    target = M2 / rel
    base, mine, theirs = show(SEVEN_A, rel), lf(REPO / rel), lf(target)
    if theirs is None or theirs == base:
        target.write_bytes(mine)
        continue
    merged, conflicts = merge3(mine, base, theirs)
    if conflicts == 0:
        target.write_bytes(merged)
        say(f"  merged cleanly: {rel}")
    elif rel == LOG or (rel.startswith("plans/") and rel.endswith("-ledger.md")):
        assert mine.startswith(base), f"this release only appends to {rel}"
        target.write_bytes(theirs.rstrip(b"\n") + b"\n" + mine[len(base):])
        say(f"  conflict, resolved (both entries, the reviewer's first): {rel}")
    elif rel.endswith("_ledger_pins.json") or rel == REV:
        # `git merge-file` exits with the number of conflicting hunks.
        say(f"  conflict in {conflicts} place(s), resolved (main's side, then the follow script): {rel}")
    else:
        raise SystemExit(f"an unplanned conflict: {rel}")
text = (M2 / LOG).read_text(encoding="utf-8")
rt_heading = ("## 2026-09-26 - The teacher's way of explaining is written once for every kind of lesson, a class sees "
              "a good explanation before it writes one in every route, four corners is gone, and the routes' "
              "out-of-date lines are put right")
assert text.count(rt_heading + "\n") == 1
(M2 / LOG).write_text(text.replace(rt_heading + "\n", rt_heading + " (4.2.295)\n"), encoding="utf-8", newline="\n")
done = subprocess.run([sys.executable, "-X", "utf8", str(M2 / "plans/streamline-tools/rt-change/rt_follow_at_merge.py")],
                      capture_output=True, text=True, encoding="utf-8")
lines = (done.stdout + done.stderr).strip().splitlines()
say(f"  rt_follow_at_merge.py: exit {done.returncode}")
report.extend("    " + line for line in lines if not line.startswith("writing") and "already follows" not in line)
print("\n".join("    " + line for line in lines[-14:]))
assert done.returncode == 0

# --- The suites that need no node libraries, on the merged tree.
for label, args in (("python", ["scripts/tests"]), ("voice harness", ["evals/teacher-voice"])):
    done = subprocess.run([sys.executable, "-X", "utf8", "-m", "pytest", *args, "-q", "-p", "no:cacheprovider"],
                          cwd=M2 / "plugins" / "lesson-v4", capture_output=True, text=True, encoding="utf-8",
                          env=dict(os.environ))
    tail = (done.stdout + done.stderr).strip().splitlines()
    failures = [line for line in tail if line.startswith(("FAILED", "ERROR", "SUBFAILED"))]
    say(f"{label} on the merged tree: {tail[-1] if tail else '(no output)'}")
    report.extend("    " + line for line in failures[:40])
(OUT / "trial.txt").write_text("\n".join(report) + "\n", encoding="utf-8")
print(f"wrote {OUT / 'trial.txt'}")
