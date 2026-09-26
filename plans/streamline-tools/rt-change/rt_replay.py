"""The routes release: replay the change scripts on a clean 4.2.293 tree and
compare the result with this branch.

`git archive 59f85708` (the plugin and `plans/`) is extracted into
`scratch/rt/replay/tree`; this release's `rt-change/` folder and the shared
`ledger_mapping.py` (the one this release corrected) are copied into its
`plans/streamline-tools/`, and `rt_run.py` runs there, so every script finds the
scratch tree from its own place. Then every plugin file, the mapping and every
ledger is compared with this branch, byte for byte after line endings are made
the same. Nothing in the branch is written.

    python -X utf8 rt_replay.py"""
import io
import shutil
import subprocess
import sys
import tarfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
OUT = REPO / "plans" / "streamline-tools" / "scratch" / "rt" / "replay"
TREE = OUT / "tree"
print(f"writing the replay tree into {TREE}")
if OUT.exists():
    shutil.rmtree(OUT)
TREE.mkdir(parents=True)
archive = subprocess.run(["git", "archive", "59f85708", "plugins/lesson-v4", "plans"], cwd=REPO, capture_output=True,
                         check=True).stdout
tarfile.open(fileobj=io.BytesIO(archive)).extractall(TREE)
tools = TREE / "plans" / "streamline-tools"
shutil.copytree(HERE, tools / "rt-change", ignore=shutil.ignore_patterns("__pycache__"))
shutil.copyfile(HERE.parent / "ledger_mapping.py", tools / "ledger_mapping.py")
done = subprocess.run([sys.executable, "-X", "utf8", str(tools / "rt-change" / "rt_run.py")], capture_output=True,
                      text=True, encoding="utf-8")
(OUT / "run.txt").write_text(done.stdout + done.stderr, encoding="utf-8")
print((done.stdout + done.stderr).strip().splitlines()[-1])
assert done.returncode == 0, "the replay failed; see run.txt"


def body(path: Path) -> bytes:
    return path.read_bytes().replace(b"\r\n", b"\n")


different, one_side = [], []
mine_root, theirs_root = REPO / "plugins" / "lesson-v4", TREE / "plugins" / "lesson-v4"
skip = {"node_modules", "__pycache__", ".pytest_cache", "educational-svg"}
mine = {p.relative_to(mine_root) for p in mine_root.rglob("*") if p.is_file() and not skip & set(p.parts)}
theirs = {p.relative_to(theirs_root) for p in theirs_root.rglob("*") if p.is_file() and not skip & set(p.parts)}
one_side = sorted(str(p) for p in mine ^ theirs)
for rel in sorted(mine & theirs):
    if body(mine_root / rel) != body(theirs_root / rel):
        different.append(str(rel))
for ledger in sorted((REPO / "plans").glob("2026-*.md")):
    other = TREE / "plans" / ledger.name
    if not other.exists() or body(ledger) != body(other):
        different.append(f"plans/{ledger.name}")
print(f"compared {len(mine & theirs)} plugin files and the plans' ledgers and mappings")
print("different from this branch: " + (", ".join(different + one_side) if different or one_side else "nothing"))
